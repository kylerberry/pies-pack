---
title: PIES kind-profile matrix
type: planning
tags: [pies, routing, verification, system-1]
created: 2026-09-24
updated: 2026-09-24
sources: []
---

# PIES kind-profile matrix

> ⚠️ Proposed policy, implemented as a registry in shadow mode. `skills/pies/assets/kind-profiles.json` is the runtime truth; this page is design rationale. Routing input is pre-run `intent` + `change_spec` only.

A kind profile changes the procedure and proof shape, never the PIES safety floor: exact criteria, applicable deterministic checks, direct evidence, lead evaluation, visible `Unproved`, and escalation/human gates remain required.

## Router result

A future router may select one profile only when the task is clearly within its inclusion signals. It records `kind`, confidence, flags, and rationale. Unsupported, mixed, or low-confidence work falls back to the full base procedure and is resolved by the lead or human.

| Kind | Inclusion signals | Required grounding | Required planning artifact | Proof contract | Additional escalation / fallback |
| --- | --- | --- | --- | --- | --- |
| **bug** | A reported or observed behavior violates an existing expectation | Locate symptom, expected behavior, causal area, prior regressions, and affected surface | A minimal reproducer or diagnostic witness; the causal hypothesis and regression target | The witness demonstrates the defect before the fix when feasible; after the fix, the same path demonstrates expected behavior; a regression test or durable automated witness prevents recurrence | No credible reproducer/witness means `Unproved`, not “fixed.” Public, security, data-loss, or multi-domain defects escalate. |
| **feature** | A new user, consumer, or system capability is requested | Identify actor, journey, existing constraints, trust boundaries, and target surface | Walking skeleton; criterion-to-proof map; types/signatures sketch when crossing a function boundary | The actor completes the specified journey on the correct real surface, or a real consumer integration proves an internal/library capability; criteria have direct evidence | A public API/surface, security implication, irreversible action, or multi-domain capability escalates. |
| **refactor** | The requested outcome is structural/maintainability improvement with no intended observable behavior change | Identify observable invariants, consumers, compatibility boundaries, and the behavior-preserving test suite | Invariant map and change boundary; identify characterization tests or add them before structural change when needed | Relevant existing and characterization tests pass; compile/type/lint checks pass; unchanged interfaces and behaviors have direct preservation evidence | If behavior, public contract, data format, timing, or performance intentionally changes, split or route the changed portion to another kind. |
| **test** | The requested outcome is new or improved automated verification, not product behavior itself | Identify the requested proof mode: behavioral protection or explicit coverage; inspect existing coverage, fixture realism, and relevant wrong behavior | Behavioral: test-oracle statement (condition, expected result, relevant incorrect behavior). Coverage: baseline, named scope, target threshold, and report command | Behavioral mode: the test is discriminating—it fails against a relevant deliberately introduced defect, prior behavior, or mutation and passes against intended behavior. Coverage mode: baseline and final coverage reports meet the explicit criterion for the named scope, and the suite passes. | Coverage alone proves only the stated coverage criterion; it must not be presented as regression protection. Implementation-detail assertions need an explicit rationale. If the needed claim exposes a product defect, route that repair as a bug node. |
| **documentation** | The requested outcome is human-facing or maintainer-facing information, with no product behavior change | Identify audience, local terminology, scope, and affected information | No special planning artifact; Scout hands the worker the relevant sources and conventions | No separate proof contract or real-surface requirement. The lead evaluates accuracy, scope, clarity, and adherence to local conventions before merge. | If the work changes product behavior, route that behavior as a separate bug/feature node; otherwise use the lightweight `Scout → implement → lead evaluate → merge` path. |
| **research** | Read-only investigation producing an evidence-backed answer; no code change requested | Authoritative sources, affected files, prior decisions, knowledge-sink contents | Question list with expected evidence form per question | Findings report answers the stated intent with cited files/sources per claim; explicit uncertainty and gaps; recommended next actions | Unanswered core question without a recorded gap is `Unproved`; idleness is not success. Standalone-only; no worktree, merge, or publication gate. |
| **codebase-analysis** | Read-only architectural or maintainability analysis of the codebase | Architecture docs, knowledge sink, module boundaries, dependency structure | Scope statement naming analyzed and excluded areas | Scoped findings with file references; prioritized simplification/refactor recommendations; risks and dependencies; proposed independently executable follow-up tasks | Findings without file references or prioritized recommendations are `Unproved`. Standalone-only; no worktree, merge, or publication gate. |

## Per-profile procedure overlays

| Kind | Scout emphasis | Verify/evaluate emphasis | Prohibited shortcut |
| --- | --- | --- | --- |
| bug | Reproduction and causal evidence | Same witness before/after; regression prevention | Declaring success from a plausible code change without a witness |
| feature | Earliest end-to-end capability | Correct surface and actor journey | Treating unit tests alone as proof of a user-facing feature |
| refactor | Invariants and consumers | Behavioral preservation and compatibility | Calling an observable behavior change a refactor |
| test | Requested proof mode, oracle quality, fixture realism, and baseline coverage when applicable | Behavioral: discriminating failure and stability. Coverage: scoped baseline/target report and suite pass | Claiming coverage or a passing test proves behavioral protection |
| documentation | Audience, local terminology, and scope | Lead evaluation only; no proof or application surface required | Using documentation routing to conceal a product-behavior change |
| research | Authoritative sources and prior decisions | Report contract: cited claims, gaps, next actions | Treating agent idleness or a chat reply as the terminal report |
| codebase-analysis | Architecture and dependency structure | Report contract: file-referenced findings, priorities, follow-ups | Vague findings without file references or priorities |

## Common record fields

The selected profile adds these fields to the future run record and node contract:

```text
routing_input: intent + change_spec only
kind
routing choice, confidence, flags, and rationale when a router ran
lead disposition: automatic | override | human-selected
profile-specific proof artifact paths
profile-specific proof result
fallback or escalation reason, when used
```

## Deliberate omissions

- **Performance** is not yet profiled. It needs a reproducible benchmark and environment-control contract before routing can select it.
- **Mixed work** is not a sixth profile. Split into independently valuable nodes when possible; otherwise preserve the stricter applicable obligations and ask the lead/human to choose.
- The documentation profile is the explicit exception to the normal proof/surface expectation. It cannot be used for a product-behavior change.
- Report-only kinds (`research`, `codebase-analysis`) never enter DAG execution; the supervisor rejects them and recommends a standalone run.

## Routing decisions

1. **Automatic-routing threshold:** provisional confidence threshold is `> .85`; calibrate precision above that threshold against historical PIES tasks with original pre-routing `intent` and `change_spec` before activation. [[../output/jev-kind-routing-calibration-2026-09-24|The first attempt used invalid post-run inputs and supplies no calibration signal]].
2. **Documentation:** no proof contract or app boot. Use `Scout → implement → lead evaluate → merge` for documentation-only work.
3. **Behavioral-test fallback:** when a pre-fix reproducer is unavailable and mutation tooling is absent, use a temporary targeted production mutation; prove the test fails, then restore it.
4. **Refactor preservation evidence:** a cited characterization suite is sufficient. The plan/contract names the exact tests and invariants relied on; a generated snapshot is optional, not required.

See [[roadmap|PIES roadmap]].
