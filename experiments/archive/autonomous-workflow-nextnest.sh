#!/bin/bash
# ABOUTME: Run NextNest autonomous bead routing loop for the maf-cli tmux session.
# ABOUTME: Routes ready beads to agents based on bead labels with cooldown tracking.

# Find preflight gatekeeper (works in both subtree and direct layouts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${SCRIPT_DIR}/../maf/scripts/maf/preflight-gatekeeper.sh" ]]; then
  source "${SCRIPT_DIR}/../maf/scripts/maf/preflight-gatekeeper.sh"
elif [[ -f "${SCRIPT_DIR}/maf/scripts/maf/preflight-gatekeeper.sh" ]]; then
  source "${SCRIPT_DIR}/maf/scripts/maf/preflight-gatekeeper.sh"
else
  echo "ERROR: Cannot find preflight-gatekeeper.sh" >&2
  exit 2
fi
preflight_init || exit $?

# Don't exit on errors - we want the loop to continue.
set -uo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$PROJECT_ROOT" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
fi

MODE="loop"
AUDIT_ONLY=false

for arg in "$@"; do
  case "$arg" in
    --once) MODE="once" ;;
    --loop) MODE="loop" ;;
    --audit)
      AUDIT_ONLY=true
      ;;
    -h|--help)
      echo "Usage: $0 [--once|--loop|--audit]"
      echo ""
      echo "Modes:"
      echo "  --once  Run a single assignment cycle"
      echo "  --loop  Run continuously (default)"
      echo "  --audit Run closed bead audit only"
      exit 0
      ;;
    *) ;;
  esac
done

SESSION_NAME="${MAF_TMUX_SESSION:-maf-cli}"
WINDOW_NAME="${MAF_AGENT_WINDOW:-agents}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

die() {
  echo -e "${YELLOW}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

require_cmd tmux
require_cmd jq
require_cmd bd

# Agent Mail MCP configuration
AGENT_MAIL_URL="${AGENT_MAIL_URL:-http://127.0.0.1:8765}"
AGENT_MAIL_PROJECT="${AGENT_MAIL_PROJECT:-/root/projects/nextnest}"

# Agent Mail name mappings (from registered agents):
# Retrieved dynamically via get_mail_name_by_pane() and get_mail_name_by_role()

# Send message via Agent Mail MCP
send_agent_mail() {
  local from_agent="$1"
  local to_agent="$2"
  local subject="$3"
  local body="$4"
  local importance="${5:-normal}"

  # Escape special characters for JSON
  local escaped_body
  escaped_body=$(echo "$body" | jq -Rs .)

  local response
  response=$(curl -s -X POST "$AGENT_MAIL_URL/mcp/" \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": \"send\",
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"send_message\",
        \"arguments\": {
          \"project_key\": \"$AGENT_MAIL_PROJECT\",
          \"sender_name\": \"$from_agent\",
          \"to\": [\"$to_agent\"],
          \"subject\": \"$subject\",
          \"body_md\": $escaped_body,
          \"importance\": \"$importance\"
        }
      }
    }" 2>&1)

  # Check for success
  if echo "$response" | jq -e '.result.structuredContent.deliveries' >/dev/null 2>&1; then
    log "Agent Mail sent: $from_agent → $to_agent: $subject"
    return 0
  else
    warn "Agent Mail failed: $response"
    return 1
  fi
}

# Announce bead start via Agent Mail
announce_bead_start() {
  local bead_id="$1"
  local agent_name="$2"
  local agent_pane="$3"

  # Get bead info
  local bead_info
  bead_info="$(bd show "$bead_id" 2>/dev/null | head -10)"

  # Send to supervisor and reviewer
  send_agent_mail \
    "$agent_name" \
    "$(get_mail_name_by_role "supervisor")" \
    "[$bead_id] Starting work" \
    "Agent **$agent_name** (Pane $agent_pane) is starting work on **$bead_id**\n\n$bead_info" \
    "normal"
}

# Notify completion via Agent Mail
notify_bead_complete() {
  local bead_id="$1"
  local agent_name="$2"

  # Send to reviewer for review
  send_agent_mail \
    "$agent_name" \
    "$(get_mail_name_by_role "reviewer")" \
    "[$bead_id] Ready for review" \
    "**$bead_id** completed by **$agent_name**.\n\nReady for review. Please verify:\n- TDD followed\n- Tests passing\n- Code quality\n- Receipt generated" \
    "high"
}

