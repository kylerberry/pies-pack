---
title: Replaced mandatory DAG waves with rolling admission
type: log-entry
tags: [pies, dag, architecture]
created: 2026-09-23
updated: 2026-09-23
sources: [../../../raw/adr/019-dag-admission-policy.md]
---

# 2026-09-23 — Replaced mandatory DAG waves with rolling admission

PIES DAGs now default to rolling ready-frontier admission. `--barriered` retains deliberate batch boundaries; `shared-exclusive` surfaces remain serialized. Git-derived readiness, serial verified merges, and transitive dependency freezing remain unchanged. [[../../sources/adr-019|ADR 019]] records the decision.
