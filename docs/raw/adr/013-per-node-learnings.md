# ADR-013: Per-node learnings merged as code

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

Self-Improve records durable learnings, footguns, and gotchas discovered during implementation. It appended them to the domain's AGENTS.md. Parallel nodes in one wave all edit that file, so every merge after the first conflicts.

`pies-execute-dag` hard constraint 3: dependencies are merged code, not context. A node's packet never contains sibling transcripts.

## Decision

- Each node writes learnings to a unique file in the configured knowledge sink: a discovered repository-relative destination, or the `$HOME/.pies/learnings/<repo-basename>/` user-level fallback when no project-local sink is configured or discovered.
- The files merge with the node's code, so later nodes read them as merged code, consistent with hard constraint 3.
- Grounding reads resolved knowledge sources, always including the sink itself (ADR-006); it does not assume a fixed learning directory.
- After each successful merge, the supervisor verifies learning placement. It does not consolidate into a shared file, and learning verification does not require a scheduling barrier.

## Options Considered

### Option A: Shared AGENTS.md (original)
**Cons:** Guaranteed merge conflicts under parallelism.

### Option B: Per-node files (chosen)
**Pros:** Distinct paths never conflict. Satisfies the merged-code rule.

## Consequences

- Learning placement is verified after merge; no shared-file consolidation is required, so it never conflicts.
