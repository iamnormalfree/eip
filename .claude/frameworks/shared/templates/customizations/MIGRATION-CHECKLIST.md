# Migration Checklist for Existing Projects

Use this checklist when migrating an existing project to use the shared frameworks via git subtree.

---

## Pre-Migration

- [ ] **Commit all changes** - Working tree must be clean
  ```bash
  git status
  git add .
  git commit -m "WIP: before framework migration"
  ```

- [ ] **Backup CLAUDE.md** - You'll be adding to it, not replacing
  ```bash
  cp CLAUDE.md CLAUDE.md.backup
  ```

- [ ] **Note your current setup** - Document what you have
  - Do you have `.claude/skills/response-awareness-*` folders?
  - Do you have `.claude/commands/response-awareness-*` folders?
  - Do you have custom skills?
  - Do you have custom agents?

---

## Migration Steps

### 1. Run Migration Script (Dry Run First)

```powershell
# Test what will happen (no changes made)
.\scripts\migrate-old-project.ps1 -ProjectPath "C:\Path\To\Your\Project" -DryRun

# Review the output, then run for real
.\scripts\migrate-old-project.ps1 -ProjectPath "C:\Path\To\Your\Project"
```

**What this does:**
- Archives old response-awareness files to `.claude/skills/archive/` and `.claude/commands/archive/`
- Adds git subtree at `.claude/frameworks/shared/`
- Updates `.claude/commands/response-awareness.md` to load from subtree
- Copies config templates if missing

### 2. Update CLAUDE.md

- [ ] **Add Response-Awareness section** to your CLAUDE.md
  ```bash
  # Copy the template section
  # See: .claude/frameworks/shared/templates/customizations/CLAUDE.md-response-awareness-section.md

  # Add it to your CLAUDE.md (don't replace the whole file!)
  ```

- [ ] **Replace placeholders:**
  - [ ] GitHub URL: `https://github.com/YOUR_USERNAME/claude-shared` → your actual URL
  - [ ] Remove skills you don't use (e.g., worktree-helper if not applicable)
  - [ ] Adjust paths if different from defaults

- [ ] **Verify existing sections preserved:**
  - [ ] Working relationship guidelines
  - [ ] Project-specific rules
  - [ ] Tech stack information
  - [ ] Testing requirements

### 3. Review Config Files

Config files should be in `.claude/config/`:

- [ ] **Check `response-awareness-config.json`**
  - [ ] Verify paths match your project structure
  - [ ] Adjust tier model preferences if needed
  - [ ] Enable/disable features as appropriate

- [ ] **Check `logging-config.json`**
  - [ ] Verify log paths exist or create them
  - [ ] Adjust verbosity as needed

- [ ] **Check `agents-config.json`**
  - [ ] Add any project-specific agents
  - [ ] Remove agents you don't need

### 4. Review Settings Files (Optional)

Settings files are project-specific and **not** automatically updated:

- [ ] **`.claude/settings.json`** - Hooks configuration
  - Keep your existing settings (don't copy template)
  - Reference template if you want to add new hooks
  - Located at: `.claude/frameworks/shared/templates/settings/settings.example.json`

- [ ] **`.claude/settings.local.json`** - Permissions and MCP servers
  - Keep your existing settings (don't copy template)
  - Reference template if you want to see what NextNest uses
  - Located at: `.claude/frameworks/shared/templates/settings/settings.local.example.json`

### 5. Clean Up (Optional)

- [ ] **Review archived files** in `.claude/skills/archive/2025-10-pre-subtree/`
  - Keep them for reference initially
  - Delete after you're confident migration worked

- [ ] **Review archived commands** in `.claude/commands/archive/2025-10-pre-subtree/`
  - Keep them for reference initially
  - Delete after you're confident migration worked

### 6. Test the Setup

- [ ] **Test response-awareness command:**
  ```bash
  /response-awareness "test complexity routing"
  ```
  Should show complexity assessment and tier routing

- [ ] **Verify subtree exists:**
  ```bash
  ls .claude/frameworks/shared/frameworks/response-awareness/
  ```
  Should show: response-awareness-light, medium, heavy, full, shared

- [ ] **Test a real task:**
  ```bash
  /response-awareness "your actual task"
  ```
  Verify it works as expected

### 7. Add to Update List

- [ ] **Add project to update script**
  ```bash
  # In NextNest repo: scripts/project-list.txt
  # Add your project path
  C:\Path\To\Your\Project
  ```

### 8. Commit Migration

- [ ] **Review all changes:**
  ```bash
  git status
  git diff
  ```

- [ ] **Commit everything:**
  ```bash
  git add .
  git commit -m "feat: migrate to shared frameworks via git subtree

  - Added git subtree at .claude/frameworks/shared/
  - Archived old response-awareness files
  - Updated CLAUDE.md with framework documentation
  - Configured for multi-project framework management"
  ```

---

## Post-Migration

### Immediate Testing

- [ ] Run a simple task: `/response-awareness "add a comment to file X"`
- [ ] Run a complex task: `/response-awareness "implement feature Y"`
- [ ] Test brainstorming: `/response-awareness "I'm thinking about..."`
- [ ] Test debugging: `/response-awareness "Fix error in..."`

### Future Updates

When shared frameworks update:

```bash
# Pull latest from shared repository
git subtree pull --prefix .claude/frameworks/shared \
  https://github.com/YOUR_USERNAME/claude-shared.git master --squash

# Test
/response-awareness "test task"
```

Or use bulk update script:

```powershell
# From NextNest repo
.\scripts\update-all-projects.ps1
```

---

## Rollback Plan (If Something Goes Wrong)

### If migration fails or doesn't work:

1. **Restore from backup:**
   ```bash
   # Find the commit before migration
   git log --oneline

   # Reset to that commit
   git reset --hard <commit-hash>

   # Or restore specific file
   git checkout HEAD~1 CLAUDE.md
   ```

2. **Remove subtree:**
   ```bash
   git rm -rf .claude/frameworks/shared/
   git commit -m "Revert: remove subtree"
   ```

3. **Restore archived files:**
   ```bash
   git mv .claude/skills/archive/2025-10-pre-subtree/* .claude/skills/
   git mv .claude/commands/archive/2025-10-pre-subtree/* .claude/commands/
   git commit -m "Restore old setup"
   ```

---

## Common Issues

### Issue: Migration script says "no old setup detected"

**Cause:** Your project may:
- Already be migrated
- Never had response-awareness
- Have files in different locations

**Solution:** Review manually what files you have, then run setup-new-project.ps1 instead

### Issue: Response-awareness command not loading

**Cause:** Path in `.claude/commands/response-awareness.md` may be wrong

**Solution:** Check the load command:
```markdown
Read file `.claude/frameworks/shared/frameworks/response-awareness/response-awareness-shared/NEXTNEST_CUSTOMIZATIONS.md`
```

### Issue: Config files missing

**Cause:** Templates weren't copied

**Solution:** Copy manually:
```bash
cp .claude/frameworks/shared/templates/config/*.json .claude/config/
```

### Issue: Settings files got overwritten

**Cause:** You manually copied templates over existing files

**Solution:** Restore from git:
```bash
git checkout HEAD~1 .claude/settings.json .claude/settings.local.json
```

---

## Verification Checklist

After migration, verify these files exist:

**Shared (via subtree):**
- [ ] `.claude/frameworks/shared/frameworks/response-awareness/`
- [ ] `.claude/frameworks/shared/frameworks/superpowers/`
- [ ] `.claude/frameworks/shared/templates/`

**Local (project-specific):**
- [ ] `.claude/config/response-awareness-config.json`
- [ ] `.claude/config/logging-config.json`
- [ ] `.claude/config/agents-config.json`
- [ ] `.claude/commands/response-awareness.md`
- [ ] `CLAUDE.md` (with Response-Awareness section added)

**Archived (old setup):**
- [ ] `.claude/skills/archive/2025-10-pre-subtree/` (if had old files)
- [ ] `.claude/commands/archive/2025-10-pre-subtree/` (if had old files)

---

**For detailed information, see:**
- `docs/guides/MULTI_PROJECT_SETUP.md` (in NextNest repo)
- `UPDATE_GUIDE.md` (in NextNest repo)
- `.claude/frameworks/shared/README.md` (in your project after subtree add)
