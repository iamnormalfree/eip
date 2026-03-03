# Claude Operations in MAF

**Version:** 1.0.0
**Last Updated:** 2026-01-09
**Audience:** Claude (all models: Opus, Sonnet, Haiku)

---

## Executive Summary

As Claude in this MAF repository, you have access to the **Response Awareness framework** - a sophisticated workflow system for handling tasks of varying complexity. This document explains when and how to use each tier, plus Claude-specific integrations.

**Key Capabilities:**
- **Response Awareness Tiers:** Light, Medium, Heavy, Full (choose based on complexity)
- **Skills Library:** 25+ reusable workflows in `.claude/skills/`
- **Commands Library:** 15+ quick actions in `.claude/commands/`
- **MCP Agent Mail:** Inter-agent communication
- **Specialized Agents:** 23 domain-specific subagents available

---

## Response Awareness: Quick Reference

### Complexity Scoring (0-12)

Use this rubric to determine which tier to use:

| Dimension | 0-1 pts | 2 pts | 3 pts |
|-----------|---------|-------|-------|
| **Files** | 1 file | 2-3 files | 4+ files |
| **Domains** | Single domain | 2 domains | 3+ domains |
| **Uncertainty** | Clear requirements | Minor ambiguity | Major exploration |
| **Integration** | No integration | Simple integration | Complex integration |

**Total Score → Tier:**
- **0-1:** Light (direct implementation)
- **2-4:** Medium (structured planning)
- **5-7:** Heavy (multi-path planning)
- **8-12:** Full (systematic orchestration)

### Tier Selection

```
Is it a trivial change (1-2 lines, obvious)?
├─ Yes → Direct implementation (no tier needed)
└─ No → Calculate complexity score
    ├─ 0-1 points → /response-awareness-light
    ├─ 2-4 points → /response-awareness-medium
    ├─ 5-7 points → /response-awareness-heavy
    └─ 8-12 points → /response-awareness-full
```

### Tier Quick Reference

| Tier | Score | When to Use | Tags Loaded |
|------|-------|-------------|-------------|
| **Light** | 0-1 | Single file, clear requirements | 5 essential tags |
| **Medium** | 2-4 | 2-5 files, some ambiguity | 15 tags |
| **Heavy** | 5-7 | 5+ files, architectural decisions | 35 tags |
| **Full** | 8-12 | Multi-domain, system-wide impact | 50+ tags progressive |

---

## Response Awareness Tiers (Detailed)

### Tier 1: Response Awareness Light

**Use for:** Simple, isolated changes

**Complexity:** 0-1 points
- Single file
- Clear requirements
- No integration risk

**Usage:**
```
/response-awareness-light
```

**What It Does:**
- Loads 5 essential metacognitive tags
- Minimal orchestration
- Fast execution

**Example Scenarios:**
- Fix a typo in documentation
- Update a single function signature
- Add a simple utility function
- Update configuration value

**Tags Loaded:**
```
#Meta:Context-Setting
#Meta:Task-Definition
#Meta:Progress-Tracking
#Meta:Completion-Detection
#Meta:Reflection
```

---

### Tier 2: Response Awareness Medium

**Use for:** Standard feature implementation

**Complexity:** 2-4 points
- 2-5 files
- Minor ambiguity acceptable
- Some integration points

**Usage:**
```
/response-awareness-medium
```

**What It Does:**
- Loads 15 metacognitive tags
- Structured task breakdown
- Optional planning phase
- Verification steps

**Example Scenarios:**
- Add a new API endpoint (2-3 files)
- Implement a UI component with integration
- Update data model + migrate
- Add error handling to existing code

**Phases:**
1. **Planning** (optional but recommended)
   - Create TodoWrite with steps
   - Identify integration points
2. **Implementation**
   - Follow systematic approach
   - Update TodoWrite progress
3. **Verification**
   - Run tests
   - Validate integration

**Tags Loaded:**
```
Phase 1: Essential (5 tags)
#Meta:Context-Setting
#Meta:Task-Definition
#Meta:Progress-Tracking
#Meta:Completion-Detection
#Meta:Reflection

Phase 2: Planning (5 tags)
#Meta:Exploration
#Meta:Assumption-Tracking
#Meta:Question-Formulation
#Meta:Alternative-Generation
#Meta:Risk-Assessment

Phase 3: Execution (3 tags)
#Meta:Stepwise-Execution
#Meta:Self-Correction
#Meta:Tool-Selection

Phase 4: Verification (2 tags)
#Meta:Validation
#Meta:Quality-Check
```

