/**
 * PIES fanout backend: visible Herdr fanout with PIES, direct, or custom work.
 *
 * Prerequisites (preflighted with actionable failures):
 * - Herdr CLI on PATH (or $HERDR_BIN), ≥ 0.9.1.
 * - An interactive session with the ask_user tool available: /pies-fanout is a
 *   guided wizard and cannot run headless. The wizard stops with instructions
 *   if ask_user is unavailable.
 *
 * Task-kind routing policy stays canonical in the pies-skills repository; this
 * extension launches work, it does not route it.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import { StringEnum } from '@earendil-works/pi-ai';
import {
  batchTasks,
  buildAgentArgs,
  buildSynthesisMessage,
  collectTerminalReports,
  normalizeLaunchInput,
  planTabLayout,
  slug,
  workerPrompt,
  BOOT_TIMEOUT_MS,
  type AgentListEntry,
  type FanoutRun,
  type LaunchOptions,
} from '../src/pies-fanout/core.js';

const exec = promisify(execFile);

let timer: ReturnType<typeof setInterval> | undefined;
const runs: FanoutRun[] = [];

interface JsonRecord {
  [key: string]: unknown;
}
interface HerdrPane {
  pane_id?: string;
  paneId?: string;
  tab_id?: string;
  tabId?: string;
}
interface ModelInfo {
  provider: string;
  id: string;
  name?: string;
}
interface FanoutCtx {
  cwd: string;
  model?: { provider: string; id: string };
  thinkingLevel?: string;
  modelRegistry: { getAvailable(): unknown[] };
  ui: {
    notify(message: string, kind?: 'info' | 'warning'): unknown;
    confirm(title: string, message?: string): Promise<boolean>;
    setWidget(id: string, lines?: string[]): unknown;
  };
}

const HERDR_FAILURE = (detail: string) =>
  `PIES fanout prerequisite failed: Herdr CLI unavailable (${detail}). Install herdr ≥ 0.9.1, ensure it is on PATH, or point HERDR_BIN at the binary, then retry /pies-fanout.`;

async function herdrPreflight(): Promise<void> {
  const bin = process.env.HERDR_BIN || 'herdr';
  try {
    await exec(bin, ['--version'], { timeout: 15_000 });
  } catch (error) {
    throw new Error(HERDR_FAILURE(error instanceof Error ? error.message : String(error)), {
      cause: error,
    });
  }
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

async function shell(bin: string, args: string[], cwd?: string): Promise<unknown> {
  const { stdout } = await exec(bin, args, { cwd, timeout: 120_000, maxBuffer: 2_000_000 });
  const lines = stdout.trim().split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      return JSON.parse(line) as unknown;
    } catch {
      /* Herdr can emit non-JSON prelude lines. */
    }
  }
  return {};
}
const herdr = (args: string[]) => shell(process.env.HERDR_BIN || 'herdr', args);
async function herdrText(args: string[]) {
  const { stdout } = await exec(process.env.HERDR_BIN || 'herdr', args, {
    timeout: 120_000,
    maxBuffer: 2_000_000,
  });
  return stdout.trim();
}
async function gitText(cwd: string, args: string[]) {
  const { stdout } = await exec('git', args, { cwd, timeout: 120_000, maxBuffer: 2_000_000 });
  return stdout.trim();
}
async function git(cwd: string, args: string[]) {
  await exec('git', args, { cwd, timeout: 120_000, maxBuffer: 2_000_000 });
}

