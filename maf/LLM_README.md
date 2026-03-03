# MAF Usage Guide for AI Agents

**If you are an AI agent (Claude, GPT, etc.) reading this file, follow these steps:**

---

## 🤖 Before You Write Any Code

### Step 1: Check What MAF Provides

**Always** search for existing MAF scripts before building anything:

```bash
# List all MAF scripts
ls maf/scripts/maf/*.sh

# Search for specific functionality
grep -r "coordinate" maf/scripts/maf/
grep -r "workflow" maf/scripts/maf/
grep -r "autonomous" maf/scripts/maf/
grep -r "YOUR_KEYWORD_HERE" maf/scripts/maf/
```

### Step 2: Read the Relevant MAF Script

```bash
# Read the complete script
cat maf/scripts/maf/coordinate-agents.sh
cat maf/scripts/maf/rebuild-maf-cli-agents.sh
cat maf/scripts/maf/agent-communication-real.sh
```

**Read every line.** Don't skim. Understand the pattern fully before adapting.

### Step 3: Use or Customize

**Option A: Use MAF's script directly**
```bash
bash maf/scripts/maf/coordinate-agents.sh
```

**Option B: Copy and customize**
```bash
# Copy to your custom scripts directory
cp maf/scripts/maf/coordinate-agents.sh scripts/maf/coordinate-agents-custom.sh

# Edit for your project needs
vim scripts/maf/coordinate-agents-custom.sh
```

**Option C: Build from scratch (only if MAF has no equivalent)**
- Document why existing approaches don't work
- Use MAF patterns as reference
- Keep changes minimal

---

## 📋 Common Agent Tasks → MAF Commands

| Task You Need | MAF Command | Don't Build This |
|---------------|-------------|------------------|
| Coordinate autonomous agents | `bash maf/scripts/maf/coordinate-agents.sh` | Custom workflow |
| Rebuild agent session | `bash maf/scripts/maf/rebuild-maf-cli-agents.sh --force` | Custom tmux setup |
| Check Agent Mail | `bash maf/scripts/maf/agent-mail-fetch.sh` | Custom mail system |
| Verify bead completion | `bash maf/scripts/maf/verify-ac.sh <bead-id>` | Custom verification |
| Start agents | `bash maf/scripts/maf/spawn-agents.sh` | Custom startup |

---

## ⚠️ Common AI Agent Mistakes

### Mistake 1: Building Without Exploring

**What happens:**
```
Agent: "I need autonomous workflow"
Agent: [Writes 625 lines of custom code]
Human: "MAF already had coordinate-agents.sh"
```

**Correct approach:**
```
Agent: "I need autonomous workflow"
Agent: ls maf/scripts/maf/*.sh
Agent: [Finds coordinate-agents.sh]
Agent: cat maf/scripts/maf/coordinate-agents.sh
Agent: [Uses or customizes existing script]
```

### Mistake 2: Hardcoding Project Paths

**Wrong:**
```bash
PROJECT_ROOT="/root/projects/roundtable"
```

**Right (subtree auto-detection):**
```bash
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi
```

**Source:** `maf/scripts/maf/rebuild-maf-cli-agents.sh` (lines 19-27)

### Mistake 3: Skipping Documentation

**Wrong:** Building custom without explaining why

**Right:** Adding header to custom scripts
```markdown
<!--
Creating custom workflow because:
□ MAF script: maf/scripts/maf/coordinate-agents.sh
□ Insufficient because: [specific reason]
□ Required feature: [specific feature]
□ Reviewed with: [name] on [date]
-->
```

---

## 🔍 Pattern Recognition

MAF uses consistent patterns. Learn them once, apply everywhere.

### Pattern 1: PROJECT_ROOT Auto-Detection
```bash
# Detect if running from subtree or direct installation
DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
fi
```

### Pattern 2: Agent Mail Integration
```bash
# Send message via Agent Mail
curl -s -X POST "$AGENT_MAIL_URL/mcp/" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{...}}'
```

### Pattern 3: tmux Pane Communication
```bash
# Send command to agent pane
tmux send-keys -t "$SESSION_NAME:agents.$PANE" "command" Enter
```

### Pattern 4: Bead Workflow
```bash
# Get ready beads
bd ready --json | jq -r '.[].id'

# Start bead
bd start "$bead_id"

# Close bead with receipt
bd close "$bead_id" --receipt "receipt.md"
```

---

## 📚 Quick Reference Files

| File | Purpose |
|------|---------|
| `maf/README.md` | Complete MAF scripts catalog |
| `maf/START_HERE.md` | Quick decision guide |
| `maf/agents.md` | Agent configuration guide |
| `maf/EXTENSION_PATTERNS.md` | How to customize MAF correctly |
| `maf/scripts/maf/README.md` | Detailed script catalog |

---

## 🛠️ Troubleshooting for AI Agents

**Having issues with MAF?**

| Problem | Solution |
|---------|----------|
| Agent stuck or getting errors | Run: `/maf diagnose` or `Skill(maf/diagnose)` |
| Don't know what MAF provides | Run: `/maf` - discover what's available |
| Workflow not working as expected | Check `maf/EXTENSION_PATTERNS.md` for correct patterns |
| Can't find the right script | Check `maf/README.md` or `maf/scripts/maf/README.md` |

**MAF Skills for AI Agents:**
- `maf/skills/maf-diagnose` - Self-diagnostic troubleshooting
- `maf/skills/maf-operations` - Discovery and troubleshooting guidance

---

## ✅ Pre-Execution Checklist

Before executing any command or writing any code:

- [ ] Searched `maf/scripts/maf/` for existing solution?
- [ ] Read the relevant MAF script completely?
- [ ] Checked if customization is sufficient?
- [ ] Documented why custom approach is needed (if building new)?
- [ ] Used PROJECT_ROOT auto-detection pattern?
- [ ] Tested in safe environment first?

---

## 🎯 Example: Correct AI Agent Workflow

```
Human: "Set up autonomous agents for my project"

AI Agent:
1. ls maf/scripts/maf/*.sh
   → Finds coordinate-agents.sh

2. cat maf/scripts/maf/coordinate-agents.sh
   → Reads complete script

3. Evaluate: Can I use this as-is?
   → YES: Run it directly
   → NO: Copy to scripts/maf/ and customize

4. If customizing: Add "Why Custom?" header
   → Document why MAF's script was insufficient

5. Execute: bash maf/scripts/maf/coordinate-agents.sh
```

---

## 💡 Key Principle

**MAF has solved these problems.**

Your job as an AI agent is to:
1. Find what MAF provides
2. Understand it completely
3. Use or customize appropriately
4. Only build from scratch when truly necessary

**Exploration before implementation. Always.**
