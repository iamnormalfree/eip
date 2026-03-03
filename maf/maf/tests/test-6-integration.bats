#!/usr/bin/env bats
# Test 6: Integration Test
# End-to-end test of supervisor coordination workflow

setup() {
    export TEST_SESSION="maf-test-integration"
    export TEST_TRACKING_FILE="/tmp/maf-integration-tracking.txt"
    rm -f "$TEST_TRACKING_FILE" 2>/dev/null || true

    MAF_TRACKING_FILE="$TEST_TRACKING_FILE"
    export MAF_TRACKING_FILE

    source maf/scripts/maf/supervisor-coordination.sh

    # Kill test session if exists
    tmux kill-session -t "$TEST_SESSION" 2>/dev/null || true
}

teardown() {
    # Clean up test session
    tmux kill-session -t "$TEST_SESSION" 2>/dev/null || true
    rm -f "$TEST_TRACKING_FILE" 2>/dev/null || true
}

@test "integration: end-to-end supervisor coordination flow" {
    skip "This test requires full tmux session setup - run manually with: bats --filter 'integration'"

    # This test validates the complete flow:
    # 1. Detect stuck implementor
    # 2. Send alert to supervisor
    # 3. Capture supervisor response
    # 4. Deliver advice to implementor
    # 5. Update tracking file

    # To run this test manually:
    # 1. Create tmux session: tmux new-session -d -s "$TEST_SESSION"
    # 2. Create panes: tmux split-window -h -p 50
    # 3. Set up supervisor in pane 0, implementors in panes 2-3
    # 4. Run: bats maf/tests/test-6-integration.bats --filter 'integration'
}

# Manual integration test instructions
@test "MANUAL: Run integration test with real tmux session" {
    skip "Manual test - see documentation"

    # Instructions:
    # 1. Create test session:
    #    tmux new-session -d -s "$TEST_SESSION"
    #    tmux split-window -h -p 50
    #    tmux split-window -v -p 50
    #
    # 2. In pane 0 (supervisor), run:
    #    echo "Supervisor ready"
    #
    # 3. In pane 1 (implementor-2), simulate stuck state:
    #    echo "> Should I use Postgres or SQLite?"
    #
    # 4. Run coordination cycle:
    #    source maf/scripts/maf/supervisor-coordination.sh
    #    coordination_cycle
    #
    # 5. Verify:
    #    - Supervisor received alert
    #    - Implementor received advice
    #    - Tracking file updated
}
