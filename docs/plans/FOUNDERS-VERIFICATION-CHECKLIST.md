# Founder's Pre-Execution Verification Checklist

**Purpose:** Verify the founder's guide is complete and aligned with source documents before execution.
**Use Before:** Starting any migration steps
**Confidence Level:** This checklist helps us verify what I claim is accurate

---

## Part 1: Document Alignment Verification

**Goal:** Ensure founder's guide matches the source documents.

### Check 1.1: All Priority 1 Upstream Items Included

**Source:** `upstream-candidates-matrix.md` lines 324-329

**Expected 6 Priority 1 items:**
1. clear-stuck-prompts.sh (Roundtable, 82 lines)
2. error-handling.sh (Roundtable, 613 lines)
3. tmux-utils.sh (Roundtable, 893 lines)
4. Subtree auto-detection (NextNest, ~20 lines)
5. Role-based mapping (NextNest, ~50 lines)
6. Agent startup wrapper (NextNest, ~30 lines)

**Verify in founder's guide:**
```bash
# Check all 6 items are mentioned
echo "Checking for Roundtable items..."
grep -n "error-handling.sh.*613" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
grep -n "tmux-utils.sh.*893" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
grep -n "clear-stuck-prompts.sh.*82" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md

echo ""
echo "Checking for NextNest items..."
grep -n "Subtree auto-detection" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
grep -n "Role-based.*mapping" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
grep -n "Agent startup.*wrapper" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
```

**Expected Result:** All 6 items found ✅

**Actual Result:** ___ (Run command to verify)

---

### Check 1.2: Root/Subtree Relationship Correct

**Critical:** This is the most important verification. Wrong relationship = data loss.

**Source:** `V3-CORRECTIONS-SUMMARY.md` lines 18-42

**Correct relationship:**
- Root config (.maf/config/): v1.0.0, session "maf-cli" (PRISTINE from HQ)
- Subtree config (maf/.maf/config/): v2.0.0, session "maf-nn" (ENHANCED, within subtree)

**Verify in founder's guide:**
```bash
# Check founder's guide shows correct relationship
grep -A5 "UNDERSTANDING THE NEXTNEST CONFIG" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
```

**Expected to see:**
```
1. Root config: .maf/config/agent-topology.json
   - v1.0.0 schema (from HQ)
   - Session: "maf-cli"
   - Status: PRISTINE from HQ

2. Subtree config: maf/.maf/config/agent-topology.json
   - v2.0.0 schema (ENHANCED!)
```

**❌ WRONG (would cause data loss):**
```
Root: v2.0.0, Subtree: v1.0.0
```

**Actual Result:** ___ (Verify above)

---

### Check 1.3: Line Counts Match

**Source:** `upstream-candidates-matrix.md` and `VERIFICATION-REPORT-V3-DOCS.md`

**Expected totals:**
- From Roundtable: 1,588 lines (613 + 893 + 82)
- From NextNest: ~100 lines (20 + 50 + 30)
- **Total: ~1,688 lines**

**Verify in founder's guide:**
```bash
# Check line counts in founder's guide
grep -n "Total.*1,688\|1,688.*total" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
grep -n "1,588.*Roundtable\|Roundtable.*1,588" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
```

**Expected:** Should see "~1,688" as the total

**Actual Result:** ___

---

## Part 2: Cross-Reference Verification

**Goal:** No contradictions between documents.

### Check 2.1: unified-blueprint.md vs founder's guide

**Key claims to verify match:**

| Claim | unified-blueprint.md | FOUNDERS-IMPLEMENTATION-GUIDE.md | Match? |
|-------|---------------------|----------------------------------|--------|
| Root config version | v1.0.0 (line 92) | v1.0.0 (line ~920) | ___ |
| Subtree config version | v2.0.0 (line 93) | v2.0.0 (line ~925) | ___ |
| Roundtable tools: 1,588 lines | Yes (line 816) | Yes (line ~268) | ___ |
| NextNest patterns included | Yes (Part 1) | Yes (line ~273) | ___ |

**Verification commands:**
```bash
# Check root config version in both
echo "unified-blueprint:"
grep "v1.0.0.*root\|root.*v1.0.0" docs/plans/maf-franchise-migration-unified-blueprint.md | head -1
echo ""
echo "founder's guide:"
grep "v1.0.0.*root\|root.*v1.0.0" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md | head -1
```

---

### Check 2.2: No Contradictions on Critical Items

**These items MUST be consistent:**

1. **autonomous-workflow.sh:** Should be EXCLUDED from Wave 1
   ```bash
   grep -n "autonomous-workflow.sh.*excluded\|excluded.*autonomous-workflow" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
   ```
   **Expected:** Should mention it's excluded (needs refactoring)

2. **Session names:** Should keep "maf-nn" for NextNest
   ```bash
   grep -n "maf-nn.*KEEP\|KEEP.*maf-nn" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
   ```
   **Expected:** Should mention keeping "maf-nn" for NextNest

3. **Enhanced scripts:** Should be characterized as NEW, not enhanced
   ```bash
   grep -n "NEW.*Roundtable\|Roundtable.*NEW" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
   ```
   **Expected:** Should say "NEW" (not "enhanced")

---

## Part 3: Completeness Verification

**Goal:** Nothing important was missed.

### Check 3.1: All Wave 1 Steps Present

