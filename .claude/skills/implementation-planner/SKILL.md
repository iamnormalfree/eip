---
name: implementation-planner
description: Auto-generates comprehensive implementation plans with zero-context assumption. Analyzes codebase for similar patterns, creates bite-sized tasks with file paths, test instructions, and docs to check. Follows DRY, YAGNI, TDD principles. Auto-activates when user requests implementation plan or describes a complex feature to build.
---

# Implementation Planner

Automatically generates detailed implementation plans following NextNest's template. Assumes engineer has zero codebase context and creates bite-sized tasks with explicit file paths, testing instructions, and rollback plans.

## When to Use This Skill

**Auto-activates when user says:**
- "Create implementation plan for [feature]"
- "I need a detailed plan for [feature]"
- "Write an implementation plan for [feature]"
- "Plan out how to build [feature]"
- "Generate a plan for implementing [feature]"

**Explicit invocation:**
```
Use the implementation-planner skill to create a plan for [feature]
```

**Do NOT activate for:**
- High-level strategy discussions (use brainstorming)
- Quick fixes or single-file changes
- Research or investigation tasks
- User already has a plan written

---

## Core Functionality

### Step 1: Gather Feature Context

**Ask clarifying questions (if details missing):**

```markdown
📋 **Implementation Plan - Clarification Needed**

To create a comprehensive plan, I need to understand:

1. **What problem does this solve?**
   - What's the user pain point?
   - Why build this now?

2. **What's the scope?**
   - Which users/pages affected?
   - Frontend only, or backend too?
   - Any external integrations?

3. **What are success criteria?**
   - How do we know it's done?
   - What should users be able to do?

4. **Any constraints?**
   - Performance requirements?
   - Mobile/desktop support?
   - Accessibility level (WCAG A/AA)?

5. **Similar existing features?**
   - Any components we can reuse?
   - Patterns to follow?

Please provide answers and I'll generate a detailed implementation plan.
```

---

### Step 2: Analyze Codebase for Patterns

**Search for similar implementations:**

```bash
# If feature is "user authentication"
# Search for similar patterns:

# 1. Existing auth patterns
grep -r "authentication\|login\|register" components/ lib/ --include="*.ts" --include="*.tsx" | head -10

# 2. Form patterns (if form-based)
find components/forms -name "*.tsx" | head -5

# 3. API patterns
find app/api -name "route.ts" | grep -i auth

# 4. Test patterns
find tests -name "*.test.ts*" | grep -i auth | head -3

# 5. Runbooks that might help
find docs/runbooks -name "*.md" | xargs grep -l "auth\|form\|API" | head -3
```

**Extract patterns:**
```markdown
Found similar patterns:
- Component: components/forms/RegisterForm.tsx (follow this pattern)
- API: app/api/auth/register/route.ts (similar structure)
- Tests: tests/components/RegisterForm.test.tsx (test pattern)
- Runbook: docs/runbooks/forms/FORMS_ARCHITECTURE_GUIDE.md
```

---

### Step 3: Check CANONICAL_REFERENCES for Tier 1 Files

**Validate if feature touches Tier 1 files:**

```bash
# Check if feature will modify canonical files
grep -i "auth\|form\|calculation" CANONICAL_REFERENCES.md

# If matches found:
# - Note Tier 1 rules in Prerequisites section
# - Add dr-elena-compliance-checker reminder (if calculations)
# - List required test files
```

**Output:**
```markdown
⚠️ This feature touches Tier 1 files:

- lib/contracts/form-contracts.ts (Tier 1)
  - Rule: Update contracts BEFORE implementation
  - Rule: Update all consumers after contract changes
  - Required tests: Update form tests

Prerequisites updated with Tier 1 rules.
```

---

### Step 4: Generate Plan Structure

**Create plan following detailed template:**

