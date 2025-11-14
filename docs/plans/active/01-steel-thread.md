# Plan 01 — Steel Thread (Week 0–1)

Goal: Ship a minimal, deterministic end-to-end EIP flow in MEDIUM tier: brief → IP routing → retrieval (BM25) → generator (stub acceptable) → micro-auditor (tags only) → diff-bounded repairer (local patch) → JSON-LD render → ledger → Supabase → review UI v0. This proves architecture and unblocks all follow-on work.

Success criteria:

- `npm run orchestrator:start` processes a job within MEDIUM budgets and writes an artifact record with ledger and JSON-LD.
- Micro-auditor returns only structured tags; repairer optionally patches locally; re-audit runs once.
- Review UI v0 shows draft, ledger, tags, approve/reject; approval updates brand profile feedback.
- All created tests pass. Budgets enforced with fail-to-DLQ when exceeded.

Deliverables (files to add/modify):

- Database schema & seeds:
  - `db/schema.sql` — minimal SoT schema (entities, artifacts, brand_profiles, evidence_registry, evidence_snapshots, jobs)
  - `db/seed_registries.sql` — initial schema_registry rows and minimal seeds
  - `db/setup.ts` — applies schema and seeds using Supabase service key
  - `db/seed.ts` — optional convenience to insert demo entities/artifact seeds
- Orchestrator (scaffold only):
  - `orchestrator/controller.ts` — job lifecycle, budgets, DLQ, logging
  - `orchestrator/router.ts` — deterministic IP selection (persona+funnel rules)
  - `orchestrator/retrieval.ts` — BM25-only retrieval (stub vectors/graph), `graph_sparse` flag support
  - `orchestrator/auditor.ts` — micro-auditor returning only 10 critical tags
  - `orchestrator/repairer.ts` — diff-bounded local patcher
  - `orchestrator/publisher.ts` — render JSON-LD and compile MDX + ledger
  - `orchestrator/budgets.yaml` — LIGHT/MEDIUM/HEAVY token & wall-clock budgets
- IP library & validator (minimal):
  - `ip_library/framework@1.0.0.yaml` — invariants + sections + operators
  - `scripts/validate-ips.ts` — parse YAML, validate shape, enforce invariants exist
- Templates:
  - `templates/article.jsonld.j2`, `templates/faq.jsonld.j2` — basic Jinja/Nunjucks templates
- Review UI v0:
  - `src/app/review/page.tsx` — list drafts, show content, ledger, approve/reject
- Scripts (hooked to package.json):
  - `scripts/test-retrieval.ts` — quick smoke for BM25
  - `scripts/test-auditor.ts` — micro-auditor returns expected tags format

Prereqs (read now):

- `docs/eip/prd.md` — Bring-up (Day 1–5 realistic) section
- `docs/eip/big-picture.md` — Architecture and two-pass QA
- `docs/EIP_FRACTAL_ALIGNMENT.md` — Keep loops small and verifiable

Step-by-step tasks (TDD, small commits):

1) Initialize DB schema (SoT)
   - Touch files: `db/schema.sql`, `db/seed_registries.sql`, `db/setup.ts`
   - Tests first: Add a minimal Jest test in `tests/db/schema.test.ts` that asserts required tables exist (mock Supabase client or use a dry-run SQL parser if no DB). YAGNI: do not overfit migrations yet.
   - Implement: Write SQL per PRD 3.1 for entities, artifacts, brand_profiles, evidence_* and jobs. Keep indexes.
   - How to run: `npm run db:setup` (implement script to execute `db/setup.ts`).
   - Commit: feat(db): add minimal SoT schema and setup script

2) Budgets config (hard limits)
   - Touch files: `orchestrator/budgets.yaml`
   - Tests first: `tests/orchestrator/budgets.test.ts` validates tiers and required fields (planner, generator, auditor, repairer, wallclock_s for MEDIUM/HEAVY; simple object parse).
   - Implement: MEDIUM default from PRD; LIGHT smaller; HEAVY larger. Fail closed if missing.
   - Commit: feat(orchestrator): add budgets.yaml with MEDIUM tier

3) IP library (Framework v1) + validator
   - Touch files: `ip_library/framework@1.0.0.yaml`, `scripts/validate-ips.ts`
   - Tests first: `tests/ip/validator.test.ts` loads YAML and asserts invariants and sections present; invalid YAML fails.
   - Implement: Keep Framework minimal: purpose, operators (REDUCE_TO_MECHANISM, COUNTEREXAMPLE, TRANSFER), invariants, sections. Validator uses `yaml` + `zod`.
   - How to run: `npm run ip:validate`
   - Commit: feat(ip): add framework ip and validator script

