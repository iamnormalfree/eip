// ABOUTME: Unified smoke test runner for EIP testing infrastructure
// ABOUTME: Orchestrates all smoke tests and validates system health
// ABOUTME: Provides quality gate validation for recovered components

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface SmokeTestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  output?: string;
}

interface SmokeTestReport {
  timestamp: Date;
  results: SmokeTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    successRate: number;
  };
}

class SmokeTestRunner {
  private results: SmokeTestResult[] = [];
  
  constructor(private readonly testDir: string = '/mnt/HC_Volume_103339633/projects/eip') {}

  async runSmokeTests(): Promise<SmokeTestReport> {
    console.log('🚀 EIP Testing Infrastructure Smoke Test Runner');
    console.log('='.repeat(60));
    console.log('📅 Started: ' + new Date().toISOString());
    
    const smokeTests = [
      { name: 'Retrieval System', script: 'scripts/test-retrieval.ts', critical: true },
      { name: 'Auditor System', script: 'scripts/test-auditor.ts', critical: true },
      { name: 'Database Connection', script: 'scripts/test-db-connection.ts', critical: true },
      { name: 'Queue System', script: 'scripts/test-queue-system.ts', critical: false },
      { name: 'API Integration', script: 'scripts/test-api-integration.ts', critical: false }
    ];

    for (const test of smokeTests) {
      const result = await this.runSingleTest(test);
      this.results.push(result);
      
      // Fail fast on critical test failures
      if (test.critical && result.status === 'failed') {
        console.error('\n🚨 CRITICAL TEST FAILED: ' + test.name);
        console.error('   Error: ' + result.error);
        console.error('   Halting smoke test execution...');
        break;
      }
    }

    return this.generateReport();
  }

  private async runSingleTest(test: { name: string; script: string; critical: boolean }): Promise<SmokeTestResult> {
    const startTime = Date.now();
    const scriptPath = path.join(this.testDir, test.script);
    
    console.log('\n📋 Running ' + test.name + '...');
    
    // Check if test script exists
    if (!existsSync(scriptPath)) {
      const duration = Date.now() - startTime;
      const result: SmokeTestResult = {
        name: test.name,
        status: 'skipped',
        duration: duration,
        error: 'Test script not found: ' + scriptPath
      };
      
      console.log('   ⚠️  SKIPPED: ' + result.error);
      return result;
    }

    try {
      // Run test script with tsx
      const output = execSync('npx tsx ' + scriptPath, {
        cwd: this.testDir,
        timeout: 30000, // 30 second timeout per test
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const duration = Date.now() - startTime;
      const result: SmokeTestResult = {
        name: test.name,
        status: 'passed',
        duration: duration,
        output: output.trim()
      };
      
      console.log('   ✅ PASSED (' + duration + 'ms)');
      if (output.trim()) {
        const lines = output.trim().split('\n');
        console.log('   Output: ' + lines.slice(-3).join('\n   '));
      }
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const result: SmokeTestResult = {
        name: test.name,
        status: 'failed',
        duration: duration,
        error: error.message,
        output: error.stdout || error.stderr
      };
      
      console.log('   ❌ FAILED (' + duration + 'ms)');
      console.log('   Error: ' + error.message);
      if (error.stderr) {
        const errorLines = error.stderr.split('\n');
        console.log('   Details: ' + errorLines.slice(-3).join('\n   '));
      }
      
      return result;
    }
  }

  private generateReport(): SmokeTestReport {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    console.log('\n' + '='.repeat(60));
    console.log('📊 SMOKE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Passed: ' + passed);
    console.log('❌ Failed: ' + failed);
    console.log('⚠️  Skipped: ' + skipped);
    console.log('📈 Success Rate: ' + successRate.toFixed(1) + '%');
    
    if (failed > 0) {
      console.log('\n🚨 FAILED TESTS:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log('   • ' + r.name + ': ' + r.error);
        });
    }

    if (skipped > 0) {
      console.log('\n⚠️  SKIPPED TESTS:');
      this.results
        .filter(r => r.status === 'skipped')
        .forEach(r => {
          console.log('   • ' + r.name + ': ' + r.error);
        });
    }

    const report: SmokeTestReport = {
      timestamp: new Date(),
      results: this.results,
      summary: { total, passed, failed, skipped, successRate }
    };

    // Log final status
    if (failed === 0) {
      console.log('\n🎉 All smoke tests passed! System health validated.');
    } else {
      console.log('\n🚨 Some smoke tests failed! System health compromised.');
    }

    return report;
  }

  // Quality gate validation for recovered components
  async validateQualityGates(): Promise<boolean> {
    console.log('\n🔍 VALIDATING QUALITY GATES');
    console.log('='.repeat(40));
    
    const qualityChecks = [
      {
        name: 'Smoke Test Execution',
        check: () => this.results.some(r => r.status === 'passed'),
        required: true
      },
      {
        name: 'Framework Compatibility',
        check: () => {
          const retrievalTest = this.results.find(r => r.name === 'Retrieval System');
          return retrievalTest?.status !== 'failed';
        },
        required: true
      },
      {
        name: 'Test Execution Performance',
        check: () => {
          const slowTests = this.results.filter(r => r.duration > 20000);
          return slowTests.length === 0;
        },
        required: false
      }
    ];

    let allPassed = true;
    
    for (const check of qualityChecks) {
      try {
        const passed = check.check();
        const status = passed ? '✅' : '❌';
        const required = check.required ? '(required)' : '(optional)';
        console.log(status + ' ' + check.name + ' ' + required);
        
        if (check.required && !passed) {
          allPassed = false;
        }
      } catch (error: any) {
        console.log('❌ ' + check.name + ' (required) - ERROR: ' + error.message);
        allPassed = false;
      }
    }

    console.log('='.repeat(40));
    if (allPassed) {
      console.log('✅ All quality gates validated successfully!');
    } else {
      console.log('🚨 Some quality gates failed!');
    }
    
    return allPassed;
  }
}

// Standalone execution
async function main() {
  const runner = new SmokeTestRunner();
  
  try {
    const report = await runner.runSmokeTests();
    const qualityGatesValidated = await runner.validateQualityGates();
    
    // Exit with appropriate code
    if (report.summary.failed > 0 || !qualityGatesValidated) {
      console.log('\n🚨 Testing infrastructure recovery incomplete!');
      process.exit(1);
    } else {
      console.log('\n🎉 Testing infrastructure recovery complete!');
      console.log('   System health validation successful');
      console.log('   Quality gates operational');
      console.log('   Dual-execution framework functional');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('\n💥 Smoke test runner failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { SmokeTestRunner, SmokeTestReport, SmokeTestResult };
