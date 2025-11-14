Technical Operations Guide for turning your framework into a production “Generative pSEO + GEO” engine. It’s opinionated, copy-pasteable, and mapped to your stack (Supabase → Neo4j mirror → BM25 + vector hints → Planner/Generator → Micro-Auditor → Repairer → Publisher with JSON-LD).

I’ll give you:

infra layout,

DB schema & indices,

retrieval stack,

tier files & prompts,

auditor/repairer,

job controller,

programmatic batching for pSEO,

publisher (JSON-LD, sitemaps, internal links),

observability/cost,

refresh & compliance automation,

acceptance tests + canary rollout.

0) Repo & env
/eip-cr
  /orchestrator
    controller.py
    router.py
    retrieval.py
    auditor.py
    repairer.py
    linker.py
    publisher.py
    budgets.yaml
    tags.minimal.yaml
    tier.medium.md
    auditor.micro.md
  /ip_library
    framework@1.0.0.yaml
    process@1.0.0.yaml
    comparative@1.0.0.yaml
  /compliance
    web_policy.yaml
    rules_mas.yaml
  /templates
    article.jsonld.j2
    howto.jsonld.j2
    faq.jsonld.j2
  /db
    schema.sql
    seed_registries.sql
    mirror_to_neo4j.py
    build_bm25.py
  /readwren
    adapter.md
    brand_questionnaire.md
  /ops
    otel.yaml
    alarms.yaml
  /jobs
    batch_specs/        # pSEO grids → YAML/CSV
    runbooks/


.env

SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
NEO4J_URI=bolt://...
NEO4J_USER=...
NEO4J_PASS=...
OPENAI_API_KEY=...          # or Kimi/Claude keys routed in router.py
ROUTER_PROVIDER=kimi        # default generator
OTEL_EXPORTER_OTLP_ENDPOINT=...

1) Database (Supabase = SoT)
1.1 Apply schema (db/schema.sql)
create extension if not exists pgcrypto;

create table schema_registry(
  key text primary key, version text not null, checksum text not null,
  updated_at timestamptz default now()
);

create table evidence_registry(
  evidence_key text primary key,
  allow_web boolean default false,
  allow_domains text[]
);

create table entities(
  id uuid primary key default gen_random_uuid(),
  type text not null,                   -- 'concept','persona','offer','rate_snapshot','industry','neighbourhood','odoo_module', etc.
  name text not null,
  attrs jsonb not null default '{}',
  valid_from timestamptz default now(),
  valid_to timestamptz,
  source_url text
);
create index on entities (type, name);
create index on entities using gin (attrs);

create table evidence_snapshots(
  id uuid primary key default gen_random_uuid(),
  evidence_key text not null references evidence_registry(evidence_key),
  version text not null,
  data jsonb not null,
  last_checked date not null
);
create unique index on evidence_snapshots (evidence_key, version);

create table brand_profiles(
  id uuid primary key default gen_random_uuid(),
  brand text unique,
  version text not null,
  profile_json jsonb not null,
  updated_at timestamptz default now()
);

create table artifacts(
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  status text check (status in ('seed','draft','published')) default 'draft',
  mdx text not null,
  frontmatter jsonb not null default '{}',
  ledger jsonb not null default '{}'
);
create index on artifacts ((frontmatter->>'persona'));
create index on artifacts ((frontmatter->>'funnel'));

create table jobs(
  id uuid primary key default gen_random_uuid(),
  stage text, started_at timestamptz default now(),
  inputs jsonb, outputs jsonb,
  tokens int, cost_cents int, duration_ms int,
  fail_reason text, correlation_id text
);

1.2 Seed registries (db/seed_registries.sql)
insert into schema_registry(key, version, checksum) values
('brand_profile','1.1.0','sha256:...') on conflict do nothing;

insert into evidence_registry(evidence_key, allow_web, allow_domains) values
('mas_notice_645', true, array['mas.gov.sg']),
('sg_property_tax', true, array['iras.gov.sg'])
on conflict do nothing;

