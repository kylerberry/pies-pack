---
name: pies
description: Execute one code-change node through grounding, planning, delegated implementation, deletion-only simplification, independent evaluation, proof, and learning capture. Use for a standalone task or a private plan node. Accepts --afk; publication otherwise requires human approval.
---

# PIES

You are the **lead**. In an ordinary `/pies` run, the initiating Pi session is the lead: do not launch `pies-lead` as a child. Own intent, plan, review, and the pass/fail decision. Never write production code. Delegate production edits to `worker`; direct children may only be `scout`, `worker`, `pies-simplifier`, and escalation-triggered `pies-evaluator`. Children receive file paths, not copied context, and return bounded file-backed results. Replace a child when direction changes; do not steer or resume it. Children may not spawn agents.

## Input

Accept `pies [--afk] <task-or-node-packet>`. Reject unknown flags.

Normalize to exactly `id`, `intent`, `change_spec`, `acceptance_criteria`, plus run metadata `provenance`, `kind`, and `worktree`:

- Plan packet: preserve all four content fields byte-for-byte, set `provenance: plan`, and use its supplied worktree.
- Standalone task: author the four fields, set `provenance: authored`, and create `$HOME/.worktrees/<repo-basename>/worktree-<id>` from the current branch. Before planning, apply the two-PR, reviewer-budget, and intent-smell tests from `pies-create-plan`. If two independently valuable mergeable outcomes exist, stop and recommend that skill.
- Routing runs in every mode. Invoke the router (TypeSafe/JEV `typesafe_choice`) with only `routing_input` (`intent` + `change_spec`). In `shadow` mode (default), record its choice, confidence, flags, and rationale in `routing_result` with disposition `shadow`; the lead's own kind selection still controls procedure. In `authoritative` mode, apply the router's profile automatically only when the kind is in `auto_route_kinds`, confidence exceeds the registry threshold, and no mixed-work or escalation flag is raised; otherwise the lead resolves the kind and records the disposition. If the router is unavailable in either mode, record `routing_result: unavailable` and proceed with lead selection. Kinds follow [kind-profiles.json](assets/kind-profiles.json): `feature`, `bug`, `refactor`, `test`, `documentation`, `research`, `codebase-analysis`; feature/bug/refactor/test follow their registry proof contracts, and test work is behavioral or explicit-coverage mode.

Do all work in the dedicated worktree. In plan mode, never merge. In standalone mode, never publish before the Publication gate.

**Report-only kinds** (`research`, `codebase-analysis`) skip the worktree, worker-as-writer, merge, and Publication gate: Scout investigates (an optional read-only worker may gather evidence), the lead evaluates the report against the registry proof contract, and the run terminates by returning the report. A report run is successful only when its contract is complete; agent idleness is not success. These kinds are standalone-only: a plan packet or `pies-run-plan` admission carrying one is rejected with a recommendation to run it standalone.

## Artifact location

Do not write PIES artifacts under the repository or worktree. At the start of every run, derive one stable, user-level artifact root shared by every worktree of the repository:

```text
$HOME/.pies/<category>/<repo-basename>/
```

Derive `<repo-basename>` from the repository's main checkout — the basename of the parent of `git rev-parse --git-common-dir` — never from the current worktree's directory name, so every worktree of one repository shares one root. Call `$HOME/.pies` `PIES_ARTIFACT_ROOT`. Create `runs/<repo-basename>/` beneath it as needed (`waves/<repo-basename>/` in plan mode). If two distinct repositories share a basename, disambiguate the directory explicitly and record the choice in both repositories' AGENTS.md. Use absolute paths beneath this root for the normalized node, plan, child reports, and verification evidence. Never rely on a worktree-local `.pies/` directory, even when it is ignored.

At run start, after the normalized run ID and artifact directory exist, the initiating lead session calls `pies_telemetry_bind` with that ID and `role: "lead"`. No child binds telemetry. Before writing the terminal run record, the same lead session calls `pies_telemetry_finalize` and records its returned lead-only rollup. `active_ms` is bound-lead active time: bind → explicit finalize, less completed, explicitly observed Pi UI-prompt waits; it is not agent/session lifetime. UI events persist timing only, never prompt content, kind, title, or response. The rollup is observed finalized assistant usage, optional Pi-reported cost, and lead lifecycle/tool timing only—not child, phase, critical-path, provider-generation, or invoice telemetry.

