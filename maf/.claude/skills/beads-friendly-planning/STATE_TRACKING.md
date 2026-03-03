# State Tracking for Beads-Friendly Planning

**Purpose:** Track progress across multiple iterations of plan improvement.

**File:** `.beads-planning-state.json` (created in project root)

---

## State File Schema

```json
{
  "version": "1.0.0",
  "created_at": "2026-01-09T07:30:00Z",
  "updated_at": "2026-01-09T08:45:00Z",

  "plan_file": "docs/plans/my-feature.md",
  "original_plan_backup": ".beads-planning-backup/original-plan.md",
  "current_plan_version": "plan-improved-v5.md",

  "status": "in_progress",
  "current_pass": "f",
  "total_passes": 12,

  "passes_completed": [
    "a", "b", "c", "d", "e", "f"
  ],

  "passes_remaining": [
    "g", "h", "i", "j", "k", "l"
  ],

  "passes_available": [
    {
      "id": "a",
      "name": "Analysis",
      "description": "Assess plan state and identify gaps",
      "status": "completed",
      "completed_at": "2026-01-09T07:35:00Z",
      "output_file": "plan-analysis-report.md"
    },
    {
      "id": "b",
      "name": "Spine",
      "description": "Build structural completeness",
      "status": "completed",
      "completed_at": "2026-01-09T07:55:00Z",
      "output_file": "plan-improved-v1-spine.md",
      "changes": "Added goals, non-goals, workflows, architecture blocks"
    },
    {
      "id": "c",
      "name": "Reality Check",
      "description": "Align with existing codebase",
      "status": "completed",
      "completed_at": "2026-01-09T08:20:00Z",
      "output_file": "plan-improved-v2-reality-checked.md",
      "changes": "Added platform constraints, existing patterns"
    },
    {
      "id": "d",
      "name": "Security",
      "description": "Threat model and privacy leak surfaces",
      "status": "completed",
      "completed_at": "2026-01-09T08:45:00Z",
      "output_file": "plan-improved-v3-security-contract.md",
      "changes": "Added threat model, invariants, crypto spec"
    },
    {
      "id": "e",
      "name": "Data Contract",
      "description": "Data formats, schemas, versioning",
      "status": "completed",
      "completed_at": "2026-01-09T09:10:00Z",
      "output_file": "plan-improved-v4-data-contract.md",
      "changes": "Added bundle format, versioning rules"
    },
    {
      "id": "f",
      "name": "Failure Modes",
      "description": "UX edge cases and failure scenarios",
      "status": "completed",
      "completed_at": "2026-01-09T09:35:00Z",
      "output_file": "plan-improved-v5-failure-modes.md",
      "changes": "Added error flows, empty states, mobile constraints"
    },
    {
      "id": "g",
      "name": "Performance",
      "description": "Performance budgets and measurement",
      "status": "pending",
      "description": "Set performance targets and measurement approach"
    },
    {
      "id": "h",
      "name": "Test Matrix",
      "description": "Comprehensive testing strategy",
      "status": "pending"
    },
    {
      "id": "i",
      "name": "Refinement 1",
      "description": "Architecture refinement (external AI feedback)",
      "status": "pending"
    },
    {
      "id": "j",
      "name": "Refinement 2",
      "description": "Architecture refinement (external AI feedback)",
      "status": "pending"
    },
    {
      "id": "k",
      "name": "Refinement 3",
      "description": "Architecture refinement (external AI feedback)",
      "status": "pending"
    },
    {
      "id": "l",
      "name": "Beads Conversion",
      "description": "Transform plan into beads",
      "status": "pending"
    }
  ],

  "git_diff_chain": [
    {
      "pass": "b",
      "diff_file": ".beads-planning-diffs/pass-b-spine.diff",
      "applied": true,
      "applied_at": "2026-01-09T07:55:00Z"
    },
    {
      "pass": "c",
      "diff_file": ".beads-planning-diffs/pass-c-reality.diff",
      "applied": true,
      "applied_at": "2026-01-09T08:20:00Z"
    }
  ],

  "metrics": {
    "original_word_count": 2500,
    "current_word_count": 8500,
    "original_sections": 5,
    "current_sections": 12,
    "ambiguity_score_original": "high",
    "ambiguity_score_current": "low",
    "beads_readiness_original": "not_ready",
    "beads_readiness_current": "ready"
  },

  "external_feedback_rounds": 2,

  "ready_for_beads": false,
  "beads_created": false,
  "bead_validation_complete": false
}
```

