# MAF Franchisee Guide

> A non-technical guide to setting up, customizing, and maintaining your MAF installation.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Understanding MAF Architecture](#understanding-maf-architecture)
3. [Migration Scenarios](#migration-scenarios)
4. [Customizing Vendor Code](#customizing-vendor-code)
5. [Managing Your Claude Skills](#managing-your-claude-skills)
6. [Contributing Skills to MAF](#contributing-skills-to-maf)
7. [Daily Operations](#daily-operations)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### New Franchisee (Fresh Installation)

```bash
# One-command setup
bash scripts/franchisee-init.sh
```

This sets up everything: MAF core, vendor dependencies, and validates your installation.

### Existing Franchisee (Upgrading from Old MAF)

If you have MAF already installed with the old structure:

```bash
# Run the migration script
bash scripts/maf/migrate-to-vendor.sh

# Verify everything works
bash scripts/maf/health-check.sh
```

---

## Understanding MAF Architecture

Think of MAF like a **smartphone** with apps and settings:

| Component | Smartphone Analogy | What It Means For You |
|-----------|-------------------|----------------------|
| **MAF Core** (`maf/`) | Operating System (iOS/Android) | The main framework - you update this to get new features |
| **Vendors** (`vendor/`) | Third-party Apps (Instagram, Slack) | External tools MAF uses - kept separate for easy updates |
| **Patches** (`.maf/patches/`) | Your App Settings | Your customizations that survive app updates |
| **Claude Skills** (`.claude/skills/`) | Your Installed Apps | Tools and capabilities - some from MAF, some yours |
| **Manifest** (`.maf-manifest.json`) | App Inventory | List of which apps MAF manages vs. your personal apps |

### Key Principles

1. **Separation of Concerns**: External code lives separately from MAF code
2. **Safe Customization**: Your changes are preserved through updates
3. **Rollback Safety**: Every update creates a restore point
4. **Clear Ownership**: You always know what MAF manages vs. what you own

---

## Migration Scenarios

### Scenario 1: You Have `mcp_agent_mail/` in the Wrong Location

**Problem:** Your repo has `mcp_agent_mail/` at the root instead of `vendor/agent-mail/`

**Solution:** The migration script handles this automatically:

```bash
bash scripts/maf/migrate-to-vendor.sh
```

What happens:
1. Backs up your existing `mcp_agent_mail/` to `mcp_agent_mail.backup/`
2. Adds Agent Mail as a git subtree at `vendor/agent-mail/`
3. Updates all scripts to use the new path
4. You can delete the backup after verification

---

### Scenario 2: You Have Custom Claude Skills

**Problem:** You've created your own Claude skills and don't want MAF to touch them

**Solution:** MAF **automatically protects** any skill that's NOT in `.maf-manifest.json`

```bash
# Check what MAF manages
cat .claude/.maf-manifest.json | jq '.managed_files[].path'

# If your skill isn't listed, MAF will never touch it
ls .claude/skills/ | grep -v response-awareness | grep -v sp-
```

**Your custom skills are safe.** MAF only touches files explicitly listed in the manifest.

---

### Scenario 3: You Have Duplicate Skills (Yours and MAF's)

**Problem:** You created a skill that MAF now also provides

**Example:** You have `.claude/skills/my-debugging.md` and MAF adds `.claude/skills/sp-systematic-debugging.md`

**Options:**

| Option | When to Use | How |
|--------|-------------|-----|
| **Keep Yours** | Your skill works better for your needs | Rename it to something distinct, MAF won't touch it |
| **Use MAF's** | MAF's version is better | Delete yours, use MAF's |
| **Merge** | Both have good ideas | Copy best parts from MAF's skill into yours, delete MAF's |
| **Contribute** | Your skill should be in MAF | See [Contributing Skills](#contributing-skills-to-maf) below |

**Important:** MAF won't delete duplicate skills. They coexist. You choose which to use.

---

### Scenario 4: You Want to Use Your Fork of a Vendor

**Problem:** You've forked Agent Mail and want to use your version

**Solution:** Point to your fork during initialization:

```bash
AGENT_MAIL_REPO="https://github.com/YOUR-USERNAME/mcp_agent_mail" \
bash scripts/franchisee-init.sh
```

For existing installations:

```bash
# Update the subtree URL
git subtree pull --prefix=vendor/agent-mail \
    https://github.com/YOUR-USERNAME/mcp_agent_mail main --squash
```

---

## Customizing Vendor Code

### The Patch System (Your Customizations Survive Updates)

**Scenario:** You want to change how Agent Mail works.

**Step 1: Edit the vendor code directly**

```bash
# Edit Agent Mail to add your feature
vim vendor/agent-mail/mcp_agent_mail/handlers/custom.py
```

**Step 2: Create a patch from your changes**

```bash
bash scripts/maf/vendor-patch-create.sh agent-mail 0001 "Add custom handler"
```

What this does:
1. Captures your changes as a `.patch` file
2. Calculates a fingerprint (SHA256 hash) to detect tampering
3. Stores patch metadata in `.maf/patches/vendor-agent-mail/.metadata.json`
4. Offers to revert your changes (clean slate for vendor updates)

**Step 3: Patches auto-apply on updates**

```bash
# When you update vendors
bash scripts/franchisee-update.sh vendor

# Your patches are automatically re-applied!
```

### Viewing Your Patches

```bash
# List all patches
bash scripts/maf/vendor-patch-list.sh
```

### What Patches Cannot Do

| Limitation | Why | Alternative |
|------------|-----|-------------|
| Can't auto-resolve conflicts | MAF can't guess your intent | Manual resolution required |
| Can't handle massive changes | Patches are for small tweaks | Fork the vendor instead |
| Can't change vendor structure | Patches modify files, not structure | Use fork model |

---

## Managing Your Claude Skills

### File Ownership Rules

**MAF-Managed Files** (in `.maf-manifest.json`):

| File Type | Can You Modify? | What Happens on Update |
|-----------|-----------------|------------------------|
| `response-awareness-*` | No, but you can copy it | MAF overwrites with new version |
| `sp-*` (superpowers) | Yes | MAF merges if no conflicts |
| Commands | No | MAF overwrites |

**Your Files** (NOT in manifest):

- MAF **never** touches these
- Survive all updates
- Completely yours to control

### Adding Your Own Skills

Just create the file:

```bash
# MAF won't touch this
echo "my custom skill" > .claude/skills/my-custom-skill
```

No registration needed. If it's not in the manifest, it's yours.

### Customizing MAF Skills Safely

**Scenario:** You want to change how `response-awareness-light` works

**Wrong Way:**
```bash
# Don't edit this directly - MAF will overwrite it!
vim .claude/skills/response-awareness-light
```

**Right Way:**
```bash
# 1. Copy it to a new name
cp .claude/skills/response-awareness-light .claude/skills/response-awareness-my-version

# 2. Edit your copy
vim .claude/skills/response-awareness-my-version

# 3. Your version is safe forever
```

---

## Contributing Skills to MAF

> The Easy Way: Use the `contrib.sh` script to contribute with one command!

### When to Contribute

Your skill is a good candidate for MAF if it:

- [ ] Solves a common problem other franchisees have
- [ ] Doesn't contain your proprietary logic
- [ ] Follows MAF's coding style and conventions
- [ ] Is well-documented and tested
- [ ] You're willing to maintain it

### Quick Contribution (Recommended)

**Step 1: Edit MAF files directly**

```bash
# Edit files in the maf/ subtree
vim maf/.claude/skills/my-awesome-skill
```

**Step 2: Run the contribution script**

```bash
# One command to submit PR
bash scripts/maf/contrib.sh "Add my awesome skill" "This skill does X, Y, Z..."
```

That's it! The script handles:
- ✅ Checking for changes in `maf/`
- ✅ Creating/using your GitHub fork
- ✅ Creating a feature branch
- ✅ Committing your changes
- ✅ Pushing to your fork
- ✅ Opening a PR to MAF HQ

### Requirements

```bash
# Install GitHub CLI (if needed)
sudo apt install gh  # Ubuntu/Debian
brew install gh      # macOS

# Authenticate
gh auth login
```

### Example Workflow

```bash
# 1. Edit MAF file
vim maf/.claude/skills/sp-my-customization

# 2. Submit PR
bash scripts/maf/contrib.sh \
  "Add custom debugging skill" \
  "This skill adds advanced debugging for XYZ scenarios"

# 3. Script shows progress and opens PR in browser when done
```

### Manual Contribution (Advanced)

If you prefer manual control or need to customize the PR:

**Step 1: Check category**

| Category | Example | Merge Strategy |
|----------|---------|----------------|
| **MAF-Owned, Overwrite** | Core response awareness | MAF controls, updates overwrite |
| **MAF-Owned, Merge-Safe** | Superpowers (sp-*) | MAF manages, franchisees can customize |
| **Franchisee-Owned** | Your business logic | MAF never touches |

**Step 2: Manual fork and PR**

```bash
# 1. Fork on GitHub: https://github.com/iamnormalfree/maf/fork
# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/maf.git
cd maf

# 3. Create branch
git checkout -b feature/my-skill

# 4. Add your skill
vim .claude/skills/my-skill

# 5. Update manifest
vim .claude/.maf-manifest.json

# 6. Commit and push
git add .claude/skills/my-skill .claude/.maf-manifest.json
git commit -m "feat: add my skill"
git push origin feature/my-skill

# 7. Create PR on GitHub
```

### What Happens After Submission?

**Step 1: MAF HQ reviews**

- They check quality, style, and fit with MAF
- May request changes or approve directly

**Step 2: If approved**

Your skill becomes part of MAF! All franchisees get it on next update:

```bash
# Franchisees update MAF
bash scripts/franchisee-update.sh maf

# They now have your skill!
```

**Step 3: Your local copy**

```bash
# Your local edit in maf/ will be replaced with MAF's version
# If you customized it, keep a backup at .claude/skills/my-skill-local
```

### Tracking Your PR

```bash
# Check PR status
gh pr status --repo iamnormalfree/maf

# View your PR
gh pr view --repo iamnormalfree/maf

# Open in browser
gh pr view --repo iamnormalfree/maf --web
```

---

## Daily Operations

### Updating MAF

```bash
# Update everything (recommended)
bash scripts/franchisee-update.sh all
```

What happens:
1. Creates restore point (backup)
2. Pulls latest MAF code
3. Pulls latest vendor code
4. Re-applies your patches
5. Merges .claude/ directories
6. Runs health checks
7. Rolls back if anything fails

### Checking System Health

```bash
bash scripts/maf/health-check.sh
```

Pass/Fail indicators:
- ✅ PASS - Everything is good
- ⚠️ WARN - Not critical, but review
- ❌ FAIL - Needs attention

### Rolling Back From Problems

```bash
# List restore points
bash scripts/franchisee-rollback.sh --list

# Roll back to a specific point
bash scripts/franchisee-rollback.sh .maf.restore.20260109_163052
```

### Viewing Your Customizations

```bash
# See all your patches
bash scripts/maf/vendor-patch-list.sh

# See what MAF manages in .claude/
cat .claude/.maf-manifest.json | jq '.managed_files[] | {path, merge_strategy}'

# See your custom .claude/ files
ls .claude/skills/ | while read skill; do
    if ! grep -q "$skill" .claude/.maf-manifest.json; then
        echo "YOURS: $skill"
    fi
done
```

---

## Troubleshooting

### Problem: Update Failed

**Symptom:** `bash scripts/franchisee-update.sh all` failed

**Solution:**

```bash
# 1. Check what restore point was created
ls -dt .maf.restore.* | head -1

# 2. Roll back to before the update
bash scripts/franchisee-rollback.sh $(ls -dt .maf.restore.* | head -1)

# 3. Try update again
bash scripts/franchisee-update.sh all
```

---

### Problem: Patch Won't Apply

**Symptom:** "Patch does not apply" after vendor update

**Cause:** Vendor changed the code you patched

**Solution:**

```bash
# 1. See what failed
cd vendor/agent-mail
patch -p1 < ../../.maf/patches/vendor-agent-mail/0001-my-patch.patch

# 2. This shows the conflict - fix it manually
vim <file-that-conflicted>

# 3. Regenerate the patch
git diff > ../../.maf/patches/vendor-agent-mail/0001-my-patch.patch

# 4. Update metadata
bash scripts/maf/vendor-patch-create.sh agent-mail 0001 "My patch"
```

---

### Problem: My Custom Skill Disappeared

**Symptom:** A skill you created is gone after MAF update

**Cause:** Shouldn't happen - but if it does:

**Solution:**

```bash
# 1. Check backup
ls -la .claude.backup.*

# 2. Restore from backup
cp -r .claude.backup.TIMESTAMP/skills/my-skill .claude/skills/

# 3. Verify it won't happen again
grep "my-skill" .claude/.maf-manifest.json
# If NOT found, MAF won't touch it (safe)
# If found, remove it from manifest to protect it
```

---

### Problem: Duplicate Skills Confusing

**Symptom:** Don't know which skill to use when you have duplicates

**Solution:**

```bash
# See all skills and ownership
for skill in .claude/skills/*; do
    name=$(basename "$skill")
    if grep -q "$name" .claude/.maf-manifest.json; then
        echo "MAF: $name"
    else
        echo "YOURS: $name"
    fi
done
```

**Recommendation:** Rename your duplicates to avoid confusion:

```bash
# Rename your version to be distinct
mv .claude/skills/debugging .claude/skills/my-debugging
```

---

## Best Practices

### Do's

✅ **DO** create patches for vendor customizations
✅ **DO** keep your custom files out of `.maf-manifest.json`
✅ **DO** run health checks after updates
✅ **DO** test patches in a safe environment first
✅ **DO** contribute useful skills back to MAF
✅ **DO** keep backup of critical customizations

### Don'ts

❌ **DON'T** edit vendor code without creating a patch
❌ **DON'T** add your files to `.maf-manifest.json`
❌ **DON'T** ignore health check warnings
❌ **DON'T** delete restore points immediately after update
❌ **DON'T** edit MAF skills directly - copy them instead

---

## FAQ

### Q: Will I lose my customizations when updating?

**A:** No. Patches are automatically re-applied. Your custom `.claude/` files are never touched.

### Q: What if a patch conflicts with a vendor update?

**A:** You'll need to manually resolve the conflict. The system will warn you and roll back if needed.

### Q: Can I skip updates?

**A:** Yes, but not recommended. Old patches may not work with new vendor code.

### Q: How do I know which skills are MAF vs. mine?

**A:** Check `.claude/.maf-manifest.json`. If it's not there, it's yours.

### Q: Can I delete MAF skills I don't use?

**A:** Yes, but they'll come back on updates. Better to just not use them.

### Q: What's the difference between a patch and a fork?

**A:** Patches are for small tweaks. Forks are for major changes or when you want to maintain your own version.

---

## Getting Help

### Check Documentation

- `docs/VENDOR_ARCHITECTURE.md` - Technical deep-dive
- `vendor/README.md` - Vendor management
- `.claude/.MAF_MARKER` - File ownership rules

### Run Diagnostics

```bash
# Health check
bash scripts/maf/health-check.sh

# List patches
bash scripts/maf/vendor-patch-list.sh

# Check manifest
cat .claude/.maf-manifest.json | jq .
```

### Restore Points

```bash
# List available restore points
bash scripts/franchisee-rollback.sh --list

# Rollback if needed
bash scripts/franchisee-rollback.sh <restore-point>
```

---

## Summary

| What | How | Safety |
|------|-----|--------|
| Update MAF | `bash scripts/franchisee-update.sh all` | Automatic rollback on failure |
| Customize vendor | Edit + `vendor-patch-create.sh` | Patches survive updates |
| Add skills | Just add file to `.claude/skills/` | Never touched by MAF |
| Contribute skills | PR to MAF HQ | Becomes MAF-managed |
| Fix problems | `franchisee-rollback.sh` | One-command undo |

**Remember:** If something goes wrong, you can always roll back. Every update creates a restore point automatically.
