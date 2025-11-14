---
name: can-task-linker
description: Automatically generates commit messages with full traceability from changed files to CAN tasks. Traces file → CANONICAL_REFERENCES → plan → CAN task → constraint. Auto-activates when user mentions committing or preparing to commit changes.
---

# CAN Task Linker

Automates commit message generation with complete traceability through the NextNest constraint system. This skill traces every code change back to its CAN task and constraint, ensuring audit trail compliance and fractal alignment.

## When to Use This Skill

**Auto-activates when user says:**
- "Ready to commit"
- "Need commit message"
- "Let's commit these changes"
- "Preparing to commit"
- "Going to commit"
- "Time to commit"
- "Should I commit"
- "Committing now"

**Explicit invocation:**
```
Use the can-task-linker skill to generate commit message
```

**Do NOT activate for:**
- Already created commits (check `git log`)
- User just asking about commit workflow
- Planning to commit in future
- Asking how to write commit messages (that's documentation)

---

## Core Functionality

### Step 1: Gather Git Context

**Auto-detection logic:**

```bash
# Get current branch
git branch --show-current

# Get staged changes
git diff --cached --name-only

# Get unstaged changes
git status --short

# Get diff stats
git diff --cached --stat

# Recent commits (for message style)
git log -3 --oneline
```

**Output:**
```markdown
📋 Git Context Detected:

Branch: fix-chat-persistence-race
Staged files: 2
- hooks/useChatwootConversation.ts (+12, -5)
- tests/hooks/useChatwootConversation.test.ts (+22, -0)

Unstaged files: None

Recent commit style:
- "fix: remove premature ai_broker_name setting"
- "feat: add env vars diagnostic endpoint"
- "chore: trigger Railway redeploy"
```

---

### Step 2: Trace Files to Tier 1 Status

**Check CANONICAL_REFERENCES.md:**

```bash
# For each changed file, check if it's Tier 1
grep -A 10 "useChatwootConversation" CANONICAL_REFERENCES.md

# Determine tier:
# - Listed in CANONICAL_REFERENCES.md → Tier 1 (canonical truth)
# - In docs/runbooks/ → Tier 2 (implementation guides)
# - In docs/plans/ → Tier 3 (temporary decisions)
# - Not listed → Regular code file
```

**Example:**
```markdown
📊 Tier Analysis:

Tier 1 (Canonical):
- None (these are not Tier 1 files per CANONICAL_REFERENCES.md)

Regular Code:
- hooks/useChatwootConversation.ts (chat integration hook)
- tests/hooks/useChatwootConversation.test.ts (test coverage)

Tier Rules Applied:
- No Tier 1 changes → No special restrictions
- Test file included → Follows CLAUDE.md TDD mandate ✅
```

---

### Step 3: Find Related Active Plan

**Search active plans for file mentions:**

```bash
# Search all active plans for changed file names
grep -l "useChatwootConversation" docs/plans/active/*.md

# If found: Extract plan filename and CAN task
# If not found: Search for broader context (hooks/, chat, Chatwoot, etc.)
```

**Example search logic:**

```markdown
Search 1: Exact filename match
→ grep -l "useChatwootConversation" docs/plans/active/*.md
→ Found: 2025-11-03-unified-chat-hook-phase3-testing.md

Search 2: If not found, search for directory
→ grep -l "hooks/" docs/plans/active/*.md

Search 3: If not found, search for feature keywords
→ grep -l -E "(chat|Chatwoot|message)" docs/plans/active/*.md

Search 4: If still not found
→ Mark as "None" and suggest creating plan
```

**Output:**
```markdown
🗂️ Active Plan Detected:

Plan: 2025-11-03-unified-chat-hook-phase3-testing.md

Excerpt:
---
CAN Task: CAN-053
Constraint: A – Public Surface Readiness
---

Phase 2: Component Integration
- Update useChatwootConversation hook ✅
- Add integration tests ✅

Plan Status: Phase 2 complete, Phase 3 pending
```

---

### Step 4: Extract CAN Task and Constraint

**Parse plan frontmatter or body:**

```markdown
# From plan file:
---
CAN Task: CAN-053
Constraint: A – Public Surface Readiness
---

# Or from body:
**CAN Task:** CAN-053
**Constraint:** A – Public Surface Readiness
```

**Validation:**

```bash
# Verify CAN task format
CAN-053 → Valid (CAN-XXX pattern)
CAN-1 → Valid
CAN-ABC → Invalid (suggest correction)

# Verify constraint
A, B, C, D → Valid
C1 → Valid (sub-constraint)
Other → Invalid
```

**Output:**
```markdown
🔗 Traceability Chain:

File Changes:
→ hooks/useChatwootConversation.ts
→ tests/hooks/useChatwootConversation.test.ts

Active Plan:
→ 2025-11-03-unified-chat-hook-phase3-testing.md

CAN Task:
→ CAN-053

Constraint:
→ A – Public Surface Readiness

✅ Full traceability established
```

---

### Step 5: Determine Commit Type

**Analyze changes to determine conventional commit type:**

```markdown
Patterns:

feat: New feature additions
- New functions added
- New components created
- New capabilities introduced

fix: Bug fixes
- Error corrections
- Race condition fixes
- Crash fixes

refactor: Code improvements (no behavior change)
- Code reorganization
- Extract functions
- Rename variables

test: Test additions/updates
- New tests
- Test improvements
- Test refactoring

chore: Maintenance tasks
- Dependency updates
- Config changes
- Build script updates

docs: Documentation only
- README updates
- Comment additions
- Runbook changes

style: Code style changes
- Formatting
- Linting fixes
- No logic changes
```

**Auto-detection:**

```bash
# If test files only → test:
# If only comments/docs → docs:
# If bug mentioned in plan → fix:
# If new function/component → feat:
# If code reorganization → refactor:
# If deps/config → chore:
```

**Example:**
```markdown
📝 Commit Type Analysis:

Changed Files:
- hooks/useChatwootConversation.ts (+12, -5) → Logic changes
- tests/hooks/useChatwootConversation.test.ts (+22, -0) → New tests

Plan Context:
"Phase 2: Fix race condition in chat persistence"

Keywords Found:
- "fix" (in plan title)
- "race condition" (bug pattern)

Determined Type: fix
```

---

### Step 6: Generate Commit Message

**Template follows CLAUDE.md standards:**

```markdown
Format:
<type>: <concise summary (1-2 sentences)>

[optional body with details]

Traceability:
- CAN Task: CAN-XXX
- Constraint: [X] – [Name]
- Plan: [filename]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Generation rules:**

```markdown
Summary line:
- Start with type: fix, feat, refactor, test, chore, docs, style
- Concise: <50 chars preferred, <72 chars max
- Describe WHAT changed and WHY, not HOW
- Present tense: "fix race condition" not "fixed race condition"
- No period at end

Body (optional, add if needed):
- More detail on what changed
- Why the change was needed
- Any side effects or considerations

Traceability (always):
- CAN Task from plan (or "None" if truly minor)
- Constraint from plan
- Plan filename for reference

Footer (always):
- Claude Code generation notice
- Co-authored-by Claude
```

**Example output:**

```markdown
✅ Generated Commit Message:

---
fix: await initial message load in useChatwootConversation to prevent hydration race

Updated hook to wait for initial API response before starting polling interval.
This prevents React hydration mismatches when component mounts before data loads.

Traceability:
- CAN Task: CAN-053
- Constraint: A – Public Surface Readiness
- Plan: 2025-11-03-unified-chat-hook-phase3-testing.md

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
---

📋 Ready to commit with:
git commit -m "$(cat <<'EOF'
fix: await initial message load in useChatwootConversation to prevent hydration race

Updated hook to wait for initial API response before starting polling interval.
This prevents React hydration mismatches when component mounts before data loads.

Traceability:
- CAN Task: CAN-053
- Constraint: A – Public Surface Readiness
- Plan: 2025-11-03-unified-chat-hook-phase3-testing.md

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Integration with NextNest Frameworks

### Works with Constraint System

```markdown
Reads active constraint from:
- docs/plans/re-strategy/strategy-alignment-matrix.md (🟡 indicator)
- docs/plans/active/*.md (plan frontmatter)

Ensures every commit:
✅ Links to CAN task
✅ Links to constraint
✅ Links to active plan (or marks as "None (minor fix)")

Provides audit trail for fractal alignment
```

### Follows CLAUDE.md Git Standards

```markdown
Complies with CLAUDE.md git workflow:
✅ Commit message format (conventional commits)
✅ HEREDOC for multi-line messages
✅ Co-Authored-By: Claude footer
✅ Generated with Claude Code notice
✅ Links to traceability chain

Never bypasses pre-commit hooks
```

### Integrates with CANONICAL_REFERENCES

```markdown
Checks if changed files are Tier 1:
- If Tier 1 → Note in commit message
- If Tier 1 → Ensure tests updated
- If Tier 1 → Check dr-elena-compliance-checker for calculations

Example:
"Modified Tier 1 file: lib/calculations/instant-profile.ts
Dr Elena v2 compliance verified ✅"
```

### Syncs with Active Plans

```markdown
Searches docs/plans/active/*.md for:
- File mentions (exact filename)
- Feature keywords (chat, form, calculator)
- CAN task numbers

If plan found:
→ Extract CAN task
→ Extract constraint
→ Include in commit message

If no plan found:
→ Mark as "None (minor fix)"
→ Suggest creating plan if substantial work
```

---

## Activation Triggers (Keywords)

**High confidence triggers:**
- "ready to commit"
- "commit message"
- "committing"
- "let's commit"
- "time to commit"

**Moderate confidence triggers:**
- "should i commit"
- "commit this"
- "git commit"
- "preparing commit"

**Anti-triggers (DO NOT activate):**
- "how do i commit" (that's asking for help)
- "commit workflow" (that's documentation)
- "will commit later" (future tense)
- Already committed (check git log)

---

## Output Examples

### Example 1: Standard Feature Commit

```markdown
✅ CAN Task Linker - Commit Message Generated

**Git Context:**
Branch: feat-chat-widget-integration
Staged: 3 files (+87, -23)

**Traceability Chain:**
File: components/ai-broker/MobileAIAssistantCompact.tsx
Plan: 2025-11-03-unified-chat-hook-phase3-testing.md
CAN Task: CAN-053
Constraint: A – Public Surface Readiness

**Commit Type:** feat (new capability)

---

**Generated Message:**

```
feat: integrate Chatwoot widget with mobile AI assistant

Added ChatwootWidget loader to mobile assistant for seamless broker handoff.
Widget appears after form completion with user context pre-populated.

Traceability:
- CAN Task: CAN-053
- Constraint: A – Public Surface Readiness
- Plan: 2025-11-03-unified-chat-hook-phase3-testing.md

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**To commit, run:**

```bash
git commit -m "$(cat <<'EOF'
feat: integrate Chatwoot widget with mobile AI assistant

Added ChatwootWidget loader to mobile assistant for seamless broker handoff.
Widget appears after form completion with user context pre-populated.

Traceability:
- CAN Task: CAN-053
- Constraint: A – Public Surface Readiness
- Plan: 2025-11-03-unified-chat-hook-phase3-testing.md

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
```

### Example 2: Bug Fix Commit

```markdown
✅ CAN Task Linker - Commit Message Generated

**Git Context:**
Branch: fix-tdsr-calculation-rounding
Staged: 2 files (+8, -3)

**Traceability Chain:**
File: lib/calculations/instant-profile.ts (Tier 1 ⚠️)
Plan: 2025-11-04-dr-elena-v2-rounding-compliance.md
CAN Task: CAN-037
Constraint: A – Public Surface Readiness

**Tier 1 File Detected:**
- lib/calculations/instant-profile.ts
- Dr Elena v2 compliance verified ✅
- All tests passing ✅

**Commit Type:** fix (bug correction)

---

**Generated Message:**

```
fix: correct TDSR rounding to use Math.ceil per Dr Elena v2

Changed loan payment rounding from Math.floor to Math.ceil for client-protective
calculation. Ensures monthly payment estimates are conservative per MAS Notice 632.

Modified Tier 1 file: lib/calculations/instant-profile.ts
Dr Elena v2 compliance verified ✅

Traceability:
- CAN Task: CAN-037
- Constraint: A – Public Surface Readiness
- Plan: 2025-11-04-dr-elena-v2-rounding-compliance.md

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**To commit, run:**

```bash
git commit -m "$(cat <<'EOF'
fix: correct TDSR rounding to use Math.ceil per Dr Elena v2

Changed loan payment rounding from Math.floor to Math.ceil for client-protective
calculation. Ensures monthly payment estimates are conservative per MAS Notice 632.

Modified Tier 1 file: lib/calculations/instant-profile.ts
Dr Elena v2 compliance verified ✅

Traceability:
- CAN Task: CAN-037
- Constraint: A – Public Surface Readiness
- Plan: 2025-11-04-dr-elena-v2-rounding-compliance.md

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
```

### Example 3: Minor Fix (No CAN Task)

```markdown
✅ CAN Task Linker - Commit Message Generated

**Git Context:**
Branch: main
Staged: 1 file (+2, -2)

**Traceability Chain:**
File: components/landing/HeroSection.tsx
Plan: None found (typo fix)
CAN Task: None (minor fix)
Constraint: None (cosmetic change)

**Analysis:**
Changed files: 1
Lines changed: 4
Change type: Typo correction
Substantial work: No

**Commit Type:** fix (minor correction)

---

**Generated Message:**

```
fix: correct typo in hero section headline

Changed "mortage" to "mortgage" in hero section copy.

Traceability:
- CAN Task: None (minor fix)
- Constraint: None (cosmetic)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**To commit, run:**

```bash
git commit -m "$(cat <<'EOF'
fix: correct typo in hero section headline

Changed "mortage" to "mortgage" in hero section copy.

Traceability:
- CAN Task: None (minor fix)
- Constraint: None (cosmetic)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
```

### Example 4: Multiple CAN Tasks

```markdown
✅ CAN Task Linker - Commit Message Generated

**Git Context:**
Branch: refactor-form-architecture
Staged: 8 files (+234, -156)

**Traceability Chain:**
Files touch multiple features:
- Form components (CAN-037)
- Calculator integration (CAN-052)
- Chat handoff (CAN-053)

Plans affected:
- 2025-11-02-form-validation-refactor.md (CAN-037)
- 2025-10-22-ai-broker-sla-measurement.md (CAN-052)
- 2025-11-03-unified-chat-hook-phase3-testing.md (CAN-053)

**Constraint:** A – Public Surface Readiness (common to all)

⚠️ Multi-CAN Task Commit

**Commit Type:** refactor (architectural change)

---

**Generated Message:**

```
refactor: extract form validation to shared schema

Centralized form validation logic using Zod schemas for reuse across
progressive form, calculator, and chat handoff. Reduces duplication
and ensures consistent validation across features.

Affects multiple features:
- Form validation (CAN-037)
- Calculator integration (CAN-052)
- Chat handoff (CAN-053)

Traceability:
- CAN Tasks: CAN-037, CAN-052, CAN-053
- Constraint: A – Public Surface Readiness
- Plans: form-validation-refactor, ai-broker-sla-measurement, unified-chat-hook

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**To commit, run:**

```bash
git commit -m "$(cat <<'EOF'
refactor: extract form validation to shared schema

Centralized form validation logic using Zod schemas for reuse across
progressive form, calculator, and chat handoff. Reduces duplication
and ensures consistent validation across features.

Affects multiple features:
- Form validation (CAN-037)
- Calculator integration (CAN-052)
- Chat handoff (CAN-053)

Traceability:
- CAN Tasks: CAN-037, CAN-052, CAN-053
- Constraint: A – Public Surface Readiness
- Plans: form-validation-refactor, ai-broker-sla-measurement, unified-chat-hook

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```
```

### Example 5: No Staged Changes

```markdown
⚠️ CAN Task Linker - No Changes to Commit

**Git Status:**
Staged files: 0
Unstaged changes: 3 files

**Problem:** No files staged for commit

**Action Required:**

Stage your changes first:
```bash
git add <files>
```

Or stage all changes:
```bash
git add .
```

Then re-run this skill or ask for commit message.

---

**Alternative:** Generate commit message for unstaged changes?

If you want to commit all unstaged changes, I can:
1. Show what would be committed
2. Generate commit message
3. Provide `git add . && git commit` command

Proceed? (yes/no)
```

---

## Special Cases

### Case 1: Constraint Mismatch

```markdown
🚨 CONSTRAINT MISMATCH DETECTED

**Changed Files:**
- lib/calculations/refinance-optimizer.ts

**Plan Found:**
- 2025-10-22-ai-broker-sla-measurement.md

**Plan Constraint:** B – Data In, Data Approved

**Active Constraint:** A – Public Surface Readiness (from matrix)

---

⚠️ You're working on Constraint B while Constraint A is active

**Options:**

1. **Stop and realign:**
   - Run /constraint-status to check current focus
   - Defer this work until Constraint A complete
   - Focus on CAN-053 (Constraint A work)

2. **Authorized exception:**
   - Confirm with Brent this is intentional
   - Note exception in commit message
   - Proceed with commit

3. **Update constraint:**
   - If Constraint A is actually complete
   - Update strategy-alignment-matrix.md
   - Then proceed with commit

**Recommendation:** Run /constraint-status before committing

Proceed anyway? (yes/no)
```

### Case 2: Missing Tests

```markdown
⚠️ MISSING TEST COVERAGE

**Changed Files:**
- hooks/useFormValidation.ts (+89, -0) [NEW FILE]
- components/forms/ValidationDisplay.tsx (+45, -12)

**Test Files Changed:** None

**Problem:** Code changes without test updates

**CLAUDE.md TDD Mandate:** All code changes require tests

---

**Required Actions:**

1. Write tests for new hook:
   - tests/hooks/useFormValidation.test.ts

2. Update existing tests:
   - tests/components/forms/ValidationDisplay.test.tsx

**Status:** ❌ BLOCKED - Add tests before committing

**After adding tests:**
- Stage test files: `git add tests/`
- Re-run can-task-linker for commit message

---

**Reminder:** TDD workflow (CLAUDE.md):
1. Write failing test
2. Implement code
3. Run test (should pass)
4. Commit code + tests together
```

### Case 3: Large Commit (Multiple Features)

```markdown
⚠️ LARGE COMMIT DETECTED

**Staged Files:** 23 files (+1,245, -678)

**Analysis:**
- Multiple features changed
- 1,200+ lines modified
- Affects: forms, calculations, chat, analytics

**Problem:** Commit too large for meaningful code review

**Recommendation:** Split into smaller, focused commits

---

**Suggested Split:**

Commit 1: Form validation refactor (8 files)
```bash
git reset
git add components/forms/* lib/contracts/form-contracts.ts
# Generate commit message for form changes
```

Commit 2: Calculator updates (5 files)
```bash
git add lib/calculations/* tests/calculations/*
# Generate commit message for calculator changes
```

Commit 3: Chat integration (7 files)
```bash
git add hooks/useChatwoot* components/ai-broker/*
# Generate commit message for chat changes
```

Commit 4: Analytics tracking (3 files)
```bash
git add lib/analytics/* app/api/analytics/*
# Generate commit message for analytics changes
```

---

**Benefits of splitting:**
- ✅ Easier code review
- ✅ Clear change history
- ✅ Easier rollback if needed
- ✅ Better CAN task traceability

Proceed with split? (yes/no)
```

---

## Error Handling

### Error 1: No Git Repository

```markdown
❌ Cannot generate commit message

**Error:** Not a git repository

**Expected:** .git directory in project root

**Action:** Initialize git repository first:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then stage your changes and re-run this skill.
```

### Error 2: Cannot Find Active Plans

```markdown
⚠️ Cannot determine CAN task

**Searched:** docs/plans/active/*.md

**Files searched:** 8 plans

**Changed files:** hooks/useNewFeature.ts

**Problem:** No plan references this file or feature

---

**Options:**

1. **Minor fix (no plan needed):**
   - Commit with: "CAN Task: None (minor fix)"
   - Acceptable for: typos, comments, small tweaks

2. **Substantial work (plan needed):**
   - Create plan in docs/plans/active/
   - Link to CAN task in backlog
   - Then re-run this skill

3. **Update existing plan:**
   - Add this file to relevant plan
   - Then re-run this skill

**Recommendation:**

If this is >20 lines of new code → Create plan
If this is <20 lines or trivial → Proceed with "None (minor fix)"

Proceed? (yes/no)
```

### Error 3: Invalid CAN Task Format

```markdown
⚠️ INVALID CAN TASK FORMAT

**Found in plan:** CAN-ABC-123

**Expected format:** CAN-### (e.g., CAN-053, CAN-1)

**Plan:** 2025-11-04-feature-plan.md

**Problem:** CAN task should be numeric only

---

**Action:** Update plan with correct CAN task format

**Examples:**
- ✅ CAN-053
- ✅ CAN-1
- ✅ CAN-142
- ❌ CAN-ABC
- ❌ CAN-1A
- ❌ CAN_053

**After fixing plan:**
Re-run can-task-linker to generate commit message

**Alternatively:**
Proceed with "None" if this work has no CAN task
```

---

## Best Practices

### When to Run This Skill

**✅ Good times:**
- After finishing feature/fix
- Before running `git commit`
- When ready to commit staged changes
- After all tests passing

**❌ Bad times:**
- Work still in progress
- Tests not written yet
- Before staging files
- Just exploring what to commit

### Commit Message Quality

**Good commit messages:**
- ✅ Concise summary (<50 chars)
- ✅ Explain WHY, not HOW
- ✅ Full traceability (CAN task, constraint, plan)
- ✅ Present tense
- ✅ Specific about changes

**Bad commit messages:**
- ❌ "updated files"
- ❌ "fixes stuff"
- ❌ "WIP"
- ❌ No traceability
- ❌ Too vague

### Integration Flow

**Recommended workflow:**

```markdown
1. /check-alignment [work] → Before starting
2. [Implement + test] → TDD cycle
3. git add <files> → Stage changes
4. can-task-linker → Auto-generates commit message (this skill)
5. git commit -m "..." → Use generated message
6. evidence-collector → Auto-generates work-log entry
7. Paste to docs/work-log.md → Document completion
```

---

## Performance

**Execution time:** ~8-12 seconds
- Git commands: 2-3s
- Plan searching: 2-3s
- Traceability analysis: 2-3s
- Message generation: 1-2s

**Context usage:** ~600-900 tokens
- Git status parsing
- Plan content searching
- Commit message templating

**Optimization:** Caches recent plan lookups to avoid repeated searches

---

## Version

**Skill Version:** 1.0
**Created:** 2025-11-04
**Updated:** 2025-11-04
**Integrates With:** CLAUDE.md git workflow, CANONICAL_REFERENCES, strategy-alignment-matrix, active plans, evidence-collector
**Commit Format:** Conventional commits with full CAN task traceability
**Output:** Ready-to-use git commit command with HEREDOC format
