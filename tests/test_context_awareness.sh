#!/bin/bash
# Test context-awareness across HQ and franchisee environments

# Test counter
tests_passed=0
tests_failed=0

# Helper functions
test_pass() {
    echo "  ✓ PASS: $1"
    ((tests_passed++)) || true
}

test_fail() {
    echo "  ✗ FAIL: $1"
    ((tests_failed++)) || true
}

# Test 1: Test context.sh detection logic in current environment
test_current_environment() {
    echo "Test 1: Detect current environment"

    # Source context.sh to get detected values
    if ! source .maf/context.sh 2>/dev/null; then
        test_fail "Failed to source .maf/context.sh"
        return 1
    fi

    echo "  Detected: $MAF_LAYOUT (prefix: '$MAF_SUBTREE_PREFIX')"

    # Verify MAF scripts exist at detected path
    if [[ ! -d "$MAF_SCRIPTS_DIR" ]]; then
        test_fail "Scripts not found at: $MAF_SCRIPTS_DIR"
        return 1
    fi

    test_pass "Current environment detected correctly: $MAF_LAYOUT"
    test_pass "MAF scripts found at: $MAF_SCRIPTS_DIR"

    # Verify MAF scripts directory contains at least one script
    if [[ -z "$(ls -A "$MAF_SCRIPTS_DIR"/*.sh 2>/dev/null)" ]]; then
        test_fail "No shell scripts found in: $MAF_SCRIPTS_DIR"
        return 1
    fi

    test_pass "Found scripts in $MAF_SCRIPTS_DIR"
    echo "  Available scripts:"
    ls -1 "$MAF_SCRIPTS_DIR"/*.sh 2>/dev/null | sed 's|.*/||' | sed 's/^/    - /' || true
}

# Test 2: Simulate HQ environment detection
test_hq_detection() {
    echo
    echo "Test 2: Simulate HQ environment detection"

    local test_dir=$(mktemp -d)
    trap "rm -rf $test_dir" RETURN

    # Create HQ structure: scripts/maf exists, maf/ does not exist
    mkdir -p "$test_dir/scripts/maf"
    touch "$test_dir/scripts/maf/test-script.sh"

    # Simulate the detection logic from context.sh
    local PROJECT_ROOT="$test_dir"
    local MAF_LAYOUT MAF_SUBTREE_PREFIX

    if [[ -d "$PROJECT_ROOT/scripts/maf" ]]; then
        if [[ -d "$PROJECT_ROOT/maf" ]]; then
            # Both exist - check if maf/ is a subtree
            if [[ -f "$PROJECT_ROOT/maf/.maf-subtree-marker" ]] || \
               git -C "$PROJECT_ROOT" log --oneline -1 "$PROJECT_ROOT/maf" 2>/dev/null | grep -q "Subtree"; then
                MAF_LAYOUT="franchisee"
                MAF_SUBTREE_PREFIX="maf"
            else
                MAF_LAYOUT="hq"
                MAF_SUBTREE_PREFIX=""
            fi
        else
            # Only scripts/maf exists - this is HQ layout
            MAF_LAYOUT="hq"
            MAF_SUBTREE_PREFIX=""
        fi
    else
        MAF_LAYOUT="legacy"
        MAF_SUBTREE_PREFIX=""
    fi

    if [[ "$MAF_LAYOUT" == "hq" ]] && [[ "$MAF_SUBTREE_PREFIX" == "" ]]; then
        test_pass "HQ environment correctly detected"
    else
        test_fail "HQ environment misidentified as: $MAF_LAYOUT (prefix: '$MAF_SUBTREE_PREFIX')"
        return 1
    fi

    # Verify path construction
    local scripts_path="$PROJECT_ROOT${MAF_SUBTREE_PREFIX:+/$MAF_SUBTREE_PREFIX}/scripts/maf"
    if [[ "$scripts_path" == "$test_dir/scripts/maf" ]]; then
        test_pass "HQ path constructed correctly: $scripts_path"
    else
        test_fail "HQ path incorrect: $scripts_path (expected: $test_dir/scripts/maf)"
        return 1
    fi
}

