# Generic Autonomous Workflow Implementation Plan

**Date:** 2026-01-27
**Status:** Ready for Implementation
**Methodology:** Test-Driven Development (TDD)

## Overview

Transform `experiments/autonomous-workflow-nextnest.sh` into a generic `autonomous-workflow.sh` with franchisee customization hooks. Remove NextNest-specific assumptions while enabling franchisees to extend behavior via `.maf/config/custom-workflow-hooks.sh`.

## Objectives

1. **Genericize the workflow** - Remove hardcoded NextNest assumptions (agent names, paths, project-specific logic)
2. **Add 8 customization hooks** - Enable franchisees to extend behavior without modifying MAF core
3. **Maintain backward compatibility** - Support both subtree and direct MAF layouts
4. **Follow TDD methodology** - Write failing tests first, then implement
5. **Zero regression** - All existing tests must pass

## TDD Principles

- **RED**: Write failing test first (watch it fail for expected reason)
- **GREEN**: Write minimal code to pass
- **REFACTOR**: Clean up while keeping tests green
- **NO EXCEPTIONS**: Production code without failing test first = delete and start over

## Architecture

```
experiments/
├── autonomous-workflow.sh              # Generic workflow (renamed)
└── nextnest-customizations.sh         # NextNest-specific overrides (optional)

maf/scripts/maf/
├── autonomous-workflow.sh              # Same file (subtree compatibility)
└── templates/
    └── custom-workflow-hooks.sh.template

.maf/config/
├── custom-workflow-hooks.sh            # Franchisee customizations
└── custom-workflow-hooks.sh.template   # Template with examples

tests/workflow/
├── test-hooks.sh                       # Hook system tests
├── test-generic-workflow.sh            # Generic workflow tests
└── fixtures/
    ├── custom-hooks-example.sh         # Example custom hooks for testing
    └── agent-topology-test.json        # Test topology
```

## Tasks

### Phase 0: Test Infrastructure Setup

#### Task 0.1: Create Test Framework
**Description:** Create bash test framework for workflow hooks
**File:** `tests/workflow/test-hooks.sh`
**TDD Approach:**
- RED: Write test for hook loading mechanism
- GREEN: Implement hook sourcing
- REFACTOR: Extract test helpers

**Tests to write:**
```bash
# Test: Hook file exists and is sourced
test_hook_file_sourced() {
    # Setup: Create temporary hook file
    # Execute: Source workflow script
    # Assert: CUSTOM_HOOK_BEFORE_LOOP function exists
}

# Test: Hook function can be called
test_hook_function_callable() {
    # Setup: Define hook in temp file
    # Execute: Call hook function
    # Assert: Hook execution detected
}

# Test: Missing hook file doesn't crash
test_missing_hook_file_graceful() {
    # Setup: Remove hook file
    # Execute: Source workflow script
    # Assert: No error, workflow continues
}
```

**Acceptance:**
- [ ] Test framework created with `bats` or bash test framework
- [ ] Can create temporary test fixtures
- [ ] Can mock tmux and Agent Mail for testing
- [ ] All test setup tests pass

---

#### Task 0.2: Create Test Fixtures
**Description:** Create test fixtures for topology, hooks, and mock agents
**Files:**
- `tests/workflow/fixtures/custom-hooks-example.sh`
- `tests/workflow/fixtures/agent-topology-test.json`
- `tests/workflow/fixtures/mock-tmux.sh`

**TDD Approach:**
- RED: Write test expecting fixture to load
- GREEN: Create fixture files
- REFACTOR: Extract common fixture patterns

**Tests to write:**
```bash
# Test: Test topology has required fields
test_topology_fixture_valid() {
    # Execute: Load test topology
    # Assert: Has topology_name, description, panes array
    # Assert: Each pane has mail_name field
}

# Test: Custom hooks example has all 8 hooks
test_custom_hooks_complete() {
    # Execute: Source custom hooks example
    # Assert: All 8 hook functions defined
    # Assert: Each hook returns appropriate exit code
}
```

**Acceptance:**
- [ ] Test topology with 4 panes (supervisor, reviewer, implementer-1, implementer-2)
- [ ] Custom hooks example with all 8 hooks (minimal implementations)
- [ ] Mock tmux script for testing pane capture
- [ ] All fixture tests pass

---

### Phase 1: Core Hook System

#### Task 1.1: Implement Hook Sourcing Mechanism
**Description:** Add hook file sourcing to autonomous-workflow.sh
**File:** `experiments/autonomous-workflow.sh` (line ~16, after preflight)

**TDD Approach:**
- RED: Write test expecting hook file to be sourced
- GREEN: Implement hook sourcing logic
- REFACTOR: Extract path detection into helper

