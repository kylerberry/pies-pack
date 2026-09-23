---
title: PIES workflow
type: architecture
tags: [pies, workflow, orchestration]
created: 2026-09-22
updated: 2026-09-22
sources:
  - ../../raw/adr/README.md
  - ../../raw/reviews/direct-pies-retry.md
  - ../../raw/reviews/herdr-node-lifecycle-proof.md
---

# PIES workflow

PIES is a lead-owned code-change workflow. The initiating session is the lead for ordinary runs; it retains grounding, plans, reviews, evaluates, and decides pass/fail. The worker alone writes production code. [[../sources/adr-002|ADR 002]] and [[../sources/adr-011|ADR 011]] define that separation.

## Node lifecycle

1. Normalize input and classify feature, bug, or refactor work.
2. Ground with scout output and prior learnings.
3. Delegate implementation to one worker in an isolated worktree.
4. Run the deletion-only simplifier.
5. Lead verifies and evaluates; escalation gets a cold second opinion.
6. Return a complete node contract. `Unproved` means failure, not partial success.

Verification uses deterministic checks and the applicable real surface. [[../sources/adr-008|ADR 008]] defines the verify map; [[../sources/adr-012|ADR 012]] defines the contract.

## DAG lifecycle

The supervisor derives readiness from first-parent Git trailers, creates isolated worktrees, gates wave barriers on complete node contracts, and merges passing nodes serially with `--no-ff`. Execution hosting is selected by the invoking prompt, not by the DAG skill. [[../sources/adr-014|ADR 014]] covers Git-derived status.

> ⚠️ Unverified: durable node-session execution and its artifact heartbeat protocol need a disposable-repository acceptance test. See [[../sources/herdr-node-lifecycle-proof|node lifecycle proof report]].

## Comprehension and publication

Hands-off operation relies on node contracts and cumulative wave briefs rather than diff review. `--afk` permits autonomous publication; approval is otherwise required. See [[../sources/adr-001|ADR 001]], [[../sources/adr-017|ADR 017]], and [[../sources/adr-018|ADR 018]].

## Related pages

- [[../sources/pies-adr-index|PIES ADR index]]
- [[../sources/direct-pies-retry|Direct PIES retry report]]
- [[../output/self-improving-pies|Self-improving PIES]]
