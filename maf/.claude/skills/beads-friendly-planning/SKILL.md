---
name: beads-friendly-planning
description: Improve any implementation plan to make it swarm-executable through iterative improvement passes that can span multiple sessions. Stateful, resumable workflow for systematic plan improvement across multiple hours or days.
---

# Beads-Friendly Planning (Iterative, Stateful)

**Purpose:** Improve any implementation plan to make it swarm-executable through **iterative improvement passes** that can span **multiple sessions**.

**When to Use:** You have an implementation plan (from anywhere) that needs systematic improvement to make it ready for autonomous agent execution. Use before `/plan-to-beads`.

**Key Innovation:** **Stateful, resumable workflow** - not a one-shot transformation. Work on your plan across multiple hours or days, resuming exactly where you left off.

---

## Quick Start

### Start New Planning Session

```bash
/beads-friendly-planning docs/plans/my-feature.md
```

Creates state tracking, starts at pass a (Analysis).

### Resume Existing Session

```bash
/beads-friendly-planning --resume
```

Reads state file, continues from next pending pass.

### Jump to Specific Pass

```bash
/beads-friendly-planning --pass security
```

Skips to security pass (pass d).

---

## How It Works: The Iterative Process

### The Problem This Solves

**Can't make a super good plan in one context window.**

A "swarm-executable plan" requires:
- 8-12 focused passes (lenses)
- 3-5 hours total work
- Multiple AI models (different perspectives)
- Iterative refinement (steady state)
- Git-diff changes (prevents truncation)
- State tracking (resume anytime)

### The Solution: Iterative Passes Through "Lenses"

```
┌─────────────────────────────────────────────────────────────┐
│ Session 1 (Day 1, 2 hours)                                │
│  ├─ Pass a: Analysis          (15 min)                     │
│  ├─ Pass b: Spine             (20 min) → git-diff          │
│  ├─ Pass c: Reality Check     (25 min) → git-diff          │
│  └─ Save state: "stopped at pass c"                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Session 2 (Day 1, 2 hours later)                          │
│  ├─ Load state: "continue from pass c"                    │
│  ├─ Pass d: Security          (25 min) → git-diff          │
│  ├─ Pass e: Data Contract     (25 min) → git-diff          │
│  └─ Save state: "stopped at pass e"                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Session 3 (Day 2, 1 hour)                                 │
│  ├─ Load state: "continue from pass e"                    │
│  ├─ Pass f: Failure Modes     (25 min) → git-diff          │
│  ├─ Pass g: Performance       (25 min) → git-diff          │
│  ├─ Pass h: Test Matrix       (25 min) → git-diff          │
│  └─ Save state: "stopped at pass h"                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Session 4 (Day 2, 1 hour)                                 │
│  ├─ Load state: "continue from pass h"                    │
│  ├─ External AI feedback (GPT Pro)                         │
│  ├─ Pass i: Refinement 1      (20 min) → git-diff          │
│  ├─ Pass j: Refinement 2      (20 min) → git-diff          │
│  ├─ Pass k: Refinement 3      (20 min) → git-diff          │
│  ├─ Pass l: Steady State Check (15 min)                   │
│  ├─ Check: steady state? → YES                           │
│  └─ Save state: "ready for plan-to-beads"                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                       Next Step:
                 /plan-to-beads <plan-file>
                 (separate command)
```

---

## Early-Exit Mechanisms (UPDATED - v2.1.2)

**Prevent Over-Engineering:** Skip unnecessary work for plans that are already good enough.

### What's New in v2.1.3 (Metacognitive Planning Tags)

**Self-aware planning that catches its own mistakes:**

- ✅ **5 metacognitive tags** - Based on proven LLM failure patterns (hallucination, completion drive, etc.)
- ✅ **Tag self-monitoring** - Each pass tags its own uncertainty and assumptions
- ✅ **LCL context flow** - Tags flow between passes via state file without repetition
- ✅ **Verification phase** - Pass L ensures all blocking tags resolved before completion
- ✅ **Prevents planning failures** - Hallucinations, incomplete coverage, assumptions, cargo cult

**The 5 Metacognitive Tags:**

