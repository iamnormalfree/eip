# Skills Quick Start Guide

**Purpose:** Get started testing and installing Claude Code skills
**Created:** 2025-11-04

---

## 🚀 Quick Test (30 seconds)

**Test if your skills system is working:**

```
test skill installation
```

**Expected:** You should see:
```
✅ Test skill activated successfully!
[... environment info ...]
✅ Skill installation test PASSED
```

✅ **If this works:** Your skills system is ready! Continue to "Install Production Skills" below.

❌ **If this doesn't work:** See `.claude/skills/INSTALLATION_TESTING_GUIDE.md` for troubleshooting.

---

## 📦 Install Production Skills

### Tier 1: Testing Skills (Start Here)

**1. testing-anti-patterns** (Prevents mock-heavy tests)
```bash
./scripts/install-skill.sh obra/superpowers skills/testing-anti-patterns testing-anti-patterns
```

**2. javascript-testing-patterns** (Jest/Vitest/Testing Library)
```bash
./scripts/install-skill.sh wshobson/agents plugins/javascript-typescript/skills/javascript-testing-patterns javascript-testing-patterns
```

**3. e2e-testing-patterns** (Playwright/Cypress)
```bash
./scripts/install-skill.sh wshobson/agents plugins/developer-essentials/skills/e2e-testing-patterns e2e-testing-patterns
```

### Tier 2: API & Architecture (Next Priority)

**4. api-design-principles**
```bash
./scripts/install-skill.sh wshobson/agents plugins/backend-development/skills/api-design-principles api-design-principles
```

**5. architecture-patterns** (Clean Architecture, DDD)
```bash
./scripts/install-skill.sh wshobson/agents plugins/backend-development/skills/architecture-patterns architecture-patterns
```

### Tier 3: MCP & Workflow

**6. mcp-builder** (Official Anthropic)
```bash
./scripts/install-skill.sh anthropics/skills mcp-builder mcp-builder
```

**7. git-advanced-workflows** (Worktrees, rebasing)
```bash
./scripts/install-skill.sh wshobson/agents plugins/developer-essentials/skills/git-advanced-workflows git-advanced-workflows
```

---

## ✅ Validate Installation

After installing skills:

```bash
# Run validation script
./scripts/validate-skills.sh
```

**Check output for:**
- ✓ All skills show "OK" status
- ✓ Skills discovered count matches installed count
- ✓ No permission errors

---

## 🔧 Configure Skills (Optional)

Skills are auto-discovered by default. To manually register:

**Edit `.claude/config/response-awareness-config.json`:**

```json
{
  "overrides": {
    "custom_skills": [
      "brainstorming",
      "systematic-debugging",
      "worktree-workflow",
      "testing-anti-patterns",
      "javascript-testing-patterns",
      "e2e-testing-patterns",
      "api-design-principles",
      "architecture-patterns",
      "mcp-builder",
      "git-advanced-workflows"
    ]
  }
}
```

**Or leave empty for auto-discovery:**
```json
{
  "overrides": {
    "custom_skills": []
  }
}
```

---

## 🧪 Test Skill Activation

### Method 1: Trigger Phrases

Skills activate based on keywords in your messages:

```
I'm adding mocks to my test file
→ Should activate: testing-anti-patterns

Design a REST API for user authentication
→ Should activate: api-design-principles

Create MCP server for Supabase integration
→ Should activate: mcp-builder
```

### Method 2: Explicit Invocation

```
Use the testing-anti-patterns skill to review this test:
[paste code]

Use the api-design-principles skill to evaluate this endpoint:
[paste API code]
```

---

## 📋 Installation Checklist

Use this when installing each skill:

```
Skill: _______________________

[ ] Installed with install-skill.sh
[ ] Validated with validate-skills.sh
[ ] Shows "OK" in skills inventory
[ ] Tested activation with trigger phrase
[ ] Added to custom_skills (if using manual registration)
[ ] Documented trigger keywords below
```

**Trigger keywords:**
- _______________________
- _______________________

---

## 🔍 Debugging Failed Installations

### Issue: Skill doesn't activate

```bash
# 1. Check skill exists
ls -la .claude/skills/skill-name/SKILL.md

# 2. Validate all skills
./scripts/validate-skills.sh

# 3. Check for errors in SKILL.md
head -50 .claude/skills/skill-name/SKILL.md
```

### Issue: Installation script fails

```bash
# Test mode (no changes)
./scripts/install-skill.sh -t user/repo path/to/skill skill-name

# Check GitHub repo exists
curl -I https://github.com/user/repo
```

### Issue: JSON config error

```bash
# Validate JSON syntax
python -m json.tool < .claude/config/response-awareness-config.json

# Or with jq
jq '.' .claude/config/response-awareness-config.json
```

---

## 🧹 Cleanup Test Skill

After validating skills work:

```bash
# Remove test skill
rm -rf .claude/skills/_test-skill-installation

# Re-validate
./scripts/validate-skills.sh
```

---

## 📚 Full Documentation

- **Comprehensive guide:** `.claude/skills/INSTALLATION_TESTING_GUIDE.md`
- **Skill inventory:** `.claude/skills/README.md` (update as you install)
- **Installation script:** `scripts/install-skill.sh --help`
- **Validation script:** `scripts/validate-skills.sh`

---

## 🎯 Recommended Installation Order

**Week 1: Foundation**
1. Test basic installation ✓
2. Install testing skills (1-3)
3. Validate with real test files

**Week 2: Architecture**
4. Install API & architecture skills (4-5)
5. Use on existing codebase review

**Week 3: Advanced**
6. Install MCP builder
7. Install git workflows
8. Explore custom MCP creation

---

## 💡 Pro Tips

1. **Start Small:** Install 1-2 skills, test thoroughly, then add more
2. **Test Immediately:** After installing, test activation right away
3. **Document Triggers:** Keep track of which phrases activate which skills
4. **Update Inventory:** Maintain `.claude/skills/README.md` with active skills
5. **Clean Up:** Remove unused skills to avoid conflicts

---

**Last Updated:** 2025-11-04
**Validation Status:** ✅ System operational
**Next Action:** Test with "test skill installation"