4) Retrieval (BM25-only for now) + smoke test
   - Touch files: `orchestrator/retrieval.ts`, `scripts/test-retrieval.ts`
   - Tests first: `tests/retrieval/bm25.test.ts` with an in-memory corpus. Assert scoring, and `graph_sparse` true when corpus is too small.
   - Implement: Minimal BM25 or Postgres FTS adapter; no vectors; return candidates and flags.
   - How to run: `npm run retrieval:test`
   - Commit: feat(retrieval): add BM25-only retrieval with graph_sparse flag

5) Router (deterministic IP rules)
   - Touch files: `orchestrator/router.ts`
   - Tests first: `tests/orchestrator/router.test.ts` for persona+funnel → IP mapping; no weights; stable fallback.
   - Implement: Simple rule table (MEDIUM tier uses Framework for MOFU by default). Reads brand_profile if present.
   - Commit: feat(orchestrator): deterministic router (persona+funnel → ip_id)

6) Micro-auditor (tags only)
   - Touch files: `orchestrator/auditor.ts`, `scripts/test-auditor.ts`
   - Tests first: `tests/auditor/tags.test.ts` — given draft with/without Mechanism/Counterexample, returns canonical tags; no text edits.
   - Implement: Prompt or pure rules: return YAML/JSON with only PRD’s 10 tags. No rewriting.
   - How to run: `npm run auditor:test`
   - Commit: feat(auditor): implement micro-auditor returning tags only

7) Diff-bounded repairer (local patch)
   - Touch files: `orchestrator/repairer.ts`
   - Tests first: `tests/repairer/diff.test.ts` — local window extraction ±3 sentences; applies patch; respects token cap.
   - Implement: For each tag, get local span, run patcher (stub/LLM later), replace span, cap length.
   - Commit: feat(repairer): add diff-bounded local patcher

8) Publisher (MDX + JSON-LD + ledger)
   - Touch files: `orchestrator/publisher.ts`, `templates/article.jsonld.j2`, `templates/faq.jsonld.j2`
   - Tests first: `tests/publisher/jsonld.test.ts` validates generated JSON against target schema (basic shape).
   - Implement: Render JSON-LD from template, build MDX, frontmatter ledger with sources, tags, flags.
   - Commit: feat(publisher): render JSON-LD and ledger

9) Controller + budgets + DLQ + persistence
   - Touch files: `orchestrator/controller.ts`
   - Tests first: `tests/orchestrator/controller.test.ts` — simulate a job through stages, enforce budgets (fail to DLQ on breach), write jobs row and persist artifact row to Supabase.
   - Implement: Use BullMQ patterns from `lib_supabase/queue/*`; timeouts; one re-audit; single escalation; persist to `artifacts` and `jobs` tables in Supabase.
   - Scripts: add `orchestrator:start` using tsx if not present.
   - Commit: feat(orchestrator): controller with budgets and DLQ

10) Review UI v0 (approve/reject)
   - Touch files: `src/app/review/page.tsx`
   - Tests first: `tests/ui/review.test.tsx` renders list, shows ledger, can approve/reject (mock Supabase).
   - Implement: Basic list from artifacts where status=draft; approve→status=published; store reviewer score to brand_profile.
   - Commit: feat(ui): add review page v0

11) Verify environment naming is EIP
   - Touch files: `.env.example` (only if needed)
   - Implement: Ensure header and comments refer to EIP.
   - Commit: docs(env): confirm EIP references for clarity

12) Smoke the steel thread
   - How to run:
     - `npm run db:setup`
     - Seed 2–3 entities and run `npm run orchestrator:start`
     - Approve in `http://localhost:3002/review` (after `npm run dev`)
   - Expect: Artifact with MDX + ledger + JSON-LD; micro-auditor tags present; within MEDIUM budgets.

Definition of done:

- All tests passing; scripts wired; operator UI usable for basic review;
- Controller enforces MEDIUM budgets and writes complete ledger;
- Docs updated in this plan and index; commit history is incremental and readable.

References:

- PRD bring-up: `docs/eip/prd.md`
- Big picture: `docs/eip/big-picture.md`
- Implementation workflow (EIP): `docs/EIP_IMPLEMENTATION_WORKFLOW.md`
