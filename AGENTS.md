ABOUTME: Repository-wide agent guidance for Codex CLI working on EIP (Educational-IP Content Runtime).
ABOUTME: Aligns agent behavior with EIP principles: determinism, compliance-by-code, budgets, and fractal alignment.

# EIP Agent Guide (Codex CLI)

Scope: Entire repository. Follow these rules for every change.

Core principles:
- Single source of truth: Supabase. Neo4j is read-optimized mirror; never write business data there.
- Deterministic routing: one primary IP (+ optional secondary later). No fuzzy blend weights.
- Parallel retrieval: Graph + BM25 + optional vectors (analogy-only). Always degrade gracefully.
- Two-pass QA: Generator → Micro-Auditor (independent) → Diff-bounded Repairer → Re-audit. Max one escalation.
- Compliance by code: allow-list + rule atoms + JSON-LD via templates. Never LLM-invented schema/legal.
- Budgets & circuit breakers: hard token and wall-clock limits, DLQ, priority queues.
- Human-in-the-loop: reviewer rubric updates brand DNA and IP rules.

How to work (TDD, DRY, YAGNI):
- Tests first for the smallest slice; then code; then refactor. Keep commits small and purposeful.
- Extract shared helpers only after duplication repeats twice. Avoid speculative abstractions.
- Build only what the current plan requires; wire stubs that fail safely instead of overbuilding.

Repo conventions for agents:
- Plans live in `docs/plans/active/`. Update or add a plan before large changes. Keep plans under ~200 lines; push details to runbooks.
- Use the provided scripts in `package.json`. If a script references a missing file, create a minimal stub to keep the repo coherent.
- Ledger everything created by the orchestrator: ip_used, invariants satisfied, tags resolved, sources used, flags.
- JSON-LD must be emitted from templates in `templates/`. No model-generated schema.

Quality gates to uphold:
1) IP invariants enforced for every generated piece
2) Compliance rules verified (allow-list, freshness, domain rules)
3) Performance budgets respected per tier
4) Provenance complete and machine-readable
5) Human review integrated; feedback updates brand DNA

Testing guidance:
- Unit: IP validator, compliance checks, budget loader, auditor tag detector, publisher templates
- Integration: minimal end-to-end job through orchestrator with budgets enforced
- Adversarial: sparse graph, contradictory evidence, allow-list violations

Operational guidance:
- Use BullMQ and Redis per `lib_supabase/queue/*`. DLQ budget breaches and unexpected failures.
- Record tokens, duration_ms, and stage timings in `jobs`.
- Canary model routing in small percentages; promote only with multi-metric wins and no regressions on critical tags.

File/style rules:
- Keep changes minimal and focused. Do not add license headers.
- Avoid one-letter variable names. Prefer clear names aligned to EIP terms (invariants, ledger, auditor, repairer).
- Document WHY in comments when behavior is non-obvious.

Answering in Codex CLI:
- Summarize what you’re about to do before running commands.
- Prefer ripgrep for code search; read files in ≤250-line chunks.
- Reference files with clickable paths and line numbers where useful.
- Use `apply_patch` for edits; plan multi-step work with the plan tool when appropriate.

Cross-references:
- PRD: `docs/eip/prd.md`
- Big picture: `docs/eip/big-picture.md`
- Fractal Alignment: `docs/EIP_FRACTAL_ALIGNMENT.md`
- Implementation plans: `docs/plans/active/`
- Ops runbooks: `jobs/runbooks/ops-runbooks.md`

