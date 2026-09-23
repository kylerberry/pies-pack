# Herdr Pi node-session lifecycle proof

**Scope.** This assesses only whether a DAG supervisor can use one durable, isolated Herdr-managed Pi session per node instead of nesting a `pies-lead` subagent. It does not change PIES, Herdr, Pi, settings, or worktrees.

**Verdict:** **PARTIALLY PROVED**. Herdr 0.9.1 can create/open a worktree workspace, start and address a Pi agent at an explicit cwd, expose its session path and lifecycle state, accept cancellation keys, and report pane/process exit. Pi persists an independently addressable session transcript. This is enough to replace the aggregate nested-lead *execution container*, provided the supervisor treats a completed, validated file-backed node contract—not Herdr `idle`/`done`—as terminal success.

The replacement is not fully proved because Herdr exposes state transitions, not a phase heartbeat or a durable completion record; `idle` and `done` only mean ready for input, and `unknown` is explicitly non-terminal. An end-to-end node-session run was not performed because this task prohibits changing target worktrees. The proposed protocol closes those gaps with supervisor-owned observation records and node-written atomic checkpoints/contracts, but their implementation has not been exercised here.

## Evidence collected

| Area | Evidence | What it establishes |
|---|---|---|
| Installed runtime | `herdr status server` reported **running**, version **0.9.1**, private protocol **22**, endpoint compatible. `herdr --version` reported `herdr 0.9.1`. | The local server and CLI are compatible for the APIs below. |
| Worktree lifecycle | `herdr worktree create --help` exposes `--cwd`, `--branch`, `--base`, `--path`, `--label`, `--no-focus`; `herdr worktree open` and `remove` exist. Runtime `herdr worktree list` returned linked checkout path, branch, and `open_workspace_id`. The API schema exposes `worktree.create`, `.open`, `.list`, `.remove` and corresponding events. | The supervisor can create an isolated checkout and retain its path/workspace handle. |
| Spawn at node cwd | The local Herdr skill documents `herdr agent start <name> --kind pi --pane <id>` in an available shell pane. The tool/API surface exposes `herdr_start_agent({name, agent:"pi", cwd, workspaceId, ...})`; its contract says it starts a Pi pane and returns pane/state. | A dedicated Pi process can be created for a node cwd, distinct from a nested subagent run. |
| Cwd and Pi transcript identity | `herdr agent list` returned each Pi's `cwd`, `foreground_cwd`, `pane_id`, unique name, `agent_status`, `state_change_seq`, and `agent_session.value` absolute JSONL path. One existing worktree Pi reported the worktree cwd and a session file stored under Pi's session directory. | Supervisor can bind node id → worktree path → Herdr pane/name → Pi transcript path. |
| Pi persistence | Pi [`docs/sessions.md`](file:///Users/kylerberry/.nvm/versions/node/v24.18.0/lib/node_modules/@earendil-works/pi-coding-agent/docs/sessions.md) says sessions auto-save as JSONL organized by cwd. [`docs/session-format.md`](file:///Users/kylerberry/.nvm/versions/node/v24.18.0/lib/node_modules/@earendil-works/pi-coding-agent/docs/session-format.md) specifies a durable header with `cwd` and a tree of timestamped entries. | The node conversation survives pane inspection/restart independently of Herdr scrollback. It is diagnostic evidence, not acceptance evidence. |
| Prompting and state | `agent.prompt`, `agent.wait`, `agent.get`, `agent.read`, `agent.list`, `agent.send_keys` are exposed by the local CLI and tool surface. The Herdr skill states a waited prompt must first show `working` or `blocked`; `agent.wait` can wait for `idle`, `done`, `blocked`, or explicit `unknown`. | The supervisor can submit the packet, observe UI blockade, wait for lifecycle changes, and inspect output. |
| State meaning limitation | The local Herdr skill defines `idle` and `done` as ready for input; `blocked` as recognized approval/question UI; `unknown` as unconfident classification that **does not prove completion**. | Herdr status cannot be the wave success gate. |
| Cancellation and exits | CLI/API provide `agent.send-keys` and `pane.close`; tool surface provides `herdr_send_keys` and destructive `herdr_close_pane`. API schema also lists `pane.exited`, `pane.closed`, `pane.agent_status_changed`, and `events.subscribe`/`events.wait`. | A supervisor can request graceful abort (`esc`, then `ctrl+c`) and, after a preservation checkpoint deadline, terminate the node pane. It can observe the pane exit/close event when using the raw API/event stream. |
| Wave visibility | `session.snapshot`, `agent.list`, `agent.get`, `pane.get`, and `pane.read` exist. The local snapshot contained all agents, their cwd/session identifiers/statuses, workspaces, and panes. | The supervisor can retain an evidence snapshot at dispatch, checkpoints, cancellation, and barrier. |
| Pi settle semantics | Pi [`docs/extensions.md`](file:///Users/kylerberry/.nvm/versions/node/v24.18.0/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md) describes `agent_settled` as the final notification after retries, compaction, and queued input; `agent_end` is not final. | If later adding a node-local Pi extension, `agent_settled` is the right point to *attempt* a final contract write. It still must not replace external validation of that file. |

The authoritative local Herdr operating guidance is `/tmp/herdr-skill.md` from `herdr --skill`; it also states that completion transcript recovery can be incomplete for alternate-screen applications and recommends a requested file as fallback. This further supports file-backed contracts over pane output.

## Lifecycle design

All paths below are absolute. `R` means the pre-existing `PIES_ARTIFACT_ROOT`; `N` is the node id; `A` is the attempt number. The supervisor owns `R/runs/N/attempt-A/`; the node receives the paths but must not choose them.

### 1. Supervisor creates the isolated execution location

1. Create `pies/N` from the wave base through `worktree.create` (or create it using the existing PIES Git procedure, then use `worktree.open`). Record: base SHA, branch, checkout path, Herdr workspace id, timestamp, and command/API result in `R/runs/N/attempt-A/supervisor.json`.
2. Fail before dispatch if the branch/path pre-exists unexpectedly or the worktree cannot be opened. Do not fall back to a shared cwd.
3. Create a unique, stable Herdr agent name such as `pies-N-aA` (normalize to Herdr's `[a-z][a-z0-9_-]{0,31}` requirement). Start `pi` with `cwd=<worktree>` and `workspaceId=<worktree workspace>` using `herdr_start_agent`, or split/open the worktree shell then call `agent.start --kind pi`.
4. Capture the returned pane id and name. Immediately call `agent.get`/`agent.list`; require both reported `cwd` and `foreground_cwd` to equal the intended worktree. Capture `agent_session.value` when Herdr detects it. A mismatch is an infrastructure failure, not a node failure.

### 2. Packet and contract paths

Write the bounded packet before sending the prompt:

```text
R/runs/N/attempt-A/packet.md
R/runs/N/attempt-A/plan.md                 # node creates during planning
R/runs/N/attempt-A/heartbeat.json          # node overwrites atomically at phase boundaries
R/runs/N/attempt-A/checkpoint-<phase>.md   # node writes before an imposed stop
R/runs/N/attempt-A/node-contract.md        # required final contract, atomically published
R/runs/N/attempt-A/supervisor.json         # append-only supervisor observations
R/runs/N/attempt-A/terminal.json           # supervisor's final classification
```

The packet contains only the normalized node fields, worktree/base refs, `--afk`, phase deadlines/inactivity thresholds, and those absolute paths. It names `node-contract.md` as the sole final-output path and requires an atomic publication (`write temporary sibling`, validate nonempty, `rename`). It must not include sibling packets, a whole DAG, transcripts, or secrets.

Send a fixed instruction plus the packet path through `agent.prompt`:

> Act as the PIES lead for this one node. Read only the packet at `<packet>`. Work only in its stated worktree. Maintain the required heartbeat/checkpoints. Before final response, atomically write the complete PIES Node contract to `<node-contract.md>`. A chat response, `idle`, or `done` without that validated file is failure.

The prompt receipt is dispatch evidence only. Herdr's own guidance states successful submission does not prove that the agent completed the work.

### 3. Health and inactivity observation

At dispatch, save a snapshot (`agent.get` plus `session.snapshot`/`agent.list`) into `supervisor.json`. Observe each running node at least at its PIES phase inactivity threshold.

Health is the conjunction of:

1. **Herdr liveness:** name/pane still exists; `agent_status` is not `unknown`; `cwd` remains the target; and state transitions/output can be read.
2. **Node progress:** `heartbeat.json` is valid JSON, has `node`, `attempt`, `phase`, `updated_at`, `checkpoint_path`, and its mtime/timestamp is within the phase's threshold.
3. **Artifact integrity:** packet, plan once planned, and any promised phase checkpoint exist under the attempt root; no terminal contract is accepted yet.

A heartbeat contains no secrets and can be minimal:

```json
{"node":"N","attempt":1,"phase":"worker","updated_at":"2026-09-22T21:30:00Z","checkpoint_path":"/absolute/.../checkpoint-worker.md"}
```

`state_change_seq` is useful correlation evidence, but it has no timestamp or progress meaning in observed responses, so it must not replace the heartbeat. `agent.read` may reveal activity but is not durable and may omit alternate-screen history. A stale/missing heartbeat is **inactive**, even if Herdr still says `working`.

### 4. Cancellation and preservation

For an inactivity or phase-deadline breach:

1. Append a supervisor observation with time, last health evidence, deadline, and the exact reason. Read current agent output and, if present, the Pi session JSONL path; do not use either as acceptance proof.
2. Send a single explicit checkpoint request through `agent.prompt` only if the agent is not blocked, with a short, recorded grace period: write `checkpoint-<phase>.md` and heartbeat, stop editing, then report. If the agent is blocked, record the blocking UI and do not answer it without the required human decision.
3. Ask for graceful cancellation with `agent.send_keys(..., ["esc"])`; if still active after the recorded grace interval, send `ctrl+c`.
4. If process termination is required, first preserve the latest artifacts and observations, then use `pane.close`/`herdr_close_pane` on the node pane only. Never close a workspace, session, or pane not created for that node.
5. Mark `terminal.json` `cancelled` or `timed_out`; retain the worktree, packet, plan, heartbeat, checkpoint, transcript path, and supervisor evidence. Do not remove the worktree or branch.

A cancellation result is not a failed final contract. It is a preserved, diagnosable infrastructure/node outcome.

### 5. Terminal detection and wave barrier

A node is *observably settled* when Herdr reports `idle` or `done`, or its pane exit is observed. A node is *terminal* only after the supervisor records one of these classifications:

| Classification | Required evidence | Barrier effect |
|---|---|---|
| `passed` | Herdr settled/exited **and** `node-contract.md` exists, is atomically complete, parses as the exact PIES contract, has every required heading, `Unproved: None`, and required acceptance/second-opinion evidence; final Git/worktree evidence is captured. | Eligible for the existing merge approval gate. |
| `failed` | Settled/exited with a valid contract containing any `Unproved` item, missing required acceptance, or a recorded verification failure. | Freeze transitive dependents; retain worktree. |
| `blocked` | Herdr `blocked`, required human gate, or terminal file explicitly says blocked. | Stop or freeze according to the existing DAG policy; retain worktree. |
| `timed_out` / `cancelled` / `lost` | Inactivity/deadline/cancellation record, pane exit, server loss, or missing required contract after settle. | Infrastructure/node failure; freeze dependents; retain worktree. |

At the wave barrier, the supervisor writes `R/waves/wave-<k>-barrier.json` containing for every launched node: node/attempt, branch, worktree, Herdr name/pane/workspace, Pi session path if observed, dispatch and terminal timestamps, status history/snapshots, contract path plus SHA-256, validation result, Git HEAD/diffstat, and terminal classification. The barrier opens only after every launched node has one terminal record; it does **not** open merely because all panes are idle.

This directly retains the PIES requirement that every node be terminal before admitting newly ready work, and that missing/incomplete output is failure.

### 6. Failure preservation and retry

Do not close/remove a failed, blocked, unapproved, cancelled, or lost node worktree. Leave the Herdr pane open unless it was terminated, retain Pi's session path/reference and the attempt artifact root, and preserve the branch. A retry is a fresh worktree/branch/agent/session with a new attempt number; it receives only retained artifact paths needed for safe recovery, never an assumed successful state.

## Exact APIs/tools used by the design

| Design operation | Herdr evidence |
|---|---|
| Create/open/list/remove isolated worktrees | `herdr_worktree_create`, `herdr_worktree_open`, `herdr_worktree_list`, `herdr_worktree_remove`; API `worktree.create/open/list/remove`. |
| Spawn Pi at a node cwd | `herdr_start_agent` has `agent`, `cwd`, `workspaceId`, `name`, `agentArgs`, `timeoutMs`; CLI `agent.start <name> --kind pi --pane <id>`. |
| Submit packet/checkpoint request | `herdr_send_prompt`; CLI/API `agent.prompt`. |
| Inspect identity, cwd, state, transcript reference | `herdr_get_agent`, `herdr_list_agents`, `herdr_api_snapshot`; CLI/API `agent.get/list` returned `cwd`, `foreground_cwd`, `agent_session.value`, `agent_status`, `state_change_seq`, and pane/workspace identifiers. |
| Wait/read live state | `herdr_wait_agent`, `herdr_read_agent`; CLI/API `agent.wait/read`; `pane.read`, `pane.wait_for_output`. |
| Receive state/pane events in an implementation outside these high-level tools | API schema includes `events.subscribe`, `events.wait`, `pane.agent_status_changed`, `pane.exited`, `pane.closed`, `worktree.created/opened/removed`. |
| Cancel/terminate | `herdr_send_keys` (`esc`, `ctrl+c`), then `herdr_close_pane`; CLI/API `agent.send_keys`, `pane.close`. |
| Preserve snapshots | `herdr_api_snapshot`; raw API `session.snapshot`; CLI `herdr api snapshot`. |

## Unresolved gaps and controls

1. **No observed Herdr heartbeat/inactivity timestamp API.** Agent data exposed status and `state_change_seq`, but no last-activity time or progress contract. **Control:** require node heartbeat + supervisor mtime/timestamp checks. This is the main reason for the partial verdict.
2. **No success semantics in agent state.** `idle`/`done` are readiness states, not PIES acceptance. **Control:** supervisor validates the file-backed PIES contract and verification/Git evidence.
3. **Pane output is incomplete evidence.** Herdr explicitly notes alternate-screen history is not always recoverable. **Control:** use artifact files and Pi JSONL session path for durable diagnosis; never gate on transcript text.
4. **`unknown` is ambiguous.** It neither proves execution nor completion. **Control:** treat it as lost/unhealthy until identity/status can be restored; never pass a barrier on it.
5. **Atomicity is protocol-level, not an observed Herdr guarantee.** Herdr controls panes, not artifact publication. **Control:** require same-directory temporary write + validate + rename; validate the final file and record its hash at the barrier.
6. **No end-to-end trial under this scope.** Worktree mutation prohibition prevented a safe lifecycle drill. **Control before adoption:** run a disposable-repository acceptance test that exercises startup, normal contract, stale heartbeat, blocked UI, Esc/ctrl-c/close, pane exit, and server reconnect; assert barrier records and preserved artifacts.

## Minimal implementation contract

Adopt Herdr node sessions only with all of the following:

1. **One node = one newly created worktree, unique Herdr Pi agent, and fresh Pi session.** Record worktree SHA/path, agent/pane/workspace ids, and detected Pi session path before prompt dispatch; reject cwd mismatch.
2. **One attempt root owned by the supervisor** with absolute `packet.md`, `heartbeat.json`, phase checkpoints, `node-contract.md`, `supervisor.json`, and `terminal.json` paths.
3. **The packet requires atomic heartbeat/checkpoint/contract writes.** The full PIES Node contract at the exact supplied path is the only candidate final result.
4. **Supervisor checks health at every PIES inactivity threshold.** Health requires Herdr identity/liveness plus a fresh valid heartbeat. It records snapshots and never uses `working`, `idle`, `done`, screen output, or a timeout receipt as proof.
5. **Cancellation preserves first, then escalates:** checkpoint request → `esc` → `ctrl+c` → node-pane close only. Retain all non-passing worktrees, packets, contracts/checkpoints, and observation records.
6. **The wave barrier accepts only supervisor-validated contracts.** Require settled/exited state, a complete contract with `Unproved: None`, required acceptance evidence, and barrier hash/snapshot/Git evidence. Every other terminal condition fails or blocks and freezes dependents under existing PIES rules.
7. **Do not replace the existing DAG subagent workflow until the disposable lifecycle acceptance test passes.**

**PARTIALLY PROVED**
