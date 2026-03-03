# EIP Readiness Tasks (Deferred Backlog)

Saved on 2026-03-02 for later execution before scaling MAF+EIP production.

## Current readiness call
- Prototype generation: yes (partial)
- Reliable production pipeline for IM/Fear on Paper: not yet

## Primary blockers
1. Test script config mismatch
- `package.json` test scripts reference `jest.eip.config.js`, but this file is missing.

2. Core test suites not green
- Retrieval, repairer, compliance, and hook tests showed failures in current run.

3. Worktree instability
- High number of changed/untracked files including backups/temp artifacts.

4. Queue mode infra not ready
- Queue-first mode requires `REDIS_URL`.
- Supabase persistence requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

5. Domain mismatch with IM strategy
- Existing IP library is finance/mortgage heavy.
- Missing IM v2-specific IP profiles, templates, and HITL rules.

6. Documentation inconsistency
- Root README content is not aligned with current EIP app identity.

## Hardening tasks (priority order)
1. Fix baseline test config
- Add/restore `jest.eip.config.js` and ensure all `package.json` test scripts resolve.
- Verify: `npm run test:smoke` executes successfully.

2. Establish clean baseline branch
- Remove or quarantine temp/backups.
- Keep only intentional source + test files.
- Verify clean `git status` policy.

3. Recover green core suites
- Minimum required suites:
  - retrieval
  - orchestrator
  - auditor/repairer
  - compliance

4. Infra readiness for queue mode
- Wire required env vars:
  - `REDIS_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Validate queue-first without fallback.

5. Add IM v2 IP pack
- New IP profiles:
  - `imv2-framework@1.0.0`
  - `imv2-loop-debug@1.0.0`
  - `imv2-founder-translation@1.0.0`
- Include invariants:
  - mechanism clarity
  - counterexample/edge case
  - 10-minute micro-test
  - boundary line
  - evidence signal

6. Add Fear on Paper output templates
- Script template (long form)
- Shorts template
- Email template
- CTA-safe template variants

7. Embed HITL gates into pipeline
- Truth gate
- Mechanism gate
- Utility gate
- Voice gate
- Boundary gate

8. Update docs and runbooks
- Correct root README
- Add IM/Fear-on-Paper runbook for generation -> discard -> human approve flow

## Definition of done (Go/No-Go)
Go only when all are true:
1. `test:smoke` passes
2. Core suites above pass
3. Queue mode runs without fallback
4. IM v2 IP profiles active in routing
5. HITL gates enforced pre-publish
6. Clean and documented baseline branch

## Interim usage rule
Until ready, use EIP in direct mode as draft-generation only.
Do not treat it as autonomous production.
