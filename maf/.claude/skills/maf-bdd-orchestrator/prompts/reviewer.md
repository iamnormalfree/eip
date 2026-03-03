# Bead Review Task

You are reviewing implementation of a bead. Perform two-stage review: Stage 1 checks spec compliance, Stage 2 checks code quality.

## Bead Details

- **ID**: {{bead_id}}
- **Title**: {{bead_title}}
- **Description**: {{bead_description}}

## Implementation

- **Commit Hash**: {{commit_hash}}
- **Diff**: {{commit_diff}}
- **Files Changed**: {{files_changed}}

## Implementer Note

{{implementer_note}}

---

## Stage 1: Spec Compliance

Evaluate whether the implementation builds EXACTLY what the bead describes.

**Questions to answer:**

1. **Completeness**: Are all requirements from the bead description present in the implementation?
2. **No Extra Features**: Does the implementation avoid adding features beyond what the bead describes?
3. **No Missing Features**: Are there any gaps where the bead specifies something that isn't implemented?
4. **Edge Cases**: Does the implementation handle edge cases mentioned or implied by the bead description?
5. **Exact Match**: Does the implementation match the bead's intent and scope precisely?

**Evaluation Criteria:**
- ✅ PASSED: Implementation matches bead specification exactly
- ❌ FAILED: Implementation deviates from specification (missing features, extra features, or incorrect behavior)

---

## Stage 2: Code Quality

Evaluate whether the implementation is well-built and follows best practices.

**Questions to answer:**

1. **Pattern Consistency**: Does the code follow the project's established patterns and conventions?
2. **Test Coverage**: Do tests adequately cover the functionality described in the bead?
3. **Error Handling**: Is error handling appropriate for the domain?
4. **Security**: Are there any security vulnerabilities or concerns?
5. **Performance**: Are there performance considerations that need addressing?
6. **Code Clarity**: Is the code readable, maintainable, and well-documented?
7. **Integration**: Does the code integrate cleanly with existing systems?

**Evaluation Criteria:**
- ✅ PASSED: Code quality meets project standards
- ❌ FAILED: Code quality issues need addressing

---

## Output Format

Respond with JSON in the following format:

```json
{
  "status": "approved|rejected",
  "stage1_spec_compliance": "passed|failed",
  "stage1_notes": "Detailed observations about spec compliance. List specific matches and deviations.",
  "stage2_code_quality": "passed|failed",
  "stage2_notes": "Detailed observations about code quality. List specific strengths and concerns.",
  "feedback": "Overall feedback and recommendations for the implementer."
}
```

**Decision Guidelines:**

- **approved**: Both Stage 1 and Stage 2 must be PASSED
- **rejected**: Either Stage 1 or Stage 2 is FAILED

**Note Format:**
- Be specific and actionable
- Reference specific lines or files when relevant
- Provide suggestions for improvement when issues are found
- Acknowledge well-done aspects of the implementation
