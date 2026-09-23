# Self-improving PIES

A self-improving PIES treats its policy as a versioned system that changes only when evidence shows a candidate is better than the current canonical variant.

## Goal

Improve correctness, verification quality, reliability, cost, and operator burden without weakening PIES safety or proof requirements.

## Mutable policy surface

A PIES variant may change:

- skill instructions;
- agent prompts, tool bindings, models, and thinking levels;
- verification configuration;
- orchestration prompt templates;
- supporting scripts.

An accepted architectural decision changes only through an ADR amendment or new ADR.

## Variant model

Never mutate the canonical policy during an experiment. Keep named, reproducible variants:

```text
variants/
  v1/
    skills/
    agents/
    scripts/
    manifest.json
```

A manifest records the policy files, model bindings, benchmark revision, and score.

## Improvement loop

```text
baseline variant
→ benchmark suite
→ real-run evidence
→ diagnosis
→ proposed variant
→ benchmark gate
→ paired real-task trial
→ human approval
→ canonical variant
```

### 1. Freeze a baseline

Name and preserve the current canonical variant before changing it. It is the rollback point and comparison control.

### 2. Maintain a benchmark suite

Use tasks with known acceptable outcomes. Cover:

- feature, bug, and refactor work;
- CLI, API, UI, service, library, and CI surfaces;
- blocked and failed runs;
- security and public-surface escalation;
- DAG dependencies and integration failures;
- verification-harness gaps;
- timeout and inactivity recovery.

Score every benchmark with hard invariants before weighted metrics.

| Dimension | Example measure |
| --- | --- |
| Correctness | Criteria met; real-surface proof passes |
| Safety | No secret exposure; approval gates observed |
| Scope | No unrelated changes |
| Verification quality | Correct surface; durable evidence |
| Reliability | Complete contract; recoverable failure |
| Cost | Tokens, elapsed time, model cost |
| Operator burden | Approvals, interventions, review time |

A variant that weakens proof, safety, or failure visibility never wins by being cheaper.

### 3. Collect real-run evidence

Normalize each real PIES run outside the target repository. Include:

- node contract;
- phase checkpoints;
- deadline and inactivity events;
- verification results;
- evaluator findings;
- retries;
- worktree and merge outcomes;
- human approval or rejection reason.

### 4. Diagnose and propose narrowly

A read-only meta agent analyzes records and proposes a minimal policy patch. It does not modify the canonical variant.

Every proposal states:

- observed problem;
- evidence;
- exact files to change;
- expected improvement;
- risks;
- affected benchmark slices;
- rollback condition.

Example:

```text
Pattern: worker deadlines expire although checkpoints show active progress.
Evidence: 8 of 12 worker timeouts; no failed checks.
Proposal: change only the worker active-phase extension rule.
Expected gain: fewer false failures.
Risk: slower detection of genuinely stuck work.
```

### 5. Run the benchmark gate

Run baseline and candidate against the same fixed benchmark revision.

A candidate proceeds only when:

- hard invariants pass;
- correctness and verification quality do not decline;
- the intended metric improves by a meaningful threshold;
- cost remains within its allowed increase, or the increase is justified.

### 6. Run a paired real-task trial

Benchmark success is insufficient. Run baseline and candidate independently on one fresh representative task:

- separate worktrees;
- identical task packet and criteria;
- the same verification environment where possible;
- blinded human review when practical.

Compare code and process evidence: capability proof, scope, cost, recovery behavior, and operator burden.

### 7. Promote with human approval

Human approval promotes a candidate to canonical. The promotion record contains:

1. the policy patch;
2. benchmark results;
3. paired-run comparison;
4. rationale;
5. ADR amendment or new ADR when architecture changes;
6. a rollback pointer to the prior canonical variant.

Retain the prior variant as a known baseline.

## Promotion rule

Human approval alone is insufficient. A candidate can produce attractive code while degrading verification, failure reporting, or safety gates.

```text
hard invariants pass
+ benchmark non-regression
+ paired real-task evidence
+ human approval
= canonical promotion
```

## Initial implementation

Do not begin with a large subsystem. Start with one bounded workflow:

```text
collect records
→ analyze one recurring failure
→ propose one small policy change
→ benchmark baseline vs candidate
→ paired real run
→ request approval
```

Add durable skills only after this loop demonstrates repeated use:

- `pies-evaluate-variant` — execute a fixed benchmark and emit a scorecard;
- `pies-analyze-runs` — identify repeated evidence-backed failure patterns;
- `pies-propose-variant` — prepare a minimal patch and experiment plan;
- `pies-compare-variants` — summarize a paired real-task trial;
- `pies-promote-variant` — perform human-gated canonical promotion.
