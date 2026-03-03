# Bead Review Task - Two-Stage Review Process

You are reviewing **{{bead_id}}** implementation. Perform two-stage review.

## Bead Details
- **ID:** {{bead_id}}
- **Title:** {{bead_title}}
- **Description:** {{bead_description}}

## Implementation
- **Commit:** {{commit_hash}}
- **Files changed:** {{files_changed}}
- **Diff:** See commit output

## STAGE 1: Spec Compliance

**Question:** Did the implementation build EXACTLY what the bead describes?

### Checklist

- [ ] All requirements from bead description implemented?
- [ ] No extra features added (YAGNI - You Aren't Gonna Need It)?
- [ ] Edge cases covered in tests?
- [ ] Dependencies handled properly?
- [ ] Receipt file generated (≥50 lines, not template)?

### Decision: PASSED or FAILED

**If PASSED:** Proceed to Stage 2

**If FAILED:** Reject with specific missing requirements

**Response Template (if FAILED):**
```
From: {{reviewer_mail_name}}
To: {{implementor_mail_name}}
Subject: [{{bead_id}}] Stage 1 FAILED - Spec Compliance

❌ Spec compliance check FAILED

Missing requirements:
- [List specific missing requirements from bead description]

Extra features (remove these):
- [List any features not in spec]

Other issues:
- [Any other spec compliance issues]

Please fix and resubmit for Stage 1 review again.
```

---

## STAGE 2: Code Quality

**ONLY proceed if Stage 1 PASSED**

**Question:** Is the implementation well-built?

### Checklist

- [ ] Tests exist and pass?
- [ ] Code follows project patterns?
- [ ] No security issues (no eval, no innerHTML, parameterized queries)?
- [ ] Error handling appropriate?
- [ ] No hardcoded values (magic numbers, strings)?
- [ ] Performance acceptable (no nested loops, no large copies)?
- [ ] Clean code (no duplication, good names)?

### Decision: PASSED or FAILED

**If PASSED:** Approve bead

**If FAILED:** Reject with specific code quality issues

**Response Template (if FAILED):**
```
From: {{reviewer_mail_name}}
To: {{implementor_mail_name}}
Subject: [{{bead_id}}] Stage 2 FAILED - Code Quality

❌ Code quality check FAILED

Issues found:
- [List specific code quality issues with file:line references]

Security issues:
- [List any security vulnerabilities]

Performance issues:
- [List any performance concerns]

Please fix and resubmit for Stage 2 review again.
```

---

## If Both Stages PASSED

**Response Template:**
```
From: {{reviewer_mail_name}}
To: {{implementor_mail_name}}
Cc: {{supervisor_mail_name}}
Subject: [{{bead_id}}] APPROVED - Both Stages Passed

✅ Stage 1 (Spec Compliance): PASSED
✅ Stage 2 (Code Quality): PASSED

Bead approved. Closing.

Great work following TDD and maintaining code quality!
```

Then run: `bd close {{bead_id}}`

---

## Running Review Tools

### Automated Stage Checks

**Stage 1: Spec compliance**
```bash
python3 maf/scripts/maf/lib/reviewer.py {{bead_id}} --commit {{commit_hash}} --stage 1
```

**Stage 2: Code quality**
```bash
python3 maf/scripts/maf/lib/reviewer.py {{bead_id}} --commit {{commit_hash}} --stage 2
```

**Both stages**
```bash
python3 maf/scripts/maf/lib/reviewer.py {{bead_id}} --commit {{commit_hash}}
```

### Manual Review Steps

1. View commit:
   ```bash
   git show {{commit_hash}}
   ```

2. Check tests:
   ```bash
   npm test  # or pytest, mvn test
   ```

3. Check receipt:
   ```bash
   wc -l receipts/{{bead_id}}.md
   # Should be ≥50 lines
   ```

4. Verify TDD workflow:
   ```bash
   python3 maf/scripts/maf/lib/tdd_enforcer.py {{bead_id}}
   ```

---

## Review Philosophy

### Stage 1: Spec Compliance (The WHAT)

**Focus:** Did we build the right thing?

- Check against bead description line-by-line
- Every requirement in spec must be in code
- Nothing in code that's not in spec
- Edge cases explicitly tested

**Common Stage 1 Failures:**
- Missing requirement from spec
- Added "helpful" feature not in spec
- Forgot error cases
- Dependencies not handled

### Stage 2: Code Quality (The HOW)

**Focus:** Did we build it the right way?

- Code is maintainable and readable
- Tests cover functionality
- No security vulnerabilities
- Performance is acceptable
- Follows project patterns

**Common Stage 2 Failures:**
- Missing tests or tests failing
- Security issues (eval, innerHTML, SQL injection)
- Hardcoded values
- Poor error handling
- Code duplication

---

## Important Reminders

- **Stage 1 MUST pass before Stage 2** - Don't check code quality if spec is wrong
- **Be specific in rejections** - Tell implementor exactly what to fix
- **Don't fix it yourself** - Reject and let implementor fix
- **Approve when both stages pass** - Don't approve with "minor issues"
- **Close bead after approval** - Run `bd close {{bead_id}}`

Two-stage review ensures both correctness AND quality.
