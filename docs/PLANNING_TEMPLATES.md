<!-- ABOUTME: EIP-specific planning templates for AI content generation framework -->
<!-- EIP templates, optimized for Educational IP system development -->

# EIP Planning Templates

This document provides standardized templates for planning, tracking, and completing work in the EIP (Educational-IP Content Runtime) system. All templates follow the EIP tier system: Strategy → Phases → Implementation → Code → Tests → Evidence.

> **Reference:** EIP framework for AI content generation quality.

---

## Plan Template

**File naming:** `docs/plans/active/{date}-{feature-slug}.md`

**Maximum length:** 200 lines (if longer, split into multiple plans OR extract to runbook)

### Two Plan Types

**1. Decision Plan (High-Level Strategy)**
- Used for: Architectural decisions, feature exploration, research
- Contains: WHAT to build, WHY, high-level approach
- Length: 50-100 lines

**2. Implementation Plan (Detailed Execution)**
- Used for: Actual coding work with zero-context engineer assumption
- Contains: Bite-sized tasks, file paths, test instructions, docs to check
- Length: 100-200 lines
- **This is what plan-to-chunks uses for daily work**

---

### Basic Structure (Decision Plan)

```yaml
---
status: draft | active | completed
complexity: light | medium | heavy
estimated_hours: X
---

# Feature Name

## Problem (2-3 sentences)
What are we solving?

## Success Criteria (3-5 measurable outcomes)
- Outcome 1
- Outcome 2

## Tasks (5-15 tasks, each <2h)
- [ ] Task 1 (test file, doc link if needed)
- [ ] Task 2

## Testing Strategy
Unit/Integration/E2E: which files

## Rollback Plan
How to undo if it fails
```

---

### Detailed Structure (Implementation Plan)

**Use this format for actual coding work. Assume engineer has zero codebase context.**

```yaml
---
status: active
constraint: A | B | C | D
can_task: CAN-###
complexity: medium
estimated_hours: 12
---

# Feature Name - Implementation Plan

## Context (3-4 sentences)
What problem does this solve? Why now? What's the user impact?

## Success Criteria (Measurable)
- [ ] Criterion 1 (how to verify)
- [ ] Criterion 2 (how to verify)

## Prerequisites
- [ ] Runbook: docs/runbooks/{domain}/{guide}.md (read this first)
- [ ] CANONICAL_REFERENCES check: {any Tier 1 files?}
- [ ] Dependencies installed: {any new packages?}

## Implementation Tasks

### Phase 1: {Phase Name} (Est: 4h)

#### Task 1: {Task Name} (Est: 1.5h)

**Files to modify:**
- `path/to/file1.ts` - {what changes}
- `path/to/file2.tsx` - {what changes}

**Subtasks:**
- [ ] Write failing test: `tests/path/to/file1.test.ts`
  - Test case: {describe specific test}
  - Expected behavior: {what should happen}
- [ ] Implement function in `file1.ts`
  - Add interface to `lib/contracts/contracts.ts` (if needed)
  - Follow pattern from: `similar/existing/file.ts:123`
  - DRY: Extract shared logic to: `lib/utils/helper.ts`
- [ ] Verify test passes: `npm test -- file1.test.ts`
- [ ] Update types if needed: `types/feature.ts`
- [ ] Commit: "feat: add {feature} to {component}"

**Docs to check:**
- CANONICAL_REFERENCES.md (if touching Tier 1 files)
- docs/runbooks/{relevant-guide}.md

**Testing:**
- Unit test: `npm test -- file1.test.ts` (expect: X/X passing)
- Manual verification: {steps to verify in browser/app}

**Rollback:**
- Revert commit if test fails
- No database changes in this task

---

#### Task 2: {Task Name} (Est: 2h)

**Files to modify:**
- `components/feature/Component.tsx` - {what changes}

**Subtasks:**
- [ ] Write component test: `tests/components/Component.test.tsx`
  - Test: Component renders with props
  - Test: User interaction triggers callback
  - Test: Error state displays correctly
- [ ] Implement component
  - Use Shadcn component: `components/ui/{component}.tsx`
  - Follow pattern: `components/similar/Example.tsx`
  - Add TypeScript interface for props
  - Handle loading/error states
- [ ] Verify tests pass: `npm test -- Component.test.tsx`
- [ ] Check accessibility: Add aria-labels
- [ ] Check responsive: Test mobile viewport
- [ ] Commit: "feat: add {component} UI"

**Docs to check:**
- docs/runbooks/design/accessibility-checklist.md
- Component Placement Decision Tree: docs/COMPONENT_PLACEMENT_DECISION_TREE.md

**Testing:**
- Unit: `npm test -- Component.test.tsx` (expect: 5/5 passing)
- Visual: Check in browser at http://localhost:3000/test-page
- A11y: Run axe DevTools (expect: 0 violations)

**Dependencies:**
- Task 1 must complete first (component uses logic from file1.ts)

---

### Phase 2: {Phase Name} (Est: 4h)

{Repeat task structure for Phase 2}

---

### Phase 3: Integration & Testing (Est: 4h)

#### Task 5: Integration Tests

**Files to create:**
- `tests/integration/feature-flow.test.ts`

**Subtasks:**
- [ ] Write integration test
  - Test: Complete user flow from A → B → C
  - Mock: External API calls only (use real DB in test)
  - Verify: Data persists correctly
- [ ] Run test: `npm test -- feature-flow.test.ts`
- [ ] Commit: "test: add integration tests for {feature}"

---

#### Task 6: E2E Tests (if applicable)

**Files to create:**
- `tests/e2e/feature.spec.ts`

**Subtasks:**
- [ ] Add test IDs to components
  - Add `data-testid="feature-button"` to interactive elements
- [ ] Write Playwright test
  - Test: User can complete full workflow
  - Verify: UI updates correctly
  - Verify: Data saves to backend
- [ ] Run E2E: `npm run test:e2e`
- [ ] Commit: "test: add E2E tests for {feature}"

---

#### Task 7: Documentation & Cleanup

**Files to update:**
- `docs/work-log.md` - Add completion entry
- `README.md` - Update if new feature added
- Plan file (this file) - Mark all tasks complete

**Subtasks:**
- [ ] Run full test suite: `npm test`
- [ ] Run build: `npm run build` (verify no errors)
- [ ] Run linter: `npm run lint` (fix any issues)
- [ ] Update work-log.md with evidence
- [ ] Mark plan tasks complete ([x])
- [ ] Archive plan if fully complete

---

## Test Coverage Summary

**Unit Tests:**
- file1.test.ts (X tests)
- Component.test.tsx (Y tests)

**Integration Tests:**
- feature-flow.test.ts (Z tests)

**E2E Tests:**
- feature.spec.ts (W scenarios)

**Total:** X+Y+Z+W tests

---

## Rollback Plan

**If Phase 1 fails:**
- Revert commits from Task 1-2
- No data migrations, safe to rollback

**If Phase 2 fails:**
- Feature flag exists: disable `FEATURE_{NAME}` in env
- Revert commits from Task 3-4

**If Phase 3 fails:**
- Tests failing but code works → Fix tests, don't revert
- Code broken → Revert all Phase 3 commits

---

## Definition of Done

- [ ] All tasks marked complete ([x])
- [ ] All tests passing (unit + integration + E2E)
- [ ] Build succeeds: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] Work-log.md updated with evidence
- [ ] Code reviewed (if team workflow)
- [ ] Deployed to staging (if applicable)
```

