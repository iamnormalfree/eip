# MAF-BDD Lightweight Orchestrator - Implementation Plan

**Created:** 2025-01-26
**Based on:** 2026-01-26-maf-bdd-lightweight-orchestrator-design.md
**Estimated tasks:** 25-30 bite-sized tasks

---

## Phase 1: Foundation & Structure (4 tasks)

### Task 1: Create skill directory structure
**File:** `.claude/skills/maf-bdd-orchestrator/`
**Time:** 2 min

Create the directory structure:
```bash
mkdir -p .claude/skills/maf-bdd-orchestrator/prompts
mkdir -p .claude/skills/maf-bdd-orchestrator/lib
```

**Verification:** Directory exists with prompts/ and lib/ subdirs

---

### Task 2: Create main skill definition file
**File:** `.claude/skills/maf-bdd-orchestrator/skill.md`
**Time:** 5 min

Create the skill definition with:
- Name: `maf-bdd-orchestrator`
- Description: 3-agent autonomous bead execution
- When to use section
- Core process flow diagram
- Integration points (MAF, BDD, BV)
- Command reference

**Content structure:**
```markdown
# MAF-BDD Orchestrator

Execute ready beads with 3-agent model: Coordinator + Implementer + Reviewer

## When to Use
[Decision tree diagram]

## The Process
[Main loop diagram]

## Components
[Coordinator, Implementer, Reviewer descriptions]

...
```

**Verification:** File created, readable skill definition

---

### Task 3: Create slash command entry point
**File:** `.claude/commands/maf-bdd.md`
**Time:** 3 min

Create slash command that invokes the skill:
```markdown
# MAF-BDD Orchestrator

Execute ready beads using 3-agent model with MAF coordination + BDD discipline + BV intelligence.

Usage: /maf-bdd
```

**Verification:** Command file created

---

### Task 4: Create base state management module
**File:** `.claude/skills/maf-bdd-orchestrator/lib/state.py`
**Time:** 10 min

Implement coordinator state management:
```python
class CoordinatorState:
    def __init__(self):
        self.session_id = generate_uuid()
        self.started_at = datetime.now()
        self.beads_processed = {}
        self.escalation_context = {}
        self.groups_executed = 0
        self.progress = {"completed": 0, "failed": 0, "unblocked": 0}

    def record_attempt(self, bead_id, result):
        # Record implementation attempt

    def get_escalation_context(self, bead_id):
        # Get escalation context for retry

    def increment_progress(self, metric):
        # Update progress counters
```

**Verification:** Module imports, state can be created and persisted

---

## Phase 2: BV Integration (3 tasks)

### Task 5: Create BV integration module
**File:** `.claude/skills/maf-bdd-orchestrator/lib/bv.py`
**Time:** 10 min

Implement BV command wrappers:
```python
class BVIntegration:
    def robot_triage(self):
        """Run bv --robot-triage and parse output"""
        # Run command, parse JSON/output
        # Return prioritized bead list

    def blocker_analysis(self):
        """Run bv --blocked and find blockers"""
        # Run command, parse blocked beads
        # Return unblocking tasks

    def progress_dashboard(self):
        """Run bv --progress and display"""
        # Show current progress

    def retriage(self):
        """Refresh triage after group completion"""
        # Check for newly unblocked beads
```

**Verification:** Can run `bv --robot-triage` and parse results

---

### Task 6: Implement priority sorting
**File:** `.claude/skills/maf-bdd-orchestrator/lib/bv.py` (extend)
**Time:** 8 min

Add priority sorting logic:
```python
def sort_beads_by_priority(beads, triage_result):
    """Sort beads by BV triage priority"""
    priority_map = {
        "high": 0,
        "medium": 1,
        "low": 2
    }
    return sorted(beads, key=lambda b: priority_map.get(b.priority, 99))
```

**Verification:** Beads sort correctly by priority

---

