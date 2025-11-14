// ABOUTME: Comprehensive micro-auditor smoke tests for EIP Steel Thread  
// ABOUTME: Validates IP invariant compliance, quality tags, and integration contracts
// ABOUTME: Dual-Execution Architecture - Works as Jest test AND standalone runner

import { microAudit, getTagDefinitions, calculateRepairPriority, suggestAutoFixes } from '../orchestrator/auditor';
import { BudgetEnforcer } from '../orchestrator/budget';
import { isJestEnvironment } from './utils/conditional-jest-imports';

// Test content samples for auditor validation
const TEST_CONTENT_SAMPLES = {
  framework: {
    valid: `# Strategic Planning Framework

## Overview
This framework provides a systematic approach to strategic planning.

## How It Works (Mechanism)
The planning mechanism involves:
1. Assessment of current position
2. Goal definition and prioritization
3. Resource allocation
4. Implementation timeline
5. Monitoring and adjustment

## Example Application
For example, a technology company might use this framework to plan their product development cycle.

## Key Principles
- Structured approach to planning
- Continuous improvement loop
- Resource optimization

## Regulatory Compliance
This framework aligns with MAS guidelines on corporate governance.`,
    
    invalid: `Some text about planning without structure or mechanism`,
    
    with_issues: `# Planning Guide

This is thoroughly comprehensive content about planning that always works for everyone. However, some people might prefer alternative approaches. The process is very detailed and complete.`
  },
  
  process: {
    valid: `# Loan Application Process

## Step-by-Step Process
1. Submit application form
2. Provide documentation
3. Credit assessment
4. Approval decision
5. Fund disbursement

## Required Documentation
- Income statements
- Property valuation
- Identification documents

## Timeline
Typical processing time: 5-7 business days

## Compliance Note
This process follows banking regulations and MAS requirements.`,
    
    invalid: `Just apply for a loan and wait`,
    
    with_issues: `This process is always the same for every loan application and never varies under any circumstances.`
  }
};

const EXPECTED_CRITICAL_TAGS = [
  "NO_MECHANISM",
  'NO_EXAMPLES', 
  "NO_STRUCTURE",
  "COMPLETION_DRIVE",
  'QUESTION_SUPPRESSION',
  'DOMAIN_MIXING',
  "CONSTRAINT_OVERRIDE",
  'TOKEN_PADDING',
  'NO_COMPLIANCE_CHECK',
  'NO_EVIDENCE_LINKS'
];