function listFrom(result: unknown, key: string): unknown[] {
  const record = asRecord(result);
  const envelope = asRecord(record.result ?? record.data);
  const source = record[key] ?? envelope[key];
  return Array.isArray(source) ? source : [];
}
function idFrom(result: unknown, ...keys: string[]): string | undefined {
  const record = asRecord(result);
  const envelope = asRecord(record.result ?? record.data);
  const source = asRecord(
    asRecord(
      envelope.tab ??
        record.tab ??
        envelope.pane ??
        record.pane ??
        envelope.agent ??
        record.agent ??
        envelope,
    ),
  );
  for (const key of keys) if (typeof source[key] === 'string') return source[key] as string;
  return undefined;
}
const paneId = (result: unknown) => idFrom(result, 'pane_id', 'paneId', 'id');
const tabId = (result: unknown) => idFrom(result, 'tab_id', 'tabId', 'id');

async function repoInfo(cwd: string) {
  const root = await gitText(cwd, ['rev-parse', '--show-toplevel']);
  const common = await gitText(root, ['rev-parse', '--git-common-dir']);
  const commonAbs = common.startsWith('/') ? common : join(root, common);
  return { root, project: basename(dirname(commonAbs)) };
}

async function waitForIdle(pane: string) {
  await herdr(['agent', 'wait', pane, '--until', 'idle', '--timeout', String(BOOT_TIMEOUT_MS)]);
  await new Promise((resolve) => setTimeout(resolve, 750));
}

async function splitAndStart(
  targetPane: string,
  direction: 'right' | 'down',
  cwd: string,
  name: string,
  args: string[],
) {
  // A new tab starts with a raw shell pane, not an agent pane. Target that raw
  // pane directly; `agent focus` rejects it before the first worker can start.
  const split = await herdr([
    'pane',
    'split',
    targetPane,
    '--direction',
    direction,
    '--cwd',
    cwd,
    '--focus',
  ]);
  const pane = paneId(split);
  if (!pane) throw new Error('herdr pane split returned no pane id');
  await herdr(['agent', 'start', name, '--kind', 'pi', '--pane', pane, '--', ...args]);
  await waitForIdle(pane);
  return pane;
}

async function createDirectWorktree(
  repo: { root: string; project: string },
  runId: string,
  task: string,
) {
  const name = `${runId}-${slug(task)}`;
  const path = join(homedir(), '.worktrees', repo.project, name);
  await mkdir(dirname(path), { recursive: true });
  await git(repo.root, ['worktree', 'add', '-b', `fanout/${name}`, path, 'HEAD']);
  return path;
}

async function updateMonitor(pi: ExtensionAPI, ctx: FanoutCtx, announce = false) {
  const agents = listFrom(await herdr(['agent', 'list']), 'agents') as AgentListEntry[];
  const collected = await collectTerminalReports(runs, agents, async (worker) => {
    try {
      return await herdrText([
        'agent',
        'read',
        worker.paneId,
        '--source',
        'recent-unwrapped',
        '--lines',
        '240',
        '--format',
        'text',
      ]);
    } catch {
      /* Report the state even when pane output is unavailable. */
      return '';
    }
  });
  const lines = runs
    .flatMap((run) => run.workers)
    .map((worker) => `${worker.name}: ${worker.status ?? '?'}`);
  if (announce) {
    for (const item of collected) {
      ctx.ui.notify(
        `${item.worker}: ${item.state}`,
        item.state === 'blocked' || item.state === 'gone' ? 'warning' : 'info',
      );
    }
  }
  ctx.ui.setWidget('pies-fanout', lines.length ? ['fanout: ' + lines.join(' · ')] : undefined);
  if (collected.length) {
    pi.sendMessage(buildSynthesisMessage(collected), { triggerTurn: true, deliverAs: 'followUp' });
  }
}

function startMonitor(pi: ExtensionAPI, ctx: FanoutCtx, intervalMs: number) {
  if (timer) clearInterval(timer);
  timer = setInterval(() => void updateMonitor(pi, ctx, true), intervalMs);
  timer.unref?.();
  void updateMonitor(pi, ctx, false);
}

