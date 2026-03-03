# Founder's Guide Supplement: NextNest's Contributions

**Question:** "We are not adding anything to HQ from NextNest?"

**Answer:** YES, we are! NextNest contributes **3 smart patterns** (~100 lines) in addition to Roundtable's 3 complete tools (1,588 lines).

---

## Quick Summary Table

| From Roundtable | From NextNest |
|-----------------|---------------|
| **Complete files** (1,588 lines) | **Smart patterns** (~100 lines) |
| error-handling.sh (613 lines) | Subtree auto-detection (~20 lines) |
| tmux-utils.sh (893 lines) | Role-based mapping (~50 lines) |
| clear-stuck-prompts.sh (82 lines) | Agent startup wrapper (~30 lines) |
| **Easy:** Copy files, done | **Requires:** Integration into existing files |

---

## The Difference Explained (Plain English)

### Roundtable's Contributions: "Complete Tools"
Think of these like **ready-made appliances**:
- You copy the file to HQ
- It works immediately
- No integration needed

**Example:** `error-handling.sh` is a complete tool - you copy it, scripts can use it right away.

### NextNest's Contributions: "Smart Patterns"
Think of these like **building techniques**:
- You integrate them into existing files
- They make the system smarter
- They require careful placement

**Example:** "Subtree auto-detection" is a smart pattern - you integrate it into path-resolution logic, then scripts automatically work in both subtree and direct installations.

---

## NextNest's 3 Contributions (Detailed)

### Contribution 1: Subtree Auto-Detection Pattern (~20 lines)

**WHAT:** A smart way to detect if MAF is installed as a "subtree" or "direct", then adjust paths automatically.

**WHY IT'S VALUABLE:**
- **Before:** Every project had to manually configure paths
- **After:** Projects work automatically regardless of installation type

**BUSINESS PROBLEM SOLVED:**
- Roundtable installs MAF one way, NextNest another
- Without auto-detection, HQ tools need manual configuration for each project
- With auto-detection, HQ tools work everywhere automatically

**WHERE IT GOES:**
```bash
# New file to create at HQ:
scripts/maf/lib/project-root-utils.sh
```

**IMPLEMENTATION:**
```bash
# This goes in the new file
get_project_root() {
    local DETECTED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    if [[ "$DETECTED_SCRIPT_DIR" == *"/maf/scripts/maf" ]]; then
        # Subtree layout: go up 3 levels
        echo "$(cd "$DETECTED_SCRIPT_DIR/../.." && pwd)"
    else
        # Direct layout: go up 2 levels
        echo "$(cd "$DETECTED_SCRIPT_DIR/.." && pwd)"
    fi
}

export PROJECT_ROOT="$(get_project_root)"
```

**HOW TO VERIFY IT WORKS:**
```bash
# Test it in different layouts
cd /root/projects/maf-github  # Direct layout
source scripts/maf/lib/project-root-utils.sh
echo "Project root: $PROJECT_ROOT"
# Should output: /root/projects/maf-github

cd /root/projects/nextnest  # Subtree layout
source maf/scripts/maf/lib/project-root-utils.sh
echo "Project root: $PROJECT_ROOT"
# Should output: /root/projects/nextnest
```

---

### Contribution 2: Role-Based Agent Mapping (~50 lines)

**WHAT:** A way to refer to agents by **role** (supervisor, reviewer) instead of **name** (GreenMountain, BlackDog).

**WHY IT'S VALUABLE:**
- **Before:** Scripts had hardcoded agent names like "GreenMountain" or "RateRidge"
- **After:** Scripts refer to roles like "supervisor" or "reviewer", each project maps roles to their own agent names

**BUSINESS PROBLEM SOLVED:**
- Roundtable uses nature-themed names (GreenMountain, BlackDog)
- NextNest uses mortgage-themed names (RateRidge, AuditBay)
- Without role-based mapping, HQ scripts can't work for both
- With role-based mapping, HQ scripts work for any project

