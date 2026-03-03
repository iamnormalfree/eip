# EIP x Whelm Fear-on-Paper Workflow Readiness Design

**Date:** 2026-03-03  
**Status:** Proposed  
**Owner:** EIP Orchestrator  
**Upstream source-of-truth:** `/root/projects/whelm/fear-on-paper/SOURCE_OF_TRUTH.md`

## Problem Statement
EIP is close to usable for Fear-on-Paper (FoP) production, but it is not yet reliable as the primary weekly publishing engine for Whelm. Core blockers are test instability, queue-mode fallback behavior, template-positioning mismatch, and docs/identity drift.

## Verified Current State (2026-03-03)
- `npm run ip:validate` passes (7/7).
- `npm run test:smoke` passes.
- `npm run test:integration` fails (fails early in retrieval run due compliance migration suite and auth path coupling).
- `npm run test:orchestrator` fails (`uuid` ESM/Jest parse in controller-real import path via `orchestrator/database.ts`).
- `npm run test:auditor` fails in `repairer-plan05` expectations around mechanism insertion.
- `npm run test:compliance` fails in disclaimer generator behavior mismatches.
- Queue path still has direct-mode fallback in `orchestrator/controller.ts` when queue submission/execution errors occur.
- `README.md` does not represent EIP runtime operations.

## Goals
1. Make EIP workflow-ready for FoP generation with deterministic behavior and strict reliability.
2. Align generated outputs with Insight Mechanics positioning (mechanism-first, testable, bounded claims).
3. Define an explicit Whelm->EIP contract so Whelm remains strategy/HITL source-of-truth.
4. Promote to production only when core suites and queue policy gates are green.

## Non-Goals
- Replacing Whelm’s editorial judgment/HITL loop.
- Building a second strategy system inside EIP.
- Introducing fuzzy routing or non-deterministic template selection.

## Design Decisions
1. **System boundary**
- Whelm is authoritative for strategy, cadence, and acceptance decisions.
- EIP is deterministic generation + audit/repair + provenance engine.

2. **Deterministic handoff contract (Whelm -> EIP)**
- Required inputs:
  - `brief`
  - `audience_track`: `P | F_translation`
  - `format`: `long_script | short | email | cta_safe`
  - `imv2_card` (9 required fields from FoP source-of-truth)
- EIP must reject requests missing required contract fields.

3. **Strict queue policy**
- Add explicit mode: `EIP_QUEUE_STRICT=true`.
- In strict mode, queue submission/worker failures must fail fast (no fallback to direct execution).
- Keep fallback only for local/dev with strict mode disabled.

4. **Test architecture split**
- Unit/contract tests must run without external Supabase/Redis.
- Integration-env tests (real Redis/Supabase) must be isolated under explicit tag/pattern and excluded from default test scripts.
- Resolve `uuid` ESM parsing centrally in Jest transform or module mapping.

5. **Template alignment**
- Rewrite FoP templates to Insight Mechanics voice and structure:
  - one concrete move in under 10 minutes
  - mechanism clarity
  - boundary line
  - evidence signal in 7 days
- Remove finance/mortgage marketing residue in FoP templates.

6. **Repo identity correction**
- Replace root `README.md` with EIP operational README:
  - architecture, run modes, env setup, runbooks, promotion gates.

## Architecture Changes
1. **Contract validation layer**
- Add `validateWhelmFoPInput()` in orchestrator entry path before routing.
- Return structured validation errors to caller.

2. **Queue behavior gate**
- Update `runViaQueue()` and queue exception handlers:
  - strict mode: return failure + reason
  - non-strict mode: existing fallback behavior allowed

3. **Test stabilization**
- `uuid` ESM fix in Jest config (`transformIgnorePatterns` or `moduleNameMapper` to CJS-compatible entry).
- Move env-coupled tests (`compliance-database-migration`) to integration-env bucket.
- Add deterministic mocks for Redis/Supabase in unit contract tests.

4. **FoP template contract**
- Extend template schema with required IM blocks and per-format constraints.
- Add template validation tests that assert IM-required sections exist.

## Implementation Plan (Phased)
### Phase 1: Reliability Baseline
- Fix `uuid` ESM/Jest path for orchestrator imports.
- Isolate external-dependency tests from default `test:retrieval`, `test:orchestrator`, `test:integration`.
- Make currently failing core suites green in default local mode.

### Phase 2: Queue Policy Hardening
- Add `EIP_QUEUE_STRICT`.
- Enforce no fallback in strict mode.
- Add tests for strict vs non-strict queue behavior.

### Phase 3: FoP Alignment
- Rewrite `templates/fear-on-paper-*.yaml` to IM-congruent structures.
- Add template conformance tests for required IM v2.1 fields.
- Ensure template selection remains deterministic.

### Phase 4: Docs and Operations
- Replace root README with EIP operational doc.
- Link active runbooks and Hetzner deployment baseline.
- Document promotion checklist and rollback procedure.

## Acceptance Criteria ("Workflow-Ready")
All must be true:
1. `npm run test:retrieval` green.
2. `npm run test:auditor` green.
3. `npm run test:orchestrator` green.
4. `npm run test:compliance` green.
5. `npm run test:integration` green.
6. Queue strict mode verified: no silent fallback.
7. FoP templates pass IM-congruence tests.
8. README reflects EIP runtime identity and runbooks.

## Risks and Mitigations
- **Risk:** External infra auth issues (Redis/Supabase) cause flaky "unit" runs.  
  **Mitigation:** hard split env tests from unit/contract tests.
- **Risk:** Template rewrite drifts from Whelm positioning.  
  **Mitigation:** acceptance tests against Whelm source-of-truth fields.
- **Risk:** Strict queue policy slows local development.  
  **Mitigation:** strict mode opt-in for prod/staging, off by default in local.

## Open Questions
1. Should strict queue mode be default in staging/prod automatically when `NODE_ENV=production`?
2. Should FoP templates require `source_capture` at generation time, or allow deferred enrichment before publish?

## Assumptions
- Whelm remains final editorial/HITL authority.
- EIP remains deterministic and audit-first.
- First 90 days prioritize `P` audience track; `F` stays translation-only.
