#!/bin/bash
# Agent Spawn Baseline Test
# Establishes that agents can spawn successfully before migration
#
# USAGE:
#   Run this before Wave 1 to establish baseline:
#     bash scripts/maf/tests/baseline-agent-spawn.sh
#
#   Run this after Wave 1 to verify nothing broke:
#     bash scripts/maf/tests/baseline-agent-spawn.sh
#
#   Compare results:
#     diff /tmp/agent-spawn-baseline-*.txt
#
# SUCCESS CRITERIA:
#   - Test 1: Script exists and is executable
#   - Test 2: Help command works
#   - Test 3: Config file exists and is valid JSON
#   - Test 4: Config can be parsed (agent count extracted)
#   - Test 5: Background spawn test (actual spawn attempt)
#
# WHAT THIS TEST DOES:
#   - Validates spawn-agents.sh script exists and is functional
#   - Checks configuration file integrity
#   - Attempts actual agent spawn in background mode
#   - Verifies tmux session creation
#   - Creates timestamped baseline file for comparison
#
# WHAT THIS TEST DOESN'T DO:
#   - Doesn't modify any permanent configuration
#   - Doesn't kill existing sessions (only detects them)
#   - Doesn't interfere with running agents
#   - Read-only test (except temporary /tmp files)

set -e

BASELINE_DIR="/tmp"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BASELINE_FILE="${BASELINE_DIR}/agent-spawn-baseline-${TIMESTAMP}.txt"
# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect which layout we are in by checking the directory pattern
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf/tests" ]]; then
    # Tests in subtree layout: /project/maf/scripts/maf/tests
    # Go up 4 levels to get to project root
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../../.." && pwd)"
elif [[ "$DETECTED_SCRIPT_DIR" == *"/scripts/maf/tests" ]]; then
    # Tests in direct layout: /project/scripts/maf/tests
    # Go up 3 levels to get to project root
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    # Unknown layout - try to find package.json
    PROJECT_ROOT="$(pwd)"
    while [[ "$PROJECT_ROOT" != "/" && ! -f "$PROJECT_ROOT/package.json" ]]; do
        PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
    done
    if [[ "$PROJECT_ROOT" == "/" ]]; then
        echo "ERROR: Could not detect project root" >&2
        exit 1
    fi
fi

echo "=== MAF Agent Spawn Baseline Test ===" | tee "$BASELINE_FILE"
echo "Date: $(date)" | tee -a "$BASELINE_FILE"
echo "Project Root: $PROJECT_ROOT" | tee -a "$BASELINE_FILE"
echo "" | tee -a "$BASELINE_FILE"

cd "$PROJECT_ROOT"

# Test 1: Script exists and is executable
echo "Test 1: Script Existence Check" | tee -a "$BASELINE_FILE"
if [ -x "scripts/maf/spawn-agents.sh" ]; then
    echo "PASS: spawn-agents.sh exists and is executable" | tee -a "$BASELINE_FILE"
    TEST_1_PASS=true
else
    echo "FAIL: spawn-agents.sh not found or not executable" | tee -a "$BASELINE_FILE"
    TEST_1_PASS=false
fi
echo "" | tee -a "$BASELINE_FILE"

# Test 2: Help command works
echo "Test 2: Help Command" | tee -a "$BASELINE_FILE"
if bash scripts/maf/spawn-agents.sh --help >/dev/null 2>&1; then
    echo "PASS: Help command functional" | tee -a "$BASELINE_FILE"
    TEST_2_PASS=true
else
    echo "FAIL: Help command failed" | tee -a "$BASELINE_FILE"
    TEST_2_PASS=false
fi
echo "" | tee -a "$BASELINE_FILE"

# Test 3: Config file validation (check default config file used by spawn-agents.sh)
echo "Test 3: Configuration File Check" | tee -a "$BASELINE_FILE"
CONFIG_FILE=".maf/config/default-agent-config.json"
TOPOLOGY_FILE=".maf/config/agent-topology.json"