| Tag | LLM Failure Pattern | What It Catches |
|-----|---------------------|-----------------|
| #ASSERTION_UNVERIFIED | Hallucination | Claiming files/features exist without checking |
| #PLANNING_ASSUMPTION | Completion Drive | Filling gaps with assumptions to proceed |
| #PREMATURE_COMPLETE | False Completion | Marking pass complete when coverage is partial |
| #PATTERN_UNJUSTIFIED | Cargo Cult | Adding requirements because "plans always have this" |
| #CLARITY_DEFERRED | Question Suppression | Proceeding despite unclear requirements |

### What's New in v2.1.2 (Edge Case Handling)

**Two critical edge cases addressed:**
- ✅ **Three-state maturity assessment** - Present/Partial/Missing (was binary, caused variance)
- ✅ **Conservative counting** - Partial counts as 0.5 to prevent under-counting
- ✅ **Explicit semantic examples** - Clear criteria for each quality marker
- ✅ **AskUserQuestion fallback** - Auto-continue if tool unavailable
- ✅ **Enhanced critical patterns** - More security patterns detected (auth, encryption, etc.)

### What's New in v2.1

**Critical fixes based on testing:**
- ✅ **LLM-based semantic analysis** - Replaced brittle grep patterns with semantic understanding
- ✅ **Claude-native interaction** - Uses `AskUserQuestion` instead of bash `read`
- ✅ **Backup infrastructure** - Creates `.beads-planning-backup/` directory automatically
- ✅ **State tracking** - Maintains `.beads-planning-state.json` for resume capability
- ✅ **Quality-aware steady state** - Checks for critical additions, not just word count

### Plan Maturity Scan (FIXED v2.1.2 - Three-State Semantic Analysis)

**Before v2.1:** Used grep patterns that missed semantic equivalents (e.g., `VERSIONING_GUIDE.md` ≠ "Data Contract")

**v2.1:** Binary LLM assessment (present/missing) - caused interpretation variance

**v2.1.2:** Three-state LLM assessment (present/partial/missing) with explicit examples and conservative counting

| Marker | Present | Partial (counts as 0.5) | Missing |
|--------|---------|------------------------|---------|
| **Structure** | Goals AND non-goals defined | Goals OR non-goals (one missing) | Neither defined |
| **Workflows** | Step-by-step flows documented | High-level flow without steps | No workflow documentation |
| **Security** | Explicit invariants (MUST NEVER/ALWAYS) | Security mentioned, no invariants | No security discussion |
| **Data** | Formats/schemas explicitly defined | Some formats, not all | No data contracts |
| **Performance** | Specific budgets (p50/p95/p99) | Performance mentioned, no numbers | No performance discussion |
| **Testing** | Comprehensive test matrix | Testing mentioned, no strategy | No testing documentation |
| **Failures** | Edge cases and error modes covered | Some errors, not comprehensive | Only happy path |
| **Acceptance** | Measurable E2E success criteria | Success mentioned, not measurable | No success criteria |

**Conservative Counting (v2.1.2):**
- `present` = 1.0 toward maturity score
- `partial` = 0.5 toward maturity score (prevents under-counting)
- `missing` = 0.0 toward maturity score

**Example:** 4 present + 2 partial = 4 + 1.0 = 5 → 62.5% maturity (would route to TARGETED mode)

**Routing Decision:**
```
Adjusted Maturity = (present + partial/2) / 8 × 100%

87-100% (7-8 markers) → MINIMAL mode
62-86%  (5-6 markers) → TARGETED mode
37-61%  (3-4 markers) → STANDARD mode
0-36%   (0-2 markers) → COMPREHENSIVE mode
```

**Why This Matters:**
- Test on improved plan (12,959 words): Old scan scored 62%, actual quality was ~75%
- VERSIONING_GUIDE.md = valid data contract, but grep missed it
- Semantic analysis catches content quality, not just section titles

### Backup & State Infrastructure (NEW)

**Automatic initialization on skill start:**

