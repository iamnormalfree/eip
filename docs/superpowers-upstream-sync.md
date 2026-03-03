# Superpowers Upstream Sync Guide

## For MAF HQ

When obra/superpowers has updates:

```bash
# 1. Pull upstream changes
git subtree pull --prefix=vendor/superpowers https://github.com/obra/superpowers main --squash

# 2. Review what changed
git log vendor/superpowers

# 3. Sync skills to .claude/
maf-hq update

# 4. Verify health
maf-hq doctor

# 5. Test the changes
# 6. Commit if everything works
git add .
git commit -m "chore: update superpowers from upstream"
```

## For Franchisees

When MAF pushes updates:

```bash
# Update MAF + vendors and sync skills
bash scripts/franchisee-update.sh all
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
