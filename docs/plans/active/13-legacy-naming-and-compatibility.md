# Plan 13 — Legacy Naming and Compatibility (NextNest → EIP)

Goal: Remove confusing "NextNest" references in user-facing strings and docs while preserving backward compatibility for any stored keys, analytics, or integrations. Do not break existing behaviors; apply DRY/YAGNI and test fallbacks.

Success criteria:

- No user-facing occurrences of "NextNest" in UI, logs surfaced to operators, or new docs.
- Storage keys and identifiers provide compatibility: read old keys and write new keys (dual-read, single-write) with a feature flag to disable fallback later.
- Tests cover alias behavior; no runtime regressions.

Deliverables:

- Search report and classification of occurrences
- Code updates in `lib_supabase/*` where user-facing strings occur
- Compatibility helpers for storage keys (e.g., localStorage aliasing)
- Tests demonstrating migration behavior

Step-by-step tasks (TDD, small commits):

1) Inventory and classify
   - Command: `rg -n "NextNest|Nextnest|nextnest" -S`
   - Classify each hit as:
     - User-facing string (rename now)
     - Storage key or identifier (add alias with fallback)
     - Internal comment or dead code (defer)
   - Output a short table in the commit message or a scratch doc under `docs/plans/notes/legacy-audit.md` (optional).

2) Introduce compatibility util
   - Touch: `lib_supabase/utils/compat.ts`
   - Add helpers for dual-read/single-write localStorage keys, e.g. `getWithAliases(["nextnest_form_*", "eip_form_*"])`, `setCanonical("eip_form_*")`.
   - Env flag: `EIP_LEGACY_COMPAT=true` to enable alias reads; allow disabling later.
   - Tests first: `lib_supabase/utils/__tests__/compat.test.ts` — reads old key if present; writes new key; respects flag.

3) Update user-facing strings
   - Touch files where messages, branding, or monitoring labels say "NextNest":
     - `lib_supabase/monitoring/alert-manager.ts` (footer/source text)
     - `lib_supabase/ai/broker-ai-service.ts` (persona prompt branding)
     - `lib_supabase/design/tokens.ts` (header comment only; low priority)
   - Tests: N/A for comments; for operator-facing messages, snapshot test small utilities or assert constants.

4) Alias storage/session keys
   - Touch files using localStorage/sessionStorage keys:
     - `lib_supabase/analytics/conversion-tracking.ts` (nextnest_conversion_events)
     - `lib_supabase/ab-testing/experiments.ts` (nextnest_session_id)
     - Hooks: `useFormState.ts`, `useChatSessionStorage.ts`, `useLoanApplicationStorage.ts` (prefix `nextnest_`)
   - Replace direct storage access with compat helpers.
   - Tests first: Add focused tests per module or one integration test that mocks localStorage and verifies dual-read, single-write.

5) Event bus and IDs
   - Touch: `lib_supabase/events/event-bus.ts` (window.__nextnest_eventbus)
   - Implement: Provide alias window.__eip_eventbus; dual-attach in compat mode, canonicalize to __eip_eventbus.
   - Tests: Assert both properties exist when compat on; only __eip_eventbus when compat off.

6) Guardrails and flag default
   - Default `EIP_LEGACY_COMPAT=true` in dev; document turning off in production rollout after 2 weeks.
   - Add a small log on startup when compat mode active.

7) Documentation
   - Update any remaining plan references if needed; ensure PRD and big-picture remain unchanged.

Definition of done:

- No user-facing "NextNest" strings remain; storage and bus aliases implemented and tested; env flag documented; minimal, safe changes respecting YAGNI.

References:

- Inventory results via ripgrep; see occurrences in `lib_supabase/*`
- Fractal alignment: small loop, tests first, minimal surface area

