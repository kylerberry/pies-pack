# ADR-013: Per-node learnings merged as code

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

Self-Improve records durable learnings, footguns, and gotchas discovered during implementation. It appended them to the domain's AGENTS.md. Parallel nodes in one wave all edit that file, so every merge after the first conflicts.

`pies-execute-dag` hard constraint 3: dependencies are merged code, not context. A node's packet never contains sibling transcripts.

## Decision

- Each node writes learnings to its own file in the repository.
- The files merge with the node's code, so later nodes read them as merged code, consistent with hard constraint 3.
- Grounding reads learnings from prior nodes (ADR-006).
- The supervisor consolidates learnings into AGENTS.md or a memory sink at the wave boundary, after the wave's merges.

## Options Considered

### Option A: Shared AGENTS.md (original)
**Cons:** Guaranteed merge conflicts under parallelism.

### Option B: Per-node files (chosen)
**Pros:** Distinct paths never conflict. Satisfies the merged-code rule.

## Consequences

- Consolidation happens once per wave, in one session, so it never conflicts.
