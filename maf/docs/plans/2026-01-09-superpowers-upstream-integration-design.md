# Superpowers Upstream Integration Design

**Date:** 2026-01-09
**Status:** Approved
**Author:** Claude + User Collaboration

---

## Goal

Integrate obra/superpowers as a clean upstream dependency while removing the `sp-` prefix, enabling seamless updates and maintaining MAF's ability to add custom skills.

---

## Architecture Overview

```
.claude/
├── skills/
│   ├── founder-aware-planning/     # MAF's proprietary skills
│   ├── beads-friendly-planning/
│   └── autonomous-work-proposal/
└── commands/
    ├── founder-plan.md
    ├── beads-plan.md
    ├── brainstorm.md              # renamed from sp-brainstorm.md
    ├── tdd.md                     # renamed from sp-tdd.md
    ├── execute-plan.md
    ├── write-plan.md
    ├── debug.md
    └── verify.md

vendor/
└── superpowers/                    # Pure upstream subtree from obra/superpowers
    └── skills/
        ├── brainstorming/          # no sp- prefix
        ├── test-driven-development/
        ├── executing-plans/
        ├── writing-plans/
        └── [...]
```

---

## Key Design Decisions

### 1. Upstream Integration Method
**Chosen:** Git subtree from `obra/superpowers`

**Rationale:**
- Clean upstream pulls with single command
- MAF controls which version/commit to use
- Automatic conflict detection
- Fits existing vendor subtree architecture

### 2. Skill Loading Strategy
**Chosen:** Copy/merge via `maf update` script

**Rationale:**
- Cross-platform safe (no symlink issues)
- Predictable for franchisees
- Allows MAF customization overrides
- Fits existing `.claude` merging workflow

### 3. Naming Convention
**Chosen:** Remove `sp-` prefix entirely

**Rationale:**
- No naming conflicts with separate vendor directory
- Cleaner, more intuitive skill names
- Consistent with upstream obra/superpowers

---

## Priority Order

Skills are loaded/synced in this priority:

1. **Vendor skills** (`vendor/superpowers/skills/`) - baseline
2. **MAF custom skills** (`.maf/skills/`) - override vendor
3. **Franchisee skills** (`.maf/overrides/skills/`) - override everything

This allows:
- Franchisees get upstream Superpowers automatically
- MAF can customize any skill by adding to `.maf/skills/`
- Franchisees can further override by adding to `.maf/overrides/skills/`

---

## Changes Required

### Skills to Remove from `.claude/skills/`
- sp-brainstorming
- sp-test-driven-development
- sp-executing-plans
- sp-writing-plans
- sp-using-git-worktrees
- sp-subagent-driven-development
- sp-finishing-a-development-branch
- sp-systematic-debugging
- sp-requesting-code-review
- sp-receiving-code-review
- sp-verification-before-completion
- sp-dispatching-parallel-agents
- sp-using-superpowers
- sp-writing-skills

### Slash Commands to Rename
| Old Name | New Name |
|----------|----------|
| sp-brainstorm.md | brainstorm.md |
| sp-tdd.md | tdd.md |
| sp-execute-plan.md | execute-plan.md |
| sp-write-plan.md | write-plan.md |
| sp-debug.md | debug.md |
| sp-verify.md | verify.md |

---

## Sync Script: `scripts/maf/sync-skills.sh`

```bash
#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENDOR_SKILLS_DIR="$PROJECT_ROOT/vendor/superpowers/skills"
CLAUDE_SKILLS_DIR="$PROJECT_ROOT/.claude/skills"
MAF_SKILLS_DIR="$PROJECT_ROOT/.maf/skills"
FRANCHISEE_OVERRIDE_DIR="$PROJECT_ROOT/.maf/overrides/skills"

echo "🔄 Syncing skills from vendor..."

# 1. Copy vendor skills to .claude/skills/ (baseline)
if [ -d "$VENDOR_SKILLS_DIR" ]; then
    rsync -av --delete "$VENDOR_SKILLS_DIR/" "$CLAUDE_SKILLS_DIR/"
    echo "✅ Synced vendor skills"
else
    echo "⚠️  vendor/superpowers/skills not found, skipping..."
fi

# 2. Restore MAF's custom skills (override vendor)
if [ -d "$MAF_SKILLS_DIR" ]; then
    rsync -av "$MAF_SKILLS_DIR/" "$CLAUDE_SKILLS_DIR/"
    echo "✅ Applied MAF custom skills"
fi

# 3. Restore franchisee customizations (override everything)
if [ -d "$FRANCHISEE_OVERRIDE_DIR" ]; then
    rsync -av "$FRANCHISEE_OVERRIDE_DIR/" "$CLAUDE_SKILLS_DIR/"
    echo "✅ Applied franchisee customizations"
fi

echo "✨ Skill sync complete!"
```

