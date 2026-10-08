---
title: PIES roadmap
type: planning
tags: [pies, roadmap, planning]
created: 2026-09-23
updated: 2026-09-25
sources: [../raw/adr/README.md]
---

# PIES roadmap

## High priority — evidence and validation

Existing validation debt. Most open work is evidence, not features.

1. **Real-node contract validation.** Merge one real node after reading only its output contract, no diff. Proves the ADR-001 comprehension model. (ADR-001 action item 2)
2. **Lead/worker flip solo test.** Run the ADR-002 separation change alone on one node before combining it with other changes. (ADR-002 action item 1)
3. **Disposable DAG lifecycle test.** Prove the mechanism-neutral packet, heartbeat, checkpoint, contract, rolling admission, transitive freezing, explicit barriers, and shared-exclusive serialization on a throwaway repository before trusting a new runner in production. (ADR-003 and ADR-019 action items)
4. **Unproved direct `/pies` retry.** Re-run with browser proof available; the original run was blocked by browser authorization and a concurrent edit to the scoped file. ([[../sources/direct-pies-retry|retry report]])

## Discussion — system-1 task-kind routing

**Proposal.** Classify each incoming task with a fast, cheap "system 1" model and route it to the correct PIES operations for its kind — bug, feature, refactor, performance, tests, documentation, and so on.

**Current state.**

- ADR-004: input normalization already classifies work kind; criteria carry `authored` or `dag` provenance.
- ADR-005: procedure variants exist for feature, bug, and refactor only. The perf kind is deferred. Tests and documentation kinds do not exist.

**Open questions.**

1. **Authority.** Does the classifier decide, or advise with lead confirmation? Recommended: advisory — record kind and confidence in the node packet; the lead confirms or overrides.
2. **Placement.** Inside `/pies` normalization, or an upstream router before decomposition? If upstream, does it also classify each private plan node during `pies-create-plan`?
3. **Fallback.** Low-confidence or mixed-kind tasks: run the full PIES loop, or ask the human?
4. **Kind set.** Which kinds earn modified operations, and what does each skip or add? A tests kind may reduce to criterion-first only; a documentation kind may skip real-surface proof (ADR-008 allows additive map entries, not removals — check whether that rule extends to kind-based skips).
5. **Model.** Which system-1 model — scout's `glm-5.3-flash` or another — and what measured accuracy on a labeled task sample before adoption?
6. **Auditability.** Classification and rationale recorded with provenance in the node packet, mirroring ADR-004.
7. **Misroute cost.** What breaks when a bug is classified as a refactor (no repro step)? Which kinds need a guardrail that overrides the router?
8. **ADR path.** This extends ADR-004 and ADR-005; record a new ADR once decided.

**Outcome needed:** decisions on the questions above, then an ADR and implementation plan.

## Plan-first delivery interface

ADR-021 replaces DAG-named public surfaces. `/pies-create-plan` saves an immutable spec-backed plan; `/pies-run-plan` explicitly starts it; `/pies` remains for a known scoped change. The private graph, five-field nodes, Git-derived status, and rolling admission stay internal. Planning attacks preserve progressive capability proof and record persistent warnings. See [[plan-first-interface|implementation plan]].

## Parallel fanout boundary

Fanout is parallel assistance: session-derived independent tasks, visible workers, and manager-level reports. It must not create, run, schedule, or integrate shared-repository delivery plans. `/pies-run-plan` alone owns plan packets, admission, serial verified merges, and durable wave evidence.

## Possible — System-1 (JEV) opportunities

All items below are advisory today. They record a bounded classification, score, or choice with evidence references; the lead, evaluator, deterministic checks, and human gates retain authority unless a calibrated item explicitly earns narrower terminal authority.

1. **Task-kind routing.** Registry shipped (`skills/pies/assets/kind-profiles.json`, ADR-020): seven kinds, shadow-mode default, report-only `research`/`codebase-analysis` standalone profiles, DAG rejection of report nodes. Next: accumulate ≥25 shadow-mode `routing_input` pairs, then calibrate per-kind precision above `0.85` before enabling authoritative auto-routing. The proposed [[kind-profile-matrix|kind-profile matrix]] records the design rationale.
2. **Evaluation shadow.** After worker/simplifier evidence is assembled, JEV evaluates a normalized packet using the **lead-selected kind** while routing remains shadow-only. It records per-criterion assessment, confidence, risk flags, and candidate disposition; lead/cold-evaluator disposition remains terminal. Compare results per kind, especially false passes and escalation misses. It can earn bounded JEV terminal authority only for calibrated, low-risk profiles; unknown, low-confidence, flagged, and deterministically escalated work always routes to the lead/cold evaluator.
3. **Escalation triage.** Flag possible multi-domain, public-surface, or security implications at intake. It may raise an escalation; it must never clear one.
4. **Historical-run tagging and clustering.** Tag lead-owned run records, terminal outcomes, and wave briefs; identify recurring failure patterns for the self-improvement meta agent. Graphify remains the future corpus-query layer.
5. **Scout source ranking.** Rank likely-relevant project knowledge pages, learnings, verification guides, and code areas. Scout must still read the selected sources.
6. **DAG split and dependency critique.** Flag likely independently mergeable outcomes, bad splits, or missing semantic dependencies during decomposition. The lead/human still approves the DAG.
7. **Verification-route suggestions.** Suggest likely applicable verification features or surfaces when path matching and task intent disagree. It cannot waive a deterministic check or real-surface proof.
8. **Evaluator-finding triage.** Categorize and rank possible P0 defects, scope creep, and missing criterion evidence. The lead and escalation evaluator alone decide acceptance.

## Deferred

- **Perf work kind.** Pending; now overlaps the routing discussion above. (ADR-005)
- **Watchdog.** Revisit if evaluation misses problems a per-write review would have caught. (ADR-011)
- **Model tiering scores.** ADR-015 is provisional; revisit once eval scores exist.
- **Self-improvement evidence corpus.** Lead-owned `run-record.json` files now preserve immutable pre-routing `intent` and `change_spec` plus compact, normalized links to `~/.pies` evidence. A future meta agent should analyze those records, terminal outcomes, and wave briefs. Graphify is the preferred future query layer because it can index this non-wiki artifact corpus without imposing a documentation hierarchy; do not integrate it until the bounded improvement loop needs it. ([[../output/self-improving-pies|Self-improving PIES]])

## Related pages

- [[../architecture/pies-workflow|PIES workflow]]
- [[../sources/pies-adr-index|PIES ADR index]]
