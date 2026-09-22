---
name: pies-decompose-to-dag
description: Decompose a feature, issue, or request into an approved, independently verifiable five-field DAG for pies-execute-dag. Use before implementation when work contains several mergeable outcomes.
---

# PIES: decompose to DAG

Own structure, not implementation. Ask for the repository and base branch if absent. Do not implement.

## Artifact

Write `dag.json` at the requested path:

```json
{
  "meta": {"spec":"source", "repo":"/absolute/repo", "branch":"main", "created":"YYYY-MM-DD"},
  "nodes": [{
    "id":"n1",
    "intent":"One observable outcome, imperative",
    "change_spec":"What changes, where, and how it is verified.",
    "acceptance_criteria":["Testable criterion"],
    "depends_on":[]
  }]
}
```

Each node has exactly those five fields. Never add status, owner, model, estimate, or run policy.

## Design

Identify the primary actor, executable journey (action → behavior → useful observed result), narrowest real walking skeleton, later capability milestones, controls needed at irreversible boundaries, and material unknowns.

Rules:

1. One independently valuable, verifiable outcome per node. Keep cross-layer code together when it produces one capability.
2. Drop unrelated cleanup. Put types, storage, APIs, logic, and tests in their first consuming capability unless independent establishment is required by uncertainty, safety, integrity, irreversibility, compatibility, or immediate reuse.
3. Dependencies are semantic: B depends on A only when B cannot be built or proved without merged A.
4. Compose the real journey early and repeatedly. Do not defer first integration to a convergence node.
5. Allow at most two enablement nodes before the first capability, or between capabilities, unless each records its exception and resolving evidence.
6. Tie every control to a current failure, exposed capability, consequence, and minimum enforcement.
7. Define types at trust boundaries; extract abstractions only for real multiple consumers or advance compatibility/irreversibility needs.
8. Create `Probe:` nodes only when uncertainty could invalidate several nodes. A probe must merge a durable fixture, contract test, interface, benchmark, or seam. Disproving its hypothesis fails the node.

## Attacks

Apply to every draft, then revise until all pass:

- **Two-PR / cover-up:** hiding one criterion must not leave a second independently valuable PR.
- **Disjoint oracle:** distinct fixtures, reason codes, destinations, or pipeline stages suggest a split unless one journey requires them.
- **Reviewer budget:** a reviewer can decide in 5–10 minutes from diff and criteria, with only cited spec rows open.
- **Intent smells:** inspect `and`, family lists, `all`, `every`, `orchestrate`, and ordered guards.
- **Walking skeleton:** name the earliest executable end-to-end result.
- **Foundation delay:** move prerequisites into the first consumer unless the recorded exception holds.
- **Late composition:** reject a DAG whose first real integration is late.
- **Delete half:** early milestones remain coherent if later nodes vanish.
- **Speculation/control:** every abstraction has a consumer; every control has a current scenario.

## Validate and stop

Verify unique IDs, existing dependency references, acyclicity, at least one criterion per node, complete intent coverage, no invented scope, and all attacks above. Present actor, journey, walking skeleton, milestones, then a table of id/intent/dependencies/wave and validation results. Request approval. `pies-execute-dag` alone implements an approved artifact.
