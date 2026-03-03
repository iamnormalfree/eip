# Founder DSL - Layer 3: Pattern Catalog

**Purpose:** Architectural patterns matching selected trade-offs, with documented future impact warnings.

**Instructions:** Show patterns relevant to founder's Layer 2 choices. Include ALL future impact warnings.

---

## Pattern 1: Local-First Architecture

**Show if:** Layer 2 storage choice = SQLite

```
┌─────────────────────────────────────────────────────────────────┐
│ PATTERN: Local-First Architecture (SQLite + Optional Sync)       │
├─────────────────────────────────────────────────────────────────┤
│ USE THIS IF: You chose SQLite in Storage Decision              │
│                                                                  │
│ ARCHITECTURE:                                                    │
│ ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│ │   Client    │    │   Client    │    │   Client    │          │
│ │  (SQLite)   │    │  (SQLite)   │    │  (SQLite)   │          │
│ └──────┬──────┘    └──────┬──────┘    └──────┬──────┘          │
│        │                  │                  │                   │
│        └──────────────────┼──────────────────┘                   │
│                           │                                       │
│                    ┌──────▼──────┐                               │
│                    │   Optional  │                               │
│                    │   Sync      │                               │
│                    │   Service   │                               │
│                    └─────────────┘                               │
│                                                                  │
│ ✓ BUILT-IN BENEFITS:                                             │
│    • Works offline (no connectivity needed)                     │
│    • Fast queries (local DB, zero network latency)              │
│    • Simple deployment (static hosting possible)                │
│    • Zero infrastructure cost                                   │
│                                                                  │
│ ⚠️ FUTURE IMPACT WARNINGS:                                       │
│                                                                  │
│ WARNING 1: Write Contention at Scale                            │
│   WHEN: >50 concurrent writers                                  │
│   SYMPTOMS: Lock contention, slow writes                        │
│   MIGRATION: Move to PostgreSQL + pool connection              │
│   COMPLEXITY: Medium (schema compatible, driver change)         │
│                                                                  │
│ WARNING 2: Single-Machine Backup Risk                           │
│   WHEN: Client device failure                                   │
│   SYMPTOMS: Data loss if no sync + no backup                    │
│   MITIGATION: Auto-backup to cloud, export functionality        │
│                                                                  │
│ WARNING 3: Analytics Become Hard                                │
│   WHEN: You need cross-user analytics                           │
│   SYMPTOMS: Can't query across all client DBs                   │
│   MIGRATION: Add central warehouse + export pipeline            │
│   COMPLEXITY: High (new data pipeline needed)                   │
│                                                                  │
│ WARNING 4: Multi-Device Sync Complexity                         │
│   WHEN: Users expect data on multiple devices                   │
│   SYMPTOMS: Conflict resolution becomes product feature         │
│   MIGRATION: Build sync service (or use PowerSync, ElectricSQL) │
│   COMPLEXITY: High (conflicts, resolution, offline merge)       │
│                                                                  │
│ WHEN TO CHOOSE THIS PATTERN:                                     │
│ ✅ Budget < $50/month                                            │
│ ✅ Offline functionality desired                                 │
│ ✅ Single-tenant or simple multi-tenant                          │
│ ✅ <5k users expected in next 12 months                          │
│                                                                  │
│ WHEN TO AVOID THIS PATTERN:                                      │
│ ❌ High write concurrency (>50 simultaneous writers)             │
│ ❌ Real-time collaboration features needed                       │
│ ❌ Cross-user analytics core to product                          │
│ ❌ No offline requirement (cloud-native simpler)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pattern 2: Webhook Integration Architecture

**Show if:** Layer 2 sync choice = webhook OR F15 = "webhooks needed"

```
┌─────────────────────────────────────────────────────────────────┐
│ PATTERN: Webhook Integration Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│ USE THIS IF: You chose Webhook/Event-Driven in Sync Decision    │
│                                                                  │
│ ARCHITECTURE:                                                    │
│                                                                  │
│   External System                Your System                    │
│  ┌─────────────┐               ┌─────────────────┐             │
│  │  Event      │               │  Webhook        │             │
│  │  Occurs     │──────────────▶│  Endpoint       │             │
│  └─────────────┘               │  (public URL)   │             │
│                                └────────┬────────┘             │
│                                         │                       │
│                                         ▼                       │
│                                ┌─────────────────┐             │
│                                │  Idempotency    │             │
│                                │  Check          │             │
│                                │  (deduplicate)  │             │
│                                └────────┬────────┘             │
│                                         │                       │
│                            ┌────────────┴────────────┐          │
│                            │                         │          │
│                            ▼                         ▼          │
│                    ┌─────────────┐          ┌─────────────┐    │
│                    │   Process   │          │    Queue    │    │
│                    │   Event     │          │ (retry)     │    │
│                    └─────────────┘          └─────────────┘    │
│                            │                                      │
│                            ▼                                      │
│                    ┌─────────────┐                                │
│                    │    Ack      │ 200 OK                        │
│                    │   200 OK    │ (only after safe storage)     │
│                    └─────────────┘                                │
│                                                                  │
│ REQUIRED COMPONENTS:                                             │
│ 1. WEBHOOK ENDPOINT (HTTP POST handler)                         │
│ 2. IDEMPOTENCY LAYER (deduplication)                            │
│ 3. PERSISTENT QUEUE (for retries)                               │
│ 4. WEBHOOK SIGNATURE VERIFICATION                               │
│                                                                  │
│ ✓ BUILT-IN BENEFITS:                                             │
│    • Near real-time updates (<5 seconds)                        │
│    • Source system pushes when changes happen                   │
│    • No wasted polling calls                                    │
│                                                                  │
│ ⚠️ FUTURE IMPACT WARNINGS:                                       │
│                                                                  │
│ WARNING 1: Webhook Delivery NOT Guaranteed                     │
│   WHEN: External system has outage or network issues            │
│   SYMPTOMS: Missing events, data gaps                           │
│   MITIGATION: Reconciliation job (request missing events)       │
│   COMPLEXITY: High (need to detect gaps + request replay)       │
│                                                                  │
│ WARNING 2: Duplicate Webhooks Are Common                        │
│   WHEN: External system retries (timeout, 500 error)            │
│   SYMPTOMS: Duplicate records if no idempotency                 │
│   MITIGATION: Idempotency key REQUIRED                          │
│   COMPLEXITY: Medium (need deduplication layer)                 │
│                                                                  │
│ WARNING 3: Webhook Order NOT Guaranteed                         │
│   WHEN: Multiple events fire quickly                            │
│   SYMPTOMS: Event B arrives before Event A                      │
│   MITIGATION: Sequence numbers, event ordering in queue         │
│   COMPLEXITY: Medium (need ordering logic)                      │
│                                                                  │
│ WARNING 4: Debugging Async Failures Is Hard                     │
│   WHEN: Webhook processing fails in background                 │
│   SYMPTOMS: External system got 200 OK but processing failed    │
│   MITIGATION: Dead letter queue + alerting + manual replay      │
│   COMPLEXITY: High (need ops infrastructure)                    │
│                                                                  │
│ WARNING 5: Testing Requires Mocking                             │
│   WHEN: Developing webhook handlers                             │
│   SYMPTOMS: Can't test without real webhooks                    │
│   MITIGATION: Webhook mocking tools, test event replay          │
│   COMPLEXITY: Medium (need test infrastructure)                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pattern 3: Multi-Tenant with Row-Level Security

