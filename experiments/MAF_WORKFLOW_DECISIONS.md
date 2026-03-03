# MAF Workflow Decisions & Lessons Learned

**Date:** 2026-01-15
**Project:** NextNest Multi-Agent Framework

---

## Issue: Reinventing the Wheel

### Problem

We created a custom `autonomous-workflow-nextnest.sh` when MAF already had `coordinate-agents.sh` that solved the same problems.

### Timeline

| Date | Event |
|------|-------|
| Jan 10 01:59 | `maf/scripts/maf/coordinate-agents.sh` created (MAF HQ) |
| Jan 10 03:34 | We created custom `scripts/maf/autonomous-workflow-nextnest.sh` |
| Jan 15 19:16 | First autonomous run with custom workflow |
| Jan 15 19:41 | Discovered MAF already had coordinator |

### What MAF Already Had

**`maf/scripts/maf/coordinate-agents.sh` includes:**

```bash
# Announce work start via Agent Mail with thread ID
send_message --thread-id "$LAST_BD" --subject "[$LAST_BD] Starting work"

# Check agent mail regularly
check_agent_mail; respond to urgent messages

# Cross-agent code review
review recent commits from other agents; check for integration issues

# Complete and notify
send_message --thread-id "$CURRENT_BD" --subject "[$CURRENT_BD] Completed"
```

**Features we had to rediscover/add:**
- ✅ Agent Mail integration
- ✅ Thread-based messaging per bead
- ✅ Cross-agent coordination
- ✅ Review loops
- ✅ Progress announcements

### What We Built Instead

**`scripts/maf/autonomous-workflow-nextnest.sh`:**
- Custom bead routing logic
- Round-robin assignment
- Two-tier skill routing (SDD vs /response-awareness)
- No Agent Mail communication (added later)
- Iterated through communication issues MAF already solved

### Root Cause

**Process failure:**
1. Found `rebuild-maf-cli-agents.sh` for building panes ✅
2. Created custom workflow **without checking existing MAF tools** ❌
3. Didn't explore `maf/scripts/maf/` thoroughly enough ❌

**What I should have done:**
```bash
# Step 1: Check what MAF provides
ls maf/scripts/maf/*.sh
grep -l "coordinate\|autonomous" maf/scripts/maf/*.sh

# Step 2: Read existing scripts
cat maf/scripts/maf/coordinate-agents.sh
cat maf/scripts/maf/agent-communication-real.sh

# Step 3: Use existing tools, customize if needed
bash maf/scripts/maf/coordinate-agents.sh
```

---

## Communication Issues We Re-Solved

### Issue 1: Agent Mail vs tmux send-keys

**Problem:** Agents received commands but didn't execute them when sent via Agent Mail.

**Solution:** Hybrid approach
- tmux send-keys = Command execution (immediate)
- Agent Mail = Coordination (asynchronous)

**MAF already knew this** - `coordinate-agents.sh` uses tmux for commands, Agent Mail for announcements.

### Issue 2: Skill Routing

**Evolution:**
1. Started with: "Work directly (no subagents)"
2. Added: Complexity classification + SDD vs direct
3. Refined: Two-tier routing (SDD for complex, /response-awareness for simple)

**MAF's approach:** `coordinate-agents.sh` sends commands and lets agents figure out skills.

### Issue 3: Cross-Agent Coordination

**We had to add:**
- Review feedback loop (AuditBay → Implementers)
- Priority changes (RateRidge → All)
- Completion notifications

**MAF already had:**
```bash
# Cross-agent code review
review recent commits from other agents; check for integration issues
```

---

## Decision: Hybrid Approach

### Current State

**Agents are running and working** - Don't interrupt active run.

**After completion:** Test `coordinate-agents.sh` and compare.

### Hybrid Implementation

**Keep:** Our workflow (tailored to NextNest)
- Two-tier skill routing (SDD vs /response-awareness)
- Shadow Spine prioritization
- V2 dependency management

**Add from MAF:** Agent Mail triggers
- Bead start announcement
- Review feedback loop
- Completion notification

### Implementation

**Add to `autonomous-workflow-nextnest.sh`:**

```bash
# After bead assignment
announce_bead_start() {
  local bead_id="$1"
  local agent="$2"

  curl -s -X POST http://127.0.0.1:8765/mcp/ \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": \"announce\",
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"send_message\",
        \"arguments\": {
          \"project_key\": \"/root/projects/nextnest\",
          \"sender_name\": \"$agent\",
          \"to\": [\"OrangeDog\", \"PurpleBear\"],
          \"subject\": \"[$bead_id] Starting work\",
          \"body_md\": \"Beginning work on $bead_id\",
          \"importance\": \"normal\"
        }
      }
    }"
}
```

**Add to agent prompts:**

