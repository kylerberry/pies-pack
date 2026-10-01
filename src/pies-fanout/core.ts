/**
 * Pure planning/collection core for the PIES fanout extension.
 *
 * No Pi or Herdr I/O lives here: every function is deterministic and unit
 * tested. `extensions/pies-fanout.ts` owns process orchestration and wires
 * these helpers to Herdr.
 */

export const MAX_PANES = 6;
export const MAX_TASKS = MAX_PANES * 10;
export const REPORT_SLICE_CHARS = 4_000;
export const BOOT_TIMEOUT_MS = 90_000;

export type Protocol = 'pies' | 'direct' | 'custom';
export type Authority = 'agent' | 'operator';

export interface Worker {
  task: string;
  name: string;
  paneId: string;
  tabId: string;
  cwd: string;
  status?: string;
  reportSent?: boolean;
}

export interface FanoutRun {
  id: string;
  protocol: Protocol;
  authority: Authority;
  intervalMs: number;
  workers: Worker[];
}

export const TERMINAL_STATES = ['blocked', 'idle', 'done', 'gone'] as const;

export function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'task'
  );
}

export interface LaunchOptions {
  tasks: string[];
  protocol: Protocol;
  authority: Authority;
  model: string;
  thinking: string;
  monitorIntervalMinutes: number;
  customPrefix: string;
  instructions: string;
}

export interface LaunchInput {
  tasks: string[];
  protocol?: Protocol;
  authority?: Authority;
  model?: string;
  thinking?: string;
  monitorIntervalMinutes?: number;
  instructions?: string;
  customPrefix?: string;
  userApproved: boolean;
}

/** Validate and normalize raw tool input into the exact launch configuration. */
export function normalizeLaunchInput(
  input: LaunchInput,
  session: { model?: string; thinkingLevel?: string },
): LaunchOptions {
  if (!input.userApproved)
    throw new Error('fanout requires explicit final user approval (userApproved: true).');
  const tasks = input.tasks.map((task) => task.trim()).filter(Boolean);
  if (!tasks.length) throw new Error('At least one non-empty task is required.');
  if (tasks.length > MAX_TASKS)
    throw new Error(`At most ${MAX_TASKS} tasks may be launched at once.`);

  const protocol: Protocol = input.protocol ?? 'pies';
  const authority: Authority = protocol === 'direct' ? 'operator' : (input.authority ?? 'operator');
  const model = input.model ?? session.model ?? '';
  if (!model) throw new Error('No active model; provide model explicitly.');
  const thinking = input.thinking ?? session.thinkingLevel ?? 'medium';
  const interval = input.monitorIntervalMinutes ?? 10;
  const customPrefix = input.customPrefix?.trim() ?? '';
  if (protocol === 'custom' && !customPrefix)
    throw new Error('customPrefix is required for the custom protocol.');
  return {
    tasks,
    protocol,
    authority,
    model,
    thinking,
    monitorIntervalMinutes: interval,
    customPrefix,
    instructions: input.instructions?.trim() ?? '',
  };
}

/** Arguments passed to every worker agent process. */
export function buildAgentArgs(model: string, thinking: string): string[] {
  return ['--model', model, '--thinking', thinking];
}

export interface TabLayout {
  cols: number;
  top: string[];
  bottom: string[];
}

/**
 * Split one batch (≤ MAX_PANES tasks) into a two-row tab layout.
 * Row one fills left→right; row two hangs each pane below its column.
 */
export function planTabLayout(batch: string[]): TabLayout {
  if (!batch.length) throw new Error('planTabLayout requires a non-empty batch.');
  if (batch.length > MAX_PANES)
    throw new Error(`planTabLayout accepts at most ${MAX_PANES} tasks.`);
  const cols = batch.length <= 3 ? batch.length : Math.ceil(batch.length / 2);
  return { cols, top: batch.slice(0, cols), bottom: batch.slice(cols) };
}

