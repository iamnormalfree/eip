# Founder DSL - Layer 2: Trade-off Menus

**Purpose:** Show founders visual "Choose X, get Y benefits, but accept Z consequences" based on Layer 1 answers.

**Instructions:** Present trade-offs based on founder's Layer 1 answers. Show recommendation. Wait for choice.

---

## Trade-off Menu 1: Data Storage

**Show based on:** D5 (budget), D6 (team), A1 (scale), B3 (data sensitivity)

```
┌─────────────────────────────────────────────────────────────────┐
│ STORAGE DECISION: Where does your data live?                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option A: SQLite (Local/Single File)                           │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Zero infrastructure cost                                   │
│    • Simple backup (copy file)                                  │
│    • Works offline                                              │
│    • Easy migration path to PostgreSQL later                    │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Concurrency limits (~100 writes/sec before contention)     │
│    • Single server only (no horizontal scaling)                │
│    • Manual failover needed                                     │
│                                                                  │
│  BEST FOR: Budget-conscious, <5k users, simple workloads        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option B: PostgreSQL (Cloud-Managed)                           │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Scales to millions of users                                │
│    • Concurrent writes handle heavy workloads                   │
│    • Built-in replication & failover                            │
│                                                                  │
│  ✗ CONS:                                                        │
│    • $15-200/month depending on scale                           │
│    • Requires migration from SQLite if starting small           │
│    • More complex backup/restore                                │
│                                                                  │
│  BEST FOR: Growth-stage, >5k users expected, write-heavy        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option C: Firebase/Supabase (Managed BaaS)                     │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Real-time sync built-in                                    │
│    • Auth included                                              │
│    • Scales automatically                                       │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Vendor lock-in (hard to migrate later)                     │
│    • Costs grow with usage (can surprise)                       │
│    • Limited query flexibility for complex joins                │
│                                                                  │
│  BEST FOR: Rapid MVP, real-time features, small team           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

RECOMMENDATION BASED ON YOUR ANSWERS:
[Provide recommendation based on D5, A1, B3]
```

---

## Trade-off Menu 2: Authentication Strategy

**Show based on:** B3 (data sensitivity), E9-E12 (regulatory), D5 (budget)

```
┌─────────────────────────────────────────────────────────────────┐
│ AUTH DECISION: How do users identify themselves?                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option A: Simple Email/Password (DIY)                          │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Full control over user data                                │
│    • No vendor dependencies                                     │
│    • Can build custom flows easily                              │
│                                                                  │
│  ✗ CONS:                                                        │
│    • YOU handle password security (hashing, breaches)           │
│    • YOU handle password reset flows                            │
│    • No social login out-of-box                                 │
│                                                                  │
│  SECURITY REQUIREMENTS:                                         │
│    • Argon2id hashing (mandatory if regulated)                  │
│    • Rate limiting on auth endpoints                            │
│    • Secure session storage                                     │
│                                                                  │
│  BEST FOR: Full control needed, regulated domain, <10k users    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option B: Auth Provider (Auth0, Clerk, Supabase Auth)         │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Security handled by experts                                │
│    • Social login (Google, GitHub) included                     │
│    • 2FA, SSO available out-of-box                              │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Vendor lock-in (migration painful)                         │
│    • Costs scale with users ($25-500/month)                     │
│    • Less control over auth UX                                  │
│                                                                  │
│  BEST FOR: Fast MVP, social login needed, non-regulated         │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option C: Enterprise SSO (SAML, OIDC)                          │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • No passwords to manage                                     │
│    • Enterprise customers expect this                           │
│    • Centralized user management                                │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Complex setup (requires SAML expertise)                    │
│    • Per-customer configuration                                 │
│    • Testing requires enterprise accounts                       │
│                                                                  │
│  BEST FOR: B2B product, enterprise sales                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

RECOMMENDATION BASED ON YOUR ANSWERS:
[If B3=d or E9=b/c → Warn: Auth provider preferred for compliance]
```

---

## Trade-off Menu 3: Real-time vs Batch Sync

**Show based on:** F13-F16 (integrations), H21-H24 (observability)

