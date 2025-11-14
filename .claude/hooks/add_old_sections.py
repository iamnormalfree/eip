"""Add OLD commented sections to documentation files to show what was changed."""

def add_old_to_readme():
    """Add OLD sections to README.md"""
    filepath = r"C:\Users\HomePC\Desktop\Code\brentfire\.claude\hooks\README.md"
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find the configuration section (around line 161)
    new_lines = []
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # Add OLD format comment before the configuration section
        if i > 0 and "Already configured in `.claude/settings.json`:" in line:
            old_comment = '''
<!-- OLD (INCORRECT - Used before_tool_use object format with enabled field):
Previous documentation showed this INCORRECT format:
```json
{
  "hooks": {
    "before_tool_use": {
      "Edit": {
        "type": "command",
        "command": "python .claude/hooks/orchestrator-firewall.py",
        "enabled": true
      },
      "Write": {
        "type": "command",
        "command": "python .claude/hooks/orchestrator-firewall.py",
        "enabled": true
      }
    }
  }
}
```
This format is WRONG. The correct PreToolUse array format is shown below.
-->

'''
            new_lines.append(old_comment)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"✓ Updated {filepath}")
    return True


def add_old_to_firewall_guide():
    """Add OLD sections to ORCHESTRATOR_FIREWALL_GUIDE.md"""
    filepath = r"C:\Users\HomePC\Desktop\Code\brentfire\.claude\hooks\ORCHESTRATOR_FIREWALL_GUIDE.md"
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # Add OLD format before Step 2: Configuration Added
        if "### Step 2: Configuration Added" in line:
            old_comment = '''
<!-- OLD (INCORRECT - before_tool_use object format):
Previous documentation used this INCORRECT settings format:
```json
{
  "hooks": {
    "before_tool_use": {
      "Edit": {
        "enabled": true,
        "type": "command",
        "command": "python .claude/hooks/orchestrator-firewall.py"
      }
    }
  }
}
```
The correct format uses PreToolUse arrays as shown below.
-->

'''
            new_lines.append(old_comment)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"✓ Updated {filepath}")
    return True


def add_old_to_visual_guide():
    """Add OLD sections to VISUAL_GUIDE.md"""
    filepath = r"C:\Users\HomePC\Desktop\Code\brentfire\.claude\hooks\VISUAL_GUIDE.md"
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # Add OLD exit code comment before the decision logic line
        if i > 0 and "│  4. DECISION: BLOCK ❌" in line:
            old_comment = '''<!-- OLD (INCORRECT - Exit code 1 for blocking):
│     └─ Exit code: 1 (prevent tool execution)  [WRONG!]
│
│ The correct exit code for blocking is 2, not 1.
│ Exit code 1 is for non-blocking warnings.
-->
'''
            new_lines.append(old_comment)
        
        # Add OLD note in Quick Reference Chart header
        if "## Quick Reference Chart" in line:
            old_note = '''
<!-- OLD (INCORRECT - Exit codes):
Previous documentation incorrectly stated that exit code 1 blocks tool execution.
CORRECT: Exit 0=allow, Exit 1=warn (non-blocking), Exit 2=block
-->

'''
            new_lines.append(old_note)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"✓ Updated {filepath}")
    return True


if __name__ == "__main__":
    print("Adding OLD sections to documentation files...\n")
    add_old_to_readme()
    add_old_to_firewall_guide()
    add_old_to_visual_guide()
    print("\n✓ All files updated with OLD sections")