// Dual-execution test exports
export const auditorTests = {
  testValidFrameworkAudit: async () => {
    console.log('Testing auditor with valid framework content...');
    const content = TEST_CONTENT_SAMPLES.framework.valid;
    
    const result = await microAudit({ 
      draft: content, 
      ip: 'framework@1.0.0' 
    });
    
    if (!result) {
      throw new Error('Auditor returned no result');
    }
    
    if (result.overall_score < 70) {
      throw new Error(`Valid framework scored too low: ${result.overall_score}`);
    }
    
    if (!result.content_analysis?.has_mechanism) {
      throw new Error('Valid framework should have mechanism detected');
    }
    
    console.log(`✓ Valid framework scored: ${result.overall_score}`);
    console.log(`✓ Mechanism detected: ${result.content_analysis.has_mechanism}`);
    console.log(`✓ Examples detected: ${result.content_analysis.has_examples}`);
    return result;
  },

  testInvalidContentDetection: async () => {
    console.log('Testing auditor with invalid content...');
    const content = TEST_CONTENT_SAMPLES.framework.invalid;
    
    const result = await microAudit({ 
      draft: content, 
      ip: 'framework@1.0.0' 
    });
    
    if (!result) {
      throw new Error('Auditor returned no result');
    }
    
    const noMechanismTag = result.tags?.find(tag => tag.tag === "NO_MECHANISM");
    if (!noMechanismTag) {
      throw new Error('Should have detected NO_MECHANISM tag');
    }
    
    if (noMechanismTag.severity !== 'error') {
      throw new Error('NO_MECHANISM should be error severity');
    }
    
    console.log(`✓ Invalid content scored: ${result.overall_score}`);
    console.log(`✓ NO_MECHANISM tag detected with severity: ${noMechanismTag.severity}`);
    return result;
  },

  testPatternDetection: async () => {
    console.log('Testing pattern detection...');
    const content = TEST_CONTENT_SAMPLES.framework.with_issues;
    
    const result = await microAudit({ 
      draft: content, 
      ip: 'framework@1.0.0' 
    });
    
    const completionDriveTag = result.tags?.find(tag => tag.tag === "COMPLETION_DRIVE");
    if (!completionDriveTag) {
      throw new Error('Should have detected COMPLETION_DRIVE pattern');
    }
    
    console.log(`✓ COMPLETION_DRIVE pattern detected`);
    console.log(`✓ Pattern score: ${result.pattern_analysis?.completion_drive}`);
    return result;
  },

  testPerformance: async () => {
    console.log('Testing auditor performance...');
    const content = TEST_CONTENT_SAMPLES.framework.valid;
    
    const startTime = Date.now();
    const result = await microAudit({ 
      draft: content, 
      ip: 'framework@1.0.0' 
    });
    const duration = Date.now() - startTime;
    
    if (duration > 5000) {
      throw new Error(`Audit took too long: ${duration}ms`);
    }
    
    if (!result || !result.tags) {
      throw new Error('Audit returned incomplete results');
    }
    
    console.log(`✓ Audit completed in ${duration}ms`);
    console.log(`✓ Generated ${result.tags.length} quality tags`);
    return result;
  },

  testTagDefinitions: async () => {
    console.log('Testing tag definitions...');
    const tagDefinitions = getTagDefinitions();
    
    if (!tagDefinitions || tagDefinitions.length === 0) {
      throw new Error('No tag definitions returned');
    }
    
    if (tagDefinitions.length !== EXPECTED_CRITICAL_TAGS.length) {
      throw new Error(`Expected ${EXPECTED_CRITICAL_TAGS.length} tag definitions, got ${tagDefinitions.length}`);
    }
    
    const tagNames = tagDefinitions.map(tag => tag.tag);
    for (const expectedTag of EXPECTED_CRITICAL_TAGS) {
      if (!tagNames.includes(expectedTag)) {
        throw new Error(`Missing tag definition: ${expectedTag}`);
      }
    }
    
    console.log(`✓ Found ${tagDefinitions.length} tag definitions`);
    return tagDefinitions;
  }
};

