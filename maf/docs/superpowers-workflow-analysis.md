# Superpowers Workflow Analysis

**Date:** 2026-01-09
**Subject:** Planning tools, reviewer redundancy, and Response Awareness usage

---

## Executive Summary

This document analyzes three planning approaches, reviewer redundancy between SDD and MAF, and actual use cases for Response Awareness.

**Key Finding:** Response Awareness is a **complexity router**, not a planning tool. For users who know which tools to use, RA adds overhead. For new users or automation, RA provides valuable automatic routing.

---

## Part 1: Planning Tools Comparison

### Tool Comparison Matrix

| Aspect | sp-write-plan | beads-friendly-planning | Response Awareness |
|--------|---------------|------------------------|-------------------|
| **Primary Purpose** | Create plan from spec | Improve existing plan | Route to appropriate tier |
| **When to Use** | Have requirements, no plan | Have plan, needs improvement | Uncertain what approach to use |
| **Output** | Implementation plan (.md) | Improved plan (.md) | Tier selection + execution |
| **Planning Depth** | Bite-sized tasks (2-5 min steps) | 12 passes (3-4 hours) | Varies by tier |
| **Planning Included?** | ✅ Yes (main purpose) | ✅ Yes (main purpose) | ⚠️ Only as one phase |
| **Stateful/Resumable?** | ❌ No | ✅ Yes (sessions) | ❌ No (continuous) |
| **For MAF Beads?** | ❌ Generic | ✅ Yes (swarm-executable) | ❌ Generic |

### When to Use Each

**Use `sp-write-plan` when:**
- You have a clear spec/requirements
- You need a quick implementation plan
- You want bite-sized 2-5 minute tasks
- Example: "Write plan for adding user login"

**Use `beads-friendly-planning` when:**
- You have a plan that needs improvement
- You want swarm-executable output for MAF
- You need multi-pass refinement (security, data, failures)
- Example: "Improve this vague plan to be ready for beads"

**Use Response Awareness when:**
- You DON'T know what complexity level you're dealing with
- You want automatic routing to appropriate approach
- You're unsure if you need planning at all
- Example: "Add user authentication" (could be simple or complex)

---

## Part 2: Reviewer Redundancy Analysis

### SDD Reviewers vs MAF Reviewer

| Aspect | SDD Reviewers (Subagents) | MAF Reviewer (BlackDog) |
|--------|--------------------------|-------------------------|
| **Scope** | Per-task review | End-to-end bead review |
| **Lifetime** | Ephemeral (task complete → exit) | Persistent (entire session) |
| **Context** | Single task only | Full feature/context |
| **Communication** | No (returns to controller) | Yes (MCP Agent Mail) |
| **Approval Mechanism** | Reviewer subagent approves | `bd close` (bead approval) |
| **Guardrails** | None (software enforcement) | Filesystem blocks git commit |
| **Role** | Quality gate during execution | QA gate before merge |

### What Each Catches

**SDD Reviewers catch:**
- Spec compliance (did I build what was asked?)
- Code quality (is this well-implemented?)
- Task-level issues (missing tests, etc.)

**MAF Reviewer catches:**
- Integration issues (does this work with the rest?)
- Receipt validation (did implementor lie?)
- System-level concerns (security, performance)
- User workflow validation

### Two-Layer Review Pattern

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: SDD Reviews (during implementation)                │
│                                                                 │
│ Implementor uses SDD:                                         │
│   Task 1 → Implementer → Spec Reviewer → Code Reviewer ✅   │
│   Task 2 → Implementer → Spec Reviewer → Code Reviewer ✅   │
│   Task 3 → Implementer → Spec Reviewer → Code Reviewer ✅   │
│                                                                 │
│ Catches: Task-level issues early                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ LAYER 2: MAF Reviewer (end-to-end validation)              │
│                                                                 │
│ Implementor submits bead:                                     │
│   bd submit <bead-id>                                         │
│                                                                 │
│ Reviewer (BlackDog):                                          │
│   bd show <bead-id>                                           │
│   git diff (verify receipt matches actual)                   │
│   npm test (verify all tests pass)                           │
│   bd close <bead-id> ✅                                       │
│                                                                 │
│ Catches: System-level issues, integration problems            │
└─────────────────────────────────────────────────────────────┘
```

### When to Skip MAF Reviewer

**You can skip MAF Reviewer when:**
- Working solo (no team coordination needed)
- One-off debugging (not a feature)
- SDD reviews already comprehensive
- Don't need persistent coordination

**Keep MAF Reviewer when:**
- Working in a team (Supervisor + 2 Implementors + Reviewer)
- Need role-based separation (Reviewer can't commit)
- Want MCP Agent Mail coordination
- Using Beads workflow

### Simplified MAF Setup (Optional)

If SDD reviewers are sufficient, you could simplify MAF to 3 agents:

```
┌─────────────────────────────────────────────────────────────┐
│ SIMPLIFIED MAF: 3-Agent Layout                              │
│                                                                 │
│ Pane 0: Supervisor (GreenMountain)                           │
│   - Task routing, coordination                                 │
│   - No Reviewer agent                                          │
│                                                                 │
│ Pane 1: Implementor-1 (OrangePond)                           │
│   - Uses SDD with built-in reviewers                          │
│   - Self-validating                                            │
│                                                                 │
│ Pane 2: Implementor-2 (FuchsiaCreek)                         │
│   - Uses SDD with built-in reviewers                          │
│   - Self-validating                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 3: Response Awareness Actual Use Cases

### The Problem: RA Solves a Problem You Might Not Have

**RA's purpose:** "I don't know how complex this is, please tell me what approach to use."