### Task 7: Add progress tracking
**File:** `.claude/skills/maf-bdd-orchestrator/lib/bv.py` (extend)
**Time:** 5 min

Add progress display after each group:
```python
def show_progress(coordinator_state):
    """Display progress dashboard"""
    print(f"""
📊 Session Progress:
  Completed: {coordinator_state.progress['completed']} beads
  Failed: {coordinator_state.progress['failed']} beads
  Unblocked: {coordinator_state.progress['unblocked']} beads
  Groups executed: {coordinator_state.groups_executed}
""")
```

**Verification:** Progress displays after group completion

---

## Phase 3: Dependency Analysis (3 tasks)

### Task 8: Create dependency parser
**File:** `.claude/skills/maf-bdd-orchestrator/lib/deps.py`
**Time:** 15 min

Implement dependency parsing from bead descriptions:
```python
class DependencyParser:
    def parse_dependencies(self, bead):
        """Parse dependencies from bead description"""
        patterns = [
            r"Depends on:\s*([^\n]+)",
            r"Dependencies:\s*([^\n]+)",
            r"BLOCKED:\s*([^\n]+)",
            r"V\d+-T(\d+\.\d+)"  # Task numbering
        ]
        # Extract and return dependency list

    def build_dependency_graph(self, beads):
        """Build dependency graph from beads"""
        # Return {bead_id: [dep1, dep2, ...]}
```

**Verification:** Can parse "Depends on: V1-T1, V1-T4" correctly

---

### Task 9: Implement topological sort
**File:** `.claude/skills/maf-bdd-orchestrator/lib/deps.py` (extend)
**Time:** 10 min

Add topological sorting:
```python
def topological_sort(graph):
    """Sort beads by dependency order"""
    # Kahn's algorithm or DFS-based sort
    # Return sorted list
```

**Verification:** Beads sort in dependency order

---

### Task 10: Add group formation
**File:** `.claude/skills/maf-bdd-orchestrator/lib/deps.py` (extend)
**Time:** 10 min

Implement parallel-safe group formation:
```python
def form_execution_groups(sorted_beads):
    """Form groups that can execute in parallel"""
    groups = []
    current_group = []

    for bead in sorted_beads:
        if can_run_in_parallel(current_group + [bead]):
            current_group.append(bead)
        else:
            groups.append(current_group)
            current_group = [bead]

    if current_group:
        groups.append(current_group)

    return groups
```

**Verification:** Groups form correctly, no file conflicts within groups

---

## Phase 4: Escalation System (3 tasks)

### Task 11: Create escalation module
**File:** `.claude/skills/maf-bdd-orchestrator/lib/escalation.py`
**Time:** 10 min

Implement escalation context tracking:
```python
class EscalationManager:
    def __init__(self):
        self.escalation_context = {}

    def record_failure(self, bead_id, failure_reason):
        """Record failure and increment attempts"""
        if bead_id not in self.escalation_context:
            self.escalation_context[bead_id] = {
                "attempts": 0,
                "failure_reasons": [],
                "suggested_approach": None
            }

        context = self.escalation_context[bead_id]
        context["attempts"] += 1
        context["failure_reasons"].append(failure_reason)
        context["suggested_approach"] = self._suggest_approach(context)

    def get_context(self, bead_id):
        """Get escalation context for implementer"""
        return self.escalation_context.get(bead_id, {})

    def _suggest_approach(self, context):
        """Suggest approach based on attempt number"""
        attempts = context["attempts"]
        if attempts == 1:
            return "Review failure reason and adjust approach"
        elif attempts == 2:
            return "Try alternative architecture or pattern"
        else:
            return "May need bead revision - consider reopening with notes"
```

**Verification:** Escalation context updates on failures

---

### Task 12: Add failure analysis
**File:** `.claude/skills/maf-bdd-orchestrator/lib/escalation.py` (extend)
**Time:** 8 min

