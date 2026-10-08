---
title: Accepted plan-first PIES interface
type: log-entry
tags: [pies, planning, adr]
created: 2026-09-25
updated: 2026-09-25
sources: [../../../raw/adr/021-plan-first-public-interface.md]
---

# 2026-09-25 — Accepted plan-first PIES interface

Accepted ADR-021 and wrote the [[../../planning/plan-first-interface|implementation plan]]. Public PIES language moves from DAG operations to creating and running plans; DAG remains internal. The plan preserves progressive capability proof as the standard, with attack failures retained as creation-time warnings. Fanout remains separate parallel assistance.
