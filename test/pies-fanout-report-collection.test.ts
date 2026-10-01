import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPORT_SLICE_CHARS,
  buildSynthesisMessage,
  collectTerminalReports,
  type AgentListEntry,
  type FanoutRun,
} from '../src/pies-fanout/core.js';

function runWithWorkers(): FanoutRun {
  return {
    id: 'fanout-run',
    protocol: 'pies',
    authority: 'operator',
    intervalMs: 300_000,
    workers: [
      { task: 'Fix crash', name: 'fanout-run-1', paneId: 'w1:p1', tabId: 'w1:t1', cwd: '/repo' },
      { task: 'Add test', name: 'fanout-run-2', paneId: 'w1:p2', tabId: 'w1:t1', cwd: '/repo' },
    ],
  };
}

const agents: AgentListEntry[] = [
  { pane_id: 'w1:p1', agent_status: 'done' },
  { pane_id: 'w1:p2', agent_status: 'working' },
];

test('collects one report per terminal worker and keeps active workers pending', async () => {
  const run = runWithWorkers();
  const collected = await collectTerminalReports(
    [run],
    agents,
    (worker) => `report of ${worker.name}`,
  );

  assert.equal(collected.length, 1);
  assert.equal(collected[0].worker, 'fanout-run-1');
  assert.equal(collected[0].state, 'done');
  assert.equal(collected[0].report, 'report of fanout-run-1');
  assert.equal(run.workers[0].status, 'done');
  assert.equal(run.workers[1].status, 'working');
  assert.equal(run.workers[1].reportSent, undefined);
});

test('marking is durable across polls: no worker is collected twice', async () => {
  const run = runWithWorkers();
  const laterAgents: AgentListEntry[] = [
    { pane_id: 'w1:p1', agent_status: 'done' },
    { pane_id: 'w1:p2', agent_status: 'idle' },
  ];
  const first = await collectTerminalReports([run], agents, () => 'first');
  const second = await collectTerminalReports([run], laterAgents, () => 'second');

  assert.equal(first.length, 1);
  assert.deepEqual(
    second.map((item) => item.worker),
    ['fanout-run-2'],
  );
});

test('missing panes and empty reads degrade to gone state and an explicit placeholder', async () => {
  const run = runWithWorkers();
  const gone = await collectTerminalReports([run], [], () => '');
  assert.equal(gone.length, 2);
  assert.ok(gone.every((item) => item.state === 'gone'));
  assert.ok(gone.every((item) => item.report === '(No readable worker report.)'));
});

test('synthesis message batches reports into one supervisor dispatch', () => {
  const message = buildSynthesisMessage([
    {
      runId: 'fanout-run',
      worker: 'fanout-run-1',
      task: 'Fix crash',
      state: 'done',
      report: 'changed src/a.ts',
    },
    {
      runId: 'fanout-run',
      worker: 'fanout-run-2',
      task: 'Add test',
      state: 'blocked',
      report: 'needs input',
    },
  ]);
  assert.equal(message.customType, 'pies-fanout-report-batch');
  assert.ok(message.content.includes('fanout-run-1'));
  assert.ok(message.content.includes('fanout-run-2'));
  assert.ok(message.content.includes('Act as the fanout supervisor'));
  assert.ok(message.content.includes('Do not launch, merge, or modify anything'));
  assert.equal(message.details.collected.length, 2);
});

test('oversized reports are tail-sliced to the reporting cap', () => {
  const message = buildSynthesisMessage([
    {
      runId: 'fanout-run',
      worker: 'fanout-run-1',
      task: 'Fix crash',
      state: 'done',
      report: 'x'.repeat(REPORT_SLICE_CHARS * 3),
    },
  ]);
  const body = message.content.slice(
    message.content.indexOf('x'),
    message.content.indexOf('x') + REPORT_SLICE_CHARS + 10,
  );
  assert.ok(body.length <= REPORT_SLICE_CHARS + 10);
  assert.ok(message.content.includes('x'.repeat(REPORT_SLICE_CHARS)));
});
