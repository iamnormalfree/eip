# Skills Installation & Testing Guide

**Last Updated:** 2025-11-04
**Purpose:** Step-by-step workflow for installing and validating Claude Code skills

---

## Understanding Claude Skills Architecture

### Skill Discovery Locations

Claude Code automatically discovers skills from these directories:

1. **Global skills** (all projects):
   ```
   ~/.claude/skills/
   ```

2. **Project skills** (this project only):
   ```
   .claude/skills/
   ```

### Skill Structure

Each skill must have this structure:
```
.claude/skills/
└── skill-name/
    ├── SKILL.md          # Required: Main skill instructions
    ├── marketplace.json  # Optional: Marketplace metadata
    └── templates/        # Optional: Templates or scripts
```

---

## Installation Methods

### Method 1: Manual Clone (Recommended for Testing)

```bash
# Navigate to skills directory
cd .claude/skills/

# Clone skill from GitHub
git clone https://github.com/username/repo-name.git temp-clone

# Extract specific skill
cp -r temp-clone/path/to/skill-folder ./skill-name

# Cleanup
rm -rf temp-clone
```

### Method 2: Direct Download

```bash
# Download ZIP from GitHub
# Extract to .claude/skills/skill-name/
# Ensure SKILL.md is at root of skill folder
```

### Method 3: Symlink (For Development)

```bash
# Link external skill directory
ln -s /path/to/external/skill .claude/skills/skill-name
```

---

## Testing Workflow

### Step 1: Test Basic Installation

**Test the validation skill I just created:**

```bash
# Verify test skill exists
ls -la .claude/skills/_test-skill-installation/SKILL.md
```

**In Claude Code, trigger it by saying:**
```
test skill installation
```

**Expected output:**
```
✅ Test skill activated successfully!

[Environment info displayed]
[Temporary file test executed]

✅ Skill installation test PASSED
```

**If it works:** Your skill installation system is functioning correctly.
**If it doesn't work:** See Troubleshooting section below.

---

### Step 2: Install Production Skill

**Example: Installing `testing-anti-patterns` from obra/superpowers**

```bash
# Navigate to skills directory
cd .claude/skills/

# Clone the superpowers repo
git clone https://github.com/obra/superpowers.git temp-superpowers

# Copy the specific skill
cp -r temp-superpowers/skills/testing-anti-patterns ./testing-anti-patterns

# Cleanup
rm -rf temp-superpowers

# Verify structure
ls -la ./testing-anti-patterns/SKILL.md
```

---

### Step 3: Register Skill in Config

**Edit `.claude/config/response-awareness-config.json`:**

```json
{
  "overrides": {
    "custom_skills": [
      "brainstorming",
      "systematic-debugging",
      "worktree-workflow",
      "testing-anti-patterns"  // Add new skill here
    ]
  }
}
```

**Note:** If `custom_skills` array is empty `[]`, Claude Code auto-discovers all skills in `.claude/skills/`.

---

### Step 4: Test Skill Activation

**Method A: Direct trigger (if skill has keywords)**

Look in the skill's SKILL.md for trigger patterns like:
```
**When to use:**
- User says "test" or "testing"
- User adds mocks
```

Then test by using those keywords:
```
I'm adding mocks to my test file
```

**Expected:** Skill should activate and provide guidance.

**Method B: Manual skill invocation**

```
Use the testing-anti-patterns skill to review this code:
[paste code]
```

---

### Step 5: Validate Skill Behavior

**Create a test scenario:**

```javascript
// Example: Testing anti-patterns skill
// Create a file with a mock-heavy test

describe('UserService', () => {
  it('should fetch user', () => {
    const mockFetch = jest.fn().mockResolvedValue({ id: 1 });
    const service = new UserService(mockFetch);
    // ... more mocking
  });
});
```

**Ask Claude:**
```
Review this test file for anti-patterns
```

**Expected:** Skill should activate and identify mocking issues.

---

## Common Installation Issues

### Issue 1: Skill Not Discovered

**Symptoms:**
- Trigger phrases don't activate skill
- Skill doesn't appear in Claude's responses

**Solutions:**

```bash
# 1. Check file exists
ls -la .claude/skills/skill-name/SKILL.md

# 2. Check file permissions
chmod +r .claude/skills/skill-name/SKILL.md

# 3. Check file isn't empty
cat .claude/skills/skill-name/SKILL.md | head -20

# 4. Restart Claude Code session
# Close and reopen Claude Code
```