**Tests to write:**
```bash
# Test: Hook file sourced when exists
test_hook_file_sourced() {
    # Setup: Create .maf/config/custom-workflow-hooks.sh
    # Execute: Source autonomous-workflow.sh
    # Assert: CUSTOM_HOOK_BEFORE_LOOP is defined
    # Teardown: Remove hook file
}

# Test: Hook file not sourced when missing
test_hook_file_optional() {
    # Setup: Ensure no hook file exists
    # Execute: Source autonomous-workflow.sh
    # Assert: No error, script continues
}

# Test: Hook file sourced from both layouts
test_hook_file_both_layouts() {
    # Setup: Create hook file in .maf/config/
    # Execute: Source from experiments/ path
    # Assert: Hook file found and sourced
    # Setup: Create hook file in alternative path
    # Execute: Source from maf/scripts/maf/ path
    # Assert: Hook file found and sourced
}
```

**Implementation (GREEN):**
```bash
# After preflight_init (line ~16)
# Source franchisee custom hooks if present
CUSTOM_HOOKS_FILE="${PROJECT_ROOT}/.maf/config/custom-workflow-hooks.sh"
if [[ -f "$CUSTOM_HOOKS_FILE" ]]; then
    source "$CUSTOM_HOOKS_FILE"
    log "Loaded custom workflow hooks from $CUSTOM_HOOKS_FILE"
fi
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Implementation passes test (GREEN)
- [ ] Works in both subtree and direct layouts
- [ ] Missing hook file doesn't cause error
- [ ] Hook file sourced after preflight validation

---

#### Task 1.2: Implement Hook 1 - BEFORE_LOOP
**Description:** Add CUSTOM_HOOK_BEFORE_LOOP invocation
**File:** `experiments/autonomous-workflow.sh` (in autonomous_loop, line ~554)

**TDD Approach:**
- RED: Write test expecting hook to be called
- GREEN: Add hook invocation with error handling
- REFACTOR: Extract hook invocation pattern

**Tests to write:**
```bash
# Test: BEFORE_LOOP hook called before main loop
test_before_loop_hook_called() {
    # Setup: Create hook file with tracking variable
    # Execute: Run autonomous_loop (once mode)
    # Assert: Hook was called (tracking variable set)
}

# Test: BEFORE_LOOP hook aborts workflow on return 2
test_before_loop_hook_abort() {
    # Setup: Create hook file that returns 2
    # Execute: Run autonomous_loop
    # Assert: Workflow aborted, loop not entered
}

# Test: BEFORE_LOOP hook continues on return 0
test_before_loop_hook_continue() {
    # Setup: Create hook file that returns 0
    # Execute: Run autonomous_loop
    # Assert: Workflow continued normally
}
```

**Implementation (GREEN):**
```bash
autonomous_loop() {
    local iteration=0

    log "Starting autonomous workflow loop..."

    # Call franchisee hook before starting loop
    if declare -f CUSTOM_HOOK_BEFORE_LOOP >/dev/null; then
        if ! CUSTOM_HOOK_BEFORE_LOOP; then
            local exit_code=$?
            if [[ $exit_code -eq 2 ]]; then
                log "CUSTOM_HOOK_BEFORE_LOOP requested abort"
                return 2
            fi
        fi
    fi

    # Run initial audit before starting work
    log "Running initial bead audit..."
    audit_closed_beads

    # ... rest of loop
}
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Hook called at correct point (after loop start, before initial audit)
- [ ] Return code 0: continues workflow
- [ ] Return code 2: aborts workflow
- [ ] Hook execution logged

---

#### Task 1.3: Implement Hook 2 - BEFORE_CHECK
**Description:** Add CUSTOM_HOOK_BEFORE_CHECK invocation
**File:** `experiments/autonomous-workflow.sh` (in autonomous_loop, before check_agents)

**TDD Approach:**
- RED: Write test expecting hook to be called each iteration
- GREEN: Add hook invocation with iteration parameter
- REFACTOR: Extract parameter passing pattern

**Tests to write:**
```bash
# Test: BEFORE_CHECK hook called each iteration
test_before_check_hook_called() {
    # Setup: Create hook file that logs calls
    # Execute: Run 3 iterations
    # Assert: Hook called 3 times with correct iteration numbers
}

# Test: BEFORE_CHECK hook can skip agent checks
test_before_check_hook_skip() {
    # Setup: Create hook file that returns 1
    # Execute: Run one iteration
    # Assert: check_agents not called
}

# Test: BEFORE_CHECK hook receives iteration and status
test_before_check_hook_parameters() {
    # Setup: Create hook file that captures parameters
    # Execute: Run iteration
    # Assert: Hook received correct iteration number and last status
}
```

