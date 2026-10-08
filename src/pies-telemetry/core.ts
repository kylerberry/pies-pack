import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';

export interface SessionIdentity {
  id?: string;
  file?: string;
}

export interface BindInput {
  runId: string;
  role: 'lead';
  artifactRoot: string;
  session: SessionIdentity;
  now?: () => number;
}

export type TelemetryEvent =
  | { v: 1; type: 'bound'; at: number; run_id: string; role: 'lead' }
  | { v: 1; type: 'assistant_start'; at: number }
  | { v: 1; type: 'assistant_end'; at: number; usage?: ObservedUsage }
  | { v: 1; type: 'tool_start'; at: number; tool_call_id: string; tool_name: string; nested: boolean }
  | { v: 1; type: 'tool_end'; at: number; tool_call_id: string; tool_name: string; nested: boolean; error: boolean }
  | { v: 1; type: 'agent_start'; at: number }
  | { v: 1; type: 'agent_settled'; at: number }
  | { v: 1; type: 'ui_prompt_start'; at: number }
  | { v: 1; type: 'ui_prompt_end'; at: number }
  | { v: 1; type: 'finalized'; at: number };

export interface ObservedUsage {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
  reasoning?: number;
  total_tokens?: number;
  pi_reported_cost?: number;
}

export interface TelemetryRollup {
  lead_only: true;
  wall_ms: number;
  active_ms: number;
  tool_ms: number | null;
  assistant_ms: number | null;
  assistant_messages: number;
  observed_usage: ObservedUsage;
}

const RUN_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const text = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || !value || value.length > 512) throw new Error(`${field} must be a bounded non-empty string.`);
  return value;
};
const at = (value: unknown): number => {
  if (!finite(value)) throw new Error('telemetry event time must be a non-negative finite number.');
  return value;
};

function contained(path: string, parent: string): boolean {
  const rel = relative(parent, path);
  return rel === '' || (!rel.startsWith('..') && !rel.includes(`..${process.platform === 'win32' ? '\\' : '/'}`));
}

export function runDirectory(artifactRoot: string, runId: string): string {
  if (!RUN_ID.test(runId)) throw new Error('run_id must be a safe non-empty identifier.');
  const root = resolve(artifactRoot);
  const dir = resolve(root, runId);
  if (!contained(dir, root)) throw new Error('run artifact directory escapes the artifact root.');
  return dir;
}

export function observedUsage(value: unknown): ObservedUsage | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Record<string, unknown>;
  const cost = source.cost && typeof source.cost === 'object' ? (source.cost as Record<string, unknown>).total : undefined;
  const usage: ObservedUsage = {};
  const fields: Array<[keyof ObservedUsage, unknown]> = [
    ['input', source.input],
    ['output', source.output],
    ['cache_read', source.cacheRead],
    ['cache_write', source.cacheWrite],
    ['reasoning', source.reasoning],
    ['total_tokens', source.totalTokens],
    ['pi_reported_cost', cost],
  ];
  for (const [key, number] of fields) if (finite(number)) usage[key] = number;
  return Object.keys(usage).length ? usage : undefined;
}

export class LeadTelemetry {
  readonly dir: string;
  readonly file: string;
  private readonly now: () => number;
  private pending = Promise.resolve();
  private finalized = false;

  private constructor(dir: string, private readonly session: Required<SessionIdentity>, now: () => number) {
    this.dir = dir;
    this.file = join(dir, 'telemetry.jsonl');
    this.now = now;
  }

  static async bind(input: BindInput): Promise<LeadTelemetry> {
    if (input.role !== 'lead') throw new Error('telemetry binding is limited to the lead role.');
    if (!input.session.id || !input.session.file) throw new Error('telemetry binding requires the current Pi session ID and file.');
    const dir = runDirectory(input.artifactRoot, input.runId);
    await mkdir(dir, { recursive: true });
    const telemetry = new LeadTelemetry(dir, { id: input.session.id, file: input.session.file }, input.now ?? Date.now);
    await telemetry.append({ v: 1, type: 'bound', at: telemetry.now(), run_id: input.runId, role: 'lead' });
    return telemetry;
  }

  matches(session: SessionIdentity): boolean {
    return session.id === this.session.id && session.file === this.session.file;
  }

  async append(event: TelemetryEvent): Promise<void> {
    if (this.finalized && event.type !== 'finalized') return;
    const safe = safeEvent(event);
    this.pending = this.pending.then(() => appendFile(this.file, `${JSON.stringify(safe)}\n`, 'utf8'));
    return this.pending;
  }

  async finalize(session: SessionIdentity): Promise<TelemetryRollup> {
    if (!this.matches(session)) throw new Error('telemetry finalize must use the bound Pi session.');
    if (!this.finalized) {
      this.finalized = true;
      await this.append({ v: 1, type: 'finalized', at: this.now() });
    }
    await this.pending;
    return rollupTelemetry(await readTelemetry(this.file));
  }
}