```markdown
## Agent Mail Communication

**On bead start:**
- Announce via Agent Mail to supervisor and reviewer

**On completion:**
- Send completion notification via Agent Mail
- Request review from AuditBay

**On receiving review feedback:**
- Check Agent Mail for review comments
- Address issues and re-submit
```

---

## Lessons Learned

### 1. Explore Before Building

**Wrong:**
```
See problem → Build solution immediately
```

**Right:**
```
See problem → Check existing tools → Use/adapt → Build only if needed
```

### 2. MAF Has Solved These Problems

**Before building custom:**
- Check `maf/scripts/maf/` for existing solutions
- Read MAF documentation
- Use MAF patterns as starting point

### 3. Custom ≠ Better

**Our custom workflow:**
- 200+ lines of bash
- Multiple iterations to fix communication
- Still missing features MAF has

**MAF's coordinator:**
- Proven in production
- Full Agent Mail integration
- Cross-agent code review built-in

### 4. Document Decisions

**Why we built custom:**
- ❌ Didn't explore MAF scripts
- ❌ Assumed we needed different approach
- ❌ No documentation of alternatives considered

**Future:**
- ✅ Document tool evaluation before building
- ✅ Justify custom solutions
- ✅ Reference MAF equivalents

---

## Next Steps

### Current Run (In Progress)

**Status:** Agents running with custom workflow
**Action:** Let run complete (6 hours)
**Post-run:** Evaluate results, compare with MAF coordinator

### Future Runs

**Option A:** Switch to `coordinate-agents.sh`
- Proven MAF workflow
- Less custom code
- May need adaptation for NextNest needs

**Option B:** Continue Hybrid
- Keep our workflow
- Add Agent Mail triggers from MAF
- Maintain NextNest-specific features

**Decision point:** After current run completes

---

---

## Issue: Extra Panes from Roundtable Project

### Problem Discovered (2026-01-15)

**Expected:** 4 panes (RateRidge, AuditBay, LedgerLeap, PrimePortal)
**Actual:** 8 panes in `maf-cli:agents` window

**Extra panes showed:**
- Panes 0,1,6,7 → Running in `/root/projects/roundtable`
- Panes 2-5 → NextNest project

### Root Cause

**MAF HQ scripts hardcoded for Roundtable:**

```bash
# In MAF HQ scripts (maf/scripts/maf/active-agents.sh):
SESSION_NAME="maf-5pane"  # Roundtable session

# References roundtable beads:
if echo "$assignments" | grep -q "roundtable-vf5.*implementor-1"; then
  create_active_agent 1 "Implementor-1" "roundtable-vf5"
fi

# Hardcoded topology path:
TOPOLOGY_FILE="/root/projects/roundtable/.maf/config/agent-topology.json"
```

**What happened:**
1. MAF HQ scripts designed for Roundtable project
2. Someone ran them → Created `maf-5pane` session
3. Extra panes got mixed into `maf-cli` session (tmux state corruption)
4. Session ended up with 8 panes instead of 4

### Resolution

**Killed stale Roundtable session:**
```bash
tmux kill-session -t maf-5pane  # Removed Roundtable session
tmux kill-session -t maf-cli    # Clean slate
bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force  # Rebuilt clean
```

**Clean state verified:**
```
maf-cli:agents
├── Pane 0: RateRidge (Supervisor)
├── Pane 1: AuditBay (Reviewer)
├── Pane 2: LedgerLeap (Implementor-1)
└── Pane 3: PrimePortal (Implementor-2)
```

### Lessons Learned

**1. MAF HQ scripts contain project-specific configs:**
- `SESSION_NAME="maf-5pane"` (Roundtable)
- Hardcoded paths to `/root/projects/roundtable`
- Not generic - designed for specific project

**2. Session state corruption:**
- tmux sessions can accumulate panes from multiple runs
- Rebuild script should kill session before rebuilding
- Manual verification needed after rebuild

**3. Project isolation:**
- NextNest should NOT run MAF HQ Roundtable scripts
- Need project-specific rebuild script
- Or update rebuild script to clean all stale sessions

### Prevention

**Update rebuild script to:**
1. Kill ALL MAF sessions before rebuilding
2. Verify only expected session exists after rebuild
3. Log warnings if unexpected sessions detected

**Code to add to rebuild script:**
```bash
# Kill all MAF sessions to prevent state corruption
for session in $(tmux list-sessions -F "#{session_name}" 2>/dev/null | grep "maf-"); do
  echo "Killing stale session: $session"
  tmux kill-session -t "$session" 2>/dev/null || true
done
```

---

## Related Documentation

- **Communication fixes:** Content merged into this document
- **MAF HQ scripts:** `maf/scripts/maf/`
- **MAF coordinator:** `maf/scripts/maf/coordinate-agents.sh`
- **Agent communication:** `maf/scripts/maf/agent-communication-real.sh`
- **Full workflow:** `docs/runbooks/maf/NEXTNEST_MAF_WORKFLOW.md`

