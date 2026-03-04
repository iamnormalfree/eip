# EIP Workflow Enhancement Implementation Plan (Corrected)

Execution note:
- Repo convention is to run active plans from `docs/plans/active/`.
- Keep this file as source, then copy to `docs/plans/active/` before implementation.

Goal:
1. Default queue strict mode to `true` in `production`/`staging` when no explicit override is set.
2. Enforce a publish-time `source_capture` gate for Fear-on-Paper outputs without breaking publisher return contracts.
3. Add `test:integration:env:preflight` to explicitly validate Supabase + Redis runtime availability.

Non-goals:
- Do not change `publishArtifact` return shape (`PublishResult`).
- Do not export internal controller helpers just to unit test them.

---

## Task 1: Strict Queue Default for Prod/Staging

Files:
- Modify: `orchestrator/controller.ts`
- Modify: `tests/orchestrator/queue-strict.test.ts`

Why correction:
- `isQueueStrict` is private and not exported.
- Behavior should be tested through `runOnce` (public interface), not by importing private internals.

Implementation:
1. Extend `isQueueStrict()` logic in `orchestrator/controller.ts`:
- If `EIP_QUEUE_STRICT` is explicitly set, respect it.
- Else default strict mode to `true` when `NODE_ENV` is `production` or `staging`.
- Else return `false`.

2. Add behavior tests in `tests/orchestrator/queue-strict.test.ts`:
- `NODE_ENV=production`, `EIP_QUEUE_STRICT` unset, queue failure -> strict failure (no fallback).
- `NODE_ENV=staging`, `EIP_QUEUE_STRICT` unset, queue failure -> strict failure.
- `NODE_ENV=development`, `EIP_QUEUE_STRICT` unset, queue failure -> fallback allowed.

3. Verify:
```bash
npx jest --config jest.eip.config.js tests/orchestrator/queue-strict.test.ts --runInBand
```

---

## Task 2: Publish-Time Source Capture Gate (Contract-Safe)

Files:
- Modify: `orchestrator/publisher.ts`
- Modify: `orchestrator/controller.ts`
- Modify: `lib_supabase/queue/eip-content-worker.ts`
- Optional parity fix: `orchestrator/controller-queue.ts`
- Create: `tests/orchestrator/publisher-source-capture-gate.test.ts`
- Modify: `package.json` (`test:orchestrator` include new test file)

Why correction:
- Current plan expected `publishArtifact` to return `{ success, error }`, but it returns `PublishResult`.
- Current publisher metadata type does not include `imv2_card`; controller currently does not pass `source_capture` to publisher.

Implementation:
1. In `orchestrator/publisher.ts`:
- Extend `PublishInput.metadata` with:
  - `source_capture?: string`
  - keep existing fields unchanged
- Add helper:
  - detect FoP publish context using `metadata.output_template` (`fear-on-paper-*`) and/or `ip` (`imv2_*` if used for FoP path).
  - if FoP publish context and `source_capture` missing/blank, `throw new Error("Publish blocked: source_capture is required for Fear-on-Paper outputs")`.
- Run gate at top of `publishArtifact()` before rendering.

2. In `orchestrator/controller.ts`:
- In `runViaQueue()` submission metadata, include:
  - `source_capture: input.imv2_card?.source_capture`
- In direct publish call metadata, include:
  - `source_capture: input.imv2_card?.source_capture`

3. In `lib_supabase/queue/eip-content-worker.ts` publish call metadata, include:
- `output_template: data.metadata?.output_template`
- `source_capture: data.metadata?.source_capture`

4. Optional parity: mirror the same metadata wiring in `orchestrator/controller-queue.ts` if that code path is still used.

5. Add tests in `tests/orchestrator/publisher-source-capture-gate.test.ts`:
- FoP template + missing `source_capture` -> `publishArtifact` rejects with `source_capture` error.
- FoP template + blank `source_capture` -> rejects.
- FoP template + non-empty `source_capture` -> resolves `PublishResult`.
- Non-FoP output (no FoP template) + missing `source_capture` -> resolves.

6. Include test in orchestrator script:
- Add `tests/orchestrator/publisher-source-capture-gate.test.ts` to `test:orchestrator` in `package.json`.

7. Verify:
```bash
npx jest --config jest.eip.config.js tests/orchestrator/publisher-source-capture-gate.test.ts --runInBand
npm run test:orchestrator
```

---

## Task 3: Integration Env Preflight Command

Files:
- Create: `scripts/preflight-check.ts`
- Create: `tests/scripts/preflight-check.test.ts`
- Modify: `package.json`

Why correction:
- Preflight should validate backend readiness (service-role path), not only anon path.
- Redis import should be CommonJS/ESM safe.

Implementation:
1. Create `scripts/preflight-check.ts` with exports:
- `checkSupabaseConnection(): Promise<{ available: boolean; error?: string }>`
- `checkRedisConnection(): Promise<{ available: boolean; error?: string }>`
- `runPreflightCheck(): Promise<void>`

2. Supabase preflight logic:
- Require `NEXT_PUBLIC_SUPABASE_URL`.
- Prefer `SUPABASE_SERVICE_ROLE_KEY` (fallback `SUPABASE_SERVICE_KEY`).
- If missing, return unavailable.
- Connect with `createClient`.
- Run lightweight query against `eip_compliance_validations`.
- Treat `42P01` (table missing) as connectivity success.

3. Redis preflight logic:
- Use `REDIS_URL` (optional fallback `EIP_REDIS_URL`).
- Dynamic import `ioredis` with constructor interop:
  - `default ?? Redis ?? module`.
- Ping and quit with short timeouts.

4. CLI behavior:
- Print both statuses.
- Exit code `1` when either backend unavailable.

5. Add npm script:
```json
"test:integration:env:preflight": "npx tsx scripts/preflight-check.ts"
```

6. Add minimal unit test `tests/scripts/preflight-check.test.ts`:
- module exports expected functions.
- no network dependency in unit tests.

7. Verify:
```bash
npx jest tests/scripts/preflight-check.test.ts --runInBand
npm run test:integration:env:preflight
```

---

## Final Verification

Run:
```bash
npm run test:integration
npm run test:integration:env
npm run test:integration:env:preflight
npm run test:smoke
npm run ip:validate
```

Expected:
- All readiness suites green.
- Preflight fails only when infra is actually unavailable/misconfigured.

---

## Commit Plan

Recommended commits:
1. `feat(queue): default strict mode in prod and staging`
2. `feat(publish): enforce FoP source_capture gate at publish boundary`
3. `feat(infra): add supabase/redis preflight command`
4. `test: add source-capture and preflight coverage`

Do not use `git add -A`; stage only intended files.