Add failure pattern analysis:
```python
def analyze_failure(failure_reason):
    """Analyze failure and suggest specific approach"""
    if "API incompatibility" in failure_reason:
        return "Try adding compatibility layer or adapter"
    elif "type mismatch" in failure_reason:
        return "Review type definitions and ensure consistency"
    elif "test failure" in failure_reason:
        return "Fix failing tests before proceeding"
    else:
        return "Review error and adjust implementation approach"
```

**Verification:** Failure analysis provides useful suggestions

---

### Task 13: Add max attempts check
**File:** `.claude/skills/maf-bdd-orchestrator/lib/escalation.py` (extend)
**Time:** 5 min

Add max attempts safeguard:
```python
def should_give_up(self, bead_id):
    """Check if bead should be given up on"""
    context = self.escalation_context.get(bead_id, {})
    return context.get("attempts", 0) >= 3
```

**Verification:** Returns True after 3 failed attempts

---

## Phase 5: Pre-flight Validation (2 tasks)

### Task 14: Create pre-flight check module
**File:** `.claude/skills/maf-bdd-orchestrator/lib/preflight.py`
**Time:** 10 min

Implement pre-flight validation:
```python
class PreFlightChecker:
    def check_all(self):
        """Run all pre-flight checks"""
        checks = {
            "git_clean": self._check_git_clean(),
            "branch_correct": self._check_branch(),
            "no_uncommitted": self._check_uncommitted(),
            "deps_installed": self._check_deps()
        }

        passed = all(checks.values())
        failed = [k for k, v in checks.items() if not v]

        return passed, failed

    def _check_git_clean(self):
        """Check if git is clean"""
        result = run_cmd("git status --porcelain")
        return result.stdout.strip() == ""

    def _check_branch(self):
        """Check if on correct branch"""
        result = run_cmd("git branch --show-current")
        return result.stdout.strip() == "main"

    def _check_uncommitted(self):
        """Check for uncommitted changes"""
        # Additional check beyond git clean
        pass

    def _check_deps(self):
        """Check if dependencies installed"""
        # Check node_modules, venv, etc.
        pass
```

**Verification:** All checks pass in clean environment

---

### Task 15: Add pre-flight report
**File:** `.claude/skills/maf-bdd-orchestrator/lib/preflight.py` (extend)
**Time:** 5 min

Add formatted reporting:
```python
def report(self, passed, failed):
    """Generate pre-flight report"""
    if passed:
        return "✅ All pre-flight checks passed"
    else:
        return f"❌ Pre-flight failed: {', '.join(failed)}"
```

**Verification:** Report displays correctly

---

## Phase 6: Prompt Templates (3 tasks)

### Task 16: Create implementer prompt template
**File:** `.claude/skills/maf-bdd-orchestrator/prompts/implementer.md`
**Time:** 15 min

Create implementer prompt:
```markdown
# Bead Implementation Task

You are implementing a single bead. Follow TDD workflow.

## Bead Details
- ID: {{bead_id}}
- Title: {{bead_title}}
- Description: {{bead_description}}
- Labels: {{bead_labels}}

## Escalation Context (if retry)
{{escalation_context}}

## Pre-flight Status
{{preflight_status}}

## Instructions
1. Read bead description carefully
2. Write failing tests first
3. Implement feature to pass tests
4. Self-review implementation
5. Commit changes
6. Report readiness for review

## Output Format
Return JSON:
{
  "status": "ready_for_review" | "failed",
  "commit_hash": "...",
  "files_changed": [...],
  "tests_run": N,
  "tests_passed": N,
  "self_review": "..."
}
```

**Verification:** Prompt template is valid and readable

---

### Task 17: Create reviewer prompt template
**File:** `.claude/skills/maf-bdd-orchestrator/prompts/reviewer.md`
**Time:** 15 min

