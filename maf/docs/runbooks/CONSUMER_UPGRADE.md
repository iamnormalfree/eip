# MAF Upgrade Runbook

**Version:** 1.0
**Last Updated:** 2026-01-08
**Purpose:** Guide for upgrading MAF subtree in consumer projects

---

## Overview

This runbook provides step-by-step instructions for upgrading the MAF (Multi-Agent Framework) subtree in consumer projects (Roundtable, NextNest, etc.) when new versions are released to the HQ repository.

## Prerequisites

### Before Starting

- [ ] **Backup current state**
  ```bash
  cp -r .maf .maf.backup.$(date +%Y%m%d_%H%M%S)
  git stash push -m "Pre-upgrade backup" --include-untracked
  ```

- [ ] **Verify no uncommitted changes**
  ```bash
  git status
  # Should show: "nothing to commit, working tree clean"
  ```

- [ ] **Confirm on correct branch**
  ```bash
  git branch --show-current
  # Should be: main or production branch
  ```

- [ ] **Run health check**
  ```bash
  bash scripts/maf/status/check-subtree-health.sh
  # Should show: "Subtree: Clean"
  ```

- [ ] **Check latest HQ version**
  ```bash
  git ls-remote https://github.com/iamnormalfree/maf.git main
  # Note the commit hash for comparison
  ```

---

## Upgrade Steps

### Step 1: Create Upgrade Branch

Create a dedicated branch for the upgrade:

```bash
# Get latest version number from HQ releases
VERSION="1.0.0"  # Update this to latest version

git checkout -b maf/upgrade-v${VERSION}
```

**Why?** Isolates upgrade changes for easy rollback and code review.

### Step 2: Pull Subtree Updates

Pull the latest changes from MAF HQ:

```bash
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash
```

**Expected Output:**
```
Git output: Merge commit 'XXXXXXXX' into maf/upgrade-v1.0.0
```

**Troubleshooting:**
- If you get "conflict" errors, see [Troubleshooting Guide](TROUBLESHOOTING.md)
- If subtree doesn't exist, use `git subtree add` instead of `pull`

### Step 3: Run Smoke Tests

Verify the subtree integration:

```bash
# Check subtree health
bash scripts/maf/status/check-subtree-health.sh
```

**Expected Output:**
```
🔍 MAF Subtree Health Check
✅ Subtree: Clean
✅ All checks passed
```

**Additional Manual Tests:**
```bash
# Verify new files exist
ls -la maf/scripts/maf/lib/

# Check for breaking changes in release notes
# Visit: https://github.com/iamnormalfree/maf/releases

# Test basic functionality (adjust for your project)
bash maf/scripts/maf/spawn-agents.sh --dry-run 2>/dev/null || echo "Spawn test skipped"
```

### Step 4: Review Changes

Examine what changed:

```bash
# Show changed files
git diff --stat main

# Review specific changes
git diff main maf/

# Check for breaking changes in release notes
# Visit: https://github.com/iamnormalfree/maf/releases
echo "Review release notes for breaking changes"
```

**Look for:**
- New features that need configuration
- Deprecated functionality to remove
- Configuration file changes needed
- Dependency updates

### Step 5: Test in Staging Environment

**Before merging to main:**

1. **Deploy to staging**
   ```bash
   # Adjust for your deployment process
   git push origin maf/upgrade-v${VERSION}
   # Deploy to staging environment
   ```

2. **Run integration tests**
   ```bash
   # Your project's test suite
   npm test
   # or
   pytest
   # or
   bash scripts/tests/integration.sh
   ```

3. **Verify agent spawning**
   ```bash
   # Test MAF agent spawning
   bash maf/scripts/maf/rebuild-maf-cli-agents.sh --dry-run
   ```

4. **Check logs for errors**
   ```bash
   # Review application logs
   tail -f logs/app.log | grep -i error
   ```

### Step 6: Create Pull Request

Create PR with proper labeling:

```bash
# Using GitHub CLI
gh pr create \
  --title "Upgrade MAF to v${VERSION}" \
  --body "Upgrade MAF subtree to version ${VERSION}

**Changes:**
- $(git log --oneline main..HEAD | wc -l) commits from HQ
- See [HQ Release Notes](https://github.com/iamnormalfree/maf/releases/tag/v${VERSION})

**Testing:**
- ✅ Subtree health check passed
- ✅ Smoke tests passed
- ✅ Staging tests passed

**Rollback Plan:** If issues arise, use \`git reset --hard main\`
" \
  --label "maf-upgrade" \
  --base main
```

**Without GitHub CLI:**
1. Go to GitHub web interface
2. Create PR from `maf/upgrade-v${VERSION}` → `main`
3. **IMPORTANT:** Add `maf-upgrade` label
4. Link to staging environment results

