#!/bin/bash
# test-migration-readiness.sh
#
# MAF Franchise Migration Readiness Test Suite
# Phase 0, Step 0.4 - Comprehensive validation before migration
#
# Usage:
#   From project root: bash scripts/maf/tests/test-migration-readiness.sh
#   From anywhere:     bash /path/to/maf-github/scripts/maf/tests/test-migration-readiness.sh
#
# Output: Results saved to /tmp/migration-test-results-{timestamp}.txt

set -euo pipefail

# Color output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

# Results file
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RESULTS_FILE="/tmp/migration-test-results-${TIMESTAMP}.txt"

# Detect project root
detect_project_root() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [[ "$script_dir" == *"/maf/scripts/maf/tests" ]]; then
        # Subtree layout: /project/maf/scripts/maf/tests -> /project
        # Go up 4 levels
        echo "$(cd "$script_dir/../../../../" && pwd)"
    elif [[ "$script_dir" == *"/scripts/maf/tests" ]]; then
        # Direct layout: /project/scripts/maf/tests -> /project
        # Go up 3 levels: tests -> maf -> scripts -> project root
        echo "$(cd "$script_dir/../../../" && pwd)"
    else
        # Fallback: assume current directory
        echo "$(pwd)"
    fi
}

PROJECT_ROOT="$(detect_project_root)"
cd "$PROJECT_ROOT"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$RESULTS_FILE"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$RESULTS_FILE"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$RESULTS_FILE"
    ((TESTS_FAILED++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$RESULTS_FILE"
    ((TESTS_WARNED++))
}

run_test() {
    local test_name="$1"
    ((TESTS_RUN++))
    log_info "Running: $test_name"
}

# Test 1: Agent startup chain
test_agent_startup_chain() {
    run_test "Agent Startup Dependency Chain"

    local found=0

    # Check for agent startup wrapper in various locations
    local locations=(
        "maf/scripts/maf/rebuild-maf-cli-agents.sh"
        "scripts/maf/rebuild-maf-cli-agents.sh"
        "maf/scripts/maf/agent-startup.sh"
        "scripts/maf/agent-startup.sh"
    )

    for location in "${locations[@]}"; do
        if [ -f "$location" ]; then
            if grep -q "agent_startup_wrapper\|AGENT_STARTUP_WRAPPER" "$location" 2>/dev/null; then
                log_success "Agent startup wrapper found in: $location"
                found=1
                break
            fi
        fi
    done

    if [ $found -eq 0 ]; then
        log_fail "Agent startup wrapper not found. Agent spawn may break after migration."
        log_info "Expected: agent_startup_wrapper function or AGENT_STARTUP_WRAPPER variable"
        log_info "Check these files:"
        printf "  - %s\n" "${locations[@]}"
        return 1
    fi

    return 0
}

# Test 2: Topology schema compatibility
test_topology_schema() {
    run_test "Topology Schema Version Check"

    local configs=(
        "maf/.maf/config/agent-topology.json"
        ".maf/config/agent-topology.json"
    )

    local found_config=0
    local schema_version=""

    for config in "${configs[@]}"; do
        if [ -f "$config" ]; then
            found_config=1
            schema_version=$(jq -r '.version // "unknown"' "$config" 2>/dev/null || echo "unknown")

            log_info "Found config: $config (version: $schema_version)"

            case "$schema_version" in
                "2.0.0")
                    log_warn "Schema v2.0.0 detected - ensure scripts are compatible"
                    log_info "v2.0.0 has enhanced features - verify all scripts support them"
                    ;;
                "1.0.0")
                    log_success "Schema v1.0.0 - standard compatibility"
                    ;;
                "unknown"|"null"|"")
                    log_warn "Unable to determine schema version in: $config"
                    ;;
                *)
                    log_warn "Unrecognized schema version: $schema_version"
                    ;;
            esac
        fi
    done

    if [ $found_config -eq 0 ]; then
        log_fail "No agent topology config found"
        log_info "Expected locations:"
        printf "  - %s\n" "${configs[@]}"
        return 1
    fi

    return 0
}

# Test 3: Session name consistency
test_session_consistency() {
    run_test "Session Name Consistency"

    local root_session=""
    local subtree_session=""

    # Check root config
    if [ -f ".maf/config/agent-topology.json" ]; then
        root_session=$(jq -r '.session // "none"' ".maf/config/agent-topology.json" 2>/dev/null || echo "none")
    fi

    # Check subtree config
    if [ -f "maf/.maf/config/agent-topology.json" ]; then
        subtree_session=$(jq -r '.session // "none"' "maf/.maf/config/agent-topology.json" 2>/dev/null || echo "none")
    fi

    log_info "Root session: ${root_session:-none}"
    log_info "Subtree session: ${subtree_session:-none}"

    # Check for mismatch
    if [ "$root_session" != "none" ] && [ "$subtree_session" != "none" ]; then
        if [ "$root_session" != "$subtree_session" ]; then
            log_fail "Session name mismatch detected"
            log_info "Root config uses: $root_session"
            log_info "Subtree config uses: $subtree_session"
            log_info "Impact: tmux commands may fail, agents spawn in wrong sessions"
            log_info "Resolution: Standardize on one session name or use env var override"
            return 1
        else
            log_success "Session names consistent: $root_session"
        fi
    elif [ "$root_session" != "none" ]; then
        log_success "Root session defined: $root_session (no subtree config)"
    elif [ "$subtree_session" != "none" ]; then
        log_success "Subtree session defined: $subtree_session (no root config)"
    else
        log_warn "No session names found in configs"
    fi

    # Check context manager for session name
    local cm_files=(
        "maf/scripts/maf/context-manager-nextnest.sh"
        "maf/scripts/maf/context-manager-v2.sh"
        "scripts/maf/context-manager.sh"
    )

    for cm_file in "${cm_files[@]}"; do
        if [ -f "$cm_file" ]; then
            local cm_session=$(grep -oP 'MAF_TMUX_SESSION="[^"]*' "$cm_file" 2>/dev/null | cut -d'"' -f2 || echo "")
            if [ -n "$cm_session" ]; then
                log_info "Context manager ($cm_file) uses session: $cm_session"

                if [ "$root_session" != "none" ] && [ "$cm_session" != "$root_session" ]; then
                    log_warn "Context manager session ($cm_session) differs from root config ($root_session)"
                fi
            fi
        fi
    done

    return 0
}

