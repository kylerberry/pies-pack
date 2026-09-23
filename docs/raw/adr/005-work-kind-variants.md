# ADR-005: Work kind selects the procedure variant

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

PIES runs one procedure, red tests then green, for every node. pstack routes mostly by kind of work (bug fix, perf, refactor, feature, investigation), and the procedures differ. Red-first is wrong for a behavior-preserving refactor: it produces vanity tests or gets skipped, and the evaluator rejects vanity tests, so the loop churns.

Routing by size already exists and works: the operator chooses pies-decompose-to-dag or pies, and a standalone task failing the two-PR test escalates to a DAG (ADR-004).

## Decision

Normalization classifies each node as one kind, which selects the Implement and verification variant:

| Kind | Implement variant |
|---|---|
| Feature | Red tests against criteria, then green |
| Bug | Red test that reproduces the reported symptom, then green |
| Refactor | Existing tests green throughout; behavior preservation is the criterion |

Classification happens at run time. The DAG schema stays at five fields. Perf is added when a perf task shows the loop doing the wrong thing.

## Options Considered

### Option A: One procedure for all work (original)
**Cons:** Refactors fail by construction.

### Option B: Central router skill
**Cons:** Size routing does not need centralizing. Adds a file without changing any decision.

### Option C: Kind classification inside normalization (chosen)
**Pros:** Reuses a stage that already runs. Works for DAG and standalone input.

## Consequences

- New kinds are added from observed failures, not anticipated ones.
