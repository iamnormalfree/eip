1) Cold-Start Graph Bootstrap (Day 0 → Day 3)

Goal: avoid #GRAPH_SPARSE by seeding just enough concepts/evidence.

Inputs: 20–40 cornerstone concepts, 10 evidence items, 5 personas, 5 offers.
Steps

Import concepts → entities(type='concept', attrs.abstract, attrs.synonyms).

Add 10 evidence snapshots (laws, datasets) → evidence_registry + evidence_snapshots.

Create 5 “explainer” seed articles (Framework IP) via LIGHT tier.

Mirror → Neo4j; run graph degree check (min degree ≥2 for seed nodes).

Build BM25 index; rerun 10 test briefs; confirm <25% #GRAPH_SPARSE.
Exit: 80% of MEDIUM jobs no longer flag #GRAPH_SPARSE.

2) Compliance Sweep (Weekly)

Goal: catch legal/regulatory regressions before publish.

Steps

Pull all draft + published BOFU pages from last 7 days.

Re-run Micro-Auditor with compliance emphasis (LAW_MISSTATE, EVIDENCE_HOLE).

Auto-repair where safe; anything unresolved → DLQ “Compliance”.

Export a one-page report (pages checked, fails, fixes, items to legal).
Exit: 0 live LAW_MISSTATE; evidence last_checked ≤ 365d (or policy).

3) Cost Tuning (Bi-weekly)

Goal: reduce cost/page without quality drop.

Steps

Pull jobs metrics p50/p95 tokens by stage & tier.

Identify top 3 tag triggers → tighten tier file to prevent rewrites (e.g., require Mechanism upfront).

Cache: plan/IP decisions & BM25 results for repeated grids.

Canary a cheaper generator for TOFU/LIGHT (route 10%).

Roll back if critical_tag_rate or reader dwell time worsens.
Exit: ≥15% tokens saved with unchanged acceptance rate.

4) Incident Response — Bad Output Live (On-call)

Signal: spike in LAW_MISSTATE or EVIDENCE_HOLE in production.

Steps

Pause publisher queue for affected project (toggle queue_policy.enabled=false).

Hotfix tier file: disable Data-Driven claims without [source:id].

Re-audit last 100 pages; unpublish offenders (status → draft).

Post-mortem: model drift? rule change? new writer?

Add regression test & alarm threshold.
Exit: queues resumed; playbook filed.

5) Model Routing Canary (Monthly or Model Update)

Goal: test a new LLM safely.

Steps

Select 10% traffic by project + tier; route to candidate model.

Compare: tokens, latency, tag rates, reviewer scores, SEO impressions.

Promote if better on ≥3 metrics, not worse on any critical.

Freeze canary for 72h before 50% rollout.
Exit: controlled upgrades; no surprise bills.

6) Content Refresh & Re-gen (Quarterly or Triggered)

Goal: keep facts fresh for GEO/SEO trust.

Triggers: evidence last_checked > 180d, MAS rules changed, brand DNA bump.
Steps

Query affected artifacts by evidence keys.

Run audit-only; if EVIDENCE_HOLE or DATA_STALE → regenerate MEDIUM with same IP.

Re-publish; update last_modified; ping sitemaps.
Exit: stale evidence rate ≤5%.

7) GEO Health Check (Monthly)

Goal: maximize visibility in AI search.

Checklist

JSON-LD validation (sample 50 URLs) → pass rate 100%.

FAQ coverage: ≥3 QAs per page in targeted clusters.

Provenance present on all MOFU/BOFU.

Crawl budget: XML sitemaps split by cluster (≤10k URLs each).

Internal links: each page ≥3 links to SUPPORTS/CONTRASTS.
Exit: no schema errors; improved SGE/Perplexity citation instances.

8) Duplicate & Thin Content Patrol (Bi-weekly)

Goal: prevent pSEO cannibalisation.

Steps

Compute pairwise MiniLM cosine on abstracts → flag >0.88.

For flagged pairs: keep the stronger (traffic/links), 301 the weaker or convert to FAQ atom.

Tighten grid constraints (e.g., remove low-intent combos).
Exit: duplicates <1% of index.

9) Reviewer Workflow (Daily)

Goal: turn 30 minutes into max approvals.

Steps

Queue filters: BOFU/high-CPC first.

Per item: skim ledger first (tags resolved? sources OK?) → then read.

Scorecard (tone, strategy, novelty, compliance).

Approve or send back with one-line reason code.

