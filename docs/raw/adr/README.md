# PIES architecture decisions

Decisions for the reworked PIES workflow. The canonical skill is `pies` (`/pies`). Every skill and custom agent in the family is prefixed `pies-`: `pies-decompose-to-dag`, `pies-execute-dag`, `pies-simplifier`, `pies-evaluator`. Recorded 2026-09-20. Several draw on Lauren Tan's pstack (cursor/plugins/pstack); where a decision departs from pstack, the ADR says why.

| ADR | Title | Status |
|---|---|---|
| [001](001-hands-off-operation.md) | Hands-off operation, comprehension over diff review | Accepted |
| [002](002-lead-plans-worker-implements.md) | Lead plans and evaluates, worker implements | Accepted |
| [003](003-lead-realization-by-context.md) | Node lead as a context role | Accepted |
| [004](004-input-normalization.md) | Input normalization and criteria provenance | Accepted |
| [005](005-work-kind-variants.md) | Work kind selects the procedure variant | Accepted |
| [006](006-grounding-and-design-aids.md) | Grounding and design aids | Accepted |
| [007](007-bar-asymmetry.md) | Criteria and verification config: add freely, weaken on record | Accepted |
| [008](008-real-surface-verification.md) | Real-surface verification and the verify map | Accepted |
| [009](009-multiple-commits-per-node.md) | Multiple verified commits per node | Accepted |
| [010](010-simplifier-stage.md) | Deletion-only simplifier stage | Accepted |
| [011](011-evaluation-independence.md) | Evaluation independence | Accepted |
| [012](012-node-output-contract.md) | Node output contract, failure as a field | Accepted |
| [013](013-per-node-learnings.md) | Per-node learnings merged as code | Accepted |
| [014](014-status-from-git.md) | Node status derived from git | Accepted |
| [015](015-model-tiering.md) | Model tiering by role | Accepted, provisional |
| [016](016-positive-agent-bindings.md) | Positive agent bindings | Accepted |
| [017](017-wave-brief.md) | Wave brief written by the PM session | Accepted |
| [018](018-shared-afk-flag.md) | One `--afk` flag, human approval by default | Accepted |
| [019](019-dag-admission-policy.md) | DAG structure is durable; admission policy is replaceable | Accepted |
| [020](020-task-kind-routing.md) | Task-kind routing | Accepted |

## Open questions

- **System-1 task-kind routing.** Should a fast classifier route incoming tasks to kind-specific PIES operations (bug, feature, refactor, performance, tests, documentation)? Discussion points and open questions live in the [roadmap](../../wiki/planning/roadmap.md).

## Deferred

- **Perf kind.** Added when a perf task shows the loop doing the wrong thing (ADR-005).
- **Watchdog.** Overlaps the evaluator. Revisited if evaluation misses problems a per-write review would have caught (ADR-011).

## Shared vocabulary

- **Supervisor.** The long-running PM session running `pies-execute-dag`. One per DAG. Dispatches node leads, merges, writes trailers, consolidates learnings, writes the wave brief. Never plans or reviews node code.
- **Lead.** The session running `/pies` for one node. One per node. Plans, delegates, reviews, evaluates, and returns the output contract. Never writes production code. In DAG mode it never merges; standalone, it also publishes.
- **Depth.** Supervisor at 0, leads at 1, scout, worker, simplifier, and second opinion at 2. Standalone runs start at the lead.
- **Worker.** The role that writes code in the node worktree.
- **Node.** One unit of work: a DAG node, or a standalone task normalized to the node shape.
- **Escalation triggers.** Work spanning two or more domains, security implications, or public surfaces and APIs. Carried over from the original pies Plan stage.
