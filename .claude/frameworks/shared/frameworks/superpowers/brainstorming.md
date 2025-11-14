# Brainstorming Ideas Into Designs (NextNest Adapted)

**Source:** Superpowers v2.1.0
**Adapted for:** NextNest project
**Last Updated:** 2025-10-18

---

## Overview

Transform rough ideas into fully-formed designs through structured questioning and alternative exploration.

**Core principle:** Ask questions to understand, explore alternatives, present design incrementally for validation.

**When to use:**
- User says "I've got an idea", "Let's make/build/create", "I want to implement/add"
- Requirements are vague or exploratory
- Complex feature needs design refinement
- BEFORE creating implementation plans

---

## The Process

### Phase 1: Understanding

**Goal:** Clarify the idea through focused questions

1. **Check Current Project State**
   ```bash
   # Understand current context
   git status
   git branch --show-current

   # Read relevant architecture docs
   cat docs/ARCHITECTURE.md
   cat CLAUDE.md  # NextNest-specific rules
   ```

2. **Ask ONE Question at a Time**
   - Don't overwhelm with multiple questions
   - Prefer multiple choice when possible
   - Gather: Purpose, constraints, success criteria

3. **Understand NextNest Constraints**
   - TDD mandatory (CLAUDE.md)
   - YAGNI principle
   - Check CANONICAL_REFERENCES.md for affected files
   - Component Placement Decision Tree compliance

**Example Questions:**
- "What problem does this solve for users?"
- "Which part of the system does this affect: (A) forms, (B) chat, (C) calculator, (D) other?"
- "What does success look like - how will we know it works?"
- "Are there any NextNest-specific constraints I should know about?"

---

### Phase 2: Exploration

**Goal:** Propose alternatives, identify trade-offs

1. **Propose 2-3 Different Approaches**

   For each approach, provide:
   - Core architecture
   - Trade-offs (complexity vs features, time vs quality)
   - Complexity assessment (LIGHT/MEDIUM/HEAVY/FULL tier)
   - YAGNI check (are we adding features not requested?)

2. **Present in Table Format**

   | Approach | Architecture | Pros | Cons | Complexity |
   |----------|--------------|------|------|-----------|
   | A: Simple | Single component, existing patterns | Fast, low risk | Limited features | LIGHT |
   | B: Moderate | New module + integration | Balanced | Moderate refactoring | MEDIUM |
   | C: Complex | Multi-system architecture | Full-featured | High complexity | HEAVY |

3. **Ask for Preference**
   - "Which approach resonates with you?"
   - "Are any of these non-starters?"
   - "What trade-offs are you willing to make?"

---

### Phase 3: Design Presentation

**Goal:** Present design incrementally with validation checkpoints

**Present in 200-300 word sections:**

1. **Architecture Overview**
   - High-level structure
   - Key components
   - File locations (use Component Placement Decision Tree)

   ✅ Checkpoint: "Does this architecture look right so far?"

2. **Component Details**
   - Each major component
   - Responsibilities
   - Interfaces/contracts

   ✅ Checkpoint: "Does this component breakdown make sense?"

3. **Data Flow**
   - How data moves through system
   - State management
   - API calls / dependencies

   ✅ Checkpoint: "Does this data flow work for your use case?"

4. **Error Handling**
   - What can go wrong?
   - How to handle failures?
   - User-facing error messages

   ✅ Checkpoint: "Does this error handling cover the main cases?"

5. **Testing Strategy**
   - Unit tests (TDD - write these first!)
   - Integration tests
   - E2E tests if needed

   ✅ Checkpoint: "Does this testing approach give you confidence?"

**After each section:** Pause and ask. Don't present entire design at once.

---

### Phase 4: NextNest Compliance Check

**Before finalizing design:**

1. **TDD Readiness**
   - Can we write failing tests first?
   - What will those tests look like?
   - Are they testable components?

2. **CANONICAL_REFERENCES.md Check**
   - Will we modify any Tier 1 files?
   - If yes, understand change rules

3. **Component Placement**
   - Where do new files go?
   - Run through Component Placement Decision Tree
   - Verify no test-* or temp-* files in app/

4. **YAGNI Ruthlessness**
   - Remove anything not explicitly requested
   - Challenge "nice to have" features
   - Focus on minimum viable design

---

### Phase 5: Worktree Setup (if implementation follows)

**When design is approved:**

Ask: "Should I create a git worktree for this work?"