2) Knowledge graph mirror (Neo4j)

Policy: Supabase is the writer; Neo4j is read-optimized mirror.

Mirror job (db/mirror_to_neo4j.py):

Pull entities of type concept|persona|offer|evidence|glossary.

Build edges from artifacts.ledger.sources_used and any explicit relations in entities.attrs.relations.

Stamp edges with freshness_score, edge_confidence, provenance.

Schedule: hourly or 4× daily via cron.

3) Retrieval stack
3.1 BM25 index (local search)

Build an index over:

entities.attrs.abstract (if present)

artifacts.frontmatter.summary

Use BM25 params: k1=1.2, b=0.75.

Keep an embeddings sidecar (MiniLM) only for dedupe and analogy hints.

db/build_bm25.py produces a local index (e.g., Whoosh/Lucene). Store path in env.

3.2 Retrieval API (orchestrator/retrieval.py)
def parallel_retrieve(plan):
    graph = query_graph(plan, hops={"Mechanism":1,"Objections":2,"PersonaFit":1})
    bm25  = query_bm25(plan, fields=["concept_abstract^2","artifact_summary^1"])
    vec   = query_vectors(plan, topk=6, purpose="analogy_only")
    scored = rank(graph,bm25,vec, w_graph=0.55, w_bm25=0.35, w_vec=0.10, k=3)
    return {
      "candidates": scored,
      "graph_edges": graph["edges_used"],
      "flags": {"graph_sparse": len(graph["nodes"]) < 2}
    }

4) Brand DNA (readwren adapter)

brand_profile@1.1.0.json

{
  "brand_archetype":"pragmatic_strategist",
  "voice":{"authority":0.8,"warmth":0.6,"tempo":0.5,"jargon_tolerance":0.4},
  "cta_style":"evidence_first",
  "funnel_pref":{"MOFU":0.5,"BOFU":0.3,"TOFU":0.2},
  "guardrails":["no absolutist claims","no bank-bashing"],
  "ip_rules":{"Framework":{"require_mechanism_tokens":120}},
  "drift":{"metric":"cosine","warn":0.14,"reinterview":0.22},
  "merge":"weighted_avg_0.7_0.3"
}


readwren/adapter.md: list of 10–12 intake Qs; write outputs to brand_profiles.

5) Educational IP specs (ip_library)

Example: framework@1.0.0.yaml

ip_id: framework@1.0.0
purpose: "Causal, falsifiable explanation with transfer."
operators:
  - REDUCE_TO_MECHANISM
  - COUNTEREXAMPLE
  - TRANSFER
invariants:
  mechanism: true
  counterexample: true
  transfers: 2
sections:
  - Claim
  - Mechanism
  - Evidence
  - Counterexample
  - Transfer_A
  - Transfer_B
  - Decision
repair_moves:
  NO_MECHANISM: "Rebuild as parts→interactions→outcome; 120–180 tokens"
  NO_COUNTEREXAMPLE: "Add bounded failure case referencing same parts"
  NO_TRANSFER: "Map mechanism into two distinct contexts; change at least one constraint"


Add process@1.0.0.yaml, comparative@1.0.0.yaml similarly.

6) Tiers, tags, auditor, repairer
6.1 Minimal critical tags (orchestrator/tags.minimal.yaml)
- tag: NO_MECHANISM       ; critical: true
  detect:
    - "Mechanism section missing or <120 tokens"
    - "no causal verbs: (causes|leads to|because)"
- tag: NO_COUNTEREXAMPLE  ; critical: true
  detect: ["Counterexample section missing"]
- tag: NO_TRANSFER        ; critical: true
  detect: ["Transfer_A or Transfer_B missing"]
- tag: EVIDENCE_HOLE      ; critical: true
  detect: ["%|S\\$|absolute claims without [source:id] or table:ref"]
