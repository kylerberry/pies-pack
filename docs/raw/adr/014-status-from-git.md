# ADR-014: Node status derived from git

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

The DAG regularly becomes a work checklist, and agents get lost finding the next item until they scan git history. Stored status (in `dag.json` or per-node files) is a second source of truth that drifts: a reverted merge still reads as done. Status files written inside a worktree are invisible on the base branch until merge.

## Decision

- `dag.json` keeps five node fields. No status field.
- The supervisor merges each node with `--no-ff`, and the merge commit's final paragraph carries a `Node: <id>` trailer.
- `scripts/dag-next` reads trailers from `git log --first-parent <branch>` to get the done set, and prints the ready frontier: nodes not done whose dependencies are all done.
- The supervisor uses `dag-next` for readiness, so a new supervisor session can resume a DAG.
- In-flight state belongs to whoever launched the nodes. Nodes never write shared status.
- If a merge is squashed, the trailer must be on the squash commit.

## Options Considered

### Option A: Status field in dag.json
**Cons:** Parallel edits conflict. Drifts from reality.

### Option B: Per-node status files
**Cons:** File clutter. Still a second source of truth.

### Option C: Derived from git (chosen)
**Pros:** Cannot drift. Reverts undo done automatically. No new files.

## Consequences

- Failed nodes are not in git and stay in the frontier, which is correct: they are still next. Why they failed lives in their output (ADR-012).
- Standalone runs need no trailer.

## Action Items

1. [x] Write `scripts/dag-next`.
2. [x] Add the trailer and `--no-ff` to the supervisor merge step.
