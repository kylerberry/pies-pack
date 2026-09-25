---
title: Ingested PIES architecture sources
type: log-entry
tags: [ingest, pies]
created: 2026-09-22
updated: 2026-09-22
sources:
  - ../../../raw/adr/README.md
  - ../../../raw/reviews/direct-pies-retry.md
  - ../../../raw/reviews/herdr-node-lifecycle-proof.md
---

# 2026-09-22 — Ingested PIES architecture sources

Moved the 18 ADRs and ADR index into `docs/raw/adr/`; moved two execution reports into `docs/raw/reviews/`. Added one wiki source page per moved document, [[../../architecture/pies-workflow|PIES workflow]], and [[../../output/self-improving-pies|Self-improving PIES]].

ADR-003 was revised after ingest: the lead is now a context role, and execution hosting is selected by the invoking prompt. The current `pies-execute-dag` skill conforms to that decision.
