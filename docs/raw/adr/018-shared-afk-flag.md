# ADR-018: One `--afk` flag, human approval by default

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

`pies --afk` and `pies-execute-dag --merge auto|hitl` express the same policy, whether a passing result merges without a human, under two names. Their defaults were opposite: `pies` required approval, `pies-execute-dag` merged automatically.

Without `--afk`, `pies` runs every phase through Record without pausing. It stops only before publication, and at the Plan escalation triggers in either mode. In DAG mode the node lead never merges; the supervisor does.

## Decision

- Both skills take `--afk`. `--merge` is removed.
- Default in both is human approval. `--afk` opts into autonomous merge.
- In DAG mode the flag governs the supervisor's merge step. Node leads never merge.
- Plan escalation triggers stop for approval regardless of `--afk`.

## Options Considered

### Option A: Keep both flags
**Cons:** Two names for one policy, with opposite defaults.

### Option B: One flag, autonomous by default
**Cons:** A missing flag merges without review.

### Option C: One flag, approval by default (chosen)
**Pros:** Autonomy is an explicit choice. One word to type.

## Action Items

1. [x] Replace `--merge auto|hitl` with `--afk` in `pies-execute-dag`, mapping `hitl` behavior to the default.