```bash
# Backup directory (contains snapshots before each pass)
.beads-planning-backup/
├── original-plan-20260109-143000.md       # Original plan (unchanged)
├── before-pass-b-20260109-143500.md        # Snapshot before Pass B
├── before-pass-c-20260109-144500.md        # Snapshot before Pass C
└── ...

# State file
.beads-planning-state.json
{
  "plan_file": "docs/plans/my-feature.md",
  "current_pass": "d",
  "passes_completed": ["a", "b", "c"],
  "passes_remaining": ["d", "e", "g", "i", "l"],
  "status": "in_progress",
  "metrics": {
    "original_word_count": 12000,
    "current_word_count": 12800,
    "backup_count": 3
  },
  "created_at": "2026-01-09T14:30:00Z",
  "updated_at": "2026-01-09T14:50:00Z"
}
```

**Benefits:**
- **Single Source of Truth:** Original plan file gets improved, no duplicate copies
- **Rollback:** Revert to any previous snapshot: `cp .beads-planning-backup/before-pass-b*.md docs/plans/my-feature.md`
- **Resume:** Continue planning across multiple sessions
- **Integrity:** Word count never decreases (prevents truncation)
- **Git Tracking:** Actual changes visible via git diff

### Routing Based on Maturity

```
┌─────────────────────────────────────────────────────────────────┐
│ Plan Maturity Scan → Determine Scope                            │
├─────────────────────────────────────────────────────────────────┤
│ 87-100% (7-8 markers) → MINIMAL (15-30 min)                     │
│   ✅ Highly mature - quick validation + quality check            │
│   ⏭️  Offer: Skip to plan-to-beads?                             │
│                                                                  │
│ 62-86% (5-6 markers)  → TARGETED (1-2 hours)                    │
│   📋 Moderately mature - targeted passes for gaps               │
│   ⚡ Smart pass selection: skip what's already good              │
│                                                                  │
│ 37-61% (3-4 markers)  → STANDARD (2-3 hours)                    │
│   🔨 Needs work - core passes a-h                               │
│                                                                  │
│ 0-36% (0-2 markers)    → COMPREHENSIVE (3-4 hours)              │
│   🏗️  Major gaps - all passes a-l                               │
└─────────────────────────────────────────────────────────────────┘
```

### Smart Pass Selection (FIXED - Semantic, Not Title-Based)

**Before:** Used grep to check for exact section titles (e.g., `grep "## Data Contract"`)

**After:** Uses LLM assessment results to check content semantically.

| Pass | Skip When (Semantic Check) |
|------|---------------------------|
| b (Spine) | Structure marker present (LLM confirmed) |
| c (Reality) | Constraints documented implicitly (structure OR security present) |
| d (Security) | Invariants explicit (LLM confirmed, even if different format) |
| e (Data) | Formats defined by ANY name (VERSIONING_GUIDE, schemas, etc.) |
| f (Failure) | Edge cases addressed (LLM confirmed) |
| g (Performance) | Budgets specified (LLM confirmed) |
| h (Test) | Tests comprehensive (LLM confirmed) |
| i-k (Refinement) | Maturity ≥75% |
| l (Steady State) | Always run at end |

**Why This Matters:**
- Pass C (Reality Check) ran unnecessarily when constraints were implicit
- Pass E (Data Contract) ran unnecessarily when named VERSIONING_GUIDE
- Semantic checking prevents these false positives

### Mid-Pass Steady State Detection (FIXED - Quality-Aware)

**Before:** Only checked word count (<50 words per pass)

**After:** Also checks for critical additions (MUST NEVER, invariants, security changes)

```
┌─────────────────────────────────────────────────────────────────┐
│ After Each Pass: Check for Steady State                        │
├─────────────────────────────────────────────────────────────────┤
│ IF last 2 passes added <50 words each:                          │
│   AND no critical additions (MUST NEVER, invariants):            │
│   → ✨ Steady state detected!                                   │
│   → Uses AskUserQuestion (Claude-native) for confirmation        │
│                                                                  │
│ Critical additions bypass steady state:                         │
│   - MUST NEVER/MUST ALWAYS statements                           │
│   - Security invariant changes                                  │
│   - New threat model entries                                    │
│                                                                  │
│ Benefit: Save 20-40 minutes without skipping important changes   │
└─────────────────────────────────────────────────────────────────┘
```

