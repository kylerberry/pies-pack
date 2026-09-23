# ADR-003: Node lead as a depth-2 session

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

ADR-002 needs a lead agent that spawns a worker. The natural way to run a DAG is from a long-running PM session: tell it to execute the DAG, and it spawns one subagent per node, which becomes that node's lead and spawns its own children.

That is two levels of nesting. The current `pies-execute-dag` forbids it: hard constraint 2 limits depth to 1, and writers and advisors may not launch further agents. The constraint exists because running CRAFTS with a long-lived orchestrator and two nesting levels was unreliable: failed sessions and missed instructions. pi-subagents supports two levels.

## Decision

Allow two levels. The supervisor spawns one lead per node. The lead runs `pies` and spawns scout, worker, simplifier, and any second opinion as its own children. Workers, scouts, and simplifiers have no subagent tool.

Standalone runs use the same shape one level up: the pi session running `/pies` is the lead.

The same lead behavior applies in both modes, so `pies/SKILL.md` is the only definition of the stages.

Mitigations for the known failure modes, drawn from pstack's delegation rules:

- Children receive file pointers, not inlined context.
- A child that needs different direction is replaced by a fresh child with consolidated scope, not steered or resumed mid-run.
- Child output is bounded, and results return as files.

## Options Considered

### Option A: Supervisor spawns a node lead, lead spawns children (chosen)
**Pros:** Matches how the operator works. One realization of the lead for both modes. Plan and review context stay in one agent.
**Cons:** Depth 2, the shape that failed under CRAFTS.

### Option B: Static workflow protocol at depth 1
**Pros:** Proven wave machinery, no nesting.
**Cons:** Two realizations of one stage list. No agent holds both plan and review context.

## Trade-off Analysis

The CRAFTS failures were observed with a different protocol and a different extension version. Whether depth 2 fails under PIES is an empirical question, and the mitigations above address the likeliest mechanisms. Option B stays available as a fallback without changing any other ADR.

## Consequences

- `pies-execute-dag` hard constraints 2 and 5 change to allow a node lead.
- Nesting failures will surface as sessions that fail or return without completing their output contract (ADR-012).

## Revisit when

Node leads repeatedly fail, lose instructions, or return incomplete output contracts. Then adopt Option B: add `--protocol pies` to the static workflow and run the stages as depth-1 siblings.

## Action Items

1. [ ] Update `pies-execute-dag`: supervisor launches one node lead per node instead of the static workflow; lead may spawn children; children may not.
2. [ ] Check `maxSubagentSpawnsPerRun` (default 64) against 3 concurrent nodes times their children and retries.
