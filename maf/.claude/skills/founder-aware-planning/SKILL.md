---
name: founder-aware-planning
description: Create founder-informed, repo-aware implementation plans through structured decision-making. Translates founder business intent and existing repo architecture into technical requirements through repo context scan, 3-layer founder DSL, and integrated plan generation.
---

# Founder-Aware Planning

**Purpose:** Create founder-informed, repo-aware implementation plans through structured decision-making, avoiding default LLM architecture mistakes and second/third-order issues.

**When to Use:** Starting a new feature or project. Use this BEFORE writing an implementation plan to ensure founder constraints AND repo context are baked in from the start.

**Key Innovation:** Translates founder business intent AND existing repo architecture into technical requirements through:
1. **Repo Context Scan** - Discovers existing patterns, components, vision
2. **3-Layer Founder DSL** - Captures founder constraints, trade-offs, patterns
3. **Integrated Plan** - Merges repo context + founder context into coherent plan

Result: Plans that are founder-informed, repo-aware, future-aware, and technically sound.

---

## Quick Start

### Create a Founder-Informed Plan

```bash
/founder-aware-planning "Build user authentication system"
```

Launches interactive workflow:
1. **Layer 1**: Business questions (scale, budget, data, timeline, etc.)
2. **Layer 2**: Trade-off menus based on your answers
3. **Layer 3**: Pattern recommendations with future impact warnings
4. **Output**: Founder-informed implementation plan

### Example Output

```bash
/founder-aware-planning "Add encrypted export feature"
```

**Output:**
```
✅ Founder DSL complete
   → founder-context.json saved

✅ Implementation plan created
   → docs/plans/encrypted-export.md

📋 Founder Context Summary:
- Scale: <100 users (solo/prototype)
- Budget: $0-50/month (self-host, SQLite)
- Data: User data (encrypted export)
- Timeline: 1-2 weeks (MVP-focused)

🎯 Key Decisions:
- Storage: SQLite (local-first, offline capable)
- Auth: Simple email/password (DIY, budget-conscious)
- Encryption: XChaCha20-Poly1305 (authenticated)

⚠️ Future Impact Warnings:
- Write contention at >50 concurrent writers → migrate to PostgreSQL
- Single-machine backup risk → add cloud backup
- Multi-device sync complexity → plan for sync service

Next: /beads-friendly-planning docs/plans/encrypted-export.md
```

---

## How It Works

### The Problem It Solves

**Default LLM Plans Have Issues:**
- ❌ Assume unlimited resources ("use Kubernetes", "cloud-native")
- ❌ Ignore second-order effects ("add caching" → stale data problems)
- ❌ Skip founder constraints (budget, timeline, risk tolerance)
- ❌ Over-engineer for "future scale" that may never come
- ❌ Forget about migration paths (vendor lock-in)

**Founder-Aware Plans Are Better:**
- ✅ Respect founder boundaries (budget, team, timeline)
- ✅ Show trade-offs explicitly (choose X, get Y, accept Z)
- ✅ Document future consequences (second/third-order effects)
- ✅ Provide migration triggers (when to change approach)
- ✅ Result in swarm-executable specifications

---

## Repo Context Scan (NEW - Repo-Aware Planning)

**Problem:** Plans that ignore existing repo architecture create technical debt and integration headaches.

**Example:** Your "Autonomous MAF Foundations" plan builds on "MAF Franchise Architecture" - if the skill didn't scan the repo, it might propose:
- ❌ "Build agent coordination system" (but MCP Agent Mail already exists!)
- ❌ "Create task distribution" (but Beads already exists!)
- ❌ "Design role-based agents" (but Role-based spawning already exists!)

**Solution:** Before asking founder questions, scan the repo for:
- Vision/goals from README.md
- Architecture patterns from docs/
- Existing components
- Technical constraints (language, deployment, coordination)
- Existing plans to build on

### What Gets Scanned