**Show if:** Layer 2 G17 = multi-tenant

```
┌─────────────────────────────────────────────────────────────────┐
│ PATTERN: Row-Level Security (RLS) Multi-Tenancy                 │
├─────────────────────────────────────────────────────────────────┤
│ USE THIS IF: You chose Multi-tenant + Data Partitioning         │
│                                                                  │
│ ARCHITECTURE:                                                    │
│                                                                  │
│  Application Layer                Database Layer                │
│  ┌─────────────┐               ┌─────────────────┐             │
│  │   Request   │               │  PostgreSQL     │             │
│  │   + JWT     │──────────────▶│  with RLS       │             │
│  │   (tenant)  │               │  Policies       │             │
│  └─────────────┘               └─────────────────┘             │
│                                          │                      │
│                                          ▼                      │
│                                 ┌─────────────────┐             │
│                                 │  RLS Policy     │             │
│                                 │  (auto-filter)  │             │
│                                 └─────────────────┘             │
│                                          │                      │
│                                          ▼                      │
│                                 ┌─────────────────┐             │
│                                 │  Query Result   │             │
│                                 │  (tenant-only)  │             │
│                                 └─────────────────┘             │
│                                                                  │
│ REQUIRED COMPONENTS:                                             │
│ 1. TENANT CONTEXT IN CONNECTION (JWT with tenant_id)            │
│ 2. EVERY TABLE HAS TENANT_ID (NOT NULL, indexed)                │
│ 3. RLS POLICIES ON ALL TABLES (auto-filter)                     │
│ 4. AUDIT LOG (WHO accessed WHAT)                                │
│                                                                  │
│ ✓ BUILT-IN BENEFITS:                                             │
│    • Data isolation enforced at DB level (no app bugs can leak) │
│    • Impossible to forget WHERE clause (automatic)              │
│    • Compliance-friendly (audit trail built-in)                 │
│    • Future-proof for new queries (RLS applies to all)          │
│                                                                  │
│ ⚠️ FUTURE IMPACT WARNINGS:                                       │
│                                                                  │
│ WARNING 1: Cross-Tenant Queries Become Hard                    │
│   WHEN: You need admin/analytics across all tenants            │
│   SYMPTOMS: Can't query without bypassing RLS                   │
│   MITIGATION: Separate admin schema, superuser role             │
│   COMPLEXITY: Medium (need separate access path)                │
│                                                                  │
│ WARNING 2: Foreign Keys Require tenant_id Too                  │
│   WHEN: Joining tables with foreign keys                        │
│   SYMPTOMS: Must include tenant_id in FK constraint            │
│   MITIGATION: Use composite FK (tenant_id, resource_id)         │
│   COMPLEXITY: Low (schema pattern, consistent)                  │
│                                                                  │
│ WARNING 3: Performance Overhead on Large Tables                 │
│   WHEN: Millions of rows per tenant                             │
│   SYMPTOMS: RLS filter adds query overhead                      │
│   MITIGATION: Partitioning by tenant_id (separate tables)       │
│   COMPLEXITY: High (re-architect to partitioned schema)         │
│                                                                  │
│ WARNING 4: Migrating from Non-RLS is Painful                    │
│   WHEN: You didn't start with RLS, need to add later            │
│   SYMPTOMS: Must add tenant_id to ALL tables, migrate data      │
│   MITIGATION: Plan ahead if multi-tenancy is possible           │
│   COMPLEXITY: Very High (schema migration + data migration)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pattern 4: Agent Governance with Approval Gates

**Show if:** Layer 2 I25 = "selective autonomy" OR I26 = "human approval required"

```
┌─────────────────────────────────────────────────────────────────┐
│ PATTERN: Agent Governance with Approval Gates                   │
├─────────────────────────────────────────────────────────────────┤
│ USE THIS IF: You chose Selective Autonomy for Agents            │
│                                                                  │
│ ARCHITECTURE:                                                    │
│                                                                  │
│   Agent Layer                 Approval Layer        Action Layer │
│  ┌─────────────┐            ┌──────────────┐    ┌─────────────┐│
│  │   Agent     │            │   Approval   │    │   Action    ││
│  │  Decides    │───────────▶│   Gate       │───▶│  Executor   ││
│  │   Action    │ Proposal   │  (Human or   │    │ (DB/API)    ││
│  │             │            │   Auto)      │    │             ││
│  └─────────────┘            └──────────────┘    └─────────────┘│
│                                                                  │
│ REQUIRED COMPONENTS:                                             │
│ 1. ACTION CLASSIFIER (What kind of action?)                      │
│    SAFE: Auto-approve (tagging, categorization)                │
│    DESTRUCTIVE: Human required (delete, ban)                    │
│    CUSTOMER-FACING: Human required (send email, message)        │
│    BULK: Human required (affects >N records)                    │
│                                                                  │
│ 2. APPROVAL QUEUE (Store pending proposals)                      │
│ 3. AUDIT LOG (Immutable record of all decisions)                │
│ 4. RATE LIMITING (Prevent agent runaway)                         │
│ 5. SANDBOXING (Limit blast radius)                               │
│                                                                  │
│ ✓ BUILT-IN BENEFITS:                                             │
│    • Automation for safe work (no bottleneck)                   │
│    • Human control for risky work (prevents disasters)          │
│    • Audit trail (compliance + debugging)                       │
│    • Can tune "what's safe" over time                           │
│                                                                  │
│ ⚠️ FUTURE IMPACT WARNINGS:                                       │
│                                                                  │
│ WARNING 1: Classification Errors Have Real Impact               │
│   WHEN: Action misclassified as safe when it's destructive      │
│   SYMPTOMS: Agent deletes data without approval                 │
│   MITIGATION: Start conservative (more human review), loosen    │
│   COMPLEXITY: Medium (requires judgment, tuning over time)       │
│                                                                  │
│ WARNING 2: Approval Bottleneck at Scale                         │
│   WHEN: Many agents requesting approval                         │
│   SYMPTOMS: Humans can't keep up, delays build up               │
│   MITIGATION: Auto-approve safe actions, train agents better    │
│   COMPLEXITY: Low (design choice, not technical)                │
│                                                                  │
│ WARNING 3: Audit Log Storage Grows Unbounded                    │
│   WHEN: Every agent action logged                               │
│   SYMPTOMS: Storage costs grow, query performance drops         │
│   MITIGATION: Retention policy (E10), archive old logs          │
│   COMPLEXITY: Medium (need archival strategy)                    │
│                                                                  │
│ WARNING 4: Prompt Version Coupling                              │
│   WHEN: Agent behavior changes with prompt update               │
│   SYMPTOMS: Old audit logs don't explain new behavior           │
│   MITIGATION: Store prompt version with each decision           │
│   COMPLEXITY: Low (add prompt_version column)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pattern 5: Simple CRUD (No Special Pattern)

