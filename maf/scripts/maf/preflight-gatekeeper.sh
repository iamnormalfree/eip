#!/bin/bash
# preflight-gatekeeper.sh - Franchisee preflight validation library - validates agent environment before execution
#
# USAGE:
#   source maf/scripts/maf/preflight-gatekeeper.sh
#   run_preflight_checks [topology_file]
#
# WHAT IT DOES:
#   - Validates agent topology file exists and is valid JSON
#   - Checks for required dependencies (jq, etc.)
#   - Validates Agent Mail name coverage (advisory)
#   - Provides clear error messages and fix hints
#   - Returns appropriate exit codes for different failure scenarios
#
# ENVIRONMENT VARIABLES:
#   MAF_TOPOLOGY_FILE - Path to agent topology file (default: .maf/config/agent-topology.json)
#   MAF_SKIP_PREFLIGHT - Set to 'true' to skip all preflight checks (not recommended)
#   PROJECT_ROOT - Project root directory (auto-detected if not set)
#
# CUSTOMIZATION:
#   For project-specific behavior, you can:
#   - Override default topology path via MAF_TOPOLOGY_FILE
#   - Add custom checks by extending the check_* functions
#   - Modify error messages by editing return_error/warn/skip functions
#
# EXIT CODES:
#   0 - All checks passed (or warnings only)
#   1 - Critical check failed (blocks execution)
#   2 - System error (missing dependency, invalid environment)
#   3 - Invalid arguments

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi

# Default topology file path
TOPOLOGY_FILE="${MAF_TOPOLOGY_FILE:-${PROJECT_ROOT}/.maf/config/agent-topology.json}"

# Validate TOPOLOGY_FILE is not empty
if [[ -z "$TOPOLOGY_FILE" ]]; then
    echo -e "${RED}CRITICAL: Topology file path is empty${NC}" >&2
    echo -e "${YELLOW}Fix: Unset MAF_TOPOLOGY_FILE or set to valid path${NC}" >&2
    exit 2
fi

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# UTILITY HELPER FUNCTIONS
# ============================================================================

# _ensure_jq() - Ensure jq is installed before calling it
# Parameters: none
# Output: Error message and exits if jq is not installed
# Exit code: 2 (system error - missing dependency)
# Usage: Called internally by topology helper functions
_ensure_jq() {
    if ! command -v jq &>/dev/null; then
        echo -e "${RED}CRITICAL: jq is required but not installed${NC}" >&2
        echo -e "${YELLOW}Fix: Install jq (Linux: apt-get install jq, macOS: brew install jq)${NC}" >&2
        exit 2
    fi
}

# _realpath_relative() - Portable relative path computation
# Parameters: target_path, base_path
# Output: Relative path from base to target
# Exit code: 0 (success)
# Fallback behavior: Uses realpath, then python3, then returns absolute path
# Usage: relative_path="$(_realpath_relative "$target" "$base")"
_realpath_relative() {
    local target="$1"
    local base="$2"

    # Try realpath first (most systems)
    if command -v realpath &>/dev/null; then
        realpath --relative-to="$base" "$target" 2>/dev/null && return 0
    fi

    # Fallback: Python (almost always available)
    if command -v python3 &>/dev/null; then
        python3 -c "import os.path; print(os.path.relpath('$target', '$base'))" 2>/dev/null && return 0
    fi

    # Last resort: use absolute path
    echo "$target"
}

# check_required_dependencies() - Check for required system dependencies (Task 7)
# Parameters: none
# Output: Error message and installation instructions if dependency missing
# Exit code: 2 (system error - missing dependency)
# Respects: MAF_SKIP_PREFLIGHT environment variable
check_required_dependencies() {
    if [[ "${MAF_SKIP_PREFLIGHT:-}" == "true" ]]; then
        return_skip "Dependency checks skipped via MAF_SKIP_PREFLIGHT"
        return 0
    fi

    if ! command -v jq &>/dev/null; then
        echo -e "${RED}CRITICAL: jq is required but not installed${NC}" >&2
        echo -e "${YELLOW}Fix: Install jq (Linux: apt-get install jq, macOS: brew install jq)${NC}" >&2
        exit 2
    fi
}