**Implementation (GREEN):**
```bash
# In autonomous_loop, before check_agents (line ~588)
    # Call franchisee hook before checking agents
    local hook_status=0
    if declare -f CUSTOM_HOOK_BEFORE_CHECK >/dev/null; then
        CUSTOM_HOOK_BEFORE_CHECK "$iteration" "$last_assign_status"
        hook_status=$?
        if [[ $hook_status -eq 1 ]]; then
            log "CUSTOM_HOOK_BEFORE_CHECK requested skip"
            continue
        fi
    fi

    check_agents
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Hook called before each check_agents call
- [ ] Receives iteration number and last assign status
- [ ] Return 0: continues to agent checks
- [ ] Return 1: skips agent checks this iteration

---

#### Task 1.4: Implement Hook 3 - BEFORE_ASSIGN
**Description:** Add CUSTOM_HOOK_BEFORE_ASSIGN invocation
**File:** `experiments/autonomous-workflow.sh` (in assign_beads, before agent selection)

**TDD Approach:**
- RED: Write test expecting hook to filter beads
- GREEN: Add hook invocation with bead_id parameter
- REFACTOR: Extract bead filtering logic

**Tests to write:**
```bash
# Test: BEFORE_ASSIGN hook called with bead_id
test_before_assign_hook_called() {
    # Setup: Create hook file that logs bead_ids
    # Execute: Assign bead
    # Assert: Hook called with correct bead_id
}

# Test: BEFORE_ASSIGN hook can skip bead
test_before_assign_hook_skip() {
    # Setup: Create hook file that returns 1 for specific bead
    # Execute: Try to assign that bead
    # Assert: Bead skipped, next bead considered
}

# Test: BEFORE_ASSIGN hook receives ready beads list
test_before_assign_hook_parameters() {
    # Setup: Create hook file that captures parameters
    # Execute: Assign bead
    # Assert: Hook received bead_id and ready beads JSON
}
```

**Implementation (GREEN):**
```bash
# In assign_beads, after finding assigned_bead (line ~277)
  # Call franchisee hook before assigning
  if declare -f CUSTOM_HOOK_BEFORE_ASSIGN >/dev/null; then
    CUSTOM_HOOK_BEFORE_ASSIGN "$assigned_bead" "$beads"
    local hook_result=$?
    if [[ $hook_result -eq 1 ]]; then
      log "CUSTOM_HOOK_BEFORE_ASSIGN skipped $assigned_bead"
      continue  # Skip to next bead
    elif [[ $hook_result -eq 2 ]]; then
      log "CUSTOM_HOOK_BEFORE_ASSIGN aborted all assignments"
      return 1
    fi
  fi
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Hook called with bead_id and ready_beads JSON
- [ ] Return 0: continues assignment
- [ ] Return 1: skips this bead
- [ ] Return 2: aborts all assignments

---

#### Task 1.5: Implement Hook 4 - AFTER_ASSIGN
**Description:** Add CUSTOM_HOOK_AFTER_ASSIGN invocation
**File:** `experiments/autonomous-workflow.sh` (in assign_beads, after assignment complete)

**TDD Approach:**
- RED: Write test expecting hook to be called after assignment
- GREEN: Add hook invocation with assignment details
- REFACTOR: Extract assignment logging pattern

**Tests to write:**
```bash
# Test: AFTER_ASSIGN hook called after successful assignment
test_after_assign_hook_called() {
    # Setup: Create hook file that captures calls
    # Execute: Assign bead
    # Assert: Hook called with bead_id, agent_name, pane, skill
}

# Test: AFTER_ASSIGN hook failure triggers rollback
test_after_assign_hook_rollback() {
    # Setup: Create hook file that returns 1
    # Execute: Assign bead
    # Assert: Assignment rolled back (bead not marked as assigned)
}

# Test: AFTER_ASSIGN hook receives correct parameters
test_after_assign_hook_parameters() {
    # Setup: Create hook file that captures parameters
    # Execute: Assign bead to specific pane
    # Assert: Hook received correct bead_id, agent_name, pane, skill_instruction
}
```

