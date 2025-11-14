---
name: dr-elena-compliance-checker
description: Automatically validates Dr Elena v2 regulatory compliance when modifying calculation files. Checks rounding rules, MAS Notice compliance, constant updates, and required test coverage. Auto-activates when touching lib/calculations/* files.
---

# Dr Elena v2 Compliance Checker

Prevents regulatory violations by automatically validating Dr Elena v2 rules when modifying calculation files. This skill enforces MAS (Monetary Authority of Singapore) compliance requirements and ensures calculation integrity.

## When to Use This Skill

**Auto-activates when:**
- Modifying `lib/calculations/instant-profile.ts`
- Modifying `lib/calculations/dr-elena-constants.ts`
- Adding new calculation functions
- Updating regulatory constants
- Changing rounding logic
- Modifying income recognition
- Updating stress test rates
- Changing LTV calculations
- Modifying TDSR/MSR calculations

**Explicit invocation:**
```
Use the dr-elena-compliance-checker skill to validate [calculation change]
```

**Do NOT activate for:**
- Non-calculation code changes
- UI/UX modifications
- Form component updates (unless they affect calculations)
- Documentation-only changes

---

## Core Functionality

### Step 1: Detect Calculation File Changes

**Auto-detection logic:**

```bash
# Check git status for calculation files
git status --short | grep "lib/calculations/"

# Specific files that trigger validation:
lib/calculations/instant-profile.ts
lib/calculations/dr-elena-constants.ts
lib/calculations/archive/2025-10/* (warn if modifying archived files)
```

**If detected:** Run full compliance validation

---

### Step 2: Validate Rounding Rules (Client-Protective)

**Dr Elena v2 Rounding Strategy:**

```markdown
MANDATORY RULES (from CANONICAL_REFERENCES.md):
✅ Loan amounts: Round DOWN (client pays less)
✅ Payment amounts: Round UP (conservative, client-protective)
✅ Available funds: Round UP (conservative estimate)

❌ FORBIDDEN:
- Rounding loans UP (increases debt)
- Rounding payments DOWN (underestimates burden)
- Rounding funds DOWN (underestimates liquidity)
```

**Validation checks:**

```typescript
// Scan for Math.round(), Math.floor(), Math.ceil() usage
// Verify context:
// - Loan calculations use Math.floor()
// - Payment calculations use Math.ceil()
// - Fund calculations use Math.ceil()

Example violations:
❌ const loanAmount = Math.ceil(principal * ltv) // Should be Math.floor()
❌ const monthlyPayment = Math.floor(payment) // Should be Math.ceil()
✅ const loanAmount = Math.floor(principal * ltv) // Correct
✅ const monthlyPayment = Math.ceil(payment) // Correct
```

**Output:**
```markdown
🔍 Rounding Rule Validation:

✅ Line 245: loanAmount = Math.floor() - Correct (loans DOWN)
✅ Line 312: monthlyPayment = Math.ceil() - Correct (payments UP)
⚠️  Line 428: loanAmount = Math.round() - Review required
   → Should be Math.floor() per Dr Elena v2 client-protective rounding
```

---

### Step 3: Validate MAS Notice Compliance

**Required MAS Notices:**

```markdown
From dr-elena-constants.ts:

📋 MAS Notice 632: Residential property loans
- Stress test floor: 4.0%
- LTV limits by property count
- Income recognition rates

📋 MAS Notice 645: Commercial property loans
- Stress test floor: 5.0%
- LTV caps: 45% (commercial), 55% (land)
- CPF usage restrictions

📋 MAS Notice CPF (Housing): CPF withdrawal rules
- Accrued interest calculation
- CPF usage limits by property type
```

**Validation checks:**

```bash
# If stress test rates changed
grep "STRESS_TEST" lib/calculations/instant-profile.ts

# Verify against constants:
grep "DR_ELENA_STRESS_TEST_FLOORS" lib/calculations/dr-elena-constants.ts

# Check for hardcoded values (violation):
❌ const stressTestRate = 4.0 // Hardcoded - should use constant
✅ const stressTestRate = DR_ELENA_STRESS_TEST_FLOORS.RESIDENTIAL // Correct
```

**Output:**
```markdown
🏛️ MAS Notice Compliance:

✅ Stress test rates use DR_ELENA_STRESS_TEST_FLOORS constant
✅ LTV limits reference DR_ELENA_LTV_LIMITS
⚠️  Line 156: Hardcoded 4.0% found - should use DR_ELENA_STRESS_TEST_FLOORS.RESIDENTIAL
   → MAS Notice 632 requires constant-based configuration for auditability
```

---

### Step 4: Validate Constant Updates

**Constants Synchronization Rule:**

```markdown
MANDATORY: constants must sync with dr-elena-mortgage-expert-v2.json

Process:
1. Update dr-elena-mortgage-expert-v2.json (source of truth)
2. Update dr-elena-constants.ts (code constants)
3. Update instant-profile.ts (implementation)
4. Update tests (verification)

❌ FORBIDDEN:
- Adding constants without updating JSON source
- Changing constant values without MAS Notice verification
- Renaming constants (breaking change)
```

**Validation checks:**

```bash
# If dr-elena-constants.ts modified
# Check if dr-elena-mortgage-expert-v2.json also modified

git status --short | grep "dr-elena"

# Expected:
M lib/calculations/dr-elena-constants.ts
M dr-elena-mortgage-expert-v2.json  ← Should be present

# If JSON missing:
⚠️  WARNING: dr-elena-constants.ts modified without dr-elena-mortgage-expert-v2.json update
```

**Output:**
```markdown
📊 Constant Synchronization:

✅ dr-elena-mortgage-expert-v2.json updated alongside dr-elena-constants.ts
✅ No constant name changes detected (no breaking changes)
⚠️  New constant added: DR_ELENA_MSR_LIMIT
   → Verify against MAS Notice before committing
   → Update tests/dr-elena-v2-regulation.test.ts
```

---

### Step 5: Validate Required Test Coverage

**Mandatory Tests for Dr Elena v2 Changes:**

```markdown
Three test files MUST be updated:

1. tests/calculations/instant-profile.test.ts
   - Unit tests for all calculation functions
   - Edge cases (zero income, max LTV, min down payment)

2. tests/dr-elena-v2-regulation.test.ts
   - Regulatory compliance tests
   - MAS Notice scenario validation
   - Rounding rule verification

3. tests/fixtures/dr-elena-v2-scenarios.ts
   - Real-world scenarios from Dr Elena v2 persona
   - Multi-property cases
   - Commercial vs residential
```

**Validation checks:**

```bash
# Check if tests modified when calculation files changed
git status --short | grep -E "(instant-profile|dr-elena)"

# Expected pattern:
M lib/calculations/instant-profile.ts
M tests/calculations/instant-profile.test.ts  ← Should be present
M tests/dr-elena-v2-regulation.test.ts  ← Should be present

# If tests missing:
❌ BLOCKED: Calculation changes without test updates
```

**Run tests:**

```bash
# Run Dr Elena v2 test suite
npm test -- tests/calculations/instant-profile.test.ts
npm test -- tests/dr-elena-v2-regulation.test.ts

# Capture results:
instant-profile.test.ts: 45/45 passing
dr-elena-v2-regulation.test.ts: 23/23 passing
```

**Output:**
```markdown
🧪 Test Coverage Validation:

✅ tests/calculations/instant-profile.test.ts updated
✅ tests/dr-elena-v2-regulation.test.ts updated
✅ tests/fixtures/dr-elena-v2-scenarios.ts reviewed

Test Results:
- instant-profile.test.ts: 45/45 passing
- dr-elena-v2-regulation.test.ts: 23/23 passing

⚠️  New function calculateMSR() added without tests
   → Add tests before committing per CLAUDE.md TDD mandate
```

---

### Step 6: Validate Interface Changes

**Contract Synchronization Rule:**

```markdown
If instant-profile.ts interfaces change:
→ MUST update lib/contracts/form-contracts.ts

Process:
1. Update form-contracts.ts (contracts first)
2. Update instant-profile.ts (implementation)
3. Update form components (consumers)
4. Update tests (verification)

Change Flow:
form-contracts.ts → instant-profile.ts → ProgressiveFormWithController.tsx → tests
```

**Validation checks:**

```bash
# If InstantProfileInput or InstantProfileResult changed
grep "interface InstantProfile" lib/calculations/instant-profile.ts

# Check form-contracts.ts for matching update
grep "InstantProfileInput\|InstantProfileResult" lib/contracts/form-contracts.ts

# Check form components
grep -r "InstantProfileInput" components/forms/
```

**Output:**
```markdown
🔗 Interface Synchronization:

✅ form-contracts.ts updated before instant-profile.ts (correct order)
✅ ProgressiveFormWithController.tsx uses updated interface
⚠️  Step3NewPurchase.tsx still uses old interface
   → Update before committing to avoid type errors
```

---

## Integration with NextNest Frameworks

### Works with CANONICAL_REFERENCES.md

```markdown
Enforces Tier 1 rules for:
- lib/calculations/instant-profile.ts (lines 80-107)
- lib/calculations/dr-elena-constants.ts (lines 111-131)

Validates:
✅ Rounding strategy (loans DOWN, payments UP, funds UP)
✅ Constant updates (JSON → constants → implementation)
✅ Test coverage (3 test files required)
✅ Interface synchronization (contracts → calculations → forms)

Prevents:
❌ Changing stress test rates without MAS verification
❌ Modifying constants without JSON source update
❌ Adding calculations without constant definitions
❌ Changing interfaces without contract updates
```

### Follows CLAUDE.md TDD Mandate

```markdown
Before allowing calculation changes:
1. ✅ Tests exist (instant-profile.test.ts, dr-elena-v2-regulation.test.ts)
2. ✅ Tests updated (new functions have tests)
3. ✅ Tests passing (X/X passing, no failures)

If tests not updated → BLOCKED status
```

### Integrates with Constraint System

```markdown
Reads active constraint from strategy-alignment-matrix.md

If calculation changes:
→ Should align with Constraint A (Public Surface Readiness)
→ Should have CAN task (e.g., CAN-037 for form validation)

If no CAN task → Warn and suggest creating one
```

### Syncs with Form Contracts

```markdown
Validates contract-first architecture:

✅ Correct order: form-contracts.ts → instant-profile.ts → forms
❌ Forbidden: instant-profile.ts → form-contracts.ts (backwards)

Checks:
- InstantProfileInput matches form data
- InstantProfileResult matches calculation output
- RefinanceOutlookInput/Result aligned
```

---

## Activation Triggers (Keywords)

**High confidence triggers:**
- "update calculation"
- "modify instant-profile"
- "change constants"
- "update MAS Notice"
- "rounding rule"
- File path: "lib/calculations/"

**Moderate confidence triggers:**
- "TDSR calculation"
- "MSR calculation"
- "LTV calculation"
- "stress test"
- "Dr Elena"

**Anti-triggers (DO NOT activate):**
- Form UI changes only
- Documentation updates
- Test-only changes
- Comment updates

---

## Output Examples

### Example 1: Rounding Rule Violation

```markdown
🚨 Dr Elena v2 Compliance Check

**File:** lib/calculations/instant-profile.ts
**Change:** Modified calculateInstantProfile() rounding logic

---

❌ ROUNDING RULE VIOLATION

Line 245:
const maxLoanAmount = Math.ceil(propertyPrice * ltv)

**Problem:** Loan amount rounded UP (increases client debt)

**Required:** Loan amounts must round DOWN per Dr Elena v2 client-protective rounding

**Fix:**
const maxLoanAmount = Math.floor(propertyPrice * ltv)

---

**Status:** ❌ BLOCKED - Fix rounding violation before committing
```

### Example 2: Missing Test Coverage

```markdown
🚨 Dr Elena v2 Compliance Check

**File:** lib/calculations/instant-profile.ts
**Change:** Added new function calculateMSR()

---

⚠️ MISSING TEST COVERAGE

New function: calculateMSR(income: number, totalDebt: number)

**Required tests:** None found

**Expected:**
1. tests/calculations/instant-profile.test.ts
   - Add describe('calculateMSR', ...) block
   - Test edge cases: zero income, max debt, negative values

2. tests/dr-elena-v2-regulation.test.ts
   - Add MSR compliance scenario
   - Verify MSR < 30% rule (MAS Notice 632)

3. tests/fixtures/dr-elena-v2-scenarios.ts
   - Add MSR test scenarios

---

**Status:** ❌ BLOCKED - Add tests before committing (CLAUDE.md TDD mandate)

**Next steps:**
1. Write failing test for calculateMSR()
2. Run test to confirm failure
3. Implement calculateMSR()
4. Run test to confirm passing
5. Re-run this compliance check
```

### Example 3: Hardcoded Constant Violation

```markdown
🚨 Dr Elena v2 Compliance Check

**File:** lib/calculations/instant-profile.ts
**Change:** Updated stress test calculation

---

⚠️ HARDCODED VALUE DETECTED

Line 312:
const stressTestRate = 0.04 // 4% residential stress test

**Problem:** MAS Notice 632 rates must use constants for auditability

**Required:** Use DR_ELENA_STRESS_TEST_FLOORS from dr-elena-constants.ts

**Fix:**
import { DR_ELENA_STRESS_TEST_FLOORS } from './dr-elena-constants'
const stressTestRate = DR_ELENA_STRESS_TEST_FLOORS.RESIDENTIAL

**Rationale:**
- MAS audits require traceability to official notices
- Constants link to dr-elena-mortgage-expert-v2.json (source of truth)
- Prevents drift between code and regulations

---

**Status:** ⚠️ CAUTION - Fix before committing for regulatory compliance
```

### Example 4: All Checks Passing

```markdown
✅ Dr Elena v2 Compliance Check

**File:** lib/calculations/instant-profile.ts
**Change:** Updated calculateInstantProfile() TDSR logic

---

✅ Rounding Rules: All correct
- Line 245: maxLoanAmount = Math.floor() ✅ (loans DOWN)
- Line 312: monthlyPayment = Math.ceil() ✅ (payments UP)
- Line 428: cashRequired = Math.ceil() ✅ (funds UP)

✅ MAS Notice Compliance: All constants used
- Stress test rates: DR_ELENA_STRESS_TEST_FLOORS ✅
- LTV limits: DR_ELENA_LTV_LIMITS ✅
- Income recognition: DR_ELENA_INCOME_RECOGNITION ✅

✅ Constant Synchronization: JSON source updated
- dr-elena-mortgage-expert-v2.json modified ✅
- dr-elena-constants.ts synced ✅

✅ Test Coverage: All tests updated and passing
- instant-profile.test.ts: 47/47 passing ✅
- dr-elena-v2-regulation.test.ts: 24/24 passing ✅
- New TDSR scenario added to dr-elena-v2-scenarios.ts ✅

✅ Interface Synchronization: Contracts first
- form-contracts.ts updated first ✅
- instant-profile.ts implementation ✅
- ProgressiveFormWithController.tsx compatible ✅

---

**Status:** ✅ APPROVED - All Dr Elena v2 compliance checks passed

**Evidence:** Tests passing, rounding rules correct, MAS Notice compliance verified

**Safe to commit:** Yes
```

### Example 5: Missing JSON Source Update

```markdown
🚨 Dr Elena v2 Compliance Check

**File:** lib/calculations/dr-elena-constants.ts
**Change:** Added new constant DR_ELENA_MSR_LIMIT

---

⚠️ MISSING JSON SOURCE UPDATE

New constant added: DR_ELENA_MSR_LIMIT = 0.30

**Problem:** dr-elena-mortgage-expert-v2.json NOT modified

**Required Process:**
1. Update dr-elena-mortgage-expert-v2.json first (source of truth)
2. Add MSR_LIMIT to appropriate section
3. Document MAS Notice reference (likely Notice 632)
4. Then update dr-elena-constants.ts

**Current state:**
❌ dr-elena-mortgage-expert-v2.json: No changes
✅ dr-elena-constants.ts: Modified

**Correct order:**
1. dr-elena-mortgage-expert-v2.json (source of truth)
2. dr-elena-constants.ts (code constants)
3. instant-profile.ts (implementation)
4. tests (verification)

---

**Status:** ❌ BLOCKED - Update JSON source before committing

**Fix:** Update dr-elena-mortgage-expert-v2.json with MSR_LIMIT and MAS Notice reference
```

---

## Special Cases

### Case 1: Archived File Modification

```markdown
⚠️ ARCHIVED FILE MODIFICATION DETECTED

File: lib/calculations/archive/2025-10/dr-elena-mortgage.ts

**Problem:** This file is archived and superseded by instant-profile.ts

**Status:** ❌ ARCHIVED (2025-10-17)
**Reason:** Superseded by instant-profile.ts with adapter pattern

**Action:** Do NOT modify archived files

**If you need to change calculation logic:**
1. Modify lib/calculations/instant-profile.ts instead
2. Update adapter in dr-elena-integration-service.ts if needed
3. Run full test suite to verify backward compatibility

---

**Recommendation:** Abort changes to archived file, work in instant-profile.ts
```

### Case 2: Breaking Interface Change

```markdown
🚨 BREAKING CHANGE DETECTED

File: lib/contracts/form-contracts.ts

**Change:** Renamed InstantProfileInput → LoanProfileInput

**Impact Analysis:**
❌ BREAKING CHANGE - This affects:
- lib/calculations/instant-profile.ts (import)
- components/forms/ProgressiveFormWithController.tsx (type)
- components/forms/sections/Step3NewPurchase.tsx (type)
- tests/calculations/instant-profile.test.ts (type)

**Files to update:** 4+ files

**Status:** ⚠️ MAJOR CHANGE - Requires coordination

**Recommendation:**
1. Create CAN task for interface rename (scope: 4+ files)
2. Create plan in docs/plans/active/
3. Update all consumers in single commit
4. Run full test suite before committing

Or:

**Alternative:** Keep InstantProfileInput name (avoid breaking change)

---

**Ask Brent:** "Should we proceed with interface rename or avoid breaking change?"
```

### Case 3: Regulation Update

```markdown
📋 MAS NOTICE UPDATE DETECTED

File: dr-elena-mortgage-expert-v2.json

**Change:** Updated DR_ELENA_STRESS_TEST_FLOORS.RESIDENTIAL from 4.0% to 4.5%

**Regulation:** MAS Notice 632 (updated 2025-11-01)

---

✅ Regulation Update Checklist:

**JSON Source:**
- ✅ dr-elena-mortgage-expert-v2.json updated
- ✅ MAS Notice reference documented
- ✅ Effective date noted (2025-11-01)

**Code Constants:**
- ✅ dr-elena-constants.ts synced
- ✅ DR_ELENA_POLICY_REFERENCES updated

**Implementation:**
- ⚠️ instant-profile.ts: Not yet modified
  → Update calculateInstantProfile() to use new rate

**Tests:**
- ⚠️ dr-elena-v2-regulation.test.ts: Not yet updated
  → Update expected values to match new 4.5% rate

**Documentation:**
- ⚠️ Consider updating runbooks/mortgage/stress-test-guide.md

---

**Status:** 🟡 IN PROGRESS - Complete implementation and tests

**Next steps:**
1. Update instant-profile.ts calculation (should auto-pick up constant)
2. Update test expectations (4.0% → 4.5%)
3. Run test suite
4. Document in work-log.md
```

---

## Error Handling

### Error 1: Cannot Determine Dr Elena v2 Rules

```markdown
❌ Cannot validate Dr Elena v2 compliance

**Reason:** CANONICAL_REFERENCES.md not found or corrupted

**Expected location:** /CANONICAL_REFERENCES.md

**Fallback:** Manual validation required

**Checklist for manual validation:**
1. Rounding: Loans DOWN, Payments UP, Funds UP
2. Constants: All values from dr-elena-constants.ts (no hardcoding)
3. Tests: instant-profile.test.ts + dr-elena-v2-regulation.test.ts updated
4. Interfaces: form-contracts.ts updated before instant-profile.ts

**Action:** Restore CANONICAL_REFERENCES.md from git history
```

### Error 2: Test Execution Failed

```markdown
❌ Cannot verify test coverage

**Command failed:** npm test -- tests/calculations/instant-profile.test.ts

**Error:**
TypeError: Cannot read property 'calculateInstantProfile' of undefined
  at instant-profile.test.ts:45

**Problem:** Tests are broken (likely due to calculation changes)

**Status:** ❌ BLOCKED - Fix tests before proceeding

**Required:**
1. Fix failing tests
2. All tests must pass
3. Re-run compliance check

**Reminder:** CLAUDE.md TDD mandate - Never commit failing tests
```

### Error 3: Git Status Unavailable

```markdown
⚠️ Cannot detect changed files

**Reason:** git status command failed

**Fallback:** Manual file specification required

**Ask user:** "Which calculation files did you modify?"

**Expected answers:**
- instant-profile.ts
- dr-elena-constants.ts
- Other calculation files

**Then:** Run compliance checks on specified files
```

---

## Best Practices

### When to Run This Skill

**✅ Good times:**
- Before committing calculation changes
- After modifying MAS constants
- When updating stress test rates
- When adding new calculation functions
- Before merging calculation PRs

**❌ Bad times:**
- For non-calculation changes
- When only updating comments
- During documentation-only updates

### Compliance Workflow

**Recommended flow:**

```markdown
1. Check alignment: /check-alignment "update TDSR calculation"
2. Write failing test (TDD)
3. Update dr-elena-mortgage-expert-v2.json (if constants changed)
4. Update dr-elena-constants.ts (sync with JSON)
5. Update instant-profile.ts (implementation)
6. Run dr-elena-compliance-checker (this skill)
7. Fix violations (if any)
8. Run tests (all passing)
9. Commit with evidence
10. Update work-log.md
```

### Integration with Slash Commands

**Sequential workflow:**

```markdown
Before calculation work:
→ /check-alignment [work]

During calculation work:
→ dr-elena-compliance-checker (auto-activates)

After calculation work:
→ evidence-collector (auto-activates on "done")
→ /alignment-gaps (weekly drift check)
```

---

## Performance

**Execution time:** ~15-20 seconds
- Git file detection: 1-2s
- Rounding rule scan: 3-5s
- Constant validation: 2-3s
- Test execution: 5-10s
- Report generation: 1-2s

**Context usage:** ~800-1200 tokens
- CANONICAL_REFERENCES parsing
- File content scanning
- Test result parsing
- Violation reporting

**Optimization:** Caches CANONICAL_REFERENCES.md rules to avoid repeated reads

---

## Version

**Skill Version:** 1.0
**Created:** 2025-11-04
**Updated:** 2025-11-04
**Integrates With:** CANONICAL_REFERENCES.md, CLAUDE.md TDD, form-contracts.ts, strategy-alignment-matrix, constraint system
**Regulatory Compliance:** MAS Notice 632 (residential), MAS Notice 645 (commercial), Dr Elena v2 persona

**Dr Elena v2 Source:** `dr-elena-mortgage-expert-v2.json` (persona definition)
**Test Coverage:** Requires 3 test files (instant-profile, regulation, scenarios)
**Rounding Standard:** Client-protective (loans DOWN, payments UP, funds UP)
