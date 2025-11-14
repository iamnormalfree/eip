# Plan 11 — Observability, Budgets, and Cost Control

Goal: Make quality and cost visible. Track tokens/latency per stage, enforce budgets, add alarms, and provide DLQ triage visibility.

Success criteria:

- Jobs rows include tokens, duration_ms, cost_cents per stage and in aggregate.
- P95 tokens/latency per stage reported; alarms for budget overrun and tag spikes.
- DLQ categories visible and actionable.

Deliverables:

- `orchestrator/controller.ts` — ensure stage metrics recorded
- `ops/otel_config.yaml`, `ops/alarms.yaml` — OTEL and alarm thresholds
- `tests/observability/metrics.test.ts` — metrics object shape and thresholds

Step-by-step tasks:

1) Stage metrics in controller
   - Touch: `orchestrator/controller.ts`
   - Tests first: `tests/observability/metrics.test.ts` — metrics object with per-stage tokens/duration; cost calc stub.
   - Implement: Timer wrappers; token counters from LLM responses; accumulate cost via rate table.
   - Commit: feat(observability): record per-stage metrics in jobs

2) Alarms config
   - Touch: `ops/alarms.yaml`
   - Tests first: none (config); ensure loader exists if needed.
   - Implement: Thresholds for p95 tokens/latency, DLQ size, LAW_MISSTATE spikes.
   - Commit: chore(ops): add alarms config

3) OTEL optional
   - Touch: `ops/otel_config.yaml`
   - Implement: Simple trace export; tag stages; optional in dev.
   - Commit: chore(ops): add optional OTEL config

Definition of done:

- Metrics recorded; alarms documented; DLQ sized; simple dashboard possible.

References:

- PRD “Budgets & circuit breakers”: `docs/eip/prd.md`
- Ops runbooks: `jobs/runbooks/ops-runbooks.md`

