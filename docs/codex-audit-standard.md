ABOUTME: Defines the project-wide Codex audit standard used to review code changes.
ABOUTME: Establishes inputs, flow, findings levels, evidence, output format, and escalation rules (MAF appendix included).

# Codex Audit Standard (Project‑Wide)

## Purpose

Provide a consistent, objective process for Codex to audit code changes against plans, quality rules, and safety policies. This applies to all audits across NextNest, not only MAF.

## Scope

- Applies to: all code reviews/audits in this repo.
- Primary reviewer: Codex (first pass). Escalation: GPT‑5 only for deeper reasoning cases.
- Contract: the implementation plan for the related CAN task is the source of scope and acceptance criteria.

## Required Inputs

- Implementation plan (tasks, acceptance criteria, TDD plan, Stage/Gate).
- Diff of changed files + commit messages.
- Test results (unit/integration/E2E) and coverage for touched areas.
- Evidence artifacts promised in the plan (CLI outputs, logs, screenshots).
- Project policies: AGENTS.md, naming/comment rules, TDD/YAGNI, constraint alignment docs.

## Audit Flow

1) Contract Compliance
- Map each plan task → concrete code and tests.
- Verify acceptance criteria met (tests green, flags/exit codes correct, docs updated).
- Flag scope creep (changes outside plan) or gaps (missing tasks).

2) Static/Quality
- Types/nullability, error handling, additive/minimal changes, domain‑telling names, comment rules.
- No unused code/deps; no broken public interfaces; no noisy logs in CLIs.

3) Behavioral Verification
- Check test logs; ensure failures are not ignored; confirm CLI flags and exit codes match docs.
- Validate evidence artifacts exist and contain required fields.

4) Policy/Constraints
- TDD followed (tests added before or with code; coverage exists for new logic).
- YAGNI respected (no unrelated refactors).
- Constraint alignment intact (no violations of active constraint rules).

5) Security/Operational
- Safe child_process/shell usage; no injection vectors; environment variables documented.
- Feature flags/toggles default safe; secrets not present; PII not logged.

## Findings Levels

- Blocking: acceptance criteria unmet; tests missing/failing; interface break; security risk.
- High: plan scope gaps/overreach; missing evidence; wrong flags/exit codes; silent error handling.
- Medium: style/naming inconsistencies; insufficient required comments; unclear docs/examples.
- Low: minor duplication; ergonomics; small cleanup suggestions.

## Required Evidence

- Tests: which suites ran and results (paths + counts).
- CLI/Script outputs promised by the plan (JSON/text); key fields present.
- Screenshots or snippets for dashboards/reports; links to logs if applicable.

## Audit Output Format

- Summary: PASS/FAIL with reasons.
- Contract Matrix: task → files changed → evidence link → status.
- Findings: grouped by level with file:line pointers.
- Fixes: minimal diffs/steps to reach PASS.

## Escalation to GPT‑5

- Cross‑cutting interfaces (coordinator/runtime), concurrency/correctness analysis.
- Security threat modeling; performance trade‑offs; complex migrations.
- Tier‑1 files or heavy architectural changes.

## CI Integration (optional)

- Run audits after unit/integration tests; block merges on Blocking/High findings.
- Store audit JSON in artifacts; link evidence paths.

---

## Appendix A — MAF‑Specific Notes

- Treat MAF plans as contract; verify Stage & Gate evidence:
  - Stage A: Minimal Orchestrator tests + quickstart transcript.
  - Stage B: SQLite demo tests; commit‑gates CLI JSON outputs; preflight/hook smoke outputs.
  - Stage C: supervision/backpressure events; observability dashboard.
  - Stage D: isolation allow/deny logs; chaos report.
- Coordinator edits must remain additive (event logging calls; optional backpressure callback).
- CLI `maf top` flags: `--json` base (Stage A); `--recent/--kind` extensions (Stage C).
- Runtime selection via env (`MAF_RUNTIME=sqlite|json`) — code must behave safely if SQLite not available.

## Appendix B — Reviewer Checklists

- Code files start with two ABOUTME lines; names are domain‑telling; comments describe purpose.
- CLIs support `--help` and proper exit codes; no noisy logs in non‑verbose modes.
- Scripts use safe shell patterns and validate inputs; errors are surfaced with clear messages.
