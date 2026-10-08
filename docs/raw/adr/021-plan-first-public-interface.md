# ADR-021: Plan-first public interface and lifecycle

**Status:** Accepted
**Date:** 2026-09-25
**Deciders:** Kyler

## Context

PIES exposes decomposition and execution through DAG-named skills. A DAG is useful implementation machinery, but it is not the operator's job: the operator wants to turn a trustworthy specification into a plan, then deliver that plan. The current names also obscure the difference between a known single change, a planned delivery, and generic parallel assistance.

The existing decomposition contract has an important non-negotiable purpose: progressive capability proof. It starts from an actor's real journey, finds the narrowest real walking skeleton, composes early, and advances through independently valuable, directly provable capabilities. It rejects foundation-first sequencing and speculative abstractions unless evidence earns an exception.

## Decision

### Public surfaces

- `/pies` remains the direct path for a known, scoped outcome.
- `/pies-create-plan <spec | references>` creates a durable execution plan from a complete specification and/or named ADR/document references.
- `/pies-run-plan <plan-id>` runs a durable plan.
- `/pies-fanout` remains independent parallel assistance; it is not plan-delivery orchestration.
- Remove the DAG-named public surfaces immediately. DAG remains the internal representation and technical vocabulary.

### Plan creation

- Freeform text is accepted only when it already states a clear outcome, scope, and evaluable criteria. Otherwise creation asks targeted questions and saves no executable plan.
- Every create-plan invocation persists a plan, including a one-outcome plan. Choosing `/pies` remains the alternative when no durable plan is wanted.
- Plans live under `$PIES_ARTIFACT_ROOT/runs/<repo-basename>/plans/<plan-id>/`, preserving the established `runs/` artifact category. The bundle contains the strict internal `dag.json`, source provenance, a human-readable plan, and structured plan-quality warnings.
- A plan is immutable: changed specifications create a new plan ID; no plan is overwritten.
- Plans are intent, not code snapshots. Run-plan uses the current base; node grounding adapts to it and records the actual revision.

### Plan quality

- Create-plan preserves the existing walking-skeleton, early-composition, two-PR, reviewer-budget, foundation-delay, late-composition, delete-half, probe, and speculation/control attacks.
- Progressive capability proof remains the planning standard: early milestones are real user/consumer capabilities with direct proof, not layers of a future system.
- A failed planning-quality attack creates a structured persistent warning rather than blocking plan creation. Warnings are shown at creation only, not re-shown by run-plan.

### Delivery

- Running a plan ID is explicit approval to begin work; there is no separate mutable approval state.
- Merge/publication authority remains human-gated by default. `--afk` is the only autonomous-publication opt-in.
- Run-plan uses ADR-019 rolling admission by default. A failed or unproved outcome freezes only its transitive dependents; unrelated outcomes continue and the goal summary reports partial/unproved completion. `--barriered` remains available.
- Essential research or codebase analysis must complete as a standalone report before a delivery plan is created. Report-only work never becomes a plan outcome.
- Run-plan does not invoke the public fanout wizard. It owns exact plan packets, scheduling, integration, and evidence; a future private transport adapter is a separate decision.

## Options considered

### Option A: Keep DAG-named surfaces

**Pros:** Existing terminology maps directly to the representation.

**Cons:** Makes internal graph machinery the operator's primary concern and makes execution look like a second form of generic fanout.

### Option B: One `/pies-goal` surface

**Pros:** Minimal command set.

**Cons:** Blurs planning, approval, and execution; makes resume and partial completion semantics unclear.

### Option C: Plan-first surfaces (chosen)

**Pros:** Separates specification-to-plan from approved delivery, retains `/pies` for a known change, and keeps the graph internal.

**Cons:** Adds a durable plan artifact and replaces existing DAG-named entry points immediately.

## Consequences

- ADR-019 admission semantics remain unchanged; only the public framing changes.
- This is a recorded weakening of the current decomposition hard-stop: plan-quality attacks now persist warnings instead of blocking creation. The planning standard itself remains unchanged.
- The current `pies-decompose-to-dag` and `pies-execute-dag` skills are removed rather than retained as aliases.
- A plan resolver/validator must preserve the strict five-field node schema and let `pies-dag-next` continue deriving done status from Git.

## Action items

1. [ ] Implement plan bundle creation and resolution under the artifact root.
2. [ ] Replace DAG-named skills/public commands with create-plan and run-plan surfaces.
3. [ ] Retain existing decomposition attacks as structured plan-quality output and test warnings.
4. [ ] Update fanout wording to exclude plan delivery explicitly.
5. [ ] Add end-to-end plan lifecycle proof, including current-base execution, partial completion, and publication gates.
