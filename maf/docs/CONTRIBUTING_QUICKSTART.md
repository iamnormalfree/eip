# Contributing to MAF - Quick Start

> Submit your changes to MAF HQ with ONE command

---

## Prerequisites

```bash
# Install GitHub CLI
sudo apt install gh  # Ubuntu/Debian
brew install gh      # macOS

# Authenticate
gh auth login
```

---

## The One-Command Workflow

```bash
# Step 1: Edit MAF files directly
vim maf/.claude/skills/my-awesome-skill

# Step 2: Submit PR
bash scripts/maf/contrib.sh "Add my awesome skill" "This skill does..."
```

That's it! ✅

---

## What the Script Does

| Step | Action | Automatic? |
|------|--------|------------|
| 1 | Detects changes in `maf/` | ✅ Yes |
| 2 | Creates/verifies your fork | ✅ Yes |
| 3 | Creates feature branch | ✅ Yes |
| 4 | Commits your changes | ✅ Yes |
| 5 | Pushes to your fork | ✅ Yes |
| 6 | Opens PR to MAF HQ | ✅ Yes |

---

## Examples

### Simple Contribution

```bash
# Edit a skill
vim maf/.claude/skills/sp-debugging

# Submit
bash scripts/maf/contrib.sh "Add debugging skill"
```

### Contribution with Description

```bash
# Edit files
vim maf/.claude/skills/my-skill
vim maf/.claude/.maf-manifest.json

# Submit with description
bash scripts/maf/contrib.sh \
  "Add custom workflow automation" \
  "This skill adds XYZ automation for ABC use cases"
```

### Fix a Bug

```bash
# Fix bug
vim maf/scripts/maf/broken-script.sh

# Submit
bash scripts/maf/contrib.sh "Fix crash in broken-script"
```

---

## Tracking Your PR

```bash
# Check status
gh pr status --repo iamnormalfree/maf

# View details
gh pr view --repo iamnormalfree/maf

# Open in browser
gh pr view --repo iamnormalfree/maf --web
```

---

## Common Scenarios

### Scenario: Script Asks to Create Fork

```bash
# Script output:
# ⚠️  Fork not found at: yourname/maf
# Create fork now? [y/N]: y

# Just type 'y' and script handles everything
```

### Scenario: Branch Already Exists

```bash
# Script output:
# ⚠️  Branch 'feature/add-skill-20260109' already exists
# Use existing branch? [y/N]: y

# Type 'y' to continue, or 'n' to abort
```

### Scenario: No Changes Detected

```bash
# Script output:
# ❌ No changes detected in maf/ directory
# Make your edits first, then run this script

# Make some changes first!
vim maf/.claude/skills/new-skill
```

---

## Requirements Checklist

Before using `contrib.sh`:

- [ ] GitHub CLI installed (`gh --version`)
- [ ] Authenticated with GitHub (`gh auth status`)
- [ ] Made changes to files in `maf/` directory
- [ ] Changes are committed to your working tree

---

## Need Help?

```bash
# Show help
bash scripts/maf/contrib.sh

# Check GitHub auth
gh auth status

# List your forks
gh repo list --fork true
```

---

## Manual Workflow (If Script Fails)

If `contrib.sh` doesn't work for you:

```bash
# 1. Create fork manually
# Visit: https://github.com/iamnormalfree/maf/fork

# 2. Add remote
git remote add fork https://github.com/YOUR-USERNAME/maf.git

# 3. Create branch
git checkout -b feature/my-changes

# 4. Commit and push
git add maf/.claude/skills/my-skill
git commit -m "feat: add my skill"
git push fork feature/my-changes

# 5. Create PR on GitHub
# Visit: https://github.com/iamnormalfree/maf/compare
```

---

## Tips

| Tip | Why |
|-----|-----|
| **Write clear PR titles** | MAF HQ can review faster |
| **Test before submitting** | Avoid embarrassing bugs |
| **Check existing PRs** | Avoid duplicate work |
| **Be patient** | MAF HQ reviews when they can |
| **Keep local backups** | Your changes may be modified before merge |

---

## FAQ

**Q: Can I edit files outside `maf/`?**
A: No, `contrib.sh` only works for the `maf/` subtree. For other changes, use regular git workflow.

**Q: What if my PR is rejected?**
A: MAF HQ will provide feedback. Make requested changes and submit again.

**Q: Can I delete my fork after PR is merged?**
A: Yes, but keeping it makes future contributions easier.

**Q: Do I need to be a GitHub user?**
A: Yes, you need a GitHub account to contribute.

**Q: Can I contribute anonymously?**
A: No, all PRs are attributed to your GitHub account.
