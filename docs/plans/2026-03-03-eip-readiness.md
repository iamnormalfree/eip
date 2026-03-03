# EIP Readiness Implementation Plan (Patched)

**Goal:** recover green core suites, add schema-valid IM v2 IPs, add Fear on Paper output templates, embed deterministic HITL gating, and update docs/runbooks with repo-valid paths.

**Method:** sequential + TDD-first. For each task: fail test, minimal fix, rerun targeted tests, commit.

**References:** `docs/eip/prd.md`, `docs/eip/big-picture.md`, `docs/EIP_FRACTAL_ALIGNMENT.md`, `jobs/runbooks/ops-runbooks.md`

---

## Prerequisites

1. Optional isolated worktree:
```bash
git worktree add -b eip-readiness-work ../eip-readiness
cd ../eip-readiness
```
2. Verify scripts and Jest config entrypoints:
```bash
cat package.json | rg "test:(smoke|retrieval|auditor|orchestrator|integration|compliance)|ip:validate"
ls -la config/jest/jest.eip.config.js
```

---

## Task 1: Fix Jest EIP Config Resolution

**Files:** `jest.eip.config.js`, `config/jest/jest.eip.config.js`

1. Add root shim:
```js
module.exports = require('./config/jest/jest.eip.config.js');
```
2. Validate load: `node -e "require('./jest.eip.config.js'); console.log('OK')"`
3. Run smoke: `npm run test:smoke`
4. Commit: `git add jest.eip.config.js && git commit -m "fix(test): add root jest.eip.config.js shim"`

---

## Task 2: Clean Baseline Safely

**Files:** `.gitignore`

1. Inventory: `git status --short` and `rg --files . | rg "\.(backup|tmp|bak|orig)$|\.queue-backup|-backup"`
2. Add patterns:
```gitignore
*.backup
*.tmp
*.bak
*.orig
*.queue-backup
```
3. Preview cleanup: `git clean -fdX --dry-run`
4. Apply ignored-only cleanup: `git clean -fdX` (never `git clean -fd`)
5. Commit with `.gitignore`.

---

## Task 3: Recover Retrieval Suite

**Files:** `tests/retrieval/*.test.ts`, `orchestrator/retrieval.ts`

1. Run: `npm run test:retrieval`
2. Fix smallest failing case first.
3. Re-run until green.
4. Commit touched files.

---

## Task 4: Recover Orchestrator Suite

**Files:** `tests/orchestrator/*.test.ts`, `orchestrator/controller.ts`

1. Run: `npm run test:orchestrator`
2. Fix deterministic flow/routing/ledger regressions.
3. Re-run until green.
4. Commit touched files.

---

## Task 5: Recover Auditor + Repairer Suites

**Files:** `orchestrator/auditor.ts`, `orchestrator/repairer.ts`, related tests

1. Run auditor: `npm run test:auditor`
2. Run repairer directly: `npm run test:orchestrator -- --testPathPatterns="repairer"`
3. Fix and rerun both commands until green.
4. Commit touched files.

---

## Task 6: Recover Compliance Suites

**Files:** `tests/compliance/*.test.ts`, `tests/orchestrator/*compliance*.test.ts`, `orchestrator/database-compliance.ts`

1. Run:
```bash
npm run test:compliance
npm run test:orchestrator -- --testPathPatterns="compliance"
```
2. Fix allow-list/freshness/domain-rule regressions.
3. Re-run until green.
4. Commit touched files.

---

## Task 7: Verify Core Green

1. Run:
```bash
npm run test:smoke
npm run test:integration
```
2. Commit only if staged:
```bash
git diff --cached --quiet || git commit -m "test: verify core suites green"
```

---

## Task 8: Infra Readiness for Queue Mode

**Files:** `.env.example`, `orchestrator/controller.ts`, `lib_supabase/queue/redis-config.ts`

1. Verify env usage:
```bash
rg -n "REDIS_URL|EIP_QUEUE_MODE|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_KEY" orchestrator lib_supabase db
```
2. Create/update `.env.example`:
```dotenv
REDIS_URL=redis://localhost:6379
EIP_QUEUE_MODE=enabled
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_SERVICE_KEY=your-service-key
```
3. Commit `.env.example`.