Create reviewer prompt with two-stage review:
```markdown
# Bead Review Task

You are reviewing implementation of a bead. Perform two-stage review.

## Bead Details
- ID: {{bead_id}}
- Title: {{bead_title}}
- Description: {{bead_description}}

## Implementation
- Commit: {{commit_hash}}
- Diff: {{commit_diff}}
- Files: {{files_changed}}

## Implementer Note
{{implementer_note}}

## Stage 1: Spec Compliance
Did the implementation build EXACTLY what the bead describes?
- All requirements present?
- No extra features?
- No missing features?
- Edge cases covered?

## Stage 2: Code Quality
Is the implementation well-built?
- Follows project patterns?
- Tests cover functionality?
- Error handling appropriate?
- No security issues?
- Performance considerations?

## Output Format
Return JSON:
{
  "status": "approved" | "rejected",
  "stage1_spec_compliance": "passed" | "failed",
  "stage1_notes": "...",
  "stage2_code_quality": "passed" | "failed",
  "stage2_notes": "...",
  "feedback": "..."
}
```

**Verification:** Prompt template is valid and readable

---

### Task 18: Create coordinator prompt template
**File:** `.claude/skills/maf-bdd-orchestrator/prompts/coordinator.md`
**Time:** 10 min

Create coordinator prompt:
```markdown
# MAF-BDD Coordinator

You are the coordinator for autonomous bead execution.

## Your Role
Orchestrate 3-agent system: Coordinator (you) + Implementer + Reviewer

## Process
1. Run BV robot triage for priorities
2. Check for blockers
3. Get ready beads: bd ready --json
4. Analyze dependencies
5. Form execution groups
6. Sort by BV priority
7. For each group:
   - For each bead:
     - Pre-flight validation
     - Spawn implementer
     - Spawn reviewer
     - Close or reopen bead
   - Re-triage with BV
   - Show progress
8. Loop until no ready beads

## State Management
Track: beads processed, escalation context, progress

## Commands
bd ready, bd close, bd update
bv --robot-triage, bv --blocked, bv --progress

Execute autonomously until complete.
```

**Verification:** Prompt template is valid and readable

---

## Phase 7: Agent Lifecycle (3 tasks)

### Task 19: Create agent spawner module
**File:** `.claude/skills/maf-bdd-orchestrator/lib/spawner.py`
**Time:** 15 min

Implement agent spawn-and-kill lifecycle:
```python
import subprocess
import tempfile

class AgentSpawner:
    def spawn_implementer(self, bead, escalation_context, preflight_result):
        """Spawn fresh implementer for bead"""
        prompt = self._load_implementer_prompt(bead, escalation_context, preflight_result)

        with tempfile.NamedTemporaryFile(mode='w', suffix='.md') as f:
            f.write(prompt)
            f.flush()

            proc = subprocess.Popen([
                "claude",
                "--prompt-file", f.name,
                "--model", "sonnet"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            return proc

    def spawn_reviewer(self, bead, commit_info):
        """Spawn fresh reviewer for bead"""
        prompt = self._load_reviewer_prompt(bead, commit_info)

        with tempfile.NamedTemporaryFile(mode='w', suffix='.md') as f:
            f.write(prompt)
            f.flush()

            proc = subprocess.Popen([
                "claude",
                "--prompt-file", f.name,
                "--model", "sonnet"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            return proc

    def kill_agent(self, proc):
        """Kill agent process and free memory"""
        proc.kill()
        proc.wait()
        return True
```

**Verification:** Can spawn and kill agents successfully

---

### Task 20: Add prompt loading
**File:** `.claude/skills/maf-bdd-orchestrator/lib/spawner.py` (extend)
**Time:** 10 min