**WHERE IT GOES:**
```bash
# New file to create at HQ:
scripts/maf/lib/role-utils.sh

# Schema addition to HQ's .maf/config/agent-topology.json:
# Add "role_mappings" section to schema
```

**IMPLEMENTATION:**

**File 1: `scripts/maf/lib/role-utils.sh`**
```bash
# Role-based agent resolution
get_agent_by_role() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    if [ ! -f "$config" ]; then
        echo "ERROR: Config not found: $config" >&2
        return 1
    fi

    local agent_id=$(jq -r ".role_mappings[\"$role\"]" "$config")

    if [ "$agent_id" = "null" ]; then
        echo "WARNING: Role '$role' not found" >&2
        return 1
    fi

    echo "$agent_id"
}

has_role_mapping() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    if [ ! -f "$config" ]; then
        return 1
    fi

    jq -e ".role_mappings[\"$role\"]" "$config" >/dev/null 2>&1
}
```

**File 2: Schema addition to `.maf/config/agent-topology.json`**
```json
{
  "role_mappings": {
    "supervisor": "RateRidge",
    "reviewer": "AuditBay",
    "implementor-1": "PrimePortal",
    "implementor-2": "LedgerLeap"
  }
}
```

**HOW TO VERIFY IT WORKS:**
```bash
# Test role resolution
source scripts/maf/lib/role-utils.sh

# Get supervisor agent
SUPERVISOR=$(get_agent_by_role "supervisor")
echo "Supervisor agent: $SUPERVISOR"
# Should output: RateRidge (for NextNest)

# Check if role exists
if has_role_mapping "reviewer"; then
    echo "✅ Reviewer role mapped"
else
    echo "❌ Reviewer role not found"
fi
```

---

### Contribution 3: Agent Startup Wrapper Pattern (~30 lines)

**WHAT:** A template for how agents "know who they are" when they start up.

**WHY IT'S VALUABLE:**
- **Before:** Each project had to figure out how to inject agent identity
- **After:** Standard pattern that works across all projects

**BUSINESS PROBLEM SOLVED:**
- Agents need to know their name, role, and capabilities when they start
- Without a standard pattern, each project does this differently
- With a template, new projects can get started quickly

**WHERE IT GOES:**
```bash
# Template file to create at HQ:
scripts/maf/agent-startup.sh.example

# Projects copy this template and customize it
```

**IMPLEMENTATION:**

**Template file: `scripts/maf/agent-startup.sh.example`**
```bash
#!/bin/bash
# Agent Startup Wrapper Template
# Copy this file and customize for your project
#
# This script injects agent identity into the Claude session
#
# Usage:
# 1. Copy to your project: cp scripts/maf/agent-startup.sh.example your-agent-startup.sh
# 2. Customize AGENT_NAME, AGENT_ROLE, AGENT_CAPABILITIES
# 3. Source this script before launching agent

# Agent identity (CUSTOMIZE THESE)
export AGENT_NAME="${AGENT_NAME:-YourAgentName}"
export AGENT_ROLE="${AGENT_ROLE:-implementor}"
export AGENT_CAPABILITIES="${AGENT_CAPABILITIES:-coding,testing,documentation}"

# Agent persona prompt (CUSTOMIZE THIS)
export AGENT_PERSONA="${AGENT_PERSONA:-You are ${AGENT_NAME}, a ${AGENT_ROLE} agent with capabilities in ${AGENT_CAPABILITIES}.}"

# Inject into Claude session
echo "Starting agent: $AGENT_NAME"
echo "Role: $AGENT_ROLE"
echo "Capabilities: $AGENT_CAPABILITIES"
echo ""

# Source any additional configuration
if [ -f "scripts/maf/lib/role-utils.sh" ]; then
    source scripts/maf/lib/role-utils.sh
fi

# Agent is now ready to start
# Your agent launch code goes here
```