```markdown
Generates:

---
status: draft
constraint: [Active constraint from matrix]
can_task: [CAN-### if known, or "TBD"]
complexity: [light|medium|heavy based on scope]
estimated_hours: [Total estimate]
---

# [Feature Name] - Implementation Plan

## Context
[Problem description from user input]
[Why now, user impact]

## Success Criteria
- [ ] [Criterion 1 from user input]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Prerequisites
- [ ] Runbook: [Relevant runbook found in Step 2]
- [ ] CANONICAL_REFERENCES check: [Tier 1 files from Step 3]
- [ ] Dependencies: [Any new packages needed]

## Implementation Tasks

### Phase 1: [Backend/API/Core Logic] (Est: Xh)

#### Task 1: [Specific task from analysis]

**Files to modify:**
- `[exact/path/to/file.ts]` - [what to change]
- `[related/file.tsx]` - [what to change]

**Subtasks:**
- [ ] Write failing test: `tests/[path]/file.test.ts`
  - Test case: [Specific test from similar pattern]
  - Expected behavior: [What should happen]
- [ ] Implement function in `[file.ts]`
  - Add interface to `[contracts file]` (if needed)
  - Follow pattern from: `[similar-file.ts:line]`
  - DRY: Extract shared logic to: `[util-file.ts]`
- [ ] Verify test passes: `npm test -- file.test.ts`
- [ ] Update types if needed: `types/[domain].ts`
- [ ] Commit: "feat: add [feature] to [component]"

**Docs to check:**
- [Runbook from Step 2]
- CANONICAL_REFERENCES.md (if Tier 1)

**Testing:**
- Unit test: `npm test -- file.test.ts` (expect: X/X passing)
- Manual verification: [Steps from similar feature]

**Rollback:**
- Revert commit if test fails
- [Database rollback if needed]

[... more tasks ...]

### Phase 2: [Frontend/UI] (Est: Xh)

[... tasks following same structure ...]

### Phase 3: Integration & Testing (Est: Xh)

[... integration tests, E2E tests, documentation tasks ...]

## Test Coverage Summary
[List all tests to be written]

## Rollback Plan
[Phase-by-phase rollback instructions]

## Definition of Done
- [ ] All tasks marked complete ([x])
- [ ] All tests passing
- [ ] Build succeeds
- [ ] Lint passes
- [ ] Work-log updated
```

---

### Step 5: Estimate Task Complexity

**Calculate time estimates:**

```markdown
Estimation logic:

Simple tasks (<1h):
- Add new component using existing pattern
- Write unit tests for single function
- Update types/interfaces

Medium tasks (1-2h):
- Create new API endpoint
- Implement form with validation
- Write integration tests

Complex tasks (2-4h):
- Multi-step user flow
- Complex state management
- E2E test scenarios
- Database migrations

Phase estimates:
- Phase 1 (Core): Sum of backend tasks
- Phase 2 (UI): Sum of frontend tasks
- Phase 3 (Testing): 30% of Phase 1 + Phase 2

Total: Phase 1 + Phase 2 + Phase 3
```

---

### Step 6: Save Plan File

**Create file in docs/plans/active/:**

```bash
# Generate filename
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
FILENAME="docs/plans/active/${DATE}-${SLUG}-implementation.md"

# Save plan
echo "$PLAN_CONTENT" > "$FILENAME"
```

**Output:**
```markdown
✅ Implementation Plan Created

**File:** docs/plans/active/2025-11-05-user-authentication-implementation.md
**Estimated effort:** 12 hours
**Phases:** 3
**Tasks:** 8
**Tests:** 15

📋 **Next steps:**

1. Review plan:
   - Check file paths are correct
   - Verify patterns match your codebase
   - Adjust time estimates if needed

2. Get alignment:
   - Run: /check-alignment "implement user authentication"
   - Verify CAN task exists
   - Confirm active constraint alignment

3. Start implementation:
   - Say: "What should I work on today?"
   - plan-to-chunks will extract first task
   - Begin with Phase 1, Task 1

**Plan is ready to use!**
```

---

## Integration with NextNest Frameworks

### Works with Constraint System

```markdown
Integrates with:
✅ strategy-alignment-matrix.md (reads active constraint)
✅ Active plans (checks for similar existing plans)
✅ CANONICAL_REFERENCES.md (validates Tier 1 file rules)

Auto-populates plan frontmatter:
constraint: [Active constraint from matrix]
can_task: [Searches backlog, or marks "TBD"]
```

### Follows CLAUDE.md Standards