**Quality-Aware Check:**
```bash
# Check for critical additions
has_critical_additions=false
if git diff HEAD~1 HEAD | grep -q "MUST NEVER\|MUST ALWAYS\|Invariant"; then
  has_critical_additions=true
fi

# Only trigger steady state if no critical additions
if [ $last_lines -lt 50 ] && [ $prev_lines -lt 50 ] && [ "$has_critical_additions" = "false" ]; then
  # Trigger steady state prompt
fi
```

### Claude-Native Interaction (FIXED)

**Before:** Used bash `read` commands that don't work in Claude Code skills

**After:** Uses `AskUserQuestion` tool for proper Claude Code interaction

```python
# Example: Early-exit confirmation
AskUserQuestion(
    questions=[{
        "question": "This plan is highly mature ($plan_maturity_pct%). Skip to plan-to-beads conversion?",
        "header": "Early-Exit",
        "options": [
            {"label": "Skip to plan-to-beads", "description": "Plan is ready, go directly to beads conversion"},
            {"label": "Continue improvements", "description": "Run minimal improvement passes first"}
        ],
        "multiSelect": False
    }]
)
```

**Benefits:**
- ✅ Works in Claude Code environment
- ✅ Proper UI for user choices
- ✅ Multi-select support for complex decisions
- ✅ Context-aware options

### Auto Mode (Fully Automated)

```bash
/beads-friendly-planning --auto docs/plans/my-feature.md
```

**Auto mode behavior:**
- Runs maturity scan automatically
- Routes to appropriate scope (minimal/targeted/standard/comprehensive)
- Skips passes that aren't needed
- Exits early at steady state
- No interactive prompts (useful for CI/automation)

**Use auto mode when:**
- Running in automated workflows
- You trust the maturity assessment
- You want maximum speed

**Skip auto mode when:**
- You want to review each pass
- You're uncertain about plan quality
- You prefer manual control

---

## Edge Case Handling (NEW - v2.1.2)

**Problem:** Two edge cases identified in production testing that caused inconsistent behavior.

### Edge Case 1: LLM Semantic Interpretation Variance

**Issue:** Binary (present/missing) assessment caused interpretation variance.
- Example: Security marker rated "Partial" instead of "Present" because invariants were in a different format
- Result: Maturity scores varied between LLM calls for the same plan

**Solution (v2.1.2):** Three-state assessment with conservative counting

```json
{
  "markers": {
    "security": {
      "status": "partial",  // Was: present (true/false)
      "evidence": "Invariants mentioned but no explicit MUST NEVER statements"
    }
  },
  "present_count": 4,
  "partial_count": 2,  // NEW: Track partials separately
  "maturity_pct": 62.5,
  "adjusted_maturity_pct": 75.0  // NEW: Conservative count (4 + 2/2 = 5)
}
```

**Benefits:**
- ✅ Consistent scoring across LLM calls
- ✅ Partial content is recognized (not penalized)
- ✅ Conservative routing (better to over-include than under-include)

### Edge Case 2: AskUserQuestion Availability

**Issue:** AskUserQuestion tool not available in all contexts.
- Example: Running skill in non-Claude-Code environment
- Result: Skill hangs waiting for input that never comes

**Solution (v2.1.2):** Try-catch wrapper with auto-continue fallback

```python
def prompt_early_exit(plan_maturity_pct, adjusted_maturity_pct):
    try:
        # Try AskUserQuestion first
        result = AskUserQuestion(...)
        return result
    except Exception as e:
        # Fallback: Auto-continue with recommendation
        log("AskUserQuestion unavailable: {e}")
        log("Auto-continuing with: skip_to_beads")
        return "skip_to_beads"
```

**Fallback Behavior:**
| Scenario | Behavior |
|----------|----------|
| AskUserQuestion available | Interactive prompt (3 options) |
| AskUserQuestion unavailable | Auto-continue with recommended action |
| Auto mode | Always auto-continue (no prompts) |

**Logging:**
```json
{
  "early_exit_decision": "skip_to_beads",
  "decision_method": "auto_continue_fallback",
  "reason": "AskUserQuestion unavailable in this context"
}
```

### Enhanced Critical Pattern Detection (v2.1.2)

**Issue:** Only checking for "MUST NEVER" missed other critical additions.