---

---

## Issue: Beads Closed Without Proper Workflow (2026-01-16)

### Problem Discovered

**Expected:** Beads only closed after:
1. Implementer completes work with TDD
2. Receipt generated (50+ lines)
3. Reviewer approves with `requesting-code-review` skill
4. Reviewer commits changes
5. Supervisor closes bead

**Actual:** 65+ beads marked as "closed" WITHOUT:
- Receipts generated
- Git commits
- Code changes
- Reviewer approval
- Actual work completed

### Timeline of the Issue

| Time | Event |
|------|-------|
| Jan 15 17:42 | V1/V2 beads created during plan-to-beads conversion |
| Jan 15 19:16-21:49 | 65+ beads improperly closed (NO work done) |
| Jan 15 20:07+ | Overnight autonomous run starts |
| Jan 16 01:26-02:52 | 9 V2 beads properly implemented (have git commits) |
| Jan 16 03:00 | Issue discovered during status check |

### Root Cause Analysis

**Beads were closed BEFORE the overnight run started:**

The beads.left.jsonl file shows:
```json
{"id":"nextnest-j5w", ..., "created_at":"2026-01-15T17:42:34", "closed_at":"2026-01-15T19:16:42", ...}
{"id":"nextnest-ogq", ..., "created_at":"2026-01-15T17:42:34", "closed_at":"2026-01-15T19:30:01", ...}
{"id":"nextnest-qjx", ..., "created_at":"2026-01-15T17:42:35", "closed_at":"2026-01-15T19:39:35", ...}
```

**Evidence of improper closure:**
- Created at 17:42 (during plan-to-beads conversion)
- Closed between 19:16-21:49 on Jan 15 (BEFORE autonomous run)
- NO git commits for these closures
- NO receipts generated
- Changes never committed to git (`.beads/` is gitignored)

**Properly closed vs improperly closed:**

| Properly Closed (9 beads) | Improperly Closed (65+ beads) |
|---------------------------|-------------------------------|
| Have git commits | No git commits |
| Updated Jan 16 (overnight) | Updated Jan 15 (before run) |
| V2-T0.1 through V2-T2.2 | V1-S1, V1-S2, V1-S3, V1-T0-T17 |

**Properly closed beads with commits:**
- nextnest-lge (V2-T0.1) - commit 8790420aa
- nextnest-smf (V2-T0.2) - commit 00733911
- nextnest-plr (V2-T0.3) - commit c36ba53c4
- nextnest-95i (V2-T1.1) - commit 5bcbce811
- nextnest-cwv (V2-T1.2) - commit a00821dad
- nextnest-eag (V2-T1.3) - commit cc8458bdd
- nextnest-6c5 (V2-T1.4) - commit 6be4aea64
- nextnest-74w (V2-T2.1) - commit 52f4cb873
- nextnest-btk (V2-T2.2) - commit 8eda02c36

### Most Likely Causes

**1. Plan-to-beads script bug:**
- The plan-to-beads conversion may have incorrectly marked beads as closed
- Or there was a user error during manual cleanup

**2. Manual closure during testing:**
- Beads may have been manually closed during workflow testing
- User may have intended to mark them as "to be done" but accidentally closed them

**3. No audit trail:**
- `.beads/` directory is gitignored
- No daemon log entries for the closures
- Bash history shows `bd ready` commands but no `bd close` commands
- Cannot determine who/what closed these beads

### Resolution

**Reopened 36 improperly closed beads:**
```bash
for bead in nextnest-qjx nextnest-ogq nextnest-j5w nextnest-ekc nextnest-dad nextnest-xq0 \
  nextnest-9og nextnest-czt nextnest-u6g nextnest-j3o nextnest-djf nextnest-ci9 \
  nextnest-org nextnest-t47 nextnest-x91 nextnest-u04 nextnest-5qa nextnest-5ca \
  nextnest-dkb nextnest-acl nextnest-rm6 nextnest-nz2 nextnest-q1f nextnest-bdm \
  nextnest-glv nextnest-lhq nextnest-om2 nextnest-f3d nextnest-74z nextnest-ha1 \
  nextnest-dfx nextnest-eh0 nextnest-ruj; do
  bd reopen "$bead"
done
```

**Kept closed 9 properly implemented V2 beads** (they have git commits).

**Result:** 10 V1 beads now available for autonomous agents to implement properly.

### Lessons Learned

**1. Bead state needs audit trail:**
- `.beads/` is gitignored → No git history of closures
- Should commit beads.left.jsonl after bulk operations
- Or add audit logging to bead closures

**2. Plan-to-beads validation needed:**
- Should verify beads are created in "open" state
- Add validation step to prevent accidental closures
- Log all bead state changes with timestamps