DNA update job runs nightly.
Exit: review throughput ≥10 pages/hour with consistent tone drift trending down.

10) A/B Testing IP Choice (Monthly)

Goal: discover which IP converts best per persona/funnel.

Steps

Pick 3 key intents; generate A/B with different IPs (Framework vs Comparative, etc.).

Randomly assign slugs; keep everything else fixed (CTA, length).

Measure CTR, dwell, lead rate over 2–3 weeks.

Promote winning IP; update router rules.
Exit: IP routing table grounded in live data.

11) pSEO Grid Design Workshop (Before Scaling)

Goal: design grids that produce useful, non-thin pages.

Steps

List your entity dimensions; score each for search intent and data richness.

Remove combos that produce weak value (e.g., “ERP for 1-person team”).

Define required evidence per grid (tables, cases, laws).

Pilot 50 URLs; expand only winning grids.
Exit: fewer, stronger grids with better ROI.

12) Dead-Letter Triage (Weekly)

Goal: drain the queue of failed jobs.

Steps

Group by fail_reason (critical_or_budget, compliance, schema).

For budget: raise tier or tighten plan (fewer sections).

For compliance: add/adjust a rule atom; re-run audit.

For schema: fix renderer; re-publish.

Close the loop: add tests so it doesn’t recur.
Exit: DLQ < 20 items sustained.

13) Evidence Onboarding (As Needed)

Goal: add a new dataset/law safely.

Steps

Register in evidence_registry (allow_web? domains?).

Ingest snapshot with version + last_checked.

Add unit test: missing → must trigger EVIDENCE_HOLE.

Map to templates (where should it appear?).

Kick small re-gen batch using it; spot-check results.
Exit: evidence usable by generator without manual babysitting.

14) Allow-List Maintenance (Monthly)

Goal: keep web citations clean.

Steps

Export domains used last 30 days; sort by frequency.

Remove weak domains; add official sources.

Re-audit pages citing removed domains → downgrade or replace evidence.
Exit: citations skew to .gov/.edu/official.

15) JSON-LD Schema Upgrade (When Google changes spec)

Goal: avoid structured data penalties.

Steps

Update Jinja templates; run validator on 100 random URLs.

Stage rollout: 10% → 50% → 100%.

Monitor Search Console for warnings/errors.

Lock template version in schema_registry with checksum.
Exit: zero schema warnings post-upgrade.

16) Internal-Link Rebuild (Quarterly)

Goal: refresh topical clusters.

Steps

Recompute graph centrality; identify new hubs.

Re-link long-tail pages to the new hubs (2–3 links per page).

Regenerate hub pages (Comparative/Framework IP).

Re-submit hub sitemap for crawl.
Exit: improved crawl depth; better hub rankings.

17) Sitemap & Re-Index Push (After major batch)

Goal: get new pages discovered fast.

Steps

Generate segmented sitemaps (/sitemap-core.xml, /sitemap-faq.xml, /sitemap-longtail-*.xml).

Ping Search Console & Bing API.

Publish RSS/Atom feed for “what’s new.”

Track indexation in 48–72h.
Exit: >80% of new pages indexed within a week.

18) Brand Drift Watch (Bi-weekly)

Goal: catch tone drift early.

Steps

Compute voice embedding drift vs brand profile on latest 100 pages.

If drift > warn threshold (e.g., 0.14) → trigger micro style re-edits.

If drift > re-interview threshold (e.g., 0.22) → run readwren again; update DNA.
Exit: drift oscillates below warn threshold.

19) Launch Day Checklist (First big drop)

Goal: smooth first production push of 100–300 pages.

Checklist

BM25 built; Neo4j mirror healthy; allow-list loaded.

MEDIUM tier + Micro-Auditor green; budgets set.

JSON-LD validates on samples; sitemaps prepared.

Reviewer queue staffed; scorecard agreed.

Alarms configured; rollback plan documented.
Exit: launch executed without scrambling.

20) Quarterly Retrospective (System Learning)

Goal: evolve the IP and router with data.

Steps

Aggregate: acceptance rate, tag heatmap, cost/page, SEO & GEO wins.

Identify “winning IP per persona/funnel” and codify in router.

Expand IP library if a style keeps winning (e.g., Playbook).

Retire underperforming grids; double down on top clusters.
Exit: framework gets sharper every quarter.

---

## Active Runbooks

- [IM v2 & Fear on Paper Generation](../../docs/runbooks/active/im-fear-on-paper-generation.md)
