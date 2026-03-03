// ABOUTME: Deterministic HITL gating tests for review routing decisions
// ABOUTME: Verifies severity, compliance, and invariant threshold handling

import { describe, it, expect } from '@jest/globals';
import { evaluateHitlGates } from '../../orchestrator/hitl-gates';

describe('HITL Gates', () => {
  it('does not require human review for clean audit signals', () => {
    const decision = evaluateHitlGates({
      tags: [{ tag: 'QUALITY_OK', severity: 'info' }],
      overall_score: 85,
      compliance_analysis: {
        compliance_score: 90,
        financial_claims_detected: 0
      },
      invariants_failed: 0
    });

    expect(decision.needs_human_review).toBe(false);
    expect(decision.review_reasons).toEqual([]);
  });

  it('requires human review when severity exceeds threshold', () => {
    const decision = evaluateHitlGates({
      tags: [
        { tag: 'NO_MECHANISM', severity: 'error' },
        { tag: 'LAW_MISSTATE', severity: 'error' }
      ],
      overall_score: 80
    });

    expect(decision.needs_human_review).toBe(true);
    expect(decision.review_reasons.some((reason) => reason.includes('High severity score'))).toBe(true);
  });

  it('requires human review when compliance is below threshold', () => {
    const decision = evaluateHitlGates({
      tags: [],
      overall_score: 88,
      compliance_analysis: {
        compliance_score: 65,
        financial_claims_detected: 0
      }
    });

    expect(decision.needs_human_review).toBe(true);
    expect(decision.review_reasons.some((reason) => reason.includes('Compliance score below minimum'))).toBe(true);
  });

  it('treats numeric financial_claims_detected as review signal', () => {
    const decision = evaluateHitlGates({
      tags: [],
      overall_score: 92,
      compliance_analysis: {
        compliance_score: 90,
        financial_claims_detected: 2
      }
    });

    expect(decision.needs_human_review).toBe(true);
    expect(decision.review_reasons).toContain('Financial claims detected - requires compliance review');
  });
});
