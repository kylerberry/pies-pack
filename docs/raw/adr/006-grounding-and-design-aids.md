# ADR-006: Grounding and design aids

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

The original Plan stage had no recon step. DAG nodes carry context already paid for by decomposition; standalone tasks carry none, and what context exists is scattered across the surface the request came from. pstack provides `recall`, a Prototype playbook, and `architect` for these gaps.

`architect` in full is heavy: four arena runners and at least two structurally distinct designs. pstack triggers it only when code crosses a function boundary, and skipping is logged.

## Decision

- **Every run.** Scout the affected code and read learnings left by prior nodes (ADR-013).
- **Standalone runs.** Also run `recall` to rebuild context from chat history and the shared record.
- **During Plan, by trigger.** A fork that could be settled by observing behavior, timing, layout, or output is prototyped rather than guessed. Code crossing a function boundary gets a types-and-signatures sketch rather than prose steps.
- **Skips.** A trivial task skips grounding with a logged reason. Trivial means it passes pies-decompose-to-dag's reviewer-budget test easily and touches one function.

## Options Considered

### Option A: No grounding (original)
**Cons:** Plans from assumptions, which is the failure progressive capability slicing was meant to fix.

### Option B: Full pstack grounding on every run
**Cons:** Pays architect and recall costs on nodes that do not need them.

### Option C: Always scout, trigger the rest (chosen)
**Pros:** Cost scales with the node. Skips stay visible.

## Consequences

- Plans for boundary-crossing code are compilable sketches.
- Probe nodes from decomposition remain the mechanism for material uncertainty across nodes; in-node prototyping is for local forks only.