---

## How It Works

### Initial Invocation

```bash
/beads-friendly-planning docs/plans/my-feature.md
```

**Creates:**
```
.beads-planning-state.json          # State tracking
.beads-planning-backup/             # Backup dir
├── original-plan.md                 # Original plan backup
└── version-backups/                  # Each version
```

### Subsequent Invocations

```bash
/beads-friendly-planning --resume
```

**Reads state file:**
- Current pass: "f" (completed)
- Next pass: "g" (pending)
- Status: "in_progress"

**Continues from where it left off:**
1. Loads current plan version
2. Runs pass "g" (Performance)
3. Produces git-diff changes
4. Asks for review/integration
5. Updates state file

---

## Pass Ordering (The "Lenses")

### Core Passes (Required)

| Pass | Name | Focus | Output |
|------|------|-------|--------|
| a | Analysis | Assess plan state | `plan-analysis-report.md` |
| b | Spine | Structural completeness | `plan-improved-v1-spine.md` |
| c | Reality Check | Codebase alignment | `plan-improved-v2-reality-checked.md` |
| d | Security | Threat model, invariants | `plan-improved-v3-security-contract.md` |
| e | Data Contract | Formats, versioning | `plan-improved-v4-data-contract.md` |
| f | Failure Modes | Edge cases, errors | `plan-improved-v5-failure-modes.md` |
| g | Performance | Budgets, measurement | `plan-improved-v6-performance.md` |
| h | Test Matrix | Testing strategy | `plan-improved-v7-test-matrix.md` |

### Refinement Passes (Repeat Until Steady State)

| Pass | Name | Focus | Output |
|------|------|-------|--------|
| i+ | Refinement N | External AI feedback | `plan-improved-v[N]-refined.md` |

**Repeat passes i+j+k... until:** Suggestions become incremental (steady state)

### Final Pass

| Pass | Name | Focus | Output |
|------|------|-------|--------|
| z | Beads Conversion | Create beads | `.beads/beads.jsonl` |

---

## State Transitions

```
┌──────────────┐
│ Initial Plan │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Pass a:     │
│  Analysis    │ ← Creates baseline metrics
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Pass b:     │
│  Spine       │ ← Produces git-diff
└──────┬───────┘
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────┐      ┌─────────────┐
│ Review   │      │ Apply diff  │
│ changes  │      │ to plan     │
└─────┬────┘      └──────┬──────┘
      │                  │
      │                  ▼
      │         ┌──────────────┐
      │         │ New plan     │
      │         │ version      │
      │         └──────┬───────┘
      │                │
      │                ▼
      │         ┌──────────────┐
      │         │ Update state │
      │         │ file         │
      │         └──────┬───────┘
      │                │
      └────────────────┘
                       │
                       ▼
              ┌──────────────┐
              │ Next pass: c │
              └──────────────┘
                       │
                       ▼
                  (Repeat for all passes)
                       │
                       ▼
              ┌──────────────┐
              │ All passes   │
              │ completed?   │
              └──────┬───────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼ Yes                     ▼ No
┌──────────────┐          ┌──────────────┐
│ Pass z:      │          │ Continue     │
│ Beads        │          │ with passes   │
│ Conversion   │          │ i, j, k...    │
└──────────────┘          └──────────────┘
```

---

## Git-Diff Workflow

### Why Git-Diff Style?

**Problem:** When AI rewrites entire plans:
- ❌ Accidentally drops features
- ❌ Loses details in "summaries"
- ❌ Restructures in confusing ways
- ❌ Truncates due to context limits

**Solution:** Git-diff style changes:
- ✅ Keep 95% of plan intact
- ✅ Only modify what needs improvement
- ✅ Easier to review ("do I agree?")
- ✅ Impossible to silently truncate
- ✅ Safer for CC/Codex to integrate

### Git-Diff Format

Each pass produces a `.diff` file:

```diff
## Security

-We will encrypt the bundle.
+We will encrypt the bundle using authenticated encryption (AEAD).
+
+### Threat Model (V1)
+
+#### We Defend Against
+- Public repo hosting: strangers download bundle and site
+- Offline attacks: attacker brute-forces passwords
+- Tampering: attacker modifies bundle bytes or manifest
+
+### Cryptography Spec (V1)
+- KDF: Argon2id (explicit params in bundle.meta)
+- AEAD: XChaCha20-Poly1305 (or AES-256-GCM)
+- Nonce strategy: random nonce per chunk
```

