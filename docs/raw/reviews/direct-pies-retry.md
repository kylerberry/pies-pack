# Direct PIES retry — `test-surface-built-harness`

Date: 2026-09-22
Lead: primary Pi session (no `pies-lead` child launched)
Decision: **Unproved / not accepted**

## Source changes

Updated ordinary direct `/pies` guidance:

- `skills/pies/SKILL.md`
  - States that the initiating Pi or Herdr session is the lead and must not launch `pies-lead` as a child.
  - Limits direct children to `scout`, `worker`, `pies-simplifier`, and escalation-triggered `pies-evaluator`.
  - Adds phase-local deadlines, inactivity checks, and checkpoint requirements: Scout 15m/5m, Worker 45m/10m, Simplifier 15m/5m, Evaluator 30m/10m.
  - Requires an inactive phase to be surfaced, deadline evidence to be retained, and a fresh direct child for a safe retry.
- `README.md`
  - Documents that ordinary `/pies` uses the initiating session as lead.

`skills/pies-execute-dag/SKILL.md` was not changed by this retry. It already had an unrelated pre-existing uncommitted artifact-location edit and its DAG node-session orchestration was deliberately left unchanged.

Source checks:

- `git diff --check` in `/Users/kylerberry/Projects/pies-skills`: passed.
- `npm test` in `/Users/kylerberry/Projects/pies-skills`: passed (4 `test_dag_next` tests).
- Direct-guidance assertion script: passed.

## Artifact paths

- Node packet: `/Users/kylerberry/.pi/agent/pies/pies-test-surface-built-harness-9449600f8d39/runs/test-surface-built-harness/node.md`
- Plan: `/Users/kylerberry/.pi/agent/pies/pies-test-surface-built-harness-9449600f8d39/runs/test-surface-built-harness/plan.md`
- Phase control: `/Users/kylerberry/.pi/agent/pies/pies-test-surface-built-harness-9449600f8d39/runs/test-surface-built-harness/phase-control.md`
- Scout grounding: `/Users/kylerberry/.pi/agent/pies/pies-test-surface-built-harness-9449600f8d39/runs/test-surface-built-harness/scout-grounding.md`
- Worker checkpoint: `/Users/kylerberry/.pi/agent/pies/pies-test-surface-built-harness-9449600f8d39/runs/test-surface-built-harness/worker-checkpoint.md`
- Worker report: `/Users/kylerberry/.pi/agent/pies/pies-test-surface-built-harness-9449600f8d39/runs/test-surface-built-harness/worker-report.md`
- Worker output: `/Users/kylerberry/.pi/agent/pies/pies-test-surface-built-harness-9449600f8d39/runs/test-surface-built-harness/worker-output.md`

## Phase outcomes

### Ground — passed

A direct `scout` confirmed that the node and plan map to the sole scoped file, `public/test-embed.html`, and recorded deterministic checks plus browser-surface requirements. It did not trigger escalation evaluation.

### Worker — blocked

A direct `worker` inspected the existing unverified diff and made one focused interval adjustment in the version it initially saw. During validation, an unapproved concurrent actor rewrote the sole scoped file. The worker was instructed not to overwrite, restore, or accept the replacement. No `pies-simplifier` or `pies-evaluator` was launched: their required input was not a stable worker diff, so further phases would not yield valid PIES proof.

## Verification and lead evaluation

The worker recorded successful deterministic runs before the concurrent rewrite:

- `git diff --check`
- `pnpm type-check`
- `pnpm test` — 12 files, 113 tests
- `pnpm build:all`

The same checks also passed after the rewrite, but those later results are not acceptance evidence for the worker's implementation.

Browser proof is **Unproved**. Local preview listeners served the built artifacts and no chat message was submitted, but Safari remote automation required unavailable password-authorized enablement and AppleScript browser access was denied by macOS automation authorization. The form could not be driven to prove same-origin initialization or cross-origin behavior.

The retry also exposed a plan-semantics issue: the SPA allowlist validates the parent/harness `event.origin`, rather than the optional `chatUrl` iframe origin. Therefore a second SPA origin under an allowlisted parent is expected to initialize; it cannot demonstrate the requested target-origin mismatch. This was not fixed because origin/protocol changes are outside the node scope.

Lead evaluation: **fail**. The final scoped diff is not attributable to the worker, browser criteria lack direct evidence, and the target-origin mismatch assumption is invalid. The existing change has not been accepted, merged, published, or simplified.

## Node contract

# Node test-surface-built-harness

## Amendments

- None.

## Capability proved

None.

## Proof

- Surface: built-artifact browser harness
  Command: `pnpm build:all` followed by local preview and browser interaction
  Observed: built artifacts served, but browser automation authorization blocked interaction; no chat message was sent.

## Criteria disposition

- Harness language accurately represents local built smoke testing: **Unproved** — final file was concurrently rewritten during validation and not accepted.
- It can use a configurable SPA URL rather than forcing same origin: **Unproved** — static mapping exists, but no browser interaction proof was captured.
- Default same-origin flow remains simple: **Unproved** — browser interaction was blocked.
- Browser interaction/configuration can demonstrate the cross-origin option or clearly reports mismatch: **Unproved** — browser interaction was blocked; additionally, the planned target-origin mismatch does not match the application’s parent-origin validation semantics.
- Existing relevant checks pass, or report precise Unproved evidence: deterministic checks passed, but the accepted implementation is not stable; browser proof remains Unproved.

## Decision trail

- Direct primary-session lead: source guidance now prohibits a nested `pies-lead` child for ordinary `/pies` runs.
- Target-origin mismatch: static protocol inspection showed that `event.origin` of the parent/harness, not the optional SPA URL origin, controls allowlisting.
- Concurrent modification: the worker reported an unapproved rewrite while validating; the lead retained it and stopped rather than overwrite or accept it.

## Inheritance

Re-establish a stable, owner-approved `public/test-embed.html` diff before retrying. Correct the browser criterion to prove configured cross-origin initialization under an allowlisted parent, or separately prove documented parent-origin rejection. Enable an authorized browser-driving mechanism before requiring interactive surface proof. Re-run Simplify → Verify → lead evaluation only after that stable worker result exists.

## Unproved

- The final `public/test-embed.html` changed concurrently and is unapproved.
- Browser interaction proof is unavailable.
- Required final simplifier phase and lead acceptance cannot occur against an unstable worker diff.

## Retained worktree state

Worktree: `/Users/kylerberry/.herdr/worktrees/kkchat/pies-test-surface-built-harness`
Branch: `pies/test-surface-built-harness`

No ignored environment files were inspected, printed, sourced, copied, or bundled.

Initial preserved state before retry:

- One modified tracked file: `public/test-embed.html`
- Diff summary: 521 insertions / 97 deletions
- Patch SHA-256: `3c5fbd2286ec83f0b5aae89275ce80ecf0a972cc28c179775710aa4a1240d395`

Final retained, unapproved state:

- One modified tracked file: `public/test-embed.html`
- Diff summary: 328 insertions / 124 deletions
- Current patch SHA-256: `889da6b5811dc2c9a6cd634425e2c26acaf86ff238e301f95d512fbcf9b1c1e3`
- Current file SHA-256: `26f2d9328b282a8c31347f6191a530e8999ebadccc3674d60025dfa2890c3e67`
- `git diff --check`: passed

The differing initial and final fingerprints are retained as evidence of the unapproved concurrent modification. No reset, merge, publication, acceptance, or worktree cleanup was performed.
