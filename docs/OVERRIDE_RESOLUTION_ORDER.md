# MAF Override Resolution Order

## Priority (Highest to Lowest)
1. `.maf/overrides/*` - Your customizations (always wins)
2. `.maf/config/*` - Your project configuration
3. `maf/templates/*` - Framework examples (fallback)
4. `maf/*` - Core framework (default)

## Implementation
See: scripts/maf/lib/project-root-utils.sh for auto-detection
