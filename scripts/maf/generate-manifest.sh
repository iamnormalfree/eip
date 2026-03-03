#!/bin/bash
# ABOUTME: Generate .maf-manifest.json with exactly 8 specified MAF-managed files

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
MANIFEST_FILE="$CLAUDE_DIR/.maf-manifest.json"

echo "Generating MAF manifest with MAF-managed .claude files..."

# Define the MAF-managed files to track (whitelist)
# Commands are merged by merge-claude; skills are synced via sync-skills.sh
declare -a MANAGED_FILES=(
    "commands/response-awareness.md"
)

# Start JSON structure
cat > "$MANIFEST_FILE" << 'EOF'
{
  "version": "1.0",
  "maf_version": "v0.3.0",
  "managed_files": [
EOF

# Process each managed file
is_first_entry=true

for file_rel in "${MANAGED_FILES[@]}"; do
    file_path="$CLAUDE_DIR/$file_rel"

    # Check if file/directory exists
    if [[ ! -e "$file_path" ]]; then
        echo "Warning: $file_rel does not exist, skipping..."
        continue
    fi

    # Calculate checksum
    if [[ -d "$file_path" ]]; then
        checksum=$(find "$file_path" -type f -exec sha256sum {} \; | sort | sha256sum | cut -d' ' -f1)
    else
        checksum=$(sha256sum "$file_path" | cut -d' ' -f1)
    fi

    franchisee_can_modify="false"
    merge_strategy="overwrite"

    if [[ "$is_first_entry" == "true" ]]; then
        is_first_entry=false
    else
        echo "," >> "$MANIFEST_FILE"
    fi

    # Add entry
    cat >> "$MANIFEST_FILE" << EOF
    {
      "path": ".claude/$file_rel",
      "checksum": "sha256:$checksum",
      "maf_owned": true,
      "franchisee_can_modify": $franchisee_can_modify,
      "merge_strategy": "$merge_strategy"
    }
EOF
done

# Close JSON
cat >> "$MANIFEST_FILE" << 'EOF'

  ],
  "franchisee_files": []
}
EOF

echo "Manifest generated: $MANIFEST_FILE"
echo "Total entries: ${#MANAGED_FILES[@]}"
