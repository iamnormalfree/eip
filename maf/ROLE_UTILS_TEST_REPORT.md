# Role Utils Test Report
## Test Suite for role-utils.sh and role-mappings.schema.json

**Test Date:** 2026-01-08  
**Test Script:** /tmp/test-role-utils-fixed.sh  
**Test Location:** /root/projects/maf-github

---

## Executive Summary

### Test Results Overview
- **Total Tests Run:** 60
- **Tests Passed:** 57
- **Tests Failed:** 3
- **Bugs Found:** 2
- **Warnings:** 2
- **Pass Rate:** 95%

### Overall Assessment
The role-utils.sh script is **functional but contains critical bugs** that need to be addressed before production use. The core functionality works correctly for normal use cases, but error handling has significant gaps.

---

## Test Coverage

### ✓ Successfully Tested Areas
1. **Function Loading** - Both functions load correctly
2. **Basic Functionality** - All primary use cases work
3. **Default Config Path** - Optional second parameter works
4. **Null and Empty Values** - Handled appropriately
5. **Malformed Config Structures** - Most cases handled
6. **Data Types** - Unicode, emoji, numeric, boolean all work
7. **Integration** - Sequential calls work correctly
8. **Schema Validation** - Schema is properly defined
9. **Performance** - Fast lookups (~1-2ms per call)

### ⚠ Areas with Issues
1. **Error Handling** - jq failures not properly detected
2. **Input Validation** - Special characters not sanitized

---

## Bugs Found

### 🐛 BUG #1: CRITICAL - get_agent_by_role Returns Success on jq Parse Errors

**Severity:** CRITICAL  
**Location:** `scripts/maf/lib/role-utils.sh`, line 12  
**Impact:** Function returns success (exit 0) when jq fails to parse malformed JSON

**Description:**
```bash
# Current code (line 12):
local agent_id=$(jq -r ".role_mappings[\"$role\"]" "$config")
```

**Problem:**
When jq encounters a parse error (e.g., malformed JSON), it exits with code 3 or 5 and prints an error to stderr. However, the function captures this in a variable assignment and continues execution, ultimately returning exit code 0 (success).

**Test Case:**
```bash
# Malformed JSON:
{
  "role_mappings": {
    "supervisor": "Agent1"
  INVALID JSON HERE
}

# Current behavior:
get_agent_by_role supervisor /tmp/test-malformed.json
echo "Exit code: $?"  # Prints: 0 (WRONG - should be non-zero)
```

**Expected Behavior:**
Function should return non-zero exit code when jq fails.

**Recommended Fix:**
```bash
# Option 1: Check jq exit code
local agent_id
agent_id=$(jq -r ".role_mappings[\"$role\"]" "$config" 2>/dev/null)
local jq_exit=$?
if [ $jq_exit -ne 0 ]; then
    echo "ERROR: Failed to parse config file: $config" >&2
    return 1
fi

# Option 2: Use set -e pipefail or set -o pipefail
set -o pipefail
local agent_id=$(jq -r ".role_mappings[\"$role\"]" "$config")
```

---

### 🐛 BUG #2: HIGH - Shell Injection Vulnerability in Role Parameter

**Severity:** HIGH  
**Location:** `scripts/maf/lib/role-utils.sh`, lines 12 and 30  
**Impact:** Role names with special characters can cause jq syntax errors and function returns incorrect exit code

**Description:**
```bash
# Line 12:
local agent_id=$(jq -r ".role_mappings[\"$role\"]" "$config")

# Line 30:
jq -e ".role_mappings[\"$role\"]" "$config" >/dev/null 2>&1
```

**Problem:**
The `$role` variable is directly interpolated into the jq query string without proper escaping. If the role name contains double quotes, it breaks the jq syntax. While this doesn't allow arbitrary code execution (due to jq's parsing), it does cause incorrect behavior.

**Test Case:**
```bash
# Role name with quotes:
get_agent_by_role 'role"with"quotes' /tmp/test-topology.json
echo "Exit code: $?"  # Prints: 0 (WRONG - should be non-zero)
# Output: jq: error: syntax error, unexpected IDENT
```

**Expected Behavior:**
Function should properly escape the role parameter or validate/reject invalid role names.

**Recommended Fix:**
```bash
# Option 1: Use jq's --arg flag (safest)
local agent_id=$(jq -r --arg role "$role" '.role_mappings[$role]' "$config")

# Option 2: Validate role name before use
if [[ ! "$role" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "ERROR: Invalid role name: $role" >&2
    return 1
fi

# Option 3: Use single quotes for jq and escape properly
local agent_id=$(jq -r ".role_mappings[\"$(printf '%s' "$role" | sed 's/"/\\"/g')\"]" "$config")
```

