---
title: Shipped task-kind routing registry
type: log-entry
tags: [pies, routing, adr]
created: 2026-09-24
updated: 2026-09-24
sources: [../../../raw/adr/020-task-kind-routing.md]
---

# 2026-09-24 — Shipped task-kind routing registry

ADR-020 accepted. Added `skills/pies/assets/kind-profiles.json` (seven kinds, shadow default, `>.85` auto-route gate, router input `intent`+`change_spec` only) and integrated routing into `/pies` normalization. Added read-only `research` and `codebase-analysis` profiles with report contracts; they are standalone-only and rejected by DAG admission. Registry invariants are covered by `tests/test_kind_profiles.py`.