### Integration Process

```bash
# 1. Pass produces diff
.beads-planning-diffs/pass-d-security.diff

# 2. Review diff
cat .beads-planning-diffs/pass-d-security.diff

# 3. Claude/Codex integrates
cd /root/project
# Apply diff to plan file
# Create new version: plan-improved-v3-security-contract.md

# 4. Verify integrity
wc -l original-plan.md plan-improved-v3-security-contract.md
# Should be larger (only additions, no truncation)

# 5. Update state
echo "Applied pass-d" >> .beads-planning-state.json
```

---

## Commands

### Start New Planning Session

```bash
/beads-friendly-planning docs/plans/my-feature.md
```

Creates state file, starts at pass a.

### Resume Planning Session

```bash
/beads-friendly-planning --resume
```

Reads state file, continues from next pending pass.

### Jump to Specific Pass

```bash
/beads-friendly-planning --pass security
```

Skips to pass d (Security), skips earlier passes.

### Re-run Specific Pass

```bash
/beads-friendly-planning --pass security --rethink
```

Re-runs pass d with fresh AI context.

### Review Current State

```bash
/beads-friendly-planning --status
```

Shows:
- Current pass
- Completed passes
- Remaining passes
- Metrics
- Next actions

### Show Git-Diff Chain

```bash
/beads-friendly-planning --diffs
```

Shows all diffs produced so far.

### Skip to Beads Conversion

```bash
/beads-friendly-planning --convert-to-beads
```

Skips remaining improvement passes, goes directly to beads conversion.

---

## Relationship to plan-to-beads

### plan-to-beads: Mechanical Conversion

**What it does:**
- Parses plan markdown
- Extracts tasks
- Creates beads
- Adds dependencies
- Creates feature branch

**What it doesn't do:**
- ❌ Improve the plan
- ❌ Optimize structure
- ❌ Add missing sections
- ❌ Validate for swarm execution
- ❌ Ensure bead quality

**When to use:**
- Plan is already "great" (all passes complete)
- You just need mechanical conversion

### beads-friendly-planning: Full Transformation

**What it does:**
- ✅ Analyzes plan state
- ✅ Runs 8+ improvement passes
- ✅ Produces git-diff changes
- ✅ Validates each pass
- ✅ Creates beads when ready
- ✅ Validates beads for swarm execution

**When to use:**
- Plan is "good" or "vague"
- You want full transformation
- You want iterative review
- You want to prevent truncation

### How They Complement

```
┌─────────────────────────────────────────────────┐
│  beads-friendly-planning                       │
│  ┌───────────────────────────────────────────┐  │
│  │ Phase 1: Analysis                         │  │
│  │ Phase 2: Multi-Pass Improvement (8+)    │  │
│  │ Phase 3: Beads Conversion                │  │
│  │ Phase 4: Bead Validation                 │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    │
                    │ If you just want conversion
                    ▼
┌─────────────────────────────────────────────────┐
│  plan-to-beads                                  │
│  ┌───────────────────────────────────────────┐  │
│  │ Parse plan                                 │  │
│  │ Extract tasks                              │  │
│  │ Create beads                               │  │
│  │ Add dependencies                           │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Use beads-friendly-planning for:**
- New features
- Complex systems
- Unknown domains
- High-stakes projects

**Use plan-to-beads for:**
- Iterations on existing plans
- Simple, well-defined features
- When plan is already "great"

---

## Example: Complete Workflow

### Session 1 (Day 1)

```bash
# Start planning
/beads-friendly-planning docs/plans/encrypted-export.md

# Output:
# Created .beads-planning-state.json
# Completed passes a-f (6 passes, ~2.5 hours)
# Stopped at pass f (Failure Modes)
# State saved
```

### Session 2 (Day 1, 2 hours later)

```bash
# Resume planning
/beads-friendly-planning --resume

# Output:
# Read state file
# Current pass: f completed
# Next pass: g (Performance)
# Completed pass g
# Completed pass h (Test Matrix)
# Stopped at pass i (Refinement)
# State saved
```

### Session 3 (Day 2)

```bash
# Resume planning
/beads-friendly-planning --resume