```markdown
Enforces:
✅ TDD mandate (every task starts with test)
✅ Zero-context assumption (explicit file paths)
✅ Bite-sized tasks (<30 min subtasks)
✅ DRY (points to existing patterns)
✅ YAGNI (only what's in success criteria)
✅ Frequent commits (after each task group)
✅ Plan length <200 lines (splits into phases if needed)
```

### Syncs with PLANNING_TEMPLATES.md

```markdown
Uses: Detailed Implementation Plan template
Format: Matches docs/PLANNING_TEMPLATES.md exactly

Sections included:
- Context & success criteria
- Prerequisites (runbooks, Tier 1 checks)
- Phased tasks with subtasks
- File paths explicit
- Testing instructions
- Rollback plan
- Definition of done
```

### Works with Other Skills

```markdown
Sequential workflow:

1. implementation-planner (this skill)
   → Generates detailed plan

2. constraint-aware-context
   → Validates plan alignment

3. plan-to-chunks
   → Extracts daily tasks from plan

4. [Implementation]

5. evidence-collector
   → Documents completion

6. tier-sync-validator
   → Verifies system health
```

---

## Activation Triggers (Keywords)

**High confidence triggers:**
- "create implementation plan"
- "write implementation plan"
- "generate plan for"
- "detailed plan for"
- "plan out how to build"

**Moderate confidence triggers:**
- "how should I implement"
- "what's the plan for"
- "break down [complex feature]"

**Context triggers:**
- User describes multi-phase feature
- User mentions "zero context" or "assume nothing"
- User asks for file paths and testing strategy

**Anti-triggers (DO NOT activate):**
- Simple questions ("how do I...")
- Single-file changes
- Bug fixes (use systematic-debugging)
- Research tasks

---

## Output Examples

### Example 1: Complete Feature Plan

**User input:**
```
Create implementation plan for user authentication with email/password login
```

**Skill output:**
```markdown
✅ Implementation Plan Created

**File:** docs/plans/active/2025-11-05-user-authentication-implementation.md

---

Generated plan includes:

**Context:**
Users need to authenticate before accessing protected features. Current site has no auth system.

**Success Criteria:**
- [ ] Users can register with email/password
- [ ] Users can log in with credentials
- [ ] Protected routes require authentication
- [ ] JWT tokens persist across sessions

**Phases:**
1. Phase 1: Backend Auth API (4h)
   - Task 1: Create auth database schema
   - Task 2: Implement register endpoint
   - Task 3: Implement login endpoint
   - Task 4: Add JWT middleware

2. Phase 2: Frontend Components (4h)
   - Task 5: Create RegisterForm component
   - Task 6: Create LoginForm component
   - Task 7: Add protected route wrapper

3. Phase 3: Testing & Integration (4h)
   - Task 8: Integration tests
   - Task 9: E2E authentication flow
   - Task 10: Documentation

**Total effort:** 12 hours
**Total tests:** 18 (6 unit + 8 integration + 4 E2E)

**Patterns identified:**
- Similar: components/forms/RegisterForm.tsx
- Similar: app/api/auth/register/route.ts
- Runbook: docs/runbooks/forms/FORMS_ARCHITECTURE_GUIDE.md

**Prerequisites:**
- [ ] Install bcrypt: npm install bcrypt @types/bcrypt
- [ ] Install jsonwebtoken: npm install jsonwebtoken @types/jsonwebtoken
- [ ] CANONICAL_REFERENCES check: None (no Tier 1 files)

---

📋 **Next steps:**

1. Review plan at: docs/plans/active/2025-11-05-user-authentication-implementation.md
2. Run: /check-alignment "implement user authentication"
3. Start work: Say "What should I work on today?"

**Plan ready to execute!**
```

---

### Example 2: Plan with Tier 1 Files

**User input:**
```
Create implementation plan for updating TDSR calculation to use new MAS Notice 632 stress test rates
```

