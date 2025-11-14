# Plan 07 — Compliance by Code and Evidence Registry

Goal: Enforce compliance through allow-lists and rule atoms, and capture evidence snapshots with versioning and freshness metadata. No LLM invents legal text or JSON-LD.

Success criteria:

- `compliance/web_policy.yaml` defines allow-list and freshness policy; `compliance/rules_mas.yaml` (if domain needs MAS) encodes basic constraints.
- Evidence registry/snapshots tables exist; evidence ingested with version and `last_checked`.
- `npm run compliance:check` flags non-allow-listed sources and stale evidence.

Deliverables:

- `compliance/web_policy.yaml`, `compliance/rules_mas.yaml`
- `scripts/compliance-check.ts` — scans artifacts/ledger for violations
- `db/schema.sql` — ensure evidence tables present (from Plan 01)
- `tests/compliance/policy.test.ts` — allow-list enforcement
- `tests/compliance/evidence.test.ts` — stale evidence detection

Step-by-step tasks:

1) Allow-list policy
   - Touch: `compliance/web_policy.yaml`
   - Tests first: `tests/compliance/policy.test.ts` — citations from allowed domains pass; others fail.
   - Implement: List official domains (e.g., .gov/.edu); define freshness windows.
   - Commit: feat(compliance): add web allow-list policy

2) Evidence registry
   - Touch: `db/schema.sql` (already created), ensure tables: evidence_registry, evidence_snapshots
   - Tests first: `tests/compliance/evidence.test.ts` — entries with `last_checked` > policy threshold flagged as stale.
   - Implement: Seed 1–2 examples in `db/seed_registries.sql`.
   - Commit: feat(db): seed evidence examples with freshness

3) Compliance check script
   - Touch: `scripts/compliance-check.ts`
   - Tests first: add fixtures with good/bad sources; expect violations list.
   - Implement: Parse artifact ledgers; cross-check sources against allow-list and evidence freshness.
   - How to run: `npm run compliance:check`
   - Commit: feat(scripts): compliance check for sources and freshness

Definition of done:

- Compliance script flags violations; tests show correct enforcement; evidence captured with versions and last_checked.

References:

- PRD “Compliance by code” and evidence schema: `docs/eip/prd.md`