export function workerPrompt(opts: {
  task: string;
  protocol: Protocol;
  authority: Authority;
  extra: string;
  repo: string;
}): string {
  const authority =
    opts.protocol === 'direct'
      ? 'Commit your branch and report; do not merge. Direct fanout intentionally leaves merge approval to the operator.'
      : opts.authority === 'agent'
        ? 'You have final approval and merge capability.'
        : 'The operator has final approval and merge capability. Stop at the publication gate; do not merge.';
  const kickoff =
    opts.protocol === 'pies'
      ? `/pies${opts.authority === 'agent' ? ' --afk' : ''} ${opts.task}`
      : opts.protocol === 'custom'
        ? opts.task
        : `Implement this task directly in the assigned worktree: ${opts.task}`;
  return `You are a single-writer implementation worker.\n\nAuthority: ${authority}\nRepository: ${opts.repo}\n\nTask:\n${kickoff}\n\nUse the repository instructions and run relevant verification. Report: changed files, validation, commit/merge state, blockers, and any decision requiring the operator.${opts.extra ? `\n\nAdditional instructions:\n${opts.extra}` : ''}`;
}

export interface AgentListEntry {
  pane_id?: string;
  paneId?: string;
  agent_status?: string;
  agentStatus?: string;
  status?: string;
}

export interface CollectedReport {
  runId: string;
  worker: string;
  task: string;
  state: string;
  report: string;
}

/**
 * Collect one terminal report per worker. Mutates the given runs by marking
 * `reportSent`, so repeated polling never re-collects a worker.
 */
export async function collectTerminalReports(
  runs: FanoutRun[],
  agents: AgentListEntry[],
  readReport: (worker: Worker) => Promise<string> | string,
): Promise<CollectedReport[]> {
  const byPane = new Map<string, AgentListEntry>();
  for (const agent of agents) {
    const pane = agent.pane_id ?? agent.paneId;
    if (pane) byPane.set(pane, agent);
  }
  const statusOf = (agent?: AgentListEntry) =>
    agent?.agent_status ?? agent?.agentStatus ?? agent?.status ?? 'gone';

  const collected: CollectedReport[] = [];
  for (const run of runs) {
    for (const worker of run.workers) {
      worker.status = statusOf(byPane.get(worker.paneId));
      if (worker.reportSent) continue;
      if (!TERMINAL_STATES.includes(worker.status as (typeof TERMINAL_STATES)[number])) continue;
      worker.reportSent = true;
      collected.push({
        runId: run.id,
        worker: worker.name,
        task: worker.task,
        state: worker.status,
        report: (await readReport(worker)) || '(No readable worker report.)',
      });
    }
  }
  return collected;
}

/** Build the manager-session synthesis message for a batch of terminal reports. */
export function buildSynthesisMessage(collected: CollectedReport[]): {
  customType: string;
  content: string;
  display: boolean;
  details: { collected: CollectedReport[] };
} {
  const body = collected
    .map(
      (item) =>
        `Run: ${item.runId}\nWorker: ${item.worker}\nTask: ${item.task}\nState: ${item.state}\n\n${item.report.slice(-REPORT_SLICE_CHARS)}`,
    )
    .join('\n\n---\n\n');
  return {
    customType: 'pies-fanout-report-batch',
    content: `PIES fanout worker reports\n\n${body}\n\nAct as the fanout supervisor: synthesize these and prior fanout reports, state completed work/evidence/blockers, and recommend the next operator action. Do not launch, merge, or modify anything in response to this update.`,
    display: true,
    details: { collected },
  };
}

/** Batches tasks into tabs of at most MAX_PANES workers each. */
export function batchTasks(tasks: string[]): string[][] {
  const batches: string[][] = [];
  for (let offset = 0; offset < tasks.length; offset += MAX_PANES)
    batches.push(tasks.slice(offset, offset + MAX_PANES));
  return batches;
}
