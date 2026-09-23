# ADR-004: Input normalization and criteria provenance

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

PIES runs on DAG nodes and on standalone tasks from other surfaces. A DAG node arrives with criteria that survived pies-decompose-to-dag's split tests and adversarial finish pass. A standalone task often arrives with no criteria at all.

The original Plan stage emitted its own `change_spec` and `acceptance_criteria`, duplicating the node and allowing the gate to be rewritten by the stage it gates.

## Decision

The first stage normalizes every input to the node shape: `id`, `intent`, `change_spec`, `acceptance_criteria`.

- **DAG node.** Fields pass through unchanged. Criteria provenance is `dag`. The worktree is the one the supervisor created.
- **Standalone task.** The lead authors the fields. Provenance is `authored`. The run creates its own worktree. Before planning, it runs pies-decompose-to-dag's two-PR, reviewer-budget, and intent-smell attacks on the single node.
- **Two-PR failure.** A standalone task that names two independently valuable mergeable PRs stops and recommends `pies-decompose-to-dag`.
- **Plan output.** No longer restates `change_spec` or `acceptance_criteria`. Changes to criteria follow ADR-007.

## Options Considered

### Option A: Plan authors criteria in every run (original)
**Pros:** Simple.
**Cons:** DAG criteria can be silently softened. Standalone criteria get no scrutiny.

### Option B: Normalize with provenance (chosen)
**Pros:** Output shows whether the gate was self-set. pies-decompose-to-dag and pies share one definition of a well-formed unit.
**Cons:** One more stage.

## Consequences

- Standalone runs with `authored` criteria are the weakest case and are visible as such in output.
- The work-kind classification (ADR-005) runs in this same stage.