# ============================================================================
# ERROR HANDLING FUNCTIONS (Task 1.2)
# ============================================================================

# return_error() - Critical error that blocks execution
# Parameters: error_message, fix_hint
# Output: Colored RED error to stderr, fix hint in yellow
# Exit code: 1 (critical failure)
# Format: return_error "Topology missing" "Create .maf/config/agent-topology.json"
return_error() {
    local error_message="$1"
    local fix_hint="$2"
    echo -e "${RED}ERROR: ${error_message}${NC}" >&2
    echo -e "${YELLOW}FIX: ${fix_hint}${NC}" >&2
    exit 1
}

# return_warn() - Advisory warning that allows continuation
# Parameters: warning_message, fix_hint
# Output: Colored YELLOW warning to stdout, fix hint
# Exit code: 0 (continues execution)
# Format: return_warn "Optional tools missing" "Install bd command for better UX"
return_warn() {
    local warning_message="$1"
    local fix_hint="$2"
    echo -e "${YELLOW}WARNING: ${warning_message}${NC}"
    echo -e "${YELLOW}HINT: ${fix_hint}${NC}"
    return 0
}

# return_skip() - Informational skip message
# Parameters: skip_message
# Output: Colored BLUE info to stdout
# Exit code: 0 (continues execution)
# Format: return_skip "Preflight checks skipped via MAF_SKIP_PREFLIGHT"
return_skip() {
    local skip_message="$1"
    echo -e "${BLUE}SKIP: ${skip_message}${NC}"
    return 0
}

# ============================================================================
# VALIDATION FUNCTIONS (Tasks 1.3-1.5)
# ============================================================================

