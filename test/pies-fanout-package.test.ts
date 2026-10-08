import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
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