**Solution:** Expanded critical pattern list

```bash
# v2.1.1: Only 3 patterns
grep -q "MUST NEVER\|MUST ALWAYS\|Invariant"

# v2.1.2: 10+ patterns
grep -qiE "MUST NEVER|MUST ALWAYS|Invariant|security|threat model|authentication|authorization|encryption|validation|sanitization"
```

**Patterns Now Detected:**
- `MUST NEVER` / `MUST ALWAYS` statements
- `Invariant` keywords
- `security` considerations
- `threat model` entries
- `authentication` / `authorization` changes
- `encryption` / cryptography
- `validation` / `sanitization` logic
- `error handling` that must never fail

---

## Metacognitive Planning Tags (NEW - v2.1.3)

**How the skill catches its own planning mistakes.**

### Tag Lifecycle

```
Pass creates tag → Added to state file → Flows via LCL to next pass
→ Later pass resolves tag → Removed from state file
→ Pass L verification: all blocking tags must be resolved
```

### Tag Resolution Strategies

| Tag | Auto-Resolve? | User Input? | Resolution Method |
|-----|---------------|-------------|-------------------|
| #ASSERTION_UNVERIFIED | ✅ Yes (codebase check) | ❌ No | Verify files/features exist |
| #PLANNING_ASSUMPTION | ⚠️ Sometimes (low risk) | ✅ Yes (high risk) | Accept or confirm with user |
| #PREMATURE_COMPLETE | ❌ Never | ❌ No | Must add missing coverage |
| #PATTERN_UNJUSTIFIED | ⚠️ Sometimes (essential) | ✅ Yes (non-essential) | Keep if essential, remove if not |
| #CLARITY_DEFERRED | ❌ Never | ✅ Yes | Always ask user |

### Per-Pass Tag Creation

- **Pass A (Analysis):** Tags unverified claims about existing systems
- **Pass B (Spine):** Tags assumptions about goals/non-goals
- **Pass C (Reality Check):** **Primary resolution** - verifies assertions via codebase checks
- **Passes D-H:** Tags coverage gaps and unverified dependencies
- **Passes I-K:** **Primary clarification** - escalates deferred items to user
- **Pass L:** **Verification phase** - ensures all blocking tags resolved

---

## The 12 Passes (Lenses)

### Core Passes (a-h)

| Pass | Name | Focus | Duration | Output |
|------|------|-------|----------|--------|
| **a** | Analysis | Assess plan state | 15 min | `plan-analysis-report.md` |
| **b** | Spine | Structural completeness | 20 min | Modifies plan via git-diff |
| **c** | Reality Check | Codebase alignment | 25 min | Modifies plan via git-diff |
| **d** | Security | Threat model, invariants | 25 min | Modifies plan via git-diff |
| **e** | Data Contract | Formats, schemas, versioning | 25 min | Modifies plan via git-diff |
| **f** | Failure Modes | Edge cases, errors | 25 min | Modifies plan via git-diff |
| **g** | Performance | Budgets, measurement | 25 min | Modifies plan via git-diff |
| **h** | Test Matrix | Testing strategy | 25 min | Modifies plan via git-diff |

### Refinement Passes (i, j, k, l)

| Pass | Name | Focus | Duration | Output |
|------|------|-------|----------|--------|
| **i** | Refinement 1 | External AI feedback | 20 min | Modifies plan via git-diff |
| **j** | Refinement 2 | Second AI review | 20 min | Modifies plan via git-diff |
| **k** | Refinement 3 | Final polish | 20 min | Modifies plan via git-diff |
| **l** | Steady State Check | Verify ready for beads | 15 min | `plan-steady-state-report.md` |

**Repeat passes i-k until:** Suggestions become incremental (steady state)

---

## Commands Reference

### Start New Planning

```bash
/beads-friendly-planning <plan-file> [supporting-files...]
```

Creates:
- `.beads-planning-state.json` (state tracking)
- `.beads-planning-backup/` (backups)
- `.beads-planning-diffs/` (git-diffs)

### Auto Mode (Fully Automated)

```bash
/beads-friendly-planning --auto <plan-file> [supporting-files...]
```