async function launch(pi: ExtensionAPI, ctx: FanoutCtx, options: LaunchOptions) {
  const repo = await repoInfo(ctx.cwd);
  const runId = `fanout-${Date.now().toString(36)}`;
  const agentArgs = buildAgentArgs(options.model, options.thinking);
  const run: FanoutRun = {
    id: runId,
    protocol: options.protocol,
    authority: options.authority,
    intervalMs: options.monitorIntervalMinutes * 60_000,
    workers: [],
  };
  const pending: Array<{ pane: string; prompt: string }> = [];
  const batches = batchTasks(options.tasks);

  for (let index = 0; index < batches.length; index++) {
    const batch = batches[index];
    const label = `${runId} ${index + 1}/${batches.length}`;
    const tab = await herdr(['tab', 'create', '--cwd', repo.root, '--label', label, '--focus']);
    const tabID = tabId(tab);
    if (!tabID) throw new Error('herdr tab create returned no tab id');
    const workspace = tabID.split(':')[0];
    const panes = listFrom(
      await herdr(['pane', 'list', '--workspace', workspace]),
      'panes',
    ) as HerdrPane[];
    const shellPane = panes.find((pane) => (pane.tab_id ?? pane.tabId) === tabID)?.pane_id;
    if (!shellPane) throw new Error("could not find the new tab's initial shell pane");

    const layout = planTabLayout(batch);
    const topPanes: string[] = [];
    for (let i = 0; i < layout.top.length; i++) {
      const task = layout.top[i];
      const taskCwd =
        options.protocol === 'direct' ? await createDirectWorktree(repo, runId, task) : repo.root;
      const name = `${runId}-${index * 6 + i + 1}`;
      const pane = await splitAndStart(
        i === 0 ? shellPane : topPanes[i - 1],
        'right',
        taskCwd,
        name,
        agentArgs,
      );
      topPanes.push(pane);
      run.workers.push({ task, name, paneId: pane, tabId: tabID, cwd: taskCwd });
      pending.push({
        pane,
        prompt: workerPrompt({
          task: options.protocol === 'custom' ? `${options.customPrefix} ${task}`.trim() : task,
          protocol: options.protocol,
          authority: options.authority,
          extra: options.instructions,
          repo: taskCwd,
        }),
      });
    }
    // The empty tab's original shell is only a bootstrap pane; remove it after agent one exists.
    await herdr(['pane', 'close', shellPane]);
    for (let i = 0; i < layout.bottom.length; i++) {
      const task = layout.bottom[i];
      const taskCwd =
        options.protocol === 'direct' ? await createDirectWorktree(repo, runId, task) : repo.root;
      const name = `${runId}-${index * 6 + layout.cols + i + 1}`;
      const pane = await splitAndStart(topPanes[i], 'down', taskCwd, name, agentArgs);
      run.workers.push({ task, name, paneId: pane, tabId: tabID, cwd: taskCwd });
      pending.push({
        pane,
        prompt: workerPrompt({
          task: options.protocol === 'custom' ? `${options.customPrefix} ${task}`.trim() : task,
          protocol: options.protocol,
          authority: options.authority,
          extra: options.instructions,
          repo: taskCwd,
        }),
      });
    }
  }
  for (const worker of pending) await herdr(['agent', 'prompt', worker.pane, worker.prompt]);
  runs.push(run);
  if (run.intervalMs > 0) startMonitor(pi, ctx, run.intervalMs);
  else await updateMonitor(pi, ctx, false);
  ctx.ui.notify(
    `Launched ${options.tasks.length} worker(s) in ${batches.length} tab(s): ${runId}`,
    'info',
  );
}

