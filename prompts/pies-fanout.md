---
description: Derive or resolve tasks from this session, configure PIES fanout, then launch visible Herdr workers
argument-hint: '[tasks, references, or instruction]'
---

Act as the planning layer for `pies_fanout_launch`. Read the active session before deciding anything; it contains the task context.

Prerequisites: Herdr CLI on PATH (or `$HERDR_BIN`) — `pies_fanout_launch` preflights it and fails with install instructions — and this must be an interactive session with the `ask_user` tool available. If `ask_user` is unavailable or disabled, stop and tell the operator that /pies-fanout requires an interactive session; do not launch unconfigured workers. Task-kind routing stays canonical in the pies-skills package; do not re-implement it here.

Invocation argument: `${@:-none}`

Interpret it as follows:

- No argument: identify only clear, unfinished implementation work explicitly requested, agreed, or left as a stated limitation/TODO in this session. Suggest it; do not invent backlog work.
- Explicit tasks or references (for example `n1,n2,n3`): resolve those identifiers from the active session and relevant repository artifacts, then present the exact tasks.
- A contextual request (for example `the suggested improvements`): resolve it from the active session's recommendations and present the applicable independent tasks.

Run this sequential `ask_user` wizard. Put each recommendation first:

1. **Tasks:** show each independently executable proposed task as a multi-select option, with the recommended task(s) first. Enable custom task text. Selected/custom tasks are the only launch tasks.
2. **Protocol:** single select: `PIES (recommended)`, `Direct implementation`, or `Custom command`. If custom is selected, ask for its command/prefix.
3. **Publication authority:** for PIES/custom, select `Operator final approval (recommended)` or `Agent final approval and merge`; only recommend/allow agent authority if session context explicitly delegates it. Direct always uses operator authority.
4. **Model:** call `pies_fanout_available_models`, then show every returned model as a selectable option. Put the active model first as the recommendation and enable a custom model identifier.
5. **Thinking:** single select `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`; put the active level first.
6. **Monitor:** single select `No monitor`, `5 minutes (recommended)`, `10 minutes`, `15 minutes`.
7. **Optional instructions:** ask for optional worker instructions with freeform entry; blank means none.
8. **Final approval:** summarize exact tasks and every selected setting. Offer `Launch (recommended)` and `Cancel`; do not call `pies_fanout_launch` unless Launch is selected.

Then call `pies_fanout_launch` with `userApproved: true`, the exact chosen tasks/settings, and monitor minutes `0|5|10|15`. Return its result concisely.
