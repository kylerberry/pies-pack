# ADR-010: Deletion-only simplifier stage

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

The evaluator checks for the smallest necessary diff, but checking and fixing are different jobs. A bloated diff fails evaluation and returns to the worker that wrote it. Flavio Copes' fstack uses a code-simplifier agent whose only task is removing what is not needed. pstack spreads the same intent across laziness-protocol, subtract-before-you-add, and deslop.

## Decision

After the worker reaches green and before evaluation, a simplifier removes anything the criteria do not require.

- Its only permitted action is deletion.
- It may not delete a test that covers an acceptance criterion.
- It runs on a different model from the worker.
- Verification re-runs after it finishes.

## Options Considered

### Option A: Evaluator flags, worker fixes (original)
**Cons:** Costs an evaluation round. The worker is poor at seeing its own excess.

### Option B: Dedicated deletion-only role (chosen)
**Pros:** A role that can only delete cannot add scope.

## Consequences

- Fewer evaluation rounds spent on diff size.
