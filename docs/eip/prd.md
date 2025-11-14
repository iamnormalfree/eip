EIP-CR v2 — Educational-IP Content Runtime (Meta-Framework)
0) Principles (non-negotiables)

Single source of truth (SoT): Supabase (normalized). Neo4j is a read-optimized mirror. Obsidian is read-only export.

Deterministic IP routing: one primary IP (+ optional secondary), rule-based; no fuzzy “blend weights.”

Parallel retrieval at plan-time: Graph + BM25 + (optional) vectors (analogy-only). Always degrade gracefully.

Two-pass QA: Generator → Micro-Auditor (separate model) → Diff-bounded Repairer → Re-audit. Max one escalation.

Rule-gated quality: 10 critical tags v1 (expand later). No composite “publish score.”

Compliance by code: allow-list + rule atoms + JSON-LD via templates, never LLM-fabricated.

Budgets & circuit breakers: hard token/wall-clock limits, DLQ, priority queues.

Human loop ≈ 15–30% where it matters: reviewer rubric writes back to brand DNA and IP rules.

1) Where readwren fits (Brand/Taste DNA)

When: project onboarding; quarterly drift checks; ad-hoc on vibe-drift alarms.
Outputs:

brand_profile@semver.json (machine-readable)

brand_profile.md (human summary)

rubric.md (accept/reject rules for tone/CTA/compliance)

Drift math & merge policy (store in profile JSON):

drift:
  metric: "1 - cosine(embedding(page_voice), embedding(brand_voice))"
  warn: 0.14
  reinterview: 0.22
merge: "weighted_avg(old,new,w=0.7:0.3) unless reviewer_override"


Planner always reads brand_profile before routing IP.

2) Educational-IP Library (project-agnostic; executable)

Each IP is YAML: ip_id@semver, with purpose, operators, invariants, sections, repair_moves.

Core IPs (15 types):
Framework · Process · Diagnostic · Heuristic · Narrative · Constraint/Policy · Data-Driven · Socratic/Lateral · Comparative · Reflective/Post-mortem · Empirical/Experiment · Calculator · FAQ/Atom · Debate/Pro-Con · Playbook.

Operator snippets (example; attach to IP specs):

REDUCE_TO_MECHANISM:
  "Explain as parts → interactions → outcome. Use causal verbs (causes/leads to/because).
   3–6 parts. Forbid labels-as-mechanism."
COUNTEREXAMPLE:
  "Build a realistic failure case from same parts. State which interaction flips, and bounds."
TRANSFER:
  "Map same mechanism into two distinct contexts; change a constraint each time; keep interactions."


Store IPs as files like framework@1.0.0.yaml, process@1.0.0.yaml etc., versioned and testable.

3) Data model
3.1 Supabase (SoT) — minimal normalized schema
-- registries
create table schema_registry(
  key text primary key, version text not null, checksum text not null, updated_at timestamptz default now()
);
create table evidence_registry(
  evidence_key text primary key, allow_web boolean default false, allow_domains text[]
);

-- generic entities
create table entities(
  id uuid primary key default gen_random_uuid(),
  type text not null,              -- e.g., 'concept','persona','offer','odoo_module','rate_snapshot'
  name text not null,
  attrs jsonb not null default '{}',
  valid_from timestamptz default now(),
  valid_to timestamptz,
  source_url text
);
create index on entities (type, name);
create index on entities using gin (attrs);

-- evidence snapshots (versioned)
create table evidence_snapshots(
  id uuid primary key default gen_random_uuid(),
  evidence_key text not null references evidence_registry(evidence_key),
  version text not null,              -- semver
  data jsonb not null,
  last_checked date not null
);
create unique index on evidence_snapshots (evidence_key, version);

-- artifacts (content)
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

-- brand profiles
create table brand_profiles(
  id uuid primary key default gen_random_uuid(),
  brand text unique,
  version text not null,
  profile_json jsonb not null,
  updated_at timestamptz default now()
);

-- jobs & metrics
create table jobs(
  id uuid primary key default gen_random_uuid(),
  stage text, started_at timestamptz default now(),
  inputs jsonb, outputs jsonb,
  tokens int, cost_cents int, duration_ms int,
  fail_reason text, correlation_id text
);

3.2 Neo4j mirror (read-optimized graph)