---

### Issue 2: Skill Activates But Doesn't Work

**Symptoms:**
- Skill acknowledges activation
- But doesn't follow instructions properly

**Solutions:**

```bash
# 1. Check SKILL.md format
# Ensure it has clear sections with ## headers
# Ensure instructions are explicit

# 2. Check for syntax errors in SKILL.md
# Look for malformed markdown
# Check for unclosed code blocks

# 3. Test with simpler instructions
# Edit SKILL.md to have very basic instructions
# Then gradually add complexity
```

---

### Issue 3: Config Not Recognized

**Symptoms:**
- Skill in `.claude/config/response-awareness-config.json` but not loading

**Solutions:**

```bash
# 1. Validate JSON syntax
cat .claude/config/response-awareness-config.json | jq '.'
# If jq not installed: python -m json.tool < .claude/config/response-awareness-config.json

# 2. Check array syntax
# Ensure custom_skills is an array:
"custom_skills": ["skill1", "skill2"]  // ✓ Correct
"custom_skills": "skill1"              // ✗ Wrong

# 3. Try auto-discovery instead
# Set custom_skills to empty array
"custom_skills": []
```

---

### Issue 4: Skill Conflicts

**Symptoms:**
- Multiple skills triggering on same keywords
- Unexpected skill activations

**Solutions:**

```bash
# 1. Review trigger patterns
grep -r "When to use" .claude/skills/*/SKILL.md

# 2. Make triggers more specific
# Edit SKILL.md to use unique keywords

# 3. Use explicit skill invocation
"Use the [skill-name] skill to..."
```

---

## Installation Testing Checklist

Use this checklist for each new skill:

- [ ] Skill folder created in `.claude/skills/`
- [ ] SKILL.md file exists at root of skill folder
- [ ] SKILL.md is readable (not empty, proper permissions)
- [ ] Added to `custom_skills` array (if using explicit registration)
- [ ] Restarted Claude Code session
- [ ] Tested trigger phrase
- [ ] Skill activates correctly
- [ ] Skill executes instructions
- [ ] No conflicts with existing skills
- [ ] Documented in this project's skill inventory

---

## Skill Inventory Template

Keep track of installed skills in `.claude/skills/README.md`:

```markdown
# NextNest Custom Skills

## Active Skills

### testing-anti-patterns
- **Source:** obra/superpowers
- **Purpose:** Prevent testing mocks instead of real behavior
- **Triggers:** "test", "mock", "testing"
- **Status:** Active
- **Installed:** 2025-11-04

### javascript-testing-patterns
- **Source:** wshobson/agents
- **Purpose:** Jest/Vitest/Testing Library patterns
- **Triggers:** "jest", "vitest", "unit test"
- **Status:** Active
- **Installed:** 2025-11-04
```

---

## Uninstalling Skills

```bash
# Remove skill directory
rm -rf .claude/skills/skill-name

# Remove from config
# Edit .claude/config/response-awareness-config.json
# Remove from custom_skills array

# Restart Claude Code
```

---

## Advanced: Creating Custom Skills

See `skill-developer` skill from diet103 for complete guide:
```bash
cd .claude/skills/
# Clone and extract skill-developer skill
# Then invoke: "create a custom skill for [purpose]"
```

---

## Quick Reference

**Test basic installation:**
```
test skill installation
```

**Install skill manually:**
```bash
cd .claude/skills/
git clone <repo> temp
cp -r temp/path/to/skill ./skill-name
rm -rf temp
```

**Register skill:**
Edit `.claude/config/response-awareness-config.json`:
```json
"custom_skills": ["skill-name"]
```

**Test activation:**
```
Use the [skill-name] skill to [task]
```

---

## Next Steps

1. ✅ Test installation with `_test-skill-installation`
2. Install tier 1 skills (testing-anti-patterns, javascript-testing-patterns, e2e-testing-patterns)
3. Install tier 2 skills (api-design-principles, architecture-patterns)
4. Install tier 3 skills (git-advanced-workflows, deployment-pipeline-design)
5. Delete `_test-skill-installation` after validation

---

**Maintained by:** NextNest Team
**Last Validated:** 2025-11-04
**Claude Code Version:** Latest
