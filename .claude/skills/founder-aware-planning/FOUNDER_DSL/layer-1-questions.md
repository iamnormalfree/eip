# Founder DSL - Layer 1: Business Questions

**Purpose:** Collect founder business intent through structured questionnaire.

**Instructions:** Ask ONE question at a time. Wait for answer before asking next question.

---

## Universal Categories (Always Ask)

### Category A: Scale & Growth

```
Q1: How many users do you expect in the first 6 months?

   a) < 100 users          → Solo/prototype scale
   b) 100-1,000 users      → Small business scale
   c) 1,000-10,000 users   → Startup scale
   d) 10,000+ users        → Growth-stage scale

   Your answer:
```

```
Q2: What's your expected growth rate?

   a) Linear/Slow           → Simple architecture acceptable
   b) Moderate              → Plan for scaling triggers
   c) Viral/Possible spike  → Need elastic design from day 1

   Your answer:
```

---

### Category B: Data & Sensitivity

```
Q3: What kind of data will you handle?

   a) Public data only                      → No special security needed
   b) User accounts/passwords               → Hashing, secure auth required
   c) Personal info (email, name)           → Privacy policy, GDPR considerations
   d) Financial/health/SSN                  → Compliance, encryption, audit logging
   e) Regulated industry data               → Full compliance stack

   Your answer:
```

```
Q4: Do you need data export/deletion capabilities?

   a) No                                    → SQLite works fine
   b) Yes, export only                      → Plan export formats
   c) Yes, export + deletion per request    → GDPR compliance mode

   Your answer:
```

---

### Category C: Budget & Resources

```
Q5: What's your monthly infrastructure budget?

   a) $0-50/month              → Self-host, SQLite, minimal cloud
   b) $50-200/month            → Managed DB, caching layer possible
   c) $200-1000/month          → Full cloud suite, CDNs, monitoring
   d) $1000+/month             → Enterprise stack, redundancy

   Your answer:
```

```
Q6: Who's building this?

   a) Just me, solo founder        → Simple patterns, low complexity
   b) 2-3 person team               → Can handle moderate complexity
   c) 5+ person team                → Can use complex patterns if needed

   Your answer:
```

---

### Category D: Time & Risk

```
Q7: What's your timeline to MVP?

   a) 1-2 weeks                    → Maximum YAGNI, use existing tools
   b) 1-2 months                   → Build what's needed, skip nice-to-haves
   c) 3-6 months                   → Can build custom solutions
   d) 6+ months                    → Full architecture possible

   Your answer:
```

```
Q8: What's your tolerance for downtime/outages?

   a) 1-4 hour outage acceptable    → Simple backup/restore
   b) < 1 hour outage acceptable    → Basic monitoring + alerting
   c) < 15 min outage acceptable    → Redundancy, health checks
   d) < 1 min outage acceptable     → Multi-region, failover (expensive!)

   Your answer:
```

---

## Conditional Categories (Ask If Relevant)

### Category E: Regulatory, Privacy & Auditability

**Ask if:** Q3 = c, d, or e (personal info, financial/health, regulated)

```
Q9: Do you operate in a regulated domain (finance/health/insurance)?

   a) No                              → Standard logging sufficient
   b) Yes - Finance                   → MAS-like auditability, recordkeeping
   c) Yes - Health                    → HIPAA considerations, data handling
   d) Yes - Singapore context         → PDPA compliance required

   Your answer:
```

```
Q10: What PDPA features do you need?

   a) None                            → Basic privacy policy
   b) Consent tracking                → User consent records
   c) Access + deletion workflows     → Full GDPR-style compliance
   d) Retention policies              → Automated data deletion jobs

   Your answer:
```

```
Q11: Do you need audit trails for "who did what when"?

   a) No                             → Basic activity logs
   b) Yes - Human actions            → Action audit logs
   c) Yes - Including agent actions  → Agent governance, trace logs

   Your answer:
```

```
Q12: Data residency constraints?

   a) None                    → Can host anywhere
   b) Data must stay in SG     → Region-specific hosting
   c) Per-customer residency   → Complex partitioning strategy

   Your answer:
```

---

### Category F: Integrations & Dependencies

**Ask if:** User mentions external systems, APIs, integrations

```
Q13: How many external systems must integrate in v1?

   a) 0                 → No integration complexity
   b) 1-2               → Simple API calls
   c) 3-5               → Integration layer needed
   d) 6+                → Dedicated integration architecture

   Your answer:
```

```
Q14: Integration type?

   a) API-first                 → Standard webhooks
   b) Scraping/parsing          → Brittleness, maintenance burden
   c) Batch/file export         → Scheduled jobs
   d) Mixed (all of above)      → Maximum complexity

   Your answer:
```

```
Q15: Real-time vs batch sync?

   a) Batch only (hourly/daily)     → Queue-based
   b) Webhooks needed               → Event-driven, retry/idempotency
   c) Both                          → Hybrid architecture

   Your answer:
```

```
Q16: Is there a "single source of truth" system?

   a) No                             → Our DB is source
   b) Yes - External (Odoo, etc.)    → We sync, don't mutate

   Your answer:
```

---

