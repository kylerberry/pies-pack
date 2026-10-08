---
name: pies-run-plan
description: Deliver an immutable PIES plan with current-base grounding, rolling admission, Git-derived completion, and human-gated merges. Accepts --afk and --barriered.
---

# PIES: run plan

Accept `pies-run-plan [--afk] [--barriered] <plan-id>`. Reject unknown flags. Resolve only an existing immutable bundle with `scripts/plan-bundle resolve --repo <repo> <plan-id>`; use its private `dag.json`. The plan ID is explicit approval to begin delivery. Do not re-show creation warnings or mutate the bundle.

Use the current clean base, not a code snapshot. Scout records the actual revision before each node. Require caller-selected active-node limit. `--afk` is the sole autonomous-publication opt-in; otherwise each passing node waits for human merge approval. `--barriered` snapshots a frontier; default rolling admission fills available capacity after every merge. Shared-exclusive verification remains serialized.

Before every admission, use the private helper `scripts/dag-next --dag <bundle>/dag.json --json`. Completion remains derived only from first-parent `Node: <id>` trailers. Create isolated worktrees and bounded node packets under the existing artifact root. Preserve packets, contracts, records, terminal evidence, and wave briefs.

A failed, blocked, timed-out, lost, or unproved node freezes only its transitive dependents; unrelated ready outcomes continue in rolling mode. Report passed, failed, frozen, and unproved outcomes plus retained worktrees and next action. Report-only research/codebase-analysis never becomes a plan outcome; reject it and recommend standalone `/pies` discovery.

This supervisor owns plan packets, scheduling, integration, evidence, and serial verified merges. Never invoke `/pies-fanout` for plan delivery.
