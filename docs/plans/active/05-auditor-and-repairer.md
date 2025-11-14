# Plan 05 — Micro-Auditor and Diff-Bounded Repairer

Goal: Implement an independent micro-auditor that returns only critical tags (no rewrites), and a repairer that applies local, diff-bounded patches for flagged spans, followed by one re-audit.

Success criteria:

- Auditor detects only the 10 PRD tags with short rationales; zero rewrites.
- Repairer updates local spans only (±3 sentences), respects token budget caps, and prevents content bloat.
- Re-audit runs once; single escalation max.

Deliverables:

- `orchestrator/auditor.ts` — tag detector
- `orchestrator/repairer.ts` — local patch application
- `tests/auditor/tags.test.ts` — positive/negative tag cases
- `tests/repairer/diff.test.ts` — windowing and patching tests
- `scripts/test-auditor.ts` — smoke runner

Tags (PRD v1 list):

- NO_MECHANISM, NO_COUNTEREXAMPLE, NO_TRANSFER, EVIDENCE_HOLE,
  LAW_MISSTATE, DOMAIN_MIXING, CONTEXT_DEGRADED, CTA_MISMATCH,
  ORPHAN_CLAIM, SCHEMA_MISSING

Step-by-step tasks:

1) Auditor prompt + parser
   - Touch: `orchestrator/auditor.ts`
   - Tests first: `tests/auditor/tags.test.ts` — drafts with/without mechanism/counterexample cause expected tags; avoid false positives.
   - Implement: Strict prompt; output YAML/JSON with `{tag, section, rationale<=18w, span_hint}` only; parser validates.
   - Commit: feat(auditor): micro-auditor returning structured tags

2) Diff-bounded repairer
   - Touch: `orchestrator/repairer.ts`
   - Tests first: `tests/repairer/diff.test.ts` — extract window, patch bounded, enforce max length, do not alter outside span.
   - Implement: `get_local_window` (±3 sentences); patch with a function that can be stubbed or LLM-backed later; cap length.
   - Commit: feat(repairer): local patch application with caps

3) One re-audit only
   - Touch: `orchestrator/controller.ts`
   - Tests first: `tests/orchestrator/controller.test.ts` extends to assert only one re-audit occurs; exceeding budget → DLQ.
   - Implement: insert auditor → repairer → auditor loop once; exit on success or budget breach.
   - Commit: feat(orchestrator): add single re-audit loop

Definition of done:

- Auditor precise; repairer localized; controller integrates loop; tests demonstrate both correctness and guardrails.

References:

- PRD “Two-pass QA” and micro-auditor spec: `docs/eip/prd.md`

