# FoP Whelm Workflow Readiness Implementation Plan

> **Execution note:** Before implementation, copy this plan into `docs/plans/active/` per repo convention.

**Goal:** Make EIP production-ready for Fear-on-Paper with deterministic queue behavior, IM-aligned templates, and strict reliability gates.

**Architecture:** Sequential phases - fix test stability first, then queue hardening, then template alignment, then docs. Each phase builds on the previous.

**Tech Stack:** Jest, TypeScript, Node.js, Redis/BullMQ, Supabase, YAML templates

---

## Prerequisites

1. Optional isolated worktree:
```bash
git worktree add -b fop-whelm-workflow ../fop-whelm-workflow
cd ../fop-whelm-workflow
```

2. Verify current state:
```bash
npm run test:smoke 2>&1 | tail -10
npm run ip:validate 2>&1 | tail -5
```

---

## Phase 1: Reliability Baseline

### Task 1: Fix uuid ESM/Jest Path Resolution

**Files:**
- Modify: `config/jest/jest.eip.config.js` (active config used by scripts)
- Check: `jest.eip.config.js` shim
- Check: `orchestrator/database.ts` import paths

**Step 1: Verify uuid mapping is in config**

Run: `grep -n "uuid" config/jest/jest.eip.config.js`
Expected: Line with `'^uuid$': '<rootDir>/node_modules/uuid/dist/index.js'`

**Step 2: Test uuid import in isolation**

Run: `node -e "const { v4: uuidv4 } = require('uuid'); console.log(uuidv4())"`
Expected: Valid UUID printed

**Step 3: Run controller-real test to check current failure**

Run: `npm run test:orchestrator -- --testPathPatterns="controller-real" 2>&1 | tail -30`
Expected: Shows uuid parse error or other failure

**Step 4: If failure persists, fix Jest config (not runtime imports)**

Read: `config/jest/jest.eip.config.js` and verify:
- `moduleNameMapper` for `uuid`, `uuid/(.*)`, `uuid/dist-node/(.*)`
- `transformIgnorePatterns` allows uuid transforms

**Step 5: Verify fix**

Run: `npm run test:orchestrator -- --testPathPatterns="controller-real" 2>&1 | grep -E "PASS|FAIL"`
Expected: PASS

**Step 6: Commit**

```bash
git add config/jest/jest.eip.config.js jest.eip.config.js
git commit -m "fix(test): resolve uuid ESM import in controller tests"
```

---

### Task 2: Isolate External-Dependency Tests

**Files:**
- Create: `jest.integration-env.config.js`
- Modify/Move: env-coupled tests to `tests/integration-env/`
- Modify: `package.json` test scripts

**Step 1: Identify env-coupled tests**

Run: `rg -n "SUPABASE_URL|REDIS_URL|real.*database" tests | head -10`
Expected: List of tests with external dependencies

**Step 2: Move env-coupled tests to dedicated bucket**

Move: `tests/orchestrator/compliance-database-migration.test.ts`
To: `tests/integration-env/compliance-database-migration.integration-env.test.ts`

**Step 3: Create integration-env config**

Write: `jest.integration-env.config.js`
```javascript
const { projects, ...base } = require('./jest.eip.config.js');

module.exports = {
  ...base,
  roots: ['<rootDir>/tests/integration-env'],
  testMatch: ['**/tests/integration-env/**/*.integration-env.test.ts'],
  testTimeout: 60000,
  maxWorkers: 1
};
```

**Step 4: Ensure default suite excludes integration-env**

No config change required if files are moved out `tests/orchestrator/` into `tests/integration-env/`, because active Jest projects only match:
- `tests/db/**/*.test.ts`
- `tests/orchestrator/**/*.test.ts`
- `tests/src/**/*.test.tsx`

**Step 5: Add integration-env test script**

Modify: `package.json`
```json
{
  "test:integration:env": "jest --config jest.integration-env.config.js --runInBand"
}
```

**Step 6: Verify default tests exclude integration**

Run: `npx jest --config jest.eip.config.js --listTests | rg "integration-env|compliance-database-migration"`
Expected: No output

**Step 7: Commit**

```bash
git add jest.integration-env.config.js package.json tests/integration-env/
git commit -m "test: isolate env-coupled tests from default runs"
```

---

### Task 3: Make Core Suites Green - Retrieval

**Files:**
- Test: `tests/retrieval/*.test.ts`
- Fix: `orchestrator/retrieval.ts`

