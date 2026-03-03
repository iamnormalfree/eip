#!/bin/bash
# ABOUTME: Merge MAF's .claude/ directory with franchisee's .claude/ directory
# ABOUTME: Preserves franchisee customizations while updating MAF-managed files
# USAGE: merge-claude.sh [--dry-run] [--maf-dir=/path/to/maf]

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[MERGE]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check dependencies
if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed. Please install jq."
    exit 1
fi

if ! command -v git &> /dev/null; then
    log_error "git is required but not installed. Please install git."
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Parse arguments
DRY_RUN=false
MAF_DIR=""
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --maf-dir=*)
            MAF_DIR="${arg#*=}"
            shift
            ;;
        *)
            # Unknown argument
            ;;
    esac
done

# Default MAF directory is parent of scripts/maf/
if [[ -z "$MAF_DIR" ]]; then
    MAF_DIR="$PROJECT_ROOT/maf"
fi

# Validate and resolve MAF directory path
if [[ ! -d "$MAF_DIR" ]]; then
    log_error "MAF directory does not exist: $MAF_DIR"
    exit 1
fi

if [[ ! -r "$MAF_DIR" ]]; then
    log_error "MAF directory is not readable: $MAF_DIR"
    exit 1
fi

# Resolve to absolute path
MAF_DIR="$(cd "$MAF_DIR" && pwd)"

# Validate MAF directory doesn't contain path traversal attempts
if [[ "$MAF_DIR" == *"../"* ]] || [[ "$MAF_DIR" == *"./"* ]]; then
    log_error "MAF directory path contains invalid components: $MAF_DIR"
    exit 1
fi

CLAUDE_DIR="$PROJECT_ROOT/.claude"
MANIFEST_FILE="$CLAUDE_DIR/.maf-manifest.json"
MAF_CLAUDE_DIR="$MAF_DIR/.claude"
BACKUP_DIR="$PROJECT_ROOT/.claude.backup.$(date +%Y%m%d_%H%M%S)"

# Setup cleanup trap for temporary files
cleanup() {
    if [[ -n "${tmp_files:-}" ]]; then
        rm -f ${tmp_files} 2>/dev/null || true
    fi
}

trap cleanup SIGINT SIGTERM EXIT

# Helper function to copy directory safely
copy_directory_safely() {
    local source_dir="$1"
    local target_path="$2"

    # Remove existing directory
    if [[ -e "$target_path" ]]; then
        rm -rf "$target_path"
    fi

    # Create parent directory
    mkdir -p "$(dirname "$target_path")"

    # Copy using rsync if available, otherwise cp
    if command -v rsync &> /dev/null; then
        rsync -aq "$source_dir/" "$target_path/"
    else
        cp -r "$source_dir" "$target_path"
    fi
}

# Helper function to copy file safely
copy_file_safely() {
    local source_file="$1"
    local target_file="$2"

    # Create parent directory
    mkdir -p "$(dirname "$target_file")"

    # Copy file
    cp "$source_file" "$target_file"
}

# Pre-flight checks
if [[ ! -f "$MANIFEST_FILE" ]]; then
    log_error "Manifest file not found: $MANIFEST_FILE"
    log_info "Run generate-manifest.sh first"
    exit 1
fi

if [[ ! -d "$MAF_CLAUDE_DIR" ]]; then
    log_error "MAF .claude directory not found: $MAF_CLAUDE_DIR"
    exit 1
fi

# Validate manifest JSON
if ! jq empty "$MANIFEST_FILE" 2>/dev/null; then
    log_error "Manifest file is not valid JSON: $MANIFEST_FILE"
    exit 1
fi

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        MAF .Claude Directory Merge                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

if [[ "$DRY_RUN" == "true" ]]; then
    log_warning "DRY RUN MODE - No changes will be made"
    echo
fi

# Step 1: Backup existing .claude/
log_info "Backing up existing .claude/ to $BACKUP_DIR..."
if [[ "$DRY_RUN" == "false" ]]; then
    if [[ -d "$CLAUDE_DIR" ]]; then
        # Check if backup directory already exists (race condition safety)
        if [[ -e "$BACKUP_DIR" ]]; then
            log_error "Backup directory already exists: $BACKUP_DIR"
            log_error "This indicates a potential race condition or conflicting process"
            exit 1
        fi
        if ! cp -r "$CLAUDE_DIR" "$BACKUP_DIR"; then
            log_error "Failed to create backup to: $BACKUP_DIR"
            exit 1
        fi
        log_success "Backup created"
    else
        if ! mkdir -p "$CLAUDE_DIR"; then
            log_error "Failed to create .claude directory: $CLAUDE_DIR"
            exit 1
        fi
        log_info "No existing .claude/ directory, created new one"
    fi