// Standalone execution function
async function runStandaloneTests() {
  console.log('🚀 Running Micro-Auditor Smoke Tests (Standalone Mode)');
  console.log('='.repeat(60));
  
  const testEntries = Object.entries(auditorTests);
  let passed = 0;
  let failed = 0;
  
  for (const [testName, testFn] of testEntries) {
    try {
      console.log(`\n📋 ${testName}`);
      await testFn();
      passed++;
      console.log(`✅ ${testName} PASSED`);
    } catch (error: any) {
      failed++;
      console.error(`❌ ${testName} FAILED:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('🚨 Some tests failed!');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!');
    process.exit(0);
  }
}

// Jest test suite (only loaded in Jest environment)
if (isJestEnvironment) {
  const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
  
  describe('Micro-Auditor Smoke Tests', () => {
    let budgetEnforcer: any;

    beforeEach(() => {
      budgetEnforcer = new BudgetEnforcer('MEDIUM');
      budgetEnforcer.startStage('auditor');
    });

    afterEach(() => {
      budgetEnforcer.endStage('auditor');
    });

    describe('Core Auditor Functionality', () => {
      it('should analyze valid framework content without critical errors', async () => {
        const result = await auditorTests.testValidFrameworkAudit();
        
        expect(result).toBeDefined();
        expect(result.tags).toBeDefined();
        expect(result.overall_score).toBeGreaterThan(70);
        expect(result.content_analysis?.has_mechanism).toBe(true);
        expect(result.content_analysis?.has_examples).toBe(true);
        expect(result.content_analysis?.has_structure).toBe(true);
        
        // Should not have critical error tags for valid content
        const criticalErrors = result.tags?.filter(tag => tag.severity === 'error') || [];
        expect(criticalErrors.length).toBeLessThan(2);
      });

      it('should detect missing mechanism in content', async () => {
        const result = await auditorTests.testInvalidContentDetection();
        
        const noMechanismTag = result.tags?.find(tag => tag.tag === "NO_MECHANISM");
        expect(noMechanismTag).toBeDefined();
        expect(noMechanismTag?.severity).toBe('error');
        expect(noMechanismTag?.confidence).toBeGreaterThan(0);
      });

      it('should detect completion drive bias', async () => {
        const result = await auditorTests.testPatternDetection();
        
        const completionDriveTag = result.tags?.find(tag => tag.tag === "COMPLETION_DRIVE");
        expect(completionDriveTag).toBeDefined();
        expect(completionDriveTag?.severity).toBe('warning');
        
        // Check pattern analysis scores
        expect(result.pattern_analysis?.completion_drive).toBeGreaterThan(0);
      });

      it('should detect constraint override language', async () => {
        const content = TEST_CONTENT_SAMPLES.process.with_issues;
        
        const result = await microAudit({ 
          draft: content, 
          ip: 'process@1.0.0' 
        });
        
        const constraintOverrideTag = result.tags?.find(tag => tag.tag === "CONSTRAINT_OVERRIDE");
        expect(constraintOverrideTag).toBeDefined();
        expect(constraintOverrideTag?.severity).toBe('warning');
      });
    });

    describe('Integration Contracts', () => {
      it('should satisfy auditor smoke test contract with IP invariant validation', async () => {
        const testCases = [
          {
            name: 'Valid framework content',
            input: { draft: TEST_CONTENT_SAMPLES.framework.valid, ip: 'framework@1.0.0' },
            expectedScore: { min: 70, max: 100 },
            expectedTags: ['HAS_STRUCTURE', 'HAS_MECHANISM', 'HAS_EXAMPLES']
          },
          {
            name: 'Invalid content structure',
            input: { draft: TEST_CONTENT_SAMPLES.framework.invalid, ip: 'framework@1.0.0' },
            expectedScore: { min: 0, max: 60 },
            expectedTags: ["NO_STRUCTURE", "NO_MECHANISM"]
          }
        ];

        for (const testCase of testCases) {
          const result = await microAudit(testCase.input);
          
          expect(result.overall_score).toBeGreaterThanOrEqual(testCase.expectedScore.min);
          expect(result.overall_score).toBeLessThanOrEqual(testCase.expectedScore.max);
          
          // Check for expected tag patterns
          if (testCase.expectedTags.includes('HAS_STRUCTURE')) {
            expect(result.content_analysis?.has_structure).toBe(true);
          }
          if (testCase.expectedTags.includes("NO_STRUCTURE")) {
            const noStructureTag = result.tags?.find(t => t.tag === "NO_STRUCTURE");
            expect(noStructureTag).toBeDefined();
          }
        }
      });

      it('should integrate with performance budget validation', async () => {
        const content = TEST_CONTENT_SAMPLES.framework.valid;
        
        // Simulate typical auditor token usage
        const estimatedTokens = Math.floor(content.length / 4) + 100; // Base + processing
        budgetEnforcer.addTokens('auditor', estimatedTokens);
        
        const result = await microAudit({ 
          draft: content, 
          ip: 'framework@1.0.0' 
        });
        
        // Validate budget compliance
        const budgetCheck = budgetEnforcer.checkStageBudget('auditor');
        expect(budgetCheck.ok).toBe(true);
        
        // Verify audit quality despite budget constraints
        expect(result.overall_score).toBeGreaterThan(50);
        expect((result.tags || []).length).toBeGreaterThan(0);
      });
    });
  });
}

// Standalone execution check
if (require.main === module) {
  runStandaloneTests().catch(console.error);
}
