---
name: pies-execute-dag
description: Execute an approved PIES dag.json with worktree isolation, Git-derived status, rolling ready-frontier admission, optional barriered groups, serial verified merges, learning verification, and cumulative briefs. Accepts --afk and --barriered; merge approval is otherwise required.
---

# PIES: execute DAG

You are the long-running **supervisor**. Dispatch leads, merge, verify integration, verify durable learning placement, and maintain the cumulative brief. Never plan, implement, or review node code.

## Arguments and preconditions

Accept `pies-execute-dag [--afk] [--barriered] [dag.json]`; default path is `./dag.json`. Reject unknown flags.

- `--afk` permits autonomous merge; without it, human approval is required for each passing node.
- `--barriered` preserves the conservative batch policy: admit only the frontier snapshot, then wait for that group to become terminal before admitting newly unblocked work.
- Without `--barriered`, use a rolling frontier: after every merge, recompute readiness and admit newly ready nodes up to the active-node limit the caller selected for this run.
- A `shared-exclusive` verification surface always runs alone, regardless of mode.
- Node escalation gates still stop in either mode. After approval, reconfigure the global `pies-lead` binding to the ADR-015 escalation model and relaunch the node as `pies/<id>-attempt-2`; the supervisor never overrides configured models.

Require:

- explicit approval of the DAG;
- `meta.repo`, `meta.branch`, and five-field nodes;
- a clean base checkout at `meta.branch`; and
- `pies-dag-next --dag <path> --json` succeeds.

Do not store status in the DAG or node files. Before every admission decision, derive `done` and `ready` from first-parent Git history with `pies-dag-next`.

## Artifact location

Do not write PIES artifacts under the repository or any node worktree. At the start of the DAG run, derive one stable user-level artifact root shared by every worktree of the repository:

```text
$HOME/.pies/<category>/<repo-basename>/
```

Derive `<repo-basename>` from the repository's main checkout — the basename of the parent of `git rev-parse --git-common-dir` — never from the current worktree's directory name. Call `$HOME/.pies` `PIES_ARTIFACT_ROOT`. Create `runs/<repo-basename>/` and `waves/<repo-basename>/` beneath it as needed. Use the same derivation required by `pies`, so node leads receive and use the identical root. All packets, node reports, and cumulative briefs use absolute paths below it; never use a worktree-local `.pies/` directory.

## Execution boundary

This skill defines node inputs, artifacts, terminal evidence, merge discipline, and admission policy—not how a lead is launched. The invoking prompt selects the execution mechanism and establishes one isolated node lead in the assigned worktree. It must deliver the bounded packet and required artifact paths; otherwise record an infrastructure failure and stop. Do not require or record mechanism-specific process, pane, workspace, or UI state.

## Admission and terminal handling

A DAG defines semantic dependencies; a barrier is only an execution policy. Before dispatch, the caller selects the maximum active nodes for this run. Record that runtime choice in `supervisor.json`; it is not DAG data and PIES has no numeric default. If the caller has not selected a limit, ask before dispatch. A `shared-exclusive` verification surface still runs alone.

1. Use `pies-dag-next` to identify ready nodes.
2. In rolling mode, admit ready nodes until the caller-selected active-node limit is reached. In barriered mode, snapshot the ready frontier and do not admit newly ready work until that group reaches a terminal state.
3. For each admitted attempt, create branch `pies/<id>` and worktree `$HOME/.worktrees/<repo-basename>/worktree-<id>` from the current base head. Refuse unexpected existing paths or branches.
4. Reserve `<PIES_ARTIFACT_ROOT>/runs/<repo-basename>/<id>/attempt-<n>/` for `packet.md`, `heartbeat.json`, phase checkpoints, `node-contract.md`, `run-record.json`, `supervisor.json`, and `terminal.json`. The supervisor owns `packet.md`, `supervisor.json`, and `terminal.json`; the lead owns the node contract and compact run record.
5. Write a bounded packet containing only the normalized node, worktree/base refs, `--afk`, phase deadlines/inactivity thresholds, and absolute artifact paths. Never include sibling packets, the full DAG, transcripts, or secrets.
6. Establish the node lead in the node worktree. Record branch, worktree, base SHA, and any mechanism-neutral run reference in `supervisor.json`. Reject a cwd mismatch as infrastructure failure.
7. Give the lead the packet path. It runs `pies`, follows its phase bindings, and atomically publishes `heartbeat.json`, checkpoints, its final complete `node-contract.md`, and `run-record.json`. A delivery receipt or completion indication is not success.
8. At every phase inactivity threshold, require a fresh valid heartbeat. Record observations in `supervisor.json`. On a deadline or stale heartbeat, request a checkpoint and stop active execution through the mechanism selected by the invoking prompt after a recorded grace period. Preserve artifacts before every escalation.

Execution state is observation only. A node is terminal only when the supervisor writes and validates `terminal.json`:

- `passed`: execution is settled; atomic complete contract and lead-owned `run-record.json`; `Unproved: None`; required lead/second-opinion acceptance; and captured Git/worktree evidence.
- `failed`: contract has `Unproved`, missing required acceptance, a verification failure, or lacks a complete lead-owned run record.
- `blocked`: a required human gate is reported or the contract says blocked.
- `timed_out`, `cancelled`, or `lost`: stale/deadline/cancellation/execution-loss evidence, or settled execution without a valid contract.

A non-passing node freezes only its transitive dependents. Preserve its worktree, branch, packet, checkpoints, contract, run record, and observations. It does not block unrelated ready work in rolling mode.

In barriered mode, write `<PIES_ARTIFACT_ROOT>/waves/barrier-<n>.json` after every admitted group is terminal. It records attempt identities, status histories, mechanism-neutral run references, contract hashes, Git evidence, and terminal classifications.

## Merge and admission gate

For each passing node, present id, status, branch, worktree, diffstat, capability, proof, amendments, and unproved claims.

- Default: stop for explicit approval of that node. Preserve its worktree until separate cleanup approval.
- `--afk`: merge the passing node serially.

Merge with `--no-ff`. The merge message's final paragraph must be `Node: <id>`. Preserve all verified node commits. After each merge, run every applicable base-branch check and affected real-surface proof from `pies.config.yaml`.

On conflict or red post-merge verification: undo that merge without discarding pre-existing dirt; recreate the node once from the new clean head as `pies/<id>-attempt-2` in `$HOME/.worktrees/<repo-basename>/worktree-<id>-attempt-2`, then establish a fresh isolated lead with a new attempt root. A second integration failure freezes the node. Never continue from a red base.

After every successful merge:

1. Verify the node's durable learning landed in its configured knowledge sink, including the `$HOME/.pies/learnings/<repo-basename>/` fallback when no project-local sink was discovered.
2. Update `<PIES_ARTIFACT_ROOT>/waves/<repo-basename>/wave-brief.md` cumulatively. Lead with what users and maintainers can now do, then limits and proof. Use returned contracts for spawned work; use recall only for relevant work completed outside this fan-out or gaps in a contract. Edit the prior brief rather than rebuilding it.
3. In rolling mode, rerun `pies-dag-next` and admit newly ready work until the caller-selected active-node limit is reached. In barriered mode, wait until the admitted group is terminal and resolved before opening the next group.

In `--afk`, remove a successfully merged worktree and branch only after post-merge verification. In default mode, cleanup always needs explicit approval.

## Terminal report

Report scheduling mode, node status, merge order, ready and frozen dependents, retained worktrees, capability/proof, and next action. Delete temporary packets only after full success; retain them for diagnosis otherwise.
