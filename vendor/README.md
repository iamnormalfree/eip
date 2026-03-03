# Vendor Directory

This directory contains external subtrees that MAF depends on.

## Structure

- `agent-mail/` - MCP Agent Mail subtree (inter-agent communication)
- `superpowers/` - Obra/superpowers subtree (AI workflow skills)
- `response-awareness/` - Typhren42/Response-Awareness subtree (metacognitive tier skills)
- `interface-design/` - Dammyjay93/interface-design subtree (UI/UX design skill)

## Vendor Details

### interface-design
**Source:** https://github.com/Dammyjay93/interface-design

**Purpose:** Professional interface design skill for dashboards, admin panels, SaaS apps, and data interfaces.

**Usage:** Invoke via `/SKILL interface-design` when building UI components.

**Features:**
- Consistent design decisions (spacing, colors, depth, elevation)
- Design memory across sessions
- Tuned for dashboards and SaaS applications
- Complements Anthropic's `frontend-design` skill

**Scope:** Dashboards, admin panels, SaaS apps, tools, settings pages, data interfaces.
**Not for:** Landing pages, marketing sites (use `/frontend-design` instead).

## Adding a New Vendor Subtree

```bash
# From MAF HQ repository root
git subtree add --prefix=vendor/<vendor-name> https://github.com/<org>/<repo> <branch> --squash
```

## Updating Vendor Subtrees

```bash
# Pull latest changes from upstream
git subtree pull --prefix=vendor/<vendor-name> https://github.com/<org>/<repo> <branch> --squash
```

## Vendor Subtree Management

Vendor subtrees are **read-only** for MAF purposes. If you need to modify a vendor's code, use the **patch system**:

### Creating Custom Patches

```bash
# 1. Edit vendor code directly
vim vendor/agent-mail/src/handlers/custom.py

# 2. Create a patch from your changes
bash scripts/maf/vendor-patch-create.sh agent-mail 0001 "Add custom handler"

# 3. Patches are auto-applied after vendor updates
```

### Alternative: Fork Model

If you have extensive customizations:

1. Fork the vendor repository
2. Make changes in your fork
3. Update subtree URL in `.maf/config/vendor-repos.json`:
```json
{
  "agent-mail": {
    "url": "https://github.com/YOUR-USERNAME/mcp_agent_mail",
    "branch": "main"
  }
}
```
4. Update `scripts/franchisee-init.sh` to read from this config

## Why Subtrees Instead of Submodules?

- **Subtrees** are included in the repo, no extra `.gitmodules` file
- **Subtrees** work better with git subtree distribution to franchisees
- **Subtrees** don't require franchisees to run `git submodule update`