**Key Principles for Implementation Plans:**
- **Assume zero context:** Engineer doesn't know codebase
- **File paths explicit:** Every task lists exact files to modify
- **Test-first:** Every task starts with writing test
- **Bite-sized:** Each subtask <30 min
- **DRY:** Point to existing patterns to copy
- **YAGNI:** Only build what's needed for success criteria
- **Frequent commits:** Every subtask group gets a commit
```

### Usage Notes

**Plans contain DECISIONS:**
- What to build
- Why we're building it
- Testing approach
- Risk mitigation

**Plans do NOT contain INSTRUCTIONS:**
- Code examples >20 lines
- Copy-paste tutorials
- Troubleshooting sections
- "Read this first" prerequisites

**Red flags your plan is too long:**
- Contains code examples >20 lines
- Contains "read this first" prerequisites
- Contains troubleshooting sections
- Contains copy-paste tutorials
- Over 200 lines

**When plan grows too large:**
1. Extract code examples → delete or move to `docs/runbooks/`
2. Extract tutorials → link to existing runbook
3. Split into Phase 1, Phase 2 plans if still >200 lines

**Before creating a new plan:**
1. Check `docs/plans/active/` - does a plan for this feature already exist?
2. If yes, update existing plan instead of creating new one
3. If creating new plan, set old related plans to `status: archived` and move them

---

## Pre-Implementation Checklist

**Add this section to every plan before starting work:**

```markdown
## Pre-Implementation Checklist

**Before starting implementation:**
- [ ] Check CANONICAL_REFERENCES.md for folder structure standards
- [ ] Verify no Tier 1 files will be modified (if yes, review change rules)
- [ ] Confirm file placement using Component Placement Decision Tree (CLAUDE.md)
- [ ] Check for existing similar components/features to avoid duplication
- [ ] Identify which tests need to be written first (TDD)
- [ ] Review related runbooks for implementation patterns

**File placement decisions:**
- [ ] New app/ routes → Production route or app/_dev/?
- [ ] New components → Which domain folder? (ui, layout, landing, shared, forms, etc.)
- [ ] New tests → Colocated __tests__/ or tests/ directory?
- [ ] New utilities → lib/ or hooks/?
- [ ] Archive format → YYYY-MM if archiving anything
```

---

## Task Completion Workflow

**CRITICAL: Update plans as you complete tasks so `plan-to-chunks` skill tracks progress correctly.**

### Step-by-Step Process

```markdown
1. Morning Planning:
   - Say: "What should I work on today?"
   - plan-to-chunks skill activates
   - Generates TodoWrite from plan's incomplete tasks
   - Start working