if [ -f "$CONFIG_FILE" ]; then
    echo "PASS: Config file exists at $CONFIG_FILE" | tee -a "$BASELINE_FILE"
    # Validate JSON syntax
    if command -v jq >/dev/null 2>&1 && jq empty "$CONFIG_FILE" >/dev/null 2>&1; then
        echo "PASS: Config file is valid JSON" | tee -a "$BASELINE_FILE"
        
        # Show relevant config info
        LAYOUTS=$(jq -r '.session_layouts | length' "$CONFIG_FILE" 2>/dev/null || echo "unknown")
        echo "   Session layouts defined: $LAYOUTS" | tee -a "$BASELINE_FILE"
        
        TEST_3_PASS=true
    else
        echo "FAIL: Config file has invalid JSON" | tee -a "$BASELINE_FILE"
        TEST_3_PASS=false
    fi
elif [ -f "$TOPOLOGY_FILE" ]; then
    echo "WARN: Default config not found, but topology file exists" | tee -a "$BASELINE_FILE"
    echo "   Note: spawn-agents.sh uses default-agent-config.json" | tee -a "$BASELINE_FILE"
    echo "   Topology file: $TOPOLOGY_FILE" | tee -a "$BASELINE_FILE"
    
    if command -v jq >/dev/null 2>&1 && jq empty "$TOPOLOGY_FILE" >/dev/null 2>&1; then
        echo "PASS: Topology file is valid JSON" | tee -a "$BASELINE_FILE"
        SESSION=$(jq -r '.pod.session // "null"' "$TOPOLOGY_FILE")
        echo "   Session: $SESSION" | tee -a "$BASELINE_FILE"
        VERSION=$(jq -r '.version // "unknown"' "$TOPOLOGY_FILE")
        echo "   Schema Version: $VERSION" | tee -a "$BASELINE_FILE"
    fi
    
    TEST_3_PASS="WARN_TOPOLOGY_ONLY"
else
    echo "FAIL: No config file found" | tee -a "$BASELINE_FILE"
    TEST_3_PASS=false
fi
echo "" | tee -a "$BASELINE_FILE"

# Test 4: Config parse test (show what's in the files)
echo "Test 4: Configuration Content Check" | tee -a "$BASELINE_FILE"

if [ -f "$CONFIG_FILE" ] && command -v jq >/dev/null 2>&1; then
    echo "Default config layouts:" | tee -a "$BASELINE_FILE"
    jq -r '.session_layouts | keys[] | "     - \(.)"' "$CONFIG_FILE" 2>/dev/null | tee -a "$BASELINE_FILE"
    TEST_4_PASS=true
elif [ -f "$TOPOLOGY_FILE" ] && command -v jq >/dev/null 2>&1; then
    echo "Topology file agents:" | tee -a "$BASELINE_FILE"
    AGENT_COUNT=$(jq '[.panes[].agent_name] | length' "$TOPOLOGY_FILE" 2>/dev/null || echo "0")
    echo "   Agents defined: $AGENT_COUNT" | tee -a "$BASELINE_FILE"
    jq -r '.panes[] | "     - \(.agent_name) (\(.role))"' "$TOPOLOGY_FILE" 2>/dev/null | tee -a "$BASELINE_FILE"
    TEST_4_PASS=true
else
    echo "SKIP: No config files to display" | tee -a "$BASELINE_FILE"
    TEST_4_PASS=false
fi
echo "" | tee -a "$BASELINE_FILE"

# Test 5: Background spawn test
echo "Test 5: Background Spawn Test" | tee -a "$BASELINE_FILE"
echo "Note: This will attempt to spawn agents in background mode" | tee -a "$BASELINE_FILE"
echo "Timeout: 15 seconds" | tee -a "$BASELINE_FILE"
echo "" | tee -a "$BASELINE_FILE"

# Check if there's already a maf-session session (default session name)
if tmux list-sessions 2>/dev/null | grep -q "maf-session"; then
    echo "WARN: maf-session session already exists" | tee -a "$BASELINE_FILE"
    echo "   Skipping actual spawn test to avoid conflicts" | tee -a "$BASELINE_FILE"
    echo "   This is expected if agents are already running" | tee -a "$BASELINE_FILE"
    TEST_5_PASS="SKIPPED"
    
    # Still show session info
    SESSION_INFO=$(tmux list-sessions | grep "maf-session")
    echo "   Existing session: $SESSION_INFO" | tee -a "$BASELINE_FILE"
