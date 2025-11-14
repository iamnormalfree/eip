// ABOUTME: Micro-auditor smoke tests for EIP Steel Thread
// ABOUTME: Validates IP invariant compliance, quality tags, and integration contracts

const { performance } = require('perf_hooks');

// Import actual orchestrator components
let microAudit;
try {
  const auditorModule = require('../orchestrator/auditor');
  microAudit = auditorModule.microAudit;
} catch (error) {
  console.log('⚠️  Could not load actual auditor module, using mock implementation');
}

// Mock implementation if actual not available
class MockAuditor {
  async audit(draft, ip) {
    const wordCount = draft.split(/\s+/).length;
    const sectionCount = (draft.match(/^#{1,3}\s+/gm) || []).length;
    const hasMechanism = /(mechanism|how.*work|process|step)/i.test(draft);
    const hasExamples = /(example|for.*instance|case.*study|demonstration)/i.test(draft);
    const hasStructure = /^#{1,3}\s+/m.test(draft);
    
    // Pattern detection
    const completionDrive = (draft.match(/\b(thoroughly|comprehensive|exhaustive|complete)\b/gi) || []).length;
    const questionSuppression = draft.includes('?') ? 0.2 : 0.8;
    const domainMixing = (draft.match(/\b(however|alternatively|on.*other.*hand|in.*contrast)\b/gi) || []).length;
    
    let score = 100;
    const tags = [];
    
    if (!hasMechanism) {
      tags.push({
        tag: 'NO_MECHANISM',
        severity: 'error',
        rationale: 'Content lacks mechanism explanation',
        confidence: 0.8,
        auto_fixable: false
      });
      score -= 20;
    }
    
    if (!hasExamples) {
      tags.push({
        tag: 'NO_EXAMPLES',
        severity: 'warning',
        rationale: 'Content lacks practical examples',
        confidence: 0.6,
        auto_fixable: true
      });
      score -= 10;
    }
    
    if (!hasStructure) {
      tags.push({
        tag: 'NO_STRUCTURE',
        severity: 'error',
        rationale: 'Content lacks clear structure',
        confidence: 0.9,
        auto_fixable: true
      });
      score -= 15;
    }
    
    if (completionDrive > 0) {
      tags.push({
        tag: 'COMPLETION_DRIVE',
        severity: 'warning',
        rationale: 'Content shows completion drive bias',
        confidence: 0.7,
        auto_fixable: false
      });
      score -= 5 * Math.min(completionDrive, 2);
    }
    
    if (questionSuppression > 0.7) {
      tags.push({
        tag: 'QUESTION_SUPPRESSION',
        severity: 'info',
        rationale: 'Content may be suppressing valid questions',
        confidence: questionSuppression,
        auto_fixable: false
      });
      score -= 3;
    }
    
    return {
      tags: tags,
      overall_score: Math.max(0, Math.min(100, score)),
      content_analysis: {
        word_count: wordCount,
        section_count: sectionCount,
        has_mechanism: hasMechanism,
        has_examples: hasExamples,
        has_structure: hasStructure
      },
      pattern_analysis: {
        completion_drive: Math.min(completionDrive / 10, 1.0),
        question_suppression: questionSuppression,
        domain_mixing: Math.min(domainMixing / 20, 1.0)
      }
    };
  }
}

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
    
    invalid: `Some text about planning without structure or mechanism or examples.`,
    
    with_issues: `This is thoroughly comprehensive content about planning that always works for everyone without any questions.`
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
    
    invalid: `Just apply for a loan and wait.`,
    
    with_issues: `This process is always the same for every loan application and never varies under any circumstances.`
  }
};

const EXPECTED_CRITICAL_TAGS = [
  'NO_MECHANISM',
  'NO_EXAMPLES', 
  'NO_STRUCTURE',
  'COMPLETION_DRIVE',
  'QUESTION_SUPPRESSION',
  'DOMAIN_MIXING',
  'CONSTRAINT_OVERRIDE'
];