- tag: LAW_MISSTATE       ; critical: true
  detect: ["(guarantee|risk[- ]?free|assured)"]
- tag: DOMAIN_MIXING      ; critical: true
  detect: ["banking terms with unrelated vertical terms in same section"]
- tag: CONTEXT_DEGRADED   ; critical: true
  detect: ["persona/funnel from plan not restated in header"]
- tag: CTA_MISMATCH       ; critical: true
  detect: ["CTA not in allowed set for funnel stage"]
- tag: ORPHAN_CLAIM       ; critical: true
  detect: ["claim sentence without nearby evidence or mechanism"]
- tag: SCHEMA_MISSING     ; critical: true
  detect: ["JSON-LD renderer missing or invalid"]

6.2 MEDIUM tier file (orchestrator/tier.medium.md)
# MEDIUM TIER — RESPONSE-AWARE

PHASE 0 — PLAN
- Read brief + brand profile.
- Choose ONE primary IP (Framework/Process/Comparative/Diagnostic/DataDriven/Narrative).
- Emit section plan accordingly.

PHASE 1 — WRITE
- Write each section succinctly.
- Use sources provided; mark gaps with TODO:EVIDENCE (do NOT fabricate).

PHASE 2 — ENFORCEMENT
- If IP=Framework → Mechanism ≥ 120 tokens; include Counterexample and 2 Transfers.
- If IP=Process   → Steps ≥ 5 + Checks.
- If any numeric/absolute claim → require [source:id] or rewrite as conditional with explicit bounds.

PHASE 3 — CLEAN
- Return markdown and a compact LEDGER {sections, sources_used (ids only)}.
- Do NOT include JSON-LD; that is rendered by code.

6.3 Micro-Auditor prompt (orchestrator/auditor.micro.md)
You are MICRO_AUDITOR. Detect ONLY these critical tags:
NO_MECHANISM, NO_COUNTEREXAMPLE, NO_TRANSFER, EVIDENCE_HOLE,
LAW_MISSTATE, DOMAIN_MIXING, CONTEXT_DEGRADED, CTA_MISMATCH,
ORPHAN_CLAIM, SCHEMA_MISSING.

Input: plan summary + draft markdown + brand rubric + IP invariants.
Output YAML:
tags:
  - tag: <name>
    section: <section>
    rationale: <<=18 words>
    span_hint: "<short excerpt>"
Rules: zero false positives preferred over recall. No rewriting.

6.4 Budgets (orchestrator/budgets.yaml)
LIGHT:  {generator:1400, wallclock_s:20}
MEDIUM: {planner:1000, generator:2400, auditor:700, repairer:600, wallclock_s:45}
HEAVY:  {planner:1400, generator:4000, auditor:1100, repairer:1000, wallclock_s:90}
abort_if: "tokens_used > 1.5x tier budget OR wallclock > budget"

7) Orchestrator (controller)
7.1 Deterministic IP routing (orchestrator/router.py)
def route_ip(plan):
    g = plan.get("goal","").lower()
    feats = {
      "need_causality": any(w in g for w in ["why","because","mechanism"]),
      "need_procedure": any(w in g for w in ["step","how to","checklist"]),
      "need_classify":  any(w in g for w in ["which","fit","vs","diagnose"]),
      "need_evidence":  plan.get("requires_numbers") or plan.get("requires_citations"),
      "need_story":     "story" in plan.get("style","") or plan.get("persona") in ["consumer","exec"]
    }
    if feats["need_causality"]:  return ("Framework", None)
    if feats["need_procedure"]:  return ("Process", None)
    if feats["need_classify"]:   return ("Diagnostic", None)
    if feats["need_evidence"]:   return ("DataDriven", None)
    if feats["need_story"]:      return ("Narrative","Heuristic")
    return ("Comparative", None)

