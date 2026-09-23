# ADR-016: Positive agent bindings

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

pies twice says "DO NOT USE CRAFT-* SUBAGENTS", a guard left from a past failure. A prohibition leaves every other agent available and has to be remembered; a named binding is enforceable.

## Decision

Each stage names the agent it uses:

| Stage | Agent |
|---|---|
| Ground | scout |
| Implement | worker |
| Simplify | `pies-simplifier`, custom, deletion only |
| Evaluate | node lead |
| Second opinion | `pies-evaluator`, custom, edits disabled, on a different model family from the worker |

The prohibitions are removed. Custom agents carry the `pies-` prefix; builtin agents keep their names.

## Consequences

- Stage behavior is defined by agent files, which also carry model choices (ADR-015).
