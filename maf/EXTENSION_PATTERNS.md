# MAF Extension Patterns

**How to customize MAF correctly - what to extend, what to call, what to copy**

---

## 🎯 Core Philosophy

**MAF scripts in `maf/scripts/maf/` are designed to be USED, not copied.**

Think of MAF as a library:
- ✅ **Call** MAF functions from your code
- ❌ **Copy-paste** MAF code into your project
- ✅ **Wrap** MAF scripts with your logic
- ❌ **Modify** MAF scripts in-place

---

## 📋 Decision Tree

```
Need to customize MAF behavior?
    ↓
Can you achieve it by setting environment variables?
    YES → Use env vars (SKILL_ROUTING_MODE, MAF_LOG_LEVEL, etc.)
    NO  → Continue
    ↓
Can you achieve it by wrapping/calling the MAF script?
    YES → Create scripts/maf/my-wrapper.sh that calls maf/scripts/maf/script.sh
    NO  → Continue
    ↓
Is this a universal pattern all franchises would need?
    YES → Propose to MAF HQ
    NO  → Keep as local customization
```

---

## ✅ Correct Patterns

### Pattern 1: Wrap and Call

**Create local wrapper that calls MAF script:**

```bash
# scripts/maf/my-workflow.sh (local)

# Set your project-specific environment
export SKILL_ROUTING_MODE=sdd-only
export AGENT_MAIL_PROJECT=/root/projects/my-project

# Call MAF's coordinate-agents with your custom setup
bash maf/scripts/maf/coordinate-agents.sh

# Add your post-coordination logic
bash scripts/maf/my-custom-cleanup.sh
```

### Pattern 2: Environment Variable Configuration

**Configure MAF behavior without modifying scripts:**

```bash
# .maf/context.sh (local)

# Skill routing mode
export SKILL_ROUTING_MODE=sdd-only

# Agent configuration
export MAF_IMPLEMENTOR_CMD="claude --settings $PROJECT_ROOT/.claude"

# Project-specific paths
export AGENT_MAIL_PROJECT="$PROJECT_ROOT"
```

### Pattern 3: Custom Workflow with Selective MAF Calls

**Build your workflow, use MAF for specific operations:**

```bash
# scripts/maf/autonomous-workflow-myproject.sh (local)

# Your custom bead routing logic
route_beads_to_agents() {
    # Your project-specific filtering
    local filtered_beads=$(bd ready --json | jq -r 'select(.labels[] == "my-team")')

    # Use MAF's prompt-agent to send commands
    for bead in $filtered_beads; do
        bash maf/scripts/maf/prompt-agent.sh 2 "Start working on $bead"
    done
}

# Your custom coordination loop
while true; do
    route_beads_to_agents
    sleep 300
done
```

---

## ❌ Anti-Patterns to Avoid

### Anti-Pattern 1: Copy-Paste Modification

**DON'T copy MAF scripts to modify them:**

```bash
# ❌ WRONG
cp maf/scripts/maf/coordinate-agents.sh scripts/maf/coordinate-agents.sh
# Then edit the copy to add your changes
```

**Why wrong:**
- You won't get MAF updates when pulling subtree
- Diverges from MAF HQ patterns
- Hard to maintain when MAF changes

**Instead:** Wrap the script or use env vars

### Anti-Pattern 2: In-Place MAF Modification

**DON'T edit files in `maf/` subtree:**

```bash
# ❌ WRONG
vim maf/scripts/maf/coordinate-agents.sh
# Make your changes directly in MAF files
```

**Why wrong:**
- Changes lost on next subtree pull
- Can't push back to MAF HQ easily
- Breaks subtree model

**Instead:** Keep customizations in `scripts/maf/`

### Anti-Pattern 3: Reinventing the Wheel

**DON'T build from scratch when MAF has it:**

```bash
# ❌ WRONG
# Writing your own agent session rebuild script
# When MAF already has rebuild-maf-cli-agents.sh
```

**Instead:** Check `maf/START_HERE.md` and `maf/scripts/maf/README.md` first

---

## 🗂️ What Goes Where

### MAF HQ (`maf/`)

Add to MAF HQ when:
- ✅ Universal pattern all franchises need
- ✅ Stable, well-tested functionality
- ✅ Core MAF feature
- ✅ You're willing to maintain it for all franchises

**Examples:**
- `coordinate-agents.sh` - Base coordination workflow
- `rebuild-maf-cli-agents.sh` - Session management
- `agent-memory.sh` - Memory persistence
- `prompt-agent.sh` - Agent communication

### Local (`scripts/maf/`)

Keep local when:
- ✅ Project-specific routing logic
- ✅ Custom skill routing (SKILL_ROUTING_MODE)
- ✅ Domain-specific workflows
- ✅ Experimentation before proposing to MAF HQ

**Examples:**
- `autonomous-workflow-nextnest.sh` - NextNest's custom workflow
- `context-manager-nextnest.sh` - NextNest's context wrapper
- Your custom workflow scripts

---

## 🔍 Examples from Real Projects

### NextNest (Correct Pattern)

```
scripts/maf/autonomous-workflow-nextnest.sh (625 lines)
├── Custom bead routing logic (local)
├── Skill routing (SKILL_ROUTING_MODE)
├── Agent Mail integration (local)
└── Calls MAF scripts:
    ├── maf/scripts/maf/prompt-agent.sh
    ├── maf/scripts/maf/clear-stuck-prompts.sh
    └── maf/scripts/maf/rebuild-maf-cli-agents.sh (referenced)
```

**Result:** NextNest can pull MAF updates without conflicts

### Hypothetical Wrong Pattern

```
scripts/maf/coordinate-agents-myproject.sh (copy-paste)
└── Modified version of MAF's coordinate-agents.sh
    ├── Added skill routing
    ├── Modified prompts
    └── Changed coordination logic
```

**Problems:**
- Won't get MAF improvements
- Diverges from MAF patterns
- Maintenance burden

---

## 📚 Related Documents

- **`maf/START_HERE.md`** - What MAF provides, don't rebuild
- **`maf/LLM_README.md`** - AI agent instructions for using MAF
- **`maf/agents.md`** - Agent configuration guide
- **`maf/skills/maf-operations.md`** - Discovery and troubleshooting

---

## 🤝 Contributing to MAF HQ

If you build something universal:

1. **Test it locally** in `scripts/maf/`
2. **Document it** with clear examples
3. **Propose to MAF HQ** via PR with:
   - Why this belongs in MAF HQ (universal need)
   - How other franchises would benefit
   - Documentation updates needed

**MAF HQ criteria:**
- Solves a problem all franchises have
- Stable and well-tested
- Follows MAF patterns
- You're willing to maintain it

---

## 🎓 Key Takeaways

1. **MAF scripts are libraries, not templates** - Call them, don't copy them
2. **Environment variables first** - Configure before customizing
3. **Wrap before you build** - Wrap MAF scripts before building from scratch
4. **Local for experiments** - Test locally, propose to MAF HQ if universal
5. **Check MAF first** - Use `maf/START_HERE.md` before building anything

**When in doubt:**
- Run `/maf` to discover what MAF provides
- Check this document for the right pattern
- Keep it local unless it's universally useful
