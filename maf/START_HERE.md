# START HERE - Before Writing Any Custom Code

**Read this file before creating any custom MAF scripts.**

---

## 🚨 Critical: Check What MAF Already Provides

The most common mistake is building something MAF already has.

### Quick Check Commands

```bash
# List all MAF scripts
ls maf/scripts/maf/*.sh

# Search for specific functionality
grep -r "coordinate" maf/scripts/maf/
grep -r "workflow" maf/scripts/maf/
grep -r "autonomous" maf/scripts/maf/
```

---

## 📋 Common Needs → MAF Solutions

| You Want | MAF Provides | Don't Build This |
|----------|--------------|------------------|
| **Full autonomous system** | `maf/scripts/maf/orchestrator.sh` | Build custom coordination from scratch |
| **Smart coordination only** | `maf/scripts/maf/coordinate-agents.sh` | Reinventing smart routing |
| Agent communication via mail | `maf/scripts/maf/maf/agent-communication-real.sh` | Your own mail system |
| Rebuild agent session | `maf/scripts/maf/rebuild-maf-cli-agents.sh` | Custom tmux setup |
| Verify bead completion | `maf/scripts/maf/verify-ac.sh` | Custom verification |
| Agent memory | `maf/scripts/maf/maf/agent-memory.sh` | Your own memory system |
| Context management | `maf/scripts/maf/context-manager-v2.sh` | Custom context manager |
| Agent troubleshooting | `/maf` or `/maf diagnose` | Build custom diagnostic tools |
| Extension patterns | `maf/EXTENSION_PATTERNS.md` | Guess or copy from scratch |

---

## ✅ Decision Tree

```
Need functionality?
    ↓
Check maf/scripts/maf/
    ↓
Found it?
    YES → Use it or customize in scripts/maf/
    NO  → Document why → Build custom
```

---

## 📝 Before Building Custom: Answer These Questions

1. **Have I searched `maf/scripts/maf/` for similar functionality?**
   - Run: `ls maf/scripts/maf/*.sh`
   - Run: `grep -r "KEYWORD" maf/scripts/maf/`

2. **Have I read the relevant MAF script completely?**
   - Run: `cat maf/scripts/maf/SCRIPT_NAME.sh`

3. **Can I customize MAF's script instead of building new?**
   - Copy to: `scripts/maf/custom-SCRIPT_NAME.sh`
   - Modify: Add your project-specific features

4. **If building new, have I documented why?**
   - See: `scripts/maf/templates/why-custom.md`

---

## 🎯 Examples of Right vs Wrong

### ❌ Wrong: Building Without Checking
```
"I need autonomous workflow"
↓
Writes 625-line custom script
↓
Discovers coordinate-agents.sh existed
```

### ✅ Right: Check First
```
"I need autonomous workflow"
↓
ls maf/scripts/maf/*.sh
↓
Finds coordinate-agents.sh
↓
Reads it, decides to customize
↓
Copies to scripts/maf/, adds V2 routing
↓
Documents why customization was needed
```

---

## 🔗 Related Files

- **Full catalog:** `maf/README.md` (detailed scripts catalog)
- **Extension patterns:** `maf/EXTENSION_PATTERNS.md` (how to customize MAF correctly)
- **For AI agents:** `maf/LLM_README.md` (explicit LLM guidance)
- **Agent config:** `maf/agents.md` (agent configuration)
- **Script templates:** `maf/scripts/maf/templates/` (customization templates)

---

## 🛠️ Troubleshooting MAF

**Having issues?**

| Problem | Solution |
|---------|----------|
| Stuck agent or getting errors | Run: `/maf diagnose` or `Skill(maf/diagnose)` |
| Don't know what MAF provides | Run: `/maf` - discover scripts, patterns, docs |
| Workflow not working as expected | Check `maf/EXTENSION_PARDS.md` for correct patterns |
| Agent not responding | Check if context-manager-v2.sh is running |

---

## 💡 Remember

**MAF has solved these problems.** Use existing patterns as your starting point.

If you must build custom:
1. Document why MAF's approach doesn't work
2. Keep changes minimal and focused
3. Consider contributing back to MAF HQ
