# ADR-001: Hands-off operation, comprehension over diff review

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

PIES has been run in two modes. Hands-on: review each node diff in a file viewer or question the agent. Hands-off: review only at wave boundaries, or not at all. Approval auto-commits and merges.

Diff review does not scale with parallel nodes, and teams are already shipping agent code without line-by-line review. pstack's author describes working detached from the code output and built `teach`, `how`, and `why` to rebuild comprehension rather than to support inspection.

## Decision

Design PIES for hands-off operation. Human effort goes into comprehension artifacts, not diff review:

- The node output contract (ADR-012).
- A cumulative wave-boundary brief (open question).
- The long-lived PM session, which reads those artifacts and asks questions.

Hands-on review remains available by running `pies` or `pies-execute-dag` without `--afk` (ADR-018). It is not the design target.

## Options Considered

### Option A: Hands-on per-node review
**Pros:** Human catches what agents miss. No new artifacts needed.
**Cons:** Throughput bounded by reading speed. Reviewer fatigue makes late-wave reviews shallow.

### Option B: Hands-off with a comprehension loop (chosen)
**Pros:** Throughput bounded by verification, not reading. Human understanding is maintained at the product level.
**Cons:** Evaluation becomes the merge authority, so its failure modes become the system's.

### Option C: Two separately designed loops
**Pros:** Each mode optimized for itself.
**Cons:** Two procedures to maintain. The same node behaves differently depending on who is watching.

## Consequences

- Evaluation is the only gate between a worker's diff and the base branch. ADR-008, ADR-011, and ADR-012 carry that weight.
- Node output must be readable without the diff.
- A wave brief is needed and is not yet designed.

## Action Items

1. [ ] Design the wave-boundary brief.
2. [ ] Validate on one real node by reading only its output contract before merging.