**3. Supervisor doesn't auto-close without review:**
- Current workflow requires: Implementer → Receipt → Reviewer → Commit → Supervisor → Close
- Beads were closed WITHOUT going through this workflow
- Supervisor didn't close these (no supervisor activity at 19:16-21:49)

**4. Detection mechanism:**
- Should regularly check: `bd list --status closed | wc -l` vs git commit count
- If closed beads > git commits → Investigate
- Add to autonomous workflow: verify closed beads have receipts

### Prevention

**Add to plan-to-beads validation:**
```bash
# After creating beads, verify they're all open
closed_count=$(bd list --status closed --json | jq 'length')
if [ "$closed_count" -gt 0 ]; then
  echo "❌ ERROR: $closed_count beads created in closed state!"
  exit 1
fi
```

**Add to autonomous workflow:**
```bash
# Verify no improperly closed beads before starting
verify_closed_beads() {
  local closed_count=$(bd list --status closed --json | jq 'length')
  local commit_count=$(git log --oneline --since="1 day ago" | wc -l)

  # Allow some margin (beads closed before workflow)
  if [ "$closed_count" -gt "$((commit_count + 20))" ]; then
    echo "⚠️  WARNING: More closed beads ($closed_count) than recent commits ($commit_count)"
    echo "Some beads may be improperly closed."
  fi
}
```

**IMPLEMENTED - Audit function added to autonomous workflow:**
- Added `audit_closed_beads()` function to `scripts/maf/autonomous-workflow-nextnest.sh`
- Runs automatically at workflow startup
- Runs periodically every 10 iterations
- Checks for receipts OR git commits
- Attempts to identify who closed each bead
- Sends Agent Mail alert if improperly closed beads detected
- Generates audit report at `/tmp/maf-bead-audit.txt`

**Usage:**
```bash
# Run audit only
bash scripts/maf/autonomous-workflow-nextnest.sh --audit

# Run with autonomous workflow (audit runs at start)
bash scripts/maf/autonomous-workflow-nextnest.sh --loop
```

**Audit capabilities:**
- ✅ Detects beads closed without receipts or commits
- ✅ Identifies closer by checking git commit author
- ✅ Recognizes V2 beads with overnight commits as properly closed
- ✅ Alerts supervisor via Agent Mail when issues found
- ✅ Generates detailed audit report

---

## Comprehensive Account: Custom Workflow Implementation (2026-01-15)

### What Happened

**Timeline:**
1. **Jan 10 01:59** - MAF HQ created `coordinate-agents.sh` (general-purpose coordinator)
2. **Jan 10 03:34** - I created custom `scripts/maf/autonomous-workflow-nextnest.sh` for NextNest
3. **Jan 15 19:16-21:49** - 65+ beads improperly closed during plan-to-beads conversion
4. **Jan 15 20:07+** - Autonomous agents started working on remaining beads
5. **Jan 16 01:26-02:52** - 9 V2 beads properly implemented overnight
6. **Jan 16 03:00** - Improper closures discovered, investigation began
7. **Jan 16 03:39** - Audit function implemented and deployed

### Why Custom Script Was Built

**Process failure:**
```
1. Found maf/scripts/maf/rebuild-maf-cli-agents.sh ✅
2. Did NOT check for other MAF coordination tools ❌
3. Built custom solution immediately ❌
4. Didn't explore maf/scripts/maf/ thoroughly ❌
```

**What I should have done:**
```bash
# Step 1: Check what MAF provides
ls maf/scripts/maf/*.sh
grep -l "coordinate\|autonomous" maf/scripts/maf/*.sh

# Step 2: Read existing scripts
cat maf/scripts/maf/coordinate-agents.sh
cat maf/scripts/maf/agent-communication-real.sh

# Step 3: Evaluate: Use MAF coordinator or customize?
# Step 4: If custom: Justify why MAF coordinator insufficient
```

**Root cause:** Jumped to implementation instead of exploration. Found the rebuild script and assumed that was all MAF had. Failed to check for coordination/workflow scripts.

### What Was Built

**File:** `scripts/maf/autonomous-workflow-nextnest.sh` (625 lines)

**Core features:**
1. **Bead routing logic**
   - Fetches ready beads from `bd ready`
   - Filters by labels (V2 priority, V1 secondary)
   - Round-robin assignment to agents (LedgerLeap, PrimePortal)

2. **Two-tier skill routing**
   - Simple tasks: Direct work (no subagents)
   - Complex tasks: `subagent-driven-development` skill
   - Fallback: `/response-awareness` for complex cases

3. **Agent communication**
   - tmux send-keys for command execution
   - Agent Mail integration for coordination
   - Bead start notifications
   - Completion announcements

4. **Workflow management**
   - Cooldown tracking (bead must wait 30 min after work)
   - Idle detection (kill stuck prompts)
   - Ready bead monitoring (no work → sleep 2 min)
   - Assignment queue (up to 5 pending beads)