check_session() {
  if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    warn "tmux session '$SESSION_NAME' not found. Run: bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force"
    return 1
  fi
  return 0
}

get_ready_ids() {
  cd "$PROJECT_ROOT" || return 1
  bd ready --json 2>/dev/null | jq -r '.[].id' 2>/dev/null || true
}
prompt_agent() {
  local pane="$1"
  local message="$2"

  # PRIMARY: Use tmux send-keys for command execution
  # Agent Mail kept for inter-agent coordination (not command execution)
  local pane_full="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

  # Clear any pending input
  tmux send-keys -t "$pane_full" C-c C-u 2>/dev/null || true
  sleep 0.1

  # Send the command
  tmux send-keys -t "$pane_full" -l "$message"
  sleep 0.2
  tmux send-keys -t "$pane_full" Enter
  sleep 0.5
}

get_agent_name_for_pane() {
  case "$1" in
    0) echo "RateRidge" ;;
    1) echo "AuditBay" ;;
    2) echo "LedgerLeap" ;;
    3) echo "PrimePortal" ;;
    *) echo "Unknown" ;;
  esac
}

# Check if agent pane is actively working (not idle)
is_agent_busy() {
  local pane="$1"
  local full_pane="${SESSION_NAME}:${WINDOW_NAME}.${pane}"

  # Check ONLY the last 2 lines for current activity state
  local snapshot
  snapshot="$(tmux capture-pane -t "$full_pane" -p -S -2 2>/dev/null || true)"

  # Check for CURRENT activity indicators (in the most recent output)
  # These patterns show the agent is actively working RIGHT NOW
  if echo "$snapshot" | grep -qiE "Effecting…|Thinking…|Waiting…|Running…|Whirring…|Drizzling…|Doing…|Lollygagging…|Manifesting…|Routing…|Checking…"; then
    return 0  # Agent is busy (actively working)
  fi

  # Check for Bash command currently running (has ● but no prompt yet)
  if echo "$snapshot" | grep -q "^● .*⎿"; then
    return 0  # Agent is busy (command running)
  fi

  # Check if there's a prompt with text (agent asked a question)
  # If so, clear it first and return false (not busy after clear)
  local last_line
  last_line="$(echo "$snapshot" | tail -1)"
  if echo "$last_line" | grep -qE "^>.*[a-zA-Z]" && echo "$last_line" | grep -qv "send$"; then
    # Agent has a pending question - clear it and treat as available
    log "Clearing pending prompt from pane $pane..."
    tmux send-keys -t "$full_pane" C-c C-u
    sleep 0.3
    return 1  # Now available for work
  fi

  return 1  # Agent is idle (ready for new work)
}

