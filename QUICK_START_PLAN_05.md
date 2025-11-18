# Plan 05 Quick Start Checklist
**For developer with zero EIP context**

## ⏰ TIME ESTIMATE: 12-16 hours total

## 📋 PRE-WORK (15 minutes)
- [ ] Read `docs/eip/prd.md` lines 0-20 (Principles + Two-pass QA)
- [ ] Read `ip_library/framework@1.0.0.yaml` (understand IP structure)
- [ ] Run `npm test` to confirm system works
- [ ] Read `docs/plans/active/05-auditor-and-repairer-IMPLEMENTATION-GUIDE.md`

## 🔧 FILE LOCATIONS TO KNOW
```
Primary Files:
- orchestrator/auditor.ts     # ✅ EXISTS - modify this
- orchestrator/repairer.ts    # ✅ EXISTS - modify this
- tests/orchestrator/auditor.test.ts  # ✅ EXISTS - modify this
- tests/orchestrator/repairer.test.ts # ✅ EXISTS - modify this

Reference Files:
- orchestrator/controller.ts     # See how audit/repair is called
- ip_library/framework@1.0.0.yaml # Understand IP structure
- docs/eip/prd.md                 # Domain knowledge
```

## 🎯 EXACTLY WHAT TO DO

### **Day 1: Foundation (4-6 hours)**
1. **Run existing tests:** `npm test tests/orchestrator/auditor.test.ts`
2. **Implement detectCriticalTags()** in `orchestrator/auditor.ts`
3. **Test all 10 tag types** in `tests/orchestrator/auditor.test.ts`
4. **Commit:** "feat(auditor): implement core tag detection"

### **Day 2: Repair & Integration (6-8 hours)**
1. **Implement applyMinimalFixes()** in `orchestrator/repairer.ts`
2. **Write repairer tests** in `tests/orchestrator/repairer.test.ts`
3. **Run integration tests:** `npm test tests/orchestrator/pipeline-e2e.test.ts`
4. **Commit:** "feat(repairer): implement diff-bounded repairs"

### **Day 3: Polish & Verify (2-4 hours)**
1. **Fix any test failures**
2. **Add documentation comments**
3. **Run full test suite:** `npm test`
4. **Final commit:** "feat(plan-05): complete auditor and repairer implementation"

## 🚨 CRITICAL REQUIREMENTS

### **THE 10 TAGS ONLY:**
```
NO_MECHANISM, NO_COUNTEREXAMPLE, NO_TRANSFER, EVIDENCE_HOLE,
LAW_MISSTATE, DOMAIN_MIXING, CONTEXT_DEGRADED, CTA_MISMATCH,
ORPHAN_CLAIM, SCHEMA_MISSING
```
**DO NOT** add any other tags. Just these 10.

### **BUDGET AWARENESS:**
- LIGHT tier: 20s, 1400 tokens
- MEDIUM tier: 45s, 2400 tokens
- HEAVY tier: 90s, 4000 tokens

### **NO REWRITES:**
- Auditor = tag detection only
- Repairer = minimal patches only (±3 sentences)

## ✅ SUCCESS METRICS
- [ ] All 10 tags detected with >90% accuracy
- [ ] Repairer changes max 3 sentences per fix
- [ ] Test coverage >85%
- [ ] All existing tests still pass
- [ ] Performance within budget limits

## 🆘 IF YOU GET STUCK
1. **Check with me before implementing complex solutions**
2. **Look at existing test patterns** in other test files
3. **Keep it simple** - YAGNI principle
4. **Focus on the 10 tags only** - don't add features

## 📞 READY TO START?
If you've read the implementation guide and this checklist, you're ready to begin with Task 1.

**Current status:** Plan 04 ✅ COMPLETE → Ready for Plan 05 🚀