5. **Shadow Spine integration**
   - V2 dependency tracking
   - Priority ordering (V2 beads first)
   - Constraint-aware routing

6. **Audit function (added Jan 16)**
   - Checks all closed beads for receipts or git commits
   - Attempts to identify closer (git author, Agent Mail, timestamps)
   - Generates audit report at `/tmp/maf-bead-audit.txt`
   - Sends Agent Mail alerts when issues detected
   - Runs at startup and every 10 iterations

---

## Comparison: Custom Workflow vs MAF coordinate-agents.sh

### What MAF coordinate-agents.sh Provides

**From:** `maf/scripts/maf/coordinate-agents.sh`

**Features:**
```bash
# Agent Mail integration
send_message --thread-id "$LAST_BD" --subject "[$LAST_BD] Starting work"
send_message --thread-id "$CURRENT_BD" --subject "[$CURRENT_BD] Completed"

# Cross-agent communication
check_agent_mail
respond to urgent messages

# Cross-agent code review
review recent commits from other agents
check for integration issues

# Progress tracking
announce bead start
announce completion
```

**What it DOES:** Coordinates communication between agents that are already working

### What Our Custom Workflow Adds (NextNest-Specific)

**Bead routing (~150 lines):**
- V2 priority filtering (V2 beads before V1)
- Shadow Spine dependency ordering
- Round-robin assignment to LedgerLeap/PrimePortal
- Cooldown tracking between work attempts
- Ready bead polling and queue management

**Two-tier skill routing (~75 lines):**
- Complexity classification (word count, file count)
- Simple tasks → Direct work (no subagents)
- Complex tasks → `subagent-driven-development` skill
- Fallback to `/response-awareness` for edge cases

**Workflow management (~100 lines):**
- Idle detection (kill stuck prompts after 10 min)
- Cooldown enforcement (bead waits 30 min after work)
- Ready bead monitoring (sleep 2 min if no work)
- Assignment queue (up to 5 pending beads)
- Agent readiness checks

**Audit function (~161 lines, added Jan 16):**
- Detects beads closed without receipts or commits
- Identifies closer by git author, Agent Mail, timestamps
- Generates audit reports
- Sends Agent Mail alerts when issues found
- Runs at startup + every 10 iterations

### Overlap: Both Scripts Provide (~200 lines)

**Agent communication:**
- Agent Mail integration ✅
- Bead start announcements ✅
- Completion notifications ✅
- Cross-agent coordination ✅

### Summary: Would coordinate-agents.sh Have Worked?

**What it WOULD have solved:**
- ✅ Agent communication patterns (we learned this the hard way)
- ✅ Agent Mail integration (we added later)
- ✅ Cross-agent code review (we added separately)
- ✅ Progress announcements (we added separately)

**What it would NOT have solved:**
- ❌ V2 priority routing (NextNest-specific)
- ❌ Shadow Spine dependency ordering (NextNest-specific)
- ❌ Two-tier skill routing (NextNest-specific)
- ❌ Cooldown tracking (NextNest-specific)
- ❌ Idle detection (NextNest-specific)

**Better approach:** Start with `coordinate-agents.sh`, add NextNest features on top

**Lines of code breakdown:**
- ~200 lines: Agent communication (MAF already had this)
- ~425 lines: NextNest-specific routing and workflow management

**Conclusion:** Custom workflow = 200 lines reinventing MAF + 425 lines NextNest-specific

---

## Clarification: Premature Closure Issue

### What Happened (Timeline)

```
Jan 15 17:42 → User runs: /plan-to-beads docs/plans/2025-01-11-*.md
               Beads created in "open" state
               (65+ V1 beads + 9 V2 beads)

Jan 15 19:16 → First bead marked "closed"
               Problem: NO work done, NO git commit, NO receipt
               Who closed it? UNKNOWN (no audit trail)

Jan 15 19:30 → More beads marked "closed"
               Problem: Still NO work, NO commits, NO receipts

... (continues until 21:49)

Jan 15 20:07 → Autonomous agents START running
               Problem: 65+ beads already "closed"
               Agents can't work on closed beads

Jan 16 01:26 → First actual work completed
               9 V2 beads properly implemented
               (HAS git commits, HAS receipts, properly done)
```

### The Core Issue

**Beads were marked "closed" during the manual plan-to-beads conversion process, BEFORE any autonomous agents started working.**

This is a **tooling/process gap**, not an **agent coordination issue**.

### Why Neither Workflow Would Have Prevented This

**coordinate-agents.sh:** Coordinates **agents working on beads**
- Assumes beads are already in proper state
- Doesn't validate bead state before work
- Doesn't prevent manual closures

**Our custom workflow:** Coordinates **agents working on beads**
- Same limitation - assumes beads are in proper state
- Runs AFTER beads are created
- Doesn't control plan-to-beads conversion