**Skill output:**
```markdown
✅ Implementation Plan Created

**File:** docs/plans/active/2025-11-05-tdsr-stress-test-update-implementation.md

---

⚠️ **Tier 1 File Detected**

This plan modifies:
- lib/calculations/instant-profile.ts (Tier 1)
- lib/calculations/dr-elena-constants.ts (Tier 1)

**Additional requirements:**
- Update dr-elena-mortgage-expert-v2.json FIRST
- Update 3 test files (instant-profile, regulation, scenarios)
- Run dr-elena-compliance-checker before committing
- Follow client-protective rounding rules

---

**Phases:**
1. Phase 1: Update Constants (1h)
   - Task 1: Update JSON source with new MAS rates
   - Task 2: Sync dr-elena-constants.ts

2. Phase 2: Update Calculation (2h)
   - Task 3: Modify instant-profile.ts stress test logic
   - Task 4: Update all 3 required test files

3. Phase 3: Validation (1h)
   - Task 5: Run dr-elena-compliance-checker
   - Task 6: Verify all tests passing
   - Task 7: Update work-log with evidence

**Total effort:** 4 hours
**Total tests:** 12 (updating existing tests)

**CANONICAL_REFERENCES rules:**
- Use DR_ELENA_STRESS_TEST_FLOORS constant
- No hardcoded 4.0% values
- Rounding: Loans DOWN, Payments UP, Funds UP
- Required tests: 3 files must be updated

---

📋 **Next steps:**

1. Review plan (includes all Tier 1 rules)
2. Run: /check-alignment "update TDSR calculation"
3. Start work: Begin with Task 1 (JSON source update)

**Plan ready with Tier 1 compliance!**
```

---

### Example 3: Missing Context - Ask Questions

**User input:**
```
Create implementation plan for improving performance
```

**Skill output:**
```markdown
📋 **Implementation Plan - Need More Details**

"Improving performance" is too broad. I need specifics to create an actionable plan.

**Questions:**

1. **What's slow?**
   - [ ] Page load time
   - [ ] API response time
   - [ ] Database queries
   - [ ] Frontend rendering
   - [ ] Bundle size

2. **Which pages/features?**
   - Specific routes?
   - Specific components?
   - Entire application?

3. **Current metrics?**
   - What's the current performance?
   - What's the target?
   - How measured? (Lighthouse, Core Web Vitals, etc.)

4. **User impact?**
   - How many users affected?
   - Business impact if not fixed?

5. **Constraints?**
   - Deadline?
   - Can we change architecture?
   - Breaking changes allowed?

**Please provide answers, then I'll generate a detailed plan.**

**Example response:**
"Homepage loads in 5s, target is <2s. Lighthouse score 45, need 90+. Main issue is bundle size (800KB). Can optimize images and code-split."
```

---

### Example 4: Plan Too Complex - Suggest Split

**User input:**
```
Create implementation plan for complete user management system with authentication, authorization, user profiles, admin dashboard, and email notifications
```

**Skill output:**
```markdown
⚠️ **Plan Too Complex - Suggest Splitting**

This feature spans multiple domains and would exceed 200 line plan limit.

**Estimated complexity:**
- Authentication: 12h
- Authorization (roles/permissions): 8h
- User profiles: 6h
- Admin dashboard: 10h
- Email notifications: 4h
- **Total: 40 hours** (too large for one plan)

---

**Recommended approach:**

Split into **4 separate plans** following constraint sequence:

**Plan 1: Core Authentication** (12h)
- File: 2025-11-05-user-authentication-implementation.md
- Scope: Register, login, JWT tokens
- Exit criteria: Users can authenticate

**Plan 2: Authorization System** (8h)
- File: 2025-11-06-user-authorization-implementation.md
- Scope: Roles, permissions, route guards
- Prerequisite: Plan 1 complete

**Plan 3: User Profiles** (6h)
- File: 2025-11-07-user-profiles-implementation.md
- Scope: Profile CRUD, avatar upload
- Prerequisite: Plan 1 complete

**Plan 4: Admin Dashboard + Emails** (14h)
- File: 2025-11-08-admin-user-management-implementation.md
- Scope: Admin UI, user management, email notifications
- Prerequisite: Plans 1, 2, 3 complete

---

**Would you like me to:**
1. Create Plan 1 only (authentication)?
2. Create all 4 plan outlines (high-level)?
3. Revise scope to fit one 200-line plan?

**Recommendation:** Start with Plan 1, validate approach, then create subsequent plans.
```

---

## Special Cases

### Case 1: No Similar Patterns Found