**Implementation (GREEN):**
```bash
# In assign_beads, after assignment complete (line ~337)
  # Call franchisee hook after successful assignment
  if declare -f CUSTOM_HOOK_AFTER_ASSIGN >/dev/null; then
    if ! CUSTOM_HOOK_AFTER_ASSIGN "$assigned_bead" "$target_agent" "$target_pane" "$skill_instruction"; then
      log "CUSTOM_HOOK_AFTER_ASSIGN failed, rolling back $assigned_bead"
      # Remove from tracking file to allow reassignment
      sed -i "/^${assigned_bead} /d" "$tracking_file"
      return 1
    fi
  fi
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Hook called after successful assignment
- [ ] Receives bead_id, agent_name, pane, skill_instruction
- [ ] Return 0: assignment confirmed
- [ ] Return non-zero: triggers rollback

---

#### Task 1.6: Implement Hook 5 - CUSTOM_BEAD
**Description:** Add CUSTOM_HOOK_CUSTOM_BEAD invocation
**File:** `experiments/autonomous-workflow.sh` (in assign_beads, before skill selection)

**TDD Approach:**
- RED: Write test expecting hook to handle custom bead types
- GREEN: Add hook invocation with bead metadata
- REFACTOR: Extract bead type detection

**Tests to write:**
```bash
# Test: CUSTOM_BEAD hook can handle bead type
test_custom_bead_hook_handled() {
    # Setup: Create hook file that returns 0 for specific label
    # Execute: Assign bead with that label
    # Assert: Hook handled it (default assignment skipped)
}

# Test: CUSTOM_BEAD hook falls through to default
test_custom_bead_hook_fallback() {
    # Setup: Create hook file that returns 1
    # Execute: Assign bead
    # Assert: Default assignment logic used
}

# Test: CUSTOM_BEAD hook receives bead metadata
test_custom_bead_hook_parameters() {
    # Setup: Create hook file that captures parameters
    # Execute: Call hook with bead
    # Assert: Hook received bead_id, title, labels
}
```

**Implementation (GREEN):**
```bash
# In assign_beads, after selecting agent (line ~310)
  # Check if franchisee wants to handle this bead type
  local bead_info
  bead_info="$(bd show "$assigned_bead" 2>/dev/null || true)"
  local bead_title
  bead_title="$(echo "$bead_info" | head -1 || true)"
  local bead_labels='[]'  # Would parse from bead info if available

  if declare -f CUSTOM_HOOK_CUSTOM_BEAD >/dev/null; then
    if CUSTOM_HOOK_CUSTOM_BEAD "$assigned_bead" "$bead_title" "$bead_labels"; then
      log "CUSTOM_HOOK_CUSTOM_BEAD handled $assigned_bead"
      return 0  # Hook handled it, skip default assignment
    fi
  fi

  # Continue with default skill selection
  local skill_instruction
  if echo "$assigned_bead" | grep -qE "om2|event.*sourced|ratebook.*v2"; then
    # ...
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Hook called with bead_id, title, labels
- [ ] Return 0: hook handled bead, skip default
- [ ] Return 1: use default assignment logic

---

#### Task 1.7: Implement Hook 6 - AGENT_PROMPT
**Description:** Add CUSTOM_HOOK_AGENT_PROMPT invocation
**File:** `experiments/autonomous-workflow.sh` (in prompt_agent, before sending keys)

**TDD Approach:**
- RED: Write test expecting hook to modify commands
- GREEN: Add hook invocation with command transformation
- REFACTOR: Extract command sanitization

**Tests to write:**
```bash
# Test: AGENT_PROMPT hook can modify command
test_agent_prompt_hook_modified() {
    # Setup: Create hook file that adds --debug flag
    # Execute: Prompt agent with command
    # Assert: Command modified with --debug
}

# Test: AGENT_PROMPT hook can pass through unchanged
test_agent_prompt_hook_passthrough() {
    # Setup: Create hook file that echoes original command
    # Execute: Prompt agent with command
    # Assert: Command sent unchanged
}

# Test: AGENT_PROMPT hook receives pane and command
test_agent_prompt_hook_parameters() {
    # Setup: Create hook file that captures parameters
    # Execute: Prompt agent
    # Assert: Hook received pane number and original command
}
```

