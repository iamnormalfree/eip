# Plan 05 Implementation Guide - Micro-Auditor & Repairer
**Developer assumes zero context** - Everything you need to know is documented here

## 🎯 GOAL

Implement a quality enhancement layer for the EIP content generation pipeline:
- **Micro-Auditor**: Detects 10 critical quality tags (no content rewrites)
- **Repairer**: Applies minimal, targeted fixes (±3 sentences only)
- **Single Escalation**: Generator → Audit → Repair → Re-audit (max)

## 📚 REQUIRED READING (15 minutes max)

### **Context Files to Understand FIRST:**
1. `docs/eip/prd.md` - Read Principles (lines 0-20) and Two-pass QA (line 10)
2. `ip_library/framework@1.0.0.yaml` - See IP structure (invariants, sections)
3. `orchestrator/controller.ts` - Read lines 290-320 (current audit/repair integration)

### **Problem Domain:**
We generate educational content using "Educational IPs" - reusable thinking patterns. The generator creates drafts, but we need quality validation and minimal fixes. Think of this as a smart spell-checker for educational content quality.

### **Key Constraints:**
- **NO REWRITES** - Auditor only tags, doesn't fix content
- **DIFF-BOUNDED** - Repairer only changes ±3 sentences around issues
- **10 TAGS ONLY** - Don't invent new quality metrics
- **TIER-ED APPROACH** - LIGHT/MEDIUM/HEAVY budgets matter

## 🔧 TECHNICAL CONTEXT

### **Toolchain You'll Use:**
- **OpenAI API** - Already configured in `lib_supabase/ai/`
- **Jest** - Testing framework (see `jest.config.js`)
- **TypeScript** - Strong typing required
- **YAML** - IP definitions stored in YAML format

### **Current Code Structure:**
```
orchestrator/
├── auditor.ts     # ✅ EXISTS - basic structure, needs tag implementation
├── repairer.ts    # ✅ EXISTS - basic structure, needs diff-bounded logic
├── controller.ts  # ✅ EXISTS - calls microAudit() and repairDraft()
ip_library/
├── framework@1.0.0.yaml  # Example IP structure
└── *.yaml               # All IP definitions
tests/
├── orchestrator/auditor.test.ts  # ✅ EXISTS - update with new tests
└── orchestrator/repairer.test.ts # ✅ EXISTS - update with new tests
```

## 🏗️ THE 10 CRITICAL TAGS (from PRD v1)

These are the ONLY tags you should detect. Nothing else:

```typescript
const CRITICAL_TAGS = [
  'NO_MECHANISM',      // Missing "how it works" explanation
  'NO_COUNTEREXAMPLE', // Missing failure case example
  'NO_TRANSFER',       // Missing application to different context
  'EVIDENCE_HOLE',     // Claims without supporting evidence
  'LAW_MISSTATE',      // Legal/statutory inaccuracies
  'DOMAIN_MIXING',     // Mixing incompatible domains
  'CONTEXT_DEGRADED',  // Context lost or misapplied
  'CTA_MISMATCH',      // Call-to-action doesn't match content
  'ORPHAN_CLAIM',      // Claims without support
  'SCHEMA_MISSING'     // Missing required IP structure
];
```

## 📋 IMPLEMENTATION PLAN (7 Bite-Sized Tasks)

### **Task 1: Understand Current Auditor Structure (1 hour)**
**Files to Read:**
- `orchestrator/auditor.ts` - entire file
- `tests/orchestrator/auditor.test.ts` - existing tests

**What You'll See:**
- Basic TypeScript interfaces already defined
- Mock implementation for testing
- Integration point in controller.ts

**Deliverable:** Run existing tests to confirm they pass
```bash
npm test tests/orchestrator/auditor.test.ts
```

### **Task 2: Implement Core Tag Detection (2 hours)**
**File to Touch:** `orchestrator/auditor.ts`

**Code Pattern to Follow:**
```typescript
// Add this function to auditor.ts
async function detectCriticalTags(draft: string, ip: string): Promise<QualityTag[]> {
  const prompt = `
You are a content quality auditor. Check this educational content for CRITICAL flaws only.

IP: ${ip}
Content: ${draft}

Return JSON with these tags ONLY: ${CRITICAL_TAGS.join(', ')}
For each tag found: {tag, section, rationale: max 18 words, span_hint}

NO REWRITES. Only tag detection.
`;

  const result = await callOpenAI(prompt);
  return parseAIResponse(result); // Your parsing logic
}
```

**Testing Strategy:**
- Write tests for content WITH and WITHOUT each tag type
- Test edge cases: empty content, malformed content
- Verify no false positives

### **Task 3: Write Comprehensive Auditor Tests (2 hours)**
**File to Touch:** `tests/orchestrator/auditor.test.ts`

**Test Pattern:**
```typescript
describe('Critical Tag Detection', () => {
  it('should detect NO_MECHANISM when missing "how it works"', () => {
    const content = "This is important. You should do it."; // No mechanism
    const result = await microAudit({ draft: content, ip: 'framework@1.0.0' });
    expect(result.tags).toContainEqual(
      expect.objectContaining({ tag: 'NO_MECHANISM' })
    );
  });

  // Similar tests for all 10 tags...
});
```

### **Task 4: Implement Diff-Bounded Repairer (3 hours)**
**File to Touch:** `orchestrator/repairer.ts`

