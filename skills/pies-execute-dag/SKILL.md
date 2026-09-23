---
name: pies-execute-dag
description: Execute an approved PIES dag.json with worktree isolation, wave barriers, Git-derived status, serial no-ff merges, failure freezing, learning consolidation, and cumulative wave briefs. Accepts --afk; merge approval is otherwise required.
---

# PIES: execute DAG

You are the long-running **supervisor**. Dispatch leads, merge, verify integration, consolidate learnings, and maintain the wave brief. Never plan, implement, or review node code.

## Arguments and preconditions

Accept `pies-execute-dag [--afk] [dag.json]`; default path is `./dag.json`. Reject unknown flags. `--afk` permits autonomous merge; without it, human approval is required. Node escalation gates still stop in either mode. After approval, reconfigure the global `pies-lead` binding to the ADR-015 escalation model and relaunch the node as `pies/<id>-attempt-2`; the supervisor never overrides configured models.

Require:

- explicit approval of the DAG;
- `meta.repo`, `meta.branch`, and five-field nodes;
- a clean base checkout at `meta.branch`;
- `<repo>/tmp/` ignored by Git; and
- `pies-dag-next --dag <path> --json` succeeds.

Do not store status in the DAG or node files. Before every wave, derive `done` and `ready` from first-parent Git history with `pies-dag-next`.

## Artifact location

Do not write PIES artifacts under the repository or any node worktree. At the start of the DAG run, derive one stable user-level artifact root shared by every worktree of the repository:

```text
$HOME/.pi/agent/pies/<repo-basename>-<first-12-hex-of-sha256(remote.origin.url)>
```

When no `remote.origin.url` exists, use the repository's Git common-directory path as the hash input. Call the resulting absolute path `PIES_ARTIFACT_ROOT`. Create `runs/`, `learnings/`, and `waves/` beneath this root. Use the same derivation required by `pies`, so node leads receive and use the identical root. All packets, node reports, wave briefs, and learnings use absolute paths below it; never use a worktree-local `.pies/` directory.

## Execution boundary

This skill defines node inputs, artifacts, terminal evidence, and wave barriers—not how a lead is launched. The invoking prompt selects the execution mechanism and establishes one isolated node lead in the assigned worktree. It must deliver the bounded packet and required artifact paths; otherwise record an infrastructure failure and stop. Do not require or record mechanism-specific process, pane, workspace, or UI state.

## Wave loop

A wave is the ready frontier at dispatch time. Launch at most three nodes. A node using a `shared-exclusive` verification surface runs alone; if applicability cannot be determined before planning, serialize ready nodes until it can. Do not admit newly unblocked nodes until every launched node has a supervisor terminal record and approved passing nodes are merged.

For each node attempt:

1. Create branch `pies/<id>` and worktree `<repo>/tmp/worktree-<id>` from the current base head. Refuse unexpected existing paths or branches.
2. Create `<PIES_ARTIFACT_ROOT>/runs/<id>/attempt-<n>/` with `packet.md`, `heartbeat.json`, phase checkpoints, `node-contract.md`, `supervisor.json`, and `terminal.json`. The supervisor owns these paths.
3. Write a bounded packet containing only the normalized node, worktree/base refs, `--afk`, phase deadlines/inactivity thresholds, and absolute artifact paths. Never include sibling packets, the full DAG, transcripts, or secrets.
4. Establish the node lead in the node worktree. Record branch, worktree, base SHA, and any mechanism-neutral run reference in `supervisor.json`. Reject a cwd mismatch as infrastructure failure.
5. Give the lead the packet path. It runs `pies`, follows its phase bindings, and atomically publishes `heartbeat.json`, checkpoints, and its final complete `node-contract.md`. A delivery receipt or completion indication is not success.
6. At every phase inactivity threshold, require a fresh valid heartbeat. Record observations in `supervisor.json`. On a deadline or stale heartbeat, request a checkpoint and stop the active execution through the mechanism selected by the invoking prompt after a recorded grace period. Preserve artifacts before every escalation.

Execution state is observation only. A node is terminal only when the supervisor writes and validates `terminal.json`:

- `passed`: execution is settled; atomic complete contract; `Unproved: None`; required lead/second-opinion acceptance; and captured Git/worktree evidence.
- `failed`: contract has `Unproved`, missing required acceptance, or a verification failure.
- `blocked`: a required human gate is reported or the contract says blocked.
- `timed_out`, `cancelled`, or `lost`: stale/deadline/cancellation/execution-loss evidence, or settled execution without a valid contract.

Write `<PIES_ARTIFACT_ROOT>/waves/wave-<n>-barrier.json` after every launched node is terminal. It records attempt identity, status history, any mechanism-neutral run reference, contract hash, Git evidence, and terminal classification. Only `passed` nodes are eligible for the merge gate. Every other classification freezes transitive dependents and retains its worktree, branch, packet, checkpoints, contract, and observations.

## Merge gate

After the whole wave is terminal, present id, status, branch, worktree, diffstat, capability, proof, amendments, and unproved claims.

- Default: stop for approval. The user may approve all or a subset of passing nodes. Preserve every worktree until separate cleanup approval.
- `--afk`: merge every passing node serially.

Merge with `--no-ff`. The merge message's final paragraph must be `Node: <id>`. Preserve all verified node commits. After each merge, run every applicable base-branch check and affected real-surface proof from `pies.config.yaml`.

On conflict or red post-merge verification: undo that merge without discarding pre-existing dirt; recreate the node once from the new clean head as `pies/<id>-attempt-2` in `tmp/worktree-<id>-attempt-2`, then establish a fresh isolated lead with a new attempt root. A second integration failure freezes the node. Never continue from a red base.

In `--afk`, remove a successfully merged worktree and branch only after post-merge verification. In default mode, cleanup always needs explicit approval.

## Wave boundary

After merges:

1. Consolidate merged `<PIES_ARTIFACT_ROOT>/learnings/<id>.md` files into the relevant `AGENTS.md` or configured memory sink. One supervisor writes; nodes never share a learning file.
2. Update `<PIES_ARTIFACT_ROOT>/waves/wave-brief.md` cumulatively. Lead with what users and maintainers can now do, then limits and proof. Use returned contracts for spawned work; use recall only for relevant work completed outside this fan-out or gaps in a contract. Edit the prior brief rather than rebuilding it.
3. Run `pies-dag-next` again and open the next wave.

## Terminal report

Report node, status, wave, attempts, worktree, changed files, capability/proof, frozen dependents and cause, merge order, retained worktrees, and next action. Delete temporary packets only after full success; retain them for diagnosis otherwise.
