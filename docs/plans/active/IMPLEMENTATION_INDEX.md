# EIP-CR v2 Implementation Roadmap (Fractal, DRY, TDD)

Audience: Skilled developer with zero context for this repo and domain. This index orients you and links to bite-sized plans. Each plan tells you exactly which files to touch, what tests to write first, and how to run them. We prioritize DRY, YAGNI, TDD, deterministic behavior, budgets, and compliance-by-code.

Read order (milestone-aligned):

1) 01-steel-thread.md — ship a minimal end-to-end flow fast
2) 02-ip-library-and-validator.md — encode thinking as executable IPs
3) 03-retrieval-stack.md — BM25 now, parallel retrieval later
4) 04-orchestrator-and-queue.md — jobs, budgets, DLQ, deterministic routing
5) 05-auditor-and-repairer.md — independent micro-auditor + diff-bounded repairer
6) 06-publisher-and-templates.md — JSON-LD, FAQ atoms, provenance ledger
7) 07-compliance-and-evidence.md — allow-list, evidence registry, rules
8) 08-review-ui.md — operator review flow; human-in-the-loop
9) 09-neo4j-and-parallel-retrieval.md — graph mirror + analogy vectors
10) 10-pseo-geo-integration.md — fractal pSEO/GEO on top of EIP
11) 11-observability-and-cost.md — budgets, metrics, alarms
12) 12-rollout-and-runbooks.md — phases, canaries, sweeps, refresh
13) 13-legacy-naming-and-compatibility.md — safe NextNest→EIP migration
14) 2025-11-13-integration-contracts.md — cross-domain coordination and dependency management

Ground rules (apply across all plans):

- DRY & YAGNI: Build only what the plan needs. Extract shared helpers when duplication repeats 2+ times.
- TDD: Write failing test first for the smallest slice. Make it pass. Refactor with tests green.
- Frequent commits: Small, single-purpose commits. Conventional messages: chore/docs/feat/fix/refactor/test.
- Determinism > “cleverness”: Router is rule-based. Auditor is independent. Budgets are hard stops.
- Single source of truth (SoT): Supabase. Neo4j is read-optimized mirror. Obsidian export is read-only.
- Compliance-by-code: allow-list + rule atoms + JSON-LD via templates. Never LLM-invented schema/disclaimers.
- Budgets & resilience: Respect token/wall-clock limits, priority queues, DLQ, circuit breakers.
- Fractal alignment: Each module has the same loop: define → test → implement → verify → observe → learn.

Quick repo orientation:

- Product docs: `docs/eip/prd.md`, `docs/eip/big-picture.md`
- Fractal alignment: `docs/EIP_FRACTAL_ALIGNMENT.md`
- Ops runbooks: `jobs/runbooks/ops-runbooks.md`
- Current gaps: `orchestrator/`, `ip_library/`, `templates/`, `db/`, `compliance/`, `src/` are mostly empty
- Useful utilities to reuse: `lib_supabase/queue/*`, `lib_supabase/db/*`, `lib_supabase/monitoring/*`

Environment & tooling:

- Node >= 18.17, npm >= 9 (see package.json engines)
- Local `.env` based on `.env.example` (EIP naming already aligned)
- No frameworks beyond what’s in package.json; tests with Jest; UI with Next.js; queues with BullMQ; Redis required

How to test at each stage:

- Unit: `npm test` (or focused scripts in each plan)
- Manual scripts: `npm run <script>` (plans add targets incrementally)
- Integration smoke: orchestrator job end-to-end with budgets enforced
- Validation: JSON-LD validator, schema checks, IP invariant checks, compliance allow-list checks

Useful references while implementing:

- PRD principles and bring-up: `docs/eip/prd.md`
- Big picture (EIP → pSEO/GEO): `docs/eip/big-picture.md` and `docs/plans/active/pseo-geo-architecture.md`
- Implementation workflow (EIP version): `docs/EIP_IMPLEMENTATION_WORKFLOW.md` (treat mentions of any other system as EIP)

Start with 01-steel-thread.md.