Nodes: Concept | Evidence | Persona | Offer | Artifact | Glossary | Tag
Edges: SUPPORTS | CONTRASTS | APPLIES_TO | DERIVES_FROM | ADJACENT_TO
Edge metadata: freshness_score, edge_confidence, last_reviewed, provenance

Neo4j is rebuilt/updated from Supabase on schedule; write-backs require human approval.

3.3 Obsidian

Read-only export of concepts/artifacts for browsing; validation runs before export.

4) Retrieval (planner-time, parallel, graceful)

Run Graph + BM25 + vector hints together when the plan is formed.

Vectors are analogy-only (never used to assert facts).

Cold-start promotion when graph is thin.

Scoring & bounds:

score = 0.55*graph_edge_conf + 0.35*bm25_norm + 0.10*vector_hint
k_per_section = 3
hops = {Mechanism:1, Objections:2, PersonaFit:1}
limits: max_nodes_scanned=600, max_source_tokens=6k
if graph_candidates < 2 → flag #GRAPH_SPARSE and promote BM25

5) Deterministic IP routing

Select one primary IP (+ optional secondary) by rules (no blend weights):

if need_causality:      Framework (+ Heuristic if story needed)
elif need_procedure:    Process
elif need_classify:     Diagnostic
elif need_evidence:     Data-Driven
elif need_story:        Narrative (+ Heuristic)
else:                   Comparative


Signal extraction from goal/persona/funnel keywords and brief structure.

6) Response-Awareness runtime (two-pass QA)

Tiers: LIGHT / MEDIUM / HEAVY (FULL later).
LIGHT: single pass; trivial rewrites/programmatics.
MEDIUM/HEAVY: Generator → Micro-Auditor (separate model) → Diff-bounded Repairer → re-Audit; max one escalation.

10 critical tags v1 (expand later):

#NO_MECHANISM · #NO_COUNTEREXAMPLE · #NO_TRANSFER

#EVIDENCE_HOLE · #LAW_MISSTATE · #DOMAIN_MIXING

#CONTEXT_DEGRADED · #CTA_MISMATCH

#ORPHAN_CLAIM · #SCHEMA_MISSING

Detectors (examples):

NO_MECHANISM: Mechanism missing or <120 tokens; no causal verbs (causes|leads to|because); no parts→interaction phrasing.

EVIDENCE_HOLE: numeric/absolute language or %/S$ without [source:id] or table: reference.

LAW_MISSTATE: MAS forbidden phrases (guarantee|risk[- ]?free|assured).

CTA_MISMATCH: CTA not in allowed set for funnel stage.

SCHEMA_MISSING: JSON-LD renderer absent or fails schema validation.

Enforcement (MEDIUM):

Framework → Mechanism ≥120t; Counterexample; 2 Transfers.

Process → Steps ≥5 with Checks.

Data-Driven → any numeric/absolute claim needs [source:id]; else rewrite as conditional with bounds.

7) Compliance & Web policy
web_policy:
  allow_domains: ["mas.gov.sg","iras.gov.sg","abs.org.sg","data.gov.sg",".gov",".edu"]
  freshness_days: 365
  min_reliability: "gov|edu|official"
  on_violation:
    - tag: CITATION_WEAK
    - action: "downgrade to conditional + caveat"

compliance_rules:
  - id: MAS_CLAIM_SCOPE_001
    pattern: "(guarantee|risk[- ]?free|assured)"
    severity: high
    repair: "replace with 'indicative' and append MAS disclaimer block"
  - id: NUMERIC_BOUND_TDSR
    detect: "mentions TDSR/LTV without bound"
    repair: "append 'per MAS limits as of {{last_checked}}; varies by borrower profile'"


JSON-LD is rendered by Jinja templates (code), never by LLM.

8) Controller (orchestrator) — reference flow
def run_content_job(job):
    cid = new_correlation_id()

    profile = get_brand_profile(job.brand)                 # readwren outputs
    plan    = planner(job.brief, profile)                  # small-context model

    ip      = route_ip(plan)                               # deterministic
    sources = parallel_retrieve(plan)                      # graph+bm25+vec hints
    if sources.flags.graph_sparse: ledger_add(job, "#GRAPH_SPARSE")

    tier, budgets = choose_tier_and_budgets(plan)          # LIGHT/MEDIUM/HEAVY

    draft = generator_with_tier(ip, tier, sources, profile, budgets.generator)

    if tier in ("MEDIUM","HEAVY"):
        audit = micro_auditor(draft, plan, profile, ip, budgets.auditor)
        if audit.critical:
            draft = repairer_diffbounded(draft, audit, budgets.repairer)
            audit = micro_auditor(draft, plan, profile, ip, budgets.auditor)
        if audit.critical or over_budget(budgets):
            return dead_letter(job, reason="critical_or_budget", cid=cid)

    linked   = linker(draft, sources.graph_edges)          # deterministic links
    polished = brand_editor(linked, profile)               # style only
    page     = publisher(polished, jsonld_renderer=jinja_templates)

    record_metrics(job, cid, budgets, audit, sources)
    return page


