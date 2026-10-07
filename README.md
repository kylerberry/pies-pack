# PIES skills

PIES helps you ship code changes with agents without treating “the agent said it worked” as proof.

## What it does

- **Gets a change from request to evidence.** One lead understands the work, delegates implementation, checks the result, and leaves a concise contract explaining what changed and how it was proved.
- **Uses the right shape of work.** Bugs start with a reproduction; features prove a user outcome; refactors preserve named behavior; test work proves either protection or the requested coverage; research and codebase analysis return useful reports without pretending they are mergeable code changes.
- **Proves, rather than asserts.** PIES runs relevant checks and real user surfaces where they apply. It records verification, missing proof, and simplifier deletions—not just a success claim.
- **Makes larger work manageable.** A DAG captures real dependencies, then admits newly unblocked work as soon as it is safe to start. You can deliberately choose a barrier when coordination matters.
- **Lets you delegate visibly.** `/pies-fanout` asks for approval, launches independent workers in Herdr, monitors them, and brings their terminal reports back for one manager-level summary.
- **Remembers useful context.** Run records, wave briefs, project knowledge, and durable learnings make later work easier to ground and eventually give the self-improvement loop something trustworthy to learn from.

## How the agents work together

PIES separates doing the work from judging it. That avoids an implementer grading its own reasoning, while using cheaper models for cheaper jobs.

| Role | Job | Why it is separate |
|---|---|---|
| **Lead** | Holds the task context, plans, evaluates, and makes the node disposition. It does not write production code. | Owns the whole outcome without becoming the implementer. Current binding: GPT-5.6 Terra, medium thinking. |
| **Scout** | Finds relevant code, project knowledge, and verification guidance. | Fast, focused reading keeps expensive reasoning for decisions. |
| **Worker** | Makes the scoped code change and supplies implementation evidence. | Gives one agent clear implementation accountability. |
| **Simplifier** | Deletes only work the criteria do not require; reports every deletion and why. | A separate pass catches unnecessary complexity after the worker is done. Current binding: GLM 5.3, high thinking. |
| **Cold evaluator** | On escalation, independently checks exact criteria and reruns proof without planner/worker rationale. It never edits. | A fresh review is harder to talk into accepting a flawed plan or misleading evidence. Current binding: GLM 5.3, high thinking. |

Model independence is deliberate: the simplifier and cold evaluator must use a **different model family from the worker**. With a GPT worker, GLM or Anthropic review is appropriate; with a GLM worker, use GPT or Anthropic review. That reduces correlated mistakes. The lead retains grounded primary evaluation; the cold evaluator is used when risk or ambiguity earns the extra cost.

## Pi integrations

These are runtime Pi extensions used alongside PIES, not code bundled by this package.

- **`@andrewjacop/pi-herdr` + Herdr CLI** — gives PIES visible, controllable agent panes. The fanout extension uses the CLI to create panes, launch workers, monitor them, and collect their reports.
- **`pi-subagents`** — lets configured PIES role bindings delegate bounded scout, worker, simplifier, and independent-evaluator work.
- **`pi-typesafe-jev`** — exposes JEV, a fast typed decision engine. PIES currently uses it in shadow mode to classify task kind without controlling the procedure; planned evaluation shadowing will compare JEV’s evidence assessment with lead and cold-evaluator decisions before granting it any narrower authority.
- **`pi-ask-user`** — powers the `/pies-fanout` approval wizard. Fanout will not launch without explicit task and configuration approval.

## Contents

- `skills/pies`: one change from grounding through proof
- `skills/pies-decompose-to-dag`: turn a larger request into independently verifiable outcomes
- `skills/pies-execute-dag`: run dependency-aware work with verified integration
- `skills/pies-create-verification-skill`: create a project-local way to drive and prove a real app surface
- `agents/`: lead, simplifier, and independent-evaluator bindings
- `extensions/pies-fanout.ts` + `prompts/pies-fanout.md`: visible, approval-gated worker fanout
- `scripts/dag-next`: find work ready to start from Git history
- `scripts/pies-run-summary`: summarize historical routing records across run-record versions

## Use

Open this repository as a trusted Pi project to use its skills.

```text
/skill:pies <task>
/skill:pies --afk <task>
/skill:pies-decompose-to-dag <spec>
/skill:pies-execute-dag [--afk] [--barriered] [dag.json]
/skill:pies-create-verification-skill
/pies-fanout [tasks, references, or instruction]
/pies-fanout-status
```

`/pies-fanout` needs Herdr on `PATH` (or `$HERDR_BIN`) and an interactive Pi session with `ask_user`; it checks Herdr and asks for final launch approval.

To install the fanout extension and prompt as a local Pi package:

```sh
pi install /path/to/pies-skills
```

Skills remain project-discovered; the package manifest exports the fanout resources.

## Roadmap

See the maintained [PIES roadmap](docs/wiki/planning/roadmap.md).

Next:

1. Calibrate JEV task-kind routing from real shadow-run data before it controls a procedure.
2. Add JEV **evaluation shadowing**: score a normalized proof packet, compare it with lead/cold-evaluator outcomes, then earn limited terminal authority only where evidence supports it.
3. Build self-improvement analysis from normalized run records, terminal outcomes, and wave briefs.

## Checks

```sh
npm test
npm run typecheck
```
