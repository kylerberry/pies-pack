---
name: pies
description: Execute one code-change node through grounding, planning, delegated implementation, deletion-only simplification, independent evaluation, proof, and learning capture. Use for a standalone task or a DAG node. Accepts --afk; publication otherwise requires human approval.
---

# PIES

You are the **lead**. Own intent, plan, review, and the pass/fail decision. Never write production code. Delegate production edits to `worker`; use only the agents named below. Children receive file paths, not copied context, and return bounded file-backed results. Replace a child when direction changes; do not steer or resume it. Children may not spawn agents.

## Input

Accept `pies [--afk] <task-or-node-packet>`. Reject unknown flags.

Normalize to exactly `id`, `intent`, `change_spec`, `acceptance_criteria`, plus run metadata `provenance`, `kind`, and `worktree`:

- DAG packet: preserve all four content fields byte-for-byte, set `provenance: dag`, and use its supplied worktree.
- Standalone task: author the four fields, set `provenance: authored`, and create `tmp/worktree-<id>` from the current branch. Before planning, apply the two-PR, reviewer-budget, and intent-smell tests from `pies-decompose-to-dag`. If two independently valuable mergeable outcomes exist, stop and recommend that skill.
- Classify `kind` as `feature`, `bug`, or `refactor`. Features use criterion-first red/green tests; bugs first reproduce the symptom; refactors keep existing tests green and prove behavior preservation.

Do all work in the dedicated worktree. In DAG mode, never merge. In standalone mode, never publish before the Publication gate.

## Procedure

### 1. Ground

Launch `scout` to inspect affected code, project instructions, `pies.config.yaml`, its referenced verification skills and feature guides, actual package scripts, and `.pies/learnings/*.md`. The scout returns a bounded file; the lead reads and retains that grounding through planning, review, and evaluation. The worker receives the plan and file pointers, not the scout transcript or lead context. Standalone runs also use available session/project recall. A trivial one-function task that easily passes reviewer-budget may skip grounding only with a recorded reason.

During planning:

- Prototype a local fork when behavior, timing, layout, or output can settle it.
- For changes crossing a function boundary, write a types-and-signatures sketch.
- Stop for human approval when work spans two or more domains, has security implications, or changes a public API/surface. `--afk` does not bypass this gate.

Write the normalized node and plan to the run's managed artifact directory and pass their paths. The plan references, not restates, DAG criteria.

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

Launch `pies-simplifier` on the worker diff. It may delete only and may not remove a test covering a criterion. Then rerun every applicable check and real-surface command.

### 5. Evaluate

The lead reviews the worker and simplifier diff, raw verification output, and exact criteria using the grounding and plan context it retained. Check criterion coverage, vanity tests, regressions, P0 defects, scope, and whether the diff is the smallest necessary.

On a trigger from step 1, launch a fresh `pies-evaluator` as a cold second opinion on a model family different from the worker. Give it only the diff, exact criteria, verify map, referenced verification skill and guide, and raw verification artifacts—never planner or worker rationale. It is read-only and reruns verification independently.

Any lead or second-opinion failure returns a consolidated finding packet to a fresh worker, then repeats Simplify → Verify → Evaluate. Maximum two evaluation rounds; after the second failure, report `Unproved` and stop.

A pass requires the lead's acceptance and, when triggered, second-opinion acceptance: each criterion has direct evidence; no vanity tests or regressions; the diff is the smallest necessary; all applicable checks pass; and the capability succeeds on the correct real surface.

### 6. Record

Write `.pies/learnings/<id>.md` only for reusable repository knowledge that would change how a later engineer plans, implements, or verifies work: a non-obvious invariant or architectural constraint; a recurring footgun or failure mode; an undocumented verification, setup, or operational requirement; misleading convention or dependency behavior; or a decision needed to work safely in the area. Include evidence and affected paths. Exclude task summaries, changed-file lists, temporary failures, implementation narration, and facts obvious from code. Write nothing when no durable learning exists.

Return this contract, even on failure:

```markdown
# Node <id>
## Amendments
- None | <weakened/removed bar and evidence>
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

Without `--afk`, stop after Record and ask for approval. With `--afk`, lead acceptance plus any required second-opinion acceptance authorizes standalone merge only after final verification. DAG leads always return control to the supervisor; only it may merge. Never delete a failed or unapproved worktree.