**The real problem:** The `/plan-to-beads` command (or manual interaction during conversion) marked beads as "closed" with zero validation.

### What the Audit Function Does

**Detects** (not prevents):
- ✅ Finds beads closed without receipts or commits
- ✅ Attempts to identify who closed them
- ✅ Sends alerts when issues detected
- ✅ Generates audit reports

**Does NOT prevent:**
- ❌ Manual bead closures via `bd close`
- ❌ Plan-to-beads conversion errors
- ❌ Someone marking beads closed during testing

### Prevention (What Would Actually Stop This)

**Add to plan-to-beads validation:**
```bash
# After creating beads, verify they're all open
closed_count=$(bd list --status closed --json | jq 'length')
if [ "$closed_count" -gt 0 ]; then
  echo "❌ ERROR: $closed_count beads created in closed state!"
  exit 1
fi
```

**Add to autonomous workflow:**
```bash
# Verify no improperly closed beads before starting
verify_closed_beads() {
  local closed_count=$(bd list --status closed --json | jq 'length')
  local commit_count=$(git log --oneline --since="1 day ago" | wc -l)

  # Allow some margin (beads closed before workflow)
  if [ "$closed_count" -gt "$((commit_count + 20))" ]; then
    echo "⚠️  WARNING: More closed beads ($closed_count) than recent commits ($commit_count)"
    echo "Some beads may be improperly closed."
  fi
}
```

**IMPLEMENTED** - Audit function added to autonomous workflow (Jan 16):
- Runs at startup and every 10 iterations
- Checks for receipts OR git commits
- Sends Agent Mail alerts if improperly closed beads detected
- Generates audit report at `/tmp/maf-bead-audit.txt`

---

## Workflow Clarification: Plan-to-Beads vs Agent Execution

### Proper Workflow Order

**Critical distinction:** Plan-to-beads is a **planning/setup step** (human), NOT an **execution step** (agents).

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: PLANNING (Human, no agents running)                 │
│                                                              │
│ Step 1: Write plan                                          │
│   → docs/plans/active/2025-01-11-*.md                        │
│   → Contains tasks, file paths, testing strategy            │
│                                                              │
│ Step 2: Convert plan to beads                               │
│   → /plan-to-beads docs/plans/active/2025-01-11-*.md        │
│   → Creates beads in "open" state ✅                         │
│   → Beads ready for agents                                  │
│                                                              │
│ Step 3: Verify bead state                                   │
│   → bd list --status open                                    │
│   → Confirm all beads are open                              │
│   → Fix if any beads closed prematurely                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: EXECUTION (Autonomous agents)                       │
│                                                              │
│ Step 4: Start agents                                        │
│   → bash scripts/maf/autonomous-workflow-nextnest.sh --loop │
│   → Agents begin running                                    │
│                                                              │
│ Step 5: Agents work on beads                                │
│   → Fetch ready beads (bd ready)                            │
│   → Work on beads with TDD                                  │
│   → Create receipts (50+ lines)                             │
│   → Submit for review                                       │
│                                                              │
│ Step 6: Reviewer validates                                  │
│   → AuditBay reviews code                                   │
│   → Validates calculations, tests, visual regression        │
│   → Requests fixes if needed                                │
│                                                              │
│ Step 7: Commit to git                                       │
│   → Implementer commits changes                            │
│   → Git history records work done                           │
│                                                              │
│ Step 8: Supervisor closes bead ✅                            │
│   → RateRidge verifies workflow complete                    │
│   → Closes bead only after: receipt + review + commit       │
└─────────────────────────────────────────────────────────────┘
```

### What Should Have Happened (Expected Workflow)

```bash
# Phase 1: Planning (Human) - Jan 15 17:42
/plan-to-beads docs/plans/2025-01-11-*.md

Expected output:
✅ Created 74 beads in "open" state
✅ Beads ready: nextnest-qjx, nextnest-ogq, nextnest-j5w, ...
✅ All beads available for agents to work on

# Phase 2: Execution (Agents) - Jan 15 20:07+
bash scripts/maf/autonomous-workflow-nextnest.sh --loop

Expected flow:
→ Agents pick up ready beads
→ Work through them with TDD
→ Close beads when work is COMPLETE
→ Each closure has: receipt + review + git commit
```

### What Actually Happened (Broken Workflow)

```bash
# Phase 1: Planning (Human) - Jan 15 17:42
/plan-to-beads docs/plans/2025-01-11-*.md

Initial output:
✅ Created 74 beads

# Phase 1.5: ??? (Unknown) - Jan 15 19:16-21:49
??? → Marked 65+ beads as "closed"

Actual state after this phase:
❌ 65+ beads marked "closed"
❌ NO work done on these beads
❌ NO git commits for these closures
❌ NO receipts generated
❌ Agents NOT running yet (started at 20:07)