## Project knowledge

Do not assume `docs/learnings/` or any other repository directory exists. Before Scout, resolve a repository knowledge map:

1. Read `pies.config.yaml` for `knowledge.sources` and `knowledge.learning_sink`. The configured sink is authoritative.
2. When a configured source is a wiki or documentation root, follow its documented entry point and query procedure before reading individual pages.
3. For a legacy or absent config, inspect project instructions for documentation sources, then use `$HOME/.pies/learnings/<repo-basename>/` as the sink. Do not stop or ask the user.
4. Always include the resolved sink as a Scout source; create it only when Record has a durable learning to write.

`knowledge.sources` is a list of repository-relative source roots or entry documents. `knowledge.learning_sink` is either a repository-relative destination or `$HOME/.pies/learnings/<repo-basename>/`. The lead records the resolved sources and sink in its plan. A project may later replace the fallback by setting a project-local sink in `pies.config.yaml`.

## Phase control

The primary lead owns phase lifecycle. Do not put Scout → Worker → Simplifier → Evaluator inside one nested `pies-lead` run or one aggregate child timeout.

Before starting each child phase, record its deadline, inactivity threshold, and checkpoint path in the run plan. Use these defaults unless the plan records evidence for another value:

| Phase | Deadline | Inactivity threshold | Checkpoint rule |
| --- | --- | --- | --- |
| Scout | 15 minutes | 5 minutes | Write the grounding report before stopping. |
| Worker | 45 minutes | 10 minutes | Five minutes before deadline, write a diff/checks/report checkpoint. |
| Simplifier | 15 minutes | 5 minutes | Write a deletion/no-change report before stopping. |
| Escalation evaluator | 30 minutes | 10 minutes | Write its independent evidence and verdict before stopping. |

Check child activity at the inactivity threshold. Surface an inactive phase to the caller promptly; do not silently wait for an aggregate run to expire. At a phase deadline, retain the worktree and checkpoint evidence, record the exact blocker, and replace the child only through a fresh direct launch when the retained evidence makes a retry safe. A long-running active phase may continue only when the lead records its new deadline and reason. Never treat a timeout receipt as proof or acceptance.

## Procedure

### 1. Ground

Launch `scout` to inspect affected code, project instructions, `pies.config.yaml`, the resolved repository knowledge sources, referenced verification skills and feature guides, and actual package scripts. The scout returns a bounded file under `<PIES_ARTIFACT_ROOT>/runs/<repo-basename>/<id>/`; the lead reads and retains that grounding through planning, review, and evaluation. The worker receives the plan and file pointers, not the scout transcript or lead context. Standalone runs also use available session/project recall. A trivial one-function task that easily passes reviewer-budget may skip grounding only with a recorded reason.

During planning:

- Prototype a local fork when behavior, timing, layout, or output can settle it.
- For changes crossing a function boundary, write a types-and-signatures sketch.
- Stop for human approval when work spans two or more domains, has security implications, or changes a public API/surface. `--afk` does not bypass this gate.

Write the normalized node and plan to `<PIES_ARTIFACT_ROOT>/runs/<repo-basename>/<id>/` and pass their absolute paths. The plan references, not restates, private graph criteria.

### 2. Protect the bar

Acceptance criteria and `pies.config.yaml` are additive:

- Add or tighten freely.
- Weaken or remove only with an amendment naming the change and evidence.

Record amendments first in the final output.

Use `pies.config.yaml` as the verify map. If absent, inspect the repository and create it using [the shape](assets/pies.config.yaml), replacing every example rather than inventing commands. Run every applicable deterministic check; no check covers another.

For real-surface proof, `surfaces.<name>.drive` names the interaction mechanism; it is not necessarily executable. `features[].command` is the concrete command that drives one capability. For each changed-path match: read its verification skill and guide; run `doctor`; run `start` when needed; wait for `ready`; execute the feature `command` through `drive`; capture `evidence`; and run `cleanup` after success or failure. Record the surface, exact command, and observed result. If no feature matches, add a narrow entry or stop and recommend `pies-create-verification-skill` when the repository lacks a reusable harness. Wrong-surface or inconclusive evidence fails. Put behavior no surface can drive under `Unproved`.

