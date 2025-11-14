# Skill Activation Troubleshooting Guide

**Created:** 2025-11-04
**Purpose:** Diagnose and fix skill activation issues

---

## Issue Discovered

**Problem:** `testing-anti-patterns` skill installed but not activating

**Root Cause:** Skill not registered in `.claude/config/response-awareness-config.json`

**Status:** ✅ FIXED (added to custom_skills array)

---

## How Skill Activation Works

### Discovery Process

1. **On Claude Code Startup:**
   - Scans `.claude/skills/` directory
   - Looks for `SKILL.md` files
   - Loads skill metadata and trigger patterns

2. **Trigger Matching:**
   - User message contains keywords
   - Matches `description` field in SKILL.md frontmatter
   - Example: "test", "mock", "adding mocks"

3. **Activation:**
   - Skill announces: "I'm using the [skill-name] skill..."
   - Follows skill instructions
   - Returns to normal mode when done

---

## Configuration Methods

### Method 1: Explicit Registration (Current)

**File:** `.claude/config/response-awareness-config.json`

```json
{
  "overrides": {
    "custom_skills": [
      "brainstorming",
      "testing-anti-patterns"
    ]
  }
}
```

**Pros:**
- Explicit control over which skills are active
- Clear documentation of enabled skills

**Cons:**
- Must manually add each new skill
- Easy to forget to register after installation

### Method 2: Auto-Discovery

**File:** `.claude/config/response-awareness-config.json`

```json
{
  "overrides": {
    "custom_skills": []  // Empty array = auto-discover all
  }
}
```

**Pros:**
- New skills automatically available
- No manual registration needed

**Cons:**
- All skills in `.claude/skills/` are active
- May activate unintended skills

---

## Current Configuration Status

**Registered Skills:**
```json
"custom_skills": [
  "brainstorming",           // ✓ Installed
  "systematic-debugging",    // ✗ NOT installed (config orphan)
  "worktree-workflow",       // ✗ NOT installed (config orphan)
  "testing-anti-patterns"    // ✓ Installed (just added)
]
```

**Actually Installed Skills:**
- `_test-skill-installation` (test skill, can delete)
- `brainstorming` ✓
- `executing-plans`
- `fractal-alignment`
- `response-awareness-light` ✓
- `response-awareness-medium` ✓
- `response-awareness-heavy` ✓
- `response-awareness-full` ✓
- `testing-anti-patterns` ✓

**Orphan Skills in Config (not installed):**
- `systematic-debugging` - Referenced but missing
- `worktree-workflow` - Referenced but missing

---

## Action Required

### Option A: Remove Orphans from Config

```json
{
  "custom_skills": [
    "brainstorming",
    "testing-anti-patterns"
  ]
}
```

### Option B: Install Missing Skills

```bash
# If these skills exist and should be installed
./scripts/install-skill.sh obra/superpowers skills/systematic-debugging systematic-debugging
# (Note: Check if this skill actually exists in superpowers repo)
```

### Option C: Enable Auto-Discovery

```json
{
  "custom_skills": []  // Auto-discover all installed skills
}
```

**Recommended:** Option C (auto-discovery) for simplicity

---

## Testing Skill Activation

### Test 1: Explicit Invocation

```
Use the testing-anti-patterns skill to review this code:
[paste test code]
```

**Expected:** "I'm using the testing-anti-patterns skill..."

### Test 2: Trigger Phrase

```
I'm adding mocks to my test file. Can you review it?
```

**Expected:** Skill auto-activates based on "mocks" keyword

### Test 3: File Reference

```
Review @test-anti-patterns.js for testing anti-patterns
```

**Expected:** Skill activates based on "testing" and "anti-patterns" keywords

---

## When Skills DON'T Activate

**Checklist:**

1. **Is skill installed?**
   ```bash
   ls .claude/skills/skill-name/SKILL.md
   ```

2. **Is skill registered?**
   ```bash
   grep "skill-name" .claude/config/response-awareness-config.json
   ```
   Or using auto-discovery?

3. **Did you restart Claude Code?**
   - Skills discovered on startup
   - Install mid-session requires restart

4. **Are trigger keywords present?**
   - Check SKILL.md `description` field
   - Use explicit invocation if unsure

5. **Is JSON config valid?**
   ```bash
   python -m json.tool < .claude/config/response-awareness-config.json
   ```

---

## Skill Activation Indicators

**How to know a skill activated:**

✅ **Explicit announcement:**
```
I'm using the [skill-name] skill for this task...
```

✅ **Follows skill instructions:**
- Asks specific gate questions from skill
- Uses skill-specific terminology
- Follows skill workflow steps

❌ **No activation:**
- General response without skill framework
- No mention of skill name
- Doesn't follow skill's specific approach

---

## Your Test Case Result

**What you did:**
```
test @test-anti-patterns.js
```

**What happened:**
- Good analysis of anti-pattern ✓
- BUT no skill activation indicator ✗
- Skill wasn't registered in config ✗

**Why:**
1. Skill just installed (mid-session)
2. Not in custom_skills array
3. No explicit invocation

**After fix (added to config):**
- Restart Claude Code
- Or use explicit invocation:
  ```
  Use the testing-anti-patterns skill to review @test-anti-patterns.js
  ```

---

## Next Steps

1. **Choose configuration method:**
   - Keep explicit registration (current), OR
   - Switch to auto-discovery (simpler)

2. **Clean up orphans:**
   - Remove `systematic-debugging` and `worktree-workflow` from config
   - OR install them if needed

3. **Restart Claude Code** to load updated config

4. **Test skill activation:**
   ```
   I'm adding mocks to my tests, can you review?
   ```

5. **Install remaining skills:**
   ```bash
   ./scripts/install-skill.sh wshobson/agents plugins/javascript-typescript/skills/javascript-testing-patterns javascript-testing-patterns
   ```

---

## Reference: Skill Registration Workflow

**When installing new skills:**

```bash
# 1. Install skill
./scripts/install-skill.sh user/repo path/to/skill skill-name

# 2. Register skill (if using explicit registration)
# Edit .claude/config/response-awareness-config.json
# Add "skill-name" to custom_skills array

# 3. Restart Claude Code
# Or continue current session and use explicit invocation

# 4. Test activation
# Use trigger keywords or explicit invocation
```

**Or use auto-discovery:**

```json
{
  "custom_skills": []  // Once set, all installs auto-activate
}
```

---

**Last Updated:** 2025-11-04
**Status:** testing-anti-patterns now registered ✓
**Next:** Restart Claude Code or use explicit invocation
