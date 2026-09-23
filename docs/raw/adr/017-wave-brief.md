# ADR-017: Wave brief written by the PM session

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

Hands-off operation (ADR-001) replaces diff review with comprehension artifacts. Node output contracts (ADR-012) describe one node each. Nothing yet describes what the product does after a wave.

The operator runs a long-lived PM session and tells it to execute the DAG. That session is the supervisor (ADR-003); "PM session" and "supervisor" name the same session. Some work also runs in separate pi sessions the PM did not spawn.

## Decision

The PM session writes a wave brief at each wave boundary, after merges and learnings consolidation (ADR-013).

- **Sources.** For nodes the PM spawned, the returned output contracts. For work run in sessions outside its own fan-out, `recall` over those sessions.
- **Form.** Cumulative. Each wave's brief is an edit of the previous brief, not a rebuild, so reading it stays bounded as the codebase grows.
- **Framing.** What the product now does, written for its users and its maintainer, before any implementation detail.
- **Storage.** A file in the repository. The PM reads the previous brief from the file rather than carrying past waves in its context.

## Options Considered

### Option A: Supervisor script generates it from contracts only
**Cons:** Misses work done outside the DAG.

### Option B: PM session writes it, using recall where it lacks contracts (chosen)
**Pros:** The PM is already the comprehension session. Covers DAG and non-DAG work.
**Cons:** The PM's context grows each wave unless the brief lives in a file.

## Trade-off Analysis

Output contracts are compact and structured; transcripts are large. `recall` is for sessions without a contract, or for answering a question a contract leaves open, not a default source.

## Consequences

- The brief's quality depends on output contract quality, which is another reason to enforce ADR-012.
