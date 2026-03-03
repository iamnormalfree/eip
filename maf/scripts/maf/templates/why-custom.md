<!--
Creating custom MAF script?

Before proceeding, document why existing MAF scripts are insufficient.

INSTRUCTIONS:
- Fill out this template completely
- Be specific about what's missing
- Consider if customization would work instead
- Review with team before proceeding
-->

# Custom MAF Script: [SCRIPT_NAME]

## Decision Checklist

- [ ] I have searched `maf/scripts/maf/` for equivalent functionality
- [ ] I have read the relevant MAF script completely
- [ ] I have considered customizing existing MAF script instead
- [ ] I have documented why MAF's approach doesn't work
- [ ] I have reviewed this decision with [NAME] on [DATE]

## MAF Script Evaluated

**Script:** `maf/scripts/maf/[SCRIPT_NAME].sh`

**What it provides:**
- Feature 1:
- Feature 2:
- Feature 3:

## Why MAF's Script Is Insufficient

### Reason 1: [Specific Reason]

**What's missing:**
[Describe the specific feature or behavior that MAF doesn't provide]

**Why customization doesn't work:**
[Explain why copying and modifying MAF's script won't work]

**Impact:**
[What happens without this custom script]

### Reason 2: [If applicable]

**What's missing:**
...

**Why customization doesn't work:**
...

**Impact:**
...

## Required Custom Features

### Feature 1: [Feature Name]

**Description:**
[What this feature does]

**Why it's needed:**
[Business or technical reason]

**Alternative approaches considered:**
1. [Approach 1] - Rejected because: [Reason]
2. [Approach 2] - Rejected because: [Reason]

### Feature 2: [Feature Name]

...

## Implementation Notes

**Files to modify:**
- [ ] [File 1]
- [ ] [File 2]

**Patterns to follow:**
- [ ] Use subtree auto-detection for PROJECT_ROOT
- [ ] Follow MAF script structure
- [ ] Include ABOUTME header
- [ ] Add LCL tags

**Testing approach:**
[How you'll verify this works]

## Review

**Reviewed with:** [Name]
**Date:** [Date]
**Decision:**
- [ ] Approved to proceed
- [ ] Rejected - use MAF's script instead
- [ ] Rejected - customize MAF's script instead

**Reviewer comments:**
[Feedback from reviewer]

## Rationale Summary

**One-sentence summary of why custom script is necessary:**

[Example: "MAF's coordinate-agents.sh doesn't support V2 dependency routing required by NextNest's Shadow Spine architecture."]

---

## Template Usage

1. Copy this template to your custom script directory
2. Fill out ALL sections
3. Get review and approval
4. Keep this documentation with your script

**Without this documentation, custom scripts may be deleted during MAF updates.**