// Test framework
class AuditorTestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
    this.auditor = microAudit ? null : new MockAuditor();
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('🔍 Micro-Auditor Smoke Tests');
    console.log('================================');
    console.log('Using:', microAudit ? 'Actual orchestrator/auditor' : 'Mock implementation');
    console.log('');
    
    for (const test of this.tests) {
      try {
        const startTime = performance.now();
        const result = await test.testFn();
        const duration = performance.now() - startTime;
        
        this.results.push({
          name: test.name,
          success: true,
          duration: duration,
          result: result
        });
        
        console.log('✅ ' + test.name + ' (' + duration.toFixed(2) + 'ms)');
        if (result && Object.keys(result).length > 0) {
          console.log('   ' + JSON.stringify(result).substring(0, 150) + '...');
        }
      } catch (error) {
        console.log('❌ ' + test.name + ': ' + error.message);
        this.results.push({
          name: test.name,
          success: false,
          error: error.message,
          duration: 0
        });
      }
    }
    
    this.printSummary();
  }

  printSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    
    console.log('');
    console.log('📊 Auditor Test Summary:');
    console.log('Total: ' + total + ', Passed: ' + passed + ', Failed: ' + failed);
    console.log('Success Rate: ' + ((passed / total) * 100).toFixed(1) + '%');
    console.log('Average Duration: ' + avgDuration.toFixed(2) + 'ms');
    
    if (failed > 0) {
      console.log('');
      console.log('❌ Failed Tests:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log('  - ' + r.name + ': ' + r.error);
      });
    }
  }

  async performAudit(draft, ip) {
    if (microAudit) {
      return await microAudit({ draft, ip });
    } else {
      return await this.auditor.audit(draft, ip);
    }
  }
}

