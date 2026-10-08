import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { basename, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import { LeadTelemetry, observedUsage, type SessionIdentity } from '../src/pies-telemetry/core.js';

const exec = promisify(execFile);
let telemetry: LeadTelemetry | undefined;

function session(ctx: { sessionManager: { getSessionId(): string | undefined; getSessionFile(): string | undefined } }): SessionIdentity {
  return { id: ctx.sessionManager.getSessionId(), file: ctx.sessionManager.getSessionFile() };
}

async function artifactRoot(cwd: string): Promise<string> {
  const { stdout: rootOutput } = await exec('git', ['rev-parse', '--show-toplevel'], { cwd });
  const root = rootOutput.trim();
  const { stdout: commonOutput } = await exec('git', ['rev-parse', '--git-common-dir'], { cwd: root });
  const common = commonOutput.trim();
  const commonAbsolute = common.startsWith('/') ? common : join(root, common);
  return join(homedir(), '.pies', 'runs', basename(dirname(commonAbsolute)));
}

function active(ctx: { sessionManager: { getSessionId(): string | undefined; getSessionFile(): string | undefined } }): LeadTelemetry | undefined {
  return telemetry?.matches(session(ctx)) ? telemetry : undefined;
}

function nested(event: object): boolean {
  return Boolean((event as { parentToolCallId?: string }).parentToolCallId);
}

export default function piesTelemetry(pi: ExtensionAPI) {
  pi.registerTool({
    name: 'pies_telemetry_bind',
    label: 'Bind lead PIES telemetry',
    description: 'Explicitly bind this lead Pi session to one PIES run. Records only lead telemetry under that run artifact directory.',
    promptSnippet: 'Bind lead-only telemetry at the start of a PIES run',
    promptGuidelines: ['Call at /pies start with the normalized run ID and role lead; never bind child sessions.'],
    parameters: Type.Object({
      run_id: Type.String({ minLength: 1, maxLength: 128 }),
      role: Type.Literal('lead'),
    }),
    async execute(_id, input, _signal, _update, ctx) {
      const root = await artifactRoot(ctx.cwd);
      if (telemetry) {
        const expected = join(root, input.run_id);
        if (telemetry.dir !== expected) throw new Error('telemetry is already bound to a different run.');
        if (!telemetry.matches(session(ctx))) throw new Error('telemetry is already bound to a different Pi session.');
      } else {
        telemetry = await LeadTelemetry.bind({
          runId: input.run_id,
          role: input.role,
          artifactRoot: root,
          session: session(ctx),
        });
      }
      return { content: [{ type: 'text' as const, text: `Lead telemetry bound for ${input.run_id}.` }], details: { run_id: input.run_id, lead_only: true } };
    },
  });

  pi.registerTool({
    name: 'pies_telemetry_finalize',
    label: 'Finalize lead PIES telemetry',
    description: 'Finalize the bound lead telemetry stream and return its deterministic lead-only rollup.',
    promptSnippet: 'Finalize lead-only telemetry before writing the PIES terminal run record',
    parameters: Type.Object({}),
    async execute(_id, _input, _signal, _update, ctx) {
      const bound = active(ctx);
      if (!bound) throw new Error('no telemetry is bound for this Pi session.');
      const rollup = await bound.finalize(session(ctx));
      return { content: [{ type: 'text' as const, text: 'Lead telemetry finalized.' }], details: rollup };
    },
  });

  pi.on('message_start', async (event, ctx) => {
    const bound = active(ctx);
    if (bound && event.message.role === 'assistant') await bound.append({ v: 1, type: 'assistant_start', at: Date.now() });
  });
  pi.on('message_end', async (event, ctx) => {
    const bound = active(ctx);
    if (bound && event.message.role === 'assistant') {
      const usage = observedUsage((event.message as { usage?: unknown }).usage);
      await bound.append({ v: 1, type: 'assistant_end', at: Date.now(), ...(usage ? { usage } : {}) });
    }
  });
  pi.on('tool_execution_start', async (event, ctx) => {
    const bound = active(ctx);
    if (bound) await bound.append({ v: 1, type: 'tool_start', at: Date.now(), tool_call_id: event.toolCallId, tool_name: event.toolName, nested: nested(event) });
  });
  pi.on('tool_execution_end', async (event, ctx) => {
    const bound = active(ctx);
    if (bound) await bound.append({ v: 1, type: 'tool_end', at: Date.now(), tool_call_id: event.toolCallId, tool_name: event.toolName, nested: nested(event), error: event.isError });
  });
  pi.on('agent_start', async (_event, ctx) => {
    const bound = active(ctx);
    if (bound) await bound.append({ v: 1, type: 'agent_start', at: Date.now() });
  });
  pi.on('agent_settled', async (_event, ctx) => {
    const bound = active(ctx);
    if (bound) await bound.append({ v: 1, type: 'agent_settled', at: Date.now() });
  });
  // Timing only: do not persist the prompt kind, title, or response.
  pi.on('ui_prompt_start', async (_event, ctx) => {
    const bound = active(ctx);
    if (bound) await bound.append({ v: 1, type: 'ui_prompt_start', at: Date.now() });
  });
  pi.on('ui_prompt_end', async (_event, ctx) => {
    const bound = active(ctx);
    if (bound) await bound.append({ v: 1, type: 'ui_prompt_end', at: Date.now() });
  });
}
