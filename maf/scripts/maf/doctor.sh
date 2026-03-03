#!/bin/bash
# ABOUTME: Validates that vendor skill subtrees exist and `.claude/skills/` metadata is healthy
# ABOUTME: Checks duplicates and required frontmatter fields across synced skills
set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
CLAUDE_SKILLS_DIR="$PROJECT_ROOT/.claude/skills"
VENDOR_SUPERPOWERS_DIR="$PROJECT_ROOT/vendor/superpowers/skills"
VENDOR_RESPONSE_AWARENESS_DIR="$PROJECT_ROOT/vendor/response-awareness/.claude/skills"

ERRORS=0

echo "🔍 Checking MAF skill health..."

# Check Superpowers vendor subtree exists
if [ ! -d "$VENDOR_SUPERPOWERS_DIR" ]; then
    echo "❌ vendor/superpowers/skills not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ vendor/superpowers found"
fi

# Check Response-Awareness vendor subtree exists
if [ ! -d "$VENDOR_RESPONSE_AWARENESS_DIR" ]; then
    echo "❌ vendor/response-awareness/.claude/skills not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ vendor/response-awareness found"
fi

# Check required MAF core skills are present after sync
for required_skill in autonomous-work-proposal beads-friendly-planning founder-aware-planning; do
    if [ ! -d "$CLAUDE_SKILLS_DIR/$required_skill" ]; then
        echo "❌ Required skill missing from .claude/skills: $required_skill"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check for duplicate skill names (only in YAML frontmatter)
DUPLICATES=$(find "$CLAUDE_SKILLS_DIR" -name "SKILL.md" -exec awk '/^---$/ { if (++count == 2) exit; next } count == 1 && /^name:/ { print FILENAME "|" $0 }' {} \; 2>/dev/null | cut -d'|' -f2 | cut -d: -f2 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$' | sort | uniq -d || echo "")
if [ -n "$DUPLICATES" ]; then
    echo "❌ Duplicate skill names found:"
    echo "$DUPLICATES"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No duplicate skill names"
fi

# Validate skill metadata
for skill_dir in "$CLAUDE_SKILLS_DIR"/*/; do
    if [ ! -d "$skill_dir" ]; then
        continue
    fi

    SKILL_FILE="$skill_dir/SKILL.md"
    if [ ! -f "$SKILL_FILE" ]; then
        echo "⚠️  No SKILL.md in $skill_dir"
        continue
    fi

    # Check name: field (only in YAML frontmatter)
    NAME=$(awk '/^---$/ { if (++count == 2) exit; next } count == 1 && /^name:/ { for(i=2; i<=NF; i++) printf "%s%s", (i>2?" ":""), $i; print ""; exit }' "$SKILL_FILE" || echo "")
    if [ -z "$NAME" ]; then
        echo "❌ Missing name: in $SKILL_FILE"
        ERRORS=$((ERRORS + 1))
    elif [ ${#NAME} -gt 64 ]; then
        echo "❌ name: too long (${#NAME} > 64) in $SKILL_FILE"
        ERRORS=$((ERRORS + 1))
    fi

    # Check description: field (only in YAML frontmatter)
    DESC=$(awk '/^---$/ { if (++count == 2) exit; next } count == 1 && /^description:/ { sub(/^description:[[:space:]]*/, ""); print; exit }' "$SKILL_FILE" || echo "")
    if [ -z "$DESC" ]; then
        echo "❌ Missing description: in $SKILL_FILE"
        ERRORS=$((ERRORS + 1))
    elif [ ${#DESC} -gt 1024 ]; then
        echo "❌ description: too long (${#DESC} > 1024) in $SKILL_FILE"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo "✨ All checks passed!"
    exit 0
else
    echo "❌ Found $ERRORS error(s)"
    exit 1
fi