**HOW TO USE IT:**
```bash
# For NextNest:
cp scripts/maf/agent-startup.sh.example scripts/maf/agent-startup.sh
# Edit: AGENT_NAME="RateRidge", AGENT_ROLE="supervisor", etc.

# For Roundtable:
cp scripts/maf/agent-startup.sh.example scripts/maf/agent-startup.sh
# Edit: AGENT_NAME="GreenMountain", AGENT_ROLE="supervisor", etc.
```

**HOW TO VERIFY IT WORKS:**
```bash
# Test the template
source scripts/maf/agent-startup.sh.example
echo "Agent: $AGENT_NAME"
echo "Role: $AGENT_ROLE"
echo "Persona: $AGENT_PERSONA"
# Should output your customized values
```

---

## Updated Wave 1 Implementation Sequence

### Day 1-2: Add All 6 Items to HQ

**From Roundtable (3 files - 1,588 lines):**
```bash
# Already in the main guide:
cp /root/projects/roundtable/scripts/maf/lib/error-handling.sh scripts/maf/lib/
cp /root/projects/roundtable/scripts/maf/lib/tmux-utils.sh scripts/maf/lib/
cp /root/projects/roundtable/scripts/maf/clear-stuck-prompts.sh scripts/maf/
```

**From NextNest (3 patterns - ~100 lines):**
```bash
# NEW: Add subtree auto-detection
cat > scripts/maf/lib/project-root-utils.sh <<'EOF'
# [Content from Contribution 1 above]
EOF

# NEW: Add role-based mapping
cat > scripts/maf/lib/role-utils.sh <<'EOF'
# [Content from Contribution 2 above]
EOF

# NEW: Add agent startup template
cat > scripts/maf/agent-startup.sh.example <<'EOF'
# [Content from Contribution 3 above]
EOF
```

**Total Wave 1 Additions:**
- **From Roundtable:** 3 files, 1,588 lines
- **From NextNest:** 3 files, ~100 lines
- **Grand Total:** 6 files, ~1,688 lines

---

## Verification: NextNest Contributions

After adding NextNest's contributions, verify they work:

```bash
cd /root/projects/maf-github

echo "=== Verifying NextNest Contributions ==="

echo ""
echo "1. Subtree auto-detection:"
if [ -f "scripts/maf/lib/project-root-utils.sh" ]; then
    echo "✅ File exists"
    source scripts/maf/lib/project-root-utils.sh
    echo "   Project root: $PROJECT_ROOT"
    if [ -n "$PROJECT_ROOT" ]; then
        echo "   ✅ Auto-detection works"
    else
        echo "   ❌ Auto-detection failed"
    fi
else
    echo "❌ File missing"
fi

echo ""
echo "2. Role-based mapping:"
if [ -f "scripts/maf/lib/role-utils.sh" ]; then
    echo "✅ File exists"
    source scripts/maf/lib/role-utils.sh
    if type get_agent_by_role &>/dev/null; then
        echo "   ✅ Functions available"
    else
        echo "   ❌ Functions not available"
    fi
else
    echo "❌ File missing"
fi

echo ""
echo "3. Agent startup template:"
if [ -f "scripts/maf/agent-startup.sh.example" ]; then
    echo "✅ Template exists"
    echo "   Line count: $(wc -l < scripts/maf/agent-startup.sh.example)"
    echo "   ✅ Ready for projects to customize"
else
    echo "❌ Template missing"
fi

echo ""
echo "=== All NextNest contributions verified ==="
```

---

## Summary: Both Repos Contribute to HQ

| Contribution | Roundtable | NextNest |
|--------------|-----------|----------|
| **Type** | Complete tools | Smart patterns |
| **Files** | 3 files | 3 files |
| **Lines** | 1,588 | ~100 |
| **Complexity** | Low (copy, done) | Medium (integrate) |
| **Value** | Immediate utility | Architectural improvement |
| **Wave 1 Days** | 1-2 | 1-6 (staggered) |

**BOTH repos contribute valuable improvements to HQ!**

---

**Generated:** 2026-01-08
**Purpose:** Clarify NextNest's contributions to HQ
**Status:** Supplements the main Founder's Implementation Guide