**Implementation (GREEN):**
```bash
# In prompt_agent, before sending keys (line ~185)
prompt_agent() {
  local pane="$1"
  local message="$2"

  # Allow franchisee to modify command
  local final_message="$message"
  if declare -f CUSTOM_HOOK_AGENT_PROMPT >/dev/null; then
    final_message=$(CUSTOM_HOOK_AGENT_PROMPT "$pane" "$message")
  fi

  # Clear any pending input
  tmux send-keys -t "$pane_full" C-c C-u 2>/dev/null || true
  sleep 0.1

  # Send the (possibly modified) command
  tmux send-keys -t "$pane_full" -l "$final_message"
  sleep 0.2
  tmux send-keys -t "$pane_full" Enter
  sleep 0.5
}
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Hook called with pane and original command
- [ ] Hook output used as final command
- [ ] Empty output falls back to original command

---

#### Task 1.8: Implement Hook 7 - AFTER_CHECK
**Description:** Add CUSTOM_HOOK_AFTER_CHECK invocation
**File:** `experiments/autonomous-workflow.sh` (in autonomous_loop, after check_agents)

**TDD Approach:**
- RED: Write test expecting hook to respond to blocked agents
- GREEN: Add hook invocation with blocked agents list
- REFACTOR: Extract blocked agent formatting

**Tests to write:**
```bash
# Test: AFTER_CHECK hook called with blocked agents
test_after_check_hook_called() {
    # Setup: Create scenario with blocked agent
    # Execute: Run iteration with blocked agent
    # Assert: Hook called with blocked agents list
}

# Test: AFTER_CHECK hook can abort workflow
test_after_check_hook_abort() {
    # Setup: Create hook file that returns 2
    # Execute: Run iteration with blocked agent
    # Assert: Workflow aborted
}

# Test: AFTER_CHECK hook receives iteration and blocked list
test_after_check_hook_parameters() {
    # Setup: Create hook file that captures parameters
    # Execute: Run iteration
    # Assert: Hook received iteration number and blocked agents JSON
}
```

**Implementation (GREEN):**
```bash
# In autonomous_loop, after check_agents (line ~588)
    check_agents

    # Call franchisee hook after checking agents
    local blocked_agents_json='[]'  # Would populate from check_agents output
    if declare -f CUSTOM_HOOK_AFTER_CHECK >/dev/null; then
        if ! CUSTOM_HOOK_AFTER_CHECK "$iteration" "$blocked_agents_json"; then
            local abort_code=$?
            if [[ $abort_code -eq 2 ]]; then
                log "CUSTOM_HOOK_AFTER_CHECK requested abort"
                break
            fi
        fi
    fi
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Hook called after agent status checks
- [ ] Receives iteration number and blocked agents JSON
- [ ] Return 0: continue loop
- [ ] Return 2: abort loop

---

#### Task 1.9: Implement Hook 8 - ERROR_HANDLER
**Description:** Add CUSTOM_HOOK_ERROR_HANDLER with error trap
**File:** `experiments/autonomous-workflow.sh` (wrap autonomous_loop with trap)

**TDD Approach:**
- RED: Write test expecting error handler to be called
- GREEN: Add error trap with hook invocation
- REFACTOR: Extract error formatting

**Tests to write:**
```bash
# Test: ERROR_HANDLER hook called on error
test_error_handler_hook_called() {
    # Setup: Create hook file that tracks errors
    # Execute: Trigger error in workflow
    # Assert: Hook called with error details
}

# Test: ERROR_HANDLER hook can continue after error
test_error_handler_hook_continue() {
    # Setup: Create hook file that returns 0
    # Execute: Trigger error in workflow
    # Assert: Workflow continued (didn't abort)
}

# Test: ERROR_HANDLER hook receives error details
test_error_handler_hook_parameters() {
    # Setup: Create hook file that captures parameters
    # Execute: Trigger error
    # Assert: Hook received line number, message, context
}
```

**Implementation (GREEN):**
```bash
# At start of autonomous_loop function (line ~551)
autonomous_loop() {
    # Set error trap for custom error handling
    trap '{
        local exit_code=$?
        local line_number=$1
        local error_message="$2"
        CUSTOM_HOOK_ERROR_HANDLER "$line_number" "$error_message" "autonomous_loop" || true
    }' ERR

    local iteration=0
    # ... rest of function
}
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Error trap installed before loop starts
- [ ] Hook called with line number, error message, context
- [ ] Return 0: continue loop (attempt recovery)
- [ ] Return 1: abort loop
- [ ] Return 2: restart loop

---

### Phase 2: Genericization

#### Task 2.1: Remove Hardcoded Agent Names
**Description:** Replace hardcoded agent name mappings with topology-based lookups
**File:** `experiments/autonomous-workflow.sh` (get_agent_name_for_pane function)

**TDD Approach:**
- RED: Write test expecting agent names from topology
- GREEN: Replace hardcoded case statement with get_agent_name_by_pane call
- REFACTOR: Remove function entirely (use topology helper directly)

**Tests to write:**
```bash
# Test: Agent names come from topology
test_agent_names_from_topology() {
    # Setup: Create topology with custom agent names
    # Execute: Get agent name for pane 2
    # Assert: Returns name from topology, not hardcoded
}

