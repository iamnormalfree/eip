# MAF Subtree Management Runbook

This guide covers pulling, updating, and managing the MAF subtree in consumer projects.

---

## Quick Start (Recommended)

**Use the helper script:**

```bash
# From your project root
bash maf/scripts/maf/update-maf-subtree.sh
```

The script handles:
- Detecting your project structure
- Checking for uncommitted changes
- Pulling from the correct location
- Fixing common issues automatically

---

## Manual Subtree Pull

### Initial Setup (First Time)

```bash
cd /path/to/your-project

# Option 1: Add as subtree (if not already installed)
mkdir -p maf
cd maf
git subtree add --prefix=. https://github.com/iamnormalfree/maf main --squash
cd ..

# Option 2: Pull into existing maf/ directory
cd maf
git subtree pull --prefix=. https://github.com/iamnormalfree/maf main --squash
cd ..
```

**IMPORTANT:** Always run subtree commands from **inside the `maf/` directory** to avoid creating a nested `maf/maf/` structure.

### Updating Existing Installation

```bash
cd /path/to/your-project/maf
git subtree pull --prefix=. https://github.com/iamnormalfree/maf main --squash
cd ..
```

---

## Common Pitfalls

### ❌ WRONG: Creates maf/maf/ nested structure

```bash
# DON'T DO THIS - creates maf/maf/
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash
```

Result:
```
your-project/
  maf/           ← subtree prefix
    maf/         ← repo's own maf/ directory (WRONG!)
      scripts/
      templates/
```

### ✅ CORRECT: Creates flat maf/ structure

```bash
# DO THIS - creates flat maf/
cd maf
git subtree pull --prefix=. https://github.com/iamnormalfree/maf main --squash
cd ..
```

Result:
```
your-project/
  maf/
    scripts/
    templates/
    README.md
```

---

## Troubleshooting

### Problem: "maf/maf/" Nested Structure

**Symptoms:**
- Scripts can't find files
- Paths resolve to `maf/maf/scripts/...` instead of `maf/scripts/...`
- Error: "script not found"

**Fix:**

```bash
# 1. Remove incorrect structure
git rm -r maf/maf
rm -rf maf/maf
git commit -m "Remove incorrect subtree structure"

# 2. Pull correctly
cd maf
git subtree add --prefix=. https://github.com/iamnormalfree/maf main --squash
cd ..
```

### Problem: "Working tree has modifications"

**Symptoms:**
- Subtree pull fails with uncommitted changes error

**Fix:**

```bash
# Option 1: Stash changes
git stash
cd maf && git subtree pull --prefix=. https://github.com/iamnormalfree/maf main --squash && cd ..
git stash pop

# Option 2: Commit changes
git commit -am "Save work before subtree pull"
cd maf && git subtree pull --prefix=. https://github.com/iamnormalfree/maf main --squash && cd ..
```

### Problem: Conflict During Pull

**Symptoms:**
- Subtree pull shows merge conflicts

**Fix:**

```bash
# 1. Resolve conflicts manually
vim maf/conflicted-file.sh

# 2. Mark as resolved
git add maf/conflicted-file.sh

# 3. Complete the merge
git commit -m "Resolve subtree merge conflicts"
```

---

## Verifying Your Installation

After pulling, verify the structure is correct:

```bash
# Check for correct structure
test -f maf/README.md && echo "✅ Correct: maf/README.md exists"
test -f maf/maf/README.md && echo "❌ Wrong: maf/maf/README.md (nested structure)"

# Check key scripts exist
test -x maf/scripts/maf/start-3agent-bdd.sh && echo "✅ 3-agent BDD script exists"
test -x maf/scripts/maf/bdd-status.sh && echo "✅ Status script exists"

# Test workflow
bash maf/scripts/maf/bdd-status.sh
```

---

## After Updating: What to Check

### 1. New Features

Check docs/ for new documentation:

```bash
ls -la docs/3-agent-bdd-*.md  # 3-agent BDD docs
ls -la docs/plans/            # Implementation plans
```

### 2. Configuration Changes

Check if topology template changed:

```bash
diff .maf/config/agent-topology.json maf/templates/agent-topology-3agent-bdd.json
```

### 3. Test the Workflow

```bash
# Run status check
bash maf/scripts/maf/bdd-status.sh

# Run integration tests
bash tests/workflow/test-3agent-bdd-integration.sh
```

---

## Migration: 4-Agent to 3-Agent BDD

If you're updating from an old 4-agent setup to the new 3-agent BDD workflow:

### 1. Backup Current Config

```bash
mkdir -p .maf/backup/$(date +%Y%m%d)
cp .maf/config/agent-topology.json .maf/backup/$(date +%Y%m%d)/
cp -r .maf/agents .maf/backup/$(date +%Y%m%d)/ 2>/dev/null || true
```

### 2. Kill Old Session

```bash
tmux kill-session -t maf-nn 2>/dev/null || true
```

### 3. Setup 3-Agent BDD

```bash
cp maf/templates/agent-topology-3agent-bdd.json .maf/config/agent-topology.json
bash maf/scripts/maf/start-3agent-bdd.sh --setup
bash maf/scripts/maf/start-3agent-bdd.sh
```

### 4. Monitor

```bash
tmux attach -t maf-bdd
```

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| **Update subtree** | `bash maf/scripts/maf/update-maf-subtree.sh` |
| **Check structure** | `ls maf/README.md && ls maf/scripts/maf/` |
| **Check status** | `bash maf/scripts/maf/bdd-status.sh` |
| **Run tests** | `bash tests/workflow/test-3agent-bdd-integration.sh` |
| **Setup 3-agent BDD** | `bash maf/scripts/maf/start-3agent-bdd.sh --setup` |
| **Start workflow** | `bash maf/scripts/maf/start-3agent-bdd.sh` |

---

## Getting Help

If you encounter issues not covered here:

1. **Check structure**: `ls -la maf/` (should see scripts/, templates/, etc.)
2. **Run helper script**: `bash maf/scripts/maf/update-maf-subtree.sh`
3. **Check docs**: `docs/3-agent-bdd-user-guide.md`
4. **Report issues**: https://github.com/iamnormalfree/maf/issues