**Step 1: Run retrieval tests**

Run: `npm run test:retrieval 2>&1 | tail -40`
Expected: Shows failures

**Step 2: Identify first failure**

Run: `npm run test:retrieval 2>&1 | grep -E "FAIL|✕" | head -5`
Expected: First failing test name

**Step 3: Read failing test and source**

Read: The failing test file to understand what it expects
Read: `orchestrator/retrieval.ts` to understand current implementation

**Step 4: Fix root cause (TDD approach)**

Write failing test first (if not exists), then fix implementation

**Step 5: Re-run retrieval tests**

Run: `npm run test:retrieval 2>&1 | grep -E "Tests:|PASS|FAIL"`
Expected: All pass

**Step 6: Commit**

```bash
git add tests/retrieval/ orchestrator/retrieval.ts
git commit -m "fix(retrieval): resolve test failures"
```

---

### Task 4: Make Core Suites Green - Auditor/Repairer

**Files:**
- Test: `tests/orchestrator/auditor*.test.ts`, `tests/orchestrator/repairer*.test.ts`
- Fix: `orchestrator/auditor.ts`, `orchestrator/repairer.ts`

**Step 1: Run auditor tests**

Run: `npm run test:auditor 2>&1 | tail -40`
Expected: Shows failures

**Step 2: Identify repairer-plan05 failures**

Run: `npm run test:auditor 2>&1 | grep -E "repairer-plan05|FAIL" | head -10`
Expected: Specific failure messages

**Step 3: Read repairer-plan05 test**

Read: `tests/orchestrator/repairer-plan05.test.ts`
Find: What expectations are failing around "mechanism insertion"

**Step 4: Fix repairer to match expectations**

Read: `orchestrator/repairer.ts`
Fix: Ensure mechanism insertion logic matches test expectations

**Step 5: Re-run auditor tests**

Run: `npm run test:auditor 2>&1 | grep -E "Tests:|PASS|FAIL"`
Expected: All pass

**Step 6: Commit**

```bash
git add tests/orchestrator/repairer*.test.ts orchestrator/repairer.ts
git commit -m "fix(auditor): resolve repairer test failures"
```

---

### Task 5: Make Core Suites Green - Compliance

**Files:**
- Test: `tests/compliance/*.test.ts`, `tests/orchestrator/*compliance*.test.ts`
- Fix: `orchestrator/database-compliance.ts`, compliance modules

**Step 1: Run compliance tests**

Run: `npm run test:compliance 2>&1 | tail -40`
Expected: Shows failures

**Step 2: Identify disclaimer generator failures**

Run: `npm run test:compliance 2>&1 | grep -E "disclaimer|FAIL" | head -10`
Expected: Specific mismatch details

**Step 3: Read disclaimer generator test**

Read: `tests/compliance/disclaimer-generator.test.ts`
Find: What behavior is expected vs actual

**Step 4: Fix disclaimer generator**

Read: Find disclaimer generation logic (likely in compliance module)
Fix: Align behavior with test expectations

**Step 5: Re-run compliance tests**

Run: `npm run test:compliance 2>&1 | grep -E "Tests:|PASS|FAIL"`
Expected: All pass

**Step 6: Commit**

```bash
git add tests/compliance/ orchestrator/database-compliance.ts
git commit -m "fix(compliance): resolve disclaimer generator mismatches"
```

---

### Task 6: Verify All Core Suites Green

**Files:**
- Test: All core test suites

**Step 1: Run smoke test**

Run: `npm run test:smoke 2>&1 | tail -10`
Expected: PASS

**Step 2: Run retrieval**

Run: `npm run test:retrieval 2>&1 | grep -E "Tests:|Suites:"`
Expected: All pass

**Step 3: Run orchestrator**

Run: `npm run test:orchestrator 2>&1 | grep -E "Tests:|Suites:"`
Expected: All pass

**Step 4: Run auditor**

Run: `npm run test:auditor 2>&1 | grep -E "Tests:|Suites:"`
Expected: All pass

**Step 5: Run compliance**

Run: `npm run test:compliance 2>&1 | grep -E "Tests:|Suites:"`
Expected: All pass

**Step 6: Run integration**

Run: `npm run test:integration 2>&1 | tail -20`
Expected: All pass (or env-dependent failures isolated)

**Step 7: Commit**

```bash
git commit -m "test: verify all core suites green"
```

---

## Phase 2: Queue Policy Hardening