```markdown
⚠️ **No Similar Patterns Found**

Searched codebase for patterns similar to "[feature]" but found nothing.

**This means:**
- This is a new pattern for your codebase
- No existing code to copy
- Will need to design from scratch

**Recommendations:**

1. **Create runbook first:**
   - File: docs/runbooks/[domain]/[feature]-guide.md
   - Document pattern, architecture, testing approach
   - Get review/approval before implementation

2. **Use external references:**
   - Next.js docs for similar patterns
   - Shadcn/ui for component patterns
   - Supabase docs for backend patterns

3. **Start with prototype:**
   - Build minimal version first
   - Validate approach
   - Then create full implementation plan

**Would you like me to:**
- Create runbook outline first?
- Generate plan anyway (with external patterns)?
- Suggest similar open-source examples?
```

---

### Case 2: Conflicts with Existing Plans

```markdown
⚠️ **Conflict with Existing Plan**

Found existing plan for similar feature:
- File: docs/plans/active/2025-10-31-user-authentication-plan.md
- Status: active
- Progress: 60% complete

**Conflict:**
Your requested plan overlaps with existing work.

**Options:**

1. **Update existing plan:**
   - Add your new requirements to existing plan
   - Continue with same plan file
   - Avoids plan proliferation

2. **Create Phase 2 plan:**
   - File: 2025-11-05-user-authentication-phase2-implementation.md
   - Builds on completed Phase 1
   - References original plan

3. **Replace existing plan:**
   - Archive old plan
   - Create new comprehensive plan
   - Use if scope changed significantly

**Recommendation:** Update existing plan (avoid proliferation per CLAUDE.md)

**Would you like me to:**
- Read existing plan and suggest updates?
- Create Phase 2 plan (if Phase 1 complete)?
- Explain plan proliferation rules?
```

---

## Error Handling

### Error 1: Cannot Determine Active Constraint

```markdown
❌ **Cannot determine active constraint**

**Problem:** No constraint marked 🟡 in strategy-alignment-matrix.md

**Impact:** Plan's "constraint" field is TBD

**Action:**
1. Run: /constraint-status
2. Activate appropriate constraint
3. Re-run plan generation

**Plan created anyway** with constraint: TBD
(Update manually after activating constraint)
```

---

### Error 2: Codebase Pattern Search Failed

```markdown
⚠️ **Pattern search incomplete**

**Problem:** Could not search codebase (file access error)

**Generated plan anyway** with:
- Generic file paths (you'll need to verify)
- Standard patterns (may not match your codebase)
- Common testing approaches

**Action:**
1. Review plan carefully
2. Update file paths manually
3. Verify patterns match your codebase
4. Check similar existing code yourself

**Plan saved to:** docs/plans/active/[filename].md
```

---

## Best Practices

### When to Use This Skill

**✅ Good for:**
- Multi-phase features (8+ hours)
- New engineers joining team
- Complex features needing documentation
- Features touching multiple domains
- When you want explicit file paths

**❌ Not good for:**
- Quick bug fixes (<1 hour)
- Single-file changes
- Exploratory work
- Refactoring without new features

### Plan Quality Tips

**For best results, provide:**
- Clear problem statement
- Success criteria (measurable)
- Scope boundaries (what's included/excluded)
- Performance/accessibility requirements
- Reference to similar existing features

**Example good input:**
```
Create implementation plan for email notification system.

Problem: Users miss important updates (form submissions, approvals).
Success: Users receive emails within 5 min of events.
Scope: 3 event types (submission, approval, rejection).
Tech: Use Resend API (already integrated).
Similar: We have SMS notifications (reference that pattern).
```

---

## Performance

**Execution time:** ~30-60 seconds
- Codebase search: 10-15s
- Pattern analysis: 10-15s
- Plan generation: 10-20s
- File writing: 2-5s

**Context usage:** ~2000-3000 tokens
- Template
- Codebase patterns
- Tier 1 rules
- Generated plan

**Output:** Complete 150-200 line plan file ready to use

---

## Version

**Skill Version:** 1.0
**Created:** 2025-11-05
**Updated:** 2025-11-05
**Integrates With:** PLANNING_TEMPLATES.md, CANONICAL_REFERENCES.md, strategy-alignment-matrix, plan-to-chunks, constraint-aware-context
**Generates:** Detailed implementation plans with zero-context assumption
**Output Format:** docs/plans/active/{date}-{slug}-implementation.md
