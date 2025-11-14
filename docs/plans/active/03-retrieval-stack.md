# Plan 03 — Retrieval Stack (BM25 now, Parallel later)

Goal: Implement retrieval that degrades gracefully: start with BM25 (or Postgres FTS), tag `graph_sparse` when knowledge is thin, and later extend to Neo4j graph + optional vectors for analogy only.

Success criteria:

- `orchestrator/retrieval.ts` exposes `parallel_retrieve` signature returning candidates, graph_edges (empty initially), and flags.
- BM25 index built over entities and artifact summaries; queries return deterministic results.
- Tests cover scoring, field weights, and sparse conditions.

Deliverables:

- `orchestrator/retrieval.ts` — BM25 retrieval and placeholder for graph/vector channels
- `scripts/build-bm25.ts` — build/update index (or FTS) and persist checksum
- `tests/retrieval/bm25.test.ts` — scoring behavior and sparse flags
- `db/seed_registries.sql` — schema_registry entries for index versions

Step-by-step tasks:

1) Minimal BM25 corpus and scorer
   - Touch: `orchestrator/retrieval.ts`
   - Tests first: `tests/retrieval/bm25.test.ts` — small corpus; assert top-k; assert `graph_sparse` true if |corpus| < threshold.
   - Implement: In-memory or Postgres FTS adapter; weighted fields: concept_abstract^2, artifact_summary^1.
   - Commit: feat(retrieval): BM25 channel with sparse flag

2) Index builder script
   - Touch: `scripts/build-bm25.ts`
   - Tests first: `tests/retrieval/indexer.test.ts` — index serialize/deserialize; checksum stable; schema_registry updated.
   - Implement: Build index from Supabase (or seeds); write artifact under `tmp/` or DB; store checksum/version.
   - Commit: feat(retrieval): add index builder + checksum

3) Planner-time retrieval wrapper
   - Touch: `orchestrator/retrieval.ts`
   - Tests first: `tests/retrieval/parallel.test.ts` — call `parallel_retrieve` returning combined candidates and flags.
   - Implement: Graph and vector channels return empty for now; weight BM25 accordingly.
   - Commit: feat(retrieval): parallel_retrieve wrapper

4) Wire script
   - Add `npm run retrieval:test` (already present) to call a tiny smoke `scripts/test-retrieval.ts` against demo data.
   - Commit: chore(scripts): wire retrieval smoke test

Definition of done:

- Retrieval deterministic on seeded corpus; sparse detection works; index builder tracked in schema_registry.

References:

- PRD “Parallel retrieval at plan-time”: `docs/eip/prd.md`
- Big picture retrieval rationale: `docs/eip/big-picture.md`