# Test: Topology changes reflect immediately
test_agent_names_dynamic() {
    # Setup: Create initial topology
    # Execute: Get agent name
    # Assert: Returns initial name
    # Setup: Modify topology
    # Execute: Get agent name again
    # Assert: Returns new name (not cached)
}
```

**Implementation (GREEN):**
```bash
# Replace get_agent_name_for_pane function (lines 191-199)
# Before:
get_agent_name_for_pane() {
  case "$1" in
    0) echo "RateRidge" ;;
    1) echo "AuditBay" ;;
    2) echo "LedgerLeap" ;;
    3) echo "PrimePortal" ;;
    *) echo "Unknown" ;;
  esac
}

# After:
get_agent_name_for_pane() {
  get_agent_name_by_pane "$1"
}
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Agent names come from topology file
- [ ] No hardcoded agent names remain
- [ ] Works with any topology configuration

---

#### Task 2.2: Remove NextNest-Specific Paths
**Description:** Replace hardcoded NextNest paths with generic PROJECT_ROOT
**File:** `experiments/autonomous-workflow.sh`

**TDD Approach:**
- RED: Write test expecting paths to use PROJECT_ROOT
- GREEN: Replace hardcoded paths with PROJECT_ROOT variable
- REFACTOR: Extract path constants

**Tests to write:**
```bash
# Test: Workflow uses PROJECT_ROOT for all paths
test_paths_use_project_root() {
    # Setup: Set PROJECT_ROOT to test directory
    # Execute: Run workflow
    # Assert: All file operations use PROJECT_ROOT
}

# Test: Workflow works in different project roots
test_different_project_roots() {
    # Setup: Create project in /tmp/test-project
    # Execute: Run workflow from that directory
    # Assert: Workflow operates on /tmp/test-project
}
```

**Implementation (GREEN):**
```bash
# Replace hardcoded path (line 80)
# Before:
AGENT_MAIL_PROJECT="${AGENT_MAIL_PROJECT:-/root/projects/nextnest}"

# After:
AGENT_MAIL_PROJECT="${AGENT_MAIL_PROJECT:-$PROJECT_ROOT}"
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] All paths use PROJECT_ROOT variable
- [ ] No hardcoded /root/projects/nextnest references
- [ ] Works in any project directory

---

#### Task 2.3: Remove NextNest-Specific Skill Logic
**Description:** Make skill selection generic (based on bead labels, not hardcoded patterns)
**File:** `experiments/autonomous-workflow.sh` (skill selection in assign_beads)

**TDD Approach:**
- RED: Write test expecting configurable skill selection
- GREEN: Replace hardcoded skill patterns with hook-based selection
- REFACTOR: Extract skill selection to helper function

**Tests to write:**
```bash
# Test: Skill selection uses hook when available
test_skill_selection_hook() {
    # Setup: Create hook that returns custom skill
    # Execute: Assign bead
    # Assert: Hook's skill used
}

# Test: Skill selection falls back to default
test_skill_selection_default() {
    # Setup: No hook defined
    # Execute: Assign bead
    # Assert: Default skill used
}
```

**Implementation (GREEN):**
```bash
# Replace hardcoded skill selection (lines 312-317)
# Before:
if echo "$assigned_bead" | grep -qE "om2|event.*sourced|ratebook.*v2"; then
    skill_instruction="Skill(subagent-driven-development) for bead $assigned_bead"
else
    skill_instruction="/response-awareness implement bead $assigned_bead"
fi

# After:
skill_instruction="/response-awareness implement bead $assigned_bead"
if declare -f CUSTOM_HOOK_SELECT_SKILL >/dev/null; then
    skill_instruction=$(CUSTOM_HOOK_SELECT_SKILL "$assigned_bead")
fi
```

**Acceptance:**
- [ ] Test fails before implementation (RED)
- [ ] Skill selection customizable via hook
- [ ] Default behavior preserved when hook not defined
- [ ] No NextNest-specific patterns hardcoded

---

### Phase 3: Documentation

#### Task 3.1: Create Hook Template File
**Description:** Create comprehensive template with all 8 hooks and examples
**File:** `maf/templates/custom-workflow-hooks.sh.template`

**TDD Approach:**
- RED: Write test expecting template to be valid bash
- GREEN: Create template file with all hooks
- REFACTOR: Extract common documentation sections

**Tests to write:**
```bash
# Test: Template file is valid bash
test_template_valid_bash() {
    # Execute: bash -n template file
    # Assert: No syntax errors
}

# Test: Template has all 8 hooks
test_template_complete() {
    # Execute: Source template file
    # Assert: All 8 hook functions defined
}