Auto mode runs all applicable passes without interactive prompts:
- Runs maturity scan automatically
- Routes to appropriate scope
- Skips unnecessary passes
- Exits at steady state
- Useful for CI/automation

### Resume Planning

```bash
/beads-friendly-planning --resume
```

Continues from next pending pass.

### Jump to Pass

```bash
# Jump to specific pass by name
/beads-friendly-planning --pass security

# Jump to specific pass by ID
/beads-friendly-planning --pass d

# Re-run a pass with fresh AI context
/beads-friendly-planning --pass d --rethink
```

### Review Status

```bash
# Show current state
/beads-friendly-planning --status

# Show all git-diffs produced
/beads-friendly-planning --diffs

# Show metrics
/beads-friendly-planning --metrics
```

---

## What Happens During Each Pass

### Pass Workflow

```
1. Load current plan
2. Apply pass-specific "lens"
3. Generate git-diff style changes
4. Present diff for review
5. [User reviews diff]
6. If approved: Integrate into plan
7. Save new plan version
8. Update state file
9. Backup version
```

### Git-Diff Format (Critical!)

**Why git-diff?**
- ✅ Prevents silent truncation
- ✅ Easy to review
- ✅ Impossible to lose features
- ✅ Safer for AI integration

**Example:**
```diff
## Security

-We will encrypt the bundle.
+We will encrypt the bundle using authenticated encryption (AEAD).
+
+### Threat Model (V1)
+- Assume repo and site are public.
+- Prevent plaintext metadata leaks in bundle.meta.
+- Wrong password and tampering must produce the same generic error UI.
+
+### Cryptography Spec
+- KDF: Argon2id (explicit params in bundle.meta)
+- AEAD: XChaCha20-Poly1305
+- Nonce strategy: random per chunk
```

**Only shows what changes. Never silently drops content.**

---

## State Tracking

### State File Location

`.beads-planning-state.json` (in project root)

### What It Tracks

```json
{
  "plan_file": "docs/plans/my-feature.md",
  "current_pass": "f",
  "passes_completed": ["a", "b", "c", "d", "e", "f"],
  "passes_remaining": ["g", "h", "i", "j", "k", "l"],
  "status": "in_progress",
  "ready_for_plan_to_beads": false,
  "metrics": {
    "original_word_count": 2500,
    "current_word_count": 8500
  }
}
```

### Integrity Checks

After each pass, verify:
- ✅ Word count never decreases
- ✅ Section count never decreases
- ✅ No features are silently dropped
- ✅ All changes are in git-diff format

---

## Anti-Truncation Strategy

### Problem: AI Context Limits

AI models have context limits. When processing large plans:
- ❌ They might silently truncate
- ❌ They might "summarize" (lose details)
- ❌ They might rewrite (drop features)

### Solution: Multiple Safeguards

**1. Git-Diff Only**
```
Only produces additions (+ lines)
Never shows removals unless explicit
Impossible to silently drop features
```

**2. Timestamped Backups (Snapshot Before Each Pass)**
```
.beads-planning-backup/
├── original-plan-20260109-143000.md       # Original plan snapshot
├── before-pass-b-20260109-143500.md        # Snapshot before Pass B
├── before-pass-c-20260109-144500.md        # Snapshot before Pass C
└── ...
```

**3. Integrity Verification**
```bash
# After each pass - verify plan file was modified correctly
wc -l $PLAN_FILE
# Should show increased line count (improvements added)
# Backup shows previous state for rollback
```

**4. State Metrics**
```json
"metrics": {
  "original_word_count": 2500,
  "current_word_count": 8500  // Never decreases!
}
```

**5. Diff Chain Tracking**
```json
"git_diff_chain": [
  {
    "pass": "d",
    "lines_added": 250,
    "lines_removed": 5,
    "applied": true
  }
]
```

---

## External AI Integration

### How to Use Multiple AIs

**Passes a-h:** Claude Code (Opus 4.5)
- Internal improvement
- Focused on specific lens
- Produces git-diff

**Passes i+:** GPT Pro (Extended Reasoning)
- External feedback
- Fresh perspective
- Proposes git-diff changes
- Claude integrates them

### Feedback Workflow