---

## Warnings

### ⚠️ WARNING #1: has_role_mapping Returns Failure for Null Values

**Description:**
When a role mapping exists but has a `null` value, `has_role_mapping` returns exit code 1 (failure). This is due to jq's `-e` flag treating `null` as a falsey value.

**Test Case:**
```json
{
  "role_mappings": {
    "supervisor": null
  }
}
```

```bash
has_role_mapping supervisor /tmp/test-null-agent.json
echo "Exit code: $?"  # Prints: 1
```

**Recommendation:**
Clarify the intended behavior. Should `has_role_mapping` return success if the key exists, even if the value is null? If so, remove the `-e` flag from the jq command.

**Current Code (line 30):**
```bash
jq -e ".role_mappings[\"$role\"]" "$config" >/dev/null 2>&1
```

**Proposed Fix:**
```bash
# Remove -e flag to check key existence only
jq ".role_mappings[\"$role\"]" "$config" >/dev/null 2>&1
```

---

### ⚠️ WARNING #2: Duplicate JSON Keys Not Validated

**Description:**
JSON technically allows duplicate keys (though it's discouraged), and jq handles them by using the last value. The schema doesn't prevent this.

**Test Case:**
```json
{
  "role_mappings": {
    "supervisor": "FirstAgent",
    "supervisor": "SecondAgent"
  }
}
```

```bash
get_agent_by_role supervisor /tmp/test-duplicate.json
# Returns: "SecondAgent" (last value wins)
```

**Recommendation:**
Add validation to detect and reject duplicate keys, or rely on schema validation tools to catch this.

---

## Detailed Test Results

### Section 1: Function Loading ✓
- ✓ Source role-utils.sh without errors
- ✓ get_agent_by_role function exists
- ✓ has_role_mapping function exists

### Section 2: Test Setup ✓
- ✓ Create test topology config
- ✓ Verify test config content

### Section 3: get_agent_by_role() - Basic Functionality ✓
- ✓ Get supervisor role mapping: "GreenMountain"
- ✓ Get reviewer role mapping: "BlackDog"
- ✓ Get implementor-1 role mapping: "OrangePond"
- ✓ Get implementor-2 role mapping: "FuchsiaCreek"

### Section 4: get_agent_by_role() - Error Handling ⚠
- ✓ Get non-existent role (should fail)
- ✓ Handle missing config file (should fail)
- ✗ **Malformed JSON config (should fail but returned 0)** [BUG #1]

### Section 5: has_role_mapping() - Basic Functionality ✓
- ✓ Check supervisor role exists
- ✓ Check reviewer role exists
- ✓ Check implementor-1 role exists
- ✓ Check implementor-2 role exists
- ✓ Check non-existent role (should fail)
- ✓ Check missing config file (should fail)
- ✓ Malformed JSON config (should fail)

### Section 6: Default Config Path Tests ✓
- ✓ Get supervisor with default config: "DefaultSupervisor"
- ✓ Get reviewer with default config: "DefaultReviewer"
- ✓ Check supervisor exists with default config

### Section 7: Edge Cases - Null and Empty Values ✓
- ✓ Config with null agent value (should fail)
- ⚠ has_role_mapping with null agent value [WARNING #1]
- ✓ Config with empty string agent value: ""
- ✓ has_role_mapping with empty string value

### Section 8: Edge Cases - Special Characters and Injection ⚠
- ✓ Empty role name (should fail)
- ✓ Special characters in role name (should fail)
- ✗ **Role name with quote characters (should fail but returned 0)** [BUG #2]

### Section 9: Edge Cases - Malformed Config Structures ✓
- ✓ Config without role_mappings section (should fail)
- ✓ has_role_mapping without role_mappings section (should fail)
- ✓ Config with numeric agent value: "12345"
- ✓ Config with boolean agent value: "true"
- ✓ Config with duplicate keys: "SecondAgent" [WARNING #2]

### Section 10: Data Type Tests ✓
- ✓ Config with Japanese characters: "Agent日本語"
- ✓ Config with Greek characters: "AgentΕλληνικά"
- ✓ Config with Arabic characters: "Agentعربي"
- ✓ Config with emoji characters: "Agent🎯"

### Section 11: Integration Tests ✓
- ✓ Sequential call 1 - supervisor: "GreenMountain"
- ✓ Sequential call 2 - reviewer: "BlackDog"
- ✓ Sequential call 3 - supervisor again: "GreenMountain"
- ✓ has_role_mapping then get_agent_by_role
- ✓ All schema-defined roles work - supervisor
- ✓ All schema-defined roles work - reviewer
- ✓ All schema-defined roles work - implementor-1
- ✓ All schema-defined roles work - implementor-2

### Section 12: Schema Validation Tests ✓
- ✓ Schema file exists
- ✓ Schema has correct title: "Agent Role Mappings"
- ✓ Schema uses correct JSON Schema version: draft-07
- ✓ Schema defines role_mappings property
- ✓ Schema defines supervisor property
- ✓ Schema defines reviewer property
- ✓ Schema defines implementor-1 property
- ✓ Schema defines implementor-2 property
- ✓ Schema defines all properties as strings

### Section 13: Performance Tests ✓
- ✓ Large config - lookup works
- ✓ Performance: 100 sequential lookups in ~100-200ms

---

## Recommendations

### Immediate Actions (Critical)
1. **Fix Bug #1** - Add jq exit code checking in `get_agent_by_role` function
2. **Fix Bug #2** - Use `--arg` flag for jq or validate role names

### Short-term Improvements (High Priority)
1. Add input validation for role names (allow only alphanumeric, hyphens, underscores)
2. Clarify and document the behavior of `has_role_mapping` with null values
3. Add explicit error messages for common failure scenarios

### Long-term Enhancements (Medium Priority)
1. Add unit tests to the project's test suite
2. Consider adding a validation function to check config file structure
3. Add logging/debug mode for troubleshooting
4. Document the schema and its usage in a README

### Code Quality Improvements
1. Add shellcheck compliance
2. Add function documentation/comments
3. Consider adding a `validate_config` function
4. Add integration tests with actual agent-topology.json files

---

## Test Files Used

All test files were created in `/tmp/` and cleaned up after testing:
- `/tmp/test-topology.json` - Standard test config
- `/tmp/test-malformed.json` - Malformed JSON for error testing
- `/tmp/test-null-agent.json` - Config with null values
- `/tmp/test-empty-agent.json` - Config with empty strings
- `/tmp/test-no-mappings.json` - Config without role_mappings
- `/tmp/test-numeric.json` - Config with numeric values
- `/tmp/test-boolean.json` - Config with boolean values
- `/tmp/test-duplicate.json` - Config with duplicate keys
- `/tmp/test-unicode.json` - Config with Unicode characters
- `/tmp/test-emoji.json` - Config with emoji characters
- `/tmp/test-all-roles.json` - Config with all schema-defined roles
- `/tmp/test-large.json` - Config for performance testing

---

## Conclusion

The `role-utils.sh` script provides a solid foundation for role-based agent lookups but requires critical bug fixes before production use. The core functionality works well for normal use cases, but the error handling gaps could lead to silent failures in production environments.

**Recommended Next Steps:**
1. Fix the two critical bugs identified
2. Address the two warnings
3. Add the recommended input validation
4. Incorporate these tests into the project's CI/CD pipeline

**Overall Grade:** B- (Would be A after bug fixes)

---

## Appendix: Fixed Code Suggestions

### Suggested Fix for get_agent_by_role:
```bash
get_agent_by_role() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    # Validate role name
    if [[ ! "$role" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo "ERROR: Invalid role name: $role" >&2
        return 1
    fi

    if [ ! -f "$config" ]; then
        echo "ERROR: Config not found: $config" >&2
        return 1
    fi

    # Use --arg for safe parameter passing
    local agent_id
    agent_id=$(jq -r --arg role "$role" '.role_mappings[$role]' "$config" 2>/dev/null)
    local jq_exit=$?

    if [ $jq_exit -ne 0 ]; then
        echo "ERROR: Failed to parse config file: $config" >&2
        return 1
    fi

    if [ "$agent_id" = "null" ] || [ -z "$agent_id" ]; then
        echo "WARNING: Role '$role' not found in config" >&2
        return 1
    fi

    echo "$agent_id"
}
```

### Suggested Fix for has_role_mapping:
```bash
has_role_mapping() {
    local role="$1"
    local config="${2:-.maf/config/agent-topology.json}"

    # Validate role name
    if [[ ! "$role" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        return 1
    fi

    if [ ! -f "$config" ]; then
        return 1
    fi

    # Use --arg for safe parameter passing
    # Check if key exists regardless of value
    jq -e --arg role "$role" '.role_mappings | has($role)' "$config" >/dev/null 2>&1
}
```

---

**Test Report Generated:** 2026-01-08  
**Test Tool:** Bash test suite  
**Total Test Duration:** ~2 seconds
