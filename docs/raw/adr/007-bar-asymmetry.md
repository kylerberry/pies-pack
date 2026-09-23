# ADR-007: Criteria and verification config: add freely, weaken on record

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

Acceptance criteria are written by a model before any code runs, so they are assumptions. Planning will find gaps. The verification config (`pies.config`) is likewise model-extensible when an agent finds a missing tool.

Both are the bar a node is judged against. In hands-off operation, an agent that can lower its own bar silently can pass anything.

## Decision

Treat criteria and verification config the same way, by direction of change:

- **Add or tighten.** Allowed without ceremony.
- **Weaken or remove.** Allowed only as a recorded amendment in the node output, with the evidence that justified it.

## Options Considered

### Option A: Criteria read-only from the node
**Cons:** Real gaps found during planning cannot be fixed.

### Option B: Criteria and config freely editable
**Cons:** The gate moves under the run. Nobody notices in hands-off mode.

### Option C: Direction-dependent rule (chosen)
**Pros:** Gaps get fixed. Every lowering of the bar is visible and justified.

## Trade-off Analysis

This mirrors the orchestrator's retry ceiling, where per-class overrides may only lower the ceiling. Here the protected quantity is the bar, so only raising it is free.

## Consequences

- Amendments are the first thing to read in a node's output.
