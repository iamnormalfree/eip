This file documents the OLD sections to add to README.md

Location 1: After line 195 (in configuration section)
Add before the PreToolUse example:

<!-- OLD (INCORRECT - before_tool_use object format):
Previous documentation showed an incorrect settings format:
```json
{
  "hooks": {
    "before_tool_use": {
      "Edit": {
        "enabled": true,
        "hooks": [...]
      }
    }
  }
}
```
This format is WRONG. The correct format is shown below using PreToolUse arrays.
-->

Location 2: In the exit code documentation (around line 246-257, in "Disable Temporarily" section)
No specific OLD needed here as it was already using correct format.

Actually, the files already have the correct content. Let me create proper patches.