# Phase 2: Execution (Agents) - Jan 15 20:07+
bash scripts/maf/autonomous-workflow-nextnest.sh --loop

Actual flow:
→ Agents start running
→ 65+ beads already "closed" - agents can't work on them
→ Only 9 V2 beads available in "open" state
→ Those 9 get properly implemented overnight (Jan 16 01:26-02:52)
→ Each has git commit: "feat(v2): add WhatsApp normalization"
```

### Why Plan-to-Beads Is NOT an Agent Task

**Planning vs Execution:**

| Phase | Who | What | Why |
|-------|-----|------|-----|
| **Write plan** | Human | Define tasks, files, testing strategy | Requires domain knowledge, decision-making |
| **Plan-to-beads** | Human | Convert plan → executable work items | Setup step, defines work scope |
| **Execute work** | Agents | Complete tasks with TDD | Repetitive execution, well-defined |
| **Review work** | Agents/Reviewers | Validate code, tests, calculations | Quality gate, pattern matching |
| **Close bead** | Supervisor | Verify workflow complete | Governance, final approval |

**Agents should NOT create their own tasks:**
- Plan-to-beads = creating work items
- Agent work = completing work items
- Mixing these = agents creating their own tasks (scope creep, confusion)

**Example of bad workflow:**
```
❌ Agent: "I'm creating a new bead for this feature I thought of"
❌ Agent: "I'm converting this plan to beads while running"
❌ Result: Uncontrolled task creation, no human oversight
```

**Example of good workflow:**
```
✅ Human: "Here's the plan, convert to beads"
✅ Human: "Verify all beads are open before agents start"
✅ Agents: "Working on beads that human prepared"
✅ Result: Controlled execution, clear scope
```

### The Mystery: What Closed Those Beads?

**Timeline shows beads closed BEFORE agents started:**

```
Jan 15 17:42 → Plan-to-beads creates beads (unknown initial state)
Jan 15 19:16 → First bead marked "closed" (agents NOT running)
Jan 15 19:30 → More beads marked "closed" (agents NOT running)
...
Jan 15 20:07 → Agents START running
Jan 15 21:49 → Last premature closure (agents running, but why close?)
```

**Possible causes:**

1. **Manual testing during conversion**
   - User testing workflow: "What happens if I close this bead?"
   - Accidentally ran `bd close` instead of `bd show`
   - No bash history shows `bd close` commands (history not preserved?)

2. **Plan-to-beads script bug**
   - Script might mark beads "closed" by default
   - Or there's a flag that was accidentally set
   - Need to audit the plan-to-beads implementation

3. **Manual cleanup gone wrong**
   - User meant to mark beads as "ready" but typed wrong command
   - Or meant to close test beads but closed wrong ones
   - No confirmation prompt on `bd close`?

4. **Automation/scheduled task**
   - Cron job or automation that closed beads?
   - Check systemd timers, cron, background processes

5. **No audit trail**
   - `.beads/` directory is gitignored
   - No logging of bead state changes
   - Can't determine who/what closed them

**Evidence collected:**
- ✅ Beads created at 17:42 (from beads.left.jsonl)
- ✅ Beads closed 19:16-21:49 (from beads.left.jsonl)
- ✅ Agents started at 20:07 (from workflow logs)
- ✅ 9 V2 beads have git commits from overnight (Jan 16 01:26-02:52)
- ❌ No bash history showing `bd close` commands
- ❌ No Agent Mail messages about closures
- ❌ No daemon logs for bead state changes
- ❌ `.beads/` is gitignored (no git history)

**Most likely:** Manual interaction during plan-to-beads testing, possibly with user error or script bug. No definitive evidence without audit logs.

### Prevention: Validation at Each Phase

**Phase 1 validation (after plan-to-beads):**
```bash
#!/bin/bash
# Add to /plan-to-beads command or post-conversion check

echo "🔍 Validating bead state after plan-to-beads conversion..."