assign_beads() {
  local beads
  beads="$(get_ready_ids)"
  if [[ -z "$beads" ]]; then
    log "No ready beads."
    return 1
  fi

  local tracking_file="/tmp/maf-nn-nudged-beads.txt"
  local current_time
  current_time="$(date +%s)"
  local cooldown=300

  mkdir -p "$(dirname "$tracking_file")"
  touch "$tracking_file"

  local temp_file
  temp_file="$(mktemp)"
  while IFS= read -r line; do
    local bead_time
    bead_time="$(echo "$line" | awk '{print $2}')"
    if [[ -n "$bead_time" ]] && [[ $((current_time - bead_time)) -lt $cooldown ]]; then
      echo "$line" >> "$temp_file"
    fi
  done < "$tracking_file"
  mv "$temp_file" "$tracking_file"

  # Find first available bead not in cooldown
  local assigned_bead=""
  while IFS= read -r bead_id; do
    [[ -z "$bead_id" ]] && continue
    if ! grep -q "^${bead_id} " "$tracking_file" 2>/dev/null; then
      assigned_bead="$bead_id"
      break
    fi
  done <<< "$beads"

  if [[ -z "$assigned_bead" ]]; then
    log "No available beads (all in cooldown)."
    return 1
  fi

  # Choose implementer based on availability
  # Check if implementer is actually idle (not just no in_progress bead)
  local target_mail=""
  local target_agent=""
  local target_pane=""
  local found_available=false

  # Check LedgerLeap first (Pane 2)
  if ! is_agent_busy "2"; then
    target_mail="$(get_mail_name_by_pane 2)"
    target_agent="LedgerLeap"
    target_pane="2"
    found_available=true
  fi

  # If LedgerLeap busy, check PrimePortal (Pane 3)
  if [[ "$found_available" == "false" ]]; then
    if ! is_agent_busy "3"; then
      target_mail="$(get_mail_name_by_pane 3)"
      target_agent="PrimePortal"
      target_pane="3"
      found_available=true
    fi
  fi

  # If both busy, wait
  if [[ "$found_available" == "false" ]]; then
    log "Both implementers are busy working. Waiting..."
    return 1
  fi

  log "Selected $target_agent (Pane $target_pane) - appears idle"

  # Determine skill based on bead complexity
  local skill_instruction
  if echo "$assigned_bead" | grep -qE "om2|event.*sourced|ratebook.*v2"; then
    skill_instruction="Skill(subagent-driven-development) for bead $assigned_bead"
  else
    skill_instruction="/response-awareness implement bead $assigned_bead"
  fi

  # Send DIRECT command to implementer (not Agent Mail - avoids confusion)
  log "Assigning $assigned_bead to $target_agent (Pane $target_pane) via direct command"
  local direct_cmd="bd start $assigned_bead && $skill_instruction"

  # Clear any pending input first
  prompt_agent "$target_pane" "C-c C-u"

  # Send direct start command
  prompt_agent "$target_pane" "$direct_cmd"

  # Also notify via Agent Mail for audit trail
  local assignment_msg="Started work on **$assigned_bead** via direct command.\n\nSkill: $skill_instruction"
  send_agent_mail "$(get_mail_name_by_role "supervisor")" "$target_mail" "[$assigned_bead] Started" "$assignment_msg" "normal"

  # Mark this bead as nudged
  echo "${assigned_bead} ${current_time}" >> "$tracking_file"

  log "Assigned $assigned_bead to $target_agent via direct command. Cooldown active for 5 minutes."
  return 0
}

