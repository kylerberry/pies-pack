# PIES skills

ADR-driven Pi skills for single-node delivery and DAG execution.

## Contents

- `skills/pies`: one-node lead workflow
- `skills/pies-decompose-to-dag`: five-field DAG design
- `skills/pies-execute-dag`: wave supervisor
- `skills/pies-create-verification-skill`: project verification bootstrap
- `.pi/agents`: lead, deletion-only simplifier, and read-only evaluator
- `scripts/dag-next`: Git-derived done set and ready frontier

## Use

Open this repository as a trusted Pi project, or install it as a Pi package. The package exports `skills/` and the `pies-dag-next` command. Global Pi settings bind `worker` to `gpt-5.6-luna` and `scout` to `glm-5.3-flash`; custom agent files bind their own models. `pies-lead` uses `gpt-5.6-terra` with medium thinking.

```text
/skill:pies <task>
/skill:pies --afk <task>
/skill:pies-decompose-to-dag <spec>
/skill:pies-execute-dag [--afk] [dag.json]
/skill:pies-create-verification-skill
```

Run checks with `npm test`.
