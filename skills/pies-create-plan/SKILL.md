---
name: pies-create-plan
description: Create an immutable PIES delivery plan from a complete specification or named references. Keeps internal DAG mechanics private while preserving progressive capability proof.
---

# PIES: create plan

Accept `pies-create-plan <complete spec | references>`. Do not implement or run the plan.

A complete input states an outcome, scope, and evaluable criteria. If it does not, ask targeted questions and save no executable plan. Essential unresolved research or codebase analysis is report-only: recommend a standalone `/pies` report and save no plan.

## Plan

Identify actor, executable journey, earliest real walking skeleton, later independently valuable capability milestones, direct proof, semantic dependencies, and material unknowns. Produce the private strict internal `dag.json` with exactly five fields per node: `id`, `intent`, `change_spec`, `acceptance_criteria`, `depends_on`. Never put warnings, status, ownership, estimates, or run policy in nodes.

Apply and record the two-PR/cover-up, disjoint-oracle, reviewer-budget, intent-smell, walking-skeleton, foundation-delay, late-composition, delete-half, speculation/control, and probe attacks. Preserve progressive capability proof: early milestones must be directly provable actor capabilities, not layers or speculative foundations. Revise where useful; an unresolved quality attack becomes a structured warning, not a node field or creation hard stop.

## Immutable bundle

Derive the canonical repository basename from the main checkout's `git rev-parse --git-common-dir`. Create exactly one new bundle at:

```text
$PIES_ARTIFACT_ROOT/runs/<repo-basename>/plans/<plan-id>/
├── dag.json
├── plan.md
└── plan-review.json
```

`PIES_ARTIFACT_ROOT` defaults to `$HOME/.pies`. `plan.md` states actor, journey, walking skeleton, milestones, sources, and direct proof. `plan-review.json` includes non-empty `provenance`, `creation_revision`, `attacks`, and `warnings`; each warning has `attack` and `detail`. Use `scripts/plan-bundle create` to validate and atomically reserve the bundle. Never overwrite a plan; changed input gets a new plan ID. Present the plan ID and warnings once at creation.

`dag.json` remains private implementation machinery. Do not expose a DAG-named public command or compatibility alias.
