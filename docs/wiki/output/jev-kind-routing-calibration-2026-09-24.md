---
title: JEV task-kind calibration attempt — invalid input method
type: output
tags: [pies, jev, routing, calibration]
created: 2026-09-24
updated: 2026-09-24
sources: []
---

# JEV task-kind calibration attempt — invalid input method

> ⚠️ Unverified: this is not a valid routing calibration and must not set a confidence threshold.

## What went wrong

A real `/pies` router receives only the task's pre-run `intent` and `change_spec`. The first JEV run leaked two historical labels. The attempted correction removed labels, but three inputs were still reconstructed from completed node contracts. Those summaries contained downstream information such as security-fix framing, mutation proof, and implementation outcomes that would not exist at routing time.

The resulting 4/5 label-blind agreement and 3/3 `> .85` auto-route agreement are retained only as an audit of the failed method. They are not evidence that `> .85` is calibrated.

## Correct calibration input

For every example, provide only:

```text
intent
change_spec
```

Do not provide acceptance criteria, Scout output, affected paths, historical labels, implementation details discovered during work, proof plans, verification output, contracts, evaluator findings, or publication outcome.

## Available historical corpus

The current `~/.pies/runs/kkchat/` corpus has only two pre-run packets (`test-surface-built-harness` and `browser-proof-tooling`). The other historical nodes retain terminal contracts but not their original packets. Two examples are useful only as a smoke check, not threshold calibration.

## Correct next experiment

1. Collect or recover a set of at least 25 independently human-labeled historical tasks with original `intent` and `change_spec`.
2. Keep labels outside the JEV state.
3. Run JEV once per task on only those two fields.
4. Measure precision above each candidate confidence threshold, deferral rate, and errors by kind.
5. Test deliberately ambiguous and mixed tasks separately.

## Audit metadata

- Model used in invalid attempt: `jev-1.13.0`
- Invalid label-blind attempt: 1,400 input tokens, 304 output tokens, 752 ms
- Historical artifact root inspected: `~/.pies/runs/kkchat/`

See [[../planning/kind-profile-matrix|kind-profile matrix]].
