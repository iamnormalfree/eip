// ABOUTME: Human-in-the-Loop (HITL) gate logic for deterministic review routing
// ABOUTME: Implements rule-based thresholds for flagging artifacts for human review

export interface HitlDecision {
  needs_human_review: boolean;
  review_reasons: string[];
  gate_signals: {
    severity_score: number;
    invariant_failures: number;
    compliance_gaps: number;
    score_threshold_breached: boolean;
  };
}

export interface AuditResult {
  tags?: Array<{
    tag: string;
    severity?: 'error' | 'warning' | 'info';
    confidence?: number;
  }>;
  overall_score?: number;
  compliance_analysis?: {
    compliance_score?: number;
    financial_claims_detected?: number | boolean;
  };
  invariants_validated?: number;
  invariants_failed?: number;
}

// HITL threshold configuration
export const HITL_THRESHOLDS = {
  ERROR_WEIGHT: 3,
  WARNING_WEIGHT: 1,
  MAX_SEVERITY_SCORE: 5,
  MIN_SCORE_THRESHOLD: 60,
  COMPLIANCE_MIN: 70,
  INVARIANT_FAILURE_LIMIT: 0,
};

/**
 * Calculate severity score from audit tags
 */
function calculateSeverityScore(tags: AuditResult['tags']): number {
  if (!tags || tags.length === 0) return 0;

  let score = 0;
  for (const tag of tags) {
    if (tag.severity === 'error') {
      score += HITL_THRESHOLDS.ERROR_WEIGHT;
    } else if (tag.severity === 'warning') {
      score += HITL_THRESHOLDS.WARNING_WEIGHT;
    }
  }
  return score;
}

function hasFinancialClaimsDetected(value: number | boolean | undefined): boolean {
  if (typeof value === 'number') {
    return value > 0;
  }
  return Boolean(value);
}

/**
 * Main HITL gate function - deterministic decision based on audit signals
 */
export function evaluateHitlGates(audit: AuditResult): HitlDecision {
  // Calculate gate signals
  const severity_score = calculateSeverityScore(audit?.tags);
  const invariant_failures = audit?.invariants_failed ?? 0;

  // Check compliance gaps (missing evidence domains)
  const compliance_gaps = audit?.compliance_analysis?.compliance_score !== undefined
    ? (audit.compliance_analysis.compliance_score < HITL_THRESHOLDS.COMPLIANCE_MIN ? 1 : 0)
    : 0;

  // Check score threshold
  const score_threshold_breached = audit?.overall_score !== undefined
    ? audit.overall_score < HITL_THRESHOLDS.MIN_SCORE_THRESHOLD
    : false;

  // Collect review reasons
  const review_reasons: string[] = [];
  const hasCriticalErrorTag = (audit?.tags || []).some((tag) => tag.severity === 'error');

  if (hasCriticalErrorTag) {
    review_reasons.push('Critical error tag detected');
  }

  if (severity_score > HITL_THRESHOLDS.MAX_SEVERITY_SCORE) {
    review_reasons.push(`High severity score: ${severity_score}`);
  }

  if (invariant_failures > HITL_THRESHOLDS.INVARIANT_FAILURE_LIMIT) {
    review_reasons.push(`Too many invariant failures: ${invariant_failures}`);
  }

  if (score_threshold_breached) {
    review_reasons.push(`Quality score below threshold: ${audit.overall_score}`);
  }

  if (compliance_gaps > 0) {
    review_reasons.push(`Compliance score below minimum: ${audit.compliance_analysis?.compliance_score}`);
  }

  if (hasFinancialClaimsDetected(audit?.compliance_analysis?.financial_claims_detected)) {
    review_reasons.push('Financial claims detected - requires compliance review');
  }

  // Deterministic decision
  const needs_human_review = review_reasons.length > 0;

  return {
    needs_human_review,
    review_reasons,
    gate_signals: {
      severity_score,
      invariant_failures,
      compliance_gaps,
      score_threshold_breached,
    },
  };
}
