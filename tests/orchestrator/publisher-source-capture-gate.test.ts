// ABOUTME: Tests for publish-time source_capture gate for Fear-on-Paper outputs
// ABOUTME: Validates that source_capture is required for FoP context at publish boundary

import { publishArtifact, isFoPContext } from '../../orchestrator/publisher';

describe('publisher source_capture gate', () => {
  const baseInput = {
    draft: '# Test Article\n\nThis is test content for validating source capture.',
    ip: 'imv2_framework',
    audit: {
      tags: [],
      overall_score: 85,
      content_analysis: {},
      pattern_analysis: {},
      compliance_analysis: {}
    },
    retrieval: {
      flags: {},
      candidates: []
    }
  };

  describe('FoP context detection', () => {
    it('should detect FoP context via output_template prefix', () => {
      // Test: output_template starts with fear-on-paper-
      expect(isFoPContext({ output_template: 'fear-on-paper-basic' }, 'framework')).toBe(true);
      expect(isFoPContext({ output_template: 'fear-on-paper-detailed' }, 'framework')).toBe(true);
      expect(isFoPContext({ output_template: 'other-template' }, 'framework')).toBe(false);
      expect(isFoPContext({}, 'framework')).toBe(false);
    });

    it('should not detect FoP context from IP prefix alone', () => {
      expect(isFoPContext({}, 'imv2_framework')).toBe(false);
      expect(isFoPContext({}, 'imv2_process')).toBe(false);
      expect(isFoPContext({}, 'framework')).toBe(false);
    });
  });

  describe('publishArtifact with FoP source_capture gate', () => {
    it('FoP template + missing source_capture -> throws error with "source_capture"', async () => {
      const input = {
        ...baseInput,
        ip: 'framework',
        metadata: {
          output_template: 'fear-on-paper-basic',
          brief: 'test brief'
        }
      };

      await expect(publishArtifact(input)).rejects.toThrow('source_capture');
    });

    it('FoP template + blank source_capture -> throws error', async () => {
      const input = {
        ...baseInput,
        ip: 'framework',
        metadata: {
          output_template: 'fear-on-paper-detailed',
          brief: 'test brief',
          source_capture: ''
        }
      };

      await expect(publishArtifact(input)).rejects.toThrow('source_capture');
    });

    it('FoP template + non-empty source_capture -> resolves PublishResult', async () => {
      const input = {
        ...baseInput,
        ip: 'framework',
        metadata: {
          output_template: 'fear-on-paper-basic',
          brief: 'test brief',
          source_capture: 'https://example.com/source'
        }
      };

      const result = await publishArtifact(input);
      expect(result).toHaveProperty('mdx');
      expect(result).toHaveProperty('jsonld');
      expect(result).toHaveProperty('ledger');
    });

    it('Non-FoP output (no FoP template) + missing source_capture -> resolves', async () => {
      const input = {
        ...baseInput,
        ip: 'framework',
        metadata: {
          brief: 'test brief',
          output_template: 'standard-article'
        }
      };

      const result = await publishArtifact(input);
      expect(result).toHaveProperty('mdx');
      expect(result).toHaveProperty('jsonld');
    });

    it('IP starts with imv2_ + missing source_capture + non-FoP template -> resolves', async () => {
      const input = {
        ...baseInput,
        ip: 'imv2_framework',
        metadata: {
          brief: 'test brief',
          output_template: 'standard-article'
        }
      };

      const result = await publishArtifact(input);
      expect(result).toHaveProperty('mdx');
      expect(result).toHaveProperty('jsonld');
    });

    it('IP starts with imv2_ + FoP template + missing source_capture -> throws error', async () => {
      const input = {
        ...baseInput,
        ip: 'imv2_framework',
        metadata: {
          brief: 'test brief',
          output_template: 'fear-on-paper-basic'
        }
      };

      await expect(publishArtifact(input)).rejects.toThrow('source_capture');
    });

    it('IP starts with imv2_ + FoP template + valid source_capture -> resolves', async () => {
      const input = {
        ...baseInput,
        ip: 'imv2_framework',
        metadata: {
          brief: 'test brief',
          output_template: 'fear-on-paper-basic',
          source_capture: 'https://mas.gov.sg/regulation'
        }
      };

      const result = await publishArtifact(input);
      expect(result).toHaveProperty('mdx');
      expect(result).toHaveProperty('jsonld');
    });
  });
});
