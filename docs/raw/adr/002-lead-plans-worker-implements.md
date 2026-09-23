# ADR-002: Lead plans and evaluates, worker implements

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

The original pies had the main agent implement, with Plan and Evaluate delegated to heavy-tier subagents. pstack inverts this: the lead owns design, review, and verification, and delegating implementation is mandatory because the gain is review separation.

Under hands-off operation (ADR-001), the role that must catch problems should hold the richest context: the grounding, the design rationale, and the criteria.

## Decision

The lead plans, reviews the worker's diff, and evaluates. The worker writes code. The lead never writes production code.

## Options Considered

### Option A: Main agent writes, plan and eval delegated (original)
**Pros:** One fewer handoff. Writer holds implementation detail.
**Cons:** Evaluator starts cold and reconstructs intent from a diff. Lead context fills with implementation noise.

### Option B: Lead judges, worker writes (chosen)
**Pros:** Writer and reviewer are always different agents. Lead context stays small. Worker model can be cheaper when the plan is precise.
**Cons:** Adds a delegation boundary, which has caused reliability failures before (see ADR-003).

## Consequences

- Plan quality determines how cheap the worker can be (ADR-015).
- The lead runs as a depth-2 session under the DAG supervisor (ADR-003).

## Action Items

1. [ ] Test the flip alone on one node before combining it with other changes.