function safeEvent(event: TelemetryEvent): TelemetryEvent {
  const base = { v: 1 as const, at: at(event.at) };
  switch (event.type) {
    case 'bound': return { ...base, type: 'bound', run_id: text(event.run_id, 'run_id'), role: 'lead' };
    case 'assistant_start': return { ...base, type: 'assistant_start' };
    case 'assistant_end': return { ...base, type: 'assistant_end', ...(event.usage ? { usage: safeUsage(event.usage) } : {}) };
    case 'tool_start': return { ...base, type: 'tool_start', tool_call_id: text(event.tool_call_id, 'tool_call_id'), tool_name: text(event.tool_name, 'tool_name'), nested: Boolean(event.nested) };
    case 'tool_end': return { ...base, type: 'tool_end', tool_call_id: text(event.tool_call_id, 'tool_call_id'), tool_name: text(event.tool_name, 'tool_name'), nested: Boolean(event.nested), error: Boolean(event.error) };
    case 'agent_start': return { ...base, type: 'agent_start' };
    case 'agent_settled': return { ...base, type: 'agent_settled' };
    case 'ui_prompt_start': return { ...base, type: 'ui_prompt_start' };
    case 'ui_prompt_end': return { ...base, type: 'ui_prompt_end' };
    case 'finalized': return { ...base, type: 'finalized' };
  }
}

function safeUsage(usage: ObservedUsage): ObservedUsage {
  const safe: ObservedUsage = {};
  for (const key of ['input', 'output', 'cache_read', 'cache_write', 'reasoning', 'total_tokens', 'pi_reported_cost'] as const)
    if (finite(usage[key])) safe[key] = usage[key];
  return safe;
}

export async function readTelemetry(file: string): Promise<TelemetryEvent[]> {
  const lines = (await readFile(file, 'utf8')).split('\n').filter(Boolean);
  return lines.map((line) => JSON.parse(line) as TelemetryEvent);
}

function unionMs(intervals: Array<[number, number]>): number {
  const sorted = intervals.sort(([a], [b]) => a - b);
  let total = 0;
  let start = -1;
  let end = -1;
  for (const [nextStart, nextEnd] of sorted) {
    if (start < 0) [start, end] = [nextStart, nextEnd];
    else if (nextStart <= end) end = Math.max(end, nextEnd);
    else {
      total += end - start;
      [start, end] = [nextStart, nextEnd];
    }
  }
  return start < 0 ? 0 : total + end - start;
}

/** Deterministic lead-only summary. `active_ms` is bound-to-finalize time less completed UI-prompt waits. */
export function rollupTelemetry(events: TelemetryEvent[]): TelemetryRollup {
  const bound = events.find((event) => event.type === 'bound');
  const finalized = [...events].reverse().find((event) => event.type === 'finalized');
  if (!bound || !finalized || finalized.at < bound.at) throw new Error('telemetry requires ordered bound and finalized events.');

  const usage: ObservedUsage = {};
  let assistantMessages = 0;
  const assistantStarts: number[] = [];
  const assistantIntervals: Array<[number, number]> = [];
  let unmatchedAssistant = false;
  const toolStarts = new Map<string, number>();
  const toolIntervals: Array<[number, number]> = [];
  let unmatchedTool = false;
  const uiPromptStarts: number[] = [];
  const uiPromptWaitIntervals: Array<[number, number]> = [];

  for (const event of events) {
    if (event.type === 'assistant_start') {
      assistantStarts.push(event.at);
    } else if (event.type === 'assistant_end') {
      const start = assistantStarts.pop();
      assistantMessages++;
      if (start === undefined || event.at < start) unmatchedAssistant = true;
      else assistantIntervals.push([start, event.at]);
      if (event.usage) for (const [key, value] of Object.entries(event.usage) as Array<[keyof ObservedUsage, number]>)
        usage[key] = (usage[key] ?? 0) + value;
    } else if (event.type === 'tool_start') {
      toolStarts.set(event.tool_call_id, event.at);
    } else if (event.type === 'tool_end') {
      const start = toolStarts.get(event.tool_call_id);
      if (start === undefined || event.at < start) unmatchedTool = true;
      else {
        toolIntervals.push([start, event.at]);
        toolStarts.delete(event.tool_call_id);
      }
    } else if (event.type === 'ui_prompt_start') {
      uiPromptStarts.push(event.at);
    } else if (event.type === 'ui_prompt_end') {
      const start = uiPromptStarts.pop();
      if (start !== undefined && event.at >= start) {
        uiPromptWaitIntervals.push([Math.max(start, bound.at), Math.min(event.at, finalized.at)]);
      }
    }
  }
  if (assistantStarts.length) unmatchedAssistant = true;
  if (toolStarts.size) unmatchedTool = true;
  const boundLeadMs = finalized.at - bound.at;
  const explicitUiPromptWaitMs = unionMs(uiPromptWaitIntervals.filter(([start, end]) => end >= start));
  return {
    lead_only: true,
    wall_ms: boundLeadMs,
    active_ms: boundLeadMs - explicitUiPromptWaitMs,
    tool_ms: unmatchedTool ? null : unionMs(toolIntervals),
    assistant_ms: unmatchedAssistant || !assistantIntervals.length ? null : unionMs(assistantIntervals),
    assistant_messages: assistantMessages,
    observed_usage: usage,
  };
}