```
┌─────────────────────────────────────────────────────────────────┐
│ SYNC DECISION: How current does data need to be?                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option A: Batch Sync (Scheduled)                               │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Simple architecture (cron jobs)                            │
│    • Easy to retry failed syncs                                 │
│    • Predictable costs                                          │
│    • Idempotent by design                                       │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Data is always stale (minutes to hours)                    │
│    • Users wait for updates                                     │
│    • Conflicts harder to resolve                                │
│                                                                  │
│  SECOND-ORDER EFFECTS:                                          │
│    • Users may double-work (not seeing latest changes)          │
│    • Support burden ("where's my data?")                        │
│    • Race conditions in multi-user scenarios                    │
│                                                                  │
│  BEST FOR: Back-office ops, non-urgent data, budget-conscious   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option B: Webhook/Event-Driven                                 │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Near real-time updates (<5 seconds)                        │
│    • Users see changes immediately                              │
│    • Source system pushes when changes happen                   │
│                                                                  │
│  ✗ CONS:                                                        │
│    • More complex architecture (webhook handlers)               │
│    • Must handle failures + retries                             │
│    • Idempotency critical (duplicate webhooks common)           │
│    • Debugging harder (async flows)                             │
│                                                                  │
│  SECOND-ORDER EFFECTS:                                          │
│    • Need idempotency keys or deduplication layer              │
│    • Webhook delivery not guaranteed (systems retry forever)    │
│    • Need dead letter queues for failed events                  │
│    • Testing requires webhook mocking tools                     │
│                                                                  │
│  BEST FOR: User-facing features, urgent updates, integrations   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option C: Polling (Check Every N Seconds)                      │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Simple implementation (just loop + fetch)                  │
│    • Client controls timing                                     │
│    • No webhook infrastructure needed                           │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Wasteful API calls (even when no changes)                  │
│    • Still not truly real-time (polling interval)              │
│    • Can hit rate limits                                        │
│    • Server cost scales with poll frequency                    │
│                                                                  │
│  SECOND-ORDER EFFECTS:                                          │
│    • Need exponential backoff on failures                       │
│    • Rate limiting requires queue management                    │
│    • Users blame "lag" on your product                          │
│                                                                  │
│  BEST FOR: Low-frequency data, simple MVPs, no webhooks avail   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Trade-off Menu 4: Agent Autonomy Level

**Show based on:** I25-I28 (agent autonomy questions)

**Only show if:** I25-I28 were asked (agents_active = true)

```
┌─────────────────────────────────────────────────────────────────┐
│ AGENT AUTONOMY: What can AI agents do without human approval?   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option A: Advisory Only (Safe)                                 │
│  ───────────────────────────────────                            │
│  WHAT IT MEANS:                                                 │
│    • Agents read data, suggest actions                          │
│    • Human clicks to approve every action                       │
│    • Agents never mutate state directly                         │
│                                                                  │
│  ✓ PROS:                                                        │
│    • Zero catastrophic risk                                     │
│    • Human stays in control                                     │
│    • Easy to explain to customers                               │
│                                                                  │
│  ✗ CONS:                                                        │
│    • No automation benefit (human does work anyway)             │
│    • Bottleneck at human approval                               │
│    • Agents don't reduce operational load                       │
│                                                                  │
│  SECOND-ORDER EFFECTS:                                          │
│    • Users get annoyed at constant approval prompts             │
│    • Throughput limited by human attention span                 │
│    • Agents can't handle scale spikes                           │
│                                                                  │
│  BEST FOR: High-risk actions, regulated domains, early stage    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option B: Selective Autonomy (Balanced)                        │
│  ───────────────────────────────────                            │
│  WHAT IT MEANS:                                                 │
│    • Safe actions: auto-approve (tagging, categorization)       │
│    • Destructive actions: human approval (delete, ban)          │
│    • Customer-facing: human approval (send message, email)      │
│                                                                  │
│  ✓ PROS:                                                        │
│    • Automation for safe work                                   │
│    • Human control for risky work                               │
│    • Can tighten/loosen over time                               │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Complex permission model (what's "safe"?)                  │
│    • Need approval gates infrastructure                         │
│    • Category errors possible (safe marked unsafe)              │
│                                                                  │
│  SECOND-ORDER EFFECTS:                                          │
│    • Need audit log for all agent decisions                     │
│    • Misclassified action = customer-visible bug                │
│    • Approval UI becomes critical path                          │
│    • Rollback strategy needed for mistaken approvals            │
│                                                                  │
│  BEST FOR: Most production systems with agents                  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option C: Full Autonomy (Risky)                                │
│  ───────────────────────────────────                            │
│  WHAT IT MEANS:                                                 │
│    • Agents take all actions without approval                   │
│    • Human only reviews exceptions/anomalies                    │
│                                                                  │
│  ✓ PROS:                                                        │
│    • Maximum automation benefit                                 │
│    • Scales without human bottleneck                            │
│    • True "set it and forget it"                                │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Catastrophic risk possible (agent deletes everything)      │
│    • Hard to debug when things go wrong                         │
│    • Customer trust issues if agent mistakes                    │
│                                                                  │
│  SECOND-ORDER EFFECTS:                                          │
│    • NEED comprehensive testing before production               │
│    • NEED rollback infrastructure                               │
│    • NEED kill switches (emergency stop)                        │
│    • NEED blast radius limiting (sandboxing)                    │
│    • ONE bad prompt = production incident                       │
│                                                                  │
│  THIRD-ORDER EFFECTS:                                           │
│    • If agent deletes customer data: reputation damage          │
│    • If agent sends wrong message: legal liability              │
│    • If agent mis-bans user: support ticket flood              │
│                                                                  │
│  BEST FOR: Internal tools, low-risk actions, mature testing     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

⚠️ CRITICAL IF E9=b/c or I26=c: You MUST implement approval gates
   and audit logs. Agent autonomy + regulated domain = liability.
```

---

## Trade-off Menu 5: Deployment Strategy

**Show based on:** D5 (budget), D7 (timeline), A1 (scale)

```
┌─────────────────────────────────────────────────────────────────┐
│ DEPLOYMENT: How do you deliver your application?                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option A: Static Hosting (Vercel, Netlify, GH Pages)          │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Zero infrastructure cost                                   │
│    • CDN included (fast global)                                │
│    • Simple deployment (git push)                               │
│    • SSL handled automatically                                  │
│                                                                  │
│  ✗ CONS:                                                        │
│    • No server-side code (must be static)                       │
│    • No long-running processes                                  │
│    • Limited to web apps (no workers)                           │
│                                                                  │
│  BEST FOR: SPAs, static sites, JAMStack, <10k visitors/day     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option B: Serverless (Vercel Functions, Lambda)                │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Pay only for what you use                                  │
│    • Scales automatically                                      │
│    • No server management                                       │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Cold starts (50-500ms latency)                             │
│    • Hard to debug (distributed)                                │
│    • Vendor lock-in (cloud-specific)                            │
│                                                                  │
│  BEST FOR: API endpoints, sporadic traffic, MVP                 │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option C: Containers (Docker, K8s)                             │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Consistent environments (dev → prod)                       │
│    • Can run long-running processes                             │
│    • Portable (run anywhere)                                    │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Need container orchestration (complexity)                  │
│    • Infrastructure management required                         │
│    • Higher cost (always running)                               │
│                                                                  │
│  BEST FOR: Complex apps, long-running workers, team >3 people   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option D: PaaS (Railway, Render, Fly.io)                       │
│  ───────────────────────────────────                            │
│  ✓ PROS:                                                        │
│    • Deploy with `git push`                                     │
│    • Managed databases included                                 │
│    • SSL, load balancing included                               │
│    • Less complex than K8s                                      │
│                                                                  │
│  ✗ CONS:                                                        │
│    • Vendor lock-in (harder to migrate)                        │
│    • Costs grow with usage                                      │
│    • Less control than self-hosted                             │
│                                                                  │
│  BEST FOR: Small teams, fast time-to-market, <100k users       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Output Format

After trade-offs selected, update `founder-context.json`:

```json
{
  "layer_2_decisions": {
    "storage": "<sqlite/postgresql/firebase>",
    "storage_rationale": "<founder's reason>",
    "auth": "<diy/provider/sso>",
    "auth_rationale": "<founder's reason>",
    "sync": "<batch/webhook/polling>",
    "sync_rationale": "<founder's reason>",
    "agent_autonomy": "<advisory/selective/full>",
    "agent_autonomy_rationale": "<founder's reason>",
    "deployment": "<static/serverless/containers/paas>",
    "deployment_rationale": "<founder's reason>"
  }
}
```

---

**Next:** `layer-3-patterns.md`
