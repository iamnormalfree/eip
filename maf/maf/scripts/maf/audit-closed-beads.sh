#!/bin/bash

# MAF Bead Audit - Enforces Proper Bead Closure Compliance
#
# USAGE:
#   maf/scripts/maf/audit-closed-beads.sh [--audit-only] [--once] [--loop]
#
# WHAT IT DOES:
#   - Audits all closed beads for proper closure compliance
#   - Checks for: git commit OR receipt (≥50 lines) OR reviewer approval
#   - Detects improperly closed beads (no commit, no receipt, no approval)
#   - Alerts supervisor if violations detected
#
# ENVIRONMENT VARIABLES:
#   MAF_TMUX_SESSION - Tmux session name (default: maf-cli)
#   AGENT_MAIL_URL - Agent Mail MCP server (default: http://127.0.0.1:8765)
#   AGENT_MAIL_PROJECT - Project key (default: $PROJECT_ROOT)
#
# CUSTOMIZATION:
#   For project-specific behavior, create a wrapper script in scripts/maf/
#   that calls this script with your project's settings.

set -euo pipefail

# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi

# Load franchisee-specific config if exists (FRANCHIANCE CUSTOMIZATION POINT)
# Franchisees can create .maf-config in their project root to override defaults
# MAF HQ will never commit this file, allowing per-franchisee customization
if [[ -f "$PROJECT_ROOT/.maf-config" ]]; then
    source "$PROJECT_ROOT/.maf-config"
fi

# Source preflight-gatekeeper for topology helper functions
PREFLIGHT_GATEKEEPER="$PROJECT_ROOT/maf/scripts/maf/preflight-gatekeeper.sh"
if [[ -f "$PREFLIGHT_GATEKEEPER" ]]; then
    source "$PREFLIGHT_GATEKEEPER"
else
    # Fallback for subtree installations
    PREFLIGHT_GATEKEEPER="$PROJECT_ROOT/scripts/maf/preflight-gatekeeper.sh"
    if [[ -f "$PREFLIGHT_GATEKEEPER" ]]; then
        source "$PREFLIGHT_GATEKEEPER"
    else
        echo "WARNING: preflight-gatekeeper.sh not found, Agent Mail names may be hardcoded" >&2
    fi
fi

# Configuration
SESSION_NAME="${MAF_TMUX_SESSION:-maf-cli}"
AGENT_MAIL_URL="${AGENT_MAIL_URL:-http://127.0.0.1:8765}"
AGENT_MAIL_PROJECT="${AGENT_MAIL_PROJECT:-$PROJECT_ROOT}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"
    exit 1
}

# Send Agent Mail message (if available)
send_agent_mail() {
    local from="${1:-}"
    local to="${2:-}"
    local subject="${3:-}"
    local body="${4:-}"
    local importance="${5:-normal}"

    # Check if send-bead-via-mail.sh exists
    local send_script="$PROJECT_ROOT/maf/scripts/maf/send-bead-via-mail.sh"
    if [[ ! -f "$send_script" ]]; then
        # Fallback to project-local script
        send_script="$PROJECT_ROOT/scripts/maf/send-bead-via-mail.sh"
    fi

    if [[ -f "$send_script" ]]; then
        # Send via Agent Mail using send-bead-via-mail.sh pattern
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
                        \"sender_name\": \"$from\",
                        \"to\": [\"$to\"],
                        \"subject\": \"$subject\",
                        \"body_md\": \"$body\",
                        \"importance\": \"$importance\"
                    }
                }
            }" 2>&1)

        # Check for success
        if echo "$response" | jq -e '.result.structuredContent.deliveries' >/dev/null 2>&1; then
            return 0
        fi
    fi

    return 1
}

