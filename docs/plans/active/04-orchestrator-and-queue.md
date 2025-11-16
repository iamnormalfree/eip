# Plan 04 — Orchestrator, Router, Budgets, and Queue

Goal: Create the orchestrator pipeline with deterministic routing, BullMQ queue, budgets (token + wall-clock), DLQ, and structured job logs.

Success criteria:

- `orchestrator/controller.ts` runs jobs through plan → retrieve → generate → audit → repair → re-audit → publish steps.
- Budgets enforced at each stage with fail-to-DLQ on breach; single escalation only.
- Router selects exactly one primary IP (+ optional secondary disabled initially) via rules.
- Jobs table records tokens, cost_cents, duration_ms, fail_reason, correlation_id.

Deliverables:

- `orchestrator/controller.ts` — pipeline + budgets + DLQ
- `orchestrator/router.ts` — deterministic mapping (persona+funnel → ip_id)
- `orchestrator/budgets.yaml` — LIGHT/MEDIUM/HEAVY limits
- `tests/orchestrator/controller.test.ts` — pipeline unit test (mocks for LLM and DB)
- `tests/orchestrator/router.test.ts` — routing behavior and stability tests

Step-by-step tasks:

1) Budgets loader
   - Touch: `orchestrator/budgets.yaml`
   - Tests first: `tests/orchestrator/budgets.test.ts` — parse, required keys, numeric ranges.
   - Implement: Export helper to read budgets; default MEDIUM if unspecified; no silent fallback for missing keys.
   - Commit: feat(orchestrator): add budgets config and loader

2) Router rules
   - Touch: `orchestrator/router.ts`
   - Tests first: `tests/orchestrator/router.test.ts` — map (persona,funnel) pairs; ensure fixed order and fallback; planner reads brand_profile first.
   - Implement: Minimal rule table; no weights; versioned; log chosen ip_id.
   - Commit: feat(orchestrator): deterministic router rules

3) Controller skeleton
   - Touch: `orchestrator/controller.ts`
   - Tests first: `tests/orchestrator/controller.test.ts` — one happy path job and one budget-breach path; verify DLQ.
   - Implement: Use BullMQ wrappers from `lib_supabase/queue/*`; stage timers; token counters (stub until real LLM); write to `jobs`.
   - Commit: feat(orchestrator): pipeline with stages and DLQ

4) Job logging & correlation id
   - Touch: `orchestrator/controller.ts`
   - Tests first: `tests/orchestrator/logging.test.ts` — ensures correlation id propagated and logs structured.
   - Implement: Winston logger; correlation id per job; include stage/name in logs.
   - Commit: feat(orchestrator): structured logging with correlation id

Definition of done:

- Controller can run a stubbed job end-to-end, respecting MEDIUM budgets and logging to jobs; deterministic router decisions; DLQ on error.

References:

- Budgets & circuit breakers: `docs/eip/prd.md`
- Queue utilities to reuse: `lib_supabase/queue/*`, `lib_supabase/monitoring/*`