// Main test execution
async function runAuditorTests() {
  const runner = new AuditorTestRunner();

  // Core Auditor Functionality Tests
  runner.test('Framework Content Validation', async () => {
    const content = TEST_CONTENT_SAMPLES.framework.valid;
    const result = await runner.performAudit(content, 'framework@1.0.0');
    
    if (!result.content_analysis.has_mechanism) {
      throw new Error('Mechanism not detected in valid framework');
    }
    
    if (!result.content_analysis.has_examples) {
      throw new Error('Examples not detected in valid framework');
    }
    
    if (!result.content_analysis.has_structure) {
      throw new Error('Structure not detected in valid framework');
    }
    
    if (result.overall_score < 70) {
      throw new Error('Overall score too low for valid content: ' + result.overall_score);
    }
    
    // Should not have critical error tags for valid content
    const criticalErrors = result.tags.filter(tag => tag.severity === 'error');
    if (criticalErrors.length > 1) {
      throw new Error('Too many critical errors for valid content: ' + criticalErrors.length);
    }
    
    return {
      overall_score: result.overall_score,
      has_mechanism: result.content_analysis.has_mechanism,
      has_examples: result.content_analysis.has_examples,
      has_structure: result.content_analysis.has_structure,
      critical_errors: criticalErrors.length
    };
  });

  runner.test('Invalid Content Detection', async () => {
    const content = TEST_CONTENT_SAMPLES.framework.invalid;
    const result = await runner.performAudit(content, 'framework@1.0.0');
    
    if (result.overall_score > 80) {
      throw new Error('Score too high for invalid content: ' + result.overall_score);
    }
    
    // Should detect missing structure and mechanism
    const noStructureTag = result.tags.find(tag => tag.tag === 'NO_STRUCTURE');
    const noMechanismTag = result.tags.find(tag => tag.tag === 'NO_MECHANISM');
    
    if (!noStructureTag) {
      throw new Error('NO_STRUCTURE tag not detected for unstructured content');
    }
    
    return {
      overall_score: result.overall_score,
      no_structure_detected: !!noStructureTag,
      no_mechanism_detected: !!noMechanismTag,
      tags_found: result.tags.length
    };
  });

  runner.test('Pattern Detection - Completion Drive', async () => {
    const content = TEST_CONTENT_SAMPLES.framework.with_issues;
    const result = await runner.performAudit(content, 'framework@1.0.0');
    
    const completionDriveTag = result.tags.find(tag => tag.tag === 'COMPLETION_DRIVE');
    if (!completionDriveTag) {
      throw new Error('COMPLETION_DRIVE pattern not detected');
    }
    
    if (result.pattern_analysis.completion_drive <= 0) {
      throw new Error('Completion drive score should be greater than 0');
    }
    
    return {
      completion_drive_score: result.pattern_analysis.completion_drive,
      tag_detected: !!completionDriveTag,
      confidence: completionDriveTag.confidence
    };
  });

  runner.test('Pattern Detection - Question Suppression', async () => {
    const contentWithQuestions = 'This raises questions about the approach. What are the limitations? How can we improve?';
    const contentWithoutQuestions = 'This is a factual statement without any questions or uncertainties.';
    
    const resultWith = await runner.performAudit(contentWithQuestions, 'framework@1.0.0');
    const resultWithout = await runner.performAudit(contentWithoutQuestions, 'framework@1.0.0');
    
    if (resultWith.pattern_analysis.question_suppression >= resultWithout.pattern_analysis.question_suppression) {
      throw new Error('Question suppression detection not working correctly');
    }
    
    return {
      with_questions_score: resultWith.pattern_analysis.question_suppression,
      without_questions_score: resultWithout.pattern_analysis.question_suppression,
      detection_working: true
    };
  });

  runner.test('Content Structure Analysis', async () => {
    const content = TEST_CONTENT_SAMPLES.process.valid;
    const result = await runner.performAudit(content, 'process@1.0.0');
    
    if (result.content_analysis.word_count < 50) {
      throw new Error('Word count seems too low: ' + result.content_analysis.word_count);
    }
    
    if (result.content_analysis.section_count < 2) {
      throw new Error('Section count seems too low: ' + result.content_analysis.section_count);
    }
    
    // Process content should have step-by-step format
    if (!content.match(/\d+\./)) {
      throw new Error('Process content should have numbered steps');
    }
    
    return {
      word_count: result.content_analysis.word_count,
      section_count: result.content_analysis.section_count,
      has_structure: result.content_analysis.has_structure,
      process_format_detected: content.match(/\d+\./) !== null
    };
  });

  runner.test('IP Invariant Validation', async () => {
    const frameworkContent = TEST_CONTENT_SAMPLES.framework.valid;
    const processContent = TEST_CONTENT_SAMPLES.process.valid;
    
    const frameworkResult = await runner.performAudit(frameworkContent, 'framework@1.0.0');
    const processResult = await runner.performAudit(processContent, 'process@1.0.0');
    
    // Framework IP should have structure, mechanism, and examples
    if (!frameworkResult.content_analysis.has_structure || 
        !frameworkResult.content_analysis.has_mechanism || 
        !frameworkResult.content_analysis.has_examples) {
      throw new Error('Framework IP invariants not satisfied');
    }
    
    // Process IP should have clear steps
    if (!processResult.content_analysis.has_structure) {
      throw new Error('Process IP structure not detected');
    }
    
    return {
      framework_invariants_satisfied: 
        frameworkResult.content_analysis.has_structure && 
        frameworkResult.content_analysis.has_mechanism && 
        frameworkResult.content_analysis.has_examples,
      process_invariants_satisfied: processResult.content_analysis.has_structure,
      framework_score: frameworkResult.overall_score,
      process_score: processResult.overall_score
    };
  });

  runner.test('Performance Validation', async () => {
    const content = TEST_CONTENT_SAMPLES.framework.valid;
    
    const startTime = performance.now();
    const result = await runner.performAudit(content, 'framework@1.0.0');
    const duration = performance.now() - startTime;
    
    if (duration > 5000) {
      throw new Error('Audit time exceeds threshold: ' + duration.toFixed(2) + 'ms > 5000ms');
    }
    
    if (!result || !result.tags || !result.overall_score !== undefined) {
      throw new Error('Invalid audit result structure');
    }
    
    return {
      audit_duration_ms: duration.toFixed(2),
      within_threshold: duration <= 5000,
      result_valid: !!(result && result.tags && result.overall_score !== undefined)
    };
  });

  runner.test('Tag Quality and Confidence', async () => {
    const content = TEST_CONTENT_SAMPLES.framework.invalid;
    const result = await runner.performAudit(content, 'framework@1.0.0');
    
    if (result.tags.length === 0) {
      throw new Error('No tags generated for invalid content');
    }
    
    // Check tag structure
    result.tags.forEach(tag => {
      if (!tag.tag || !tag.severity || !tag.rationale) {
        throw new Error('Tag missing required fields');
      }
      
      if (!['error', 'warning', 'info'].includes(tag.severity)) {
        throw new Error('Invalid tag severity: ' + tag.severity);
      }
      
      if (typeof tag.confidence !== 'number' || tag.confidence < 0 || tag.confidence > 1) {
        throw new Error('Invalid tag confidence: ' + tag.confidence);
      }
      
      if (typeof tag.auto_fixable !== 'boolean') {
        throw new Error('Invalid auto_fixable value: ' + tag.auto_fixable);
      }
    });
    
    return {
      tags_generated: result.tags.length,
      tag_structure_valid: true,
      confidence_ranges_valid: result.tags.every(tag => tag.confidence >= 0 && tag.confidence <= 1)
    };
  });

  await runner.runTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAuditorTests().catch(console.error);
}

module.exports = { AuditorTestRunner, MockAuditor };