### Task 7: Add EIP_QUEUE_STRICT Mode

**Files:**
- Modify: `orchestrator/controller.ts`
- Create: `tests/orchestrator/queue-strict.test.ts`

**Step 1: Check current queue fallback behavior**

Run: `grep -n "fallback_to_direct\|runViaQueue" orchestrator/controller.ts | head -20`
Expected: Current fallback logic locations

**Step 2: Add EIP_QUEUE_STRICT env check**

Modify: `orchestrator/controller.ts` - add near top:
```typescript
const isQueueStrict = () => process.env.EIP_QUEUE_STRICT === 'true';
```

**Step 3: Modify runViaQueue to respect strict mode**

Read: `orchestrator/controller.ts` lines 88-230
Modify: Wrap fallback logic:
```typescript
async function runViaQueue(input: Brief): Promise<{ success: boolean; artifact?: any; error?: string; queue_job_id?: string }> {
  try {
    // Queue submission logic...
    return { success: true, artifact: result, queue_job_id: job.id };
  } catch (error) {
    // STRICT MODE: Fail fast, no fallback
    if (isQueueStrict()) {
      return { success: false, error: `Queue failed (strict mode): ${error.message}` };
    }
    // Non-strict: fallback to direct
    console.warn('[QUEUE FALLBACK] Falling back to direct execution:', error.message);
    return await runDirectly(input);
  }
}
```

**Step 4: Write queue strict mode tests**

Write: `tests/orchestrator/queue-strict.test.ts`
```typescript
describe('Queue Strict Mode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should fail fast when EIP_QUEUE_STRICT=true and queue fails', async () => {
    process.env.EIP_QUEUE_STRICT = 'true';
    // Mock queue to throw
    // Call runViaQueue and expect failure with no fallback
  });

  it('should fallback to direct when EIP_QUEUE_STRICT is not set', async () => {
    delete process.env.EIP_QUEUE_STRICT;
    // Mock queue to throw
    // Call runViaQueue and expect fallback to direct
  });
});
```

**Step 5: Run queue strict tests**

Run: `npm run test:orchestrator -- --testNamePattern="Queue Strict" 2>&1 | tail -20`
Expected: Tests pass

**Step 6: Commit**

```bash
git add orchestrator/controller.ts tests/orchestrator/queue-strict.test.ts
git commit -m "feat(queue): add EIP_QUEUE_STRICT mode for fail-fast behavior"
```

---

### Task 8: Verify No Silent Fallback in Strict Mode

**Files:**
- Test: `tests/orchestrator/queue-strict.test.ts`

**Step 1: Run full queue integration test**

Run: `npm run test:orchestrator -- --testNamePattern="queue" 2>&1 | grep -E "PASS|FAIL|fallback"`
Expected: No silent fallback when strict

**Step 2: Verify env var is documented**

Add to `.env.example`:
```
# Queue behavior
EIP_QUEUE_STRICT=true  # Set to true in production to fail fast (no fallback)
```

**Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: document EIP_QUEUE_STRICT in env template"
```

---

## Phase 3: FoP Alignment

### Task 9: Rewrite FoP Templates to IM-Congruent Structure

**Files:**
- Modify: `templates/fear-on-paper-script.yaml`
- Modify: `templates/fear-on-paper-shorts.yaml`
- Modify: `templates/fear-on-paper-email.yaml`
- Modify: `templates/fear-on-paper-cta-safe.yaml`

**Step 1: Review current templates**

Run: `ls templates/fear-on-paper*.yaml`
Expected: 4 template files

**Step 2: Rewrite script template with IM blocks**

Modify: `templates/fear-on-paper-script.yaml`
```yaml
id: fear-on-paper-script
version: 2.0.0
name: Fear on Paper Script (IM-Aligned)
description: Video script template for Fear on Paper - mechanism-first, testable, bounded
type: script

# IM v2.1 required blocks
required_blocks:
  mechanism_clarity: "Clear explanation of the underlying mechanism"
  counterexample: "Edge case or boundary condition"
  micro_test: "One concrete move testable in 10 minutes"
  boundary_line: "Explicit limitations and when it does not apply"
  evidence_signal: "Source citation within 7 days"