7.2 Controller skeleton (orchestrator/controller.py)
def run_content_job(job):
    cid = new_correlation_id()
    profile = get_brand_profile(job.brand)               # readwren output
    plan    = planner(job.brief, profile)                # small-context model

    ip      = route_ip(plan)
    sources = parallel_retrieve(plan)
    if sources["flags"]["graph_sparse"]:
        add_ledger(job, "#GRAPH_SPARSE")

    tier, budgets = choose_tier(plan)
    draft = generator_with_tier(ip, tier, sources, profile, budgets["generator"])

    audit = None
    if tier in ("MEDIUM","HEAVY"):
        audit = micro_auditor(draft, plan, profile, ip, budgets["auditor"])
        if any(t["critical"] for t in normalize_tags(audit)):
            draft = repairer_diffbounded(draft, audit, budgets["repairer"])
            audit = micro_auditor(draft, plan, profile, ip, budgets["auditor"])
        if is_critical(audit) or over_budget(budgets):
            return dead_letter(job, "critical_or_budget", cid)

    linked   = linker(draft, sources["graph_edges"])
    polished = brand_editor(linked, profile)             # tone only
    page     = publisher(polished, jsonld_renderer=jinja_templates)
    record_metrics(job, cid, budgets, audit, sources)
    return page


Repairer (diff-bounded) idea (orchestrator/repairer.py)

def repairer_diffbounded(draft, audit, token_budget):
    items = sort_by_severity(audit["tags"])
    budget_per = max(200, token_budget // max(1,len(items)))
    for it in items:
        span = extract_window(draft, it["section"], it["span_hint"], sents=3)
        patch = llm_repair(span, it, max_tokens=budget_per)
        draft = draft.replace(span, patch)[:120000]  # cap to avoid bloat
    return draft

8) pSEO batching (jobs)
8.1 Define your grids (jobs/batch_specs)

compare.neighbourhoods.yaml

project: Compare
funnel: MOFU
ip: Framework
dimensions:
  - {table: "entities", where: "type='industry'", field: "name"}
  - {table: "entities", where: "type='neighbourhood'", field: "name"}
slug: "/{industry}/in/{neighbourhood}"
title: "{industry} services in {neighbourhood}: how to choose well"
persona: "SMB_owner"
cta: "Get 3 verified quotes"


eip.bofu.yaml

project: EIP
funnel: BOFU
ip: Process
dimensions:
  - {table: "entities", where: "type='bank'", field: "name"}
  - {table: "entities", where: "type='property_type'", field: "name"}
  - {table: "entities", where: "type='tenure_band'", field: "name"}
slug: "/refinance/{bank}/{property_type}/{tenure_band}"
title: "Refinance with {bank}: {property_type}, {tenure_band}"
persona: "homeowner"
cta: "Book a call"

8.2 Batch runner (jobs/runbooks/batch.py)

Expand dimension cartesian product by querying Supabase.

For each combination, generate a brief (title, persona, funnel, CTA, variables).

Submit to run_content_job queue with priority (BOFU first).

9) Publisher (JSON-LD, sitemaps, links)
9.1 JSON-LD (templates/article.jsonld.j2)
{
 "@context":"https://schema.org",
 "@type":"Article",
 "headline":"{{ fm.title }}",
 "dateModified":"{{ fm.last_modified }}",
 "author":{"@type":"Organization","name":"{{ fm.brand }}"},
 "mainEntityOfPage":"{{ fm.url }}",
 "about":[{% for c in fm.concepts %}"{{ c }}"{% if not loop.last %},{% endif %}{% endfor %}],
 "keywords":"{{ fm.keywords|join(', ') }}"
}


Render server-side and inject into page <script type="application/ld+json">…</script>.

9.2 FAQ atoms

Generate 3–5 QA pairs per page (FAQ/Atom IP or template).

Publish /sitemap-faq.xml and include in robots/sitemaps.

9.3 Internal linking (orchestrator/linker.py)

For each CONTRASTS or SUPPORTS node used during retrieval, add “See also” links (cap 2–3 per section).