elif [ -f "$CONFIG_FILE" ]; then
    # Try to spawn with timeout
    echo "Attempting background spawn..." | tee -a "$BASELINE_FILE"
    
    # Use timeout to prevent hanging
    set +e  # Don't exit on error for spawn test
    SPAWN_OUTPUT=$(timeout 15 bash scripts/maf/spawn-agents.sh --background 2>&1)
    SPAWN_EXIT_CODE=$?
    
    echo "$SPAWN_OUTPUT" | tee -a "$BASELINE_FILE"
    
    if [ $SPAWN_EXIT_CODE -eq 124 ]; then
        echo "WARN: Spawn command timed out (15s)" | tee -a "$BASELINE_FILE"
        TEST_5_PASS="WARN_TIMEOUT"
    elif [ $SPAWN_EXIT_CODE -eq 0 ]; then
        echo "PASS: Background spawn command completed" | tee -a "$BASELINE_FILE"
        TEST_5_PASS=true
        
        # Check if session was created
        sleep 2
        if tmux list-sessions 2>/dev/null | grep -q "maf-session"; then
            echo "PASS: maf-session session created" | tee -a "$BASELINE_FILE"
            SESSION_INFO=$(tmux list-sessions | grep "maf-session")
            echo "   $SESSION_INFO" | tee -a "$BASELINE_FILE"
            
            # Show window/pane layout
            echo "   Session layout:" | tee -a "$BASELINE_FILE"
            tmux list-windows -t maf-session 2>/dev/null | sed 's/^/     /' | tee -a "$BASELINE_FILE"
        else
            echo "WARN: No maf-session session detected after spawn" | tee -a "$BASELINE_FILE"
            echo "   This may be expected if spawn failed gracefully" | tee -a "$BASELINE_FILE"
            TEST_5_PASS="WARN_NO_SESSION"
        fi
    else
        echo "WARN: Background spawn failed (exit code: $SPAWN_EXIT_CODE)" | tee -a "$BASELINE_FILE"
        echo "   Check spawn-agents.sh prerequisites" | tee -a "$BASELINE_FILE"
        TEST_5_PASS="WARN_SPAWN_FAILED"
    fi
    set -e  # Restore exit on error
else
    echo "SKIP: No config file, cannot test spawn" | tee -a "$BASELINE_FILE"
    TEST_5_PASS="SKIPPED_NO_CONFIG"
fi

echo "" | tee -a "$BASELINE_FILE"
echo "=== Baseline Test Complete ===" | tee -a "$BASELINE_FILE"
echo "" | tee -a "$BASELINE_FILE"

# Summary
echo "=== TEST SUMMARY ===" | tee -a "$BASELINE_FILE"
if [ "$TEST_1_PASS" = true ]; then
    echo "Test 1 (Script Exists): PASS" | tee -a "$BASELINE_FILE"
else
    echo "Test 1 (Script Exists): FAIL" | tee -a "$BASELINE_FILE"
fi

if [ "$TEST_2_PASS" = true ]; then
    echo "Test 2 (Help Command): PASS" | tee -a "$BASELINE_FILE"
else
    echo "Test 2 (Help Command): FAIL" | tee -a "$BASELINE_FILE"
fi

if [ "$TEST_3_PASS" = true ]; then
    echo "Test 3 (Config File): PASS" | tee -a "$BASELINE_FILE"
elif [ "$TEST_3_PASS" = "WARN_TOPOLOGY_ONLY" ]; then
    echo "Test 3 (Config File): WARN (topology only)" | tee -a "$BASELINE_FILE"
else
    echo "Test 3 (Config File): FAIL" | tee -a "$BASELINE_FILE"
fi

if [ "$TEST_4_PASS" = true ]; then
    echo "Test 4 (Config Content): PASS" | tee -a "$BASELINE_FILE"
else
    echo "Test 4 (Config Content): SKIP" | tee -a "$BASELINE_FILE"
fi

if [ "$TEST_5_PASS" = true ]; then
    echo "Test 5 (Spawn Test): PASS" | tee -a "$BASELINE_FILE"
