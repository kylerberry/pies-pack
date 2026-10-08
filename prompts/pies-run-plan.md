---
description: Run an immutable PIES delivery plan by plan ID
argument-hint: '[--afk] [--barriered] <plan-id>'
---

Use `pies-run-plan ${@}`. Resolve only the existing plan ID; do not recreate, overwrite, or mutate it. Ask for the runtime active-node limit before dispatch if absent. Use current-base grounding, rolling admission by default, and retain `--barriered`.

Keep human approval for each merge unless `--afk` is explicitly supplied. Report partial outcomes: passed, failed, frozen, and unproved. Do not use `/pies-fanout` for delivery.
