#!/bin/bash
# custom-hooks-example.sh - Example custom workflow hooks for testing
#
# This file contains minimal implementations of all 8 hooks for testing
# the workflow hook system. Each hook can be customized by franchisees.

set -euo pipefail

# ============================================================================
# HOOK 1: BEFORE LOOP - Initialization
# ============================================================================

CUSTOM_HOOK_BEFORE_LOOP() {
    # Called once after preflight validation, before main loop
    # Return 0 to continue, 2 to abort workflow
    return 0
}

# ============================================================================
# HOOK 2: BEFORE CHECK - Pre-Agent-Status Check
# ============================================================================

CUSTOM_HOOK_BEFORE_CHECK() {
    local iteration="$1"
    local last_status="$2"

    # Called each iteration before checking agent status
    # Return 0 to continue, 1 to skip agent checks this iteration
    return 0
}

# ============================================================================
# HOOK 3: BEFORE ASSIGN - Pre-Bead-Assignment
# ============================================================================

CUSTOM_HOOK_BEFORE_ASSIGN() {
    local bead_id="$1"
    local ready_beads="$2"

    # Called before each bead assignment
    # Return 0 to continue assignment, 1 to skip this bead, 2 to abort all
    return 0
}

# ============================================================================
# HOOK 4: AFTER ASSIGN - Post-Bead-Assignment
# ============================================================================

CUSTOM_HOOK_AFTER_ASSIGN() {
    local bead_id="$1"
    local agent_name="$2"
    local pane="$3"
    local skill="$4"

    # Called after successful bead assignment
    # Return 0 to confirm, non-zero to trigger rollback
    return 0
}

# ============================================================================
# HOOK 5: CUSTOM BEAD - Custom Bead Type Handler
# ============================================================================

CUSTOM_HOOK_CUSTOM_BEAD() {
    local bead_id="$1"
    local bead_title="$2"
    local bead_labels="$3"

    # Called to check if franchisee wants to handle this bead type
    # Return 0 (hook handled it), 1 (use default assignment)
    return 1
}

# ============================================================================
# HOOK 6: AGENT PROMPT - Command Customization
# ============================================================================

CUSTOM_HOOK_AGENT_PROMPT() {
    local pane="$1"
    local original_cmd="$2"

    # Called before each command is sent to agent pane
    # Echo modified command, or original to pass through
    echo "$original_cmd"
}

# ============================================================================
# HOOK 7: AFTER CHECK - Post-Agent-Status Check
# ============================================================================

CUSTOM_HOOK_AFTER_CHECK() {
    local iteration="$1"
    local blocked_agents="$2"

    # Called each iteration after checking agent status
    # Return 0 to continue, 2 to abort loop
    return 0
}

# ============================================================================
# HOOK 8: ERROR HANDLER - Global Error Recovery
# ============================================================================

CUSTOM_HOOK_ERROR_HANDLER() {
    local error_line="$1"
    local error_message="$2"
    local context="$3"

    # Called when any error occurs during workflow
    # Return 0 to continue (attempt recovery), 1 to abort, 2 to restart
    return 0
}

# ============================================================================
# SCRIPT ENTRY POINT
# ============================================================================

# If executed directly, run simple self-test
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "Testing custom hooks example..."

    # Test all 8 hooks are defined and callable
    CUSTOM_HOOK_BEFORE_LOOP || echo "✓ BEFORE_LOOP"
    CUSTOM_HOOK_BEFORE_CHECK 1 0 || echo "✓ BEFORE_CHECK"
    CUSTOM_HOOK_BEFORE_ASSIGN "test-bead" "[]" || echo "✓ BEFORE_ASSIGN"
    CUSTOM_HOOK_AFTER_ASSIGN "bead-1" "Agent1" "2" "test skill" || echo "✓ AFTER_ASSIGN"
    CUSTOM_HOOK_CUSTOM_BEAD "bead-2" "title" "[]" || echo "✓ CUSTOM_BEAD"
    CUSTOM_HOOK_AGENT_PROMPT 2 "test command" >/dev/null || echo "✓ AGENT_PROMPT"
    CUSTOM_HOOK_AFTER_CHECK 1 "[]" || echo "✓ AFTER_CHECK"
    CUSTOM_HOOK_ERROR_HANDLER 42 "error" "context" || echo "✓ ERROR_HANDLER"

    echo "All hooks tested successfully!"
fi
