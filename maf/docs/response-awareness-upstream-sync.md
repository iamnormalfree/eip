# Response-Awareness Upstream Sync Guide

## For MAF HQ

When Typhren42/Response-Awareness has updates:

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

## For Franchisees

When MAF pushes updates:

```bash
# Update MAF + vendors and sync skills
bash scripts/franchisee-update.sh all
```

## Customizing Skills

### MAF-Level Customizations
Add custom skills to `.maf/skills/` - they override both vendor skills (Superpowers and Response-Awareness) after sync.

MAF currently has 4 custom Response-Awareness skills (full, heavy, medium, light) that override upstream versions.

### Franchisee-Level Customizations
Add custom skills to `.maf/overrides/skills/` - they override everything.

## Multi-Vendor Priority Order

Skills are synced from multiple vendors in this order:

1. **Superpowers** (`vendor/superpowers/skills/`) - 14 AI workflow skills (baseline)
2. **Response-Awareness** (`vendor/response-awareness/.claude/skills/`) - 4 Response-Awareness tier skills (additive)
3. **MAF custom skills** (`.maf/skills/`) - 7 MAF customizations (override both vendors)
4. **Franchisee skills** (`.maf/overrides/skills/`) - Override everything (optional)

Later syncs override earlier ones, so MAF and franchisee customizations always take priority.
