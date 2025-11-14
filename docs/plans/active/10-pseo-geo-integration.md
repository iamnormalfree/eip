# Plan 10 — pSEO + GEO Integration on top of EIP (Fractal Interop)

Goal: Activate programmatic SEO (pSEO) and Generative Engine Optimisation (GEO) via configuration, not special code paths. Make pSEO/GEO a fractal reuse of EIP primitives: entities → planner jobs, IPs → distinct reasoning, publisher → JSON-LD/FAQ/provenance.

Success criteria:

- Batch generator can create jobs from entity grids (e.g., persona × offer × location), respecting IP routing per funnel.
- Publisher emits JSON-LD and FAQ atoms for each page; internal links reinforce clusters.
- Sitemaps segmented by cluster; provenance present; compliance rules enforced.

Deliverables:

- `jobs/batch_specs/*.yaml|csv` — grid definitions
- `scripts/generate-batch.ts` — create jobs from grids
- `scripts/build-sitemaps.ts` — segmented sitemaps (core, faq, longtail-*)
- `orchestrator/linker.ts` — internal linking helper
- Tests: `tests/pseo/batch.test.ts`, `tests/pseo/links.test.ts`, `tests/pseo/sitemaps.test.ts`

Fractal alignment (why this tallies with EIP):

- Same loop: define entities → plan via IP → verify via auditor → publish with templates → observe cost/quality → learn via review.
- No new subsystem: pSEO is “factory mode” of planner; GEO is “publisher emits structured signals”.

Step-by-step tasks:

1) Batch specs and job generator
   - Touch: `jobs/batch_specs/` (example YAML/CSV), `scripts/generate-batch.ts`
   - Tests first: `tests/pseo/batch.test.ts` — parse grid; create correct number of jobs with correlation ids.
   - Implement: For each combination, enqueue planner job with persona/funnel/ip routing hints.
   - Commit: feat(pseo): batch generator and specs

2) Internal linking
   - Touch: `orchestrator/linker.ts`
   - Tests first: `tests/pseo/links.test.ts` — each page gets ≥3 internal links to SUPPORTS/CONTRASTS; avoid self-links.
   - Implement: Use graph mirror or simple heuristics (BM25) until graph ready.
   - Commit: feat(pseo): internal linking helper

3) Sitemaps builder
   - Touch: `scripts/build-sitemaps.ts`
   - Tests first: `tests/pseo/sitemaps.test.ts` — generate split sitemaps, correct URLs, lastmod.
   - Implement: Split by cluster; write to `public/` for Next.js to serve.
   - Commit: feat(geo): build segmented sitemaps

Definition of done:

- Batch pSEO runs produce unique, structured pages; sitemaps exist; internal links present; tests pass.

References:

- pSEO/GEO architecture doc: `docs/plans/active/pseo-geo-architecture.md`
- Big picture benefits: `docs/eip/big-picture.md`

