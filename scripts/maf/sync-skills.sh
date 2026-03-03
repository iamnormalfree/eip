#!/bin/bash
# ABOUTME: Syncs `.claude/skills/` from vendor skill sources and local overrides
# ABOUTME: Builds a union in a temp dir then applies it atomically to avoid deletion bugs
set -euo pipefail

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
VENDOR_SUPERPOWERS_DIR="$PROJECT_ROOT/vendor/superpowers/skills"
VENDOR_RESPONSE_AWARENESS_DIR="$PROJECT_ROOT/vendor/response-awareness/.claude/skills"
MAF_CORE_SKILLS_DIR="$PROJECT_ROOT/maf/.claude/skills"
CLAUDE_SKILLS_DIR="$PROJECT_ROOT/.claude/skills"
MAF_SKILLS_DIR="$PROJECT_ROOT/.maf/skills"
FRANCHISEE_OVERRIDE_DIR="$PROJECT_ROOT/.maf/overrides/skills"

echo "🔄 Syncing skills from vendors..."

mkdir -p "$CLAUDE_SKILLS_DIR"

STAGING_DIR="$(mktemp -d)"
STAGING_SKILLS_DIR="$STAGING_DIR/skills"
mkdir -p "$STAGING_SKILLS_DIR"

cleanup() {
    rm -rf "$STAGING_DIR" 2>/dev/null || true
}
trap cleanup EXIT

sources_found=0

# 1) Stage Superpowers vendor skills (baseline 1)
if [ -d "$VENDOR_SUPERPOWERS_DIR" ]; then
    rsync -av "$VENDOR_SUPERPOWERS_DIR/" "$STAGING_SKILLS_DIR/"
    echo "✅ Staged Superpowers vendor skills"
    sources_found=$((sources_found + 1))
else
    echo "⚠️  vendor/superpowers/skills not found, skipping..."
fi

# 2) Stage Response-Awareness vendor skills (baseline 2)
if [ -d "$VENDOR_RESPONSE_AWARENESS_DIR" ]; then
    rsync -av "$VENDOR_RESPONSE_AWARENESS_DIR/" "$STAGING_SKILLS_DIR/"
    echo "✅ Staged Response-Awareness vendor skills"
    sources_found=$((sources_found + 1))
else
    echo "⚠️  vendor/response-awareness/.claude/skills not found, skipping..."
fi

# 3) Stage MAF custom skills (override both vendors)
if [ -d "$MAF_SKILLS_DIR" ]; then
    rsync -av "$MAF_SKILLS_DIR/" "$STAGING_SKILLS_DIR/"
    echo "✅ Staged MAF custom skills"
    sources_found=$((sources_found + 1))
fi

# 4) Stage MAF core skills (override vendors, before local overrides)
if [ -d "$MAF_CORE_SKILLS_DIR" ]; then
    rsync -av "$MAF_CORE_SKILLS_DIR/" "$STAGING_SKILLS_DIR/"
    echo "✅ Staged MAF core skills"
    sources_found=$((sources_found + 1))
else
    echo "⚠️  maf/.claude/skills not found, skipping..."
fi

# 5) Stage franchisee customizations (override everything)
if [ -d "$FRANCHISEE_OVERRIDE_DIR" ]; then
    rsync -av "$FRANCHISEE_OVERRIDE_DIR/" "$STAGING_SKILLS_DIR/"
    echo "✅ Staged franchisee customizations"
    sources_found=$((sources_found + 1))
fi

if [ "$sources_found" -eq 0 ]; then
    echo "❌ No skill sources found. Refusing to wipe $CLAUDE_SKILLS_DIR"
    exit 1
fi

rsync -av --delete "$STAGING_SKILLS_DIR/" "$CLAUDE_SKILLS_DIR/"

echo "✨ Skill sync complete!"