```
1. Claude runs passes a-h
2. Plan is much improved
3. Claude prompts GPT Pro:
   "Review this plan and propose git-diff improvements"
4. GPT Pro responds with git-diff
5. Claude integrates git-diff
6. Repeat until steady state
```

---

## Relationship to plan-to-beads

### plan-to-beads

**Purpose:** Mechanical conversion from plan to beads

**What it does:**
- Parses plan markdown
- Extracts tasks
- Creates beads via `bd create`
- Adds dependencies via `bd dep add`
- Creates feature branch

**When to use:**
- Plan is already swarm-executable
- You just need conversion
- One-shot operation

### beads-friendly-planning

**Purpose:** Improve plans to make them swarm-executable

**What it does:**
- Runs 8-12 improvement passes (a-l)
- Each pass produces git-diff
- Iterative, stateful, resumable
- Validates at each step
- Outputs improved plan (markdown)

**What it does NOT do:**
- ❌ Create beads
- ❌ Convert plan to beads
- ❌ Validate beads

**When to use:**
- Plan needs systematic improvement
- Plan is "good" or "vague"
- You want iterative review
- You want to prevent truncation

### How They Relate

```
founder-aware-planning (optional)
│
└─ Creates founder-informed plan
      │
      ▼
beads-friendly-planning
│
└─ Improves plan through passes a-l
      │
      ▼
/plan-to-beads <plan-file>
│
└─ Converts improved plan to beads
      │
      ▼
Swarm execution (MAF agents)
```

**Workflow:**
1. (Optional) `/founder-aware-planning "<project>"` → Creates founder-informed plan
2. `/beads-friendly-planning <plan-file>` → Improves plan through passes a-l
3. `/plan-to-beads <plan-file>` → Converts improved plan to beads
4. Agents execute beads

**Use beads-friendly-planning when:** Plan needs improvement
**Use plan-to-beads when:** Plan is already good enough

---

## Example Sessions

### Session 1: Start Planning

```bash
/beads-friendly-planning docs/plans/encrypted-export.md
```

**Claude:**
```
✅ Created .beads-planning-state.json
✅ Backed up original plan
✅ Starting pass a: Analysis...

[15 minutes later]

✅ Pass a complete: Analysis
   → plan-analysis-report.md

Starting pass b: Spine...

[20 minutes later]

✅ Pass b complete: Spine
   → git-diff produced
   → Review changes:
   ```diff
   ## Goals
   +Clear goal statement added
   +Non-goals defined

   ## User Workflows
   +Step-by-step workflows added
   ```

   → Integrate? [Yes/No]
```

**User:** Yes

**Claude:**
```
✅ Integrated changes to $PLAN_FILE
✅ Created backup: .beads-planning-backup/before-pass-b-20260109-143500.md
✅ Updated state file
✅ Word count: 5877 → 6542 (+665)

Starting pass c: Reality Check...

[25 minutes later]

✅ Pass c complete: Reality Check
   → git-diff produced
   → Review changes:
   ```diff
   ## Constraints
   +Platform constraints added
   +Existing patterns noted

   ## Implementation
   +Reality-checked against bv code
   ```

   → Integrate? [Yes/No/Stop for now]
```

**User:** Stop for now

**Claude:**
```
✅ State saved
✅ Stopped at pass c
✅ Can resume anytime with: /beads-friendly-planning --resume

Progress:
- Passes a-c complete (3 passes, ~1 hour)
- Passes d-l remain (~2.5 hours)

Next: /plan-to-beads docs/plans/encrypted-export.md (after passes complete)
```

### Session 2: Resume Later

```bash
/beads-friendly-planning --resume
```

**Claude:**
```
✅ Loaded state from .beads-planning-state.json
✅ Resuming from pass d (Security)

[25 minutes later]

✅ Pass d complete: Security
   → git-diff produced
   → Review changes:
   ```diff
   +### Threat Model (V1)
   +### Invariants (must never/always happen)
   +### Cryptography Spec
   ```

   → Integrate? [Yes/No]
```

**User:** Yes

**Claude:**
```
✅ Integrated changes to $PLAN_FILE
✅ Created backup: .beads-planning-backup/before-pass-d-20260109-151500.md
✅ Updated state file
✅ Word count: 7542 → 8120 (+578)

Continuing with remaining passes...
```

