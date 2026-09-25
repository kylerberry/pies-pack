---
title: Made DAG concurrency a caller runtime choice
type: log-entry
tags: [pies, dag, scheduling]
created: 2026-09-23
updated: 2026-09-23
sources: [../../../raw/adr/019-dag-admission-policy.md]
---

# 2026-09-23 — Made DAG concurrency a caller runtime choice

Removed the fixed three-node limit. Before dispatch, the caller chooses the active-node limit for that run; PIES records it in `supervisor.json` but does not add it to `dag.json` or infer a default. `shared-exclusive` surfaces still serialize.
