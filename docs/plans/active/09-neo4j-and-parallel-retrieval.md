# Plan 09 — Neo4j Mirror and Full Parallel Retrieval

Goal: Mirror SoT into Neo4j for read-optimized concept graphs and implement parallel retrieval: Graph + BM25 + optional vectors (analogy only), with graceful degradation and #GRAPH_SPARSE flag.

Success criteria:

- Mirror pipeline writes nodes/edges to Neo4j: Concept | Evidence | Persona | Offer | Artifact | Tag; edges: SUPPORTS, CONTRASTS, APPLIES_TO, etc.
- `parallel_retrieve` merges channels with weights (e.g., graph 0.55, BM25 0.35, vector 0.10) and returns top-k with flags.
- Tests simulate sparse graph and contradictory sources.

Deliverables:

- `scripts/mirror-to-neo4j.ts` — incremental mirror from Supabase
- `orchestrator/retrieval.ts` — extend to include graph and vector hints
- `tests/retrieval/graph.test.ts` — edge cases: sparse graph, contradictory links
- `ops/otel_config.yaml` (optional) to trace mirror job

Step-by-step tasks:

1) Define labels and relationships
   - Touch: `scripts/mirror-to-neo4j.ts`
   - Tests first: `tests/retrieval/graph.test.ts` mock graph client to assert correct cypher calls for nodes/edges.
   - Implement: Map entities/artifacts/tags to nodes; derive edges from attrs and ledger.
   - Commit: feat(retrieval): add Neo4j mirror script

2) Parallel retrieval fusion
   - Touch: `orchestrator/retrieval.ts`
   - Tests first: `tests/retrieval/parallel.test.ts` — combine channels with configured weights; normalize scores; top-k stable order.
   - Implement: Invoke graph search (hops config), BM25 results, optional vector hints; degrade gracefully if graph empty.
   - Commit: feat(retrieval): fuse graph+bm25+vector with flags

Definition of done:

- Mirror script runs; retrieval combines three channels; tests pass; flags set appropriately.

References:

- PRD 3.2 Neo4j mirror and retrieval pseudocode: `docs/eip/prd.md`

