# ADR-020: Task-kind routing

**Status:** Accepted
**Date:** 2026-09-24
**Deciders:** Kyler

## Context

PIES normalizes every task to `feature`, `bug`, or `refactor` (ADR-004, ADR-005) with thin procedural variance. Read-only work — documentation, research, codebase analysis — is forced through an implementation-and-merge procedure or handled ad hoc outside PIES. A fast decision engine (TypeSafe/JEV) is available for cheap classification, but an earlier calibration attempt was invalid: labels leaked into inputs, and summaries were reconstructed from completed contracts. A real router sees only pre-run `intent` and `change_spec`.

## Decision

1. **Registry.** `skills/pies/assets/kind-profiles.json` is the runtime routing truth. Kinds: `bug`, `feature`, `refactor`, `test`, `documentation`, `research`, `codebase-analysis`. The wiki matrix is design rationale.
2. **Router input.** Only pre-routing `intent` and `change_spec` (already preserved in `run-record.json` as `routing_input`). No criteria, scout output, proof, contracts, or outcomes.
3. **Modes.** `shadow` (default) and `authoritative`, overridable via `pies.config.yaml` `routing.mode`. Shadow runs the router, records `routing_result`, and changes nothing — it accumulates calibration data. Authoritative applies the profile only when the kind is in `auto_route_kinds`, confidence exceeds `0.85`, and no mixed-work/escalation flag is raised; otherwise the lead resolves the kind.
4. **Manual kinds.** `documentation`, `research`, and `codebase-analysis` are never auto-routed until each has its own calibration data. Documentation removes proof obligations; the report kinds remove the entire merge model — the cheapest classifications must not be the least certain.
5. **Availability.** Router unavailable → record `routing_result: unavailable`, proceed with base normalization and lead selection. No cheap-model fallback classifier; a second model may later run in shadow.
6. **Report-only kinds.** `research` and `codebase-analysis` are read-only: Scout (plus optional read-only worker), lead evaluates the report against the registry proof contract, run returns the report. No worktree, commit, merge, or publication gate. They are standalone-only; `pies-execute-dag` rejects them at admission with a standalone recommendation. Terminal success requires the report contract; idleness is not success.
7. **Test kind.** Two proof modes: behavioral (discriminating test; temporary targeted mutation is the accepted fallback demonstration) and explicit coverage (baseline, scope, threshold, final report). Coverage alone never claims regression protection.
8. **Durable findings** from report runs follow existing sink rules; no new storage roots.

## Options Considered

### Option A: Keep three implementation kinds; route read-only work outside PIES
**Cons:** No contract, no run records, no self-improvement signal for half the real workload.

### Option B: Auto-route everything JEV returns above threshold
**Cons:** Uncalibrated; the low-cost kinds (documentation, reports) are exactly where misrouting removes safety.

### Option C: Registry + shadow-first + per-kind activation (chosen)
**Pros:** Mechanism ships once; calibration data accumulates from real runs; each kind earns auto-routing independently.

## Consequences

- `/pies` normalization consults the registry in every mode.
- DAG admission explicitly rejects report-only nodes.
- Activation of `authoritative` mode and each new auto-route kind is a calibration-gated decision with recorded evidence.

## Action Items

1. [x] Add `kind-profiles.json` registry with routing policy and eight-kind profiles (five prior + research + codebase-analysis with behavioral/coverage test modes).
2. [x] Integrate routing into `/pies` normalization; reject report-only kinds in `pies-execute-dag`.
3. [x] Validate the registry with deterministic tests.
4. [ ] Accumulate ≥25 labeled `routing_input` pairs via shadow mode; report per-kind precision above `0.85`, deferral rate, and errors before enabling `authoritative`.