2. During Work:
   - Mark TodoWrite item as "in_progress"
   - Implement feature/fix
   - Write tests (TDD)

3. After Completing Task:
   a. Mark TodoWrite item as "completed"
   b. **Update plan file** → Change task checkbox:
      - From: `- [ ] Add accessibility labels`
      - To:   `- [x] Add accessibility labels`
   c. Say: "Done with accessibility labels"
   d. evidence-collector skill activates
   e. Paste generated entry into docs/work-log.md
   f. Commit changes (can-task-linker generates message)

4. Next Day:
   - plan-to-chunks reads plan again
   - Sees `- [x]` and skips completed task
   - Suggests next incomplete task
```

### Why This Matters

**If you don't mark tasks complete in plans:**
- ❌ plan-to-chunks suggests same task tomorrow
- ❌ Progress % calculations are wrong
- ❌ Can't tell what's done vs pending

**Completion markers recognized:**
- `- [x] Task` (checkbox marked)
- `✅ Task` (emoji in task title)
- `(DONE)` or `(COMPLETE)` in task text

### Example Plan Evolution

**Monday morning (plan file):**
```markdown
## Tasks
- [ ] Task 1: Add accessibility labels
- [ ] Task 2: Run Lighthouse audit
- [ ] Task 3: Fix performance issues
```

**Monday evening (after completing Task 1):**
```markdown
## Tasks
- [x] Task 1: Add accessibility labels
- [ ] Task 2: Run Lighthouse audit
- [ ] Task 3: Fix performance issues
```

**Tuesday morning:**
- plan-to-chunks sees Task 1 is `[x]`
- Suggests Task 2 (next incomplete task)

---

## Work Log Entry Template

**File location:** `docs/work-log.md`

**When to use:** Daily notes during implementation (NOT for creating new plans or reports)

### Entry Structure

```markdown
## {YYYY-MM-DD} - {Feature Name}

**Branch:** {branch-name}
**Plan:** docs/plans/active/{date}-{feature-slug}.md
**Status:** in-progress | blocked | completed

### Progress Today
- [x] Completed task 1
- [ ] Blocked on task 2

### Key Decisions
- Decision: {what we chose and why}

### Issues Found
- Issue: {description} - fixed in commit abc1234

### Next Session
- Start with task X
```

### Usage Notes

**During implementation, use ONLY:**
- `TodoWrite` tool for task tracking
- `docs/work-log.md` for daily notes
- Git commits as execution log
- Nothing else

**DO NOT create during execution:**
- New plans
- Investigation reports (use journal)
- Status updates (use journal)
- Fix summaries (git log is your summary)

---

## Completion Report Template

**File naming:** `docs/plans/active/{date}-{feature-slug}-COMPLETION.md`

**When to use:** Create ONE completion report when fully done (not partial/interim reports)

### Report Structure

```markdown
---
plan: {date}-{feature-slug}.md
completed: YYYY-MM-DD
outcome: success | partial | failed
---

# Completion: Feature Name

## What We Built
- Feature 1: {1 sentence}

## Metrics
- Baseline: X → Current: Y

## What Worked / Didn't Work
...

## Next Actions
- [ ] Monitor X
- [ ] Archive plan
```

### When to Create Completion Report

Create completion report when:
- All tasks in plan are completed OR explicitly deferred
- All tests are passing
- Code is merged to main branch

**Never create:**
- Partial/interim reports
- Status updates (use work-log.md instead)

### After Completion

**Archive immediately after completion report:**

```bash
git mv docs/plans/active/{plan}.md docs/plans/archive/2025/10/
git mv docs/plans/active/{plan}-COMPLETION.md docs/plans/archive/2025/10/
```

**Archive structure:** `docs/plans/archive/{year}/{month}/`

---

## Document Type Quick Reference

| Document Type | Location | Purpose | Lifecycle |
|---------------|----------|---------|-----------|
| Active plan | `docs/plans/active/` | WHAT to build, WHY, testing | Temporary (archive after completion) |
| Work log | `docs/work-log.md` | Daily progress notes | Ongoing |
| Completion report | `docs/plans/active/` then archive | Final summary of work | Created once, then archived |
| Runbook | `docs/runbooks/{domain}/` | HOW to implement features | Permanent reference |
| Code | Files in `CANONICAL_REFERENCES.md` | Canonical implementation truth | Production code |

---

## Forbidden Patterns

**NEVER create these at repository root:**
- `*_SUMMARY.md`
- `*_REPORT.md`
- `*_FIX.md`
- `*_STATUS.md`
- `*_IMPLEMENTATION.md`
- `*.txt` status files

**Exception:** README.md, CLAUDE.md, AGENTS.md, SKILL.md, standard configs

**If you find root-level docs:**
1. Is it a plan? → move to `docs/plans/archive/{year}/{month}/`
2. Investigation notes? → move to `docs/reports/investigations/`
3. Fix summary? → delete (git log has it)
4. Status update? → delete (stale)

---

**Last Updated:** 2025-10-19  
**Source:** [CLAUDE.md](../CLAUDE.md) lines 406-633
