# Task Tool Model Parameter Validation Guide

## Purpose
Prevent deployment failures due to invalid model parameters in the Task tool.

## Issue Summary
The Task tool in Claude Code has strict model validation and only accepts three specific model identifiers:

```javascript
// VALID model parameters for Task tool
model="sonnet"   // Claude Sonnet (high capability)
model="opus"     // Claude Opus (maximum capability)
model="haiku"    // Claude Haiku (fast, cost-effective)
```

## ❌ Invalid Model Parameters
These will cause Task tool deployment failures:

```javascript
// INVALID - These cause deployment errors
model="claude-sonnet-4-5-20250929"  // Too specific
model="claude-3-5-haiku-20241022"   // Too specific
model="claude-3-opus-20240229"      // Too specific
model="glm-4.6"                      // Not recognized by Task tool
model="gpt-4"                       // Not supported
```

## ✅ Correct Usage Examples

### Configuration Files
```json
// .claude/config/response-awareness-config.json
{
  "tier_preferences": {
    "light": {
      "model": "haiku"     // ✅ Valid
    },
    "medium": {
      "model": "haiku"     // ✅ Valid
    },
    "heavy": {
      "model": "sonnet"    // ✅ Valid
    },
    "full": {
      "model": "sonnet"    // ✅ Valid
    }
  }
}
```

### Agent Configuration
```json
// .claude/config/agents-config.json
{
  "custom_agents": {
    "worktree-helper": {
      "model": "haiku"     // ✅ Valid
    }
  },
  "agent_overrides": {
    "plan-synthesis-agent": {
      "model": "sonnet"    // ✅ Valid
    },
    "test-automation-expert": {
      "model": "sonnet"    // ✅ Valid
    }
  }
}
```

### Task Deployment in Skills/Commands
```python
# ✅ CORRECT: Use simplified model names
Task(
    subagent_type="general-purpose",
    model="haiku",         # Valid for Task tool
    description="Quick implementation task",
    prompt="..."
)

Task(
    subagent_type="plan-synthesis-agent",
    model="sonnet",        # Valid for Task tool
    description="Complex synthesis task",
    prompt="..."
)
```

## Environment Variable Mapping
Your `.claude/settings.json` can map these simplified names to actual models:

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-4.6",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.6"
  }
}
```

## Response-Awareness Tier Model Strategy

### LIGHT Tier (0-1 complexity)
- **Primary**: `haiku` (fast, cost-efficient)
- **Rationale**: Simple tasks don't need heavy reasoning
- **Use case**: Bug fixes, cosmetic changes

### MEDIUM Tier (2-4 complexity)
- **Primary**: `haiku` (clear instructions)
- **Rationale**: Well-defined tasks with clear requirements
- **Use case**: Standard features, multi-file changes

### HEAVY Tier (5-7 complexity)
- **Primary**: `sonnet` (metacognition needed)
- **Rationale**: Complex planning and synthesis requires deep reasoning
- **Use case**: Architecture decisions, cross-module integration

### FULL Tier (8+ complexity)
- **Primary**: `sonnet` (maximum coordination)
- **Rationale**: Multi-domain orchestration requires advanced reasoning
- **Use case**: System-wide changes, architectural overhauls

## Troubleshooting

### Error: "Invalid Model Parameter"
**Symptoms**:
- Task tool fails to deploy
- Error mentions model validation
- Agent deployment times out

**Solution**:
1. Check model parameter in Task() call
2. Replace with `sonnet`, `opus`, or `haiku`
3. Update configuration files if needed

### Performance Issues
**Symptoms**:
- Agent deployment is slow
- High token usage

**Solution**:
- Use `haiku` for simple tasks (LIGHT/MEDIUM tiers)
- Reserve `sonnet` for complex work (HEAVY/FULL tiers)
- Avoid `opus` unless maximum capability needed

## Migration Checklist

When updating old configuration files:

1. **Search and replace**:
   - `claude-sonnet-4-5-20250929` → `sonnet`
   - `claude-3-5-haiku-20241022` → `haiku`
   - `claude-3-opus-20240229` → `opus`

2. **Verify configuration files**:
   - `.claude/config/response-awareness-config.json`
   - `.claude/config/agents-config.json`
   - Any skill/agent files with Task() examples

3. **Test Task deployment**:
   - Deploy a simple agent with `model="haiku"`
   - Deploy a complex agent with `model="sonnet"`
   - Verify no validation errors

## Best Practices

1. **Always use simplified names**: `sonnet`, `opus`, `haiku`
2. **Match model to task complexity**: Don't use `sonnet` for simple fixes
3. **Document model choices**: Include rationale in skill files
4. **Test after changes**: Verify Task deployment works
5. **Use environment mapping**: Let `settings.json` handle actual model selection

## Implementation Validation

Add this to your pre-commit checks:
```bash
# Validate Task tool model parameters
echo "Checking Task tool model parameters..."
if grep -r "model.*claude-" .claude/ --include="*.json" --include="*.md"; then
  echo "❌ Invalid Task tool model parameters found"
  echo "Use: sonnet, opus, or haiku instead"
  exit 1
fi
echo "✅ Task tool model parameters are valid"
```

---

**Version**: 1.0
**Created**: 2025-11-11
**Purpose**: Fix model parameter validation issues in response-awareness framework