### 3. Implement

Launch `worker` with paths to the node, plan, project instructions, verify map, and worktree. The worker is the sole production-code writer. It may make several focused commits; every commit must pass the applicable checks and real-surface proof before the next begins.

### 4. Simplify and verify

Launch `pies-simplifier` on the worker diff and give it the run directory for `simplifier-report.md`. It may delete only and may not remove a test covering a criterion; its report lists each deletion (what, where, why not required, check that stays green) or states no safe deletion existed. Then rerun every applicable check and real-surface command. In Evaluate, check each reported deletion against the criteria before accepting.

### 5. Evaluate

The lead reviews the worker and simplifier diff, raw verification output, and exact criteria using the grounding and plan context it retained. Check criterion coverage, vanity tests, regressions, P0 defects, scope, and whether the diff is the smallest necessary.

On a trigger from step 1, launch a fresh `pies-evaluator` as a cold second opinion on a model family different from the worker. Give it only the diff, exact criteria, verify map, referenced verification skill and guide, and raw verification artifacts—never planner or worker rationale. It is read-only and reruns verification independently.

Any lead or second-opinion failure returns a consolidated finding packet to a fresh worker, then repeats Simplify → Verify → Evaluate. Maximum two evaluation rounds; after the second failure, report `Unproved` and stop.

A pass requires the lead's acceptance and, when triggered, second-opinion acceptance: each criterion has direct evidence; no vanity tests or regressions; the diff is the smallest necessary; all applicable checks pass; and the capability succeeds on the correct real surface.

### 6. Record

Write durable learnings to the resolved knowledge sink. Write only reusable repository knowledge that would change how a later engineer plans, implements, or verifies work: a non-obvious invariant or architectural constraint; a recurring footgun or failure mode; an undocumented verification, setup, or operational requirement; misleading convention or dependency behavior; or a decision needed to work safely in the area. Include evidence and affected paths. Exclude task summaries, changed-file lists, temporary failures, implementation narration, and facts obvious from code.

The lead owns `run-record.json` in its packet-supplied run directory (a DAG attempt directory) or, for a standalone run, `<PIES_ARTIFACT_ROOT>/runs/<repo-basename>/<id>/`. Write it after Record, for every terminal lead outcome. Include the returned terminal `lead_telemetry` rollup when telemetry was bound; do not invent unavailable values or infer historical telemetry. It is a compact, normalized index record for later analysis—not a transcript. Include only observed values: record version; repository identity and base revision; node ID and provenance; immutable `routing_input` containing exactly the pre-routing `intent` and `change_spec`; final kind; optional `routing_result` when a router ran (choice, confidence, flags, rationale, and lead disposition); resolved knowledge sources and sink; criteria disposition; phase deadline/inactivity events; referenced plan, grounding, simplifier, verification, evaluator, and node-contract paths; acceptance and `Unproved` status; durable-learning paths; and the worktree/commit when known. Link to raw artifacts by absolute path; do not copy raw output, transcripts, secrets, or estimated model cost. Calibration passes only `routing_input` to a router, never later record fields. Historical readers must normalize the final kind from top-level `kind`, falling back to legacy `node.kind`; never mutate raw run records to backfill it. The supervisor separately owns plan-node `terminal.json` and merge facts.

Return this contract, even on failure:

```markdown
# Node <id>
## Amendments
- None | <weakened/removed bar and evidence>
## Simplification
- None | <each deletion with file, why not required by criteria, from `simplifier-report.md`>
## Capability proved
<user/caller-visible capability, or "None">
## Proof
- Surface: <surface>
  Command: `<command>`
  Observed: <result>
## Criteria disposition
- <criterion>: met | settled by prototype | unfalsifiable as written — <evidence/amendment>
## Decision trail
- <fork>: <evidence that settled it>
## Inheritance
- <what the next owner needs>
## Unproved
- None | <claim, missing evidence, or failed gate>
```

Success requires `Unproved: None`, lead acceptance, and second-opinion acceptance when triggered. A populated `Unproved` field is failure, not partial success.

## Publication

Without `--afk`, stop after Record and ask for approval. With `--afk`, lead acceptance plus any required second-opinion acceptance authorizes standalone merge only after final verification. Plan-node leads always return control to the supervisor; only it may merge. Never delete a failed or unapproved worktree.
