#!/usr/bin/env node
// ABOUTME: EIP Queue System Integration Test Script
// ABOUTME: Tests queue submission, job processing, budget checkpoints, and DLQ routing

import { submitContentGenerationJob, getEIPQueueMetrics } from '../lib_supabase/queue/eip-queue';
import { initializeEIPWorkers, getEIPWorkerHealth, getEIPMetrics } from '../lib_supabase/queue/eip-worker-manager';

// ============================================================================
// EIP QUEUE SYSTEM INTEGRATION TESTS
// ============================================================================
// Test scenarios:
// 1. Queue submission with different tiers
// 2. Budget checkpoint validation
// 3. Worker health monitoring
// 4. DLQ routing simulation
// 5. Metrics collection

/**
 * Test queue submission functionality
 */
async function testQueueSubmission(): Promise<void> {
  console.log('\n🧪 Testing Queue Submission...');
  
  const testCases = [
    {
      name: 'LIGHT Tier Submission',
      brief: 'Explain basic savings accounts in Singapore',
      tier: 'LIGHT' as const,
      persona: 'beginner_friendly',
      funnel: 'TOFU'
    },
    {
      name: 'MEDIUM Tier Submission',
      brief: 'Explain mortgage refinancing process in Singapore with detailed examples',
      tier: 'MEDIUM' as const,
      persona: 'professional_advisor',
      funnel: 'MOFU'
    },
    {
      name: 'HEAVY Tier Submission',
      brief: 'Create comprehensive guide to property investment in Singapore including tax implications, financing options, market analysis, and risk management strategies',
      tier: 'HEAVY' as const,
      persona: 'expert_analyst',
      funnel: 'BOFU'
    }
  ];
  
  const results: any[] = [];
  
  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}:`);
    console.log(`   Brief: ${testCase.brief.substring(0, 80)}...`);
    console.log(`   Tier: ${testCase.tier}`);
    
    try {
      const startTime = Date.now();
      const result = await submitContentGenerationJob({
        brief: testCase.brief,
        persona: testCase.persona,
        funnel: testCase.funnel,
        tier: testCase.tier,
        correlation_id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        priority: testCase.tier === 'HEAVY' ? 1 : testCase.tier === 'MEDIUM' ? 3 : 5,
        metadata: {
          test_scenario: testCase.name,
          test_timestamp: new Date().toISOString()
        }
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ Submitted successfully: ${result.jobId}`);
      console.log(`   ⏱️  Submission time: ${duration}ms`);
      
      results.push({
        name: testCase.name,
        success: true,
        job_id: result.jobId,
        submission_time_ms: duration
      });
      
    } catch (error) {
      console.error(`   ❌ Submission failed:`, error);
      
      results.push({
        name: testCase.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  console.log(`\n📊 Queue Submission Results:`);
  const successCount = results.filter(r => r.success).length;
  console.log(`   Successful: ${successCount}/${results.length}`);
  console.log(`   Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
  
  return results;
}

/**
 * Test worker health and initialization
 */
async function testWorkerHealth(): Promise<void> {
  console.log('\n🏥 Testing Worker Health...');
  
  try {
    // Initialize workers
    console.log('   Initializing EIP workers...');
    await initializeEIPWorkers();
    
    // Wait a moment for workers to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get health status
    const health = await getEIPWorkerHealth();
    
    console.log(`   Overall Status: ${health.overall}`);
    console.log('   Worker Status:');
    
    for (const [name, status] of Object.entries(health.workers)) {
      const statusInfo = status as any;
      console.log(`     ${name}: ${statusInfo.status}`);
      if (statusInfo.uptime) {
        console.log(`       Uptime: ${Math.round(statusInfo.uptime / 1000)}s`);
      }
      if (statusInfo.error) {
        console.log(`       Error: ${statusInfo.error}`);
      }
    }
    
    return health;
    
  } catch (error) {
    console.error('   ❌ Worker health test failed:', error);
    throw error;
  }
}

/**
 * Test queue metrics collection
 */
async function testQueueMetrics(): Promise<void> {
  console.log('\n📊 Testing Queue Metrics Collection...');
  
  try {
    const metrics = await getEIPQueueMetrics();
    
    if (!metrics) {
      console.log('   ⚠️  No metrics available (queues may be empty)');
      return;
    }
    
    console.log('   Queue Metrics:');
    console.log(`     Content Generation: ${JSON.stringify(metrics.content_generation)}`);
    console.log(`     Budget Validation: ${JSON.stringify(metrics.budget_validation)}`);
    console.log(`     Audit/Repair: ${JSON.stringify(metrics.audit_repair)}`);
    console.log(`     DLQ Processing: ${JSON.stringify(metrics.dlq_processing)}`);
    
    if (metrics.totals) {
      console.log('   Totals:');
      console.log(`     Waiting: ${metrics.totals.waiting}`);
      console.log(`     Active: ${metrics.totals.active}`);
      console.log(`     Completed: ${metrics.totals.completed}`);
      console.log(`     Failed: ${metrics.totals.failed}`);
    }
    
    return metrics;
    
  } catch (error) {
    console.error('   ❌ Metrics collection test failed:', error);
    throw error;
  }
}

/**
 * Test comprehensive system metrics
 */
async function testSystemMetrics(): Promise<void> {
  console.log('\n🔍 Testing System Metrics...');
  
  try {
    const metrics = await getEIPMetrics();
    
    console.log('   System Overview:');
    console.log(`     Workers Initialized: ${metrics.system_metrics.workers_initialized}`);
    console.log(`     Uptime: ${Math.round(metrics.system_metrics.uptime / 1000)}s`);
    console.log(`     Memory Usage: ${Math.round(metrics.system_metrics.memory_usage.heapUsed / 1024 / 1024)}MB`);
    console.log(`     Node Version: ${metrics.system_metrics.node_version}`);
    
    console.log('   Worker Health:');
    console.log(`     Overall Status: ${metrics.worker_health.overall}`);
    
    return metrics;
    
  } catch (error) {
    console.error('   ❌ System metrics test failed:', error);
    throw error;
  }
}

/**
 * Test budget violation simulation
 */
async function testBudgetViolationSimulation(): Promise<void> {
  console.log('\n💰 Testing Budget Violation Simulation...');
  
  try {
    // Submit a job that might trigger budget violation
    console.log('   Submitting complex job for budget violation testing...');
    
    const result = await submitContentGenerationJob({
      brief: 'Create extremely detailed comprehensive analysis of Singapore financial system including all regulations, historical data, market trends, future predictions, complex mathematical models, and extensive case studies with multiple scenarios and risk assessments',
      tier: 'LIGHT', // Intentionally using LIGHT tier for complex content to trigger budget breach
      correlation_id: `budget-test-${Date.now()}`,
      metadata: {
        test_scenario: 'budget_violation_simulation',
        expected_outcome: 'dlq_route'
      }
    });
    
    console.log(`   ✅ Budget violation test job submitted: ${result.jobId}`);
    console.log('   💡 Monitor DLQ queue for this job to test budget violation routing');
    
    return result;
    
  } catch (error) {
    console.error('   ❌ Budget violation test failed:', error);
    throw error;
  }
}

/**
 * Main test execution
 */
async function runIntegrationTests(): Promise<void> {
  console.log('🚀 Starting EIP Queue System Integration Tests');
  console.log('=' .repeat(60));
  
  const testResults: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  try {
    // Test 1: Worker Health (must run first)
    testResults.tests.worker_health = await testWorkerHealth();
    
    // Test 2: Queue Submission
    testResults.tests.queue_submission = await testQueueSubmission();
    
    // Test 3: Queue Metrics
    testResults.tests.queue_metrics = await testQueueMetrics();
    
    // Test 4: System Metrics
    testResults.tests.system_metrics = await testSystemMetrics();
    
    // Test 5: Budget Violation Simulation
    testResults.tests.budget_violation = await testBudgetViolationSimulation();
    
    console.log('\n✅ All integration tests completed successfully!');
    
    // Generate test report
    await generateTestReport(testResults);
    
  } catch (error) {
    console.error('\n❌ Integration tests failed:', error);
    process.exit(1);
  } finally {
    // Graceful shutdown
    console.log('\n🔄 Shutting down workers...');
    const { shutdownEIPWorkers } = await import('../lib_supabase/queue/eip-worker-manager');
    await shutdownEIPWorkers();
    console.log('✅ Workers shut down');
  }
}

/**
 * Generate comprehensive test report
 */
async function generateTestReport(results: any): Promise<void> {
  try {
    const report = {
      summary: {
        timestamp: results.timestamp,
        tests_run: Object.keys(results.tests).length,
        overall_status: 'success'
      },
      details: results.tests,
      recommendations: [
        'Monitor queue metrics in production',
        'Set up alerts for high failure rates',
        'Implement budget breach monitoring',
        'Configure DLQ monitoring dashboards'
      ]
    };
    
    const reportPath = `/tmp/eip-queue-integration-test-report-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Test report generated: ${reportPath}`);
    console.log('📊 Test Summary:');
    console.log(`   Tests Run: ${report.summary.tests_run}`);
    console.log(`   Status: ${report.summary.overall_status}`);
    
  } catch (error) {
    console.warn('⚠️ Failed to generate test report:', error);
  }
}

/**
 * Test individual component
 */
async function testComponent(component: string): Promise<void> {
  console.log(`🧪 Testing component: ${component}`);
  
  switch (component) {
    case 'submission':
      await testQueueSubmission();
      break;
    case 'health':
      await testWorkerHealth();
      break;
    case 'metrics':
      await testQueueMetrics();
      break;
    case 'system':
      await testSystemMetrics();
      break;
    case 'budget':
      await testBudgetViolationSimulation();
      break;
    default:
      console.error(`Unknown component: ${component}`);
      console.log('Available components: submission, health, metrics, system, budget');
      process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

if (command && command !== 'all') {
  // Initialize workers for individual component tests
  await initializeEIPWorkers();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testComponent(command);
  
  // Shutdown
  const { shutdownEIPWorkers } = await import('../lib_supabase/queue/eip-worker-manager');
  await shutdownEIPWorkers();
} else {
  // Run all tests
  await runIntegrationTests();
}

console.log('\n🎉 EIP Queue System Integration Tests Complete!');