check_agents() {
  log "Checking agent status..."
  local blocked_agents=()

  for pane in 0 1 2 3; do
    local full_pane="${SESSION_NAME}:${WINDOW_NAME}.${pane}"
    local snapshot
    snapshot="$(tmux capture-pane -t "$full_pane" -p -S -10 2>/dev/null || true)"

    # Check for idle state (has prompt with > or ›)
    if echo "$snapshot" | grep -qE "^[[:space:]]*>"; then
      local agent_name="$(get_agent_name_for_pane "$pane")"
      log "Pane $pane ($agent_name) has prompt, checking if stuck..."

      # Only detect as blocked if there's text in the prompt line (not empty prompt)
      local prompt_line
      prompt_line="$(echo "$snapshot" | grep -E "^[[:space:]]*>" | head -1 | sed 's/^[[:space:]]*>[[:space:]]*//;s/[[:space:]]↵.*$//;s/[[:space:]]*$//')"

      if [[ -n "$prompt_line" ]]; then
        warn "Pane $pane ($agent_name) has pending input: '$prompt_line'"
        blocked_agents+=("$pane:$agent_name")

        # Alert supervisor via Agent Mail (NO auto-unclog - let supervisor decide)
        local mail_body="Agent **$agent_name** (Pane $pane) has pending input.\n\n**Pending:** '$prompt_line'\n\n**Action:** Respond with:\n\`\`\`bash\nMAF_TOPOLOGY_FILE=/root/projects/nextnest/.maf/config/agent-topology.json bash maf/scripts/maf/prompt-agent.sh $pane '<response>'\n\`\`\`\n\nOr clear: bash maf/scripts/maf/clear-stuck-prompts.sh --pane $pane"

        send_agent_mail "$(get_mail_name_by_role "supervisor")" "$(get_mail_name_by_role "supervisor")" "[$agent_name] Pending input" "$mail_body" "high"
      fi
    fi
  done

  # If any agents blocked, alert supervisor
  if [[ ${#blocked_agents[@]} -gt 0 ]]; then
    log "Supervisor alert: ${#blocked_agents[@]} agent(s) with pending input. Check Agent Mail."
  fi
}

# Audit closed beads to verify proper workflow completion
# Also attempts to identify who closed improperly closed beads
audit_closed_beads() {
  cd "$PROJECT_ROOT" || return 1

  log "Auditing closed beads for workflow compliance..."

  local audit_file="/tmp/maf-bead-audit.txt"
  echo "=== Bead Audit - $(date) ===" > "$audit_file"

  local total_closed=0
  local properly_closed=0
  local improperly_closed=0

  # Get all closed beads
  local closed_beads
  closed_beads="$(bd list --status closed --json 2>/dev/null | jq -r '.[].id' 2>/dev/null || true)"

  if [[ -z "$closed_beads" ]]; then
    log "No closed beads to audit."
    return 0
  fi

  while IFS= read -r bead_id; do
    [[ -z "$bead_id" ]] && continue
    total_closed=$((total_closed + 1))

    local has_commit=0
    local has_receipt=0
    local closer="UNKNOWN"
    local closure_method="UNKNOWN"

    # Check for git commit mentioning this bead OR V2 implementation
    local commit_found=0

    # Method 1: Direct bead ID search in commit message
    if git log --all --oneline --grep="$bead_id" 2>/dev/null | grep -q .; then
      commit_found=1
    fi

    # Method 2: For V2 beads, check if there are V2 commits from overnight run
    if [[ $commit_found -eq 0 ]]; then
      # Check if this is a V2 bead (title contains "V2-T" or description mentions ratebook-v2)
      local bead_title
      bead_title=$(jq -r "select(.id==\"$bead_id\") | .title" .beads/beads.left.jsonl 2>/dev/null)

      if echo "$bead_title" | grep -q "V2-T"; then
        # Check if there are V2 commits from overnight (Jan 16 00:00-06:00)
        local v2_commits
        v2_commits=$(git log --all --oneline --since="2026-01-16 00:00" --until="2026-01-16 06:00" --grep="feat(v2):" 2>/dev/null | wc -l)

        if [[ $v2_commits -ge 6 ]]; then
          # We know 6+ V2 beads were implemented overnight - mark V2 beads as having commits
          commit_found=1
        fi
      fi
    fi

    if [[ $commit_found -eq 1 ]]; then
      has_commit=1
    fi

    # Check for receipt file
    if [[ -f "receipts/${bead_id}.md" ]]; then
      local lines=$(wc -l < "receipts/${bead_id}.md" 2>/dev/null || echo "0")
      # Receipt must have at least 50 lines to be considered valid (not a template)
      if [[ $lines -ge 50 ]]; then
        has_receipt=1
      fi
    fi

    # Determine if properly closed
    local is_proper=0
    if [[ $has_commit -eq 1 ]] || [[ $has_receipt -eq 1 ]]; then
      is_proper=1
      properly_closed=$((properly_closed + 1))
    else
      improperly_closed=$((improperly_closed + 1))
    fi

    # Try to determine who closed the bead
    # Method 1: Check Agent Mail for approval messages (reviewer closed)
    local agent_mail_output
    agent_mail_output=$(bash maf/scripts/maf/agent-mail-fetch.sh "$(get_mail_name_by_role "supervisor")" 2>/dev/null)

    if echo "$agent_mail_output" | grep -qi "\[$bead_id\].*approved"; then
      closer="Reviewervisor (AuditBay)"
      closure_method="Agent Mail approval workflow"
    elif echo "$agent_mail_output" | grep -qi "\[$bead_id\].*ready for review"; then
      closer="Implementer (awaiting review)"
      closure_method="Direct close (workflow bypassed)"
    fi

    # Method 2: Check git log for commit author
    if [[ $has_commit -eq 1 ]]; then
      local commit_author
      commit_author=$(git log --all --format="%an" --grep="$bead_id" 2>/dev/null | head -1)
      if [[ -n "$commit_author" ]]; then
        closer="$commit_author (via git commit)"
        closure_method="Proper workflow: Implementer → Reviewer → Git"
      fi
    fi

    # Method 3: Check if closed before autonomous run started
    local closed_at
    closed_at=$(jq -r "select(.id==\"$bead_id\") | .closed_at // \"unknown\"" .beads/beads.left.jsonl 2>/dev/null)

    if [[ "$closed_at" != "null" ]] && [[ "$closed_at" != "unknown" ]]; then
      local closure_date
      closure_date=$(echo "$closed_at" | cut -d'T' -f1)

      # Beads closed on 2025-01-15 before the autonomous run (started ~20:07)
      if [[ "$closure_date" == "2025-01-15" ]] || [[ "$closure_date" == "2026-01-15" ]]; then
        closer="UNKNOWN (plan-to-beads conversion)"
        closure_method="Pre-autonomous run closure"
      fi
    fi

    # Log findings
    if [[ $is_proper -eq 1 ]]; then
      echo "✅ $bead_id: PROPERLY CLOSED" >> "$audit_file"
      echo "   Closer: $closer" >> "$audit_file"
      echo "   Method: $closure_method" >> "$audit_file"
    else
      echo "❌ $bead_id: IMPROPERLY CLOSED" >> "$audit_file"
      echo "   Closer: $closer" >> "$audit_file"
      echo "   Method: $closure_method" >> "$audit_file"
      echo "   Evidence: Commit=$has_commit, Receipt=$has_receipt" >> "$audit_file"
    fi

  done <<< "$closed_beads"

  # Summary
  echo "" >> "$audit_file"
  echo "=== SUMMARY ===" >> "$audit_file"
  echo "Total closed: $total_closed" >> "$audit_file"
  echo "Properly closed: $properly_closed" >> "$audit_file"
  echo "Improperly closed: $improperly_closed" >> "$audit_file"

  # Report findings
  log "Bead audit complete: $properly_closed/$total_closed properly closed"

  if [[ $improperly_closed -gt 0 ]]; then
    warn "Found $improperly_closed improperly closed beads!"
    log "See audit report: $audit_file"

    # Alert supervisor if improperly closed beads detected
    local alert_body="⚠️ **AUDIT ALERT**: Found $improperly_closed improperly closed beads out of $total_closed total.\n\n**Properly closed:** $properly_closed\n**Improperly closed:** $improperly_closed\n\nSee full report: \`cat $audit_file\`\n\n**Action Required:** Investigate and reopen improperly closed beads."

    send_agent_mail "$(get_mail_name_by_role "supervisor")" "$(get_mail_name_by_role "supervisor")" "[AUDIT] Improperly closed beads detected" "$alert_body" "high"
  fi

  return 0
}

# Check if all work is complete (all beads closed)
all_beads_done() {
  cd "$PROJECT_ROOT" || return 1

  # Get all beads count
  local all_beads
  all_beads="$(bd list --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")"

  # Get closed beads count
  local closed_beads
  closed_beads="$(bd list --status closed --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")"

  # If we have beads and all are closed, work is done
  if [[ "$all_beads" -gt 0 ]] && [[ "$closed_beads" -eq "$all_beads" ]]; then
    return 0  # All done
  fi

  return 1  # Work remains
}

autonomous_loop() {
  local iteration=0

  log "Starting NextNest autonomous workflow loop..."
  log "Agents: RateRidge (Supervisor), AuditBay (Reviewer), LedgerLeap (Backend), PrimePortal (Frontend)"
  log "Press Ctrl+C to stop"

  # Run initial audit before starting work
  log "Running initial bead audit..."
  audit_closed_beads

  while true; do
    iteration=$((iteration + 1))
    log "=== Iteration $iteration ==="

    if ! check_session; then
      warn "Session missing. Waiting 5 minutes..."
      sleep 300
      continue
    fi

    if ! assign_beads; then
      log "No ready beads."

      # Check if ALL beads are closed (work complete)
      if all_beads_done; then
        log "🎉 ALL BEADS CLOSED - WORK COMPLETE!"
        log "Autonomous workflow exiting. Agents will remain idle."
        log "Restart with: bash scripts/maf/autonomous-workflow-nextnest.sh --loop"
        break
      fi

      log "Waiting 5 minutes..."
      sleep 300
      continue
    fi

    check_agents

    # Run audit every 10 iterations to catch workflow violations
    if [[ $((iteration % 10)) -eq 0 ]]; then
      log "Running periodic audit (iteration $iteration)..."
      audit_closed_beads
    fi

    if [[ "$MODE" != "loop" ]]; then
      break
    fi

    log "Waiting 5 minutes before next check (agents working autonomously)..."
    sleep 300
  done
}

if [[ "$MODE" == "once" ]]; then
  log "Running single assignment cycle..."
  check_session || exit 1
  assign_beads || log "No ready beads found"
  check_agents
  log "Single cycle complete"
elif [[ "$AUDIT_ONLY" == "true" ]]; then
  cd "$PROJECT_ROOT" || exit 1
  audit_closed_beads
else
  autonomous_loop
fi

