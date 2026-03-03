#!/bin/bash
# Test template rendering

TEMPLATE="maf/templates/AGENTS.md.template"
OUTPUT="AGENTS.md.test"

# Required placeholders that MUST be filled during template rendering
# These are the only placeholders we check for - others are intentional examples
# or documentation section markers that should remain in the output.
REQUIRED_PLACEHOLDERS=(
    "__PROJECT_NAME__"
    "__SESSION_NAME__"
    "__SUPERVISOR__"
    "__REVIEWER__"
    "__IMP1__"
    "__IMP2__"
    "__MAF_LAYOUT__"
    "__MAF_SUBTREE_PREFIX__"
    "__PROJECT_ROOT__"
    "__GENERATION_DATE__"
)

# Test rendering with placeholders
sed 's/__PROJECT_NAME__/test-project/g' "$TEMPLATE" > "$OUTPUT"
sed -i 's/__SESSION_NAME__/maf-test/g' "$OUTPUT"
sed -i 's/__SUPERVISOR__/test-supervisor/g' "$OUTPUT"
sed -i 's/__REVIEWER__/test-reviewer/g' "$OUTPUT"
sed -i 's/__IMP1__/test-imp1/g' "$OUTPUT"
sed -i 's/__IMP2__/test-imp2/g' "$OUTPUT"
sed -i 's/__MAF_LAYOUT__/hq/g' "$OUTPUT"
sed -i 's/__MAF_SUBTREE_PREFIX__//g' "$OUTPUT"
sed -i 's/__PROJECT_ROOT__/\/root\/test-project/g' "$OUTPUT"
sed -i 's/__GENERATION_DATE__/2026-01-10/g' "$OUTPUT"

# Verify only required placeholders are filled (not any __ pattern)
remaining=0
for placeholder in "${REQUIRED_PLACEHOLDERS[@]}"; do
    if grep -q "$placeholder" "$OUTPUT"; then
        echo "FAIL: Required placeholder not filled: $placeholder"
        remaining=1
    fi
done

if [[ $remaining -eq 1 ]]; then
    rm "$OUTPUT"
    exit 1
else
    echo "PASS: Template rendered successfully"
    rm "$OUTPUT"
fi