| Source | What's Extracted |
|--------|-----------------|
| README.md | Vision, goals, project summary |
| docs/*architecture* | Architecture patterns |
| docs/*governance* | Governance docs (constitution, policies) |
| docs/*plan*.md | Existing implementation plans |
| Cargo.toml/package.json | Programming language |
| Dockerfile/docker-compose.yml | Deployment patterns |
| maf/docs/* | MAF-specific patterns (if MAF repo) |

### Output: .repo-context.json

```json
{
  "scan_date": "2026-01-09T12:00:00Z",
  "repo_name": "maf-github",
  "vision": "Multi-Agent Framework franchise architecture...",
  "architecture": {
    "pattern": "MAF Franchise (HQ + consumer franchises)",
    "components": [
      "MCP Agent Mail",
      "Beads",
      "Role-based spawning",
      "CI governance",
      "Health checks"
    ],
    "governance": ["Subtree protection", "Runbooks"]
  },
  "technical_constraints": {
    "language": "Rust",
    "deployment": "tmux sessions",
    "coordination": "MCP agent mail",
    "task_distribution": "beads_viewer"
  },
  "existing_docs": {
    "readme": true,
    "architecture": true,
    "governance": true,
    "plans": ["docs/plans/2026-01-08-autonomous-maf-foundations.md"]
  },
  "subtrees": ["maf", "vendor/agent-mail", "vendor/response-awareness"],
  "explicit_architecture_reference": true
}
```

### How Repo Context Changes Plans

**Without Repo Scan:**
```markdown
## Architecture
- Agent coordination: Custom message queue
- Task distribution: Round-robin assignment
```

**With Repo Scan:**
```markdown
## Repo Context

**Existing Architecture:**
- Pattern: MAF Franchise (HQ + consumer franchises)
- Components: MCP Agent Mail, Beads, Role-based spawning

**Relationship to Existing Architecture:**
- ✅ BUILDS ON: MCP Agent Mail (for coordination)
- ✅ BUILDS ON: Beads (for task distribution)
- ✅ EXTENDS: Adds Autonomy Constitution (governance layer)
- ✅ AVOIDS: Reinventing existing coordination

## Architecture
- Agent coordination: **Uses existing MCP Agent Mail**
- Task distribution: **Uses existing Beads**
- NEW: Autonomy Constitution (governance layer on top)
```

### Context Integration Question

When repo has established architecture, skill asks:

```
🔗 This repo has established architecture patterns.

Your new feature should:
  • Build on existing components (not reinvent)
  • Follow established patterns
  • Extend architecture (not replace it)

Should the plan explicitly reference existing architecture? (Y/n)
```

**If YES:** Plan includes "Repo Context" section with explicit references
**If NO:** Plan is standalone (may miss integration points)

---

## Early-Exit Mechanisms (Complexity-Gated Workflow)

**Prevent Over-Engineering:** Skip unnecessary Founder DSL categories for simple projects.

### Complexity Scan (0-12 Scoring)

Before asking questions, assess project complexity across 4 dimensions:

| Dimension | Score 0 | Score 1 | Score 2 | Score 3 |
|-----------|---------|---------|---------|---------|
| **Scope** | Single feature | Multi-feature | Single system | Multi-domain |
| **Data Sensitivity** | Public | User accounts | Personal info | Financial/health |
| **Integrations** | None | 1-2 systems | 3-5 systems | 6+ systems |
| **Team** | Solo | 2-3 people | 4-6 people | 7+ people |

**Total Score:** Sum of all dimensions (0-12)

### Routing Based on Complexity

```
┌─────────────────────────────────────────────────────────────────┐
│ Complexity Scan → Determine Founder DSL Scope                   │
├─────────────────────────────────────────────────────────────────┤
│ Score 0-2 → CORE-ONLY (10-15 min)                              │
│   ✅ Simple feature (single file, public data, solo)            │
│   📋 Ask: Categories A-D only (universal)                       │
│   ⏭️  Skip: E-J (regulatory, integrations, multi-tenancy, etc.) │
│                                                                  │
│ Score 3-5 → TARGETED (20-30 min)                                │
│   📋 Moderate complexity (multi-feature, some integrations)     │
│   📋 Ask: A-D + targeted conditionals (e.g., F if integrations) │
│   ⚡ Smart gating: Only ask relevant categories                 │
│                                                                  │
│ Score 6+ → FULL (30-45 min)                                     │
│   🏗️  Complex system (multi-domain, sensitive data, team)       │
│   📋 Ask: All categories A-J                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Smart Category Gating

For targeted mode, only ask conditional categories (E-J) if relevant:

```
Category E (Regulatory/PDPA)  → Skip if data type = public (Q3 = a)
Category F (Integrations)      → Skip if no external systems mentioned
Category G (Multi-tenancy)     → Skip if single-org design
Category H (Observability)     → Skip if low downtime tolerance (Q8 = a)
Category I (Agent autonomy)    → Skip if no AI/agents mentioned
Category J (Migration)         → Skip if timeline < 3 months (Q7 = a)
```

### Early-Exit: Plan Already Founder-Informed

If an existing plan has 4+ founder context markers, offer to skip Founder DSL:

```
✅ Plan is already founder-informed!
   Detected: Goals, Constraints, Security, Future Warnings

Skip Founder DSL and go directly to beads-friendly-planning? (Y/n)
```

**Founder context markers:**
- Constraints section with budget/timeline
- Architecture section with trade-offs
- Security section with threat model
- Future Impact Warnings section
- Data sensitivity classification
- Risk tolerance documented

### Auto Mode (Fully Automated)

```bash
/founder-aware-planning --auto "Build user authentication system"
```

**Auto mode behavior:**
- Runs complexity scan automatically
- Routes to appropriate scope (core-only/targeted/full)
- Skips irrelevant categories
- No interactive prompts (uses sensible defaults)
- Useful for automated workflows

**Use auto mode when:**
- You want to use founder constraints as defaults
- Running in automated workflows
- You prefer quick planning over deep exploration

**Skip auto mode when:**
- Founder wants to review each trade-off
- You're uncertain about project complexity
- You prefer interactive decision-making

---

## The 3-Layer Founder DSL

### Layer 1: Business Questions

Founder-facing questionnaire that captures business intent:

**Universal Categories (Always Asked):**
- **A** Scale & Growth (users expected, growth rate)
- **B** Data & Sensitivity (data types, export/deletion)
- **C** Budget & Resources (infra budget, team size)
- **D** Time & Risk (timeline, downtime tolerance)

**Conditional Categories (Asked If Relevant):**
- **E** Regulatory/PDPA/Auditability (regulated domain?)
- **F** Integrations (external systems?)
- **G** Multi-tenancy (single vs multi-tenant?)
- **H** Observability (monitoring needs?)
- **I** Agent Autonomy (what can AI agents do?)
- **J** Migration (what will change in 3-6 months?)

**Output**: `founder-context.json` with all answers

---

### Layer 2: Trade-off Menus

Based on Layer 1 answers, present decision cards showing:

```
┌─────────────────────────────────────────────────────────────────┐
│ STORAGE DECISION: Where does your data live?                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Option A: SQLite (Local/Single File)                           │
│  ───────────────────────────────────                            │
│  ✓ PROS: Zero cost, simple backup, works offline                │
│  ✗ CONS: Concurrency limits (~100 writes/sec), single server    │
│  BEST FOR: Budget-conscious, <5k users                          │
│                                                                  │
│  Option B: PostgreSQL (Cloud-Managed)                           │
│  ───────────────────────────────────                            │
│  ✓ PROS: Scales to millions, concurrent writes, replication     │
│  ✗ CONS: $15-200/month, migration needed if starting small      │
│  BEST FOR: Growth-stage, >5k users expected                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

RECOMMENDATION BASED ON YOUR ANSWERS:
Budget: $0-50/month → SQLite
Scale: <100 users → SQLite sufficient
Timeline: 1-2 weeks → SQLite faster to implement
```

**Output**: Updated `founder-context.json` with selected trade-offs

---

### Layer 3: Pattern Catalog

Architectural patterns matching selected trade-offs, with future impact warnings:

```
┌─────────────────────────────────────────────────────────────────┐
│ PATTERN: Local-First Architecture (SQLite + Optional Sync)       │
├─────────────────────────────────────────────────────────────────┤
│ USE THIS IF: You chose SQLite in Storage Decision              │
│                                                                  │
│ ⚠️ FUTURE IMPACT WARNINGS:                                       │
│                                                                  │
│ WARNING 1: Write Contention at Scale                            │
│   WHEN: >50 concurrent writers                                  │
│   SYMPTOMS: Lock contention, slow writes                        │
│   MIGRATION: Move to PostgreSQL                                 │
│   COMPLEXITY: Medium (schema compatible, driver change)         │
│                                                                  │
│ WARNING 2: Multi-Device Sync Complexity                         │
│   WHEN: Users expect data on multiple devices                   │
│   SYMPTOMS: Conflict resolution becomes product feature         │
│   MIGRATION: Build sync service (or use PowerSync)              │
│   COMPLEXITY: High (conflicts, resolution, offline merge)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Output**: Updated `founder-context.json` with selected patterns + warnings

---

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ founder-aware-planning Workflow                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. sp-brainstorming invoked                                    │
│     │                                                            │
│     ▼                                                            │
│  2. Layer 1: Business Questions (interactive)                   │
│     │   - Ask A-D (universal)                                   │
│     │   - Ask E-J (conditional)                                 │
│     │                                                            │
│     ▼                                                            │
│  3. Layer 2: Trade-off Menus                                    │
│     │   - Present relevant options based on answers            │
│     │   - Founder chooses options                               │
│     │                                                            │
│     ▼                                                            │
│  4. Layer 3: Pattern Catalog                                    │
│     │   - Show relevant patterns                                │
│     │   - Document future impact warnings                       │
│     │                                                            │
│     ▼                                                            │
│  5. sp-writing-plans invoked                                    │
│     │   - Creates plan WITH founder context                    │
│     │   - Includes constraints from Layer 1-2                  │
│     │   - Documents future impacts from Layer 3                │
│     │                                                            │
│     ▼                                                            │
│  6. Output: docs/plans/<project>.md                             │
│      + founder-context.json (for reference)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Commands Reference

### Start New Plan

```bash
/founder-aware-planning "<project description>"
```

Launches interactive workflow through all 3 layers.

### Auto Mode (Fully Automated)

```bash
/founder-aware-planning --auto "<project description>"
```

Auto mode runs the Founder DSL with minimal interaction:
- Runs complexity scan automatically
- Routes to appropriate scope (core-only/targeted/full)
- Skips irrelevant categories
- Uses sensible defaults for trade-offs
- Useful for automated workflows

**Difference from interactive mode:**
- Interactive: Founder reviews each trade-off menu and chooses
- Auto: Uses recommended defaults based on complexity assessment

### Example: Simple Feature

```bash
/founder-aware-planning "Add user profile page"
```

**Questions asked:**
- Scale (current users, growth expectations)
- Data (what data on profile?)
- Budget (infra budget)
- Timeline (when needed?)

**Output:** Founder-informed plan with appropriate scope for a simple feature.

### Example: Complex System

```bash
/founder-aware-planning "Build multi-tenant CRM with AI agents"
```

**Questions asked:**
- All universal categories (A-D)
- Regulatory (E) - CRM might touch regulated data
- Integrations (F) - CRM needs email, calendar integrations
- Multi-tenancy (G) - YES, multi-tenant by design
- Observability (H) - CRM needs monitoring
- Agent autonomy (I) - YES, AI agents take actions

**Output:** Founder-informed plan with all complex considerations addressed.

---

## Relationship to Other Skills

### founder-aware-planning → beads-friendly-planning

```
founder-aware-planning creates:
  docs/plans/my-feature.md (founder-informed)
  + founder-context.json (constraints documented)

beads-friendly-planning improves:
  docs/plans/my-feature.md (through passes a-l)
  → Reads founder-context.json for constraints
  → Skips re-asking questions already answered
  → Focuses on technical refinement
```

**Synergy:** beads-friendly-planning doesn't need to ask "what's your budget?" because founder-aware-planning already documented it.

### founder-aware-planning → plan-to-beads

```
founder-aware-planning → beads-friendly-planning → plan-to-beads
     (create plan)              (improve plan)          (convert to beads)
```

**plan-to-beads** is a separate mechanical conversion command. founder-aware-planning doesn't create beads.

---

## What Makes Plans "Superior"?

### Superior = Founder-Informed + Future-Aware + Swarm-Executable

**Founder-Informed:**
- ✅ "We can't afford cloud infrastructure" → Plan uses SQLite
- ✅ "We might scale to 10k users" → Plan documents PostgreSQL migration trigger
- ❌ Default LLM: "Use Kubernetes" (ignores budget)

**Future-Aware:**
- ✅ "SQLite works until ~50 concurrent writes, then migrate"
- ✅ "Clerk vendor lock-in: migration path is build own auth"
- ❌ Default LLM: No mention of migration, scale limits, or lock-in

**Swarm-Executable:**
- ✅ "Invariant: Never store passwords plaintext"
- ✅ "Run: `pnpm install && pnpm dev`" (executable command)
- ❌ Default LLM: "Implement secure auth" (ambiguous)

---

## Files Created

| File | Purpose |
|------|---------|
| `docs/plans/<project>.md` | Founder-informed implementation plan |
| `founder-context.json` | Founder decisions + trade-offs + patterns (for reference) |

---

## Tips for Best Results

### 1. Be Honest About Constraints

**Bad:** "Budget is flexible" (default LLM assumes unlimited)
**Good:** "Budget: $0-50/month" (plan uses cost-effective options)

### 2. Think About Real Usage

**Bad:** "We'll have millions of users" (premature optimization)
**Good:** "100-1k users in first 6 months" (appropriate architecture)

### 3. Consider Migration Early

**Bad:** "We'll figure it out later" (painful migration)
**Good:** "Expect to migrate DB at >5k users" (plan includes migration path)

### 4. Know Your Risk Tolerance

**Bad:** "High reliability" (vague, expensive)
**Good:** "1-4 hour outage acceptable" (appropriate design, saves money)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-09 | Initial release with 3-layer Founder DSL |

---

**See Also:**
- `FOUNDER_DSL/layer-1-questions.md` - Business questions detail
- `FOUNDER_DSL/layer-2-tradeoffs.md` - Trade-off menus detail
- `FOUNDER_DSL/layer-3-patterns.md` - Pattern catalog detail
- `IMPLEMENTATION.md` - Claude's workflow instructions
