---
title: Plan-first delivery interface — implementation plan
type: planning
tags: [pies, planning, delivery, adr]
created: 2026-09-25
updated: 2026-09-25
sources: [../../raw/adr/021-plan-first-public-interface.md]
---

# Plan-first delivery interface — implementation plan

Implements [[../sources/adr-021|ADR-021]]. This changes public language and durable plan lifecycle while preserving current decomposition quality and DAG execution semantics.

## Scope

### Deliver

- `/pies-create-plan <spec | references>` and `/pies-run-plan <plan-id>` public prompts.
- `pies-create-plan` and `pies-run-plan` canonical skills.
- Immutable plan bundles under `$PIES_ARTIFACT_ROOT/runs/<repo-basename>/plans/<plan-id>/`.
- Progressive-capability planning attacks preserved as structured warning output.
- Current-base plan execution, rolling admission, partial completion, and existing merge authority.
- Fanout copy that explicitly excludes plan delivery.

### Do not build

- A new scheduler, workflow service, queue, or background persistence layer.
- A second plan status store; Git trailers remain delivery completion truth.
- Auto-replanning, overwriting plans, or separate approval state.
- Research/analysis dependency nodes.
- Fanout as a plan execution host.
- Compatibility aliases for DAG-named surfaces.

## Bundle contract

Keep the strict DAG schema separate from plan metadata so `scripts/dag-next` continues to validate exactly five fields per node.

```text
$PIES_ARTIFACT_ROOT/runs/<repo-basename>/plans/<plan-id>/
├── dag.json             # existing strict internal DAG representation
├── plan.md              # actor, journey, walking skeleton, milestones, sources
└── plan-review.json     # provenance, creation revision, attack results, warnings
```

`plan-review.json` records persistent warnings and source references. It never records mutable execution state. Node `supervisor.json`, `terminal.json`, contracts, and run records remain in their existing attempt locations.

## Delivery steps

### 1. Plan artifact helpers and tests

Add a small deterministic helper/CLI for canonical repository basename resolution, plan ID/path resolution, bundle validation, and immutable writes. It must:

- reject incomplete specs/references before bundle creation;
- reject overwriting an existing plan ID;
- require `dag.json`, `plan.md`, and `plan-review.json`;
- preserve the existing `dag-next` schema and report warnings without putting them in nodes;
- resolve a plan ID only beneath the canonical repository’s artifact root.

Add focused Python tests for path resolution, immutability, bundle validation, warning persistence, and legacy `dag-next` compatibility.

### 2. Replace decomposition surface

Replace `skills/pies-decompose-to-dag/` with `skills/pies-create-plan/`.

Its planning procedure retains all current behavior:

- actor and executable journey;
- earliest real walking skeleton;
- capability milestones and direct proof;
- semantic dependencies and five-field nodes;
- two-PR, disjoint-oracle, reviewer-budget, intent-smell, foundation-delay, late-composition, delete-half, speculation/control, and probe attacks.

Instead of refusing to save a plan solely because an attack fails, write the attack result as a structured warning in `plan-review.json` and present it at creation. Essential unanswered research/analysis remains a hard stop: return a standalone discovery recommendation and save no executable plan.

Add `prompts/pies-create-plan.md` for the public command. It accepts a complete spec or references, asks targeted questions only when required, then shows the saved plan ID and warnings.

### 3. Replace execution surface

Replace `skills/pies-execute-dag/` with `skills/pies-run-plan/` and add `prompts/pies-run-plan.md`.

Run-plan resolves only a saved bundle, uses its `dag.json`, and retains the existing supervisor policy:

- current base is used; Scout records actual revision;
- caller chooses active-node limit at runtime;
- rolling admission is default; `--barriered` is retained;
- failed/unproved nodes freeze only transitive dependents;
- unrelated outcomes continue;
- merge approval is human-gated unless `--afk`;
- terminal output is a plan/goal summary with passed, frozen, failed, and unproved outcomes.

Remove the DAG-named skill directories and public references immediately. Keep low-level graph helpers private implementation details; do not expose a DAG-named public command or package bin.

### 4. Clarify adjacent surfaces and documentation

- Update `skills/pies/SKILL.md` to distinguish direct scoped delivery from plan creation.
- Update `/pies-fanout` prompt and tool descriptions: it is parallel assistance, not shared-repository plan execution or integration.
- Update `README.md`, ADR index, wiki architecture page, and command examples to use plan/outcome language.
- Update package metadata to export the two new public prompts. Do not add a reusable skill solely to repeat prompt instructions.

### 5. Verify on real surfaces

Deterministic:

- `npm test`, `npm run typecheck`, `git diff --check`;
- plan bundle/helper tests;
- update existing DAG frontier tests for bundle-resolved `dag.json` without changing their graph assertions;
- grep check: no old DAG-named user-facing command remains.

Disposable repository proof:

1. create a plan from a complete multi-outcome spec;
2. inspect saved bundle and quality warnings;
3. run it against the current base with an explicit active-node limit;
4. prove rolling admission and a partial result after one node fails;
5. verify unrelated work continues, dependent work freezes, and merge approval remains human-gated;
6. repeat with `--afk` only where autonomous publication is intended;
7. retain plan, node, and wave evidence after cleanup.

## Acceptance checklist

- [ ] A complete spec produces an immutable, repository-scoped plan bundle.
- [ ] A one-outcome spec still produces a plan bundle.
- [ ] Incomplete input produces questions, not a plan.
- [ ] Progressive-capability attack failures persist as creation-time warnings.
- [ ] Research/analysis gaps prevent executable-plan creation.
- [ ] Run-plan starts only an existing plan ID and keeps existing execution/merge safety semantics.
- [ ] Fanout is not used as plan delivery.
- [ ] Old DAG-named public surfaces are gone.
- [ ] Deterministic and disposable-repository proof passes.