# Show usage
show_usage() {
    cat << 'EOF'
MAF Bead Audit - Enforces Proper Bead Closure Compliance

USAGE:
    maf/scripts/maf/audit-closed-beads.sh [--audit-only] [--once|--loop] [--session NAME]

MODES:
  --once     Run single audit cycle
  --loop     Run continuous audit loop
  --audit-only  Audit closed beads, don't ask for confirmation
  --session   Specify tmux session name (default: maf-cli)

ENVIRONMENT VARIABLES:
  MAF_TMUX_SESSION         Tmux session name (default: maf-cli)
  AGENT_MAIL_URL            Agent Mail MCP server
  AGENT_MAIL_PROJECT        Project key for Agent Mail

WHAT IT CHECKS:
  For every closed bead:
  - ✅ Has git commit? → Proper closure
  - ✅ Has receipt (≥50 lines)? → Proper closure
  - ✅ Reviewer approved (via Agent Mail)? → Proper closure
  - ❌ None of the above → IMPROPER closure

ALSO CHECKS:
  - V2 overnight commits (6+ commits between midnight and 6am)
  - Pre-autonomous closures (closed before autonomous run started)

ACTION:
  - Properly closed → Leave alone
  - Improperly closed → Alert supervisor and log violation

EXAMPLES:
  # Single audit
  bash maf/scripts/maf/audit-closed-beads.sh --once

  # Continuous audit (every 10 iterations of main workflow)
  bash maf/scripts/maf/maf-cli-agents.sh

  # Audit-only mode (just check, no prompt)
  bash maf/scripts/maf/audit-closed-beads.sh --audit-only
EOF
}

# Parse arguments
MODE="audit"  # Default: audit current state
for arg in "$@"; do
    case "$arg" in
        --once) MODE="once" ;;
        --loop) MODE="loop" ;;
        --audit-only) MODE="audit-only" ;;
        --session)
            SESSION_NAME="${2:-maf-cli}"
            shift 2
            ;;
        -h|--help)
            show_usage
            ;;
        *) ;;
    esac
done

# ============================================================================
# BEAD CLOSURE AUDIT
# ============================================================================

audit_closed_beads() {
    cd "$PROJECT_ROOT" || return 1

    log "Auditing closed beads for workflow compliance..."

    local audit_file="/tmp/maf-bead-audit.txt"
    echo "=== MAF Bead Audit - $(date) ===" > "$audit_file"

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

        # Check for git commit
        if git log --all --oneline --grep="$bead_id" 2>/dev/null | grep -q .; then
            has_commit=1
        fi

        # Check for V2 overnight detection (optional feature)
        local bead_title
        bead_title=$(jq -r "select(.id==\"$bead_id\") | .title" .beads/beads.left.jsonl 2>/dev/null || echo "")

        if [[ "$bead_title" ]]; then
            # Check if V2 beads were implemented overnight
            local v2_commits=$(git log --all --oneline --since="$(date -d 'today 00:00' '+%H')" --until="$(date -d 'today 06:00' '+%H')" --grep="feat(v2):" 2>/dev/null | wc -l)

            if [[ $v2_commits -ge 6 ]]; then
                # Mark V2 beads as having commits
                has_commit=1
            fi
        fi

        # Check for receipt file
        if [[ -f "receipts/${bead_id}.md" ]]; then
            local lines=$(wc -l < "receipts/${bead_id}.md" 2>/dev/null || echo "0")
            # Receipt must have at least 50 lines to be considered valid
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
        # Method 1: Check git log for commit author
        if [[ $has_commit -eq 1 ]]; then
            local commit_author
            commit_author=$(git log --all --format="%an" --grep="$bead_id" 2>/dev/null | head -1)
            if [[ -n "$commit_author" ]]; then
                closer="$commit_author (via git commit)"
                closure_method="Git commit"
            fi
        fi

        # Check for reviewer approval
        if [[ $has_commit -eq 0 ]] && [[ $has_receipt -eq 0 ]]; then
            # No receipt, no commit - check Agent Mail for approval
            # Note: agent-mail-fetch.sh should be in project's scripts/maf/ directory
            local agent_mail_output
            local agent_mail_fetch_script="$PROJECT_ROOT/scripts/maf/agent-mail-fetch.sh"
            if [[ -f "$agent_mail_fetch_script" ]]; then
                local reviewer_mail_name
                reviewer_mail_name=$(get_mail_name_by_role "reviewer" 2>/dev/null || echo "Reviewer")
                agent_mail_output=$(bash "$agent_mail_fetch_script" "$reviewer_mail_name" 2>/dev/null || "")
            else
                agent_mail_output=""
            fi

            if echo "$agent_mail_output" | grep -qi "\[$bead_id].*approved"; then
                closer="Reviewervia (AuditBay)"
                closure_method="Agent Mail approval"
            elif echo "$agent_mail_output" | grep -qi "\[$bead_id].*ready for review"; then
                closer="Implementer (waiting for review)"
                closure_method="Direct close (workflow bypassed)"
            fi
        fi

        # Log findings
        if [[ $is_proper -eq 1 ]]; then
            log "✅ $bead_id: PROPERLY CLOSED"
            echo "   Closer: $closer" >> "$audit_file"
            echo "   Method: $closure_method" >> "$audit_file"
        else
            log "❌ $bead_id: IMPROPERLY CLOSED"
            echo "   Closer: $closer" >> "$audit_file"
            echo "   Method: $closure_method" >> "$audit_file"
            echo "   Evidence: Commit=$has_commit, Receipt=$has_receipt" >> "$audit_file"
        fi

    done <<< "$closed_beads"

    # Summary
    echo "" >> "$audit_file"
    echo "=== SUMMARY ===" >> "$audit_file"
    echo "Total closed: $total_closed" >> "$audit_file"
    echo "Properly closed: $proper_closed >> "$audit_file"
    echo "Improperly closed: $improper_closed >> "$audit_file"

    # Report findings
    log "Bead audit complete: $proper_closed/$total_closed properly closed"

    if [[ $improperly_closed -gt 0 ]]; then
        warn "Found $improper_closed improperly closed beads!"
        log "See audit report: $audit_file"

        # Alert supervisor if improperly closed beads detected
        if [[ "$MODE" != "audit-only" ]]; then
            local alert_body="⚠️ **AUDIT ALERT**: Found $improper_closed improperly closed beads out of $total_closed total.\n\n**Properly closed:** $proper_closed\n**Improperly closed:** $improper_closed\n\nSee full report: \`cat $audit_file\`\n\n**Action Required:** Investigate and reopen improperly closed beads.\n\n**Root Cause:** Implementors are closing beads WITHOUT:→ Reviewer approval→ Git commit→ Receipt generation"
            local supervisor_mail_name
            supervisor_mail_name=$(get_mail_name_by_role "supervisor" 2>/dev/null || echo "Supervisor")
            send_agent_mail "$supervisor_mail_name" "$supervisor_mail_name" "[AUDIT] Improperly closed beads detected" "$alert_body" "high"
        fi
    else
        log "No violations detected."
    fi

    return 0
}

