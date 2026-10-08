import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  LeadTelemetry,
  observedUsage,
  readTelemetry,
  rollupTelemetry,
  runDirectory,
} from '../src/pies-telemetry/core.js';

const session = { id: 'session-1', file: '/private/session.jsonl' };

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'pies-telemetry-'));
  let now = 100;
  const telemetry = await LeadTelemetry.bind({ runId: 'run-1', role: 'lead', artifactRoot: root, session, now: () => now });
  return { root, telemetry, tick: (value: number) => (now = value) };
}

test('bind validates lead, run IDs, session identity, and keeps telemetry under the run directory', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pies-telemetry-'));
  await assert.rejects(() => LeadTelemetry.bind({ runId: '../escape', role: 'lead', artifactRoot: root, session }), /safe/);
  await assert.rejects(() => LeadTelemetry.bind({ runId: 'ok', role: 'lead', artifactRoot: root, session: { id: 'x' } }), /session ID and file/);
  assert.equal(runDirectory(root, 'ok'), join(root, 'ok'));
  await rm(root, { recursive: true });
});

test('append-only events contain safe metadata, finalized assistant usage, and Pi-reported cost only', async () => {
  const { root, telemetry } = await fixture();
  const usage = observedUsage({ input: 3, output: 4, totalTokens: 7, cost: { total: 0.12 }, prompt: 'secret' });
  assert.deepEqual(usage, { input: 3, output: 4, total_tokens: 7, pi_reported_cost: 0.12 });
  await telemetry.append({ v: 1, type: 'assistant_start', at: 105 });
  await telemetry.append({ v: 1, type: 'assistant_end', at: 110, usage: usage! });
  await telemetry.append({ v: 1, type: 'tool_start', at: 120, tool_call_id: 'call-1', tool_name: 'bash', nested: true });
  await telemetry.append({ v: 1, type: 'tool_end', at: 130, tool_call_id: 'call-1', tool_name: 'bash', nested: true, error: false });
  const text = await readFile(telemetry.file, 'utf8');
  assert.ok(!text.includes('secret'));
  assert.ok(!text.includes('prompt'));
  assert.ok(!text.includes('args'));
  assert.ok(!text.includes('result'));
  await rm(root, { recursive: true });
});

test('rollup unions tool intervals, sums observed usage, and leaves missing values unavailable', () => {
  const events = [
    { v: 1, type: 'bound', at: 0, run_id: 'run', role: 'lead' },
    { v: 1, type: 'agent_start', at: 10 },
    { v: 1, type: 'agent_start', at: 15 },
    { v: 1, type: 'agent_settled', at: 20 },
    { v: 1, type: 'agent_settled', at: 30 },
    { v: 1, type: 'tool_start', at: 11, tool_call_id: 'outer', tool_name: 'a', nested: false },
    { v: 1, type: 'tool_start', at: 12, tool_call_id: 'inner', tool_name: 'b', nested: true },
    { v: 1, type: 'tool_end', at: 18, tool_call_id: 'inner', tool_name: 'b', nested: true, error: false },
    { v: 1, type: 'tool_end', at: 25, tool_call_id: 'outer', tool_name: 'a', nested: false, error: false },
    { v: 1, type: 'assistant_start', at: 21 },
    { v: 1, type: 'assistant_end', at: 26, usage: { input: 2, pi_reported_cost: 0.1 } },
    { v: 1, type: 'assistant_start', at: 26 },
    { v: 1, type: 'assistant_end', at: 27, usage: { input: 3 } },
    { v: 1, type: 'finalized', at: 40 },
  ] as const;
  assert.deepEqual(rollupTelemetry([...events]), {
    lead_only: true,
    wall_ms: 40,
    active_ms: 40,
    tool_ms: 14,
    assistant_ms: 6,
    assistant_messages: 2,
    observed_usage: { input: 5, pi_reported_cost: 0.1 },
  });
  assert.deepEqual(rollupTelemetry([{ v: 1, type: 'bound', at: 1, run_id: 'x', role: 'lead' }, { v: 1, type: 'finalized', at: 2 }]), {
    lead_only: true, wall_ms: 1, active_ms: 1, tool_ms: 0, assistant_ms: null, assistant_messages: 0, observed_usage: {},
  });
});

test('active time starts at bind and ends at finalize, regardless of agent lifecycle, less explicit UI waits', () => {
  // Pi emitted agent_start before bind; finalize occurs before agent_settled, so neither is recorded.
  const events = [
    { v: 1, type: 'bound', at: 100, run_id: 'run', role: 'lead' },
    { v: 1, type: 'ui_prompt_start', at: 110 },
    { v: 1, type: 'ui_prompt_start', at: 120 },
    { v: 1, type: 'ui_prompt_end', at: 140 },
    { v: 1, type: 'ui_prompt_end', at: 150 },
    { v: 1, type: 'ui_prompt_start', at: 160 },
    { v: 1, type: 'ui_prompt_end', at: 165 },
    // An unclosed wait is not inferred through finalization.
    { v: 1, type: 'ui_prompt_start', at: 170 },
    { v: 1, type: 'finalized', at: 200 },
  ] as const;
  assert.equal(rollupTelemetry([...events]).active_ms, 55);
});

test('unpaired assistant and tool spans stay unavailable and finalize stops later writes', async () => {
  const { root, telemetry, tick } = await fixture();
  await telemetry.append({ v: 1, type: 'assistant_start', at: 105 });
  await telemetry.append({ v: 1, type: 'agent_start', at: 110 });
  await telemetry.append({ v: 1, type: 'tool_start', at: 120, tool_call_id: 'x', tool_name: 'read', nested: false });
  tick(150);
  const rollup = await telemetry.finalize(session);
  assert.equal(rollup.active_ms, 50);
  assert.equal(rollup.tool_ms, null);
  assert.equal(rollup.assistant_ms, null);
  await telemetry.append({ v: 1, type: 'agent_settled', at: 160 });
  assert.equal((await readTelemetry(telemetry.file)).filter((event) => event.type === 'agent_settled').length, 0);
  await assert.rejects(() => telemetry.finalize({ ...session, id: 'other' }), /bound Pi session/);
  await rm(root, { recursive: true });
});