# Output:
# Read state file
# Solicited external AI feedback (ChatGPT)
# Completed passes i, j, k (3 refinement passes)
# Reached steady state
# Completed pass z (Beads Conversion)
# Completed validation
# Ready for swarm execution
```

---

## Anti-Truncation Strategy

### How It Prevents Silent Truncation

**Problem:** AI context limits cause silent truncation.

**Solution 1: Git-Diff Only**
```diff
- Only shows additions (+)
- Never shows removals (-) unless explicit
- Impossible to silently drop features
```

**Solution 2: Version Backups**
```bash
.beads-planning-backup/
├── original-plan.md          # Never changes
├── v1-spine.md                # After pass b
├── v2-reality.md              # After pass c
├── v3-security.md             # After pass d
└── ...
```

**Solution 3: Integrity Verification**
```bash
# After each pass, verify:
wc -l plan-improved-v[N].md
# Should be >= plan-improved-v[N-1].md
# Never decreases!
```

**Solution 4: Diff Chain Tracking**
```json
"git_diff_chain": [
  {
    "pass": "d",
    "diff_file": ".beads-planning-diffs/pass-d-security.diff",
    "lines_added": 250,
    "lines_removed": 5,
    "applied": true
  }
]
```

**Solution 5: State File Metrics**
```json
"metrics": {
  "original_word_count": 2500,
  "current_word_count": 8500,
  "original_sections": 5,
  "current_sections": 12
}
```

Never decreases! Always increases or stays same.

---

## External AI Integration

### How to Use Multiple AIs

**Pass 1-8:** Claude Code (Opus 4.5)
- Reads plan
- Applies specific pass focus
- Produces git-diff
- Integrates into plan

**Pass 9+ (Refinement):** GPT Pro (Extended Reasoning)
- Receives plan
- Produces git-diff feedback
- Claude integrates

**Why multiple AIs:**
- Different models catch different things
- Prevents model-specific blindspots
- "Best of all worlds" integration

### Feedback Prompt (for GPT Pro)

```markdown
You are a plan reviewer. I have an implementation plan that has gone through 8 improvement passes.

I want you to carefully review this plan and come up with your best revisions in terms of:
- Better architecture
- New features that should be added
- Changed features that should be modified
- More robust/reliable approaches
- More performant designs
- More compelling/useful features

For each proposed change, provide:
1. Detailed analysis and rationale
2. Git-diff style changes relative to the current plan

Format your response as git-diff changes that can be applied to the plan file.

--- PASTE PLAN BELOW ---
```

---

## State File Recovery

### If State File is Lost

```bash
# Recover from plan file timestamps
ls -lt docs/plans/plan-improved-*.md

# Most recent is likely current state
# Resume from that pass
/beads-friendly-planning --resume --from plan-improved-v5.md
```

### If Plan File is Corrupted

```bash
# Restore from backup
cp .beads-planning-backup/version-backups/plan-improved-v5.md docs/plans/

# Recreate state file
/beads-friendly-planning --rebuild-state docs/plans/plan-improved-v5.md
```

---

## Checklist: Before Swarm Execution

### State File Shows:

```json
{
  "ready_for_beads": true,
  "beads_created": true,
  "bead_validation_complete": true
}
```

### All Passes Completed:

- [ ] Pass a: Analysis
- [ ] Pass b: Spine
- [ ] Pass c: Reality Check
- [ ] Pass d: Security
- [ ] Pass e: Data Contract
- [ ] Pass f: Failure Modes
- [ ] Pass g: Performance
- [ ] Pass h: Test Matrix
- [ ] Pass i-k: Refinement (until steady state)
- [ ] Pass z: Beads Conversion

### Validation Passed:

- [ ] No circular dependencies (`bd dep cycles`)
- [ ] Parallel tracks > 1 (`bv --robot-plan`)
- [ ] Actionable beads exist (`bv --robot-triage`)
- [ ] Beads are right-sized
- [ ] Beads are self-contained
- [ ] Integration beads defined

---

## Summary

**beads-friendly-planning** is the full transformation suite.

**plan-to-beads** is the mechanical converter (used internally by pass z).

**The iterative process:**
1. Start with plan
2. Run passes a-z (as many sessions as needed)
3. Each pass produces git-diff
4. Review and integrate
5. State is tracked automatically
6. Resume anytime
7. Stop when ready (steady state)
8. Convert to beads
9. Validate for swarm

**Total time:** 3-5 hours across multiple sessions (not one context window!)

**Result:** Swarm-ready beads that MAF agents can execute reliably.
