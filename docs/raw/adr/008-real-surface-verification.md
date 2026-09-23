# ADR-008: Real-surface verification and the verify map

**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kyler

## Context

The original loop verified with tests, typecheck, lint, and format. Those are proxies. pies-decompose-to-dag builds every node around an observable useful result on the primary journey, then the node accepted itself without anyone running that journey. pstack's `prove-it-works` requires verifying against the real artifact, and treats inconclusive or wrong-surface verification as a failure.

`pies.config` lists available verification tools. A tool list cannot say which surface proves which behavior.

## Decision

- Extend the config into a verify map in `pies.config.yaml`: available checks, the real surfaces and how to drive them, and which code proves which behavior on which surface.
- Every node's output names the surface, command, and observed result that proved its capability (ADR-012).
- Inconclusive or wrong-surface verification is not a pass. The node reports it rather than proceeding.
- Agents may add to the verify map when they find a gap. Removals follow ADR-007.
- The existing script-discovery rules stay: read the actual script list, run every applicable script, never treat one as covering another.

## Options Considered

### Option A: Fixed tool list (original)
**Cons:** Cannot express surface. Green unit tests pass for a broken journey.

### Option B: Agent assembles verification per node
**Cons:** Inconsistent across nodes. Hard to audit.

### Option C: Agent-extensible verify map (chosen)
**Pros:** Declarative and auditable, improves as gaps are found.

## Format

```yaml
# pies.config.yaml
version: 1

# Deterministic checks. Every applicable one runs; none covers another.
checks:
  test: npm test
  typecheck: npm run typecheck
  lint: npm run lint
  format: npm run format:check

# Real surfaces the app exposes, and how to exercise each.
surfaces:
  api:
    start: npm run dev:api
    ready: curl -sf localhost:3000/health
    drive: curl or a script under scripts/verify/
    evidence: status code, response body, relevant server log lines
  web:
    start: npm run dev
    ready: curl -sf localhost:5173
    drive: playwright
    evidence: screenshot plus a DOM assertion

# Which code proves what, on which surface. Grows as agents find gaps.
features:
  - id: guest-checkout
    paths: [src/checkout/**, src/api/orders/**]
    surface: web
    proves: A guest can complete a purchase and an order row exists
    command: npx playwright test verify/checkout.spec.ts
```

## Usage

1. Run every applicable entry in `checks`.
2. Match the node's diff against `features[].paths`.
3. For each match, start its surface, wait for `ready`, run `command`, and record the observed result in the output contract.
4. A diff matching no feature: find the surface, prove the behavior, then add a feature entry.
5. A behavior no listed surface can drive goes in the output's Unproved field.

All sections are additive by default. Removals are recorded as amendments in the node output (ADR-007).

## Consequences

- Nodes whose capability cannot be driven on a real surface are visible.