Add prompt template loading and rendering:
```python
def _load_implementer_prompt(self, bead, escalation_context, preflight_result):
    """Load and render implementer prompt"""
    template = self._read_template("prompts/implementer.md")

    return template.replace(
        "{{bead_id}}", bead.id
    ).replace(
        "{{bead_title}}", bead.title
    ).replace(
        "{{bead_description}}", bead.description
    ).replace(
        "{{escalation_context}}", json.dumps(escalation_context)
    ).replace(
        "{{preflight_status}}", json.dumps(preflight_result)
    )

def _read_template(self, path):
    """Read prompt template file"""
    with open(path) as f:
        return f.read()
```

**Verification:** Prompts render correctly with variables

---

### Task 21: Add result parsing
**File:** `.claude/skills/maf-bdd-orchestrator/lib/spawner.py` (extend)
**Time:** 10 min

Add result parsing from agent output:
```python
def parse_implementer_result(self, stdout):
    """Parse implementer JSON output"""
    # Extract JSON from stdout
    # Validate required fields
    # Return result dict
    pass

def parse_reviewer_result(self, stdout):
    """Parse reviewer JSON output"""
    # Extract JSON from stdout
    # Validate required fields
    # Return result dict
    pass
```

**Verification:** Can parse agent output JSON

---

## Phase 8: Main Coordinator Loop (3 tasks)

### Task 22: Create main coordinator
**File:** `.claude/skills/maf-bdd-orchestrator/lib/coordinator.py`
**Time:** 20 min

Implement main coordinator loop:
```python
class MAFBDDCoordinator:
    def __init__(self):
        self.state = CoordinatorState()
        self.bv = BVIntegration()
        self.deps = DependencyParser()
        self.escalation = EscalationManager()
        self.preflight = PreFlightChecker()
        self.spawner = AgentSpawner()

    def execute(self):
        """Main execution loop"""
        print("🚀 MAF-BDD Orchestrator Starting")

        # Initial BV triage
        triage = self.bv.robot_triage()
        blockers = self.bv.blocker_analysis()

        # Main loop
        while True:
            # Get ready beads
            ready_beads = self._get_ready_beads()

            if not ready_beads:
                print("✅ No more ready beads")
                break

            # Analyze dependencies
            groups = self.deps.form_execution_groups(ready_beads)

            # Sort by BV priority
            groups = self._sort_groups_by_priority(groups, triage)

            # Execute groups
            for group in groups:
                self._execute_group(group)

                # Re-triage
                triage = self.bv.retriage()

                # Show progress
                self.bv.show_progress(self.state)

        print("✅ Execution complete")

    def _get_ready_beads(self):
        """Get ready beads from bd command"""
        result = run_cmd("bd ready --json --limit 50")
        return json.loads(result.stdout)

    def _sort_groups_by_priority(self, groups, triage):
        """Sort groups by BV priority"""
        # Implement priority sorting
        pass

    def _execute_group(self, group):
        """Execute a group of beads"""
        for bead in sorted(group, key=self._priority_key):
            self._execute_bead(bead)

        self.state.groups_executed += 1

    def _execute_bead(self, bead):
        """Execute a single bead"""
        print(f"🎯 Executing {bead['id']} - {bead['title']}")

        # Pre-flight
        passed, failed = self.preflight.check_all()
        if not passed:
            print(f"❌ Pre-flight failed: {failed}")
            return

        # Spawn implementer
        escalation_context = self.escalation.get_context(bead['id'])
        impl_proc = self.spawner.spawn_implementer(bead, escalation_context, passed)

        # Wait for completion
        impl_result = self.spawner.wait_for_result(impl_proc)
        self.spawner.kill_agent(impl_proc)

        if impl_result['status'] == 'failed':
            self.escalation.record_failure(bead['id'], impl_result.get('error'))
            self.state.progress['failed'] += 1
            return

        # Spawn reviewer
        review_proc = self.spawner.spawn_reviewer(bead, impl_result)
        review_result = self.spawner.wait_for_result(review_proc)
        self.spawner.kill_agent(review_proc)

        # Handle review decision
        if review_result['status'] == 'approved':
            run_cmd(f"bd close {bead['id']}")
            self.state.progress['completed'] += 1
            print(f"✅ Closed {bead['id']}")
        else:
            run_cmd(f"bd update {bead['id']} --status=reopen --notes='{review_result['feedback']}'")
            print(f"🔄 Reopened {bead['id']}")
```

