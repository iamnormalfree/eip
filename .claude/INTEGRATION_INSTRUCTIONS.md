# How to Integrate EIP Customizations

Your response-awareness framework gets updated regularly from the GitHub repo. To keep your EIP customizations working after updates, follow these instructions.

---

## The Solution: Shared Module

All EIP customizations are in:
```
.claude/skills/response-awareness-shared/EIP_CUSTOMIZATIONS.md
```

This file contains:
- Quality gate enforcement
- IP invariant validation
- Compliance rule checking
- Performance budget monitoring
- Phase-based development workflows
- Evidence collection procedures

---

## Integration Steps

### Step 1: Router Integration

**File:** `.claude/commands/response-awareness.md`

**Add at the top** (after the header, before "## Phase 0: Intelligent Routing"):

```markdown
---

## Load EIP Customizations

Read file `.claude/skills/response-awareness-shared/EIP_CUSTOMIZATIONS.md`

**Apply Phase 0 Extensions before standard complexity assessment:**
- Extension 0.1: Phase verification (current EIP phase check)
- Extension 0.2: IP library verification (Educational IP exists)
- Extension 0.3: Compliance rules check (rules available for domain)
- Extension 0.4: Performance budget review (budgets appropriate)

**Load configurations:**
- `.claude/config/response-awareness-config.json`
- `.claude/config/logging-config.json`
- `.claude/config/agents-config.json`

---
```

**Then in Phase 0**, before the standard "Immediate Assessment" section, add:

```markdown
### Phase 0: Pre-Assessment

**FIRST: Run EIP Quality Extensions** (see EIP_CUSTOMIZATIONS.md)

If IP missing → Create or select appropriate Educational IP
If compliance rules missing → Create rules for content domain
If performance budgets inappropriate → Adjust budgets for content type
If phase misaligned → Verify current EIP phase objectives

**THEN: Continue with standard complexity assessment below**

### Step 1: Immediate Assessment (standard)
...
```

### Step 2: Tier Integration

**Files:**
- `.claude/skills/response-awareness-light/SKILL.md`
- `.claude/skills/response-awareness-medium/SKILL.md`
- `.claude/skills/response-awareness-heavy/SKILL.md`
- `.claude/skills/response-awareness-full/phase-X-*.md` (all phase files)

**Add at the top** (after existing shared module loads):

```markdown
## Load Shared Quality Modules

**Always:**
Read file `.claude/skills/response-awareness-shared/EIP_CUSTOMIZATIONS.md`

**If LOGGING_LEVEL != none:**
Read file `.claude/skills/response-awareness-shared/LOGGING_INSTRUCTIONS.md`

**For HEAVY/FULL:**
Read file `.claude/skills/response-awareness-shared/PLAN_PERSISTENCE.md`

---

## Apply EIP Quality Customizations

**Throughout implementation:**
- Quality gates mandatory: IP invariants, compliance, performance, integration
- Verify IP library has required Educational IPs before implementation
- Check compliance rules exist and are tested for content domain
- Monitor performance budgets and adjust if exceeded
- Collect quality evidence for every implementation
- Update phase tracker with progress and evidence

**EIP-Specific Quality Checks:**
- Framework IP requires: Mechanism ≥120 tokens, Counterexample, 2 Transfers
- Process IP requires: Steps ≥5 with Checks
- Comparative IP requires: Criteria matrix, decision guidance
- Compliance rules must: Trigger appropriately, <5% false positive rate
- Performance must stay within: Token/time/cost budgets

---

```

---

## After GitHub Updates

**When you sync from upstream GitHub:**

1. **Router** (`.claude/commands/response-awareness.md`):
   - Pull latest from GitHub
   - Re-add the "Load EIP Customizations" section at top
   - Re-add "FIRST: Run EIP Quality Extensions" in Phase 0

2. **Tier Skills**:
   - Pull latest from GitHub
   - Re-add the "Load Shared Quality Modules" section at top
   - Re-add the "Apply EIP Quality Customizations" section

