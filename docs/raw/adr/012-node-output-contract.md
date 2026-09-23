# ADR-012: Node output contract, failure as a field

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

In hands-off operation the node's return value is what a human reads. The supervisor's result table already has an evidence column.

Building failure-handling control flow before failures are observed has repeatedly produced machinery that did not match the real problem. `pies-execute-dag` already handles failure at the supervisor level: freeze transitive dependents, one integration retry.

## Decision

Every run returns the same contract:

- **Capability proved.** What a user or caller can now do.
- **Proof.** Surface, command, and observed result (ADR-008).
- **Criteria disposition.** Each criterion marked met, settled by prototype, or unfalsifiable as written, plus amendments (ADR-007).
- **Decision trail.** Forks encountered and what settled them.
- **Inheritance.** What the next engineer owning this code needs to know.
- **Unproved.** Anything the run could not prove.

pies adds no failure-handling control flow. A run that cannot prove itself says so in the Unproved field and does not report success. Supervisor-level freeze and retry are unchanged.

## Options Considered

### Option A: Retry ceilings and scope narrowing inside pies
**Cons:** Designed before the failure pattern is known.

### Option B: Legible failure only (chosen)
**Pros:** Failures reveal themselves. Control flow is added later from evidence.

## Consequences

- An unfillable field is the early warning that a node went wrong.
- The supervisor's evidence column reads from this contract.