**If yes:**
- Check for uncommitted changes
- Deploy worktree-helper agent
- Create isolated workspace
- Document in docs/work-log.md

**Configuration:**
- Load from `.claude/config/response-awareness-config.json`
- Check `features.worktree_integration` setting

---

### Phase 6: Planning Handoff

**Ask:** "Ready to create the implementation plan?"

**When user confirms:**

1. **Create Plan File**
   - Location: `docs/plans/active/YYYY-MM-DD-{feature-slug}.md`
   - Format: Follow CLAUDE.md plan structure
   - Max Length: 200 lines
   - Required sections: Problem, Success Criteria, Tasks, Testing, Rollback

2. **Plan Contents**
   - Tasks broken into <2h chunks
   - TDD workflow explicit (test first for each task)
   - File placement decisions documented
   - Testing strategy from Phase 3.5

3. **Handoff to Response-Awareness**
   - "Plan created. Ready to implement?"
   - If yes: Route to `/response-awareness` for complexity assessment
   - Router will determine tier (LIGHT/MEDIUM/HEAVY/FULL)

---

## When to Revisit Earlier Phases

**You can and should go backward when:**

- Partner reveals new constraint during Phase 2 or 3 → Return to Phase 1
- Validation shows fundamental gap → Return to Phase 1
- Partner questions approach during Phase 3 → Return to Phase 2
- Something doesn't make sense → Go back and clarify
- YAGNI check reveals feature creep → Return to Phase 1 to re-scope

**Don't force forward linearly** when going backward would give better results.

---

## Integration with Response-Awareness

**When brainstorming is invoked from response-awareness router:**

```javascript
// Router detected vague requirements
if (userRequest.includes("maybe") || userRequest.includes("thinking about")) {
  askUser({
    message: "Requirements seem exploratory. Use brainstorming skill first?",
    options: ["Yes", "No"]
  });

  if (yes) {
    invokeSkill("brainstorming", userRequest);
    // After brainstorming completes
    clarifiedRequirements = brainstormingOutput;
    // Continue with complexity assessment using clarified requirements
  }
}
```

**Output format for router:**

```json
{
  "clarified_requirements": "User wants to add email notifications for form submissions",
  "chosen_approach": "Approach B: Moderate complexity with Supabase Edge Functions",
  "complexity_estimate": "MEDIUM",
  "file_placement": [
    "app/api/notifications/route.ts",
    "lib/notifications/email-service.ts",
    "components/forms/NotificationSettings.tsx"
  ],
  "tdd_ready": true,
  "plan_location": "docs/plans/active/2025-10-18-email-notifications.md"
}
```

---

## Related Skills

**During exploration:**
- `preserving-productive-tensions` - When approaches have genuine trade-offs

**Before proposing changes:**
- `knowledge-lineage` - Understand why existing code exists

**After brainstorming:**
- `/response-awareness` - Route to appropriate tier for implementation

---

## Example Session

**User:** "I'm thinking about maybe adding some kind of dashboard for users"

**Claude:**
> I'm using the Brainstorming skill to refine your idea into a design.
>
> Let's start by understanding what you need. What's the main problem this dashboard would solve?
>
> A) Users can't see their application status
> B) Users can't track their saved calculations
> C) Users can't manage their profile
> D) Something else

**User:** "A - they submit forms but don't know what happened"

**Claude:**
> Got it - application status tracking. Next question: What information should the dashboard show?
>
> (Checkboxes - select all that apply)
> - Current application stage
> - Submission date
> - Required next steps
> - Document upload status
> - Contact information for questions

**User:** "First three"

**Claude:**
> Perfect. Now let me propose 2-3 approaches...
>
> [Continues with Phase 2...]

---

## Remember

- One question per message during Phase 1
- Apply YAGNI ruthlessly
- Explore 2-3 alternatives before settling
- Present incrementally, validate as you go
- Go backward when needed - flexibility > rigid progression
- Check NextNest constraints (TDD, CANONICAL_REFERENCES, component placement)
- Create plan in `docs/plans/active/` before implementation
- Hand off to `/response-awareness` for tier routing

---

**Version:** 2.1.0-nextnest
**Source:** Superpowers Brainstorming v2.1.0
**NextNest Customizations:**
- TDD compliance checks
- CANONICAL_REFERENCES.md integration
- Component Placement Decision Tree
- YAGNI emphasis
- Worktree integration
- Response-awareness handoff
