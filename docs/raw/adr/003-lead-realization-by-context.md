# ADR-003: Node lead as a context role

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

ADR-002 requires a lead that holds grounding, plan, review, and evaluation context while a worker writes code. The prior decision bound that role to nested session topology. A direct PIES retry showed that an aggregate nested lead can time out across otherwise separable phases; extending its aggregate timeout did not address stalled recovery.

Session hosting, fan-out, and process lifecycle are operational choices. Binding them into the skill makes PIES depend on one launcher rather than the evidence a node must produce.

## Decision

Define the lead by responsibility and context, not by launch topology.

- In an ordinary `/pies` run, the initiating session is the lead.
- In DAG mode, the invoking prompt establishes one isolated node lead in the assigned worktree.
- The lead runs `pies`, retains grounding through planning, review, and evaluation, and never writes production code.
- The node packet, heartbeat, checkpoints, and final output contract are file-backed and mechanism-neutral.
- `pies-execute-dag` defines worktree isolation, node artifacts, terminal evidence, and wave barriers. The invoking prompt selects the execution mechanism.
- The lead's implementation phases remain defined only in `pies/SKILL.md`.

## Options Considered

### Option A: Bind PIES to a nested lead topology
**Pros:** A concrete launch recipe.
**Cons:** Aggregate lifecycle failures become PIES failures. The skill cannot work under another safe runner.

### Option B: Define a lead context role; leave hosting to the invoking prompt (chosen)
**Pros:** One lead behavior for direct and DAG work. Evidence and wave barriers remain stable across runners. Operational failures stay visible as infrastructure failures.
**Cons:** The invoking prompt must supply a safe isolated execution mechanism.

## Consequences

- Ordinary `/pies` does not add an intermediate lead layer.
- DAG node leads must receive an isolated worktree and bounded packet.
- A runner cannot prove node success: only a complete, validated node contract can.
- Hosting-specific health and cancellation behavior belongs in the invoking prompt or runner configuration, not PIES skills.

## Revisit when

The mechanism-neutral packet, heartbeat, checkpoint, and contract protocol repeatedly fails to provide recoverable node evidence across supported runners.

## Action Items

1. [x] Update `pies` so the initiating session is the direct-run lead.
2. [x] Update `pies-execute-dag` so it defines node evidence and barriers, not hosting.
3. [ ] Prove the artifact protocol with a disposable DAG lifecycle test before relying on a new runner in production.
