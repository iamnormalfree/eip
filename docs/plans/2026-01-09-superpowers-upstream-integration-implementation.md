# Superpowers Upstream Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate obra/superpowers as git subtree, remove sp- prefix, and create sync workflow.

**Architecture:** Git subtree in `vendor/superpowers/`, sync to `.claude/skills/` via `maf update`.

**Tech Stack:** Git subtree, Bash scripts, rsync

---

## Task 1: Create scripts directory structure

**Files:**
- Create: `scripts/maf/.gitkeep`

**Step 1: Create directory**

```bash
mkdir -p scripts/maf
touch scripts/maf/.gitkeep
```

**Step 2: Verify**

Run: `ls -la scripts/maf/`
Expected: `.gitkeep` file exists

**Step 3: Commit**

```bash
git add scripts/maf/.gitkeep
git commit -m "chore: create scripts/maf directory"
```

---

## Task 2: Create sync-skills.sh script

**Files:**
- Create: `scripts/maf/sync-skills.sh`

**Step 1: Write the script**

```bash
cat > scripts/maf/sync-skills.sh << 'EOF'
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
EOF
```

**Step 2: Make executable**

Run: `chmod +x scripts/maf/sync-skills.sh`
Expected: Script is now executable

**Step 3: Verify syntax**

Run: `bash -n scripts/maf/sync-skills.sh`
Expected: No syntax errors

**Step 4: Commit**

```bash
git add scripts/maf/sync-skills.sh
git commit -m "feat: add sync-skills.sh script"
```

---

## Task 3: Create doctor.sh script

**Files:**
- Create: `scripts/maf/doctor.sh`

**Step 1: Write the script**

```bash
cat > scripts/maf/doctor.sh << 'EOF'
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
DUPLICATES=$(find "$CLAUDE_SKILLS_DIR" -name "SKILL.md" -exec grep -H "^name:" {} \; 2>/dev/null | cut -d: -f2 | sort | uniq -d || echo "")
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
EOF
```

**Step 2: Make executable**

Run: `chmod +x scripts/maf/doctor.sh`
Expected: Script is now executable

**Step 3: Verify syntax**

Run: `bash -n scripts/maf/doctor.sh`
Expected: No syntax errors

**Step 4: Commit**

```bash
git add scripts/maf/doctor.sh
git commit -m "feat: add doctor.sh script"
```

---

## Task 4: Remove sp- prefixed skills

**Files:**
- Delete: `.claude/skills/sp-brainstorming/`
- Delete: `.claude/skills/sp-test-driven-development/`
- Delete: `.claude/skills/sp-executing-plans/`
- Delete: `.claude/skills/sp-writing-plans/`
- Delete: `.claude/skills/sp-using-git-worktrees/`
- Delete: `.claude/skills/sp-subagent-driven-development/`
- Delete: `.claude/skills/sp-finishing-a-development-branch/`
- Delete: `.claude/skills/sp-systematic-debugging/`
- Delete: `.claude/skills/sp-requesting-code-review/`
- Delete: `.claude/skills/sp-receiving-code-review/`
- Delete: `.claude/skills/sp-verification-before-completion/`
- Delete: `.claude/skills/sp-dispatching-parallel-agents/`
- Delete: `.claude/skills/sp-using-superpowers/`
- Delete: `.claude/skills/sp-writing-skills/`

**Step 1: Remove all sp- skill directories**

```bash
rm -rf .claude/skills/sp-*
```

**Step 2: Verify removal**

Run: `ls .claude/skills/`
Expected: No directories starting with `sp-`

**Step 3: Commit**

```bash
git add .claude/skills/
git commit -m "chore: remove sp- prefixed skills (will be replaced by subtree)"
```

---

## Task 5: Rename sp- prefixed commands

**Files:**
- Rename: `.claude/commands/sp-brainstorm.md` → `.claude/commands/brainstorm.md`
- Rename: `.claude/commands/sp-tdd.md` → `.claude/commands/tdd.md`
- Rename: `.claude/commands/sp-execute-plan.md` → `.claude/commands/execute-plan.md`
- Rename: `.claude/commands/sp-write-plan.md` → `.claude/commands/write-plan.md`
- Rename: `.claude/commands/sp-debug.md` → `.claude/commands/debug.md`
- Rename: `.claude/commands/sp-verify.md` → `.claude/commands/verify.md`

**Step 1: Rename all files**

```bash
mv .claude/commands/sp-brainstorm.md .claude/commands/brainstorm.md
mv .claude/commands/sp-tdd.md .claude/commands/tdd.md
mv .claude/commands/sp-execute-plan.md .claude/commands/execute-plan.md
mv .claude/commands/sp-write-plan.md .claude/commands/write-plan.md
mv .claude/commands/sp-debug.md .claude/commands/debug.md
mv .claude/commands/sp-verify.md .claude/commands/verify.md
```

**Step 2: Verify**

Run: `ls .claude/commands/ | grep "^sp-"`
Expected: No output (no sp- files remain)

**Step 3: Commit**

```bash
git add .claude/commands/
git commit -m "chore: rename sp- commands to remove prefix"
```

