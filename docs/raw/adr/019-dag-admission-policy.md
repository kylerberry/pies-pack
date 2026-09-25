# ADR-019: DAG structure is durable; admission policy is replaceable

**Status:** Accepted
**Date:** 2026-09-23
**Deciders:** Kyler

## Context

A DAG expresses semantic dependencies: which outcomes cannot be built or proved until other outcomes are merged. The prior DAG execution procedure treated each ready-frontier snapshot as a mandatory global wave barrier. An unrelated slow, blocked, or failed node could therefore delay newly unblocked work.

That batch scheduler is more rigid than the graph requires and conflicts with PIES's role as a skill stack whose execution host is selected by the invoking prompt (ADR-003). Git-derived completion and serial integration checks remain valuable.

## Decision

- Keep the five-field DAG, semantic dependency rule, `Node: <id>` trailers, `pies-dag-next`, serial `--no-ff` merge, and post-merge verification.
- Default to **rolling-frontier admission**: after every successful merge, recompute readiness and admit newly ready work up to the caller-selected active-node limit.
- Retain **barriered admission** as an explicit `--barriered` execution option for coordinated integration, release boundaries, or other evidenced needs.
- A `shared-exclusive` verification surface runs alone in either mode.
- Non-passing nodes freeze only transitive dependents; unrelated ready nodes continue in rolling mode.
- The caller selects the active-node limit at runtime. It is recorded in `supervisor.json`, is not DAG data, and has no numeric default. `shared-exclusive` surfaces still run alone.
- The cumulative brief updates after each successful merge. A barrier is a scheduling policy, not the definition of a DAG wave.

## Options Considered

### Option A: Mandatory global waves
**Pros:** Simple batch boundaries and fewer moving-base integrations.
**Cons:** Head-of-line blocking for unrelated work; DAG topology cannot express the actual admission policy.

### Option B: Fully unconstrained parallel execution
**Pros:** Maximum throughput.
**Cons:** Ignores verification contention and makes integration failures harder to attribute.

### Option C: Rolling frontier with explicit barriers (chosen)
**Pros:** The graph controls dependency order; scheduling remains adaptable. Conservative barriers remain available where evidence requires them.
**Cons:** More frequent integration events, a need to recreate stale worktrees after failed integration, and an explicit runtime concurrency choice.

## Consequences

- `pies-execute-dag` is a supervisor policy skill, not a mandatory batch scheduler.
- Default human approval can still pause admission until a passing node is approved; `--afk` realizes autonomous rolling admission.
- Existing lifecycle tests must cover rolling admission, transitive freezing, explicit barriers, and shared-exclusive serialization.

## Action Items

1. [x] Change `pies-execute-dag` to rolling-frontier admission with `--barriered` as an explicit option.
2. [ ] Extend the disposable DAG lifecycle test to prove rolling admission and barriered behavior.
