# MAF Bead Receipt Template

**Use this template to document completed work for bead closure validation.**

---

## Bead Information

**Bead ID:** [BEAD-XXX]

**Bead Title:** [Brief description of what was implemented]

**Status:** closed

**Priority:** [P0/P1/P2/P3]

**Type:** [feature/bug/refactor/task/chore]

**Assignee:** [agent-name]

**Created:** [YYYY-MM-DD]

**Updated:** [YYYY-MM-DD]

---

## Description

[Full description of what the bead accomplishes]

**Files:**
- [List key files modified/created]
- [File paths with brief descriptions]

**Effort:** [Estimated hours]

**Source:** [Link to plan/spec if applicable]

**Commands:**
```bash
# Commands run during implementation
# Include setup, test, and verification commands
```

**Labels:** [label1, label2, label3]

---

## Git History

```bash
# Include git log for this bead
# Example: git log --all --oneline --grep="BEAD-XXX"
```

**Git Commit(s):**
```
[Commit hash] [Commit message]
[Commit hash] [Commit message]
```

---

## Implementation Notes

**Context:**
[Describe the context of this work - why it was needed, what problem it solves]

**Work Process:**
1. [Step 1: What was done first]
2. [Step 2: What was done next]
3. [Step 3: Implementation approach]
4. [Step 4: Testing and verification]

**Technical Details:**
[Include any important technical details, design decisions, or architectural considerations]

---

## Testing Performed

**Verification Steps:**
- [ ] Code changes reviewed for correctness
- [ ] Integration points verified
- [ ] No regressions introduced
- [ ] Functionality validated against acceptance criteria
- [ ] Edge cases tested (if applicable)
- [ ] Performance considerations checked (if applicable)

**Test Results:**
```
[Include test output or summary]
```

**Acceptance Criteria:**
- [AC 1: First acceptance criteria - status]
- [AC 2: Second acceptance criteria - status]
- [AC 3: Third acceptance criteria - status]

---

## Files Modified

| File | Change | Description |
|------|--------|-------------|
| `path/to/file1.ts` | Modified | Brief description of change |
| `path/to/file2.ts` | Created | Brief description of new file |
| `path/to/file3.ts` | Deleted | Brief description of removal |

---

## Related Work

**Related Beads:**
- [BEAD-XXX] - [Brief description of related bead]
- [BEAD-YYY] - [Brief description of related bead]

**Related Commits:**
- `[commit-hash]` - [Related commit message]

**Dependencies:**
- [List any beads that this bead depended on]
- [List any beads that depend on this one]

---

## Notes

[Any additional notes, caveats, or follow-up work needed]

---

## Review and Approval

**Reviewed by:** [Reviewer agent name or human]

**Review Date:** [YYYY-MM-DD]

**Review Status:** [Approved/Approved with changes/Needs revision]

**Review Comments:**
[Any feedback from the review process]

---

## Receipt Metadata

**Receipt Generated:** [YYYY-MM-DD HH:MM:SS]

**Receipt Author:** [Agent or human who generated this receipt]

**Receipt Type:** [Generated during workflow/Recovered from audit/Audit recovery]

**Minimum Line Count:** [This receipt should be ≥50 lines to be considered valid]

---

*This receipt documents the completion of bead [BEAD-XXX] and serves as evidence of proper workflow closure.*
