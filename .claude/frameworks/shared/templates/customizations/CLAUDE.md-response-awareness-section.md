# Response-Awareness Section for CLAUDE.md

This is a template section to add to your project's CLAUDE.md file.

**IMPORTANT:** Don't replace your entire CLAUDE.md - just add/merge this section!

---

## Section to Add to Your CLAUDE.md

Copy the section below and add it to your project's CLAUDE.md file (usually after project-specific rules):

```markdown
---

## Response-Awareness & Skills Architecture

**CRITICAL: Understanding the layered AI assistance system**

### Three-Layer System

**Layer 1: Shared Frameworks** (`.claude/frameworks/shared/`)
- Response-awareness tiers from GitHub (managed via git subtree)
- Superpowers skills (brainstorming, systematic-debugging)
- Universal, synced across all projects
- **DO NOT modify** - update via git subtree pull

**Layer 2: Configuration** (`.claude/config/`)
- `response-awareness-config.json` - Feature flags, paths, tier settings
- `logging-config.json` - Verbose logging, learning mode
- `agents-config.json` - Custom agents, model preferences
- **Modify freely** - these are your project settings

**Layer 3: Working Files** (`.claude/commands/`, `.claude/agents/`)
- Your customized commands that load shared frameworks
- Project-specific agents
- **Modify carefully** - preserve integration with shared frameworks

### Key Skills Available

**From Response-Awareness Framework:**
- `/response-awareness` - Universal router (complexity assessment → tier routing)
- `response-awareness-light` - Single file, fast execution
- `response-awareness-medium` - Multi-file, optional planning
- `response-awareness-heavy` - Complex features, full planning
- `response-awareness-full` - Multi-domain architecture

**From Superpowers:**
- `brainstorming` - Refine vague ideas into designs before planning
- `systematic-debugging` - Root cause investigation (NEVER skip this for bugs)

**Project Custom:**
- `worktree-helper` - Manage parallel development streams (if applicable)

### When to Use Each Skill

**For Bugs/Errors:**
```bash
# ALWAYS use systematic-debugging for ANY bug
# Router will detect debug keywords and offer this automatically
/response-awareness "Fix calculation returning NaN"
→ Detects "fix" keyword → Offers systematic-debugging skill → Root cause investigation
```

**For Vague Ideas:**
```bash
# Use brainstorming to clarify before implementation
/response-awareness "I'm thinking about adding a dashboard"
→ Detects "thinking about" → Offers brainstorming skill → Refine requirements → Plan → Implement
```

**For Clear Requirements:**
```bash
# Router assesses complexity and routes to appropriate tier
/response-awareness "Add email validation to signup form"
→ Complexity score: 2 → MEDIUM tier → Optional planning → Implementation
```

**For Parallel Work (if worktree enabled):**
```bash
# Uncommitted changes + new unrelated task = worktree offer
git status  # Shows uncommitted changes
/response-awareness "Add new feature X"
→ Detects uncommitted work → Offers worktree creation → Isolated workspace
```

### Configuration-Driven Behavior

All paths and features come from config files, NOT hardcoded:

```javascript
// Logging location (from logging-config.json)
const logPath = config.paths.verbose_logs;  // e.g., docs/completion_drive_logs

// Feature toggles (from response-awareness-config.json)
if (config.features.worktree_integration) {
  // Offer worktree when appropriate
}

if (config.features.brainstorming_precheck) {
  // Detect vague language and offer brainstorming
}
```

### Syncing with Shared Repository

**When response-awareness framework updates:**

1. Updates are made to shared repository: https://github.com/YOUR_USERNAME/claude-shared
2. Pull updates to your project:
   ```bash
   git subtree pull --prefix .claude/frameworks/shared \
     https://github.com/YOUR_USERNAME/claude-shared.git master --squash
   ```
3. Test: `/response-awareness "test task"`

**See:** Project root `UPDATE_GUIDE.md` for full sync workflow

### Project-Specific Customizations

**Configuration files** (`.claude/config/`):
- Change logging verbosity → Edit `logging-config.json`
- Adjust tier model preferences → Edit `response-awareness-config.json`
- Disable worktrees → Set `features.worktree_integration: false`
- Add custom agent → Update `agents-config.json`

**DO NOT modify shared frameworks** - they're synced from GitHub

### Communication Style for Skills

**For Exploratory/Vague Requests:**
- Proactively offer brainstorming skill
- "I notice some ambiguity. Would you like structured brainstorming or conversational exploration?"

**For Bug Reports:**
- ALWAYS offer systematic-debugging
- "This appears to be a debugging task. Should I use systematic-debugging skill for root cause analysis?"

**For Clear Implementations:**
- Route through response-awareness automatically
- Announce tier: "Complexity assessment: MEDIUM tier (2-5 files, moderate integration)"

### Forbidden Patterns

❌ **Don't bypass skills when they apply:**
- Bug reported → Must offer systematic-debugging (don't jump to fixes)
- Vague idea → Offer brainstorming (don't assume requirements)
- Complex task → Use response-awareness tiers (don't implement ad-hoc)

❌ **Don't modify shared frameworks:**
- `.claude/frameworks/shared/` is managed via git subtree - update via pull

❌ **Don't hardcode paths:**
- Always load from `.claude/config/*.json`

✅ **Do update configs when needs change:**
- Change logging verbosity → Edit `logging-config.json`
- Disable worktrees → Set `features.worktree_integration: false`
- Add custom agent → Update `agents-config.json`

---
```

## Customization Notes

**Replace these placeholders in the template above:**

1. `https://github.com/YOUR_USERNAME/claude-shared` → Your actual GitHub repo URL
2. Adjust skill list if you don't use certain skills (e.g., remove worktree-helper if not using)
3. Add project-specific custom skills to the "Project Custom" section
4. Adjust logging paths if different from `docs/completion_drive_logs`

## What to Keep from Your Existing CLAUDE.md

**DO NOT replace these project-specific sections:**
- Tech stack information
- Project-specific rules
- Component placement guidelines
- Testing requirements
- Code standards
- Git commit rules
- Deployment instructions

**Only ADD the Response-Awareness section** to explain the framework to Claude.

## Where to Add This Section

Recommended placement in CLAUDE.md:

```
# CLAUDE.md

## Working Relationship
...

## Critical Rules
...

## Code Standards
...

## Response-Awareness & Skills Architecture   ← ADD HERE
(paste the section from above)

## Project Quick Reference
...
```

---

**Last Updated:** 2025-10-18
**For Projects Using:** Git subtree approach for shared frameworks