# check_topology_file() - Validates topology file exists and is valid JSON (Task 2)
# Parameters: none
# Output: Error message if validation fails
# Exit code: 1 (critical failure) for missing file or malformed JSON
# Checks:
#   - File exists (error if missing)
#   - Valid JSON format (error if malformed)
#   - Required fields: topology_name, description, panes (array)
# Respects: MAF_TOPOLOGY_FILE environment variable
check_topology_file() {
    if [[ "${MAF_SKIP_PREFLIGHT:-}" == "true" ]]; then
        return_skip "Topology file validation skipped via MAF_SKIP_PREFLIGHT"
        return 0
    fi

    # Check if topology file exists
    if [[ ! -f "$TOPOLOGY_FILE" ]]; then
        return_error "Topology file not found: $TOPOLOGY_FILE" \
            "Create the file with required fields (topology_name, description, panes) or set MAF_TOPOLOGY_FILE"
    fi

    # Validate JSON format using jq
    if ! jq empty "$TOPOLOGY_FILE" 2>/dev/null; then
        return_error "Invalid JSON in topology file: $TOPOLOGY_FILE" \
            "Fix JSON syntax errors (use jq '.' $TOPOLOGY_FILE to validate)"
    fi

    # Check for required fields
    local required_fields=("topology_name" "description" "panes")
    local missing_fields=()

    for field in "${required_fields[@]}"; do
        if ! jq -e ".${field}" "$TOPOLOGY_FILE" &>/dev/null; then
            missing_fields+=("$field")
        fi
    done

    # Report missing fields as error
    if [[ ${#missing_fields[@]} -gt 0 ]]; then
        local missing_list="${missing_fields[*]}"
        return_error "Missing required topology fields: $missing_list" \
            "Add missing fields to $TOPOLOGY_FILE (topology_name, description, panes)"
    fi

    # Validate that 'panes' is an array
    if ! jq -e '.panes | if type == "array" then . else empty end' "$TOPOLOGY_FILE" &>/dev/null; then
        return_error "Invalid 'panes' field: must be an array" \
            "Change 'panes' to an array in $TOPOLOGY_FILE"
    fi

    # Validate that topology_name and description are strings
    if ! jq -e '.topology_name | if type == "string" then . else empty end' "$TOPOLOGY_FILE" &>/dev/null; then
        return_error "Invalid 'topology_name' field: must be a string" \
            "Change 'topology_name' to a string in $TOPOLOGY_FILE"
    fi

    if ! jq -e '.description | if type == "string" then . else empty end' "$TOPOLOGY_FILE" &>/dev/null; then
        return_error "Invalid 'description' field: must be a string" \
            "Change 'description' to a string in $TOPOLOGY_FILE"
    fi

    echo -e "${GREEN}✓ Topology file validated: $TOPOLOGY_FILE${NC}"
}

# check_agent_mail_names() - ADVISORY check for Agent Mail name coverage (Task 8)
# Parameters: none
# Output: Warning message for each pane missing mail_name field
# Exit code: 0 (advisory check - never blocks execution)
# Checks:
#   - Each pane has a mail_name field (warning if missing)
#   - Continues checking all panes even if some are missing mail_name
# Note: Advisory check - uses return_warn() for backward compatibility with older topologies
check_agent_mail_names() {
    if [[ "${MAF_SKIP_PREFLIGHT:-}" == "true" ]]; then
        return_skip "Agent Mail name coverage check skipped via MAF_SKIP_PREFLIGHT"
        return 0
    fi

    # Get total number of panes
    local pane_count
    pane_count=$(jq -r '.panes | length' "$TOPOLOGY_FILE" 2>/dev/null) || pane_count=0

    if [[ $pane_count -eq 0 ]]; then
        return 0
    fi

    local missing_count=0

    # Iterate through each pane and check for mail_name field
    for ((i=0; i<pane_count; i++)); do
        local pane_name
        pane_name=$(jq -r ".panes[$i].pane_name // .panes[$i].role // \"Pane $i\"" "$TOPOLOGY_FILE" 2>/dev/null)

        # Check if mail_name field exists and is not null
        if ! jq -e ".panes[$i].mail_name" "$TOPOLOGY_FILE" &>/dev/null; then
            return_warn "Pane '$pane_name' missing mail_name field" \
                "Add mail_name field to enable Agent Mail integration for this pane"
            missing_count=$((missing_count + 1))
        fi
    done

    if [[ $missing_count -eq 0 ]]; then
        echo -e "${GREEN}✓ All panes have mail_name field${NC}"
    fi

    return 0
}

# check_maf_subtree() - ADVISORY check for MAF subtree integrity (Task 9)
# Parameters: none
# Output: Warning if maf/ directory has uncommitted changes
# Exit code: 0 (advisory check, never blocks execution)
# Checks:
#   - Verifies we're in a git repository (skips gracefully if not)
#   - Checks for uncommitted changes in maf/ directory
#   - Works in both subtree (maf/scripts/maf/) and direct (scripts/maf/) layouts
#   - Uses return_warn() because local patch workflows often require modifying maf/
# Respects: MAF_SKIP_PREFLIGHT environment variable
check_maf_subtree() {
    if [[ "${MAF_SKIP_PREFLIGHT:-}" == "true" ]]; then
        return_skip "MAF subtree integrity check skipped via MAF_SKIP_PREFLIGHT"
        return 0
    fi

    # Check if we're in a git repository
    if ! git rev-parse --git-dir &>/dev/null; then
        return_skip "Not in a git repository, skipping MAF subtree integrity check"
        return 0
    fi

    # Determine maf/ directory path (works for both subtree and direct layouts)
    local maf_dir="${PROJECT_ROOT}/maf"

    # Check if maf/ directory exists
    if [[ ! -d "$maf_dir" ]]; then
        return_skip "MAF directory not found at ${maf_dir}, skipping integrity check"
        return 0
    fi

    # Check for uncommitted changes in maf/ directory
    # git diff --quiet returns 0 if no changes, 1 if changes exist
    local maf_path_relative
    maf_path_relative="$(_realpath_relative "$maf_dir" "$(git rev-parse --show-toplevel)")"

    if ! git diff --quiet "$maf_path_relative" 2>/dev/null; then
        return_warn "Uncommitted changes detected in maf/ directory" \
            "Commit or stash changes in ${maf_path_relative} to maintain clean state"
    fi

    # Also check for staged but uncommitted changes
    if ! git diff --cached --quiet "$maf_path_relative" 2>/dev/null; then
        return_warn "Staged but uncommitted changes in maf/ directory" \
            "Commit staged changes in ${maf_path_relative} to maintain clean state"
    fi

    # Check for untracked files in maf/ directory
    local untracked_files
    untracked_files="$(git ls-files --others --exclude-standard "$maf_path_relative" 2>/dev/null)"

    if [[ -n "$untracked_files" ]]; then
        return_warn "Untracked files detected in maf/ directory" \
            "Add or ignore files in ${maf_path_relative} (use git add or .gitignore)"
    fi

    echo -e "${GREEN}✓ MAF subtree integrity validated${NC}"
}

# check_optional_tools() - ADVISORY check for nice-to-have tools (Task 18)
# Parameters: none
# Output: Warning message for each missing optional tool
# Exit code: 0 (advisory check - never blocks execution)
# Checks:
#   - bd (better directory navigation - jump back to parent directories)
#   - fzf (fuzzy finder for interactive filtering)
#   - ripgrep (rg - faster grep alternative)
#   - fd (faster find alternative)
# Note: Advisory check - uses return_warn() because these are optional enhancements
# Respects: MAF_SKIP_PREFLIGHT environment variable
check_optional_tools() {
    if [[ "${MAF_SKIP_PREFLIGHT:-}" == "true" ]]; then
        return_skip "Optional tools check skipped via MAF_SKIP_PREFLIGHT"
        return 0
    fi

    local missing_tools=()
    local found_tools=()

    # Check for bd (better directory navigation)
    if ! command -v bd &>/dev/null; then
        missing_tools+=("bd")
    else
        found_tools+=("bd")
    fi

    # Check for fzf (fuzzy finder)
    if ! command -v fzf &>/dev/null; then
        missing_tools+=("fzf")
    else
        found_tools+=("fzf")
    fi

    # Check for ripgrep (rg - faster grep)
    if ! command -v rg &>/dev/null; then
        missing_tools+=("ripgrep (rg)")
    else
        found_tools+=("ripgrep (rg)")
    fi

    # Check for fd (faster find)
    if ! command -v fd &>/dev/null; then
        missing_tools+=("fd")
    else
        found_tools+=("fd")
    fi

    # Report missing tools
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        local missing_list="${missing_tools[*]}"
        return_warn "Optional tools not found: ${missing_list}" \
            "Install for enhanced experience (e.g., bd: https://github.com/Bhupesh-V/quickfix, fzf: https://github.com/junegunn/fzf)"
    fi

    # Report found tools
    if [[ ${#found_tools[@]} -gt 0 ]]; then
        echo -e "${GREEN}✓ Optional tools available: ${found_tools[*]}${NC}"
    fi

    return 0
}

# check_hq_files_unmodified() - CRITICAL check for MAF HQ file modifications (Task 15)
# Parameters: none
# Output: Error message and exits if HQ-owned files are modified
# Exit code: 1 (critical failure) if files are modified, 0 (success) if all unmodified
# Checks:
#   - Reads .claude/.maf-manifest.json for hq_owned_files list
#   - Verifies each file has no git diff (uncommitted modifications)
#   - Checks both working directory and staged changes
#   - Skips gracefully if not in git repository
#   - Skips gracefully if manifest file doesn't exist
#   - Returns success if hq_owned_files is empty or not present
# Respects: MAF_SKIP_PREFLIGHT environment variable
check_hq_files_unmodified() {
    if [[ "${MAF_SKIP_PREFLIGHT:-}" == "true" ]]; then
        return_skip "HQ files validation skipped via MAF_SKIP_PREFLIGHT"
        return 0
    fi

    local manifest_file="${PROJECT_ROOT}/.claude/.maf-manifest.json"

    # Skip if manifest file doesn't exist
    if [[ ! -f "$manifest_file" ]]; then
        return_skip "MAF manifest not found at ${manifest_file}, skipping HQ files validation"
        return 0
    fi

    # Check if we're in a git repository
    if ! git rev-parse --git-dir &>/dev/null; then
        return_skip "Not in a git repository, skipping HQ files validation"
        return 0
    fi

    # Get hq_owned_files array from manifest
    local hq_files
    hq_files=$(jq -r '.hq_owned_files[] // empty' "$manifest_file" 2>/dev/null)

    # If hq_owned_files is empty or null, skip with message
    if [[ -z "$hq_files" ]]; then
        echo -e "${BLUE}INFO: No HQ-owned files defined in manifest${NC}"
        return 0
    fi

    local modified_files=()
    local git_root
    git_root="$(git rev-parse --show-toplevel)"

    # Check each HQ-owned file for modifications
    while IFS= read -r file_path; do
        # Skip empty paths
        [[ -z "$file_path" ]] && continue

        # Construct full path relative to project root
        local full_path="${PROJECT_ROOT}/${file_path}"

        # Skip if file doesn't exist (may not be checked out yet)
        if [[ ! -f "$full_path" ]]; then
            continue
        fi

        # Get path relative to git root
        local relative_path
        relative_path="$(_realpath_relative "$full_path" "$git_root")"

        # Check for uncommitted modifications in working directory
        if ! git diff --quiet "$relative_path" 2>/dev/null; then
            modified_files+=("$file_path")
            continue
        fi

        # Check for staged but uncommitted changes
        if ! git diff --cached --quiet "$relative_path" 2>/dev/null; then
            modified_files+=("$file_path")
            continue
        fi
    done <<< "$hq_files"

    # Report error if any HQ-owned files are modified
    if [[ ${#modified_files[@]} -gt 0 ]]; then
        local modified_list
        modified_list=$(printf '%s\n' "${modified_files[@]}" | sort | tr '\n' ', ' | sed 's/, $//')
        return_error "HQ-owned files have been modified: ${modified_list}" \
            "These files are managed by MAF HQ and should not be modified. Revert changes with: git checkout -- <file>"
    fi

    echo -e "${GREEN}✓ All HQ-owned files are unmodified${NC}"
    return 0
}

# ============================================================================
# TOPOLOGY HELPER FUNCTIONS (Phase 2)
# ============================================================================

# get_mail_name_by_pane() - Get mail_name for a pane by index (Task 3)
# Parameters: pane_index (integer, 0-based)
# Output: mail_name value for the specified pane
# Exit code: 0 (success), 1 (error - invalid pane or missing mail_name)
# Error Handling:
#   - Returns error if pane_index is out of bounds
#   - Returns error if mail_name field is missing or null
# Usage: mail_name=$(get_mail_name_by_pane 0)
get_mail_name_by_pane() {
    local pane_index="$1"

    # Ensure jq is available
    _ensure_jq

    # Validate pane_index is provided
    if [[ -z "$pane_index" ]]; then
        return_error "Pane index not provided" "Usage: get_mail_name_by_pane <pane_index>"
    fi

    # Validate pane_index is a number
    if ! [[ "$pane_index" =~ ^[0-9]+$ ]]; then
        return_error "Invalid pane index: '$pane_index' (must be a non-negative integer)" \
            "Provide a valid pane index (e.g., 0, 1, 2)"
    fi

    # Check if pane exists in topology
    local pane_count
    pane_count=$(jq -r '.panes | length' "$TOPOLOGY_FILE" 2>/dev/null) || pane_count=0

    if [[ $pane_count -eq 0 ]]; then
        return_error "No panes found in topology file" \
            "Ensure $TOPOLOGY_FILE contains a 'panes' array with at least one pane"
    fi

    if [[ $pane_index -lt 0 ]] || [[ $pane_index -ge $pane_count ]]; then
        return_error "Pane index $pane_index out of bounds (valid range: 0-$((pane_count - 1)))" \
            "Use a valid pane index between 0 and $((pane_count - 1))"
    fi

    # Extract mail_name for the specified pane
    local mail_name
    mail_name=$(jq -r ".panes[$pane_index].mail_name // \"\"" "$TOPOLOGY_FILE" 2>/dev/null)

    # Check if mail_name field exists and is not empty
    if [[ -z "$mail_name" ]]; then
        local pane_name
        pane_name=$(jq -r ".panes[$pane_index].pane_name // .panes[$pane_index].role // \"Pane $pane_index\"" "$TOPOLOGY_FILE" 2>/dev/null)
        return_error "mail_name field missing or empty for pane $pane_index ('$pane_name')" \
            "Add mail_name field to pane $pane_index in $TOPOLOGY_FILE"
    fi

    # Output the mail_name
    echo "$mail_name"
    return 0
}

# get_agent_name_by_pane() - Get agent_name for a pane by index (Task 14)
# Parameters: pane_index (integer, 0-based)
# Output: agent_name value for the specified pane
# Exit code: 0 (success), 1 (error - invalid pane or missing agent_name)
# Error Handling:
#   - Returns error if pane_index is out of bounds
#   - Returns error if agent_name field is missing or null
# Usage: agent_name=$(get_agent_name_by_pane 2)
get_agent_name_by_pane() {
    local pane_index="${1:-}"

    # Ensure jq is available
    _ensure_jq

    # Validate pane_index is provided
    if [[ -z "$pane_index" ]]; then
        return_error "Pane index not provided" "Usage: get_agent_name_by_pane <pane_index>"
    fi

    # Validate pane_index is a number
    if ! [[ "$pane_index" =~ ^[0-9]+$ ]]; then
        return_error "Invalid pane index: '$pane_index' (must be a non-negative integer)" \
            "Provide a valid pane index (e.g., 0, 1, 2)"
    fi

    # Check if pane exists in topology
    local pane_count
    pane_count=$(jq -r '.panes | length' "$TOPOLOGY_FILE" 2>/dev/null) || pane_count=0

    if [[ $pane_count -eq 0 ]]; then
        return_error "No panes found in topology file" \
            "Ensure $TOPOLOGY_FILE contains a 'panes' array with at least one pane"
    fi

    if [[ $pane_index -lt 0 ]] || [[ $pane_index -ge $pane_count ]]; then
        return_error "Pane index $pane_index out of bounds (valid range: 0-$((pane_count - 1)))" \
            "Use a valid pane index between 0 and $((pane_count - 1))"
    fi

    # Extract agent_name for the specified pane
    local agent_name
    agent_name=$(jq -r ".panes[$pane_index].agent_name // \"\"" "$TOPOLOGY_FILE" 2>/dev/null)

    # Check if agent_name field exists and is not empty
    if [[ -z "$agent_name" ]]; then
        local pane_name
        pane_name=$(jq -r ".panes[$pane_index].pane_name // .panes[$pane_index].role // \"Pane $pane_index\"" "$TOPOLOGY_FILE" 2>/dev/null)
        return_error "agent_name field missing or empty for pane $pane_index ('$pane_name')" \
            "Add agent_name field to pane $pane_index in $TOPOLOGY_FILE"
    fi

    # Output the agent_name
    echo "$agent_name"
    return 0
}

# get_pane_by_role() - Get pane index by role name (Task 12)
# Parameters: role_name (string, e.g., "supervisor", "reviewer", "implementor-1")
# Output: Pane index (integer) for the specified role
# Exit code: 0 (success), 1 (error - unknown role)
# Error Handling:
#   - Returns error if role_name is not provided
#   - Returns error if role_name is not found in topology
# Usage: pane_index=$(get_pane_by_role "supervisor")
get_pane_by_role() {
    local role_name="${1:-}"

    # Ensure jq is available
    _ensure_jq

    # Validate role_name is provided
    if [[ -z "$role_name" ]]; then
        return_error "Role name not provided" "Usage: get_pane_by_role <role_name>"
    fi

    # Query role_to_pane mapping (most efficient lookup)
    local pane_index
    pane_index=$(jq -r ".role_to_pane[\"$role_name\"] // \"\"" "$TOPOLOGY_FILE" 2>/dev/null)

    # Check if role was found in role_to_pane mapping
    if [[ -z "$pane_index" ]] || [[ "$pane_index" == "null" ]]; then
        # Fallback: iterate through panes array if role_to_pane mapping doesn't exist
        local pane_count
        pane_count=$(jq -r '.panes | length' "$TOPOLOGY_FILE" 2>/dev/null) || pane_count=0

        if [[ $pane_count -eq 0 ]]; then
            return_error "No panes found in topology file" \
                "Ensure $TOPOLOGY_FILE contains a 'panes' array with at least one pane"
        fi

        # Search through panes array for matching role
        for ((i=0; i<pane_count; i++)); do
            local pane_role
            pane_role=$(jq -r ".panes[$i].role // \"\"" "$TOPOLOGY_FILE" 2>/dev/null)

            if [[ "$pane_role" == "$role_name" ]]; then
                echo "$i"
                return 0
            fi
        done

        # Role not found in either role_to_pane mapping or panes array
        local valid_roles
        valid_roles=$(jq -r '.panes[].role' "$TOPOLOGY_FILE" 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
        return_error "Unknown role: '$role_name'" \
            "Valid roles: $valid_roles"
    fi

    # Output the pane index
    echo "$pane_index"
    return 0
}

# get_mail_name_by_role() - Get mail_name for a pane by role name (Task 11)
# Parameters: role_name (string, matches role field in pane)
# Output: mail_name value for the pane with matching role
# Exit code: 0 (success), 1 (error - role not found or missing mail_name)
# Error Handling:
#   - Returns error if no pane matches the role_name
#   - Returns error if matching pane has missing or null mail_name
# Usage: mail_name=$(get_mail_name_by_role "supervisor")
get_mail_name_by_role() {
    local role_name="${1:-}"

    # Ensure jq is available
    _ensure_jq

    # Validate role_name is provided
    if [[ -z "$role_name" ]]; then
        return_error "Role name not provided" "Usage: get_mail_name_by_role <role_name>"
    fi

    # Get total number of panes
    local pane_count
    pane_count=$(jq -r '.panes | length' "$TOPOLOGY_FILE" 2>/dev/null) || pane_count=0

    if [[ $pane_count -eq 0 ]]; then
        return_error "No panes found in topology file" \
            "Ensure $TOPOLOGY_FILE contains a 'panes' array with at least one pane"
    fi

    # Iterate through panes to find matching role
    local matching_index=-1
    for ((i=0; i<pane_count; i++)); do
        local pane_role
        pane_role=$(jq -r ".panes[$i].role // \"\"" "$TOPOLOGY_FILE" 2>/dev/null)

        if [[ "$pane_role" == "$role_name" ]]; then
            matching_index=$i
            break
        fi
    done

    # Check if role was found
    if [[ $matching_index -eq -1 ]]; then
        local valid_roles
        valid_roles=$(jq -r '.panes[].role' "$TOPOLOGY_FILE" 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
        return_error "Unknown role: '$role_name'" \
            "Valid roles: $valid_roles"
    fi

    # Extract mail_name for the matching pane
    local mail_name
    mail_name=$(jq -r ".panes[$matching_index].mail_name // \"\"" "$TOPOLOGY_FILE" 2>/dev/null)

    # Check if mail_name field exists and is not empty
    if [[ -z "$mail_name" ]]; then
        return_error "mail_name field missing or empty for role '$role_name'" \
            "Add mail_name field to pane with role '$role_name' in $TOPOLOGY_FILE"
    fi

    # Output the mail_name
    echo "$mail_name"
    return 0
}

# ============================================================================
# MAIN ENTRY POINT (Task 1.6)
# ============================================================================

# preflight_init() - Main orchestration function
# Parameters: none
# Output: Aggregated results of all preflight checks
# Exit code: 0 (all checks pass), 1 (critical failure), 2 (system error)
# Respects: MAF_SKIP_PREFLIGHT environment variable
preflight_init() {
    # Check required dependencies first (Task 7)
    check_required_dependencies

    # Validate topology file (Task 2)
    check_topology_file

    # Check Agent Mail name coverage (Task 8) - ADVISORY
    check_agent_mail_names

    # Check MAF subtree integrity (Task 9) - ADVISORY
    check_maf_subtree

    # Check HQ files unmodified (Task 15) - CRITICAL
    check_hq_files_unmodified

    # Check optional tools (Task 18) - ADVISORY
    check_optional_tools

    # Run franchisee custom preflight checks if defined (Task 22)
    # Custom checks are sourced from .maf/config/custom-preflight-checks.sh
    # This allows franchisees to add project-specific validation logic
    # Template available at: maf/templates/custom-preflight-checks.sh.template
    local custom_checks_file="${PROJECT_ROOT}/.maf/config/custom-preflight-checks.sh"
    if [[ -f "$custom_checks_file" ]]; then
        # Source the custom checks file
        source "$custom_checks_file"

        # Call custom_preflight_checks() if function is defined
        if declare -f custom_preflight_checks >/dev/null; then
            custom_preflight_checks
        fi
    fi
}
