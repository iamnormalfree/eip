# Metacognitive Tags Test Plan

## Prerequisites
- beads-friendly-planning skill v2.1.3 or later installed
- jq command-line JSON processor installed
- Python 3.6+ installed
- Clean state: `rm -f .beads-planning-state.json`

### Pre-flight Check
```bash
# Verify skill version
grep -q "v2.1.3" .claude/skills/beads-friendly-planning/SKILL.md && echo "✅ Skill version OK" || echo "❌ Wrong skill version"

# Verify dependencies
command -v jq >/dev/null 2>&1 && echo "✅ jq installed" || echo "❌ jq missing"
command -v python3 >/dev/null 2>&1 && echo "✅ Python 3 installed" || echo "❌ Python 3 missing"

# Verify test data exists
[ -f docs/plans/2026-01-08-autonomous-maf-foundations.md ] && echo "✅ Test data present" || echo "❌ Missing test data"

# Verify verification script exists
[ -f .claude/skills/beads-friendly-planning/verify-tags.py ] && echo "✅ Verification script present" || echo "❌ Verification script missing"
```

## Test Scenarios

### Test 1: Hallucination Detection

**Purpose:** Verify that claims about non-existent infrastructure trigger #ASSERTION_UNVERIFIED tags

**Setup Commands:**
```bash
# Create test plan with hallucination claim
cat > /tmp/test-hallucination.md << 'EOF'
# Test Feature

Build authentication system using existing auth infrastructure.
EOF

# Clean state and run
rm -f .beads-planning-state.json
/beads-friendly-planning /tmp/test-hallucination.md
```

**Expected Output:**
```json
{"tag": "#ASSERTION_UNVERIFIED", "pass": "a", "blocking": true, "metadata": {"claim": "existing auth infrastructure", "needs": "codebase_verification"}}
```

**Pass Criterion:** Tag present in `jq '.active_tags' .beads-planning-state.json`

**Verification Steps:**
1. Check state file for #ASSERTION_UNVERIFIED tag
2. Verify tag metadata contains the claim about "existing auth infrastructure"
3. Confirm tag is marked as blocking
4. Run Pass C to verify claim converts to #PLANNING_ASSUMPTION after codebase check

---

### Test 2: Premature Completion Detection

**Purpose:** Ensure incomplete security analysis triggers #PREMATURE_COMPLETE tag

**Setup Commands:**
```bash
# Create minimal security pass plan
cat > /tmp/test-premature.md << 'EOF'
# Security Feature

We will encrypt the data.
EOF

# Run and check Pass D
rm -f .beads-planning-state.json
/beads-friendly-planning /tmp/test-premature.md --pass d
```

**Expected Output:** `#PREMATURE_COMPLETE` tag in state file

**Pass Criterion:** `jq '.active_tags[] | select(.tag == "#PREMATURE_COMPLETE")' .beads-planning-state.json` returns tag

**Verification Steps:**
1. Run through Pass D (Security Analysis)
2. Check state file for #PREMATURE_COMPLETE tag
3. Verify tag metadata indicates missing error cases or failure scenarios
4. Confirm completion is blocked until comprehensive analysis provided

---

### Test 3: Cargo Cult Detection

**Purpose:** Detect unjustified additions of patterns not requested by user

**Setup Commands:**
```bash
# Create plan to trigger cargo culting
cat > /tmp/test-cargo.md << 'EOF'
# Data Pipeline

Build data pipeline for processing.
EOF

# Run through Pass E
rm -f .beads-planning-state.json
/beads-friendly-planning /tmp/test-cargo.md --pass e
```

**Expected Output:** `#PATTERN_UNJUSTIFIED` tag for "monitoring dashboard" or similar

**Pass Criterion:** Tag with `metadata.addition` field exists

**Verification Steps:**
1. Run through Pass E (Architecture)
2. Check state file for #PATTERN_UNJUSTIFIED tag
3. Verify metadata.addition field contains the unjustified element
4. Confirm verification prompts user about necessity of addition

---

### Test 4: Clarification Deferral

**Purpose:** Test deferral of ambiguous requirements until appropriate pass

**Setup Commands:**
```bash
# Create plan with ambiguous policy
cat > /tmp/test-clarity.md << 'EOF'
# Agent Autonomy

Implement autonomy policy for agents.
EOF

# Run through Pass B
rm -f .beads-planning-state.json
/beads-friendly-planning /tmp/test-clarity.md --pass b
```

**Expected Output:** `#CLARITY_DEFERRED` tag

**Pass Criterion:** Tag with `metadata.unclear` field exists

**Verification Steps:**
1. Run through Pass B (Requirements Analysis)
2. Check state file for #CLARITY_DEFERRED tag
3. Verify metadata.unclear field describes the ambiguity
4. Confirm Pass I (Interactive Refinement) uses AskUserQuestion for resolution

---

### Test 5: Full Verification Flow

**Purpose:** End-to-end test of complete tag lifecycle and verification

**Setup Commands:**
```bash
# Use comprehensive test plan
rm -f .beads-planning-state.json
/beads-friendly-planning docs/plans/2026-01-08-autonomous-maf-foundations.md
```

