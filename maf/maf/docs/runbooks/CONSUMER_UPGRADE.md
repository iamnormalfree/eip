# Consumer Upgrade Guide

## After Subtree Pull

### If Configuration Format Changed

If MAJ_VERSION or MIN_VERSION changed, run setup wizard:

```bash
bash maf/scripts/setup/setup-maf.sh
# Choose: Update existing config
```

### If Reset Needed

If major changes require reconfiguration:

```bash
bash maf/scripts/setup/setup-maf.sh --reset
```

## Setup Wizard Modes

The MAF Control Console has 4 modes:

1. **Install** - Set up MAF in a new repo
2. **Update** - Update MAF config after subtree pull
3. **Doctor** - Diagnose and fix common drift issues
4. **Reset** - Nuke and rebuild config safely

## Version Detection

MAF version is stored in `maf/VERSION` file. Check before upgrading:

```bash
cat maf/VERSION
```

## Upgrade Path

- **Patch versions (0.0.X):** Safe to upgrade, no config changes needed
- **Minor versions (0.X.0):** Run setup wizard in Update mode
- **Major versions (X.0.0):** May require reset and reconfiguration

## Rollback

If upgrade causes issues:

```bash
# Restore from backup
cp -r .maf.backup.YYYYMMDD_HHMMSS .maf

# Or reset completely
bash maf/scripts/setup/setup-maf.sh --reset
```