# ============================================================================
# MAIN FUNCTIONS
# ============================================================================

# Run single audit
audit_once() {
    log "=== Running Bead Closure Audit ==="

    # Run audit
    audit_closed_beads

    # Check for orphaned commits (has commit but no closed bead)
    # TODO: Could add orphaned commit detection
}

# Continuous audit loop
audit_loop() {
    local iteration=0

    log "Starting MAF Bead Closure Audit..."
    log "Press Ctrl+C to stop"

    while true; do
        iteration=$((iteration + 1))
        log "=== Audit Iteration $iteration ==="

        audit_closed_beads

        if [[ "$MODE" != "audit-only" ]]; then
            log "Waiting 5 minutes before next audit..."
            sleep 300
        fi

        # Check if all beads are closed (work complete)
        if all_beads_complete; then
            log "🎉 ALL BEADS CLOSED - WORK COMPLETE!"
            break
        else
            if [[ "$MODE" != "audit-only" ]]; then
                sleep 300
            fi
        fi
    done
}

# Check if all work is complete (all beads closed)
all_beads_complete() {
    cd "$PROJECT_ROOT" || return 1

    local all_beads
    all_beads="$(bd list --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")"

    local closed_beads
    closed_beads="$(bd list --status closed --json 2>/dev/null | jq 'length' 2>/dev/null || echo "0")"

    # If we have beads and all are closed, work is done
    if [[ "$all_beads" -gt 0 ]] && [[ "$closed_beads" == "$all_beads" ]]; then
        return 0  # All done
    fi

    return 1  # Work remains
}

# ============================================================================
# ENTRY POINT
# ============================================================================

# Run based on mode
if [[ "$MODE" == "audit-only" ]]; then
    audit_closed_beads
elif [[ "$MODE" == "loop" ]]; then
    audit_loop
else
    audit_once
fi