Budgets & circuit breakers (YAML):

budgets:
  LIGHT:  {generator:1400, wallclock_s:20}
  MEDIUM: {planner:1000, generator:2400, auditor:700, repairer:600, wallclock_s:45}
  HEAVY:  {planner:1400, generator:4000, auditor:1100, repairer:1000, wallclock_s:90}
abort_if: "tokens_used > 1.5x tier budget OR wallclock > budget"
queue_policy:
  priority: ["BOFU_highCPC","BOFU","MOFU","TOFU"]
  retries: {max: 2, backoff: "exp(1.8)"}
  dead_letter: true

9) Templates (programmatic, IP-aware)

All templates are parametrized, run under tier enforcement.

MOFU — Comparative/Framework (generic)

Frontmatter: title, persona, funnel=MOFU, ip=Framework|Comparative
Sections:
- Claim (precise, falsifiable)
- Mechanism (parts→interactions→outcome)
- Evidence ([source:id], last_checked)
- Counterexample (bounded)
- Transfer A/B (two contexts)
- Criteria & Scores (comparative)
- Decision & CTA (funnel-aligned)


BOFU — Constraint+Case (generic)

Sections:
- Claim (decision rule)
- Mechanism (risk transfer, constraints)
- Cases (2 distinct)
- Risks & Mitigations
- Checklist (docs/next steps)
- CTA (book call/quote/etc.)


TOFU — Heuristic+Narrative (generic)

Sections:
- Hook heuristic
- Story spine with mechanism reveal
- Quick wins checklist
- CTA (subscribe/tool)

10) Human-in-the-loop (structured; feeds learning)

Reviewer scorecard → DNA/IP updates:

review_scorecard:
  tone: 0..5
  strategic_fit: 0..5
  novelty: 0..5
  compliance: pass|fail
  notes: "free text"
dna_update:
  if avg(tone)<3 → decrease 'jargon_tolerance' by 0.1
  if novelty<3   → increase 'Heuristic' usage cap by 0.1 (max 0.5)
ip_rule_updates:
  record frequent failure patterns → tighten invariants or operator prompts


Queue policy: prioritize BOFU/high-CPC and “critical path” pages.

11) Observability, security, SLOs

OTel spans: planner, retrieve.graph, retrieve.bm25, generate, audit, repair, publish.

Correlation IDs in logs & DB rows.

Alarms: spike in LAW_MISSTATE/EVIDENCE_HOLE, escalation rate > target, p95 latency breach, cost/page breach.

PII masking in logs; provenance JSON behind access control (signed URLs).

SLOs: MEDIUM p95 ≤ 45s; HEAVY p95 ≤ 90s. Post-publish compliance incidents = 0.

12) Lifecycle (refresh & re-gen)
refresh_triggers:
  - evidence_snapshots.last_checked > 180d → queue_update(affected_artifacts)
  - compliance_rules.version bump → re-audit affected pages
  - brand_profile.version bump → style-only re-edit
rate_limits:
  updates_per_day_per_domain: 50
dedupe:
  bm25+MiniLM dedupe_threshold: 0.88 to avoid near-duplicate pages

Implementation Guide (exact steps & files)
A) Repos & folders
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
  /ip_library
    framework@1.0.0.yaml
    process@1.0.0.yaml
    comparative@1.0.0.yaml
    ... (others as needed)
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
  /readwren
    adapter.md
    brand_questionnaire.md
  /ops
    otel_config.yaml
    alarms.yaml

B) Bring-up (Day 1–5 realistic)

Supabase: apply schema.sql; add registry rows; create service key.

Neo4j: define node/edge labels; schedule incremental mirror from Supabase.

BM25 index: build from entities.concept_abstract & artifacts.frontmatter.summary.

IP specs: start with Framework, Process, Comparative.

Tier files: LIGHT & MEDIUM (MEDIUM includes enforcement block).