structure:
  intro:
    hook: "What if [COMMON_ASSUMPTION] is wrong because of [MECHANISM]?"
    setup: "Most people believe [CONVENTIONAL_WISDOM], but [COUNTER_EVIDENCE]."
    thesis: "In the next 10 minutes, you'll learn [CONCRETE_MOVE]."

  body:
    - section: Mechanism Clarity
      content: "Here's how [MECHANISM] actually works..."
      im_block: mechanism_clarity
    - section: Counterexample
      content: "This approach fails when [EDGE_CONDITION]..."
      im_block: counterexample
    - section: 10-Minute Test
      content: "Try this now: [SPECIFIC_ACTION] - do it and observe [RESULT]."
      im_block: micro_test
    - section: Boundary Line
      content: "This doesn't apply when [LIMITATION]."
      im_block: boundary_line
    - section: Evidence
      content: "Source: [SOURCE_NAME] ([DATE])"
      im_block: evidence_signal

  outro:
    summary: "Key takeaway: [MECHANISM] -> [ACTION] -> [RESULT]"
    cta: "Test this yourself in 10 minutes. Report what you found."

variables:
  - COMMON_ASSUMPTION
  - MECHANISM
  - CONVENTIONAL_WISDOM
  - COUNTER_EVIDENCE
  - CONCRETE_MOVE
  - SPECIFIC_ACTION
  - RESULT
  - EDGE_CONDITION
  - LIMITATION
  - SOURCE_NAME
  - DATE
```

**Step 3: Rewrite shorts template**

Modify: `templates/fear-on-paper-shorts.yaml`
```yaml
id: fear-on-paper-shorts
version: 2.0.0
name: Fear on Paper Shorts (IM-Aligned)
description: 60-second video - one mechanism, one test, one boundary
type: short_form
max_duration: 60

required_blocks:
  mechanism_clarity: "One sentence mechanism"
  micro_test: "One concrete action"
  boundary_line: "One limitation"
  evidence_signal: "One source/date signal"

structure:
  hook: "[MECHANISM] - here's the proof"
  body:
    - "Try [ACTION] now. You'll see [RESULT]."
    - "But not when [LIMITATION]."
  cta: "Test it and report back."

variables:
  - MECHANISM
  - ACTION
  - RESULT
  - LIMITATION
```

**Step 4: Rewrite email template**

Modify: `templates/fear-on-paper-email.yaml`
```yaml
id: fear-on-paper-email
version: 2.0.0
name: Fear on Paper Email (IM-Aligned)
description: Educational email with mechanism clarity and evidence
type: email

required_blocks:
  mechanism_clarity: "Explain mechanism in plain language"
  micro_test: "Include one 10-minute action"
  evidence_signal: "Include one source/date signal"
  boundary_line: "State when this does not apply"

structure:
  subject: "[MECHANISM] - the evidence"
  opening: "What if [ASSUMPTION] is wrong?"
  body:
    - mechanism: "[MECHANISM_EXPLANATION]"
    - test: "Try [ACTION] for 10 minutes. Here's what to expect: [RESULT]."
    - evidence: "Source: [SOURCE] ([DATE])"
    - boundary: "This doesn't apply when [LIMITATION]."
  closing: "Test this and let me know what you find."

variables:
  - ASSUMPTION
  - MECHANISM
  - MECHANISM_EXPLANATION
  - ACTION
  - RESULT
  - SOURCE
  - DATE
  - LIMITATION
```

**Step 5: Rewrite CTA-safe template**

Modify: `templates/fear-on-paper-cta-safe.yaml`
```yaml
id: fear-on-paper-cta-safe
version: 2.0.0
name: Fear on Paper CTA-Safe (IM-Aligned)
description: Educational CTA without sales pressure - pure mechanism and test
type: script
cta_policy: safe
format: educational

required_blocks:
  mechanism_clarity: "Explain mechanism in plain language"
  micro_test: "Include one 10-minute action"
  boundary_line: "State when this does not apply"
  evidence_signal: "Include one source/date signal"

structure:
  intro: "[MECHANISM] - understand it, test it"
  body:
    - mechanism: "[MECHANISM_EXPLANATION]"
    - test: "[ACTION] - do this for 10 minutes."
    - boundary: "Works when [CONDITION], not when [LIMITATION]."
    - evidence: "[SOURCE], [DATE]"
  cta: "Try it and share your results. That's the only ask."

variables:
  - MECHANISM
  - MECHANISM_EXPLANATION
  - ACTION
  - CONDITION
  - LIMITATION
  - SOURCE
  - DATE