Generate cluster pages (hub/spoke) via graph degree.

10) Compliance & web policy

compliance/web_policy.yaml

allow_domains: ["mas.gov.sg","iras.gov.sg","abs.org.sg","data.gov.sg",".gov",".edu"]
freshness_days: 365
min_reliability: "gov|edu|official"
on_violation:
  - tag: CITATION_WEAK
  - action: "downgrade claim to conditional + add caveat"


compliance/rules_mas.yaml

- id: MAS_CLAIM_SCOPE_001
  pattern: "(guarantee|risk[- ]?free|assured)"
  severity: high
  repair: "replace with 'indicative' + append MAS disclaimer"
- id: NUMERIC_BOUND_TDSR
  detect: "mentions TDSR/LTV without bound"
  repair: "append 'per MAS limits as of {{last_checked}}; varies by profile'"

11) Observability, cost & SLOs

ops/otel.yaml

Trace spans: planner, retrieve.graph, retrieve.bm25, generate, audit, repair, publish.

Attach correlation_id to all logs & DB writes.

ops/alarms.yaml

Alert if:

p95 latency MEDIUM > 45s; HEAVY > 90s

escalation rate > 12%

LAW_MISSTATE or EVIDENCE_HOLE spikes > 2× weekly baseline

cost/page p95 over threshold

DLQ > 50 items

budgets: enforced in controller with hard stop if exceeded.

12) Lifecycle: refresh & regenerate

Cron ideas:

Evidence freshness: if evidence_snapshots.last_checked > 180d → queue recheck + affected pages re-audit.

Compliance bump: when rules_mas.yaml version increases → re-audit BOFU pages.

Brand profile bump: style-only re-edit (no regeneration).

Rate limit: updates_per_day_per_domain: 50.

13) Acceptance tests & canary

Unit

Tag detectors: craft golden sentences; expect tag fires.

IP invariants: drop Mechanism/Transfer; auditor must flag.

JSON-LD: validate against schema.org.

Integration

20 seeded briefs (TOFU/MOFU/BOFU). Expect: zero critical tags after repair, JSON-LD valid, internal links added.

Adversarial

Contradictory sources; sparse graph; masked PII.

Canary rollout

Route 10% jobs to new prompts/models; compare ledger and cost.

Freeze if alarms trigger.

14) Example: end-to-end pSEO page job

Batch spec expands to {industry='Plumber', neighbourhood='Tampines'}

Brief → “Plumber in Tampines: how to choose a reliable provider” (MOFU, Framework)

Planner picks Framework IP, sections planned.

Retrieval gets: concept nodes (credential asymmetry, supply variability), prior case in SG, BM25 summary.

Generator writes; cites [source:badge_schema_v2], [table:review_signals].

Micro-Auditor flags CTA_MISMATCH (used BOFU CTA) → Repairer fixes.

Publisher injects Article JSON-LD, 3 FAQ atoms, internal links to “Compare quotes” hub + “Avoid fake reviews” explainer.

Reviewer scores tone 4/5, novelty 3/5, compliance pass → DNA nudged to less jargon.

15) Quick commands & ops notes

Build BM25

python db/build_bm25.py --src supabase --out .cache/bm25.idx


Mirror to Neo4j

python db/mirror_to_neo4j.py --since "24h"


Run a batch (pSEO)

python jobs/runbooks/batch.py jobs/batch_specs/compare.neighbourhoods.yaml --limit 100 --priority MOFU


Serve publisher (Next.js/Railway)

Expose a POST /publish that accepts {slug, html, jsonld, frontmatter, ledger} and writes to your CMS/filesystem.

You’re ready to ship

Supabase schema + indices — ✅

Graph mirror & BM25 — ✅

IP specs + MEDIUM tier + Micro-Auditor — ✅

Controller, budgets, DLQ — ✅

pSEO batch inputs → generation → JSON-LD — ✅

Observability, alarms, refresh triggers — ✅