**Expected Output:** Multiple tags of various types in state file

**Pass Criterion:** `jq '.active_tags | length' .beads-planning-state.json` ≥ 3

**Verification Steps:**
1. Run complete planning process through all passes
2. Check state file for multiple tag types
3. Run verification phase: `python3 .claude/skills/beads-friendly-planning/verify-tags.py .beads-planning-state.json`
4. Verify report shows tag counts and resolution status
5. Confirm blocking tags prevent completion
6. Resolve blocking tags and re-run verification
7. Verify successful completion after all blocking tags resolved

---

## Test Execution

### Automated Test Suite
```bash
# Run all tests sequentially
cd /root/projects/maf-github

echo "=== Test 1: Hallucination Detection ==="
bash -c 'cat > /tmp/test-hallucination.md << "EOF"
# Test Feature
Build authentication system using existing auth infrastructure.
EOF'
rm -f .beads-planning-state.json
/beads-friendly-planning /tmp/test-hallucination.md
jq '.active_tags[] | select(.tag == "#ASSERTION_UNVERIFIED")' .beads-planning-state.json

echo "=== Test 2: Premature Completion ==="
bash -c 'cat > /tmp/test-premature.md << "EOF"
# Security Feature
We will encrypt the data.
EOF'
rm -f .beads-planning-state.json
/beads-friendly-planning /tmp/test-premature.md --pass d
jq '.active_tags[] | select(.tag == "#PREMATURE_COMPLETE")' .beads-planning-state.json

echo "=== Test 3: Cargo Cult Detection ==="
bash -c 'cat > /tmp/test-cargo.md << "EOF"
# Data Pipeline
Build data pipeline for processing.
EOF'
rm -f .beads-planning-state.json
/beads-friendly-planning /tmp/test-cargo.md --pass e
jq '.active_tags[] | select(.tag == "#PATTERN_UNJUSTIFIED")' .beads-planning-state.json

echo "=== Test 4: Clarification Deferral ==="
bash -c 'cat > /tmp/test-clarity.md << "EOF"
# Agent Autonomy
Implement autonomy policy for agents.
EOF'
rm -f .beads-planning-state.json
/beads-friendly-planning /tmp/test-clarity.md --pass b
jq '.active_tags[] | select(.tag == "#CLARITY_DEFERRED")' .beads-planning-state.json

echo "=== Test 5: Full Verification Flow ==="
rm -f .beads-planning-state.json
/beads-friendly-planning docs/plans/2026-01-08-autonomous-maf-foundations.md
jq '.active_tags | length' .beads-planning-state.json
python3 .claude/skills/beads-friendly-planning/verify-tags.py .beads-planning-state.json
```

### Manual Verification
```bash
# Check state file for tags
jq '.active_tags' .beads-planning-state.json

# Run verification manually
python3 .claude/skills/beads-friendly-planning/verify-tags.py .beads-planning-state.json

# Check LCL context flow
jq '.lcl_context' .beads-planning-state.json

# Verify tag resolution tracking
jq '.tags_resolved' .beads-planning-state.json
```

## Success Criteria

- ✅ All 5 tag types functional: Each tag type appears at least once across tests
- ✅ Tags created during appropriate passes: `jq '.active_tags[].pass'` shows correct pass letters (a, b, c, d, e, etc.)
- ✅ Tags resolved during verification or appropriate passes: `jq '.tags_resolved' .beads-planning-state.json` increases after verification
- ✅ LCL context flows between passes: `jq '.lcl_context' .beads-planning-state.json` contains verified_facts, active_assumptions, pending_verifications, deferred_clarifications
- ✅ Verification phase blocks completion when blocking tags remain: `verify-tags.py` exits with code 1 when blocking tags present
- ✅ Verification report generated correctly: `verify-tags.py` outputs report with tag counts and resolution status

## Troubleshooting

### Skill Not Invocable
**Error:** `/beads-friendly-planning: command not found`
**Fix:** This is a Claude Code skill. Invoke via: `Skill tool` with `skill: "beads-friendly-planning"`

### State File Not Found
**Error:** `.beads-planning-state.json: No such file or directory`
**Fix:** Run skill first to initialize state file

### Verification Script Missing
**Error:** `verify-tags.py: No such file or directory`
**Fix:** Ensure Task 6 implementation is complete (verify-tags.py should exist at `.claude/skills/beads-friendly-planning/verify-tags.py`)

### No Tags Created
**Error:** State file shows `"active_tags": []`
**Fix:** Verify plan content triggers tag creation. Check IMPLEMENTATION.md for tag triggers.

### Blocking Tags Remain After Verification
**Error:** Pass L fails with "blocking tags remain"
**Fix:** Review `jq '.active_tags' .beads-planning-state.json` and manually resolve or convert blocking tags to non-blocking

### Pre-flight Check Failures
**Error:** Skill version check fails
**Fix:** Update beads-friendly-planning skill to v2.1.3 or later

**Error:** Test data missing
**Fix:** Ensure `docs/plans/2026-01-08-autonomous-maf-foundations.md` exists in project

**Error:** jq or Python 3 missing
**Fix:** Install missing dependencies: `apt-get install jq python3`