**Your situation:** You know how to use superpowers skills directly.

**Result:** RA feels redundant because you already know which tool to use.

### Actual Use Cases for Response Awareness

#### Use Case 1: Team/New User Onboarding

**Scenario:** New team member asks "How do I add user authentication?"

**Without RA:**
- They need to learn: sp-write-plan, beads-friendly-planning, SDD, MAF, etc.
- Overwhelming cognitive load

**With RA:**
```
User: /response-awareness "add user authentication"
RA: Assessing complexity... Score: 8/12 → FULL tier
RA: I'll use the full workflow:
  - Survey codebase
  - Create plan
  - Synthesize approaches
  - Implement
  - Verify
```

**Benefit:** One command, RA handles the complexity decision.

#### Use Case 2: CI/CD Automation

**Scenario:** Automated task processing where complexity varies.

```python
# In CI/CD pipeline
task_description = get_issue_title()

# Route to appropriate approach
complexity = assess_complexity(task_description)

if complexity.score >= 8:
    use_full_workflow(task_description)
elif complexity.score >= 5:
    use_heavy_workflow(task_description)
else:
    direct_implementation(task_description)
```

**Benefit:** Automatic routing based on objective complexity.

#### Use Case 3: Uncertain Requirements

**Scenario:** "Fix the bug in the authentication system" - but you don't know:
- Is it a typo fix (5 seconds)?
- Is it a logic bug (1 hour)?
- Is it an architecture flaw (1 week)?

**With RA:**
```
/response-awareness "fix authentication bug"
→ Deploys complexity-scout
→ Scout analyzes codebase
→ Returns: Score 3/12 → MEDIUM tier
→ Uses medium-tier workflow
```

**Benefit:** Don't waste time on heavy workflow for simple bugs.

#### Use Case 4: Multi-Domain Coordination

**Scenario:** Task spans multiple systems (frontend + backend + database).

**Without RA:**
- You might treat it as single-domain
- Miss integration points
- Break things

**With RA FULL tier:**
- Phase 0: Survey (finds all domains)
- Phase 2: Synthesis (plan-synthesis-agent unifies approaches)
- Phase 4: Verification (integration validation)

**Benefit:** Systematic cross-domain coordination.

### RA vs Direct Skill Invocation

| Situation | Use RA | Use Direct Skill |
|-----------|--------|------------------|
| "Add login button" | ❌ Overkill | `/response-awareness-light` or direct |
| "Refactor entire architecture" | ❌ You know it's complex | `/response-awareness-full` |
| "Fix something, not sure what" | ✅ RA figures it out | N/A |
| "New team member, no training" | ✅ RA guides them | N/A |
| "Automated pipeline, variable tasks" | ✅ Auto-routing | N/A |
| You know what you're doing | ❌ Adds overhead | Use appropriate skill directly |

---

## Part 4: Recommended Workflow

### For Experienced Users

```
┌─────────────────────────────────────────────────────────────┐
│ OPTIMAL WORKFLOW (Experienced Users)                        │
└─────────────────────────────────────────────────────────────┘

Have requirements?
  ↓
/sp-brainstorm (explore, clarify requirements)
  ↓
sp-write-plan (create implementation plan)
  ↓
beads-friendly-planning (improve for swarm execution)
  ↓
/plan-to-beads (convert to beads)
  ↓
MAF Supervisor routes to implementors
  ↓
Implementors use sp-subagent-driven-development
  ↓
(Optional) MAF Reviewer validates end-to-end
```

### Where Response Awareness Fits

- ✅ New team members who don't know the tools
- ✅ Automated pipelines with variable complexity
- ✅ "I have no idea what this task needs"
- ❌ When you know which tool to use (adds overhead)

### Where MAF Reviewer Fits

- ✅ Team coordination (need persistent QA role)
- ✅ Role-based guardrails (Reviewer can't commit)
- ✅ MCP Agent Mail communication
- ❌ Solo work with SDD (redundant)

---

## Part 5: Key Takeaways

1. **RA is a router, not a planner** - Use it when you're unsure what approach to take
2. **sp-write-plan creates plans** - Use it when you have requirements
3. **beads-friendly-planning improves plans** - Use it to make plans swarm-executable
4. **SDD reviewers catch task-level issues** - Built-in quality during execution
5. **MAF reviewer catches system-level issues** - End-to-end validation (optional for solo work)

### Why SDD Worked Better for You

**Your "1 hour flow" with SDD worked because:**
- No planning overhead (plan already existed)
- No orchestration overhead (just execute)
- Fresh context per task (no pollution)
- Continuous execution (no phase transitions)

**Response Awareness felt slow because:**
- Complexity assessment overhead
- Phase transitions break flow
- Orchestrator cognitive load
- Planning phase when you didn't need planning

### The Right Tool for the Right Job

| Purpose | Tool |
|---------|------|
| Explore requirements | `/sp-brainstorm` |
| Create plan from requirements | `sp-write-plan` |
| Improve existing plan | `beads-friendly-planning` |
| Route based on complexity | `Response Awareness` |
| Execute plan | `sp-subagent-driven-development` |
| Team coordination | MAF tmux agents |

---

## Conclusion

The key insight is that **Response Awareness is not a planning tool** - it's a complexity router that includes planning as one phase. For experienced users who know which tools to use, RA adds unnecessary overhead. However, for new users, automated pipelines, or uncertain complexity, RA provides valuable automatic routing.

The optimal workflow combines these tools purposefully:
- Use brainstorming and write-plan for planning
- Use beads-friendly-planning for improvement
- Use SDD for execution
- Use MAF for team coordination (optional)
- Use RA only when you're unsure what approach to take

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