---

### Tier 3: Response Awareness Heavy

**Use for:** Complex features requiring multi-path planning

**Complexity:** 5-7 points
- 5+ files
- Architectural decisions
- Multiple integration points

**Usage:**
```
/response-awareness-heavy
```

**What It Does:**
- Loads 35 metacognitive tags
- Mandatory planning phase
- Multi-path exploration
- Synthesis before implementation
- Systematic verification

**Example Scenarios:**
- Add authentication system (6+ files)
- Implement caching layer
- Refactor major subsystem
- Add real-time features

**Phases:**
1. **Survey** (Required)
   - Explore codebase thoroughly
   - Identify all affected areas
   - Document assumptions

2. **Planning** (Required)
   - Generate multiple approaches
   - Evaluate trade-offs
   - Create detailed plan

3. **Synthesis** (Required)
   - Cross-domain validation
   - Conflict resolution
   - Unified implementation blueprint

4. **Implementation**
   - Follow plan systematically
   - Handle deviations gracefully

5. **Verification**
   - Comprehensive testing
   - Cross-domain validation
   - Performance checks

**Tags Loaded:**
All 35 Medium tags plus:
```
Phase 1 Extended:
#Meta:Deep-Context-Analysis
#Meta:Boundary-Identification
#Meta:Stakeholder-Analysis

Phase 2 Extended:
#Meta:Architecture-Analysis
#Meta:Dependency-Mapping
#Meta:Impact-Assessment

Phase 3 (New):
#Meta:Cross-Domain-Synthesis
#Meta:Conflict-Resolution
#Meta:Unified-Planning

Phase 4 Extended:
#Meta:Error-Recovery
#Meta:Rollback-Planning

Phase 5 (New):
#Meta:Cross-Domain-Validation
#Meta:Performance-Validation
#Meta:Security-Validation
```

---

### Tier 4: Response Awareness Full

**Use for:** System-wide changes with maximum orchestration

**Complexity:** 8-12 points
- Multi-domain impact
- Paradigm shifts
- System-wide architectural changes

**Usage:**
```
/response-awareness-full
```

**What It Does:**
- Loads 50+ tags progressively
- Six-phase systematic approach
- Mandatory synthesis phase
- Contract validation
- Maximum coordination

**Example Scenarios:**
- Migrate from REST to GraphQL
- Implement microservices architecture
- Add comprehensive telemetry system
- Domain-driven design restructure

**Six Phases:**

1. **Phase 0: Survey** (Exploration)
   - Comprehensive codebase analysis
   - Identify ALL affected areas
   - Map dependencies
   - Document all assumptions

2. **Phase 1: Planning** (Strategy)
   - Generate multiple architectural approaches
   - Evaluate trade-offs systematically
   - Risk assessment with mitigation
   - Create detailed implementation blueprint

3. **Phase 2: Synthesis** (Validation)
   - Cross-domain contract validation
   - Resolve all conflicts
   - Ensure consistency
   - Unified implementation plan

4. **Phase 3: Implementation** (Execution)
   - Follow blueprint exactly
   - Handle deviations with synthesis
   - Continuous validation
   - Progress tracking

5. **Phase 4: Verification** (Testing)
   - Comprehensive test suite
   - Cross-domain integration tests
   - Performance validation
   - Security validation

6. **Phase 5: Reporting** (Documentation)
   - Complete change summary
   - Migration guide
   - Rollback procedures
   - Operational documentation

**Special Agents Required:**
- `plan-synthesis-agent` - Synthesizes multi-domain plans
- `contract-validator` - Validates integration contracts
- `metacognitive-tag-verifier` - Ensures tag consistency

---

## Skills vs Commands

### Skills (`.claude/skills/`)

**Purpose:** Reusable workflows that guide you through complex processes

**When to Use:** You need systematic guidance for a process