---

## Task 9: Add IM v2 IP Profiles (Schema-Compliant)

**Files:**  
`ip_library/imv2_framework@1.0.0.yaml`  
`ip_library/imv2_loop_debug@1.0.0.yaml`  
`ip_library/imv2_founder_translation@1.0.0.yaml`  
`orchestrator/router.ts`  
`tests/orchestrator/router.test.ts`

1. YAML must use: `id`, `version`, `purpose`, `operators[]`, `invariants[]`, `sections[]`.
2. IDs must be snake_case: `imv2_framework`, `imv2_loop_debug`, `imv2_founder_translation`.
3. Register router keys as `id@version` and keep deterministic single-primary selection.
4. Validate: `npm run ip:validate`
5. Add/update deterministic router tests.
6. Commit.

---

## Task 10: Add Fear on Paper Output Templates

**Files:**  
`templates/fear-on-paper-script.yaml`  
`templates/fear-on-paper-shorts.yaml`  
`templates/fear-on-paper-email.yaml`  
`templates/fear-on-paper-cta-safe.yaml`  
`orchestrator/template-renderer.ts`  
`orchestrator/publisher.ts`  
`tests/orchestrator/template-renderer.test.ts`  
`tests/orchestrator/publisher-integration.test.ts`

1. Store templates in root `templates/` (canonical template location).
2. Add deterministic template lookup in renderer/publisher.
3. Keep JSON-LD template-driven behavior intact.
4. Test: `npm run test:orchestrator -- --testPathPatterns="(template-renderer|publisher)"`
5. Commit.

---

## Task 11: Embed HITL Gates into Pipeline

**Files:** `orchestrator/hitl-gates.ts`, `orchestrator/controller.ts`, `tests/orchestrator/hitl-gates.test.ts`, `tests/orchestrator/controller.test.ts`

1. Implement non-placeholder gate logic from existing signals:
- audit severity tags
- invariant failures
- compliance evidence presence
- quality gate booleans
2. Integrate into function-based controller (no class-based `this.*` calls).
3. Output deterministic decision fields: `needs_human_review`, `review_reasons`.
4. Route flagged artifacts to `pending_review`.
5. Test: `npm run test:orchestrator -- --testPathPatterns="(hitl-gates|controller)"`
6. Commit.

---

## Task 12: Update Docs and Runbooks

**Files:** `README.md`, `docs/runbooks/active/im-fear-on-paper-generation.md`, `jobs/runbooks/ops-runbooks.md`

1. Update README with IM v2, Fear on Paper templates, HITL, queue-first.
2. Add runbook in `docs/runbooks/active/` using real entrypoints:
- `npm run orchestrator:start`
- `npm run orchestrator:start -- --queue`
- existing `pages/api` health/metrics endpoints
3. Link runbook from `jobs/runbooks/ops-runbooks.md`.
4. Commit.

---

## Task 13: Final Go/No-Go

1. Run:
```bash
npm run test:smoke
npm run test:integration
npm run test:compliance
npm run ip:validate
npm run test:orchestrator -- --testPathPatterns="(template-renderer|publisher|hitl-gates|controller)"
```
2. Verify assets:
```bash
ls ip_library/imv2_*@1.0.0.yaml
ls templates/fear-on-paper*.yaml
rg -n "needs_human_review|review_reasons" orchestrator
```
3. Final commit only if staged:
```bash
git diff --cached --quiet || git commit -m "chore: complete EIP readiness verification"
```

---

## Definition of Done

- [ ] `test:smoke` and `test:integration` pass
- [ ] Retrieval/orchestrator/auditor/repairer/compliance suites pass
- [ ] `.env.example` documents queue + Supabase envs
- [ ] IM v2 IPs validate with `npm run ip:validate`
- [ ] Fear on Paper templates are registered and tested
- [ ] HITL decisions are deterministic and tested
- [ ] README + runbooks updated in repo-convention paths
- [ ] Provenance/compliance expectations remain enforced