# Test: Template examples are executable
test_template_examples_executable() {
    # Setup: Source template
    # Execute: Call each hook function
    # Assert: All hooks return without error
}
```

**Implementation (GREEN):**
- Create template with:
  - Header documentation
  - All 8 hook functions with docstrings
  - 3-4 working examples per hook
  - Helper functions section
  - Test harness for standalone execution

**Acceptance:**
- [ ] Template is valid bash syntax
- [ ] All 8 hooks documented with examples
- [ ] Template can be executed directly for testing
- [ ] Examples cover common use cases

---

#### Task 3.2: Create NextNest Customizations Example
**Description:** Create NextNest-specific customizations showing migration path
**File:** `experiments/nextnest-customizations.sh`

**TDD Approach:**
- RED: Write test expecting NextNest customizations to work
- GREEN: Create customizations file with NextNest logic
- REFACTOR: Extract NextNest-specific patterns

**Tests to write:**
```bash
# Test: NextNest customizations preserve existing behavior
test_nextnest_behavior_preserved() {
    # Setup: Source nextnest-customizations.sh
    # Execute: Run workflow
    # Assert: Behavior matches original autonomous-workflow-nextnest.sh
}

# Test: NextNest customizations use hooks correctly
test_nextnest_hooks_correct() {
    # Setup: Source nextnest-customizations.sh
    # Execute: Check hook definitions
    # Assert: Hooks use correct signatures and return codes
}
```

**Implementation (GREEN):**
- Create customizations with:
  - NextNest agent name mappings (if needed)
  - NextNest skill selection logic
  - NextNest-specific paths
  - Any other NextNest-specific behavior

**Acceptance:**
- [ ] Customizations file is valid bash
- [ ] All hooks used correctly
- [ ] Behavior matches original NextNest workflow
- [ ] Documented as example for other franchisees

---

### Phase 4: Integration & Testing

#### Task 4.1: Update VENDOR_ARCHITECTURE.md
**Description:** Document hook system in VENDOR_ARCHITECTURE.md
**File:** `docs/VENDOR_ARCHITECTURE.md`

**TDD Approach:**
- RED: Write test expecting documentation to be accurate
- GREEN: Add documentation section
- REFACTOR: Extract common documentation patterns

**Tests to write:**
```bash
# Test: Documentation mentions all 8 hooks
test_docs_complete() {
    # Execute: Extract hook names from docs
    # Assert: All 8 hooks mentioned
}

# Test: Documentation examples are accurate
test_docs_examples_accurate() {
    # Setup: Extract example from docs
    # Execute: Run example
    # Assert: Example works as documented
}
```

**Implementation (GREEN):**
- Add section: "Workflow Customization Hooks"
- Document all 8 hooks with:
  - Purpose
  - When called
  - Parameters
  - Return codes
  - Examples

**Acceptance:**
- [ ] All 8 hooks documented
- [ ] Examples are accurate and tested
- [ ] Hook system architecture explained
- [ ] Migration path from old workflow documented

---

#### Task 4.2: Copy to Subtree Location
**Description:** Copy generic workflow to maf/scripts/maf/ for subtree compatibility
**File:** `maf/scripts/maf/autonomous-workflow.sh`

**TDD Approach:**
- RED: Write test expecting both files to be identical
- GREEN: Copy file and verify
- REFACTOR: N/A (files should remain identical)

**Tests to write:**
```bash
# Test: Both workflow files are identical
test_workflow_files_identical() {
    # Execute: diff experiments/autonomous-workflow.sh maf/scripts/maf/autonomous-workflow.sh
    # Assert: No differences
}

# Test: Workflow works from both locations
test_workflow_both_locations() {
    # Setup: Run from experiments/ location
    # Execute: Source and run workflow
    # Assert: Works correctly
    # Setup: Run from maf/scripts/maf/ location
    # Execute: Source and run workflow
    # Assert: Works correctly
}
```

**Implementation (GREEN):**
```bash
# Copy file
cp experiments/autonomous-workflow.sh maf/scripts/maf/autonomous-workflow.sh

# Verify copy
diff experiments/autonomous-workflow.sh maf/scripts/maf/autonomous-workflow.sh
```

**Acceptance:**
- [ ] Files are byte-for-byte identical
- [ ] Workflow works from both locations
- [ ] Subtree layout compatibility maintained

---

#### Task 4.3: Run Full Test Suite
**Description:** Execute all tests to ensure no regressions
**Command:** `bash tests/workflow/test-hooks.sh && bash maf/scripts/maf/test-preflight.sh`

**TDD Approach:**
- RED: N/A (already have failing tests from earlier tasks)
- GREEN: All tests pass
- REFACTOR: Fix any test failures

**Tests to run:**
```bash
# Hook system tests
bash tests/workflow/test-hooks.sh