**Structure:**
```
.claude/skills/
├── sp-brainstorming/SKILL.md          # Design exploration
├── sp-systematic-debugging/SKILL.md   # Bug fixing workflow
├── sp-test-driven-development/SKILL.md # TDD process
├── sp-writing-plans/SKILL.md          # Plan creation
├── sp-executing-plans/SKILL.md        # Plan execution
├── sp-requesting-code-review/SKILL.md # Code review process
├── response-awareness-light/SKILL.md  # Light tier
├── response-awareness-medium/SKILL.md # Medium tier
├── response-awareness-heavy/SKILL.md  # Heavy tier
└── response-awareness-full/SKILL.md   # Full tier
```

**Usage:**
Invoke via Skill tool or slash command:
```
/sp-brainstorm       # Design exploration
/sp-debug            # Systematic debugging
/sp-tdd              # Test-driven development
/sp-write-plan       # Create implementation plan
/sp-execute-plan     # Execute existing plan
```

**Key Skills:**

| Skill | Use When... |
|-------|-------------|
| `sp-brainstorming` | Creating features, building components, adding functionality |
| `sp-systematic-debugging` | Encountering bugs, test failures, unexpected behavior |
| `sp-test-driven-development` | Implementing features or bugfixes |
| `sp-writing-plans` | You have spec/requirements for multi-step task |
| `sp-executing-plans` | You have written plan to execute in separate session |
| `sp-requesting-code-review` | Completing tasks, implementing features, before merging |
| `sp-receiving-code-review` | Receiving code review feedback |
| `sp-dispatching-parallel-agents` | Facing 2+ independent tasks |
| `sp-using-git-worktrees` | Starting feature work needing isolation |
| `sp-verification-before-completion` | About to claim work is complete/fix/passing |

### Commands (`.claude/commands/`)

**Purpose:** Quick aliases for Response Awareness tiers

**When to Use:** You know which tier you need

**Structure:**
```
.claude/commands/
├── response-awareness.md              # Universal router
├── response-awareness-light.md        # Tier 1
├── response-awareness-medium.md       # Tier 2
├── response-awareness-heavy.md        # Tier 3
├── response-awareness-full.md         # Tier 4
├── response-awareness-plan.md         # Planning-only mode
├── response-awareness-implement.md    # Execute approved plan
└── response-awareness-roundtable.md   # Roundtable-specific
```

**Usage:**
```
/response-awareness              # Auto-select tier
/response-awareness-light        # Tier 1
/response-awareness-medium       # Tier 2
/response-awareness-heavy        # Tier 3
/response-awareness-full         # Tier 4
```

---

## Specialized Subagents

When you need domain-specific expertise, delegate to a specialized subagent:

### Available Subagents

| Subagent | Expertise |
|----------|-----------|
| `complexity-scout` | Analyzes task complexity, recommends tier |
| `implementation-planner` | Creates detailed implementation plans |
| `test-automation-expert` | Test design and automation |
| `documentation-specialist` | Technical documentation |
| `security-analyst` | Security vulnerability analysis |
| `performance-analyst` | Performance optimization |
| `error-pattern-detective` | Recurring error analysis |
| `race-condition-detective` | Concurrency issues |
| `refactor-engineer` | Code refactoring |
| `data-architect` | Data modeling and storage |
| `scalability-architect` | Scaling and load distribution |
| `system-integration-architect` | System integration |
| `integration-specialist` | API design and integration |
| `ui-state-synchronization-expert` | UI state sync issues |
| `mcp-game-integration-specialist` | MCP + game integration |
| `autonomous-playtester` | Game testing and coordination |
| `plan-synthesis-agent` | Synthesizes multi-domain plans |
| `metacognitive-tag-verifier` | Tag verification and cleanup |
| `contract-validator` | Validates integration contracts |
| `code-reviewer` | Reviews code against plans |
| `test-success-reporter` | Reports test results |

**Usage:**
Invoke via Task tool - the system will route to the appropriate specialist.

---

## MCP Agent Mail Integration

### Checking Mail

```bash
# List all messages
mcp-list-mails

# Read specific message
mcp-read-mail <message-id>

# Send mail to another agent/pane
mcp-send-mail <agent-name> "Message content"
```

### MCP Mail in MAF Context

MAF uses MCP Agent Mail for:

1. **Inter-Agent Communication**
   - Supervisor → Implementor: Task assignment
   - Implementor → Reviewer: "Ready for review"
   - Reviewer → Implementor: Feedback
   - Any → Supervisor: Escalation

2. **Agent Coordination**
   - Blocker notifications
   - Decision requests
   - Status updates
   - Handoff confirmations

3. **System Events**
   - Spawn notifications
   - Session changes
   - Error alerts

### MCP Mail Etiquette

1. **Be Specific**
   - Include bead IDs
   - Include file paths
   - Include error messages
   - Include context

2. **Provide Context**
   - What you've tried
   - What you expected
   - What actually happened
   - Relevant logs/output

3. **Escalate Appropriately**
   - Supervisor: Blockers, decisions, conflicts
   - Reviewer: Implementation questions
   - Implementor: Implementation details

4. **Respond Promptly**
   - Check mail during active work
   - Acknowledge receipt
   - Provide ETA for resolution

---

## Claude Code Specific Operations

### Hooks System

MAF uses Claude Code hooks for automation:

**Active Hooks:**
- `SessionStart:*` - Session startup actions
- `UserPromptSubmit:*` - Pre-response validation
- `ToolUse:*` - Tool usage monitoring

**What Hooks Do:**
- Validate operations
- Prevent dangerous actions
- Inject context
- Monitor compliance

### Claude Code Settings

Check `.claude/settings.json` for:
- Model preferences
- Response awareness defaults
- MCP server configurations

### Using Claude Code Features

**TodoWrite:**
```python
TodoWrite({
    "todos": [
        {"content": "Task description", "status": "pending", "activeForm": "Working on task"}
    ]
})
```

**AskUserQuestion:**
```python
AskUserQuestion({
    "questions": [{
        "question": "Which approach?",
        "header": "Design",
        "options": [
            {"label": "Option A", "description": "Description"},
            {"label": "Option B", "description": "Description"}
        ],
        "multiSelect": False
    }]
})
```

---

## Common Claude Scenarios

### Scenario 1: Implementing a Feature

```
User: "Add user authentication"

1. Assess complexity:
   - Files: auth controller, user model, login form, config (4 files)
   - Domains: Backend, frontend
   - Uncertainty: Medium (JWT vs sessions?)
   - Score: 2+2+2+1 = 7 points → HEAVY tier

2. Invoke appropriate tier:
   /response-awareness-heavy

3. Follow systematic workflow:
   - Survey: Explore auth implementation
   - Plan: Generate approaches (JWT vs sessions)
   - Synthesize: Validate across backend/frontend
   - Implement: Follow blueprint
   - Verify: Test login flow
```

### Scenario 2: Fixing a Bug

```
User: "Login button doesn't work"

1. Use debugging skill:
   /sp-debug

2. Follow systematic debugging:
   - Identify: What exactly doesn't work?
   - Isolate: Where is the break?
   - Fix: Address root cause
   - Verify: Test fix works
```

### Scenario 3: Quick Documentation Update

```
User: "Update README with new API endpoint"

1. Assess complexity:
   - Files: 1 (README.md)
   - Clear requirement: Yes
   - Score: 0 points → LIGHT tier or direct

2. Can do directly (no tier needed) OR:
   /response-awareness-light
```

### Scenario 4: Complex Refactoring

```
User: "Migrate from REST to GraphQL"

1. Assess complexity:
   - Files: 20+ (all API endpoints)
   - Domains: Backend, frontend, tests
   - Uncertainty: High
   - Score: 12 points → FULL tier

2. Invoke:
   /response-awareness-full

3. Follow six-phase approach:
   - Phase 0: Survey all endpoints
   - Phase 1: Plan migration strategy
   - Phase 2: Synthesize backend/frontend contracts
   - Phase 3: Implement migration
   - Phase 4: Verify all endpoints work
   - Phase 5: Document migration guide
```

---

## Decision Trees

### Should I Use a Skill?

```
Is this a process I need guidance through?
├─ Yes → Use appropriate skill
│  ├─ Design exploration → /sp-brainstorm
│  ├─ Bug fixing → /sp-debug
│  ├─ Implementation → /sp-tdd
│  ├─ Planning → /sp-write-plan
│  └─ Code review → /sp-requesting-code-review
└─ No → Use command or direct action
```

