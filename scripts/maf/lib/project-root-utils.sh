# Subtree vs Direct Layout Auto-Detection
# From NextNest - eliminates per-project configuration
# This utility provides consistent PROJECT_ROOT detection across all MAF projects

get_project_root() {
    local DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
        # Subtree layout: go up 3 levels
        # maf/scripts/maf -> project root
        echo "$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
    elif [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf/lib" ]]; then
        # Subtree layout from lib: go up 4 levels
        # maf/scripts/maf/lib -> project root
        echo "$(cd "$DETECTED_SCRIPT_DIR/../../../.." && pwd)"
    elif [[ "$DETECTED_SCRIPT_DIR" == *"/scripts/maf/lib" ]]; then
        # Direct layout from lib: go up 3 levels
        # scripts/maf/lib -> project root
        echo "$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
    else
        # Direct layout: go up 2 levels
        # scripts/maf -> project root
        echo "$(cd "$DETECTED_SCRIPT_DIR/.." && pwd)"
    fi
}

# Export PROJECT_ROOT for use in other scripts
export PROJECT_ROOT="$(get_project_root)"
