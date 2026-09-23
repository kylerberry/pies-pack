# ADR-011: Evaluation independence

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

Under hands-off operation, evaluation is the merge authority (ADR-001). An evaluator that inherits the implementer's reasoning can be talked out of real findings. A reviewer that edits is not a separate reviewer.

pi-subagents offers three related mechanisms. The builtin `reviewer` reviews and makes small fixes. The watchdog is an ambient hook: it reviews repo edits automatically at agent-end boundaries whenever a writer changed the final repo state, and is configured separately from `reviewer`. A custom agent can disable edits.

## Decision

- **Primary evaluation.** The node lead evaluates the worker's diff, in both DAG and standalone runs (ADR-003). Writer and reviewer are already different agents.
- **Second opinion.** On escalation triggers, a model from a different family from the worker also evaluates.
- **Inputs.** The lead evaluates with its retained grounding and plan context. Cold second opinions receive only the diff, node criteria, verify map, and raw verification output—not implementer or planner rationale.
- **Verification.** The lead re-runs verification after simplification. Every second opinion also re-runs it, including on the real surface, rather than trusting a pasted log.
- **Edits.** Evaluation never edits. The custom `pies-evaluator` second-opinion agent has edit tools disabled.
- **Rounds.** The existing two-round limit before escalation stays.

## Options Considered

### Option A: Builtin reviewer
**Cons:** Small-fix behavior breaks review separation.

### Option B: Watchdog as the evaluator
**Cons:** Ambient tripwire, not a deliberate gate against criteria. Fires on edits, not on node completion.

### Option C: Custom no-edit evaluator, second opinion on triggers (chosen)
**Pros:** Deliberate gate, independent inputs, cost only where risk is.

## Trade-off Analysis

A lead evaluating its own plan's execution cannot catch a bad plan faithfully executed. The plan-independent check is real-surface verification (ADR-008); the second opinion covers risky plans.

## Consequences

- **Watchdog.** Deferred. It overlaps the evaluator: both review the writer's changes, and its LSP diagnostics duplicate the typecheck in `checks`. Revisit if evaluation misses problems that a per-write review would have caught early.