# Preflight validation tests
bash maf/scripts/maf/test-preflight.sh

# Integration test
bash tests/workflow/test-generic-workflow.sh
```

**Acceptance:**
- [ ] All hook system tests pass
- [ ] All preflight tests pass
- [ ] Integration tests pass
- [ ] No test output warnings or errors
- [ ] Code coverage > 90% for new code

---

### Phase 5: Cleanup

#### Task 5.1: Remove Old autonomous-workflow-nextnest.sh
**Description:** Archive or remove old NextNest-specific workflow
**File:** `experiments/autonomous-workflow-nextnest.sh`

**TDD Approach:**
- RED: N/A (removal, no new tests)
- GREEN: Remove file
- REFACTOR: N/A

**Action:**
```bash
# Archive old file (don't delete immediately)
mv experiments/autonomous-workflow-nextnest.sh experiments/archive/autonomous-workflow-nextnest.sh.2026-01-27
```

**Acceptance:**
- [ ] Old file archived (not deleted)
- [ ] No references to old file remain
- [ ] NextNest can use new workflow with customizations

---

#### Task 5.2: Commit and Push Changes
**Description:** Commit all changes with descriptive message
**Command:** `git add -A && git commit -m "feat: add generic autonomous-workflow with franchisee hooks"`

**TDD Approach:**
- RED: N/A (commit, no tests)
- GREEN: Commit passes
- REFACTOR: N/A

**Commit Message:**
```
feat: add generic autonomous-workflow with franchisee hooks

Breakdown:
- Rename autonomous-workflow-nextnest.sh → autonomous-workflow.sh
- Add 8 customization hooks for franchisee extensions
- Remove NextNest-specific assumptions (hardcoded agent names, paths)
- Add .maf/config/custom-workflow-hooks.sh template
- Create NextNest customizations example
- Document hook system in VENDOR_ARCHITECTURE.md
- Add comprehensive test suite for hook system

Hooks:
1. CUSTOM_HOOK_BEFORE_LOOP - Initialization
2. CUSTOM_HOOK_BEFORE_CHECK - Pre-agent-status check
3. CUSTOM_HOOK_BEFORE_ASSIGN - Pre-bead-assignment
4. CUSTOM_HOOK_AFTER_ASSIGN - Post-bead-assignment
5. CUSTOM_HOOK_CUSTOM_BEAD - Custom bead type handler
6. CUSTOM_HOOK_AGENT_PROMPT - Command customization
7. CUSTOM_HOOK_AFTER_CHECK - Post-agent-status check
8. CUSTOM_HOOK_ERROR_HANDLER - Error recovery

Testing:
- 100% test coverage for hook system
- All preflight tests pass
- Integration tests pass
- Template examples validated

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Acceptance:**
- [ ] All changes committed
- [ ] Commit message follows conventions
- [ ] Changes pushed to origin/main

---

## Verification Checklist

Before marking implementation complete:

### Code Quality
- [ ] All production code written with TDD (failing test first)
- [ ] All tests pass (no failures, no warnings)
- [ ] Code follows MAF style guidelines
- [ ] No hardcoded NextNest assumptions remain
- [ ] All 8 hooks implemented and tested

### Testing
- [ ] Test framework created and working
- [ ] Test fixtures created (topology, hooks, mocks)
- [ ] All 8 hooks have tests
- [ ] Generic workflow has tests
- [ ] Preflight tests still pass
- [ ] Integration tests pass

### Documentation
- [ ] Hook template file created with examples
- [ ] NextNest customizations example created
- [ ] VENDOR_ARCHITECTURE.md updated
- [ ] All hooks documented with parameters and return codes

### Deployment
- [ ] Generic workflow in both locations (experiments/ and maf/scripts/maf/)
- [ ] Template file in maf/templates/
- [ ] NextNest can use new workflow with customizations
- [ ] Other franchisees can customize via .maf/config/

### Regression Prevention
- [ ] All existing tests pass
- [ ] No breaking changes to preflight system
- [ ] Backward compatible with existing topologies
- [ ] Old NextNest workflow archived (not deleted)

---

## Success Criteria

1. **Genericization**: Workflow works with any agent topology configuration
2. **Extensibility**: Franchisees can customize behavior via 8 hooks
3. **Backward Compatibility**: Existing topologies and preflight system work unchanged
4. **Test Coverage**: >90% coverage for new code, 100% for hooks
5. **Documentation**: Complete template and examples for franchisees

---

**Implementation Order:** Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

**Estimated Time:** 4-6 hours (with TDD)

**Dependencies:** None (uses existing MAF infrastructure)