### Category G: Multi-tenancy & Permissions

**Ask if:** User mentions multiple clients, organizations, B2B

```
Q17: Single-tenant or multi-tenant?

   a) Single-tenant (just us)           → Simple auth
   b) Multi-tenant (many orgs)          → Tenant partitioning
   c) Multi-tenant + internal teams     → Complex tenancy

   Your answer:
```

```
Q18: Permission model?

   a) Simple (admin/user)              → Role column
   b) Role-based (3-5 roles)           → RBAC layer
   c) Attribute-based                  → ABAC system
   d) Per-resource permissions         → ACL-style

   Your answer:
```

```
Q19: Need impersonation?

   a) No                              → No special handling
   b) Yes - Support/admin only        → Impersonation infrastructure
   c) Yes - Customer support          → Full audit trail for impersonation

   Your answer:
```

```
Q20: Data partition guarantees?

   a) Logical separation OK           → Shared DB, tenant_id
   b) Hard isolation required         → Per-tenant DBs/encryption

   Your answer:
```

---

### Category H: Observability & Operations

**Ask if:** Q7 = c/d (3+ months) or Q8 = c/d (high reliability needed)

```
Q21: Tolerance for silent failures?

   a) OK to discover later            → Basic logs
   b) Must alert immediately          → Monitoring + alerting
   c) Must prevent entirely           → Circuit breakers, health checks

   Your answer:
```

```
Q22: Observability level?

   a) Logs only                      → Text logs
   b) Logs + metrics                 → Prometheus/Grafana
   c) Full observability             → Logs + metrics + traces

   Your answer:
```

```
Q23: Who's on-call?

   a) Just me                        → Simple alerts
   b) Small team                     → Escalation paths
   c) Nobody (fire-and-forget)       → Self-healing, max automation

   Your answer:
```

```
Q24: Need admin dashboards?

   a) No                             → CLI/DB inspection only
   b) Yes - Basic case state         → Simple admin panel
   c) Yes - Agent runs, job queues   → Full ops dashboard

   Your answer:
```

---

### Category I: Agent/LLM Autonomy Boundaries

**Ask if:** User mentions AI, agents, LLMs, automation

```
Q25: What can agents do?

   a) Advisory only                  → Read-only, suggestions
   b) Take actions with approval     → Human-in-the-loop
   c) Autonomous actions             → Full automation (risky!)

   Your answer:
```

```
Q26: What requires human approval?

   a) Nothing                       → Full autonomy
   b) Destructive actions only       → Delete/ban/modify gates
   c) Customer-facing actions        → All external comms
   d) Everything                    → Approval bottleneck

   Your answer:
```

```
Q27: Blast radius of agent mistake?

   a) Single case/user              → Contained failure
   b) Single tenant/org             → Localized outage
   c) All customers                 → Catastrophic (avoid!)

   Your answer:
```

```
Q28: Need replayability?

   a) No                            → Ephemeral agent runs
   b) Yes - Debug mode              → Deterministic re-runs
   c) Yes - Production              → Full event sourcing

   Your answer:
```

---

### Category J: Migration Expectations

**Ask if:** Q2 = b/c (growth expected) or timeline > 3 months

```
Q29: What will change in 3-6 months?

   a) Nothing expected              → Simple stack OK
   b) DB layer                      → Data export/import strategy
   c) Auth provider                 → Abstraction layer
   d) Infrastructure                → Containerization ready

   Your answer:
```

```
Q30: Migration triggers?

   a) None                          → Build for now
   b) User count (>5k, >10k)        → Scaling triggers
   c) Performance (writes/sec)      → Metrics-based
   d) Business milestones           → Timeline-based

   Your answer:
```

```
Q31: Migration downtime tolerance?

   a) Hours/days OK                 → Simple migrations
   b) Minutes only                  → Zero-downtime strategies
   c) Seconds only                 → Blue-green, complex

   Your answer:
```

---

## Output Format

After completing questions, create `founder-context.json`:

```json
{
  "layer_1_answers": {
    "scale": {
      "users_6mo": "<a/b/c/d from Q1>",
      "growth_rate": "<a/b/c from Q2>"
    },
    "data": {
      "sensitivity": "<a/b/c/d/e from Q3>",
      "export_deletion": "<a/b/c from Q4>"
    },
    "budget": {
      "monthly_infra": "<a/b/c/d from Q5>",
      "team_size": "<a/b/c from Q6>"
    },
    "time": {
      "timeline_mvp": "<a/b/c/d from Q7>",
      "downtime_tolerance": "<a/b/c/d from Q8>"
    },
    "regulatory_active": <true if Q9-Q12 asked>,
    "regulatory": { ... },
    "integrations_active": <true if Q13-Q16 asked>,
    "integrations": { ... },
    "multi_tenant_active": <true if Q17-Q20 asked>,
    "multi_tenant": { ... },
    "observability_active": <true if Q21-Q24 asked>,
    "observability": { ... },
    "agents_active": <true if Q25-Q28 asked>,
    "agents": { ... },
    "migration_active": <true if Q29-Q31 asked>,
    "migration": { ... }
  }
}
```

---

**Next:** `layer-2-tradeoffs.md`