---

## Success Criteria

### Plan is Ready for plan-to-beads When:

All core passes (a-h) complete:
- [ ] Pass a: Analysis
- [ ] Pass b: Spine
- [ ] Pass c: Reality Check
- [ ] Pass d: Security
- [ ] Pass e: Data Contract
- [ ] Pass f: Failure Modes
- [ ] Pass g: Performance
- [ ] Pass h: Test Matrix

And steady state reached (passes i-k):
- [ ] Pass i: Refinement 1 (external AI feedback)
- [ ] Pass j: Refinement 2 (second AI review)
- [ ] Pass k: Refinement 3 (final polish)
- [ ] Pass l: Steady State Check

And metrics show:
- ✅ Word count increased (not decreased!)
- ✅ All sections present
- ✅ Invariants explicit
- ✅ Interfaces locked
- ✅ E2E acceptance defined
- ✅ Test matrix comprehensive

### After Steady State:

```
✅ All passes a-l complete
✅ Plan is swarm-executable
✅ Ready for: /plan-to-beads <plan-file>
```

### What plan-to-beads Does:

Validation passes:
- ✅ No circular dependencies (`bd dep cycles`)
- ✅ Parallel tracks > 1 (`bv --robot-plan`)
- ✅ Actionable beads exist (`bv --robot-triage`)
- ✅ Beads are right-sized
- ✅ Beads are self-contained
- ✅ File conflicts resolved
- ✅ Integration beads defined

---

## Quick Reference

### Command Summary

| Command | Purpose |
|---------|---------|
| `/beads-friendly-planning <plan>` | Start new planning session |
| `/beads-friendly-planning --resume` | Resume from last pass |
| `/beads-friendly-planning --pass <name>` | Jump to specific pass |
| `/beads-friendly-planning --status` | Show current progress |
| `/beads-friendly-planning --diffs` | Show all git-diffs |

### Pass Names

| ID | Name | Duration | Focus |
|----|------|----------|-------|
| a | Analysis | 15 min | Assess state |
| b | Spine | 20 min | Structure |
| c | Reality Check | 25 min | Codebase |
| d | Security | 25 min | Threat model |
| e | Data Contract | 25 min | Schemas |
| f | Failure Modes | 25 min | Edge cases |
| g | Performance | 25 min | Budgets |
| h | Test Matrix | 25 min | Tests |
| i | Refinement 1 | 20 min | External AI |
| j | Refinement 2 | 20 min | Second AI review |
| k | Refinement 3 | 20 min | Final polish |
| l | Steady State | 15 min | Verify ready |

### Total Time

- **Full improvement:** 3-4 hours (across multiple sessions)
- **Per pass:** 15-25 minutes
- **Can be split:** Across days, hours, whatever works

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1.4 | 2026-01-09 | **VERIFICATION PHASE** - Pass L now runs verify-tags.py to ensure all blocking tags resolved before marking ready |
| 2.1.3 | 2026-01-09 | **METACOGNITIVE TAGS** - Self-aware planning with 5 LLM failure pattern tags, LCL context flow, tag verification phase |
| 2.1.2 | 2026-01-09 | **EDGE CASE HANDLING** - Three-state maturity assessment (present/partial/missing), conservative counting (partial = 0.5), explicit semantic examples for each marker, AskUserQuestion fallback with auto-continue, enhanced critical pattern detection (auth, encryption, etc.) |
| 2.1.1 | 2026-01-09 | **CRITICAL FIXES** - LLM-based semantic analysis (replaces grep), Claude-native interaction (AskUserQuestion), backup infrastructure (.beads-planning-backup/), state tracking (.beads-planning-state.json), quality-aware steady state detection |
| 2.1.0 | 2026-01-09 | Refactored: removed bead conversion, now plan improvement only. Passes a-l (was a-h + z) |
| 2.0.0 | 2026-01-09 | Redesigned as iterative, stateful workflow |
| 1.0.0 | 2026-01-09 | Initial version (one-shot transformation) |

---

**See Also:**
- `STATE_TRACKING.md` - State file schema and workflow details
- `IMPLEMENTATION.md` - Claude's step-by-step instructions
