#!/bin/bash
# ABOUTME: Automatically fix hardcoded project paths in MAF scripts
# ABOUTME: Replaces ${PROJECT_ROOT} with subtree auto-detection pattern
# COMPLETION_DRIVE: Make MAF scripts project-agnostic
# LCL: maintenance::path_cleanup
# LCL: portability::subtree_detection
#
# Dry run by default. Use --apply to make changes.

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Detect PROJECT_ROOT
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi

cd "$PROJECT_ROOT" || exit 1

# Mode: dry-run or apply
MODE="${1:---dry-run}"
if [[ "$MODE" != "--dry-run" ]] && [[ "$MODE" != "--apply" ]]; then
    log_error "Usage: $0 [--dry-run|--apply]"
    exit 1
fi

if [[ "$MODE" == "--apply" ]]; then
    log_warn "⚠️  APPLY MODE - Will modify files!"
    log_info "Press Ctrl+C to cancel, or wait 3 seconds..."
    sleep 3
else
    log_info "🔍 DRY RUN MODE - No changes will be made"
fi

echo ""

# Counters
total_files=0
fixed_files=0
skipped_files=0

# Pattern to detect hardcoded paths
HARDCODED_PATTERN='${PROJECT_ROOT}'

# Auto-detection code to insert
read -r -d '' AUTO_DETECT_CODE << 'EOF'
# Auto-detect project directory (supports subtree installations)
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi
EOF

# Find files with hardcoded paths
log_info "Scanning for hardcoded paths..."

# Search in scripts/maf and lib/maf
mapfile -t FILES < <(find scripts/maf lib/maf -type f \( -name "*.sh" -o -name "*.mjs" -o -name "*.json" \) -exec grep -l "$HARDCODED_PATTERN" {} \; 2>/dev/null || true)

log_info "Found ${#FILES[@]} files with hardcoded paths"
echo ""

for file in "${FILES[@]}"; do
    [[ ! -f "$file" ]] && continue

    total_files=$((total_files + 1))

    log_info "Processing: $file"

    # Count occurrences
    count=$(grep -c "$HARDCODED_PATTERN" "$file" 2>/dev/null || echo "0")

    if [[ "$count" -eq 0 ]]; then
        log_warn "  No occurrences found (skipped)"
        skipped_files=$((skipped_files + 1))
        continue
    fi

    log_info "  Found $count occurrence(s)"

    # Show occurrences
    grep -n "$HARDCODED_PATTERN" "$file" | head -5 | while read -r line; do
        echo "    $line"
    done

    if [[ ${#FILES[@]} -gt 5 ]]; then
        if [[ "$count" -gt 5 ]]; then
            echo "    ... ($((count - 5)) more)"
        fi
    fi

    # Apply fix
    if [[ "$MODE" == "--apply" ]]; then
        # Create backup
        cp "$file" "${file}.backup"

        # Determine file type and apply appropriate fix
        if [[ "$file" == *.sh ]]; then
            fix_shell_script "$file"
        elif [[ "$file" == *.mjs ]]; then
            fix_mjs_script "$file"
        elif [[ "$file" == *.json ]]; then
            fix_json_file "$file"
        fi

        # Check if file was modified
        if ! diff -q "$file" "${file}.backup" >/dev/null 2>&1; then
            log_success "  ✓ Fixed (backup: ${file}.backup)"
            fixed_files=$((fixed_files + 1))
        else
            log_warn "  No changes made (skipped)"
            rm -f "${file}.backup"
            skipped_files=$((skipped_files + 1))
        fi
    else
        log_info "  [DRY RUN] Would fix this file"
    fi

    echo ""
done

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Total files scanned:  $total_files"
echo "Files to fix:         ${#FILES[@]}"
if [[ "$MODE" == "--apply" ]]; then
    echo "Files fixed:          $fixed_files"
    echo "Files skipped:        $skipped_files"
else
    echo "[DRY RUN] Run with --apply to fix"
fi
echo ""

# List backup files if any
if [[ "$MODE" == "--apply" ]]; then
    backup_count=$(find . -name "*.backup" -type f 2>/dev/null | wc -l)
    if [[ $backup_count -gt 0 ]]; then
        log_info "Backup files created: $backup_count"
        log_info "To clean up backups: find . -name '*.backup' -delete"
    fi
fi

# Helper functions
fix_shell_script() {
    local file="$1"

    # Check if auto-detection already exists
    if grep -q "Auto-detect project directory" "$file" 2>/dev/null; then
        # Auto-detection exists, just replace hardcoded paths with $PROJECT_ROOT
        sed -i "s|${HARDCODED_PATTERN}|\${PROJECT_ROOT}|g" "$file"
        return
    fi

    # Add auto-detection after shebang or at beginning
    if grep -q '^#!' "$file"; then
        # Insert after shebang
        awk -v code="$AUTO_DETECT_CODE" '
            /^#!/ { print; print ""; print code; next }
            { print }
        ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    else
        # Insert at beginning
        awk -v code="$AUTO_DETECT_CODE" '
            NR==1 { print code; print "" }
            { print }
        ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    fi

    # Replace hardcoded paths with $PROJECT_ROOT
    sed -i "s|${HARDCODED_PATTERN}|\${PROJECT_ROOT}|g" "$file"
}

fix_mjs_script() {
    local file="$1"

    # For .mjs files, add PROJECT_ROOT constant at the top
    if ! grep -q "PROJECT_ROOT.*__dirname" "$file" 2>/dev/null; then
        # Add PROJECT_ROOT detection
        awk '
            BEGIN { print "import path from '\''path'\'';"; print "const PROJECT_ROOT = path.resolve(__dirname, '\''..'\'');"; print "" }
            { print }
        ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    fi

    # Replace hardcoded paths
    sed -i "s|${HARDCODED_PATTERN}|\${PROJECT_ROOT}|g" "$file"
}

fix_json_file() {
    local file="$1"

    # For JSON, just warn (manual fix needed)
    log_warn "  JSON file - manual fix may be needed"
    sed -i "s|${HARDCODED_PATTERN}|\${PROJECT_ROOT}|g" "$file"
}
