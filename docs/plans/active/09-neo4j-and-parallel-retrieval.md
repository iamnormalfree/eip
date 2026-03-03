# Plan 09 — Neo4j Mirror and Full Parallel Retrieval

Audience: A skilled developer with zero repo/domain context. Keep it TDD, DRY, YAGNI, deterministic routing, and graceful degradation.

Goal
- Mirror Supabase SoT into Neo4j (read-only mirror) for concept graphs.
- Implement parallel retrieval (Graph + BM25 + optional vector/analogy) with explicit weights and flags.

Guardrails
- Supabase is the source of truth; Neo4j is read-only mirror.
- Deterministic weights; no fuzzy routing. Vectors are “analogy-only” and optional.
- Degrade gracefully: if graph/vector is empty/unavailable, return BM25 with flags.
- Minimal properties only (id, type/label, title/name, updated_at). No speculative fields.
- Tests first; small, frequent commits per session.

References to read first
- `docs/eip/prd.md` §3.2 (Neo4j mirror & retrieval pseudocode)
- `AGENTS.md` (repo-wide rules)
- Existing code: `scripts/mirror-to-neo4j.ts`, `orchestrator/retrieval.ts`

How to test
- Graph mirror: `npm test -- tests/retrieval/graph.test.ts --runInBand`
- Parallel fusion: `npm test -- tests/retrieval/parallel.test.ts --runInBand`
- Keep scope tight; broader suites not required for this plan.

Session plan (bite-sized, context-ready)

Session 0 — Orientation (no code)
- Read this plan, `docs/eip/prd.md` §3.2, `AGENTS.md`.
- Open `scripts/mirror-to-neo4j.ts`, `orchestrator/retrieval.ts` to see current patterns.

Session 1 — Define graph schema & mirror (TDD)
- Files: `tests/retrieval/graph.test.ts` (new/extend), `scripts/mirror-to-neo4j.ts`.
- Tests to write:
  - Cypher MERGE calls for nodes: Concept, Evidence, Persona, Offer, Artifact, Tag.
  - Edges from data/ledger: SUPPORTS, CONTRASTS, APPLIES_TO, HAS_TAG, DERIVED_FROM.
  - Sparse graph flag (#GRAPH_SPARSE) still mirrors minimal nodes and sets flag.
  - Contradictory evidence allows SUPPORTS and CONTRASTS together.
  - Incremental run (since cursor/updated_at) only mirrors changed rows.
- Implement:
  - Add `mirrorSupabaseToNeo4j({ since?, graphSparse? })`.
  - Use Supabase read patterns; batch MERGE nodes/edges; minimal props (id, label/type, title/name, updated_at).
  - Keep Neo4j client scoped to the script; no new global infra.
- Commit: `feat(retrieval): add neo4j mirror script`

Session 2 — Parallel retrieval fusion (TDD)
- Files: `tests/retrieval/parallel.test.ts` (new/extend), `orchestrator/retrieval.ts`.
- Tests to write:
  - Fusion of mock graph/BM25/vector results with weights (e.g., graph 0.55, BM25 0.35, vector 0.10); normalized scores; stable top-k.
  - Degrade when graph/vector empty or error—still return BM25 with flags.
  - Optional vector: when disabled, weights renormalize across available channels.
  - Surface `graphSparse` flag when graph reports it.
- Implement:
  - Add `parallelRetrieve(query, opts)` invoking BM25 + graph in parallel; vector optional.
  - Normalize per-channel scores to [0,1], apply weights, dedupe by artifact id.
  - Annotate results with `channelsUsed`, `flags`, `graphSparse?`; catch per-channel errors without failing overall.
- Commit: `feat(retrieval): fuse graph bm25 vector with flags`

Session 3 — Edge cases & polish
- Files: same as above if gaps remain.
- Tests: extend specs for contradictory edges and empty-graph degradations (if not already covered).
- Commit: `chore(retrieval): harden graph edge cases`

Session 4 (optional) — Tracing
- Files: `ops/otel_config.yaml` (optional).
- Add minimal tracing config for the mirror job (service name, exporter placeholder, batch spans).
- Commit: `chore(ops): add tracing stub for mirror job`

Definition of done
- Mirror script runs incrementally and builds nodes/edges with minimal fields.
- Parallel retrieval returns fused results with deterministic weights and channel flags; degrades cleanly.
- Sparse/contradictory graph scenarios covered by tests.
- Tests above are green and commits are frequent and small.