### Should I Delegate to Subagent?

```
Is this a specialized domain I'm not expert in?
├─ Yes → Delegate to subagent
│  ├─ Security → security-analyst
│  ├─ Performance → performance-analyst
│  ├─ Data → data-architect
│  ├─ Integration → integration-specialist
│  └─ etc.
└─ No → Handle myself
```

### Which Response Awareness Tier?

```
Calculate complexity score:
- Files: 0=1file, 2=2-3files, 3=4+files
- Domains: 0=1, 2=2, 3=3+
- Uncertainty: 0=clear, 2=some, 3=high
- Integration: 0=none, 2=simple, 3=complex

Total score:
├─ 0-1 → Light (or direct)
├─ 2-4 → Medium
├─ 5-7 → Heavy
└─ 8-12 → Full
```

---

## Best Practices

### For All Operations

1. **Always assess complexity first** - Use the scoring rubric
2. **Use TodoWrite** for multi-step tasks
3. **Read files before editing** - Never assume state
4. **Test before completing** - Verification is critical
5. **Document your work** - Provide receipts for implementation

### For Response Awareness

1. **Choose tier deliberately** - Don't default to Full
2. **Follow the phases** - They're there for a reason
3. **Update tags appropriately** - Progress tracking matters
4. **Handle deviations gracefully** - Document why
5. **Complete all phases** - Don't skip verification

### For Inter-Agent Communication

1. **Be specific in MCP mail** - Include all context
2. **Use appropriate escalation** - Supervisor for blockers
3. **Respond promptly** - Check mail regularly
4. **Provide receipts** - Summarize what you did

### For Code Quality

1. **Use TDD when applicable** - Tests first, then code
2. **Run tests before completing** - No test = no complete
3. **Request code review** - Before merging complex changes
4. **Handle edge cases** - Don't just happy path

---

## Quick Reference

### Complexity Scoring

| Dimension | 0 pts | 2 pts | 3 pts |
|-----------|-------|-------|-------|
| Files | 1 | 2-3 | 4+ |
| Domains | 1 | 2 | 3+ |
| Uncertainty | Clear | Some | High |
| Integration | None | Simple | Complex |

### Tier Selection

| Score | Tier | Command |
|-------|------|---------|
| 0-1 | Light | `/response-awareness-light` |
| 2-4 | Medium | `/response-awareness-medium` |
| 5-7 | Heavy | `/response-awareness-heavy` |
| 8-12 | Full | `/response-awareness-full` |

### Key Skills

| Skill | Command | Use When |
|-------|---------|----------|
| Brainstorm | `/sp-brainstorm` | Design exploration |
| Debug | `/sp-debug` | Bug fixing |
| TDD | `/sp-tdd` | Implementation |
| Write Plan | `/sp-write-plan` | Have requirements |
| Execute Plan | `/sp-execute-plan` | Have written plan |
| Code Review | `/sp-requesting-code-review` | Before merging |

### MCP Mail

```bash
mcp-list-mails                    # List messages
mcp-read-mail <id>                # Read message
mcp-send-mail <agent> "message"   # Send message
```

---

## Troubleshooting

### "Which tier should I use?"

Use the complexity scoring rubric:
1. Score each dimension (Files, Domains, Uncertainty, Integration)
2. Sum the scores
3. Use the tier matching your total

### "Should I use a skill or command?"

- **Skill:** You need guidance through a process
- **Command:** You know which tier you need
- **Direct:** Too trivial for any tier (1-2 line change)

### "Response Awareness isn't working"

1. Check you're invoking the command correctly
2. Verify `.claude/commands/` directory exists
3. Check Claude Code settings for response awareness
4. Try invoking the skill directly

### "MCP Mail not responding"

1. Check MCP server is running
2. Verify agent pane is active in tmux
3. Try pinging the agent
4. Escalate to supervisor if no response

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-09 | Initial version, Response Awareness documented |

---

**Related Documentation:**
- `agents.md` - General agent operations (all agents)
- `.claude/skills/README.md` - Skills library documentation
- `docs/plans/maf-franchise-migration-unified-blueprint.md` - Architecture