Auditor/Repairer: implement micro-Auditor prompt (strict, short), diff-bounded repairer (window ±3 sentences).

Templates: Jinja JSON-LD & FAQ atom renderers.

Review UI v0: show draft, ledger (resolved/missing tags), evidence, CTA, compliance status, approve/reject + notes.

C) Controller snippets you can paste

Planner-time retrieval:

def parallel_retrieve(plan):
    graph = query_graph(plan, hops={"Mechanism":1,"Objections":2,"PersonaFit":1})
    bm25  = query_bm25(plan, fields=["concept_abstract^2","artifact_summary^1"])
    vec   = query_vectors(plan, topk=6, purpose="analogy_only")
    scored = rank(graph,bm25,vec, w_graph=0.55, w_bm25=0.35, w_vec=0.10, k=3)
    return SimpleNamespace(
      candidates=scored,
      graph_edges=graph.edges_used,
      flags=SimpleNamespace(graph_sparse=(len(graph) < 2))
    )


Diff-bounded repairer (sketch):

def repairer_diffbounded(draft, audit, budget):
    for item in audit.items_sorted_by_severity():
        span = get_local_window(draft, item.section, item.span, sents=3)
        patch = llm_repair(span, item, max_tokens=budget//len(audit.items))
        draft = draft.replace(span, patch)[:120000]  # hard cap to avoid bloat
    return draft


Micro-Auditor prompt (MEDIUM/HEAVY):

You are MICRO_AUDITOR. Task: detect ONLY the following critical tags:
NO_MECHANISM, NO_COUNTEREXAMPLE, NO_TRANSFER, EVIDENCE_HOLE,
LAW_MISSTATE, DOMAIN_MIXING, CONTEXT_DEGRADED, CTA_MISMATCH,
ORPHAN_CLAIM, SCHEMA_MISSING.
Input: plan summary + draft markdown + brand rubric + IP invariants.
Output (YAML): tags: [{tag, section, rationale(<=18w), span_hint}]
Rules: no rewriting; no suggestions beyond tags; zero false positives preferred over recall.


Brand editor (style only, no structure changes):

Rewrite for tone per brand_profile.voice.
Do NOT alter sections, claims, numbers, citations, or CTAs.
Max 10% token change. If unsure, leave as-is.

D) Cost & latency planning

MEDIUM typical: 1× planner (≤300 tok), 1× generator (1.8–2.2k), 1× micro-auditor (400–700), 0–1× repairer (400–600), 1× re-audit (200–500).

HEAVY typical: generator 3–4k; rest scaled accordingly.

Track cost/page in jobs. Alarm if p95 crosses thresholds you set.

E) Testing

Unit: Tag detectors (golden sentences), IP invariant tests (remove Mechanism → must flag), JSON-LD schema validation.

Integration: 20 seeded briefs across funnels/personas; expect zero unmanaged critical tags post-repair; JSON-LD valid; internal links present.

Adversarial: contradictory sources in graph; sparse graph; compliance trip-wires.

F) Rollout (honest cadence)

Phase 0 (Week 0–1): Supabase + BM25 + IP(Framework) + LIGHT/MEDIUM + Micro-Auditor; 15 pages (1 domain).

Phase 1 (Week 2–3): Neo4j mirror + Process/Comparative IPs + JSON-LD + Review UI v0; 50–80 pages (2–3 domains).

Phase 2 (Week 4–6): HEAVY tier + compliance atoms + refresh triggers + cost dashboards; +150 pages.

Phase 3 (Week 7–8): Reflection loop (DNA & IP updates), internal-link AB tests, tag expansion to 20–30 if needed.

What you’ll tangibly have per page

MDX/HTML (clean; processing tags stripped)

Frontmatter ledger (ip_id, invariants satisfied, tags resolved, sources used, last_checked)

JSON-LD (from Jinja template; validated)

FAQ atoms (3–5)

Provenance JSON (access-controlled, not public)

Review decision (approver + notes → feeds DNA/IP)

Why this solves the real problems

Cold-start resilient: parallel retrieval + BM25 promotion + #GRAPH_SPARSE.

No “self-auditing” illusion: independent micro-Auditor + diff-bounded Repairer.

Legal & SEO safe: allow-list + rule atoms + JSON-LD by code.

Cost-bounded: budgets, single escalation, queues + DLQ.

Truly meta: generic schema + pluggable domains via entities.type/attrs.

Learn-as-you-go: reviewer rubric updates brand DNA and IP rules.