---

## Doctor Script: `scripts/maf/doctor.sh`

```bash
#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CLAUDE_SKILLS_DIR="$PROJECT_ROOT/.claude/skills"
VENDOR_SKILLS_DIR="$PROJECT_ROOT/vendor/superpowers/skills"

ERRORS=0

echo "🔍 Checking MAF skill health..."

# Check vendor subtree exists
if [ ! -d "$VENDOR_SKILLS_DIR" ]; then
    echo "❌ vendor/superpowers/skills not found"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ vendor/superpowers found"
fi

# Check for duplicate skill names
DUPLICATES=$(find "$CLAUDE_SKILLS_DIR" -name "SKILL.md" -exec grep -H "^name:" {} \; | cut -d: -f2 | sort | uniq -d)
if [ -n "$DUPLICATES" ]; then
    echo "❌ Duplicate skill names found:"
    echo "$DUPLICATES"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No duplicate skill names"
fi

# Validate skill metadata
for skill_dir in "$CLAUDE_SKILLS_DIR"/*/; do
    SKILL_FILE="$skill_dir/SKILL.md"
    if [ ! -f "$SKILL_FILE" ]; then
        echo "⚠️  No SKILL.md in $skill_dir"
        continue
    fi

    # Check name: field
    NAME=$(grep "^name:" "$SKILL_FILE" | cut -d: -f2 | xargs || echo "")
    if [ -z "$NAME" ]; then
        echo "❌ Missing name: in $SKILL_FILE"
        ERRORS=$((ERRORS + 1))
    elif [ ${#NAME} -gt 64 ]; then
        echo "❌ name: too long (${#NAME} > 64) in $SKILL_FILE"
        ERRORS=$((ERRORS + 1))
    fi

    # Check description: field
    DESC=$(grep "^description:" "$SKILL_FILE" | cut -d: -f2- | xargs || echo "")
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
```

---

## Workflows

### For MAF HQ (when obra/superpowers updates)

```bash
# 1. Pull upstream changes
git subtree pull --prefix=vendor/superpowers https://github.com/obra/superpowers main --squash

# 2. Review what changed
git log vendor/superpowers

# 3. Sync skills to .claude/
maf update

# 4. Run health check
maf doctor

# 5. Test the changes manually
# 6. Commit if everything works
git add .
git commit -m "chore: update superpowers from upstream"
```

### For Franchisees (when MAF updates)

```bash
# 1. Pull MAF changes (includes updated vendor/superpowers)
git pull origin main

# 2. Sync everything (preserves .maf/ customizations)
maf update

# 3. Verify health
maf doctor
```

---

## Implementation Phases

### Phase 1: Remove sp- prefix locally
- Remove all `sp-*` skills from `.claude/skills/`
- Rename `sp-*.md` commands to remove prefix

### Phase 2: Set up subtree
- Add `obra/superpowers` as git subtree in `vendor/superpowers/`
- Verify skills load correctly

### Phase 3: Create sync scripts
- `scripts/maf/sync-skills.sh` - sync vendor skills to .claude/
- `scripts/maf/doctor.sh` - validate skill health
- Integrate into `maf update` command

### Phase 4: Documentation
- Update `.claude/skills/README.md` with new structure
- Document upstream sync process in `docs/`

### Phase 5: Testing
- Verify all Superpowers skills still work
- Test update workflow
- Verify franchisee experience

---

## Notes

- Skills are invoked by `name:` field, not directory name
- Search order: `.claude/skills/` first, then `vendor/superpowers/skills/`
- MAF's custom skills automatically override upstream by virtue of being in `.claude/skills/`
- Franchisee customizations in `.maf/overrides/skills/` override everything