export default function piesFanout(pi: ExtensionAPI) {
  pi.registerTool({
    name: 'pies_fanout_launch',
    label: 'Launch PIES fanout workers',
    description:
      'Launch explicitly approved independent tasks as visible Herdr workers. Prerequisites: Herdr CLI on PATH (or $HERDR_BIN) and an interactive session with the ask_user tool; both are checked or documented with actionable failures.',
    promptSnippet: 'Launch user-approved PIES fanout tasks as visible Herdr workers',
    promptGuidelines: [
      'Use pies_fanout_launch only after the user has approved the exact tasks and launch configuration through the /pies-fanout wizard (ask_user).',
    ],
    parameters: Type.Object({
      tasks: Type.Array(Type.String({ minLength: 1 }), {
        minItems: 1,
        description: 'Approved independent tasks',
      }),
      protocol: Type.Optional(StringEnum(['pies', 'direct', 'custom'] as const)),
      authority: Type.Optional(StringEnum(['operator', 'agent'] as const)),
      model: Type.Optional(Type.String({ minLength: 1 })),
      thinking: Type.Optional(Type.String({ minLength: 1 })),
      monitorIntervalMinutes: Type.Optional(Type.Number({ minimum: 0 })),
      instructions: Type.Optional(Type.String()),
      customPrefix: Type.Optional(Type.String()),
      userApproved: Type.Literal(true, {
        description: 'Set true only after the final user approval',
      }),
    }),
    async execute(_toolCallId, input, _signal, _onUpdate, ctx) {
      await herdrPreflight();
      const options = normalizeLaunchInput(input, {
        model: ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : undefined,
        thinkingLevel: ctx.thinkingLevel,
      });
      await launch(pi, ctx, options);
      return {
        content: [
          {
            type: 'text' as const,
            text: `Launched ${options.tasks.length} ${options.protocol} worker(s) using ${options.model} (${options.thinking}); monitoring every ${options.monitorIntervalMinutes} minute(s).`,
          },
        ],
        details: { ...options },
      };
    },
  });

  pi.registerTool({
    name: 'pies_fanout_available_models',
    label: 'List Pi models for PIES fanout',
    description:
      'List all available Pi models for a fanout model-selection prompt. Does not launch anything.',
    promptSnippet: 'List available Pi models for PIES fanout configuration',
    parameters: Type.Object({}),
    async execute(_toolCallId, _input, _signal, _onUpdate, ctx) {
      const models = (ctx.modelRegistry.getAvailable() as ModelInfo[])
        .map((model) => ({ id: `${model.provider}/${model.id}`, name: model.name ?? model.id }))
        .sort((a, b) => a.id.localeCompare(b.id));
      return {
        content: [
          {
            type: 'text' as const,
            text: models
              .map((model) => `${model.id}${model.name !== model.id ? ` — ${model.name}` : ''}`)
              .join('\n'),
          },
        ],
        details: { models },
      };
    },
  });

  pi.registerCommand('pies-fanout-status', {
    description: 'Show status for active /pies-fanout workers',
    handler: async (_args, ctx) => {
      await updateMonitor(pi, ctx, false);
      const summary = runs
        .flatMap((run) => run.workers)
        .map((worker) => `${worker.name} [${worker.status ?? '?'}] ${worker.task}`)
        .join('\n');
      ctx.ui.notify(summary || 'No fanout runs tracked in this session.', 'info');
    },
  });

  pi.registerCommand('pies-fanout-stop', {
    description: 'Stop a /pies-fanout worker by pane name',
    handler: async (args, ctx) => {
      const target = args?.trim();
      if (!target) return ctx.ui.notify('Usage: /pies-fanout-stop <worker-name>', 'warning');
      const ok = await ctx.ui.confirm('Stop fanout worker?', target);
      if (!ok) return;
      const worker = runs
        .flatMap((run) => run.workers)
        .find((item) => item.name === target || item.paneId === target);
      if (!worker) return ctx.ui.notify(`No tracked worker named ${target}.`, 'warning');
      await herdr(['pane', 'close', worker.paneId]);
      ctx.ui.notify(`Stopped ${worker.name}.`, 'info');
    },
  });

  pi.on('session_shutdown', () => {
    if (timer) clearInterval(timer);
    timer = undefined;
  });
}
