# Plan 12 — Rollout, Canaries, and Automation

Goal: Roll out safely in phases with canary model routing, weekly compliance sweeps, cost tuning, refresh triggers, and incident response mapped to DLQ categories.

Success criteria:

- Phase cadence matches PRD (0–3) with tangible deliverables and gates.
- Canary routing plan documented; promotion criteria clear.
- Weekly runbooks executed; DLQ drained regularly.

Deliverables:

- This plan and references to `jobs/runbooks/ops-runbooks.md`
- Optional helper scripts (canary toggles) later

Phases (from PRD, adapted):

- Phase 0 (Week 0–1): Supabase + BM25 + Framework IP + LIGHT/MEDIUM + Auditor; 15 pages
- Phase 1 (Week 2–3): Neo4j + Process/Comparative + JSON-LD + Review UI v0; 50–80 pages
- Phase 2 (Week 4–6): HEAVY tier + compliance atoms + refresh triggers + dashboards; +150 pages
- Phase 3 (Week 7–8): Learning loop (DNA & IP updates), internal-link AB tests, tag expansion; ongoing

Runbooks (execute regularly):

- Cold-Start Graph Bootstrap, Compliance Sweep, Cost Tuning, Incidents, Model Canary, Refresh, GEO Health, Duplicate Patrol, Reviewer Workflow, A/B IP choice, pSEO Grid Design, DLQ Triage, Evidence Onboarding, Allow-List Maintenance, JSON-LD Upgrade, Internal-Link Rebuild, Sitemap & Re-Index, Brand Drift Watch, Launch Day, Quarterly Retro
- Details: `jobs/runbooks/ops-runbooks.md`

Canary model routing:

- Route 10% by project+tier to candidate model; compare tokens, latency, tag rates, reviewer scores, SEO impressions; promote only if better in ≥3 metrics and no regressions in critical tags.

Definition of done:

- Phased rollout documented; canaries and runbooks wired into your weekly operating rhythm.

References:

- PRD Rollout and Testing: `docs/eip/prd.md`
- Ops runbooks: `jobs/runbooks/ops-runbooks.md`

