# Upstream Reference Directory

⚠️ **OBSOLETE:** This directory is no longer needed with the git subtree approach.

**Why it's obsolete:**
- Git subtree tracks versions automatically
- No need to download ZIPs manually
- Comparison done via `git diff` if needed

**This README is kept for historical reference only.**

---

## Historical Purpose (Pre-Subtree)

This directory stored pristine copies of the response-awareness framework for comparison purposes.

## Purpose

When you download a new version of the response-awareness framework from GitHub, unzip it here to compare with your customized working files.

## Structure

```
upstream-reference/
├── response-awareness-v2.0.0/     # First version you synced
│   ├── skills/
│   ├── commands/
│   ├── agents/
│   └── VERSION.txt
├── response-awareness-v2.1.0/     # Next version
│   └── ...
└── README.md (this file)
```

## Workflow

### 1. Download New Release

Download the latest release ZIP from:
https://github.com/your-org/response-awareness/releases

### 2. Unzip Here

```bash
cd .claude/upstream-reference
unzip response-awareness-v2.1.0.zip
```

### 3. Run Comparison

```bash
cd ../..  # Back to project root
node scripts/compare-upstream.js v2.1.0
```

### 4. Review Differences

The comparison script will generate a report showing:
- Which files have changed
- What customizations you've made
- Which upstream improvements to consider adopting

### 5. Manual Merge

For each file with differences:
```bash
code --diff .claude/upstream-reference/response-awareness-v2.1.0/skills/response-awareness-light.md .claude/skills/response-awareness-light.md
```

Manually merge improvements while preserving your customizations.

## What NOT to Do

❌ **Don't modify files in this directory** - They're reference copies only
❌ **Don't copy files directly from here to .claude/skills/** - Always merge manually
❌ **Don't delete old versions immediately** - Keep 2-3 versions for rollback

## What TO Do

✅ **Keep pristine** - Don't touch these files
✅ **Use for comparison** - Reference when merging updates
✅ **Delete old versions** - After 2-3 releases, archive or delete old versions

## Git Tracking

**Recommendation:** Add to `.gitignore`

This directory can be large and changes frequently. Each developer can download their own reference copies.

```gitignore
# .gitignore
.claude/upstream-reference/*
!.claude/upstream-reference/README.md
```

Alternatively, if you want to track it (so collaborators get same reference):
```gitignore
# Don't add to .gitignore - track in git
```

Your choice depends on team size and update frequency.

## Current Versions

| Version | Date Downloaded | Status |
|---------|----------------|--------|
| v2.0.0  | 2025-10-18     | Initial setup (placeholder - awaiting first download) |

Update this table when you download new versions.

---

**See:** [UPDATE_GUIDE.md](../../UPDATE_GUIDE.md) for full sync workflow
