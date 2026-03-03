# Agent Skills - Quick Reference

## 📚 What's Here

This directory contains Agent Skills - reusable domain expertise that Claude loads automatically when relevant.

## 🔄 Skill Sources

Skills in this directory are synced from three sources (in priority order):

1. **Superpowers** (`vendor/superpowers/skills/`) - 14 AI workflow skills from obra/superpowers
2. **Response-Awareness** (`vendor/response-awareness/.claude/skills/`) - 4 Response-Awareness tier skills
3. **MAF Custom Skills** (`.maf/skills/`) - 7 MAF-specific customizations (override both vendors)

Run `maf-hq update` to sync all vendor skills to this directory. Run `maf-hq doctor` to verify health.

---

## 🎯 Response-Awareness Framework Skills

### Structure
```
response-awareness-light/      → LIGHT tier (single-file, fast)
response-awareness-medium/     → MEDIUM tier (multi-file, moderate)
response-awareness-heavy/      → HEAVY tier (complex single-domain)
response-awareness-full/       → FULL tier (multi-domain architecture)
  └── phases/                  → Phase-specific resources
```

### How to Use

**Automatic activation**:
Skills activate when Claude detects matching task complexity.

**Manual invocation**:
```
User: /response-awareness "your task description"
```

Router scores complexity → Invokes appropriate Skill → Workflow loads

---

## 📖 Skills Index

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| **Response Awareness Light** | Single-file changes | Score 0-1, bug fixes, cosmetic |
| **Response Awareness Medium** | Multi-file features | Score 2-4, moderate complexity |
| **Response Awareness Heavy** | Complex single-domain | Score 5-7, architectural decisions |
| **Response Awareness Full** | Multi-domain architecture | Score 8+, system-wide changes |

---

## 🔧 Adding New Skills

To create a new Skill:

1. **Create directory**: `.claude/skills/your-skill-name/`
2. **Create SKILL.md** with YAML frontmatter:

```yaml
---
name: Your Skill Name
description: Brief description (max 1024 chars) of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
[Step-by-step guidance for Claude]

## Examples
[Concrete usage examples]
```

3. **Optional**: Add resource files (scripts, templates, references)

4. **Test**: Skill should activate when description matches task

---

## 📋 Skill Metadata Limits

- `name`: 64 characters maximum
- `description`: 1024 characters maximum

---

## 🎓 Skills vs Other Features

| Feature | Purpose | When Loaded |
|---------|---------|-------------|
| **Skills** | Domain expertise | Auto-detected or invoked |
| **Slash Commands** | User workflows | Manual invocation |
| **Hooks** | Behavioral enforcement | Event-triggered |
| **Subagents** | Task execution | Explicit via Task() |
| **CLAUDE.md** | Project context | Always loaded |

**Skills are for**: Reusable procedural knowledge that follows you across conversations.

---

## 📚 Documentation

- **Migration Summary**: `SKILLS_MIGRATION_SUMMARY.md`
- **Individual Skills**: Each Skill's `SKILL.md` file
- **Official Docs**: https://docs.claude.com/en/docs/agents-and-tools/agent-skills

---

**Created**: 2025-10-16
**Skills Count**: 4 (Response-Awareness tiers)
**Status**: ✅ Active
