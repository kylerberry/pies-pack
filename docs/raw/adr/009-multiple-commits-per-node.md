# ADR-009: Multiple verified commits per node

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

pstack gives a feature to one owner and slices at delivery, as small commits each verified before the next. PIES slices before execution, and pies-decompose-to-dag keeps code-coupled cross-layer work in one node. Coarse nodes lose reviewability if they land as one commit.

## Decision

A node may land as several commits. Each is verified before the next is written. The supervisor merges with `--no-ff` so node commits are kept and the merge commit carries the node trailer (ADR-014).

## Consequences

- Coarse nodes stay reviewable without splitting them on assumptions at decomposition time.
- Bisecting within a node becomes possible.