else
    log_info "[DRY RUN] Would backup to: $BACKUP_DIR"
fi

# Step 2: Process MAF-managed files
log_info "Processing MAF-managed files..."
echo

processed=0
skipped=0
merged=0
conflicts=0

# Read manifest and process each file
while IFS= read -r line; do
    # Parse all fields at once to reduce jq forks
    file_path=$(echo "$line" | jq -r '.path')
    maf_owned=$(echo "$line" | jq -r '.maf_owned // "false"')
    franchisee_can_modify=$(echo "$line" | jq -r '.franchisee_can_modify // "false"')
    merge_strategy=$(echo "$line" | jq -r '.merge_strategy // "skip"')

    # Validate path exists and is a string
    if [[ -z "$file_path" ]] || [[ "$file_path" == "null" ]]; then
        log_warning "Skipping invalid manifest entry (missing or empty path)"
        continue
    fi

    # Validate path is relative
    if [[ "$file_path" == /* ]]; then
        log_error "Absolute paths not allowed in manifest: $file_path"
        exit 1
    fi

    # Skip if not MAF owned
    if [[ "$maf_owned" != "true" ]]; then
        continue
    fi

    # Resolve path components safely
    full_path="$PROJECT_ROOT/$file_path"
    maf_source_path="$MAF_DIR/$file_path"

    # Check if MAF source exists
    if [[ ! -e "$maf_source_path" ]]; then
        log_warning "MAF source not found, skipping: $file_path"
        skipped=$((skipped + 1))
        continue
    fi

    # Apply merge strategy
    case "$merge_strategy" in
        overwrite)
            # Overwrite: Replace franchisee's file with MAF's version
            if [[ "$DRY_RUN" == "false" ]]; then
                if [[ -d "$maf_source_path" ]]; then
                    if copy_directory_safely "$maf_source_path" "$full_path"; then
                        log_success "Overwritten: $file_path"
                    else
                        log_error "Failed to copy directory: $file_path"
                        exit 1
                    fi
                elif [[ -f "$maf_source_path" ]]; then
                    if copy_file_safely "$maf_source_path" "$full_path"; then
                        log_success "Overwritten: $file_path"
                    else
                        log_error "Failed to copy file: $file_path"
                        exit 1
                    fi
                fi
            else
                log_info "[DRY RUN] Would overwrite: $file_path"
            fi
            processed=$((processed + 1))
            ;;

        merge_if_no_conflict)
            # Merge if no conflict, warn if franchisee has customized
            if [[ ! -e "$full_path" ]]; then
                # File doesn't exist locally, just copy
                if [[ "$DRY_RUN" == "false" ]]; then
                    if [[ -d "$maf_source_path" ]]; then
                        if copy_directory_safely "$maf_source_path" "$full_path"; then
                            log_success "Created: $file_path"
                        else
                            log_error "Failed to create directory: $file_path"
                            exit 1
                        fi
                    elif [[ -f "$maf_source_path" ]]; then
                        if copy_file_safely "$maf_source_path" "$full_path"; then
                            log_success "Created: $file_path"
                        else
                            log_error "Failed to create file: $file_path"
                            exit 1
                        fi
                    fi
                else
                    log_info "[DRY RUN] Would create: $file_path"
                fi
                processed=$((processed + 1))
            else
                # File exists, check for franchisee customization
                if [[ -f "$full_path/.FRANCHISEE_CUSTOM" ]]; then
                    log_warning "Skipped: $file_path (franchisee customized with .FRANCHISEE_CUSTOM marker)"
                    skipped=$((skipped + 1))
                elif [[ "$franchisee_can_modify" == "true" ]]; then
                    # For customizable files, attempt 3-way merge if both are files
                    if [[ -f "$full_path" ]] && [[ -f "$maf_source_path" ]]; then
                        # Try 3-way merge using git merge-file
                        if [[ "$DRY_RUN" == "false" ]]; then
                            # Create temp files for git merge-file
                            tmp_base=$(mktemp)
                            tmp_local=$(mktemp)
                            tmp_remote=$(mktemp)
                            tmp_files="$tmp_base $tmp_local $tmp_remote"

                            # Use current version as base, local as local, MAF as remote
                            cp "$full_path" "$tmp_base"
                            cp "$full_path" "$tmp_local"
                            cp "$maf_source_path" "$tmp_remote"

                            # Attempt merge
                            if git merge-file -p "$tmp_local" "$tmp_base" "$tmp_remote" > "$full_path.merged" 2>/dev/null; then
                                mv "$full_path.merged" "$full_path"
                                log_success "Merged: $file_path"
                                merged=$((merged + 1))
                            else
                                rm -f "$full_path.merged"
                                log_warning "Conflict: $file_path (merge conflict detected)"
                                conflicts=$((conflicts + 1))
                            fi

                            # Cleanup temp files
                            rm -f "$tmp_base" "$tmp_local" "$tmp_remote"
                            tmp_files=""
                        else
                            log_info "[DRY RUN] Would attempt merge: $file_path"
                        fi
                    elif [[ -d "$full_path" ]] && [[ -d "$maf_source_path" ]]; then
                        # For directories, check if contents differ
                        if ! diff -rq "$full_path" "$maf_source_path" > /dev/null 2>&1; then
                            log_warning "Skipped: $file_path (directory contents differ, manual review needed)"
                            skipped=$((skipped + 1))
                        else
                            log_info "Unchanged: $file_path (directories identical)"
                            processed=$((processed + 1))
                        fi
                    fi
                    processed=$((processed + 1))
                else
                    # Not customizable, overwrite
                    if [[ "$DRY_RUN" == "false" ]]; then
                        if [[ -d "$maf_source_path" ]]; then
                            if copy_directory_safely "$maf_source_path" "$full_path"; then
                                log_success "Updated: $file_path"
                            else
                                log_error "Failed to update directory: $file_path"
                                exit 1
                            fi
                        elif [[ -f "$maf_source_path" ]]; then
                            if copy_file_safely "$maf_source_path" "$full_path"; then
                                log_success "Updated: $file_path"
                            else
                                log_error "Failed to update file: $file_path"
                                exit 1
                            fi
                        fi
                    else
                        log_info "[DRY RUN] Would update: $file_path"
                    fi
                    processed=$((processed + 1))
                fi
            fi
            ;;

        skip)
            # Skip: Leave franchisee's file unchanged
            log_info "Skipped: $file_path (merge strategy: skip)"
            skipped=$((skipped + 1))
            ;;

        *)
            log_warning "Unknown merge strategy for $file_path: $merge_strategy"
            skipped=$((skipped + 1))
            ;;
    esac

done < <(jq -c '.managed_files[]' "$MANIFEST_FILE")

echo

# Step 3: Ensure .MAF_MARKER exists
log_info "Ensuring .MAF_MARKER exists..."
if [[ ! -f "$CLAUDE_DIR/.MAF_MARKER" ]] && [[ -f "$MAF_CLAUDE_DIR/.MAF_MARKER" ]]; then
    if [[ "$DRY_RUN" == "false" ]]; then
        cp "$MAF_CLAUDE_DIR/.MAF_MARKER" "$CLAUDE_DIR/.MAF_MARKER"
        log_success "Copied .MAF_MARKER"
    else
        log_info "[DRY RUN] Would copy .MAF_MARKER"
    fi
fi

echo
echo "═══════════════════════════════════════════════════════════"
log_success "Merge complete!"
echo
echo "Summary:"
echo "  Processed: $processed files"
echo "  Merged:    $merged files"
echo "  Skipped:   $skipped files"
if [[ $conflicts -gt 0 ]]; then
    echo "  Conflicts: $conflicts files (manual resolution required)"
fi
echo

if [[ "$DRY_RUN" == "false" ]]; then
    echo "Backup saved to: $BACKUP_DIR"
    echo "To restore: rm -rf .claude/ && mv $BACKUP_DIR .claude/"
else
    log_warning "This was a DRY RUN - no changes were made"
    echo "Run without --dry-run to apply changes"
fi
echo "═══════════════════════════════════════════════════════════"

# Exit with error if there were conflicts
if [[ $conflicts -gt 0 ]]; then
    exit 1
fi
