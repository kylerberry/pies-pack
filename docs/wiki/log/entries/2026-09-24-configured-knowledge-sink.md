---
title: Configured knowledge sink with user-level fallback
type: log-entry
tags: [pies, knowledge, verification]
created: 2026-09-24
updated: 2026-09-24
sources: []
---

# 2026-09-24 — Configured knowledge sink with user-level fallback

`knowledge.learning_sink` in `pies.config.yaml` is now required and authoritative: a discovered repository-relative destination when one exists, otherwise `$HOME/.pies/learnings/<repo-basename>/`. `/pies` resolves the configured sink without stopping to ask; Scout always reads the sink as a source. `pies-create-verification-skill` discovers project sources and a project-local sink during repository interview and writes the fallback when none is discovered.
