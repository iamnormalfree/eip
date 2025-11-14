# Settings Templates

These are **optional** templates for `.claude/settings.json` and `.claude/settings.local.json`.

## Purpose

- `settings.example.json` - Hooks configuration (orchestrator firewall, question suppression, assumption detection)
- `settings.local.example.json` - Permissions and MCP servers

## Usage

**These are project-specific and should NOT be copied automatically.**

Each project may have:
- Different hooks
- Different permissions
- Different MCP servers

### To Use as Starting Point

```bash
# Only if starting a new project from scratch
cp .claude/frameworks/shared/templates/settings/settings.example.json .claude/settings.json
cp .claude/frameworks/shared/templates/settings/settings.local.example.json .claude/settings.local.json

# Then customize for your project
```

### For Existing Projects

**Don't copy these!** Keep your existing settings.

These templates are here for reference only - to see what hooks/permissions NextNest uses.

## What's NOT Shared

Settings files contain:
- **Hooks** - Project-specific (e.g., NextNest has orchestrator firewall)
- **Permissions** - Project-specific (e.g., which tools to allow)
- **MCP Servers** - Project-specific (e.g., NextNest uses Playwright)

These vary between projects, so they stay local, not in subtree.

## What IS Shared

The frameworks loaded by hooks/commands:
- Response-awareness tiers
- Superpowers skills
- Config files (response-awareness-config.json, etc.)

These are in the subtree and synced across projects.
