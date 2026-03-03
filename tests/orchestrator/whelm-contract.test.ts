// ABOUTME: Whelm->EIP contract validation tests for FoP generation

import { describe, it, expect } from '@jest/globals';
import { validateWhelmFoPInput, mapToTemplate, WhelmFoPBrief } from '../../orchestrator/whelm-contract';

describe('Whelm Contract Validation', () => {
  describe('validateWhelmFoPInput', () => {
    describe('Valid P track request accepted', () => {
      it('should accept valid P track request with all required fields', () => {
        const validInput: WhelmFoPBrief = {
          brief: 'Generate content about protecting assets from market volatility',
          audience_track: 'P',
          format: 'long_script',
          imv2_card: {
            trigger_context: 'Market volatility concern',
            hidden_protection: 'Diversification strategy',
            mechanism_name: 'Asset Protection',
            reframe_line: 'Protect what you have',
            micro_test: 'Test message resonance',
            boundary_line: 'Never promise guaranteed returns',
            evidence_signal: 'Historical performance data',
            source_capture: 'Financial reports',
            scores: {
              truth: 8,
              resonance: 7,
              distinctiveness: 6,
              practicality: 9,
              mechanism_clarity: 8
            }
          }
        };

        const result = validateWhelmFoPInput(validInput);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept valid F_translation track request', () => {
        const validInput = {
          brief: 'Translation test',
          audience_track: 'F_translation',
          format: 'short',
          imv2_card: {
            trigger_context: 'test',
            hidden_protection: 'test',
            mechanism_name: 'test',
            reframe_line: 'test',
            micro_test: 'test',
            boundary_line: 'test',
            evidence_signal: 'test',
            source_capture: 'test',
            scores: {
              truth: 5,
              resonance: 5,
              distinctiveness: 5,
              practicality: 5,
              mechanism_clarity: 5
            }
          }
        };

        const result = validateWhelmFoPInput(validInput);
        expect(result.valid).toBe(true);
      });

      it('should accept all format types', () => {
        const formats = ['long_script', 'short', 'email', 'cta_safe'];

        formats.forEach(format => {
          const input = {
            brief: 'test',
            audience_track: 'P',
            format: format,
            imv2_card: {
              trigger_context: 'test',
              hidden_protection: 'test',
              mechanism_name: 'test',
              reframe_line: 'test',
              micro_test: 'test',
              boundary_line: 'test',
              evidence_signal: 'test',
              source_capture: 'test',
              scores: {
                truth: 5,
                resonance: 5,
                distinctiveness: 5,
                practicality: 5,
                mechanism_clarity: 5
              }
            }
          };

          const result = validateWhelmFoPInput(input);
          expect(result.valid).toBe(true);
        });
      });
    });

    describe('Missing brief rejected', () => {
      it('should reject request missing brief field', () => {
        const input = {
          audience_track: 'P',
          format: 'long_script',
          imv2_card: {
            trigger_context: 'test',
            hidden_protection: 'test',
            mechanism_name: 'test',
            reframe_line: 'test',
            micro_test: 'test',
            boundary_line: 'test',
            evidence_signal: 'test',
            source_capture: 'test',
            scores: {
              truth: 5,
              resonance: 5,
              distinctiveness: 5,
              practicality: 5,
              mechanism_clarity: 5
            }
          }
        };

        const result = validateWhelmFoPInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: brief (string)');
      });

      it('should reject request with non-string brief', () => {
        const input = {
          brief: 123 as any,
          audience_track: 'P',
          format: 'long_script',
          imv2_card: {
            trigger_context: 'test',
            hidden_protection: 'test',
            mechanism_name: 'test',
            reframe_line: 'test',
            micro_test: 'test',
            boundary_line: 'test',
            evidence_signal: 'test',
            source_capture: 'test',
            scores: {
              truth: 5,
              resonance: 5,
              distinctiveness: 5,
              practicality: 5,
              mechanism_clarity: 5
            }
          }
        };

        const result = validateWhelmFoPInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: brief (string)');
      });
    });

    describe('Invalid audience_track rejected', () => {
      it('should reject invalid audience_track value', () => {
        const input = {
          brief: 'test',
          audience_track: 'invalid',
          format: 'long_script',
          imv2_card: {
            trigger_context: 'test',
            hidden_protection: 'test',
            mechanism_name: 'test',
            reframe_line: 'test',
            micro_test: 'test',
            boundary_line: 'test',
            evidence_signal: 'test',
            source_capture: 'test',
            scores: {
              truth: 5,
              resonance: 5,
              distinctiveness: 5,
              practicality: 5,
              mechanism_clarity: 5
            }
          }
        };

        const result = validateWhelmFoPInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('audience_track must be "P" or "F_translation"');
      });

      it('should reject missing audience_track', () => {
        const input = {
          brief: 'test',
          format: 'long_script',
          imv2_card: {
            trigger_context: 'test',
            hidden_protection: 'test',
            mechanism_name: 'test',
            reframe_line: 'test',
            micro_test: 'test',
            boundary_line: 'test',
            evidence_signal: 'test',
            source_capture: 'test',
            scores: {
              truth: 5,
              resonance: 5,
              distinctiveness: 5,
              practicality: 5,
              mechanism_clarity: 5
            }
          }
        };

        const result = validateWhelmFoPInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: audience_track');
      });
    });

    describe('Missing imv2_card fields rejected', () => {
      it('should reject request missing imv2_card entirely', () => {
        const input = {
          brief: 'test',
          audience_track: 'P',
          format: 'long_script'
        };

        const result = validateWhelmFoPInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: imv2_card (9 required fields)');
      });

      it('should reject request with missing imv2_card subfields', () => {
        const input = {
          brief: 'test',
          audience_track: 'P',
          format: 'long_script',
          imv2_card: {
            trigger_context: 'test'
            // Missing other required fields
          }
        };

        const result = validateWhelmFoPInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing imv2_card.hidden_protection');
        expect(result.errors).toContain('Missing imv2_card.mechanism_name');
        expect(result.errors).toContain('Missing imv2_card.scores');
      });

      it('should reject request with missing score fields', () => {
        const input = {
          brief: 'test',
          audience_track: 'P',
          format: 'long_script',
          imv2_card: {
            trigger_context: 'test',
            hidden_protection: 'test',
            mechanism_name: 'test',
            reframe_line: 'test',
            micro_test: 'test',
            boundary_line: 'test',
            evidence_signal: 'test',
            source_capture: 'test',
            scores: {
              truth: 5
              // Missing other score fields
            }
          }
        };

        const result = validateWhelmFoPInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing or invalid imv2_card.scores.resonance');
        expect(result.errors).toContain('Missing or invalid imv2_card.scores.distinctiveness');
      });
    });

    describe('Invalid format rejected', () => {
      it('should reject invalid format value', () => {
        const input = {
          brief: 'test',
          audience_track: 'P',
          format: 'invalid_format',
          imv2_card: {
            trigger_context: 'test',
            hidden_protection: 'test',
            mechanism_name: 'test',
            reframe_line: 'test',
            micro_test: 'test',
            boundary_line: 'test',
            evidence_signal: 'test',
            source_capture: 'test',
            scores: {
              truth: 5,
              resonance: 5,
              distinctiveness: 5,
              practicality: 5,
              mechanism_clarity: 5
            }
          }
        };

        const result = validateWhelmFoPInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('format must be "long_script", "short", "email", or "cta_safe"');
      });

      it('should reject missing format', () => {
        const input = {
          brief: 'test',
          audience_track: 'P',
          imv2_card: {
            trigger_context: 'test',
            hidden_protection: 'test',
            mechanism_name: 'test',
            reframe_line: 'test',
            micro_test: 'test',
            boundary_line: 'test',
            evidence_signal: 'test',
            source_capture: 'test',
            scores: {
              truth: 5,
              resonance: 5,
              distinctiveness: 5,
              practicality: 5,
              mechanism_clarity: 5
            }
          }
        };

        const result = validateWhelmFoPInput(input);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required field: format');
      });
    });
  });

  describe('mapToTemplate', () => {
    it('should map long_script to fear-on-paper-script', () => {
      expect(mapToTemplate('long_script')).toBe('fear-on-paper-script');
    });

    it('should map short to fear-on-paper-shorts', () => {
      expect(mapToTemplate('short')).toBe('fear-on-paper-shorts');
    });

    it('should map email to fear-on-paper-email', () => {
      expect(mapToTemplate('email')).toBe('fear-on-paper-email');
    });

    it('should map cta_safe to fear-on-paper-cta-safe', () => {
      expect(mapToTemplate('cta_safe')).toBe('fear-on-paper-cta-safe');
    });

    it('should default to fear-on-paper-script for unknown format', () => {
      expect(mapToTemplate('unknown')).toBe('fear-on-paper-script');
    });

    it('should default to fear-on-paper-script for undefined', () => {
      expect(mapToTemplate(undefined as any)).toBe('fear-on-paper-script');
    });
  });
});
