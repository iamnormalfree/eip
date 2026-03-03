# Versioning Guide - Semantic Versioning for Cognitive Systems

**Version:** 1.0
**Last Updated:** 2026-01-10
**MAF Version:** v0.2.x

---

## Purpose

This document defines the versioning scheme for MAF (Multi-Agent Framework), which extends semantic versioning to address the unique challenges of versioning cognitive systems and multi-agent frameworks.

---

## Version Format

### Standard Format

```
vX.Y.Z-<prerelease>?+<build>?

X = Major version (breaking changes)
Y = Minor version (new features, backward compatible)
Z = Patch version (bug fixes, backward compatible)
```

### MAF-Extended Format

```
vX.Y.Z-<prerelease>?+<build>?-<intent-tag>

intent-tag = {foundation | cognition | coordination | integration | governance | docs}
```

**Examples:**
- `v0.2.9` - Release version 0.2.9
- `v0.3.0-foundation+20260110` - Prerelease with foundation intent
- `v1.0.0+20260110` - Stable release
- `v0.2.10-cognition` - Cognition-focused prerelease

---

## Intent Tags

Intent tags communicate the primary purpose of a release to franchisees and agents.

### foundation

**Purpose:** Infrastructure, setup, environment detection

**Characteristics:**
- Adds new setup wizard features
- Improves environment detection
- Adds new scripts or tools
- Changes file system layout

**Impact on Franchisees:**
- May require running setup wizard again
- May need to update `.maf/context.sh`
- Typically backward compatible

**Example:**
```
v0.3.0-foundation
Added automated context detection
Improved setup wizard validation
```

### cognition

**Purpose:** Agent autonomy, decision-making, metacognition

**Characteristics:**
- Improves autonomous agent capabilities
- Adds new metacognitive tags
- Enhances error recovery
- Expands agent rights/assumptions

**Impact on Franchisees:**
- Agents become more autonomous
- May need to review MAF_CONSTITUTION.md changes
- May need to update AGENTS.md

**Example:**
```
v0.4.0-cognition
Added Level 2 autonomy for multi-file changes
Improved error recovery protocols
Enhanced escalation format
```

### coordination

**Purpose:** Agent-to-agent communication, workflow orchestration

**Characteristics:**
- Agent mail protocol changes
- Beads workflow enhancements
- New coordination patterns
- Performance improvements for multi-agent work

**Impact on Franchisees:**
- May require agent mail service restart
- May need to update beads database schema
- May affect agent spawning

**Example:**
```
v0.5.0-coordination
Added parallel bead execution
Improved agent mail performance
Enhanced dependency resolution
```

### integration

**Purpose:** External tools, vendor integration, APIs

**Characteristics:**
- New tool integrations
- Vendor subtree updates
- API changes (external)
- New CI/CD features

**Impact on Franchisees:**
- May require updating vendor subtrees
- May need to run sync scripts
- May affect CI/CD pipelines

**Example:**
```
v0.2.10-integration
Updated superpowers subtree to v1.5
Added beads_viewer integration
Improved subtree health checks
```

### governance

**Purpose:** Policies, procedures, documentation

**Characteristics:**
- Constitution changes
- New governance documents
- Policy updates
- Compliance features

**Impact on Franchisees:**
- Review governance changes
- May need to update local documentation
- May affect override procedures

**Example:**
```
v0.2.9-governance
Added CORE_OVERRIDE_POLICY.md
Updated MAF_CONSTITUTION.md autonomy levels
Added subtree guard CI workflow
```

### docs

**Purpose:** Documentation, examples, guides

**Characteristics:**
- New documentation
- Updated guides
- New examples
- Improved tutorials

**Impact on Franchisees:**
- Review updated documentation
- No code changes (typically)
- Optional to adopt new practices

**Example:**
```
v0.2.9-docs
Added autonomous operation guide
Updated examples for cognition tags
Improved troubleshooting docs
```

---

## Semantic Versioning Rules

### Major Version (X)

**Increment when:**
- Breaking changes to core MAF APIs
- Changes to agent mail protocol
- Changes to beads database schema
- Removal of documented features
- Changes to MAF_CONSTITUTION.md that reduce agent autonomy

**Example:**
```
v0.2.9 → v1.0.0
Stable release, production-ready
All APIs finalized
Constitution locked for 1.x series
```

**Migration Path:**
- Provide migration guide
- Support old version for 6 months
- Automate migration where possible

### Minor Version (Y)

**Increment when:**
- New features added
- New autonomy levels added
- New intent tags added
- Backward-compatible API additions

**Example:**
```
v0.2.9 → v0.3.0
Added Level 2 autonomy
New setup wizard features
Improved environment detection
```

**Migration Path:**
- Document new features
- Provide opt-in period
- Default to old behavior initially

### Patch Version (Z)

**Increment when:**
- Bug fixes
- Security patches
- Performance improvements
- Documentation fixes
- Typos corrected

**Example:**
```
v0.2.9 → v0.2.10
Fixed agent mail parsing bug
Improved subtree health check
Updated documentation
```

**Migration Path:**
- Automatic (safe to upgrade)
- Review release notes for any manual steps

---

## Release Process

### Pre-Release Checklist

**For MAF HQ:**
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Governance docs reviewed
- [ ] Release notes drafted
- [ ] Intent tag selected
- [ ] Breaking changes documented
- [ ] Migration guide (if major/minor)