# Test 4: Memlayer dependencies
test_memlayer_dependencies() {
    run_test "Memlayer Dependencies"

    local memlayer_scripts=(
        "maf/scripts/maf/agent-memory.sh"
        "maf/scripts/maf/agent-mail-fetch.sh"
        "scripts/maf/agent-memory.sh"
        "scripts/maf/agent-mail-fetch.sh"
    )

    local missing_count=0

    for script in "${memlayer_scripts[@]}"; do
        if [ -f "$script" ]; then
            log_success "Memlayer script exists: $script"
        else
            log_warn "Memlayer script missing: $script"
            ((missing_count++))
        fi
    done

    if [ $missing_count -gt 0 ]; then
        log_warn "$missing_count memlayer script(s) missing"
        log_info "Impact: Context manager may fail if it references these scripts"
        log_info "Action: Update context manager to remove references or implement memlayer"
    else
        log_success "All memlayer dependencies satisfied"
    fi

    return 0
}

# Test 5: Enhanced script functions
test_enhanced_functions() {
    run_test "Enhanced Script Functions"

    local required_functions=(
        "get_agent_by_role"
        "spawn_agent_with_persona"
        "tmux_pane_health_check"
    )

    local lib_dirs=(
        "scripts/maf/lib"
        "maf/scripts/maf/lib"
        ".maf/agents"
    )

    local missing_functions=()

    for func in "${required_functions[@]}"; do
        local found=0

        for lib_dir in "${lib_dirs[@]}"; do
            if [ -d "$lib_dir" ]; then
                if grep -r "$func" "$lib_dir"/*.sh 2>/dev/null | grep -q "^[^#]*$func"; then
                    log_success "Function found: $func (in $lib_dir)"
                    found=1
                    break
                fi
            fi
        done

        if [ $found -eq 0 ]; then
            log_warn "Function not found: $func"
            missing_functions+=("$func")
        fi
    done

    if [ ${#missing_functions[@]} -gt 0 ]; then
        log_warn "Missing ${#missing_functions[@]} enhanced function(s)"
        log_info "Missing functions:"
        printf "  - %s\n" "${missing_functions[@]}"
        log_info "Impact: Some advanced features may not work"
        return 1
    fi

    return 0
}

# Test 6: Hardcoded paths check (additional test)
test_hardcoded_paths() {
    run_test "Hardcoded Paths Detection"

    local hardcoded_count=0

    # Check for hardcoded /root/projects/ paths in shell scripts
    local tmp_file=$(mktemp)
    find . -type f \( -name "*.sh" -o -name "*.json" \) \
        -exec grep -l "/root/projects/" {} \; 2>/dev/null > "$tmp_file" || true

    hardcoded_count=$(wc -l < "$tmp_file")

    if [ "$hardcoded_count" -gt 0 ]; then
        log_warn "Found $hardcoded_count file(s) with hardcoded paths"
        log_info "Run path audit for details: bash scripts/maf/tests/test-migration-readiness.sh --audit-only"
    else
        log_success "No hardcoded paths detected"
    fi

    rm -f "$tmp_file"

    return 0
}

# Main test runner
main() {
    echo "====================================" | tee "$RESULTS_FILE"
    echo "MAF Migration Readiness Test Suite" | tee -a "$RESULTS_FILE"
    echo "====================================" | tee -a "$RESULTS_FILE"
    echo "Date: $(date)" | tee -a "$RESULTS_FILE"
    echo "Project Root: $PROJECT_ROOT" | tee -a "$RESULTS_FILE"
    echo "" | tee -a "$RESULTS_FILE"

    log_info "Starting migration readiness tests..."
    echo "" | tee -a "$RESULTS_FILE"

    # Run all tests
    test_agent_startup_chain || true
    echo "" | tee -a "$RESULTS_FILE"

    test_topology_schema || true
    echo "" | tee -a "$RESULTS_FILE"

    test_session_consistency || true
    echo "" | tee -a "$RESULTS_FILE"

    test_memlayer_dependencies || true
    echo "" | tee -a "$RESULTS_FILE"

    test_enhanced_functions || true
    echo "" | tee -a "$RESULTS_FILE"

    test_hardcoded_paths || true
    echo "" | tee -a "$RESULTS_FILE"

    # Summary
    echo "====================================" | tee -a "$RESULTS_FILE"
    echo "Test Summary" | tee -a "$RESULTS_FILE"
    echo "====================================" | tee -a "$RESULTS_FILE"
    echo "Total Tests:  $TESTS_RUN" | tee -a "$RESULTS_FILE"
    echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}" | tee -a "$RESULTS_FILE"
    echo -e "Failed:       ${RED}$TESTS_FAILED${NC}" | tee -a "$RESULTS_FILE"
    echo -e "Warnings:     ${YELLOW}$TESTS_WARNED${NC}" | tee -a "$RESULTS_FILE"
    echo "" | tee -a "$RESULTS_FILE"
    echo "Results saved to: $RESULTS_FILE" | tee -a "$RESULTS_FILE"

    # Exit code
    if [ $TESTS_FAILED -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main
main "$@"