**Key Algorithm:**
```typescript
async function applyMinimalFixes(draft: string, tags: QualityTag[]): Promise<RepairResult> {
  let repairedDraft = draft;
  const fixesApplied = [];

  for (const tag of tags.filter(t => t.auto_fixable)) {
    // Find problematic section (±3 sentences from span_hint)
    const section = extractSection(repairedDraft, tag.span_hint, 3);

    // Generate minimal fix for this section only
    const fix = await generateFix(section, tag);

    // Apply fix with sentence boundaries preserved
    repairedDraft = replaceSection(repairedDraft, section, fix);

    fixesApplied.push({
      tag: tag.tag,
      action: 'minimal_patch',
      changes_made: 1,
      confidence: 0.8
    });

    // IMPORTANT: Only fix tags marked as auto_fixable
  }

  return { repaired_draft: repairedDraft, fixes_applied: fixesApplied };
}
```

### **Task 5: Write Repairer Tests (2 hours)**
**File to Touch:** `tests/orchestrator/repairer.test.ts`

**Test Cases:**
```typescript
describe('Diff-Bounded Repairer', () => {
  it('should fix NO_MECHANISM by adding 1-2 sentences', async () => {
    const content = "Social media marketing is essential for businesses.";
    const audit = { tags: [{ tag: 'NO_MECHANISM', auto_fixable: true, section: 'Overview' }] };

    const result = await repairDraft({ draft: content, audit });

    // Should add mechanism explanation without rewriting everything
    expect(result.repaired_draft).toContain('works by');
    expect(result.fixes_applied).toHaveLength(1);
    // Verify change is localized (diff-bounded)
  });
});
```

### **Task 6: Integration Testing (1 hour)**
**Files to Touch:** None - run integration tests

**Commands:**
```bash
npm test tests/orchestrator/controller-integration.test.ts
npm test tests/orchestrator/pipeline-e2e.test.ts
```

**What to Verify:**
- Auditor is called by controller
- Repairer is called when audit finds fixable issues
- Re-audit happens after repair
- No infinite loops

### **Task 7: Documentation & Smoke Test (1 hour)**
**Files to Touch:** None - update comments

**Tasks:**
- Add inline comments explaining your approach
- Update function documentation
- Run smoke test:
```bash
npm run orchestrator:dev
# Submit a test brief through the system
```

## 🧪 TESTING STRATEGY (IMPORTANT)

### **Test-Driven Development (TDD) Approach:**
1. **Write test FIRST** for each tag type
2. **Implement minimal code** to make test pass
3. **Refactor** while keeping tests green
4. **Commit** after each working feature

### **Good Test Design:**
```typescript
// ✅ GOOD - Specific, testable, clear expected result
it('detects NO_MECHANISM when content lacks causal explanation', () => {
  const contentWithoutMechanism = "Marketing is important for growth.";
  const result = await microAudit({ draft: contentWithoutMechanism, ip: 'framework@1.0.0' });
  expect(result.tags.some(tag => tag.tag === 'NO_MECHANISM')).toBe(true);
});

// ❌ BAD - Vague, tests implementation details
it('should work correctly' () => {
  // Tests nothing specific
});
```

### **Test Coverage Requirements:**
- Each of the 10 tags needs positive/negative test cases
- Edge cases: empty content, very long content, malformed content
- Integration tests with actual controller flow
- Performance tests: should complete within budget limits

## 🚨 FREQUENT COMMITS STRATEGY

Commit after each working task:
```bash
git add orchestrator/auditor.ts tests/orchestrator/auditor.test.ts
git commit -m "feat(auditor): implement core tag detection for 10 critical tags

- ✅ NO_MECHANISM detection with mechanism pattern matching
- ✅ NO_COUNTEREXAMPLE detection for missing failure cases
- ✅ Test coverage for all tag types
- 🚀 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 🔧 HELPER FUNCTIONS TO USE

### **OpenAI Integration:**
```typescript
// Use existing AI infrastructure
import { generateContent } from '../lib_supabase/ai/openai-client';

const result = await generateContent({
  prompt: yourPrompt,
  model: 'gpt-4',
  maxTokens: 500,
  temperature: 0.1 // Low temperature for consistency
});
```

### **Text Processing Helpers:**
```typescript
// Extract sentences around a span
function extractSection(text: string, spanHint: string, windowSize: number): string {
  // Implementation to get ±windowSize sentences around spanHint
}

// Count sentences in text
function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}
```

## ⚠️ COMMON PITFALLS TO AVOID

1. **Over-engineering** - Keep it simple. Only the 10 tags listed.
2. **Rewriting content** - Auditor should NEVER rewrite, only tag.
3. **Large patches** - Repairer should only change ±3 sentences.
4. **No budget awareness** - Check token usage stays within limits.
5. **Poor testing** - Test both positive and negative cases.

## 🆘 GETTING HELP

If you're unsure about anything:
1. **Check with me before** implementing complex features
2. **Look at existing code** in `orchestrator/` for patterns
3. **Run tests frequently** - catch issues early
4. **Keep it simple** - YAGNI principle applies

## ✅ SUCCESS CRITERIA

You're done when:
- [ ] All 10 critical tags are detected accurately
- [ ] Repairer applies minimal fixes only (±3 sentences)
- [ ] All tests pass (>90% coverage)
- [ ] Integration with controller works
- [ ] No performance budget overruns
- [ ] Documentation is clear

**Estimated Time:** 12-16 hours total
**Next Step:** Move to Plan 06 (Publisher & Templates)

---

*Remember: DRY, YAGNI, TDD, frequent commits. You're building quality enhancement, not rewriting the system.*