**Why the `maf-upgrade` label?**
- Bypasses CI guard that blocks subtree edits
- Signals this is an intentional upgrade from HQ

### Step 7: Code Review

**Review checklist:**

- [ ] Changes align with HQ release notes
- [ ] No unexpected modifications to `maf/` directory
- [ ] Configuration files updated if needed
- [ ] Documentation updated
- [ ] Tests pass in staging
- [ ] No breaking changes without mitigation

**Approval required:**
- At least one maintainer
- Technical lead for complex upgrades

### Step 8: Merge to Main

After approval and successful staging tests:

```bash
# Option A: Merge via GitHub UI (recommended)
# Click "Merge pull request" button

# Option B: Merge via command line
git checkout main
git merge --no-ff maf/upgrade-v${VERSION}
git push origin main
```

**Post-merge verification:**
```bash
# Verify subtree is clean
git diff --name-only | grep "^maf/" || echo "✅ Subtree clean"

# Run health check
bash scripts/maf/status/check-subtree-health.sh
```

### Step 9: Cleanup

After successful merge:

```bash
# Delete upgrade branch
git branch -d maf/upgrade-v${VERSION}
git push origin --delete maf/upgrade-v${VERSION}

# Remove backup if everything works (optional)
# rm -rf .maf.backup.*
```

---

## Rollback Procedures

### Immediate Rollback (If Merge Not Yet Pushed)

```bash
# Reset to before merge
git reset --hard HEAD~1
git push origin main --force
```

### Rollback After Push (But Before Deployment)

```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>
git push origin main
```

### Rollback After Deployment

1. **Revert code changes**
   ```bash
   git revert -m 1 <merge-commit-hash>
   git push origin main
   ```

2. **Rollback database changes** (if any)
   ```bash
   # Your rollback procedure here
   ```

3. **Clear caches**
   ```bash
   # Clear application caches
   redis-cli FLUSHALL  # If using Redis
   # or your cache clearing procedure
   ```

4. **Restart services**
   ```bash
   # Your service restart procedure
   systemctl restart your-app
   ```

5. **Verify rollback**
   ```bash
   bash scripts/maf/status/check-subtree-health.sh
   # Run your smoke tests
   ```

---

## Common Issues and Solutions

### Issue: Subtree Pull Fails with "Merge Conflict"

**Cause:** Local changes to `maf/` directory conflict with HQ changes

**Solution:**
```bash
# 1. Stash local changes
git stash push -m "Subtree conflict" -- maf/

# 2. Retry subtree pull
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# 3. Apply local changes back manually
git stash pop

# 4. Resolve conflicts carefully
# DO NOT commit changes to maf/ directly - only in your project files
```

**Prevention:** Never modify files in the `maf/` subtree directly. Always contribute changes back to HQ first.

### Issue: Health Check Fails After Upgrade

**Symptoms:**
```
❌ Subtree: Dirty
❌ Uncommitted changes in maf/
```

**Solution:**
```bash
# 1. Check what changed
git diff --name-only | grep "^maf/"

# 2. If these are expected changes from upgrade, commit them
git add maf/
git commit -m "chore: Update MAF subtree to v${VERSION}"

# 3. If unexpected, investigate
git diff maf/
# Contact MAF maintainers if unsure
```

### Issue: Tests Fail After Upgrade

**Diagnostic Steps:**

1. **Check for breaking changes**
   ```bash
   # Check release notes for breaking changes
   # Visit: https://github.com/iamnormalfree/maf/releases
   echo "Review release notes for breaking changes"
   ```

2. **Review test failures**
   ```bash
   npm test 2>&1 | tee test-output.log
   # Analyze which tests failed
   ```

3. **Compare configurations**
   ```bash
   diff .maf.backup.*/config .maf/config/
   ```

**Solutions:**
- Update tests to match new MAF behavior
- Update configuration files
- Rollback if breaking changes are too severe
- Contact MAF maintainers for guidance

---

## Version Compatibility Matrix

| MAF Version | Min Node.js | Status | EOL Date |
|-------------|-------------|--------|----------|
| 0.2.x | 18.x | Stable | 2026-03-01 |
| 0.1.x | 16.x | Deprecated | 2025-12-01 |

---

## Support and Resources

### Documentation
- [MAF Architecture](../plans/maf-franchise-architecture-design-v2.md)
- [Migration Guide](../plans/maf-franchise-migration-unified-blueprint.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)

### Getting Help
- GitHub Issues: https://github.com/iamnormalfree/maf/issues
- MAF Maintainers: Create GitHub issue with `upgrade-failure` label

### Emergency Contacts
- Technical Lead: [Contact info]
- On-Call Engineer: [Contact info]

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-08 | Initial version |

---

**Next Steps:** After successful upgrade, consider updating your project's documentation and training materials to reflect new MAF features.
