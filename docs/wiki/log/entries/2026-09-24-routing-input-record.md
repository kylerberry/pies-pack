---
title: Preserved pre-routing input for future calibration
type: log-entry
tags: [pies, jev, routing, self-improvement]
created: 2026-09-24
updated: 2026-09-24
sources: []
---

# 2026-09-24 — Preserved pre-routing input for future calibration

`run-record.json` now preserves immutable `routing_input` containing only pre-routing `intent` and `change_spec`. When a router runs, it also records choice, confidence, flags, rationale, and lead disposition. Calibration must pass only `routing_input` to JEV; it must not use later evidence or outcomes.