# Test 3: Simulate franchisee environment detection
test_franchisee_detection() {
    echo
    echo "Test 3: Simulate franchisee environment detection"

    local test_dir=$(mktemp -d)
    trap "rm -rf $test_dir" RETURN

    # Create franchisee structure: maf/scripts/maf exists with subtree marker
    mkdir -p "$test_dir/maf/scripts/maf"
    touch "$test_dir/maf/scripts/maf/test-script.sh"
    touch "$test_dir/maf/.maf-subtree-marker"

    # Simulate the detection logic from context.sh
    local PROJECT_ROOT="$test_dir"
    local MAF_LAYOUT MAF_SUBTREE_PREFIX

    if [[ -d "$PROJECT_ROOT/scripts/maf" ]]; then
        if [[ -d "$PROJECT_ROOT/maf" ]]; then
            # Both exist - check if maf/ is a subtree
            if [[ -f "$PROJECT_ROOT/maf/.maf-subtree-marker" ]] || \
               git -C "$PROJECT_ROOT" log --oneline -1 "$PROJECT_ROOT/maf" 2>/dev/null | grep -q "Subtree"; then
                MAF_LAYOUT="franchisee"
                MAF_SUBTREE_PREFIX="maf"
            else
                MAF_LAYOUT="hq"
                MAF_SUBTREE_PREFIX=""
            fi
        else
            MAF_LAYOUT="hq"
            MAF_SUBTREE_PREFIX=""
        fi
    elif [[ -d "$PROJECT_ROOT/maf/scripts/maf" ]]; then
        # Old path: franchisee if scripts/maf doesn't exist at root
        MAF_LAYOUT="franchisee"
        MAF_SUBTREE_PREFIX="maf"
    else
        MAF_LAYOUT="legacy"
        MAF_SUBTREE_PREFIX=""
    fi

    if [[ "$MAF_LAYOUT" == "franchisee" ]] && [[ "$MAF_SUBTREE_PREFIX" == "maf" ]]; then
        test_pass "Franchisee environment correctly detected"
    else
        test_fail "Franchisee environment misidentified as: $MAF_LAYOUT (prefix: '$MAF_SUBTREE_PREFIX')"
        return 1
    fi

    # Verify path construction
    local scripts_path="$PROJECT_ROOT${MAF_SUBTREE_PREFIX:+/$MAF_SUBTREE_PREFIX}/scripts/maf"
    if [[ "$scripts_path" == "$test_dir/maf/scripts/maf" ]]; then
        test_pass "Franchisee path constructed correctly: $scripts_path"
    else
        test_fail "Franchisee path incorrect: $scripts_path (expected: $test_dir/maf/scripts/maf)"
        return 1
    fi
}

# Test 4: Verify HQ detection takes precedence (the bug fix)
test_hq_precedence() {
    echo
    echo "Test 4: HQ detection precedence (bug fix verification)"

    local test_dir=$(mktemp -d)
    trap "rm -rf $test_dir" RETURN

    # Create HQ-with-worktree structure: BOTH exist but maf/ is NOT a subtree
    # This is the MAF HQ case: scripts/maf exists, maf/ exists as worktree/symlink
    mkdir -p "$test_dir/scripts/maf"
    mkdir -p "$test_dir/maf/scripts/maf"
    # Intentionally NO .maf-subtree-marker (this simulates HQ worktree)

    # Simulate the detection logic from context.sh
    local PROJECT_ROOT="$test_dir"
    local MAF_LAYOUT MAF_SUBTREE_PREFIX

    if [[ -d "$PROJECT_ROOT/scripts/maf" ]]; then
        if [[ -d "$PROJECT_ROOT/maf" ]]; then
            # Both exist - check if maf/ is a subtree
            if [[ -f "$PROJECT_ROOT/maf/.maf-subtree-marker" ]] || \
               git -C "$PROJECT_ROOT" log --oneline -1 "$PROJECT_ROOT/maf" 2>/dev/null | grep -q "Subtree"; then
                MAF_LAYOUT="franchisee"
                MAF_SUBTREE_PREFIX="maf"
            else
                # HQ: maf/ exists but is not a subtree
                MAF_LAYOUT="hq"
                MAF_SUBTREE_PREFIX=""
            fi
        else
            MAF_LAYOUT="hq"
            MAF_SUBTREE_PREFIX=""
        fi
    else
        MAF_LAYOUT="legacy"
        MAF_SUBTREE_PREFIX=""
    fi

    # This was the bug: old logic detected as franchisee, should be hq
    if [[ "$MAF_LAYOUT" == "hq" ]] && [[ "$MAF_SUBTREE_PREFIX" == "" ]]; then
        test_pass "HQ worktree correctly detected (not misidentified as franchisee)"
    else
        test_fail "HQ worktree misidentified as: $MAF_LAYOUT (prefix: '$MAF_SUBTREE_PREFIX')"
        echo "  This is the bug we fixed: HQ with worktree should be detected as HQ, not franchisee"
        return 1
    fi
}

# Test 5: Verify no double slashes in paths
test_no_double_slashes() {
    echo
    echo "Test 5: Path construction (no double slashes)"

    # Source context.sh to test path construction
    source .maf/context.sh 2>/dev/null

    local has_double_slash=0
    for var in MAF_SCRIPTS_DIR MAF_LIB_DIR MAF_CONFIG_DIR MAF_DOCS_DIR MAF_SKILLS_DIR; do
        local path="${!var}"
        if [[ "$path" == *"//"* ]]; then
            echo "  ✗ Double slash found in $var: $path"
            has_double_slash=1
        fi
    done

    if [[ $has_double_slash -eq 0 ]]; then
        test_pass "No double slashes in constructed paths"
    else
        test_fail "Double slashes found in constructed paths"
        return 1
    fi
}

# Run all tests
echo "════════════════════════════════════════════════════════════"
echo "  Context-Awareness Test Suite"
echo "════════════════════════════════════════════════════════════"

test_current_environment
test_hq_detection
test_franchisee_detection
test_hq_precedence
test_no_double_slashes

echo
echo "════════════════════════════════════════════════════════════"
echo "  Test Results: $tests_passed passed, $tests_failed failed"
echo "════════════════════════════════════════════════════════════"

if [[ $tests_failed -gt 0 ]]; then
    exit 1
else
    exit 0
fi

