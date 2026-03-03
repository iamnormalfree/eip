# Response-Awareness Upstream Integration Design

**Date:** 2026-01-09
**Status:** Approved
**Author:** Claude + User Collaboration

---

## Goal

Integrate Typhren42/Response-Awareness as a clean upstream dependency, enabling seamless updates while maintaining MAF's ability to add custom skill layers.

---

## Architecture Overview

```
vendor/
├── superpowers/           (obra/superpowers subtree)
│   └── skills/           (14 AI workflow skills)
└── response-awareness/    (Typhren42/Response-Awareness subtree)
    └── skills/           (upstream Response-Awareness skills)

.maf/skills/               (MAF customizations - override both vendors)
├── response-awareness-full/
├── response-awareness-heavy/
├── response-awareness-medium/
└── response-awareness-light/

.claude/skills/            (working set - synced from vendors + MAF overrides)
```

**Sync Flow:**
1. Copy `vendor/superpowers/skills/*` → `.claude/skills/` (baseline)
2. Copy `vendor/response-awareness/skills/*` → `.claude/skills/` (add upstream)
3. Copy `.maf/skills/*` → `.claude/skills/` (MAF overrides replace both)

**Priority Order:** Both vendors sync first → MAF customizations override everything

---

## Key Design Decisions

### 1. Upstream Integration Method
**Chosen:** Git subtree from `Typhren42/Response-Awareness`

**Rationale:**
- Clean upstream pulls with single command
- MAF controls which version/commit to use
- Automatic conflict detection
- Same pattern as Superpowers (consistency)

### 2. Multi-Vendor Sync Strategy
**Chosen:** Extend existing `sync-skills.sh` to handle both vendors

**Rationale:**
- Single `maf-hq update` command for all vendor syncs
- Consistent workflow for users
- Simplified maintenance (one script to update)

### 3. MAF Custom Skills as Overrides
**Chosen:** MAF's 4 Response-Awareness skills move to `.maf/skills/` and override upstream

**Rationale:**
- MAF has customized these skills for MAF-specific needs
- Same pattern as Superpowers integration
- Allows MAF to control default behavior while receiving upstream updates

---

## Components

### 1. Extended sync-skills.sh

**File:** `scripts/maf/sync-skills.sh`

**Changes:**
```bash
# Add new vendor path
VENDOR_RESPONSE_AWARENESS_DIR="$PROJECT_ROOT/vendor/response-awareness/skills"

# Sync both vendors (in order)
rsync -av --delete "$VENDOR_SUPERPOWERS_DIR/" "$CLAUDE_SKILLS_DIR/"
rsync -av --delete "$VENDOR_RESPONSE_AWARENESS_DIR/" "$CLAUDE_SKILLS_DIR/"

# MAF overrides still apply last
rsync -av "$MAF_SKILLS_DIR/" "$CLAUDE_SKILLS_DIR/"
```

### 2. Updated doctor.sh

**File:** `scripts/maf/doctor.sh`

**Changes:**
- Add check for `vendor/response-awareness/skills` directory
- Report skill counts by source (vendor, MAF custom)
- Validate across all three sources

### 3. Subtree Addition

**Command:**
```bash
git subtree add --prefix=vendor/response-awareness https://github.com/Typhren42/Response-Awareness main --squash
```

**Branch:** `main` (commit `d00e989` as of 2026-01-09)

### 4. MAF Skills Migration

**Source → Target:**
- `.claude/skills/response-awareness-full/` → `.maf/skills/response-awareness-full/`
- `.claude/skills/response-awareness-heavy/` → `.maf/skills/response-awareness-heavy/`
- `.claude/skills/response-awareness-medium/` → `.maf/skills/response-awareness-medium/`
- `.claude/skills/response-awareness-light/` → `.maf/skills/response-awareness-light/`

---

## Implementation Steps

### Phase 1: Prepare MAF Skills
1. Create `.maf/skills/` directory structure
2. Move 4 Response-Awareness skills from `.claude/skills/` to `.maf/skills/`
3. Verify directory structure

### Phase 2: Add Subtree
4. Add `vendor/response-awareness/` subtree from upstream
5. Verify subtree was created successfully
6. Check upstream skill structure

### Phase 3: Extend Sync Script
7. Update `scripts/maf/sync-skills.sh` for multi-vendor sync
8. Update `scripts/maf/doctor.sh` for validation
9. Test syntax of both scripts

### Phase 4: Initial Sync
10. Run `maf-hq update` to sync all vendor skills
11. Verify MAF's 4 skills override correctly
12. Run `maf-hq doctor` to verify health

### Phase 5: Documentation
13. Update README.md with Response-Awareness vendor
14. Create `docs/response-awareness-upstream-sync.md`
15. Update `.claude/skills/README.md` with third vendor source

---

## Multi-Vendor Priority Order

Skills are loaded in this priority:

1. **Superpowers** (`vendor/superpowers/skills/`) - baseline 1
2. **Response-Awareness** (`vendor/response-awareness/skills/`) - baseline 2
3. **MAF custom skills** (`.maf/skills/`) - override everything

This allows:
- Franchisees get both Superpowers AND Response-Awareness automatically
- MAF's custom skills (both Superpowers and Response-Awareness) take priority
- Franchisee further overrides via `.maf/overrides/skills/`

---

## Workflows

### For MAF HQ (when Response-Awareness updates)

```bash
# 1. Pull upstream changes
git subtree pull --prefix=vendor/response-awareness https://github.com/Typhren42/Response-Awareness main --squash

# 2. Review what changed
git log vendor/response-awareness

# 3. Sync skills to .claude/
maf-hq update

# 4. Verify health
maf-hq doctor

# 5. Test the changes
# 6. Commit if everything works
git add .
git commit -m "chore: update response-awareness from upstream"
```

### For Franchisees (when MAF updates)

```bash
# 1. Pull MAF changes (includes updated vendors)
git pull origin main

# 2. Sync skills (preserves .maf/ customizations)
maf-hq update

# 3. Verify health
maf-hq doctor
```

---

## Customizing Skills

### MAF-Level Customizations
Add custom skills to `.maf/skills/` - they override both vendor skills after sync.

### Franchisee-Level Customizations
Add custom skills to `.maf/overrides/skills/` - they override everything.

---

## Notes

- Skills are invoked by `name:` field, not directory name
- Search order: `.claude/skills/` (MAF) → vendors searched when loading
- MAF's custom skills automatically override upstream by virtue of being in `.maf/skills/`
- Franchisee customizations in `.maf/overrides/skills/` override everything
- Same pattern as Superpowers integration ensures consistency