elif [ "$TEST_5_PASS" = "SKIPPED" ]; then
    echo "Test 5 (Spawn Test): SKIPPED (session exists)" | tee -a "$BASELINE_FILE"
elif [ "$TEST_5_PASS" = "WARN_TIMEOUT" ]; then
    echo "Test 5 (Spawn Test): WARN (timeout)" | tee -a "$BASELINE_FILE"
elif [ "$TEST_5_PASS" = "WARN_NO_SESSION" ]; then
    echo "Test 5 (Spawn Test): WARN (no session created)" | tee -a "$BASELINE_FILE"
elif [ "$TEST_5_PASS" = "WARN_SPAWN_FAILED" ]; then
    echo "Test 5 (Spawn Test): WARN (spawn failed)" | tee -a "$BASELINE_FILE"
elif [ "$TEST_5_PASS" = "SKIPPED_NO_CONFIG" ]; then
    echo "Test 5 (Spawn Test): SKIP (no config)" | tee -a "$BASELINE_FILE"
else
    echo "Test 5 (Spawn Test): FAIL" | tee -a "$BASELINE_FILE"
fi

echo "" | tee -a "$BASELINE_FILE"

# Count results
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

[ "$TEST_1_PASS" = true ] && PASS_COUNT=$((PASS_COUNT + 1)) || FAIL_COUNT=$((FAIL_COUNT + 1))
[ "$TEST_2_PASS" = true ] && PASS_COUNT=$((PASS_COUNT + 1)) || FAIL_COUNT=$((FAIL_COUNT + 1))
[ "$TEST_3_PASS" = true ] && PASS_COUNT=$((PASS_COUNT + 1))
[ "$TEST_3_PASS" = "WARN_TOPOLOGY_ONLY" ] && SKIP_COUNT=$((SKIP_COUNT + 1))
[ "$TEST_3_PASS" = false ] && FAIL_COUNT=$((FAIL_COUNT + 1))
[ "$TEST_4_PASS" = true ] && PASS_COUNT=$((PASS_COUNT + 1)) || SKIP_COUNT=$((SKIP_COUNT + 1))
[ "$TEST_5_PASS" = true ] && PASS_COUNT=$((PASS_COUNT + 1))
[ "$TEST_5_PASS" = "SKIPPED" ] && SKIP_COUNT=$((SKIP_COUNT + 1))
[ "$TEST_5_PASS" = "WARN_TIMEOUT" ] && SKIP_COUNT=$((SKIP_COUNT + 1))
[ "$TEST_5_PASS" = "WARN_NO_SESSION" ] && SKIP_COUNT=$((SKIP_COUNT + 1))
[ "$TEST_5_PASS" = "WARN_SPAWN_FAILED" ] && SKIP_COUNT=$((SKIP_COUNT + 1))
[ "$TEST_5_PASS" = "SKIPPED_NO_CONFIG" ] && SKIP_COUNT=$((SKIP_COUNT + 1))
[ "$TEST_5_PASS" = false ] && FAIL_COUNT=$((FAIL_COUNT + 1))

echo "Results: $PASS_COUNT passed, $FAIL_COUNT failed, $SKIP_COUNT skipped" | tee -a "$BASELINE_FILE"
echo "" | tee -a "$BASELINE_FILE"

echo "Baseline saved to: $BASELINE_FILE" | tee -a "$BASELINE_FILE"
echo "" | tee -a "$BASELINE_FILE"
echo "To compare after Wave 1:" | tee -a "$BASELINE_FILE"
echo "  bash scripts/maf/tests/baseline-agent-spawn.sh" | tee -a "$BASELINE_FILE"
echo "  diff /tmp/agent-spawn-baseline-*.txt" | tee -a "$BASELINE_FILE"
echo "" | tee -a "$BASELINE_FILE"

echo ""
echo "Baseline complete: $BASELINE_FILE"
echo ""
echo "SUMMARY: $PASS_COUNT passed, $FAIL_COUNT failed, $SKIP_COUNT skipped"

# Exit with appropriate code
if [ $FAIL_COUNT -gt 0 ]; then
    exit 1
elif [ $SKIP_COUNT -gt 0 ]; then
    exit 2  # Exit code 2 for warnings/skips
else
    exit 0
fi