```

**Step 6: Commit**

```bash
git add templates/fear-on-paper*.yaml
git commit -m "feat(templates): rewrite FoP templates to IM-congruent structure"
```

---

### Task 10: Add Template Conformance Tests

**Files:**
- Create: `tests/orchestrator/template-im-conformance.test.ts`

**Step 1: Write IM conformance test**

Write: `tests/orchestrator/template-im-conformance.test.ts`
```typescript
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const TEMPLATES_DIR = path.join(__dirname, '../../templates');

interface Template {
  id: string;
  version: string;
  required_blocks?: Record<string, string>;
  structure?: any;
}

describe('FoP Template IM Conformance', () => {
  const requiredIMBlocks = [
    'mechanism_clarity',
    'micro_test',
    'boundary_line',
    'evidence_signal'
  ];

  const templateFiles = [
    'fear-on-paper-script.yaml',
    'fear-on-paper-shorts.yaml',
    'fear-on-paper-email.yaml',
    'fear-on-paper-cta-safe.yaml'
  ];

  templateFiles.forEach(file => {
    describe(file, () => {
      let template: Template;

      beforeAll(() => {
        const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
        template = parse(content) as Template;
      });

      it('has required IM blocks defined', () => {
        if (template.required_blocks) {
          requiredIMBlocks.forEach(block => {
            expect(Object.keys(template.required_blocks || {})).toContain(block);
          });
        }
      });

      it('has version 2.0.0 or higher for IM alignment', () => {
        const version = parseFloat(template.version);
        expect(version).toBeGreaterThanOrEqual(2.0);
      });

      it('does not use emotional manipulation (fear/urgency/hope/agency levers)', () => {
        const content = JSON.stringify(template);
        expect(content).not.toMatch(/emotional_lever.*fear/);
        expect(content).not.toMatch(/emotional_lever.*urgency/);
      });

      it('includes mechanism in structure', () => {
        if (template.structure) {
          const hasMechanism = JSON.stringify(template.structure).toLowerCase().includes('mechanism');
          expect(hasMechanism).toBe(true);
        }
      });
    });
  });
});
```

**Step 2: Run conformance tests**

Run: `npm run test:orchestrator -- --testPathPatterns="template-im-conformance" 2>&1 | tail -20`
Expected: All templates pass IM conformance

**Step 3: Commit**

```bash
git add tests/orchestrator/template-im-conformance.test.ts
git commit -m "test: add IM conformance tests for FoP templates"
```

---

### Task 11: Implement Whelm->EIP Contract Validation

**Files:**
- Create: `orchestrator/whelm-contract.ts`
- Modify: `orchestrator/controller.ts`
- Create: `tests/orchestrator/whelm-contract.test.ts`

**Step 1: Create contract validation module**

Write: `orchestrator/whelm-contract.ts`
```typescript
// ABOUTME: Whelm->EIP contract validation for FoP generation requests

export interface WhelmFoPBrief {
  brief: string;
  audience_track: 'P' | 'F_translation';
  format: 'long_script' | 'short' | 'email' | 'cta_safe';
  imv2_card: {
    trigger_context: string;
    hidden_protection: string;
    mechanism_name: string;
    reframe_line: string;
    micro_test: string;
    boundary_line: string;
    evidence_signal: string;
    source_capture: string;
    scores: {
      truth: number;
      resonance: number;
      distinctiveness: number;
      practicality: number;
      mechanism_clarity: number;
    };
  };
}