**Verification:** Coordinator can execute loop end-to-end

---

### Task 23: Add graceful shutdown
**File:** `.claude/skills/maf-bdd-orchestrator/lib/coordinator.py` (extend)
**Time:** 8 min

Add graceful shutdown handling:
```python
def shutdown(self):
    """Graceful shutdown - kill all agents"""
    # Kill any running agents
    # Save state
    # Print summary
    pass
```

**Verification:** Shutdown cleans up all processes

---

### Task 24: Add error handling
**File:** `.claude/skills/maf-bdd-orchestrator/lib/coordinator.py` (extend)
**Time:** 10 min

Add comprehensive error handling:
```python
def _execute_bead_safe(self, bead):
    """Execute bead with error handling"""
    try:
        self._execute_bead(bead)
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {e}")
        self.escalation.record_failure(bead['id'], str(e))
    except json.JSONDecodeError as e:
        print(f"❌ JSON parse failed: {e}")
        self.escalation.record_failure(bead['id'], "Invalid output")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        self.escalation.record_failure(bead['id'], str(e))
```

**Verification:** Errors are caught and handled gracefully

---

## Phase 9: Integration & Testing (3 tasks)

### Task 25: Update skill.md with full documentation
**File:** `.claude/skills/maf-bdd-orchestrator/skill.md`
**Time:** 15 min

Complete skill documentation:
- When to use
- The process (with diagrams)
- Components
- Prompt templates
- Commands
- Red flags
- Integration
- Examples

**Verification:** Skill is complete and well-documented

---

### Task 26: Create test beads for validation
**File:** `test/maf-bdd-test-beads.md`
**Time:** 10 min

Create test bead scenarios:
- Simple independent bead
- Bead with dependencies
- Bead that needs escalation

**Verification:** Test beads cover main scenarios

---

### Task 27: End-to-end integration test
**Test:** Run coordinator on test beads
**Time:** 15 min

Execute full workflow:
1. Create test beads
2. Run `/maf-bdd`
3. Verify all beads executed
4. Verify proper review gates
5. Verify escalation on failures
6. Verify progress dashboard

**Verification:** All tests pass

---

## Phase 10: Documentation (2 tasks)

### Task 28: Create user guide
**File:** `docs/maf-bdd-user-guide.md`
**Time:** 15 min

Create user documentation:
- Quick start
- Common workflows
- Troubleshooting
- Best practices

**Verification:** Guide is clear and complete

---

### Task 29: Update design doc with implementation notes
**File:** `docs/plans/2026-01-26-maf-bdd-lightweight-orchestrator-design.md`
**Time:** 10 min

Add implementation notes to design doc:
- Actual implementation decisions
- Deviations from design
- Lessons learned

**Verification:** Design doc is updated

---

## Summary

**Total tasks:** 29
**Estimated time:** ~5-6 hours of focused work

**Execution order:**
1. Phase 1: Foundation (Task 1-4)
2. Phase 2-3: BV + Deps (Task 5-10) - can parallelize
3. Phase 4-5: Escalation + Pre-flight (Task 11-15) - can parallelize
4. Phase 6: Prompts (Task 16-18) - depends on earlier phases
5. Phase 7: Spawner (Task 19-21)
6. Phase 8: Coordinator (Task 22-24) - integration point
7. Phase 9-10: Testing + Docs (Task 25-29)

**Dependencies:**
- Tasks 1-4 must be first
- Tasks 22-24 require all previous phases
- All other tasks can be done in parallel within phases

**Next action:** Start with Task 1 (Create skill directory structure)
