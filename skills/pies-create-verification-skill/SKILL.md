---
name: pies-create-verification-skill
description: Generate and prove a project-local verification skill plus pies.config.yaml routing for a repository with no reliable scripted way to exercise its real UI, CLI, API, service, library, CI, desktop, or mobile behavior. Use explicitly for verification bootstrap, not routine feature work.
disable-model-invocation: true
---

# PIES: create verification skill

Generate `.pi/skills/verify-<app>/` for cold use by workers and evaluators, and index it in `pies.config.yaml`. Inspect the repository first; ask the user only for facts the repository cannot establish.

## 1. Interview the repository

Determine:

- **Surfaces:** what users or callers touch. Include every material surface; identify the primary one.
- **Run:** documented build/start commands, ports, environment, fixtures, seed data, and authentication.
- **Doctor:** a read-only check for the expected build/version, owned process or port, credentials, and required state.
- **Drive:** existing harnesses first; otherwise use browser automation for web/Electron, PTY or tmux for CLI/TUI, HTTP for services, a public-call harness for libraries, or the platform runner for CI/mobile/desktop.
- **Observe:** action plus result, including visible output and side effects such as files, rows, messages, logs, refs, or artifacts.
- **Isolate:** classify each surface as `per-process`, `per-worktree`, or `shared-exclusive`. Prefer unique ports, profiles, and data directories derived from the worktree or run ID.
- **Cleanup:** exact teardown for owned processes and scratch state. Never kill by process name or delete evidence.
- **Knowledge:** documentation roots and entry indexes Scout should read, plus any existing project-local durable-learning destination.

Read project instructions, package scripts, Makefiles, CI definitions, routes, commands, existing tests, and documentation. Prefer existing production-facing harnesses and stable handles such as ARIA labels, data attributes, prompt strings, command names, and route paths.

If the checkout cannot build or start, stop and report the blocker; do not repair product code inside this skill. You may create clearly marked verification scaffolding for an irrelevant missing asset only when it cannot affect production behavior, and must remove it during cleanup.

## 2. Generate the project skill

Create:

```text
.pi/skills/verify-<app>/
├── SKILL.md
├── features/
│   ├── README.md
│   └── <feature-id>.md
└── scripts/                 # only when helpers are needed
```

The generated `SKILL.md` must have valid frontmatter:

```yaml
---
name: verify-<app>
description: Verify <app> through <surfaces>. Use when proving user-visible behavior or independently evaluating changes in this repository.
---
```

Write for an agent with no prior repository context. Use exact, tested commands and no placeholders. Include:

### Launch

Build/start commands, required environment, readiness signal, ownership tracking, and teardown. For short-lived programs, explain one-time build/setup and isolated invocation instead of inventing a server lifecycle.

### Doctor

One read-only command or helper that decides whether the instance is safe and useful to drive. It must detect stale/wrong builds and unowned shared resources where applicable.

### Drive

The harness and repository-specific selectors, prompts, routes, commands, fixtures, or public calls. `drive` is the interaction mechanism; each feature command is the executable journey.

### Evidence

Require the real user/caller path, action plus resulting state, and relevant side effects. Test-only endpoints and internal setters do not prove a capability. Use mocks only at existing production boundaries. Verify what dry-run or test modes actually avoid. Name an ignored evidence directory; evidence survives cleanup.

### Cleanup

Stop only owned instances and remove only run-created scratch state. Run after success and every failed attempt. Preserve evidence.

### Isolation

State the classification and exact concurrency procedure. For `shared-exclusive`, say that PIES DAG nodes using the surface must run serially.

### Helpers

Every helper must be executable, invoked in `SKILL.md`, bounded to run-owned resources, and understandable without reading its source.

## 3. Seed the feature map

Create `features/README.md` as an index. Add files for the primary 3–5 user-facing features evident from routes, commands, menus, public APIs, or docs. Every file uses these headings:

```markdown
## Sub-features
## How to get to it (user POV)
## Driving it with <harness>
## Gotchas
```

Describe observable success and side effects. Do not claim coverage for unexecuted paths.

## 4. Create or extend `pies.config.yaml`

Keep it a concise machine-readable router; the generated skill owns operational explanation. Preserve existing entries. Add or tighten freely; never weaken or remove a check, surface, or feature without explicit approval and a recorded amendment.

Discover project documentation roots and a project-local durable-learning sink from repository instructions and docs. Write them into `knowledge`. When no sink is discovered, write `$HOME/.pies/learnings/<repo-basename>/`; do not ask the user or invent a repository directory. Scout reads the configured sources and sink on later `/pies` runs.

Use this shape, omitting lifecycle fields that do not apply to short-lived surfaces:

```yaml
version: 1
knowledge:
  sources: [<discovered repository-relative doc roots or entry documents>]
  learning_sink: <discovered repository-relative sink | $HOME/.pies/learnings/<repo-basename>/>

checks:
  test: <existing repository command>

surfaces:
  <surface-id>:
    skill: .pi/skills/verify-<app>/SKILL.md
    start: <exact command or helper>
    ready: <exact read-only readiness command>
    doctor: <exact read-only command or helper>
    drive: <mechanism, not necessarily a command>
    cleanup: <exact command or helper>
    isolation: per-process | per-worktree | shared-exclusive
    evidence: <required observable artifacts>

features:
  - id: <stable-feature-id>
    paths: [<changed-path globs>]
    surface: <surface-id>
    guide: .pi/skills/verify-<app>/features/<feature-id>.md
    proves: <user/caller-visible result>
    command: <exact executable journey>
```

Do not copy the feature guide into YAML. The config answers which verification applies and how to invoke it; the skill and guide explain how it works.

## 5. Prove the generated system

Run one mapped feature end to end:

1. doctor;
2. launch when required;
3. wait for readiness;
4. execute the feature command through the declared drive mechanism;
5. capture the declared evidence and side effects;
6. cleanup, including after failed attempts;
7. confirm evidence remains after cleanup.

Fix verification files until this passes. A generated skill that has not completed this sequence is a draft. Do not report product success when the harness itself is unproved.

## 6. Report

Return:

```markdown
## Surfaces
- <surface>: <actor/caller boundary>
## Generated
- <skill, helpers, feature guides, and config entries>
## Proof
- Doctor: `<command>` — <result>
- Launch/readiness: `<commands>` — <result or n/a>
- Feature: <id>
- Command: `<command>`
- Observed: <result>
- Evidence: <paths>
- Cleanup: `<command>` — <result>
## Isolation
- <surface>: per-process | per-worktree | shared-exclusive — <procedure>
## Unproved
- None | <remaining gap>
```

Success requires `Unproved: None`. Otherwise report the draft and blocker without presenting it as ready.
