# Documentation Vault Contract

`docs/` is this repository's durable, LLM-maintained documentation vault.

## Operating model

This vault adapts Andrej Karpathy's [LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f): immutable raw sources, a persistent and interlinked wiki, and this schema as the agent's operating contract. Humans curate sources and direct investigation; the LLM maintains the wiki.

## Structure and authority

- `raw/` holds canonical source artifacts: ADRs, specifications, context, plans, research, and assets. It is immutable during synthesis and wins when it conflicts with a wiki page.
- `wiki/` holds derived, linked navigation and synthesis pages. The LLM creates and maintains this layer.
- `wiki/index.md` is the content catalog. Use a raw-first lookup: read it first for a query, then relevant wiki pages, then raw sources when exact detail matters. Update it whenever pages are added or moved.
- `wiki/log.md` is chronological. Add a dated, parseable activity fragment under `wiki/log/entries/` for every meaningful ingest, query filing, or lint pass.

## INGEST

When a source is added to `raw/`:

1. Read it and discuss or extract the important takeaways.
2. Create or update its page in `wiki/sources/`.
3. Update every affected overview, architecture, domain, feature, integration, operation, product, or skill page.
4. Update `wiki/index.md` and add a dated log fragment.
5. Flag contradictions, missing links, and important gaps.

## QUERY

Read `wiki/index.md`, then relevant wiki pages, then raw sources only when exact wording or a disputed claim matters. Answer with `[[wiki/path|Label]]` citations. Offer to file durable analyses in `wiki/output/` and update the index if they are saved.

## LINT

Periodically check for stale claims, contradictions, orphan pages, missing cross-references, undocumented concepts, and research gaps. Fix safe bookkeeping issues; flag uncertain or material issues.

## Wiki conventions

Use frontmatter with `title`, `type`, `tags`, `created`, `updated`, and `sources` where applicable. Every wiki page must be linked from another wiki page. Keep pages focused. Flag uncertainty with `> ⚠️ Unverified:` and contradictions with `> ⚡ Contradiction:`.

## Bootstrap behavior

Run `python3 bootstrap_docs.py` to repair missing vault paths and placeholders. It creates only missing files; it never overwrites existing documentation. Deliberate template changes require an explicit migration.