**Expected steps in Wave 1:**
- [ ] Add Roundtable's 3 tools (STEP 1.1-1.7)
- [ ] Add NextNest's 3 patterns (STEP 1.8-1.11)
- [ ] Commit Roundtable contributions (STEP 1.7)
- [ ] Commit NextNest contributions (STEP 1.16)
- [ ] Verify all 6 items (STEP 1.17)
- [ ] Add CI guard (STEP 1.13)
- [ ] Add health check (STEP 1.14)
- [ ] Push to remote (STEP 1.18-1.20)

**Verification:**
```bash
# Check step numbering is sequential
grep "^#### STEP 1\." docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md | nl
```

**Expected:** Sequential steps 1.1 through 1.20

**Actual Result:** ___

---

### Check 3.2: All Wave 2 Steps Present

**Expected steps in Wave 2:**
- [ ] Backup NextNest's v2.0.0 config
- [ ] Restore NextNest subtree
- [ ] Restore NextNest's v2.0.0 config
- [ ] Test NextNest agents
- [ ] Backup Roundtable's enhanced scripts
- [ ] Pull Roundtable subtree
- [ ] Verify Roundtable still works

**Verification:**
```bash
# Check Wave 2 section exists
grep -n "^## Part 5: Wave 2" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
grep -n "^#### STEP 2\." docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md | wc -l
```

**Expected:** Should see "Part 5: Wave 2" and ~9 Wave 2 steps

**Actual Result:** ___

---

## Part 4: Risk Mitigation Verification

**Goal:** Safety measures are in place.

### Check 4.1: Backup Procedures Documented

**Verify these backups are mentioned:**
```bash
# Check for Day -7 to 0 (pre-migration) backups
grep -n "backup.*before.*migration\|migration.*backup" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md | head -3

# Check for git tag backups
grep -n "git tag.*backup\|backup.*git tag" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md | head -3
```

**Expected:** Should have backup steps before execution

---

### Check 4.2: Rollback Procedures Documented

**Verify rollback section exists:**
```bash
grep -n "## Part 7: Rollback\|Rollback.*Procedures" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
```

**Expected:** Should see rollback section

---

### Check 4.3: Health Checks Present

**Verify health checks are included:**
```bash
grep -n "Health Check\|health.*check\|check.*health" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md | wc -l
```

**Expected:** Should have 5+ health check references

---

## Part 5: Founder-Friendly Verification

**Goal:** Non-technical language is clear and accurate.

### Check 5.1: Technical Terms Explained

**Check that complex terms have plain English explanations:**
- [ ] "Subtree" explained?
- [ ] "Root config" vs "Subtree config" explained?
- [ ] "v1.0.0" vs "v2.0.0" explained?
- [ ] "Role-based mapping" explained?

**Verification:**
```bash
# Check for explanations
grep -A2 "WHAT IS.*subtree\|subtree.*WHAT" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md | head -5
grep -A2 "WHAT.*v1.0.0.*v2.0.0\|v1.0.0.*v2.0.0.*WHY" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md | head -5
```

---

### Check 5.2: Business Value Explained

**Check that each step explains WHY it matters:**
```bash
# Count "BUSINESS VALUE" or "WHY" sections
grep -c "BUSINESS VALUE\|WHY.*:" docs/plans/FOUNDERS-IMPLEMENTATION-GUIDE.md
```

**Expected:** Should have 15+ "WHY" explanations

---

## Part 6: Final Go/No-Go Decision

### Before Execution, Confirm:

- [ ] **All 6 Priority 1 upstream items** are in founder's guide
- [ ] **Root/subtree relationship** is correct (v1.0.0 root, v2.0.0 subtree)
- [ ] **Line counts** match (~1,688 total)
- [ ] **No contradictions** between documents
- [ ] **All Wave 1 steps** present (1.1-1.20)
- [ ] **All Wave 2 steps** present
- [ ] **Backup procedures** documented
- [ ] **Rollback procedures** documented
- [ ] **Health checks** included
- [ ] **Technical terms** explained in plain English

### If Any Check Fails:

1. ❌ **STOP** - Do not proceed
2. 📋 **Document** what failed
3. 💬 **Ask** for clarification
4. ✅ **Fix** the issue
5. 🔄 **Re-verify** before proceeding

---

## Summary: Confidence Score

**After completing this checklist:**

| Verification Area | Checks | Passed | Confidence |
|------------------|--------|--------|------------|
| Document alignment | 3 | ___ | ___ % |
| Cross-reference | 2 | ___ | ___ % |
| Completeness | 2 | ___ | ___ % |
| Risk mitigation | 3 | ___ | ___ % |
| Founder-friendly | 2 | ___ | ___ % |
| **TOTAL** | **12** | **___** | **___ %** |

**Go/No-Go Decision:**
- **≥ 11/12 passed (≥ 92%):** ✅ **GO** - Proceed with execution
- **9-10/12 passed (75-91%):** ⚠️ **CAUTION** - Review failures, decide if acceptable
- **≤ 8/12 passed (< 75%):** ❌ **NO-GO** - Fix issues before proceeding

---

## How I (Claude) Failed Initially

**What I missed:**
- ❌ NextNest's 3 pattern contributions (~100 lines)
- ❌ Only included Roundtable's 3 tool contributions (1,588 lines)
- ❌ Founder's guide was incomplete, not wrong

**Why it happened:**
- Focused on the "big number" (1,588)
- Didn't do cross-reference verification
- Assumed instead of verified

**How to prevent this:**
- ✅ Use THIS checklist before execution
- ✅ Cross-reference all documents systematically
- ✅ Verify, don't assume

---

**Generated:** 2026-01-08
**Purpose:** Founder's verification before execution
**Status:** Ready for use - Run all checks before starting migration
