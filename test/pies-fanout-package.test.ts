import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('pi manifest exports the fanout extension and prompt resources that exist', async () => {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.deepEqual(pkg.pi?.extensions, ['./extensions']);
  assert.deepEqual(pkg.pi?.prompts, ['./prompts']);
  assert.ok(pkg.keywords?.includes('pi-package'));
  for (const dir of pkg.pi.extensions.concat(pkg.pi.prompts)) {
    await assert.doesNotReject(stat(join(root, dir)));
  }
  await readFile(join(root, 'extensions/pies-fanout.ts'), 'utf8');
  await readFile(join(root, 'extensions/pies-telemetry.ts'), 'utf8');
  await readFile(join(root, 'prompts/pies-fanout.md'), 'utf8');
  await readFile(join(root, 'prompts/pies-create-plan.md'), 'utf8');
  await readFile(join(root, 'prompts/pies-run-plan.md'), 'utf8');
});

test('extension registers only pies-prefixed tools and commands', async () => {
  const { default: piesFanout } = await import(join(root, 'extensions/pies-fanout.ts'));
  const tools: Array<{ name: string; parameters: unknown }> = [];
  const commands: Array<{ name: string }> = [];
  let shutdownHandler: unknown;
  piesFanout({
    registerTool: (tool: { name: string; parameters: unknown }) => void tools.push(tool),
    registerCommand: (name: string) => void commands.push({ name }),
    on: (event: string, handler: unknown) => {
      if (event === 'session_shutdown') shutdownHandler = handler;
    },
  } as never);

  assert.deepEqual(tools.map((tool) => tool.name).sort(), [
    'pies_fanout_available_models',
    'pies_fanout_launch',
  ]);
  assert.ok(tools.find((tool) => tool.name === 'pies_fanout_launch')!.parameters);
  assert.deepEqual(commands.map((command) => command.name).sort(), [
    'pies-fanout-status',
    'pies-fanout-stop',
  ]);
  assert.ok(typeof shutdownHandler === 'function');
});

test('telemetry extension exposes only explicit bind and finalize tools', async () => {
  const { default: piesTelemetry } = await import(join(root, 'extensions/pies-telemetry.ts'));
  const tools: Array<{ name: string }> = [];
  const events: string[] = [];
  piesTelemetry({
    registerTool: (tool: { name: string }) => void tools.push(tool),
    on: (event: string) => void events.push(event),
  } as never);
  assert.deepEqual(tools.map((tool) => tool.name).sort(), ['pies_telemetry_bind', 'pies_telemetry_finalize']);
  assert.deepEqual(events.sort(), ['agent_settled', 'agent_start', 'message_end', 'message_start', 'tool_execution_end', 'tool_execution_start', 'ui_prompt_end', 'ui_prompt_start']);
});

test('telemetry control tool bind/end and finalize/start ordering does not poison ordinary tool timing', async () => {
  const { default: piesTelemetry } = await import(join(root, 'extensions/pies-telemetry.ts'));
  const tools = new Map<string, { execute: (...args: any[]) => Promise<{ details: { tool_ms: number | null } }> }>();
  const handlers = new Map<string, (...args: any[]) => Promise<void>>();
  const runId = `telemetry-control-order-${process.pid}-${Date.now()}`;
  const artifactDir = join(homedir(), '.pies', 'runs', 'pies-skills', runId);
  const ctx = {
    cwd: root,
    sessionManager: { getSessionId: () => 'telemetry-order-session', getSessionFile: () => '/private/telemetry-order.jsonl' },
  };
  piesTelemetry({
    registerTool: (tool: { name: string; execute: (...args: any[]) => Promise<{ details: { tool_ms: number | null } }> }) => tools.set(tool.name, tool),
    on: (event: string, handler: (...args: any[]) => Promise<void>) => handlers.set(event, handler),
  } as never);

  try {
    // Pi emits bind start before binding and bind end after it.
    await handlers.get('tool_execution_start')!({ toolCallId: 'bind', toolName: 'pies_telemetry_bind' }, ctx);
    await tools.get('pies_telemetry_bind')!.execute('bind', { run_id: runId, role: 'lead' }, undefined, undefined, ctx);
    await handlers.get('tool_execution_end')!({ toolCallId: 'bind', toolName: 'pies_telemetry_bind', isError: false }, ctx);
    await handlers.get('tool_execution_start')!({ toolCallId: 'ordinary', toolName: 'bash' }, ctx);
    await handlers.get('tool_execution_end')!({ toolCallId: 'ordinary', toolName: 'bash', isError: false }, ctx);
    // Finalize starts before it writes finalized; its end arrives afterward.
    await handlers.get('tool_execution_start')!({ toolCallId: 'finalize', toolName: 'pies_telemetry_finalize' }, ctx);
    const finalized = await tools.get('pies_telemetry_finalize')!.execute('finalize', {}, undefined, undefined, ctx);
    await handlers.get('tool_execution_end')!({ toolCallId: 'finalize', toolName: 'pies_telemetry_finalize', isError: false }, ctx);

    assert.equal(typeof finalized.details.tool_ms, 'number');
    const telemetry = await readFile(join(artifactDir, 'telemetry.jsonl'), 'utf8');
    assert.ok(telemetry.includes('"tool_name":"bash"'));
    assert.ok(!telemetry.includes('pies_telemetry_bind'));
    assert.ok(!telemetry.includes('pies_telemetry_finalize'));
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('legacy global fanout names are absent from the packaged resources', async () => {
  const extension = await readFile(join(root, 'extensions/pies-fanout.ts'), 'utf8');
  const prompt = await readFile(join(root, 'prompts/pies-fanout.md'), 'utf8');
  for (const text of [extension, prompt]) {
    assert.ok(!text.includes('"fanout_launch"'));
    assert.ok(!text.includes('"fanout_available_models"'));
    assert.ok(!text.includes('"fanout-status"'));
    assert.ok(!text.includes('"fanout-stop"'));
  }
  assert.ok(prompt.includes('pies_fanout_launch'));
  assert.ok(prompt.includes('ask_user'));
  assert.ok(prompt.includes('Herdr'));
});

test('prompt frontmatter declares the /pies-fanout command surface', async () => {
  const prompt = await readFile(join(root, 'prompts/pies-fanout.md'), 'utf8');
  const frontmatter = prompt.split('---')[1] ?? '';
  assert.ok(frontmatter.includes('description:'));
  assert.ok(frontmatter.includes('argument-hint:'));
});
