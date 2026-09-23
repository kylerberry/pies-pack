# ADR-015: Model tiering by role

**Status:** Accepted, provisional
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

A long-running lead on a top-tier model is expensive, which was part of the reason plan and eval were separate subagents. After ADR-002, each lead lives for one node, and most of its tokens are reading. `pies-execute-dag` hard constraint 4: phase agents use their configured models, and the supervisor never overrides them.

## Decision

| Role | Default | Escalation |
|---|---|---|
| Lead | `gpt-5.6-terra`, medium thinking | Operator-selected stronger model on escalation triggers |
| Worker | `gpt-5.6-luna` at max reasoning, or `glm-5.3-flash` | Lead's tier for hard changes |
| Scout | Haiku 4.5 or equivalent | None |
| Simplifier and second opinion | Different family from the worker | None |

Models are set in agent files, not by the supervisor. Writer and reviewer independence comes from separate agents and context, not necessarily different model families. The simplifier and second opinion differ from the worker's family: with a GPT worker they run on GLM or Anthropic models, with a GLM worker on GPT or Anthropic models. Codegen eval scores decide between the worker candidates.

## Consequences

- The escalation triggers from the original Plan stage now also select the lead model and the second opinion.
- The worker slot is the natural target for the orchestrator's codegen eval harness.

## Action Items

1. [ ] Revisit once eval scores exist.
