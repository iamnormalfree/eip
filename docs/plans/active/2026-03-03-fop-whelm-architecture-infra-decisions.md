# FoP x Whelm: Architecture and Infrastructure Decision Doc (3 Tracks)

**Date:** 2026-03-03  
**Status:** Proposed (companion to workflow-readiness implementation plan)  
**Related plan:** `docs/plans/2026-03-03-fop-whelm-workflow-readiness.md`  
**Source-of-truth for FoP contract:** `/root/projects/whelm/fear-on-paper/SOURCE_OF_TRUTH.md`

## Purpose
Define the 3 architecture/infra decisions that unblock production use of EIP for Fear-on-Paper requests from Whelm while current test/template fixes are being implemented.

## Scope (The 3 Tracks)
1. Backend and data-plane authority (Supabase + persistence model)
2. Queue and worker infrastructure on Hetzner (Redis, worker runtime, strict mode)
3. Whelm -> EIP integration boundary (request contract, API shape, ownership)

## Non-Goals
- Replacing Whelm HITL/editorial authority.
- Re-architecting retrieval strategy beyond current deterministic design.
- Introducing a second source-of-truth for business data outside Supabase.

---

## Track 1: Backend and Data Plane

### Decision to make
Where production Supabase lives and how EIP services access it from Hetzner.

### Constraints
- Supabase is canonical source-of-truth for business data.
- Neo4j remains a read-optimized mirror only.
- Default tests should not require live Supabase/Redis.

### Options
1. Supabase Cloud (recommended for first production cut)
- Pros: fastest time-to-value, managed backups/auth/postgres ops.
- Cons: recurring cost and vendor dependency.
- Best when: small team, speed and reliability > infra control.

2. Self-host Supabase on Hetzner
- Pros: infra control and potentially lower long-run cost.
- Cons: highest ops burden (upgrades, backups, incident response, security hardening).
- Best when: strict hosting/control requirements and ops capacity exists.

### Recommended decision
Choose Supabase Cloud now; revisit self-host only after stable weekly FoP output for 6-8 weeks.

### Required implementation details
- Standardize env keys already used in repo:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_KEY` alias)
- Keep service-role usage server-side only.
- Gate all env-coupled tests into dedicated integration-env bucket.

---

## Track 2: Queue and Worker Infrastructure (Hetzner)

### Decision to make
How Redis + workers are deployed and how strict queue behavior is enforced by environment.

### Constraints
- Queue path exists and currently falls back to direct mode on failures.
- Redis is required (`REDIS_URL`) for queue runtime.
- Production needs deterministic failure behavior (no silent fallback).

### Options
1. Single Hetzner host, single Redis + app + worker services (recommended initially)
- Pros: simple deploy/ops, minimal moving parts.
- Cons: single-node risk until HA is added.

2. Split services across two Hetzner hosts (app/API on one, workers/Redis on another)
- Pros: better fault isolation.
- Cons: more ops/network complexity.

3. Managed Redis + Hetzner app/workers
- Pros: less Redis ops and better reliability.
- Cons: external dependency + additional cost.

### Recommended decision
Start with option 1 for first reliable pipeline, then move to option 2 or 3 when queue volume or reliability SLOs require it.

### Queue policy decision (must-decide)
- Add `EIP_QUEUE_STRICT=true` for staging/prod.
- Behavior:
  - strict mode: queue failure returns explicit error (no direct fallback)
  - non-strict mode: direct fallback allowed for local/dev

### Runtime topology (initial)
```text
Whelm -> EIP API (Next.js/orchestrator entry) -> BullMQ queues -> EIP workers
                                               -> Supabase (source-of-truth)
                                               -> optional Neo4j mirror (read-only)
```

### Hetzner service layout
- `eip-web` (Next.js API + UI)
- `eip-worker-manager` (`npx tsx lib_supabase/queue/eip-worker-manager.ts start`)
- `redis` (local container/service)
- reverse proxy (`caddy` or `nginx`) with TLS

---

## Track 3: Whelm -> EIP Integration Boundary

### Decision to make
How Whelm sends FoP jobs and receives artifacts/status with deterministic contract validation.

### Contract (must-have)
Required fields from FoP source-of-truth:
- `brief`
- `audience_track` (`P` or `F_translation`)
- `format` (`long_script | short | email | cta_safe`)
- `imv2_card` with 9 required fields:
  - `trigger_context`
  - `hidden_protection`
  - `mechanism_name`
  - `reframe_line`
  - `micro_test`
  - `boundary_line`
  - `evidence_signal`
  - `source_capture`
  - `scores` (`truth`, `resonance`, `distinctiveness`, `practicality`, `mechanism_clarity`)

### API shape (recommended)
1. `POST /api/orchestrator/generate`
- Validates FoP contract.
- Enqueues job when queue mode is enabled.
- Returns `{ success, queue_job_id, correlation_id }`.

2. `GET /api/orchestrator/jobs/:id`
- Returns job status, stage timings, and final artifact metadata.

3. `GET /api/health` and `GET /api/metrics`
- Used for readiness checks and observability.

### Ownership boundary
- Whelm owns: strategy, editorial decisions, publish/no-publish, HITL acceptance.
- EIP owns: deterministic generation pipeline, compliance/audit execution, provenance ledger.

---

## Decisions Table (Now vs Later)

### Decide now
1. Supabase Cloud vs self-host for first production milestone.
2. Queue strict policy defaults per environment.
3. Initial Hetzner topology (single host vs split hosts).
4. Whelm/EIP contract version (`fop_whelm_v1`) and hard validation policy.

### Decide later
1. Multi-node Redis/worker HA strategy.
2. Canary model routing percentages in production.
3. Advanced autoscaling and queue sharding.

---

## Implementation Sequence (Parallel to Current Plan)
1. Finish current readiness plan (tests green, strict queue behavior, template alignment, docs correction).
2. Stand up Hetzner runtime for chosen topology and wire env vars.
3. Implement/validate Whelm contract endpoint with strict schema checks.
4. Run end-to-end FoP canary (1 weekly cycle) with provenance checks.
5. Promote only after all readiness gates and canary quality gates pass.

## Acceptance Gates for This Design
1. Contract-invalid payloads are rejected deterministically.
2. `EIP_QUEUE_STRICT=true` produces explicit failures on queue errors (no silent fallback).
3. Health and metrics endpoints report usable runtime signals.
4. Whelm can submit and track FoP jobs end-to-end without manual DB patching.

## Risks and Mitigations
- Risk: infra spend or complexity grows before workflow is stable.  
  Mitigation: single-host first, then scale after measured bottlenecks.
- Risk: contract drift between Whelm and EIP.  
  Mitigation: versioned schema and contract tests in both repos.
- Risk: hidden reliance on live services in default tests.  
  Mitigation: keep integration-env bucket separate from default CI paths.