3. **Shared Module** (`.claude/skills/response-awareness-shared/EIP_CUSTOMIZATIONS.md`):
   - **Never gets updated from GitHub** (it's EIP-specific)
   - This file stays as-is, no changes needed

---

## Why This Works

**Upstream files** (from GitHub):
- Router and tier skills are vanilla framework
- Get updated regularly with improvements

**EIP customizations** (local only):
- Separate file in `response-awareness-shared/`
- Loaded by router and tiers via Read command
- Never conflicts with upstream updates

**Integration points:**
- Just 2-3 lines added to router
- Just 2-3 lines added to each tier skill
- Easy to re-add after updates

---

## Quick Re-Integration Script

After pulling from GitHub, run these edits:

**Router:**
```bash
# Open router
code .claude/commands/response-awareness.md

# Add after header:
# ---
# ## Load EIP Customizations
# Read file `.claude/skills/response-awareness-shared/EIP_CUSTOMIZATIONS.md`
# ...
```

**Each Tier:**
```bash
# Open tier skill
code .claude/skills/response-awareness-light/SKILL.md

# Add after header:
# ## Load Shared Quality Modules
# **Always:**
# Read file `.claude/skills/response-awareness-shared/EIP_CUSTOMIZATIONS.md`
# ...
```

---

## What NOT to Do

❌ **Don't edit upstream files extensively** - hard to maintain after updates
❌ **Don't put EIP code directly in router/tiers** - will be overwritten
❌ **Don't forget to re-add load commands** - customizations won't apply

✅ **Do keep customizations in EIP_CUSTOMIZATIONS.md** - survives updates
✅ **Do re-add simple load commands** - quick and easy
✅ **Do update configs in `.claude/config/`** - separate from framework files

---

## Example: Full Router Integration

```markdown
# /response-awareness - Universal Smart Router

## Purpose
Universal entry point that assesses task complexity and routes...

---

## Load EIP Customizations

Read file `.claude/skills/response-awareness-shared/EIP_CUSTOMIZATIONS.md`

**Apply Phase 0 Extensions before standard complexity assessment:**
- Extension 0.1: Phase verification (current EIP phase)
- Extension 0.2: IP library verification (Educational IP exists)
- Extension 0.3: Compliance rules check (rules available)
- Extension 0.4: Performance budget review (budgets appropriate)

**Load configurations:**
- `.claude/config/response-awareness-config.json`
- `.claude/config/logging-config.json`
- `.claude/config/agents-config.json`

---

## Your Role as Router

You analyze the user's request...

[Rest of upstream content unchanged]

---

## Complexity Assessment Protocol

### Phase 0: Intelligent Routing

**FIRST: Run EIP Quality Extensions** (see EIP_CUSTOMIZATIONS.md)

If IP missing → Create or select appropriate Educational IP
If compliance rules missing → Create rules for content domain
If performance budgets inappropriate → Adjust budgets
If phase misaligned → Verify current EIP phase objectives

**THEN: Continue with standard assessment:**

**Step 1: Immediate Assessment** (no agent needed)
...
```

---

## Testing Integration

After re-integration, test:

```bash
# Test phase verification
cd /root/eip
/response-awareness "implement new Educational IP"
# Should verify current phase and IP requirements

# Test compliance checking
/response-awareness "add MAS compliance rules"
# Should check existing rules and compliance framework

# Test quality gates
/response-awareness "optimize content generation performance"
# Should verify performance budgets and quality metrics

# Test IP invariants
/response-awareness "validate Framework IP structure"
# Should check IP invariants and validation tests
```

---

## Questions?

See:
- EIP Quality Framework: `docs/EIP_FRACTAL_ALIGNMENT.md`
- EIP Implementation Workflow: `docs/EIP_IMPLEMENTATION_WORKFLOW.md`
- `.claude/skills/response-awareness-shared/EIP_CUSTOMIZATIONS.md` - Customization details
- `.claude/config/response-awareness-config.json` - Feature flags

---

**Last Updated:** 2025-11-13
**Maintenance:** Re-add load commands after each GitHub sync