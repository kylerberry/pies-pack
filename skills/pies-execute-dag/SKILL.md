---
name: pies-execute-dag
description: Execute an approved PIES dag.json with depth-2 node leads, wave barriers, Git-derived status, serial no-ff merges, failure freezing, learning consolidation, and cumulative wave briefs. Accepts --afk; merge approval is otherwise required.
---

# PIES: execute DAG

You are the long-running **supervisor**. Dispatch leads, merge, verify integration, consolidate learnings, and maintain the wave brief. Never plan, implement, or review node code.

## Arguments and preconditions

Accept `pies-execute-dag [--afk] [dag.json]`; default path is `./dag.json`. Reject unknown flags. `--afk` permits autonomous merge; without it, human approval is required. Node escalation gates still stop in either mode. After approval, reconfigure `.pi/agents/pies-lead.md` to the ADR-015 escalation model and relaunch the node as `pies/<id>-attempt-2`; the supervisor never overrides configured models.

Require:

- explicit approval of the DAG;
- `meta.repo`, `meta.branch`, and five-field nodes;
- a clean base checkout at `meta.branch`;
- `<repo>/tmp/` ignored by Git; and
- `pies-dag-next --dag <path> --json` succeeds.

Do not store status in the DAG or node files. Before every wave, derive `done` and `ready` from first-parent Git history with `pies-dag-next`.

## Wave loop

A wave is the ready frontier at dispatch time. Launch at most three nodes. A node using a `shared-exclusive` verification surface runs alone; if applicability cannot be determined before planning, serialize ready nodes until it can. Do not admit newly unblocked nodes until every launched node is terminal and approved passing nodes are merged.

For each node:

1. Create branch `pies/<id>` and worktree `<repo>/tmp/worktree-<id>` from the current base head. Refuse unexpected existing paths or branches.
2. Write a bounded packet outside the repository containing only the node, worktree/base refs, `--afk` state, and output paths. Never include the full DAG, sibling payloads, transcripts, or secrets.
3. Launch fresh `pies-lead` in that worktree. It runs `pies` and may spawn only `scout`, `worker`, `pies-simplifier`, and `pies-evaluator`. Its children cannot spawn. Do not override configured models.
4. Require the complete node output contract. `Unproved` other than `None`, a missing field, or an incomplete child run is failure.

Use one async `workflowScript` with `runs.all` for each wave and stable keys such as `node-<id>-attempt-1`. Give each launch a short label. Pass packet paths through task text; never interpolate arbitrary node text into JavaScript source. The workflow returns per-node output references. A launch/runtime/tooling failure is an infrastructure blocker: report it and stop rather than changing execution mode.

Failed nodes freeze all transitive dependents. Leave failed, blocked, and unapproved worktrees intact.

## Merge gate

After the whole wave is terminal, present id, status, branch, worktree, diffstat, capability, proof, amendments, and unproved claims.

- Default: stop for approval. The user may approve all or a subset of passing nodes. Preserve every worktree until separate cleanup approval.
- `--afk`: merge every passing node serially.

Merge with `--no-ff`. The merge message's final paragraph must be `Node: <id>`. Preserve all verified node commits. After each merge, run every applicable base-branch check and affected real-surface proof from `pies.config.yaml`.

On conflict or red post-merge verification: undo that merge without discarding pre-existing dirt; recreate the node once from the new clean head as `pies/<id>-attempt-2` in `tmp/worktree-<id>-attempt-2`. A second integration failure freezes the node. Never continue from a red base.

In `--afk`, remove a successfully merged worktree and branch only after post-merge verification. In default mode, cleanup always needs explicit approval.

## Wave boundary

After merges:

1. Consolidate merged `.pies/learnings/<id>.md` files into the relevant `AGENTS.md` or configured memory sink. One supervisor writes; nodes never share a learning file.
2. Update `.pies/wave-brief.md` cumulatively. Lead with what users and maintainers can now do, then limits and proof. Use returned contracts for spawned work; use recall only for relevant work completed outside this fan-out or gaps in a contract. Edit the prior brief rather than rebuilding it.
3. Run `pies-dag-next` again and open the next wave.

## Terminal report

Report node, status, wave, attempts, worktree, changed files, capability/proof, frozen dependents and cause, merge order, retained worktrees, and next action. Delete temporary packets only after full success; retain them for diagnosis otherwise.
