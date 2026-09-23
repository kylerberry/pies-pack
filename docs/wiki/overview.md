---
title: Pies Skills Overview
type: overview
tags: [pies, documentation]
created: 2026-09-22
updated: 2026-09-22
sources: [../raw/adr/README.md]
---

# Pies Skills Overview

This repository defines PIES: a lead-owned workflow for reliable agent-assisted code changes. It contains skills, role bindings, DAG status tooling, architecture decisions, and a documentation vault.

The core design is [[architecture/pies-workflow|PIES workflow]]. Its canonical decisions are indexed in [[sources/pies-adr-index|PIES ADR index]].

## Current status

- Direct `/pies` runs use the initiating session as lead.
- DAG execution is worktree- and artifact-oriented; the invoking prompt selects execution hosting.
- The real direct retry remains unproved because browser proof was unavailable and the scoped file changed concurrently. See [[sources/direct-pies-retry|retry report]].
- The proposed self-improvement loop is documented in [[output/self-improving-pies|Self-improving PIES]].

See [[index|Documentation Index]].
