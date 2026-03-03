# Vendor Patches

This directory contains custom patches for vendor subtrees.

## Directory Structure

```
.maf/patches/
├── vendor-agent-mail/         # Patches for Agent Mail
│   ├── 0001-description.patch
│   ├── 0002-description.patch
│   └── .metadata.json
├── vendor-superpowers/        # Patches for Superpowers
│   └── (same structure)
└── README.md
```

## Creating a Patch

```bash
# 1. Edit vendor code directly
vim vendor/agent-mail/src/handlers/custom.py

# 2. Generate patch from your changes
cd vendor/agent-mail
git diff > ../../.maf/patches/vendor-agent-mail/0001-custom-handler.patch

# 3. Revert vendor changes (clean slate for next update)
git checkout .

# 4. Update metadata
vim .maf/patches/vendor-agent-mail/.metadata.json
```

## Patch Metadata

Each vendor directory has a `.metadata.json`:

```json
{
  "vendor": "agent-mail",
  "vendor_repo": "https://github.com/Dicklesworthstone/mcp_agent_mail",
  "vendor_branch": "main",
  "patches": [
    {
      "file": "0001-custom-handler.patch",
      "description": "Add custom message handler for XYZ",
      "applied": true,
      "fingerprint": "abc123..."
    }
  ]
}
```

## Automatic Application

Patches are automatically re-applied after vendor updates via `franchisee-update.sh`. If a patch fails to apply, you'll be prompted to resolve conflicts.

## Resolving Conflicts

When a patch fails after a vendor update:

```bash
# Manual resolution
cd vendor/agent-mail
patch -p1 < ../../.maf/patches/vendor-agent-mail/0001-custom-handler.patch

# Fix conflicts, then regenerate patch
git diff > ../../.maf/patches/vendor-agent-mail/0001-custom-handler.patch
```