**For Franchisees:**
- [ ] Review release notes
- [ ] Check for breaking changes
- [ ] Test in non-production environment
- [ ] Plan migration window (if needed)
- [ ] Update local documentation (if needed)

### Release Tags

**Format:**
```bash
git tag -a vX.Y.Z-intent -m "vX.Y.Z-intent: Release description"
git push origin vX.Y.Z-intent
```

**Example:**
```bash
git tag -a v0.3.0-foundation -m "v0.3.0-foundation: Automated context detection"
git push origin v0.3.0-foundation
```

### Release Notes Template

```markdown
# Release v0.3.0-foundation

**Date:** 2026-01-10
**Intent:** foundation

## Summary

Brief description of the release and its primary focus.

## What's New

### Features
- Feature 1
- Feature 2

### Improvements
- Improvement 1
- Improvement 2

### Bug Fixes
- Bug fix 1
- Bug fix 2

## Breaking Changes

None (or list breaking changes with migration guide)

## Upgrade Instructions

### From v0.2.x

1. Pull latest changes: `git pull origin main`
2. Run setup wizard: `maf/scripts/maf/setup-maf.sh`
3. Verify environment: `source .maf/context.sh && env | grep MAF_`
4. Test agent spawning: `maf/scripts/maf/spawn-agents.sh`

## Known Issues

List any known issues or limitations.

## Deprecations

List any features deprecated in this release.

## Migration Guide

Detailed migration instructions if breaking changes exist.
```

---

## Version Detection

### For Agents

Agents should detect MAF version to understand available features:

```bash
# Get MAF version
MAF_VERSION=$(cat "$PROJECT_ROOT/maf/VERSION" 2>/dev/null || echo "unknown")

# Parse version
MAF_MAJOR=$(echo "$MAF_VERSION" | cut -d. -f1 | sed 's/v//')
MAF_MINOR=$(echo "$MAF_VERSION" | cut -d. -f2)
MAF_PATCH=$(echo "$MAF_VERSION" | cut -d. -f3 | cut -d- -f1)

# Check feature availability
if [[ "$MAF_MINOR" -ge 3 ]]; then
    # Feature available in v0.3.0+
    use_new_feature
else
    # Fallback for older versions
    use_legacy_feature
fi
```

### For Setup Wizard

Setup wizard should check version compatibility:

```bash
# Check minimum required version
REQUIRED_VERSION="0.3.0"
CURRENT_VERSION=$(cat "$PROJECT_ROOT/maf/VERSION")

if ! version_compare "$CURRENT_VERSION" ">=" "$REQUIRED_VERSION"; then
    echo "ERROR: MAF $REQUIRED_VERSION or higher required"
    echo "Current version: $CURRENT_VERSION"
    exit 1
fi
```

---

## Deprecation Policy

### Deprecation Notice

When deprecating a feature:

1. **Announce in release notes** - Clearly mark as deprecated
2. **Provide migration path** - How to replace deprecated feature
3. **Set removal timeline** - Typically 2 minor versions
4. **Add runtime warnings** - Warn users of deprecated feature

### Example Deprecation

```markdown
## Deprecated in v0.3.0

### Old Agent Mail Protocol

**Deprecated:** v0.3.0
**Removal:** v0.5.0
**Replacement:** New agent mail protocol (see MAF_ASSUMPTIONS.md)

**Migration:**
Update agent mail calls from old format to new format:
```bash
# Old (deprecated)
maf send-mail --to "agent-all" --subject "Hello"

# New (use this)
maf send-mail --to "agent-mail-all" --subject "Hello" --format "standard"
```

**Warning:** Old protocol will be removed in v0.5.0
```

---

## Compatibility Matrix

### MAF Version Compatibility

| MAF Version | Agent Mail | Beads DB | Constitution | Assumptions | Override Policy |
|-------------|------------|----------|--------------|-------------|-----------------|
| v0.2.x      | v1.0       | v1.0     | v1.0         | N/A         | N/A             |
| v0.3.0      | v1.0       | v1.0     | v1.0         | v1.0        | v1.0            |
| v0.4.0      | v2.0       | v1.0     | v1.0         | v1.0        | v1.0            |

### Upgrade Paths

**Supported Upgrades:**
- Patch upgrades (v0.2.9 → v0.2.10): Always safe
- Minor upgrades (v0.2.x → v0.3.0): Review release notes
- Major upgrades (v0.x → v1.0): Read migration guide

**Unsupported Upgrades:**
- Skipping major versions (e.g., v0.2 → v2.0): Upgrade incrementally
- Downgrading: Not supported (may break database)

---

## Version File

### VERSION File Location

**HQ Layout:** `maf/VERSION`
**Franchisee Layout:** `maf/VERSION` (in subtree)

### VERSION File Format

```
v0.2.9
```

**Purpose:**
- Quick version reference
- Agent version detection
- Setup wizard compatibility check

### Updating VERSION

**Only update VERSION file during release:**

```bash
# Update version
echo "v0.3.0-foundation" > maf/VERSION

# Commit with release
git add maf/VERSION
git commit -m "release: v0.3.0-foundation"
git tag -a v0.3.0-foundation -m "v0.3.0-foundation: Release notes"
git push origin main v0.3.0-foundation
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-10 | Initial versioning guide |

---

**This document is part of the MAF governance layer.**
**It defines how MAF versions are structured and communicated.**
**Consistent versioning enables franchisees to plan upgrades effectively.**
