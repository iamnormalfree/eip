# Plan 06 — Publisher, JSON-LD Templates, and Ledger

Goal: Emit publish-ready content with structured data and provenance. Publisher composes MDX with frontmatter ledger and renders JSON-LD via templates. No LLM invents schema or disclaimers.

Success criteria:

- `orchestrator/publisher.ts` generates: MDX/HTML (sections), frontmatter ledger (ip_id, invariants satisfied, tags resolved, sources used, flags), JSON-LD blob.
- JSON-LD validates for Article and FAQPage (basic checks), produced deterministically from templates.

Deliverables:

- `orchestrator/publisher.ts` — compile draft + ledger + JSON-LD
- `templates/article.jsonld.j2`, `templates/faq.jsonld.j2` — Jinja/Nunjucks templates
- `tests/publisher/jsonld.test.ts` — validates emitted JSON shape
- `tests/publisher/ledger.test.ts` — ensures required ledger fields exist

Step-by-step tasks:

1) JSON-LD templates
   - Touch: `templates/article.jsonld.j2`, `templates/faq.jsonld.j2`
   - Tests first: `tests/publisher/jsonld.test.ts` — given minimal inputs, template outputs valid schema fields.
   - Implement: Include headline, datePublished, author/brand, mainEntityOfPage, FAQ list. No speculative fields.
   - Commit: feat(templates): JSON-LD templates for Article/FAQPage

2) Publisher assembly
   - Touch: `orchestrator/publisher.ts`
   - Tests first: `tests/publisher/ledger.test.ts` — ledger contains ip_id, invariants, tags, sources, flags; MDX contains sections from IP.
   - Implement: Compose MDX from generator output; attach ledger; render JSON-LD via templates; return artifact object.
   - Commit: feat(publisher): assemble MDX + ledger + JSON-LD

Definition of done:

- Publisher returns deterministic structures; ledger complete; templates validate.

References:

- PRD “Templates: Jinja JSON-LD & FAQ atom renderers”: `docs/eip/prd.md`
- GEO relevance (structured outputs): `docs/eip/big-picture.md`