**Show if:** No other patterns are relevant

```
┌─────────────────────────────────────────────────────────────────┐
│ PATTERN: Simple CRUD (No Special Architecture Needed)            │
├─────────────────────────────────────────────────────────────────┤
│ USE THIS IF: None of the specialized patterns apply             │
│                                                                  │
│ ARCHITECTURE:                                                    │
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │   Frontend  │────▶│    API      │────▶│  Database   │      │
│  │  (Web/App)  │     │  (Express)  │     │ (PostgreSQL)│      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                                  │
│ CHARACTERISTICS:                                                 │
│ • Standard HTTP API (REST or GraphQL)                           │
│ • Direct database queries (no complex caching)                  │
│ • Simple authentication (if needed)                             │
│ • No real-time features                                         │
│ • No complex integrations                                        │
│ • No agents or AI                                               │
│                                                                  │
│ ✓ BUILT-IN BENEFITS:                                             │
│    • Simple to understand and maintain                          │
│    • Easy to debug (direct call flow)                           │
│    • Fast to build (no complex infrastructure)                  │
│    • Low operational overhead                                   │
│                                                                  │
│ ⚠️ FUTURE IMPACT WARNINGS:                                       │
│                                                                  │
│ WARNING 1: Doesn't Scale Indefinitely                           │
│   WHEN: >10k concurrent users OR >1k req/sec                    │
│   SYMPTOMS: Response time increases, database contention         │
│   MITIGATION: Add caching (Redis), read replicas, or queue      │
│   COMPLEXITY: Medium (infrastructure additions)                 │
│                                                                  │
│ WARNING 2: No Real-Time Features                                │
│   WHEN: Users expect real-time updates                          │
│   SYMPTOMS: Manual page refresh required to see changes         │
│   MITIGATION: Add polling OR WebSockets OR Server-Sent Events   │
│   COMPLEXITY: Medium (real-time infrastructure)                  │
│                                                                  │
│ WARNING 3: Single Points of Failure                             │
│   WHEN: API server or database goes down                        │
│   SYMPTOMS: Complete outage (no redundancy)                     │
│   MITIGATION: Load balancers, database replication, health checks│
│   COMPLEXITY: High (infrastructure changes)                     │
│                                                                  │
│ WHEN TO CHOOSE THIS PATTERN:                                     │
│ ✅ MVP or prototype                                             │
│ ✅ Simple data CRUD (create, read, update, delete)              │
│ ✅ <10k users expected                                          │
│ ✅ Small team (1-3 people)                                      │
│ ✅ Tight timeline (<3 months)                                   │
│                                                                  │
│ WHEN TO AVOID THIS PATTERN:                                      │
│ ❌ Real-time collaboration required                              │
│ ❌ Complex workflow orchestration                                │
│ ❌ High scalability required from day 1                          │
│ ❌ Multiple external system integrations                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output Format

After presenting relevant patterns, update `founder-context.json`:

```json
{
  "layer_3_patterns": [
    "simple_crud"
    // or: ["local_first"]
    // or: ["webhook_integration"]
    // or: ["multi_tenant_rls"]
    // or: ["agent_governance"]
    // or: ["local_first", "agent_governance"] (multiple patterns)
  ],
  "future_impacts": [
    "WARNING 1 from pattern",
    "WARNING 2 from pattern",
    "WARNING from trade-offs (vendor lock-in, etc.)"
  ]
}
```

---

**Next:** Return to IMPLEMENTATION.md to continue with plan creation
