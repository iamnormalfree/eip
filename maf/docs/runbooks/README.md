# MAF Runbooks & Documentation

This directory contains operational runbooks and troubleshooting guides for the MAF (Multi-Agent Framework) franchise system.

## Quick Links

### Getting Started
- 📘 [Consumer Upgrade Runbook](CONSUMER_UPGRADE.md) - Step-by-step guide for upgrading MAF in consumer projects
- 🔧 [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions

### Core Documentation
- [MAF Architecture Design](../plans/maf-franchise-architecture-design-v2.md) - System architecture and design principles
- [Migration Guide](../plans/maf-franchise-migration-unified-blueprint.md) - Complete migration blueprint for franchise rollout
- [Implementation Guide](../plans/FOUNDERS-IMPLEMENTATION-GUIDE.md) - Founder's guide to MAF implementation

### Verification & Testing
- [NextNest Verification](../plans/NEXTNEST-VERIFICATION.md) - NextNest-specific verification checklist
- [Roundtable Verification](../plans/ROUNDTABLE-VERIFICATION.md) - Roundtable-specific verification checklist
- [Test Baseline Report](../plans/agent-spawn-baseline-report.md) - Baseline test results

## Runbook Index

| Runbook | Purpose | Audience |
|---------|---------|----------|
| **CONSUMER_UPGRADE.md** | Upgrade MAF subtree from HQ | All users |
| **TROUBLESHOOTING.md** | Diagnose and fix issues | All users |

## Quick Reference

### Most Common Tasks

**Upgrade MAF to latest version:**
```bash
# See CONSUMER_UPGRADE.md for full instructions
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash
bash maf/scripts/maf/status/check-subtree-health.sh
```

**Check if subtree is clean:**
```bash
git diff --name-only | grep "^maf/" || echo "✅ Clean"
```

**Diagnose agent spawn issues:**
```bash
# See TROUBLESHOOTING.md
bash maf/scripts/maf/status/check-subtree-health.sh --verbose
```

**Restart all agents:**
```bash
bash maf/scripts/maf/rebuild-maf-cli-agents.sh
```

### Emergency Procedures

**Immediate rollback after failed upgrade:**
```bash
git reset --hard HEAD~1
git push origin main --force
```

**Kill all MAF sessions:**
```bash
tmux kill-server  # WARNING: Affects all tmux sessions
```

**Restore from backup:**
```bash
cp -r .maf.backup.YYYYMMDD_HHMMSS/* .maf/
```

## Documentation Structure

```
docs/
├── runbooks/                    # Operational runbooks (this directory)
│   ├── README.md               # This file
│   ├── CONSUMER_UPGRADE.md     # Upgrade guide
│   └── TROUBLESHOOTING.md      # Troubleshooting guide
├── plans/                       # Migration plans and blueprints
│   ├── maf-franchise-*.md      # Franchise architecture docs
│   └── VERIFICATION-*.md       # Verification reports
└── check-files/                 # Architecture design docs
    └── maf-franchise-*.md      # Design specifications
```

## Support Resources

### Self-Service Resources
- **Troubleshooting Guide** - Start here for common issues
- **Architecture Docs** - Understand how MAF works
- **Migration Guide** - Plan your franchise rollout

### Getting Help
1. **Search existing issues** - https://github.com/iamnormalfree/maf/issues
2. **Create new issue** - Use appropriate labels (bug, enhancement, question)
3. **Contact maintainers** - See project README for contact info

### When to Create an Issue
- Bug in MAF code
- Documentation unclear or missing
- Feature request
- Security concern
- Performance problem

### When to Contact Maintainers Directly
- Production outage
- Security incident
- Data loss
- Critical blocking issue

## Training Resources

### New User Onboarding
1. Read [MAF Architecture Design](../plans/maf-franchise-architecture-design-v2.md)
2. Complete [Consumer Upgrade Runbook](CONSUMER_UPGRADE.md) in test environment
3. Practice with [Troubleshooting Guide](TROUBLESHOOTING.md) scenarios
4. Join project Slack/Discord for real-time help

### Advanced Training
- [Founders Implementation Guide](../plans/FOUNDERS-IMPLEMENTATION-GUIDE.md)
- [Migration Blueprint](../plans/maf-franchise-migration-unified-blueprint.md)
- Shadow senior MAF users during upgrades

## Version Compatibility

| MAF Version | Document Version | Status |
|-------------|------------------|--------|
| 0.2.x | 1.0 | Current |
| 0.1.x | 0.9 | Deprecated |

Check your MAF version:
```bash
jq '.version' maf/VERSION.json 2>/dev/null || echo "Unknown"
```

## Contributing to Documentation

Found a typo? Missing information? Please contribute!

**Quick fix:**
1. Edit the file directly
2. Commit with clear message: `docs: Fix typo in TROUBLESHOOTING.md`
3. Create PR

**Larger changes:**
1. Create issue proposing change
2. Discuss with maintainers
3. Implement after approval

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-08 | 1.0 | Initial documentation for Day 25-28 |

---

**Need help?** Start with the [Troubleshooting Guide](TROUBLESHOOTING.md).

**Still stuck?** [Create an issue](https://github.com/iamnormalfree/maf/issues/new).