---

## Task 6: Add obra/superpowers as git subtree

**Files:**
- Create: `vendor/superpowers/` (subtree)

**Step 1: Add subtree**

```bash
git subtree add --prefix=vendor/superpowers https://github.com/obra/superpowers main --squash
```

Expected: Git clones repo and creates subtree

**Step 4: Verify**

Run: `ls vendor/superpowers/skills/ | head`
Expected: List of skill directories from upstream

**Step 5: Commit**

```bash
git add vendor/superpowers
git commit -m "feat: add obra/superpowers as git subtree"
```

---

## Task 7: Initial sync of vendor skills

**Files:**
- Modify: `.claude/skills/` (populated by sync script)

**Step 1: Run sync script**

```bash
./scripts/maf/sync-skills.sh
```

Expected: Skills copied from vendor to .claude/skills/

**Step 2: Verify**

Run: `ls .claude/skills/ | grep -E "^(brainstorming|test-driven-development|executing-plans)" | head`
Expected: At least these 3 skills exist

**Step 3: Run doctor**

```bash
./scripts/maf/doctor.sh
```

Expected: All checks pass

**Step 4: Commit**

```bash
git add .claude/skills/
git commit -m "chore: initial sync of vendor superpowers skills"
```

---

## Task 8: Create or update maf command

**Files:**
- Create: `scripts/maf` (if not exists)
- Modify: `scripts/maf` (to call sync-skills.sh)

**Step 1: Check if maf command exists**

Run: `which maf || echo "Not found"`

If exists, skip to Step 4. If not found, continue:

**Step 2: Create maf wrapper script**

```bash
cat > scripts/maf << 'EOF'
#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
case "${1:-}" in
    update)
        "$PROJECT_ROOT/scripts/maf/sync-skills.sh"
        ;;
    doctor)
        "$PROJECT_ROOT/scripts/maf/doctor.sh"
        ;;
    *)
        echo "Usage: maf {update|doctor}"
        echo "  update  - Sync skills from vendor to .claude/"
        echo "  doctor  - Check skill health"
        exit 1
        ;;
esac
EOF
```

**Step 3: Make executable**

Run: `chmod +x scripts/maf`

**Step 4: Test commands**

```bash
./scripts/maf doctor
```

Expected: Health check runs successfully

**Step 5: Commit**

```bash
git add scripts/maf
git commit -m "feat: add maf command wrapper"
```

---

## Task 9: Update documentation

**Files:**
- Modify: `.claude/skills/README.md`
- Create: `docs/superpowers-upstream-sync.md`

**Step 1: Update .claude/skills/README.md**

Add section at top:

```markdown
## Skill Sources

Skills in this directory come from two sources:

1. **MAF Custom Skills** - MAF's proprietary skills (founder-aware-planning, beads-friendly-planning, etc.)
2. **Upstream Superpowers** - Synced from vendor/superpowers/skills/

To update upstream skills:
```bash
# Pull latest from obra/superpowers
git subtree pull --prefix=vendor/superpowers https://github.com/obra/superpowers main --squash

# Sync to .claude/skills/
maf update

# Verify health
maf doctor
```
```

**Step 2: Create upstream sync documentation**

```bash
cat > docs/superpowers-upstream-sync.md << 'EOF'
# Superpowers Upstream Sync Guide

## For MAF HQ

When obra/superpowers has updates:

```bash
# 1. Pull upstream changes
git subtree pull --prefix=vendor/superpowers https://github.com/obra/superpowers main --squash

# 2. Review what changed
git log vendor/superpowers

# 3. Sync skills to .claude/
maf update

# 4. Verify health
maf doctor

# 5. Test the changes
# 6. Commit if everything works
git add .
git commit -m "chore: update superpowers from upstream"
```

## For Franchisees

When MAF pushes updates:

```bash
# 1. Pull MAF changes
git pull origin main

# 2. Sync skills (preserves .maf/ customizations)
maf update

# 3. Verify health
maf doctor
```

## Customizing Skills

### MAF-Level Customizations
Add custom skills to `.maf/skills/` - they override vendor skills after sync.

### Franchisee-Level Customizations
Add custom skills to `.maf/overrides/skills/` - they override everything.

## Priority Order
1. Vendor skills (baseline)
2. MAF custom skills (override vendor)
3. Franchisee skills (override everything)
EOF
```

**Step 3: Commit**

```bash
git add .claude/skills/README.md docs/superpowers-upstream-sync.md
git commit -m "docs: add superpowers upstream sync guide"
```

---

## Task 10: Final verification

**Files:**
- Test: All skills load correctly

**Step 1: Run doctor**

```bash
./scripts/maf doctor
```

Expected: All checks pass

**Step 2: List all skills**

```bash
ls .claude/skills/
```

Expected: Mix of MAF custom skills and upstream Superpowers

**Step 3: Verify commands work**

Check a few renamed commands exist:
```bash
ls .claude/commands/{brainstorm,tdd,execute-plan,write-plan,debug,verify}.md
```

Expected: All 6 files exist

**Step 4: Final commit**

```bash
git add .
git commit -m "chore: final verification complete"
```