export interface ContractValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateWhelmFoPInput(input: any): ContractValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!input.brief || typeof input.brief !== 'string') {
    errors.push('Missing required field: brief (string)');
  }

  if (!input.audience_track) {
    errors.push('Missing required field: audience_track');
  } else if (!['P', 'F_translation'].includes(input.audience_track)) {
    errors.push('audience_track must be "P" or "F_translation"');
  }

  if (!input.format) {
    errors.push('Missing required field: format');
  } else if (!['long_script', 'short', 'email', 'cta_safe'].includes(input.format)) {
    errors.push('format must be "long_script", "short", "email", or "cta_safe"');
  }

  // IM v2 card validation
  if (!input.imv2_card) {
    errors.push('Missing required field: imv2_card (9 required fields)');
  } else {
    const requiredCardFields = [
      'trigger_context',
      'hidden_protection',
      'mechanism_name',
      'reframe_line',
      'micro_test',
      'boundary_line',
      'evidence_signal',
      'source_capture',
      'scores'
    ];

    requiredCardFields.forEach(field => {
      if (!input.imv2_card[field]) {
        errors.push(`Missing imv2_card.${field}`);
      }
    });

    if (input.imv2_card.scores) {
      const requiredScoreFields = ['truth', 'resonance', 'distinctiveness', 'practicality', 'mechanism_clarity'];
      requiredScoreFields.forEach((field) => {
        if (typeof input.imv2_card.scores[field] !== 'number') {
          errors.push(`Missing or invalid imv2_card.scores.${field}`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function mapToTemplate(format: string): string {
  const formatMap: Record<string, string> = {
    'long_script': 'fear-on-paper-script',
    'short': 'fear-on-paper-shorts',
    'email': 'fear-on-paper-email',
    'cta_safe': 'fear-on-paper-cta-safe'
  };

  return formatMap[format] || 'fear-on-paper-script';
}
```

**Step 2: Integrate contract validation into controller**

Modify: `orchestrator/controller.ts` - add at entry point:
```typescript
import { validateWhelmFoPInput, mapToTemplate } from './whelm-contract';

type Brief = {
  brief: string;
  persona?: string;
  funnel?: string;
  tier?: Tier;
  correlation_id?: string;
  queue_mode?: boolean;
  audience_track?: 'P' | 'F_translation';
  format?: 'long_script' | 'short' | 'email' | 'cta_safe';
  imv2_card?: Record<string, unknown>;
};

async function handleFoPGeneration(input: Brief) {
  // Validate contract
  const validation = validateWhelmFoPInput(input);

  if (!validation.valid) {
    return {
      success: false,
      error: `Contract validation failed: ${validation.errors.join('; ')}`
    };
  }

  // Map to template
  const template = mapToTemplate(input.format || 'long_script');

  // Pass mapped template to publisher metadata.output_template
  // Continue with generation...
}
```

**Step 3: Write contract tests**

Write: `tests/orchestrator/whelm-contract.test.ts`
```typescript
import { validateWhelmFoPInput, mapToTemplate } from '../../orchestrator/whelm-contract';

describe('Whelm->EIP Contract Validation', () => {
  describe('validateWhelmFoPInput', () => {
    it('accepts valid P track request', () => {
      const validInput = {
        brief: 'Test brief',
        audience_track: 'P',
        format: 'long_script',
        imv2_card: {
          trigger_context: 'I avoid shipping when uncertain',
          hidden_protection: 'Protecting identity from visible failure',
          mechanism_name: 'Identity Preservation Loop',
          reframe_line: 'This is protection, not laziness',
          micro_test: 'Do this in 10 min',
          boundary_line: 'Does not apply when X',
          evidence_signal: 'Count one shipped artifact in 7 days',
          source_capture: 'Founder journal 2026-03-01',
          scores: {
            truth: 8,
            resonance: 7,
            distinctiveness: 8,
            practicality: 9,
            mechanism_clarity: 8
          }
        }
      };

      const result = validateWhelmFoPInput(validInput);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing brief', () => {
      const input = {
        audience_track: 'P',
        format: 'long_script',
        imv2_card: {
          trigger_context: 'x',
          hidden_protection: 'x',
          mechanism_name: 'x',
          reframe_line: 'x',
          micro_test: 'x',
          boundary_line: 'x',
          evidence_signal: 'x',
          source_capture: 'x',
          scores: { truth: 1, resonance: 1, distinctiveness: 1, practicality: 1, mechanism_clarity: 1 }
        }
      };

      const result = validateWhelmFoPInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: brief (string)');
    });

    it('rejects invalid audience_track', () => {
      const input = {
        brief: 'Test',
        audience_track: 'invalid',
        format: 'long_script',
        imv2_card: {
          trigger_context: 'x',
          hidden_protection: 'x',
          mechanism_name: 'x',
          reframe_line: 'x',
          micro_test: 'x',
          boundary_line: 'x',
          evidence_signal: 'x',
          source_capture: 'x',
          scores: { truth: 1, resonance: 1, distinctiveness: 1, practicality: 1, mechanism_clarity: 1 }
        }
      };

      const result = validateWhelmFoPInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('audience_track must be "P" or "F_translation"');
    });

    it('rejects missing imv2_card fields', () => {
      const input = {
        brief: 'Test',
        audience_track: 'P',
        format: 'long_script',
        imv2_card: { trigger_context: 'x' } // missing others
      };

      const result = validateWhelmFoPInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing imv2_card.hidden_protection');
    });
  });

  describe('mapToTemplate', () => {
    it('maps long_script to fear-on-paper-script', () => {
      expect(mapToTemplate('long_script')).toBe('fear-on-paper-script');
    });

    it('maps short to fear-on-paper-shorts', () => {
      expect(mapToTemplate('short')).toBe('fear-on-paper-shorts');
    });

    it('maps email to fear-on-paper-email', () => {
      expect(mapToTemplate('email')).toBe('fear-on-paper-email');
    });

    it('maps cta_safe to fear-on-paper-cta-safe', () => {
      expect(mapToTemplate('cta_safe')).toBe('fear-on-paper-cta-safe');
    });
  });
});
```

**Step 4: Run contract tests**

Run: `npm run test:orchestrator -- --testPathPatterns="whelm-contract" 2>&1 | tail -20`
Expected: All pass

**Step 5: Commit**

```bash
git add orchestrator/whelm-contract.ts orchestrator/controller.ts
git add tests/orchestrator/whelm-contract.test.ts
git commit -m "feat(contract): add Whelm->EIP contract validation"
```

---

## Phase 4: Docs and Operations

### Task 12: Update Root README

**Files:**
- Modify: `README.md`

**Step 1: Check current README**

Run: `head -50 README.md`
Expected: Current content

**Step 2: Write EIP operational README**

Write new `README.md`:
```markdown
# EIP - Educational-IP Content Runtime

AI-powered content generation framework with compliance control and human-in-the-loop quality gates.

## Status

**Workflow-readiness in progress** (promote only after all gates in this plan are green)

## Quick Start

```bash
# Install
npm install

# Development
npm run dev

# Run tests
npm run test:smoke
npm run test:integration
```

## Architecture

```
Brief → Retrieval → Generation → HITL Gates → Publish
                  ↓
            Compliance + Audit
```

## Run Modes

### Direct Mode (Local Dev)
```bash
npm run orchestrator:start
```

### Queue Mode (Production)
```bash
EIP_QUEUE_STRICT=true npm run orchestrator:start -- --queue
```

## Environment Variables

See `.env.example` for required variables:
- `REDIS_URL` - Queue backend
- `NEXT_PUBLIC_SUPABASE_URL` - Content persistence
- `SUPABASE_SERVICE_ROLE_KEY` - Admin access
- `EIP_QUEUE_STRICT=true` - Fail-fast in production

## Templates

- `templates/fear-on-paper-script.yaml` - Long-form video
- `templates/fear-on-paper-shorts.yaml` - 60-sec video
- `templates/fear-on-paper-email.yaml` - Email newsletter
- `templates/fear-on-paper-cta-safe.yaml` - Educational CTA

## IP Profiles

- `ip_library/framework@1.0.0.yaml`
- `ip_library/imv2_framework@1.0.0.yaml` - FoP
- `ip_library/imv2_loop_debug@1.0.0.yaml`
- `ip_library/imv2_founder_translation@1.0.0.yaml`

## Promotion Checklist

- [ ] `npm run test:smoke` passes
- [ ] `npm run test:integration` passes
- [ ] `npm run test:compliance` passes
- [ ] `npm run ip:validate` passes
- [ ] Queue strict mode verified
- [ ] Templates pass IM conformance

## Docs

- [Runbooks](./docs/runbooks/active/)
- [Plans](./docs/plans/active/)
- [PRD](./docs/eip/prd.md)
```

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: replace README with EIP operational documentation"
```

---

### Task 13: Create IM/FoP Runbook

**Files:**
- Create: `docs/runbooks/active/im-fear-on-paper-generation.md`
- Modify: `jobs/runbooks/ops-runbooks.md` (if exists)

**Step 1: Create runbook**

Write: `docs/runbooks/active/im-fear-on-paper-generation.md`
```markdown
# IM/Fear-on-Paper Generation Runbook

## Overview

This runbook covers the generation → human review → publish flow for Insight Mechanics v2 and Fear-on-Paper content.

## Prerequisites

- Redis running (for queue mode)
- Supabase configured
- IM v2 IP profiles loaded (`npm run ip:validate`)
- Environment variables set (see `.env.example`)

## Generation Flow

### 1. Whelm Contract Input

Whelm sends request to EIP with:

```typescript
{
  brief: string,
  audience_track: 'P' | 'F_translation',
  format: 'long_script' | 'short' | 'email' | 'cta_safe',
  imv2_card: {
    trigger_context: string,   // Required
    hidden_protection: string, // Required
    mechanism_name: string,    // Required
    reframe_line: string,      // Required
    micro_test: string,        // Required (10-min action)
    boundary_line: string,     // Required
    evidence_signal: string,   // Required
    source_capture: string,    // Required
    scores: {                  // Required
      truth: number,
      resonance: number,
      distinctiveness: number,
      practicality: number,
      mechanism_clarity: number
    }
  }
}
```

### 2. Contract Validation

EIP validates:
- All required fields present
- `audience_track` is valid
- `format` maps to template
- `imv2_card` has all 9 required fields

Invalid requests are rejected with structured errors.

### 3. Queue Processing

**Local/Dev:**
```bash
npm run orchestrator:start
# Falls back to direct mode if queue fails
```

**Production:**
```bash
EIP_QUEUE_STRICT=true npm run orchestrator:start -- --queue
# No fallback - fails fast on queue errors
```

### 4. HITL Gates

Before publish, content passes through:
- **Truth Gate**: Verifiable claims present
- **Mechanism Gate**: Mechanism clearly explained
- **Utility Gate**: Actionable content
- **Voice Gate**: Consistent voice
- **Boundary Gate**: Limitations disclosed

If any gate fails → routes to human review queue.

### 5. Human Review

Access review UI: `http://localhost:3002/review`

Actions:
- **Approve**: Publish to production
- **Request Changes**: Return to generation with feedback
- **Discard**: Remove from queue

### 6. Monitoring

```bash
# Check app health
curl http://localhost:3002/api/health

# Check metrics
curl http://localhost:3002/api/metrics | head -20

# Check worker health (queue mode)
npx tsx lib_supabase/queue/eip-worker-manager.ts status
```

## Troubleshooting

### Queue submission fails

1. Check Redis: `redis-cli ping`
2. Check env: `echo $REDIS_URL`
3. If strict mode: fix Redis, don't bypass

### Compliance failures

1. Run: `npm run compliance:check`
2. Check evidence freshness
3. Review allow-list domains

### Template rendering fails

1. Run: `npm run test:orchestrator -- --testPathPatterns="template"`
2. Check template YAML syntax
3. Verify IM blocks present

## Rollback

If production issues occur:

1. Stop queue: `pkill -f "orchestrator:start"`
2. Check last green commit: `git log --oneline -10`
3. Revert if needed: `git revert HEAD`
4. Redeploy known good version

## Support

- Slack: #eip-operations
- On-call: See rotation doc
```

**Step 2: Link from ops-runbooks if exists**

Run: `ls jobs/runbooks/ 2>/dev/null || echo "No jobs/runbooks"`
Expected: Check if exists

If exists, add link to IM/FoP runbook

**Step 3: Commit**

```bash
git add docs/runbooks/active/im-fear-on-paper-generation.md
git commit -m "docs: add IM/FoP generation runbook"
```

---

## Final Verification

### Task 14: Go/No-Go Verification

**Step 1: Run all verification commands**

```bash
# Core tests
npm run test:smoke
npm run test:retrieval
npm run test:auditor
npm run test:orchestrator
npm run test:compliance
npm run test:integration

# Validation
npm run ip:validate

# Template conformance
npm run test:orchestrator -- --testPathPatterns="template-im-conformance"

# Contract validation
npm run test:orchestrator -- --testPathPatterns="whelm-contract"
```

**Step 2: Verify env documentation**

```bash
grep -E "EIP_QUEUE_STRICT|REDIS_URL|SUPABASE" .env.example
```

**Step 3: Verify templates upgraded**

```bash
grep "version:" templates/fear-on-paper*.yaml
```

**Step 4: Final commit**

```bash
git commit -m "chore: complete FoP Whelm workflow readiness - all gates green"
```

---

## Definition of Done Summary

- [ ] `npm run test:smoke` passes
- [ ] `npm run test:retrieval` passes
- [ ] `npm run test:auditor` passes
- [ ] `npm run test:orchestrator` passes
- [ ] `npm run test:compliance` passes
- [ ] `npm run test:integration` passes
- [ ] `EIP_QUEUE_STRICT` mode implemented and tested
- [ ] FoP templates rewritten to IM-congruent structure (v2.0.0)
- [ ] Template IM conformance tests pass
- [ ] Whelm->EIP contract validation implemented
- [ ] README updated with EIP operational identity
- [ ] IM/FoP runbook created in `docs/runbooks/active/`
- [ ] Queue strict mode documented in `.env.example`
