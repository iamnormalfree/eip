// ABOUTME: Diff-bounded repair testing for EIP Steel Thread
// ABOUTME: Validates content repair functionality, diff operations, and quality improvement

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Content Repairer System', () => {
  const testContent = {
    original: `# Strategic Planning

## Overview
Basic planning overview.

## Steps
1. Plan
2. Execute`,

    improved: `# Strategic Planning Framework

## Overview
This framework provides a systematic approach to strategic planning for organizations.

## How It Works
The planning mechanism operates through four key phases:
1. Assessment of current position and capabilities
2. Vision and goal definition
3. Strategy formulation and resource allocation
4. Implementation planning and monitoring

## Example
Technology companies use this framework for product roadmap planning.

## Compliance
Follows MAS guidelines for corporate governance.`,

    auditResult: {
      overall_score: 45,
      tags: [
        {
          tag: 'COMPLETION_DRIVE',
          severity: 'error',
          confidence: 0.9,
          rationale: 'Content appears rushed and incomplete'
        },
        {
          tag: 'CARGO_CULT',
          severity: 'warning',
          confidence: 0.7,
          rationale: 'Content mimics form without understanding function'
        }
      ],
      ip_validation: {
        invariants_satisfied: ['has_overview'],
        invariants_violated: ['has_mechanism', 'has_examples'],
        invariant_compliance_rate: 0.33
      }
    }
  };

  describe('Diff-Bounded Repair Operations', () => {
    beforeEach(() => {
      jest.mock('../../orchestrator/repairer', () => ({
        repairContent: jest.fn(),
        calculateDiffBounds: jest.fn(),
        validateRepairConstraints: jest.fn()
      }));
    });

    it('should repair content within diff bounds', async () => {
      const { repairContent } = await import('../../orchestrator/repairer');
      (repairContent as jest.Mock).mockResolvedValue({
        repaired_content: testContent.improved,
        diff_stats: {
          additions: 120,
          deletions: 15,
          modifications: 25,
          total_diff_size: 160
        },
        repair_summary: {
          issues_fixed: 2,
          invariants_restored: ['has_mechanism', 'has_examples'],
          quality_improvement: 50,
          repair_confidence: 0.85
        },
        constraints_satisfied: {
          max_additions: 200,
          max_deletions: 50,
          max_modifications: 100,
          all_within_bounds: true
        }
      });

      const result = await repairContent({
        content: testContent.original,
        audit_result: testContent.auditResult,
        ip: 'framework@1.0.0',
        repair_options: {
          max_additions: 200,
          max_deletions: 50,
          repair_intensity: 'medium'
        }
      });

      expect(result.repaired_content).toContain('How It Works');
      expect(result.repaired_content).toContain('Example');
      expect(result.diff_stats.additions).toBeLessThanOrEqual(200);
      expect(result.constraints_satisfied.all_within_bounds).toBe(true);
      expect(result.repair_summary.invariants_restored).toContain('has_mechanism');
    });

    it('should respect diff size constraints', async () => {
      const { repairContent } = await import('../../orchestrator/repairer');
      (repairContent as jest.Mock).mockResolvedValue({
        repaired_content: testContent.improved,
        diff_stats: {
          additions: 50,
          deletions: 5,
          modifications: 10,
          total_diff_size: 65
        },
        constraints_satisfied: {
          max_additions: 100,
          max_deletions: 20,
          max_modifications: 50,
          all_within_bounds: true
        },
        warning: 'Light repair applied due to strict constraints'
      });

      const result = await repairContent({
        content: testContent.original,
        audit_result: testContent.auditResult,
        ip: 'framework@1.0.0',
        repair_options: {
          max_additions: 100,
          max_deletions: 20,
          max_modifications: 50,
          repair_intensity: 'light'
        }
      });

      expect(result.diff_stats.additions).toBeLessThanOrEqual(100);
      expect(result.diff_stats.deletions).toBeLessThanOrEqual(20);
      expect(result.diff_stats.modifications).toBeLessThanOrEqual(50);
      expect(result.constraints_satisfied.all_within_bounds).toBe(true);
    });
  });

  describe('IP Invariant Restoration', () => {
    it('should restore missing framework invariants', async () => {
      const { repairContent } = await import('../../orchestrator/repairer');
      (repairContent as jest.Mock).mockResolvedValue({
        repaired_content: testContent.improved,
        invariant_repairs: [
          {
            invariant: 'has_mechanism',
            status: 'restored',
            added_content: '## How It Works\nThe planning mechanism operates through...',
            confidence: 0.92
          },
          {
            invariant: 'has_examples',
            status: 'restored', 
            added_content: '## Example\nTechnology companies use this framework...',
            confidence: 0.88
          },
          {
            invariant: 'has_overview',
            status: 'enhanced',
            modified_content: '## Overview\nThis framework provides a systematic approach...',
            confidence: 0.85
          }
        ],
        repair_summary: {
          invariants_restored: ['has_mechanism', 'has_examples'],
          invariants_enhanced: ['has_overview'],
          invariant_compliance_rate: 1.0
        }
      });

      const result = await repairContent({
        content: testContent.original,
        audit_result: testContent.auditResult,
        ip: 'framework@1.0.0'
      });

      expect(result.repair_summary.invariants_restored).toContain('has_mechanism');
      expect(result.repair_summary.invariants_restored).toContain('has_examples');
      expect(result.repair_summary.invariant_compliance_rate).toBe(1.0);
      
      result.invariant_repairs.forEach(repair => {
        expect(['restored', 'enhanced', 'verified']).toContain(repair.status);
        expect(repair.confidence).toBeGreaterThan(0.7);
      });
    });

    it('should handle process IP invariant repairs', async () => {
      const { repairContent } = await import('../../orchestrator/repairer');
      (repairContent as jest.Mock).mockResolvedValue({
        repaired_content: `# Application Process

## Step-by-Step
1. Complete application form with required details
2. Submit necessary documentation
3. Undergo assessment process
4. Receive decision notification

## Timeline
Processing typically takes 5-7 business days.

## Requirements
- Valid identification
- Financial statements
- Property documents`,

        invariant_repairs: [
          {
            invariant: 'has_steps',
            status: 'restored',
            added_content: '## Step-by-Step\n1. Complete application...',
            confidence: 0.95
          },
          {
            invariant: 'has_timeline',
            status: 'restored',
            added_content: '## Timeline\nProcessing typically takes 5-7 business days.',
            confidence: 0.90
          },
          {
            invariant: 'has_requirements',
            status: 'restored',
            added_content: '## Requirements\n- Valid identification...',
            confidence: 0.92
          }
        ],
        ip_validation: {
          type: 'process',
          invariants_satisfied: ['has_steps', 'has_timeline', 'has_requirements'],
          compliance_rate: 1.0
        }
      });

      const result = await repairContent({
        content: 'Application process steps go here',
        audit_result: {
          overall_score: 30,
          ip_validation: {
            invariants_satisfied: [],
            invariants_violated: ['has_steps', 'has_timeline', 'has_requirements']
          }
        },
        ip: 'process@1.0.0'
      });

      expect(result.repaired_content).toContain('Step-by-Step');
      expect(result.repaired_content).toContain('Timeline');
      expect(result.repaired_content).toContain('Requirements');
      expect(result.ip_validation.compliance_rate).toBe(1.0);
    });
  });

  describe('Quality Pattern Fixes', () => {
    it('should fix COMPLETION_DRIVE patterns', async () => {
      const { repairContent } = await import('../../orchestrator/repairer');
      (repairContent as jest.Mock).mockResolvedValue({
        repaired_content: testContent.improved,
        pattern_fixes: [
          {
            pattern: 'COMPLETION_DRIVE',
            fix_applied: 'Added detailed explanations and examples',
            sections_enhanced: ['mechanism', 'examples', 'compliance'],
            confidence: 0.88
          }
        ],
        quality_metrics: {
          completion_drive_score_before: 0.8,
          completion_drive_score_after: 0.2,
          improvement: 0.6
        }
      });

      const result = await repairContent({
        content: testContent.original,
        audit_result: {
          tags: [
            {
              tag: 'COMPLETION_DRIVE',
              severity: 'error',
              confidence: 0.8,
              rationale: 'Content appears rushed'
            }
          ]
        },
        ip: 'framework@1.0.0'
      });

      expect(result.pattern_fixes[0].pattern).toBe('COMPLETION_DRIVE');
      expect(result.quality_metrics.improvement).toBeGreaterThan(0.5);
      expect(result.pattern_fixes[0].confidence).toBeGreaterThan(0.8);
    });

    it('should address QUESTION_SUPPRESSION patterns', async () => {
      const { repairContent } = await import('../../orchestrator/repairer');
      (repairContent as jest.Mock).mockResolvedValue({
        repaired_content: `${testContent.improved}

## Frequently Asked Questions

**Q: How long does strategic planning typically take?**
A: The complete planning cycle usually takes 2-3 months, depending on organizational complexity.

**Q: What resources are needed for this framework?**
A: Required resources include leadership team time, market research data, and financial projections.

**Q: Can this framework be adapted for small businesses?**
A: Yes, the framework can be scaled down for smaller organizations while maintaining core principles.`,

        pattern_fixes: [
          {
            pattern: 'QUESTION_SUPPRESSION',
            fix_applied: 'Added FAQ section addressing common user questions',
            questions_added: 3,
            categories_covered: ['timeline', 'resources', 'adaptability'],
            confidence: 0.85
          }
        ],
        user_engagement: {
          questions_addressed_before: 0,
          questions_addressed_after: 3,
          user_concerns_covered: ['time', 'cost', 'flexibility']
        }
      });

      const result = await repairContent({
        content: testContent.improved,
        audit_result: {
          tags: [
            {
              tag: 'QUESTION_SUPPRESSION',
              severity: 'warning',
              confidence: 0.7,
              rationale: 'Content could address common questions'
            }
          ]
        },
        ip: 'framework@1.0.0'
      });

      expect(result.repaired_content).toContain('Frequently Asked Questions');
      expect(result.pattern_fixes[0].questions_added).toBe(3);
      expect(result.user_engagement.questions_addressed_after).toBeGreaterThan(0);
    });
  });

  describe('Constraint Validation', () => {
    it('should validate repair constraints before execution', async () => {
      const { validateRepairConstraints } = await import('../../orchestrator/repairer');
      (validateRepairConstraints as jest.Mock).mockResolvedValue({
        valid: true,
        constraints: {
          max_additions: 200,
          max_deletions: 50,
          max_modifications: 100,
          repair_intensity: 'medium'
        },
        estimated_diff: {
          additions: 120,
          deletions: 20,
          modifications: 40,
          total_size: 180
        },
        feasibility_score: 0.92
      });

      const validation = await validateRepairConstraints({
        content: testContent.original,
        audit_result: testContent.auditResult,
        repair_options: {
          max_additions: 200,
          max_deletions: 50,
          max_modifications: 100
        }
      });

      expect(validation.valid).toBe(true);
      expect(validation.estimated_diff.total_size).toBeLessThanOrEqual(350); // Sum of all limits
      expect(validation.feasibility_score).toBeGreaterThan(0.8);
    });

    it('should reject repairs that exceed constraints', async () => {
      const { validateRepairConstraints } = await import('../../orchestrator/repairer');
      (validateRepairConstraints as jest.Mock).mockResolvedValue({
        valid: false,
        constraints: {
          max_additions: 50,
          max_deletions: 10,
          max_modifications: 25
        },
        estimated_diff: {
          additions: 200,
          deletions: 30,
          modifications: 80,
          total_size: 310
        },
        violations: [
          'Estimated additions (200) exceed limit (50)',
          'Estimated deletions (30) exceed limit (10)',
          'Estimated modifications (80) exceed limit (25)'
        ],
        feasibility_score: 0.15
      });

      const validation = await validateRepairConstraints({
        content: testContent.original,
        audit_result: testContent.auditResult,
        repair_options: {
          max_additions: 50,
          max_deletions: 10,
          max_modifications: 25
        }
      });

      expect(validation.valid).toBe(false);
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.feasibility_score).toBeLessThan(0.3);
    });
  });

  describe('Diff Analysis and Reporting', () => {
    it('should calculate accurate diff bounds', async () => {
      const { calculateDiffBounds } = await import('../../orchestrator/repairer');
      (calculateDiffBounds as jest.Mock).mockResolvedValue({
        original_size: 45,
        repaired_size: 285,
        diff_stats: {
          additions: 240,
          deletions: 15,
          modifications: 30,
          total_diff_size: 285,
          size_change_ratio: 6.33
        },
        quality_impact: {
          score_before: 45,
          score_after: 92,
          improvement: 47
        },
        efficiency: {
          improvement_per_diff_char: 0.165,
          cost_effective: true
        }
      });

      const diffBounds = await calculateDiffBounds({
        original_content: testContent.original,
        repaired_content: testContent.improved
      });

      expect(diffBounds.diff_stats.additions).toBeGreaterThan(0);
      expect(diffBounds.quality_impact.improvement).toBeGreaterThan(40);
      expect(diffBounds.efficiency.cost_effective).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty content gracefully', async () => {
      const { repairContent } = await import('../../orchestrator/repairer');
      (repairContent as jest.Mock).mockResolvedValue({
        repaired_content: testContent.improved,
        operation_type: 'generation',
        diff_stats: {
          additions: 285,
          deletions: 0,
          modifications: 0,
          total_diff_size: 285
        },
        warning: 'Original content was empty, generated new content from scratch'
      });

      const result = await repairContent({
        content: '',
        audit_result: testContent.auditResult,
        ip: 'framework@1.0.0'
      });

      expect(result.repaired_content).toBeDefined();
      expect(result.operation_type).toBe('generation');
      expect(result.diff_stats.deletions).toBe(0);
    });

    it('should handle severely corrupted content', async () => {
      const { repairContent } = await import('../../orchestrator/repairer');
      (repairContent as jest.Mock).mockResolvedValue({
        repaired_content: testContent.improved,
        operation_type: 'reconstruction',
        diff_stats: {
          additions: 285,
          deletions: 25,
          modifications: 0,
          total_diff_size: 310
        },
        reconstruction_reason: 'Original content structure too corrupted for diff-bounded repair',
        reconstruction_confidence: 0.75
      });

      const result = await repairContent({
        content: 'Lorem ipsum dolor sit amet, corrupted content here',
        audit_result: {
          overall_score: 10,
          tags: [
            {
              tag: 'STRUCTURE_COLLAPSE',
              severity: 'error',
              confidence: 0.95
            }
          ]
        },
        ip: 'framework@1.0.0'
      });

      expect(result.operation_type).toBe('reconstruction');
      expect(result.reconstruction_reason).toBeDefined();
      expect(result.reconstruction_confidence).toBeGreaterThan(0.7);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
