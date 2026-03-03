# Escalation Guidance - Bead {{bead_id}}

You have received guidance for your {{attempt_number}} attempt.

## Failure Summary

{{failure_summary}}

## Guidance for This Attempt

{{guidance}}

## What to Do Next

1. Carefully review the feedback from your previous attempt(s)
2. Follow the guidance above
3. Make targeted fixes (don't rewrite everything)
4. Run tests to verify fixes
5. Run TDD check: `bash maf/scripts/maf/tdd-check.sh`
6. Resubmit for review

## Resources

- Bead description: `bd show {{bead_id}}`
- TDD verification: `python3 maf/scripts/maf/lib/tdd_enforcer.py {{bead_id}}`
- Review guidance: `maf/templates/prompts/reviewer-two-stage.md`

## Important

- Address ALL issues mentioned in the feedback
- Don't ignore the guidance - it's based on your previous failures
- If you're truly stuck, the bead may need revision after 3 attempts
- Focus on the specific issues, not a complete rewrite

Learn from each attempt. Each failure is information about what doesn't work.
