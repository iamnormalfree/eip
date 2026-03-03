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