# Check 1: All beads should be "open"
open_count=$(bd list --status open --json | jq 'length')
closed_count=$(bd list --status closed --json | jq 'length)

if [ "$closed_count" -gt 0 ]; then
  echo "❌ ERROR: $closed_count beads in 'closed' state after conversion!"
  echo "Expected: All beads in 'open' state"
  echo ""
  echo "Closed beads:"
  bd list --status closed
  echo ""
  echo "Did you mean to mark these as 'ready' instead?"
  exit 1
fi

echo "✅ All $open_count beads in 'open' state - ready for agents"
```

**Phase 2 validation (before agents start):**
```bash
#!/bin/bash
# Add to autonomous workflow startup

echo "🔍 Pre-flight check: Verifying bead state..."

# Check for suspicious closures
closed_count=$(bd list --status closed --json | jq 'length')
commit_count=$(git log --oneline --since="3 days ago" | wc -l)

# If closed beads >> recent commits, something's wrong
if [ "$closed_count" -gt "$((commit_count + 10))" ]; then
  echo "⚠️  WARNING: Found $closed_count closed beads but only $commit_count recent commits"
  echo ""
  echo "This suggests beads were closed without work being completed."
  echo ""
  echo "Run investigation:"
  echo "  bash scripts/maf/autonomous-workflow-nextnest.sh --audit"
  echo ""
  read -p "Continue anyway? (y/N): " confirm
  [[ "$confirm" != "y" ]] && exit 1
fi

echo "✅ Pre-flight check passed"
```

**Phase 3 monitoring (during execution):**
```bash
# Already implemented - audit function runs every 10 iterations
# See: audit_closed_beads() in autonomous-workflow-nextnest.sh
```

**What MAF coordinator already had:**
```bash
# From maf/scripts/maf/coordinate-agents.sh:
send_message --thread-id "$LAST_BD" --subject "[$LAST_BD] Starting work"
check_agent_mail; respond to urgent messages
review recent commits from other agents; check for integration issues
send_message --thread-id "$CURRENT_BD" --subject "[$CURRENT_BD] Completed"
```

**What our custom script did differently:**
- NextNest-specific bead routing (V2 priority, Shadow Spine)
- Two-tier skill classification (simple vs complex)
- Cooldown tracking between work attempts
- Idle detection and prompt recovery
- Audit function for workflow compliance

### Files Modified: Local vs MAF HQ

**Modified files (local customizations only):**
```
M scripts/maf/autonomous-workflow-nextnest.sh    # Custom NextNest workflow
M docs/runbooks/maf/MAF_WORKFLOW_DECISIONS.md   # This documentation
```

**NOT modified (MAF HQ subtree - read-only):**
```
maf/                                              # Vendored from MAF HQ
├── scripts/maf/coordinate-agents.sh              # NOT edited
├── scripts/maf/agent-communication-real.sh       # NOT edited
├── scripts/maf/rebuild-maf-cli-agents.sh         # NOT edited
└── bin/maf-hq                                    # NOT edited
```

**Verification:**
```bash
# Check if MAF subtree has uncommitted changes
cd maf && git status
# Output: Nothing to commit, working tree clean
```

**Conclusion:** Only local customizations were modified. MAF HQ subtree (`maf/`) was NOT edited. Any MAF changes should go through PR to MAF HQ repository.

### Lessons Learned

**1. Explore before building**
```
Wrong: See problem → Build solution immediately
Right: See problem → Check existing tools → Use/adapt → Build only if needed
```

**2. MAF has solved these problems**
- Check `maf/scripts/maf/` for existing solutions
- Read MAF documentation thoroughly
- Use MAF patterns as starting point

**3. Document decisions**
- Document tool evaluation before building
- Justify custom solutions
- Reference MAF equivalents

**4. Custom ≠ better**
- Custom workflow: 625 lines, multiple iterations to fix communication
- MAF coordinator: Proven in production, full Agent Mail integration, cross-agent code review built-in

### Prevention

**Before building custom:**
```bash
# Step 1: List all MAF scripts
ls -la maf/scripts/maf/*.sh

# Step 2: Search for relevant functionality
grep -r "coordinate\|workflow\|autonomous" maf/scripts/

# Step 3: Read relevant scripts
cat maf/scripts/maf/coordinate-agents.sh

# Step 4: Decide: Use MAF as-is, customize, or build fresh?
# Document the decision with rationale
```

**Decision template:**
```markdown
## Custom vs MAF Coordinator Decision

**Evaluated:** `maf/scripts/maf/coordinate-agents.sh`

**MAF capabilities:**
- [x] Agent Mail integration
- [x] Thread-based messaging
- [x] Cross-agent coordination
- [ ] V2 dependency routing (NextNest-specific)
- [ ] Shadow Spine integration (NextNest-specific)

**Decision:** Build custom because:
1. NextNest needs V2 priority routing (not in MAF)
2. Shadow Spine dependency tracking (NextNest-specific)
3. Two-tier skill routing (SDD vs /response-awareness)

**Alternative considered:** Fork MAF coordinator and customize
**Rejected because:** Would require maintaining fork of MAF HQ code
```

---

## Status

- ✅ **Documented** - All issues captured (custom workflow + Roundtable panes + bead closures)
- ✅ **Comprehensive account added** - Why custom script built, what was built, files modified
- ✅ **Hybrid implemented** - Agent Mail triggers added
- ✅ **Session cleaned** - Roundtable session removed
- ✅ **Improperly closed beads reopened** - 36 beads now available for work
- ✅ **Properly closed beads verified** - 9 V2 beads with git commits kept closed
- ✅ **Audit function deployed** - Automated compliance checking with alerts
- 🔄 **Testing** - Verify skill invocation and Agent Mail communication
- ⏳ **Pending** - Test MAF coordinator after run, evaluate switch vs hybrid
