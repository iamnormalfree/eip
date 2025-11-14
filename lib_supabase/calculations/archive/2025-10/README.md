# Archived Calculation Files

**Date:** 2025-10-18
**Reason:** Migration to Dr Elena v2 calculation engine

---

## mortgage.ts (Archived 2025-10-18)

**Why archived:**
- Legacy calculation file (319 lines) replaced by production `instant-profile.ts` (916 lines)
- Used hardcoded MAS constants instead of Dr Elena v2 persona constants
- Missing persona-driven reason codes and policy references

**What was migrated:**
All 3 still-used utility functions moved to `instant-profile.ts`:
- `calculateIWAA()` - Income-weighted average age
- `getPlaceholderRate()` - Default interest rates by property type
- `calculateRefinancingSavings()` - Simplified refinance savings calculator

**What was deprecated:**
- `calculateMortgage()` - Basic mortgage formula (replaced by `calculateInstantProfile()`)
- `calculateSingaporeMetrics()` - TDSR/MSR/LTV (replaced by `calculateInstantProfile()`)
- `calculateMortgageWithMetrics()` - Combined calculator (replaced by instant-profile functions)
- `calculateLeadScore()` - Lead scoring (now in `useProgressiveFormController.ts`)
- `calculateInstantEligibility()` - New purchase calc (replaced by `calculateInstantProfile()`)
- `MortgageInputSchema` - Zod schema (may be useful reference)
- `MORTGAGE_SCENARIOS` - Predefined scenarios (may be useful reference)

**Production replacement:**
`lib/calculations/instant-profile.ts` is the canonical calculation engine (Tier 1 in CANONICAL_REFERENCES.md)

**Last import removed:**
`hooks/useProgressiveFormController.ts:17-24` updated to import from instant-profile.ts (2025-10-18)

**Historical context:**
This file was the original mortgage calculator before Dr Elena v2 persona was introduced. Kept for reference but no longer imported by any production code.
