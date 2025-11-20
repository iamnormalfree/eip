// ABOUTME: EIP Compliance CLI - Interactive, Batch, and Monitor modes for compliance validation
// ABOUTME: Integrates with EIP queue system and compliance API for comprehensive validation workflows

import fs from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout } from 'node:timers/promises';

// Import EIP queue integration
import { submitComplianceValidationJob, getEIPQueueMetrics } from '../lib_supabase/queue/eip-queue-fixed';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

interface ComplianceJobResult {
  job_id: string;
  artifact_id?: string;
  compliance_status: 'compliant' | 'non_compliant' | 'pending' | 'error';
  compliance_score: number;
  violations_count: number;
  authority_level: 'high' | 'medium' | 'low';
  processing_tier: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  validation_timestamp: string;
  processing_time_ms: number;
  validation_level: 'standard' | 'enhanced' | 'comprehensive';
  violations?: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
    suggestion?: string;
  }>;
}

interface CLIOptions {
  mode: 'interactive' | 'batch' | 'monitor' | 'stats';
  content?: string;
  sources?: string[];
  artifactId?: string;
  domain?: string;
  validationLevel?: 'standard' | 'enhanced' | 'comprehensive';
  priority?: number;
  outputFile?: string;
  format?: 'json' | 'table' | 'summary';
  follow?: boolean;
  timeout?: number;
  pollingInterval?: number;
  hoursBack?: number;
  limit?: number;
  status?: string;
  processingTier?: string;
  authorityLevel?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function loadAllowList(): string[] {
  const p = path.join(process.cwd(), 'compliance', 'web_policy.yaml');
  if (!fs.existsSync(p)) return [];
  try {
    const txt = fs.readFileSync(p, 'utf8');
    const m = txt.match(/allow_domains:\s*\[(.*)\]/);
    if (!m) return [];
    return m[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
  } catch (error) {
    console.warn('⚠️  Warning: Could not load allowlist from web_policy.yaml');
    return [];
  }
}

function generateJobId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `compliance-${timestamp}-${random}`;
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatScore(score: number): string {
  if (score >= 80) return `🟢 ${score}/100`;
  if (score >= 60) return `🟡 ${score}/100`;
  return `🔴 ${score}/100`;
}

function createSpinner(message: string) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  let interval: NodeJS.Timeout;

  return {
    start: () => {
      interval = setInterval(() => {
        process.stdout.write(`\r${frames[i]} ${message}`);
        i = (i + 1) % frames.length;
      }, 100);
    },
    stop: (finalMessage?: string) => {
      clearInterval(interval);
      if (finalMessage) {
        process.stdout.write(`\r✅ ${finalMessage}\n`);
      } else {
        process.stdout.write('\r' + ' '.repeat(message.length + 5) + '\r');
      }
    }
  };
}

// ============================================================================
// API INTEGRATION
// ============================================================================

async function fetchFromAPI(endpoint: string, params: Record<string, any> = {}): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const url = new URL(endpoint, baseUrl);

  Object.keys(params).forEach(key => {
    if (params[key] !== undefined) {
      url.searchParams.append(key, params[key].toString());
    }
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getComplianceStats(options: {
  hoursBack?: number;
  processingTier?: string;
  includeTrend?: boolean;
  trendDays?: number;
} = {}): Promise<any> {
  return fetchFromAPI('/api/compliance/stats', options);
}

async function getRecentValidations(options: {
  page?: number;
  limit?: number;
  hoursBack?: number;
  status?: string;
  processingTier?: string;
  authorityLevel?: string;
  validationLevel?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<any> {
  return fetchFromAPI('/api/compliance/validations/recent', options);
}

async function getValidationByArtifact(artifactId: string, options: {
  includeHistory?: boolean;
  maxHistoryRecords?: number;
} = {}): Promise<any> {
  return fetchFromAPI(`/api/compliance/validations/by-artifact/${artifactId}`, options);
}

async function getViolationDetails(options: {
  page?: number;
  limit?: number;
  severity?: string;
  violationType?: string;
  domain?: string;
  processingTier?: string;
  authorityLevel?: string;
  minScoreImpact?: number;
  dateFrom?: string;
  dateTo?: string;
  artifactId?: string;
} = {}): Promise<any> {
  return fetchFromAPI('/api/compliance/violations/detail', options);
}

// ============================================================================
// JOB MONITORING
// ============================================================================

async function pollJobResult(jobId: string, timeout: number = 120000, pollingInterval: number = 5000): Promise<ComplianceJobResult> {
  const startTime = Date.now();
  const spinner = createSpinner(`Monitoring compliance job ${jobId}`);
  spinner.start();

  try {
    while (Date.now() - startTime < timeout) {
      try {
        // Try to get job result from recent validations
        const result = await getRecentValidations({ limit: 100, hoursBack: 1 });

        if (result.success && result.data?.validations) {
          const jobResult = result.data.validations.find((v: any) => v.job_id === jobId);

          if (jobResult && jobResult.compliance_status !== 'pending') {
            spinner.stop(`Compliance validation completed for job ${jobId}`);
            return jobResult;
          }
        }

        // Check queue metrics to see if job is still processing
        const metrics = await getEIPQueueMetrics();
        if (metrics?.compliance_validation?.active === 0 && metrics?.compliance_validation?.waiting === 0) {
          // No active or waiting jobs, check recent results again
          const finalResult = await getRecentValidations({ limit: 200, hoursBack: 2 });
          if (finalResult.success && finalResult.data?.validations) {
            const finalJobResult = finalResult.data.validations.find((v: any) => v.job_id === jobId);
            if (finalJobResult) {
              spinner.stop(`Compliance validation completed for job ${jobId}`);
              return finalJobResult;
            }
          }
        }

        await setTimeout(pollingInterval);
      } catch (error) {
        console.warn(`⚠️  Error polling for job result: ${error instanceof Error ? error.message : 'Unknown error'}`);
        await setTimeout(pollingInterval);
      }
    }

    spinner.stop();
    throw new Error(`Timeout waiting for compliance job ${jobId} to complete`);
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

// ============================================================================
// INTERACTIVE MODE
// ============================================================================

async function interactiveMode(): Promise<void> {
  console.log('🔍 EIP Compliance Validation - Interactive Mode');
  console.log('=' .repeat(50));

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  try {
    console.log('\n📝 Content Validation Options:');
    console.log('1. Validate from file');
    console.log('2. Validate from text input');
    console.log('3. Validate recent artifacts');

    const choice = await question('\nSelect option (1-3): ');

    let content: string = '';
    let sources: string[] = [];
    let artifactId: string | undefined;

    switch (choice) {
      case '1':
        const filePath = await question('Enter file path: ');
        try {
          const fullPath = path.resolve(filePath);
          if (!fs.existsSync(fullPath)) {
            console.error(`❌ File not found: ${fullPath}`);
            return;
          }
          content = fs.readFileSync(fullPath, 'utf8');
          console.log(`✅ Loaded content from ${fullPath} (${content.length} characters)`);
        } catch (error) {
          console.error(`❌ Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return;
        }
        break;

      case '2':
        console.log('\nEnter your content (press Ctrl+D or type "END" on a new line when finished):');
        content = await new Promise<string>((resolve) => {
          const lines: string[] = [];
          rl.on('line', (line) => {
            if (line === 'END') {
              rl.removeAllListeners('line');
              resolve(lines.join('\n'));
              return;
            }
            lines.push(line);
          });
        });
        break;

      case '3':
        console.log('\n📋 Fetching recent artifacts for validation...');
        const recentArtifacts = await getRecentValidations({ limit: 10, hoursBack: 24 });
        if (recentArtifacts.success && recentArtifacts.data?.validations.length > 0) {
          console.log('\nRecent artifacts:');
          recentArtifacts.data.validations.forEach((artifact: any, index: number) => {
            console.log(`${index + 1}. ${artifact.artifact_id || 'Unknown ID'} - ${artifact.compliance_status} (${formatScore(artifact.compliance_score)})`);
          });
          const artifactChoice = await question('\nSelect artifact to re-validate (1-10, or 0 to cancel): ');
          const artifactIndex = parseInt(artifactChoice) - 1;
          if (artifactIndex >= 0 && artifactIndex < recentArtifacts.data.validations.length) {
            const selectedArtifact = recentArtifacts.data.validations[artifactIndex];
            artifactId = selectedArtifact.artifact_id;
            console.log(`✅ Selected artifact: ${artifactId}`);
          } else {
            console.log('❌ Invalid selection or cancelled');
            return;
          }
        } else {
          console.log('❌ No recent artifacts found');
          return;
        }
        break;

      default:
        console.log('❌ Invalid option');
        return;
    }

    if (!artifactId) {
      const sourcesInput = await question('\nEnter source URLs (comma-separated, optional): ');
      sources = sourcesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

      if (sources.length > 0) {
        console.log(`📎 Sources: ${sources.length} provided`);
        const allowList = loadAllowList();
        if (allowList.length > 0) {
          const allowedSources = sources.filter(source =>
            allowList.some(domain => source.includes(domain))
          );
          console.log(`✅ ${allowedSources.length}/${sources.length} sources from allowed domains`);
        }
      }
    }

    const validationLevel = await question('Validation level (standard/enhanced/comprehensive) [standard]: ') || 'standard';
    const follow = (await question('Follow job until completion? (y/n) [y]: ') || 'y').toLowerCase() === 'y';

    console.log('\n🚀 Submitting compliance validation job...');

    const jobId = artifactId || generateJobId();
    const result = await submitComplianceValidationJob({
      job_id: jobId,
      content: content,
      sources: sources,
      artifact_id: artifactId,
      validation_level: validationLevel as any,
      context: {
        content_type: 'user_provided',
        geographical_focus: ['global'],
        language: 'en'
      }
    });

    if (!result.success) {
      console.error(`❌ Failed to submit compliance job: ${result.error}`);
      return;
    }

    console.log(`✅ Compliance validation job submitted: ${result.jobId}`);

    if (follow) {
      try {
        const jobResult = await pollJobResult(result.jobId);
        displayJobResult(jobResult);
      } catch (error) {
        console.error(`❌ Error monitoring job: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

  } finally {
    rl.close();
  }
}

// ============================================================================
// BATCH MODE
// ============================================================================

async function batchMode(options: CLIOptions): Promise<void> {
  console.log('📦 EIP Compliance Validation - Batch Mode');
  console.log('=' .repeat(50));

  if (!options.domain && !options.content) {
    console.error('❌ Either --domain or --content must be specified for batch mode');
    process.exit(1);
  }

  let jobs: Array<{ job_id: string; content: string; sources?: string[]; description?: string }> = [];

  if (options.content) {
    // Single content batch
    jobs.push({
      job_id: generateJobId(),
      content: options.content,
      sources: options.sources || [],
      description: 'Direct content input'
    });
  } else if (options.domain) {
    console.log(`🔍 Processing domain: ${options.domain}`);

    // In a full implementation, this would query the database for artifacts
    // For now, we'll simulate with example data
    console.log('📋 Batch processing requires database integration');
    console.log('   Use --content with direct input or see --help for options');
    return;
  }

  console.log(`📋 Submitting ${jobs.length} compliance validation job(s)...`);

  const spinner = createSpinner('Submitting batch jobs');
  spinner.start();

  const submittedJobs: Array<{ jobId: string; description: string }> = [];

  try {
    for (const job of jobs) {
      const result = await submitComplianceValidationJob({
        job_id: job.job_id,
        content: job.content,
        sources: job.sources || [],
        validation_level: options.validationLevel || 'standard',
        priority: options.priority
      });

      if (result.success) {
        submittedJobs.push({
          jobId: result.jobId,
          description: job.description || 'Unknown'
        });
      } else {
        console.warn(`⚠️  Failed to submit job: ${result.error}`);
      }
    }
  } catch (error) {
    spinner.stop();
    console.error(`❌ Error submitting batch jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return;
  }

  spinner.stop(`Submitted ${submittedJobs.length}/${jobs.length} jobs successfully`);

  if (options.follow && submittedJobs.length > 0) {
    console.log('\n⏳ Monitoring job completion...');
    const results: ComplianceJobResult[] = [];

    for (const submittedJob of submittedJobs) {
      try {
        const result = await pollJobResult(submittedJob.jobId, options.timeout, options.pollingInterval);
        results.push(result);
        console.log(`✅ ${submittedJob.description}: ${result.compliance_status} (${formatScore(result.compliance_score)})`);
      } catch (error) {
        console.log(`❌ ${submittedJob.description}: Failed to monitor - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Display batch results
    if (results.length > 0) {
      displayBatchResults(results, options);
    }
  }
}

// ============================================================================
// MONITOR MODE
// ============================================================================

async function monitorMode(options: CLIOptions): Promise<void> {
  console.log('📊 EIP Compliance Validation - Monitor Mode');
  console.log('=' .repeat(50));

  const hoursBack = options.hoursBack || 24;
  const limit = options.limit || 20;

  console.log(`📈 Fetching recent compliance validations (last ${hoursBack}h)...`);

  try {
    const result = await getRecentValidations({
      page: 1,
      limit: limit,
      hoursBack: hoursBack,
      status: options.status,
      processingTier: options.processingTier,
      authorityLevel: options.authorityLevel,
      sortBy: options.sortBy || 'validation_timestamp',
      sortOrder: options.sortOrder || 'desc'
    });

    if (!result.success) {
      console.error(`❌ Failed to fetch validation data: ${result.error}`);
      return;
    }

    const validations = result.data?.validations || [];

    if (validations.length === 0) {
      console.log('📋 No compliance validations found matching the criteria');
      return;
    }

    console.log(`✅ Found ${validations.length} validation(s)`);

    if (options.format === 'json' && options.outputFile) {
      fs.writeFileSync(options.outputFile, JSON.stringify(result.data, null, 2));
      console.log(`📄 Results saved to ${options.outputFile}`);
    } else {
      displayMonitorResults(validations, options);
    }

    // Show queue metrics
    console.log('\n📊 Queue Metrics:');
    const metrics = await getEIPQueueMetrics();
    if (metrics) {
      console.log(`   Active: ${metrics.compliance_validation.active}`);
      console.log(`   Waiting: ${metrics.compliance_validation.waiting}`);
      console.log(`   Completed: ${metrics.compliance_validation.completed}`);
      console.log(`   Failed: ${metrics.compliance_validation.failed}`);
    }

  } catch (error) {
    console.error(`❌ Error in monitor mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// STATS MODE
// ============================================================================

async function statsMode(options: CLIOptions): Promise<void> {
  console.log('📊 EIP Compliance Validation - Statistics');
  console.log('=' .repeat(50));

  try {
    const stats = await getComplianceStats({
      hoursBack: options.hoursBack || 24,
      processingTier: options.processingTier,
      includeTrend: true,
      trendDays: 7
    });

    if (!stats.success) {
      console.error(`❌ Failed to fetch statistics: ${stats.error}`);
      return;
    }

    displayStatistics(stats.data);

  } catch (error) {
    console.error(`❌ Error fetching statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

function displayJobResult(result: ComplianceJobResult): void {
  console.log('\n📋 Compliance Validation Result:');
  console.log('=' .repeat(40));
  console.log(`Job ID: ${result.job_id}`);
  console.log(`Status: ${result.compliance_status.toUpperCase()}`);
  console.log(`Score: ${formatScore(result.compliance_score)}`);
  console.log(`Violations: ${result.violations_count}`);
  console.log(`Authority Level: ${result.authority_level.toUpperCase()}`);
  console.log(`Processing Tier: ${result.processing_tier}`);
  console.log(`Validation Level: ${result.validation_level.toUpperCase()}`);
  console.log(`Processing Time: ${formatDuration(result.processing_time_ms)}`);
  console.log(`Timestamp: ${formatTimestamp(result.validation_timestamp)}`);

  if (result.artifact_id) {
    console.log(`Artifact ID: ${result.artifact_id}`);
  }

  if (result.violations && result.violations.length > 0) {
    console.log('\n⚠️  Violations:');
    result.violations.forEach((violation, index) => {
      const icon = violation.severity === 'critical' ? '🚨' :
                   violation.severity === 'high' ? '❌' :
                   violation.severity === 'medium' ? '⚠️' : '⚡';
      console.log(`${index + 1}. ${icon} ${violation.type}: ${violation.description}`);
      if (violation.suggestion) {
        console.log(`   💡 Suggestion: ${violation.suggestion}`);
      }
    });
  }
}

function displayBatchResults(results: ComplianceJobResult[], options: CLIOptions): void {
  console.log('\n📊 Batch Validation Summary:');
  console.log('=' .repeat(40));

  const compliant = results.filter(r => r.compliance_status === 'compliant').length;
  const nonCompliant = results.filter(r => r.compliance_status === 'non_compliant').length;
  const errors = results.filter(r => r.compliance_status === 'error').length;
  const avgScore = results.reduce((sum, r) => sum + r.compliance_score, 0) / results.length;

  console.log(`Total: ${results.length}`);
  console.log(`Compliant: 🟢 ${compliant}`);
  console.log(`Non-compliant: 🔴 ${nonCompliant}`);
  console.log(`Errors: ❌ ${errors}`);
  console.log(`Average Score: ${formatScore(Math.round(avgScore))}`);

  if (options.outputFile) {
    const outputData = {
      summary: {
        total: results.length,
        compliant,
        non_compliant: nonCompliant,
        errors,
        average_score: Math.round(avgScore),
        timestamp: new Date().toISOString()
      },
      results: results
    };

    fs.writeFileSync(options.outputFile, JSON.stringify(outputData, null, 2));
    console.log(`\n📄 Detailed results saved to ${options.outputFile}`);
  }
}

function displayMonitorResults(validations: any[], options: CLIOptions): void {
  if (options.format === 'table') {
    console.log('\n┌─────────────────────────────────────┬───────────┬───────┬─────────────┬──────────┬─────────────┐');
    console.log('│ Job ID                             │ Status    │ Score │ Violations  │ Tier     │ Time        │');
    console.log('├─────────────────────────────────────┼───────────┼───────┼─────────────┼──────────┼─────────────┤');

    validations.forEach(validation => {
      const jobId = validation.job_id.substring(0, 35);
      const status = validation.compliance_status.padEnd(9);
      const score = validation.compliance_score.toString().padEnd(5);
      const violations = validation.violations_count.toString().padEnd(11);
      const tier = validation.processing_tier.padEnd(8);
      const time = formatDuration(validation.processing_time_ms).padEnd(11);

      console.log(`│ ${jobId} │ ${status} │ ${score} │ ${violations} │ ${tier} │ ${time} │`);
    });

    console.log('└─────────────────────────────────────┴───────────┴───────┴─────────────┴──────────┴─────────────┘');
  } else if (options.format === 'summary') {
    const compliant = validations.filter((v: any) => v.compliance_status === 'compliant').length;
    const nonCompliant = validations.filter((v: any) => v.compliance_status === 'non_compliant').length;
    const errors = validations.filter((v: any) => v.compliance_status === 'error').length;
    const avgScore = validations.reduce((sum: number, v: any) => sum + v.compliance_score, 0) / validations.length;

    console.log(`\n📊 Summary (${validations.length} validations):`);
    console.log(`   Compliant: 🟢 ${compliant}`);
    console.log(`   Non-compliant: 🔴 ${nonCompliant}`);
    console.log(`   Errors: ❌ ${errors}`);
    console.log(`   Average Score: ${formatScore(Math.round(avgScore))}`);

    console.log('\n📈 Recent Validations:');
    validations.slice(0, 5).forEach((validation: any, index: number) => {
      console.log(`${index + 1}. ${validation.job_id}: ${validation.compliance_status} (${formatScore(validation.compliance_score)})`);
    });
  } else {
    // Default - detailed list
    validations.forEach((validation: any, index: number) => {
      console.log(`\n${index + 1}. ${validation.job_id}`);
      console.log(`   Status: ${validation.compliance_status.toUpperCase()}`);
      console.log(`   Score: ${formatScore(validation.compliance_score)}`);
      console.log(`   Violations: ${validation.violations_count}`);
      console.log(`   Processing Time: ${formatDuration(validation.processing_time_ms)}`);
      console.log(`   Timestamp: ${formatTimestamp(validation.validation_timestamp)}`);
      if (validation.artifact_id) {
        console.log(`   Artifact: ${validation.artifact_id}`);
      }
    });
  }
}

function displayStatistics(stats: any): void {
  console.log('\n📊 Compliance Statistics:');
  console.log('=' .repeat(30));

  if (stats.summary) {
    console.log(`Total Validations: ${stats.summary.total_validations || 0}`);
    console.log(`Compliant: 🟢 ${stats.summary.compliant_count || 0}`);
    console.log(`Non-compliant: 🔴 ${stats.summary.non_compliant_count || 0}`);
    console.log(`Error Rate: ${((stats.summary.error_rate || 0) * 100).toFixed(1)}%`);
    console.log(`Average Score: ${formatScore(Math.round(stats.summary.average_score || 0))}`);
  }

  if (stats.breakdown) {
    console.log('\n📈 by Processing Tier:');
    Object.entries(stats.breakdown.by_processing_tier || {}).forEach(([tier, data]: [string, any]) => {
      console.log(`   ${tier}: ${data.count} validations (${formatScore(Math.round(data.avg_score))})`);
    });

    console.log('\n🏛️  by Authority Level:');
    Object.entries(stats.breakdown.by_authority_level || {}).forEach(([level, data]: [string, any]) => {
      console.log(`   ${level}: ${data.count} validations (${formatScore(Math.round(data.avg_score))})`);
    });
  }

  if (stats.trend) {
    console.log('\n📈 7-Day Trend:');
    stats.trend.daily_stats.forEach((day: any) => {
      const date = new Date(day.date).toLocaleDateString();
      console.log(`   ${date}: ${day.validations} validations (${formatScore(Math.round(day.avg_score))})`);
    });
  }
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

function parseArguments(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    mode: 'interactive',
    validationLevel: 'standard',
    format: 'summary',
    follow: true,
    timeout: 120000,
    pollingInterval: 5000,
    hoursBack: 24,
    limit: 20,
    sortBy: 'validation_timestamp',
    sortOrder: 'desc'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--mode':
        options.mode = args[++i] as any;
        break;
      case '--content':
        options.content = args[++i];
        break;
      case '--sources':
        options.sources = args[++i].split(',').map(s => s.trim());
        break;
      case '--artifact-id':
        options.artifactId = args[++i];
        break;
      case '--domain':
        options.domain = args[++i];
        break;
      case '--validation-level':
        options.validationLevel = args[++i] as any;
        break;
      case '--priority':
        options.priority = parseInt(args[++i]);
        break;
      case '--output':
        options.outputFile = args[++i];
        break;
      case '--format':
        options.format = args[++i] as any;
        break;
      case '--follow':
        options.follow = args[++i] !== 'false';
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]) * 1000;
        break;
      case '--polling-interval':
        options.pollingInterval = parseInt(args[++i]) * 1000;
        break;
      case '--hours-back':
        options.hoursBack = parseInt(args[++i]);
        break;
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--status':
        options.status = args[++i];
        break;
      case '--processing-tier':
        options.processingTier = args[++i];
        break;
      case '--authority-level':
        options.authorityLevel = args[++i];
        break;
      case '--sort-by':
        options.sortBy = args[++i];
        break;
      case '--sort-order':
        options.sortOrder = args[++i] as any;
        break;
      case '--help':
      case '-h':
        displayHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`❌ Unknown option: ${arg}`);
          console.error('Use --help for available options');
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

function displayHelp(): void {
  console.log(`
🔍 EIP Compliance Validation CLI

USAGE:
  compliance-check [options]

MODES:
  interactive    Interactive mode with prompts (default)
  batch          Batch mode for multiple validations
  monitor        Monitor recent validations
  stats          Display compliance statistics

INTERACTIVE MODE OPTIONS:
  --mode interactive
  No additional options needed - you'll be prompted for input

BATCH MODE OPTIONS:
  --mode batch
  --content <text>          Content to validate (required)
  --sources <urls>          Comma-separated source URLs (optional)
  --validation-level <lvl>  standard|enhanced|comprehensive (default: standard)
  --priority <num>          Job priority (1-10)
  --follow <bool>           Follow jobs until completion (default: true)
  --timeout <seconds>       Job timeout in seconds (default: 120)
  --output <file>           Save results to file

MONITOR MODE OPTIONS:
  --mode monitor
  --hours-back <hours>      Hours to look back (default: 24)
  --limit <num>             Number of results (default: 20)
  --status <status>         Filter by status
  --processing-tier <tier>  Filter by processing tier
  --authority-level <lvl>   Filter by authority level
  --format <fmt>            table|summary|json (default: summary)
  --sort-by <field>         Sort field
  --sort-order <order>      asc|desc (default: desc)
  --output <file>           Save results to file

STATS MODE OPTIONS:
  --mode stats
  --hours-back <hours>      Hours to look back (default: 24)
  --processing-tier <tier>  Filter by processing tier
  --include-trend           Include trend data

EXAMPLES:
  compliance-check                              # Interactive mode
  compliance-check --mode interactive           # Explicit interactive mode

  compliance-check --mode batch --content "Check this text"
  compliance-check --mode batch --domain financial --output results.json

  compliance-check --mode monitor --hours-back 48 --format table
  compliance-check --mode monitor --status non_compliant --limit 50

  compliance-check --mode stats --hours-back 168 --include-trend

GLOBAL OPTIONS:
  --help, -h              Show this help message
  `);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main(): Promise<void> {
  try {
    const options = parseArguments();

    console.log('🚀 EIP Compliance Validation CLI');
    console.log(`Mode: ${options.mode.toUpperCase()}`);

    // Validate options
    if (!['interactive', 'batch', 'monitor', 'stats'].includes(options.mode)) {
      console.error(`❌ Invalid mode: ${options.mode}`);
      console.error('Use --help for available options');
      process.exit(1);
    }

    switch (options.mode) {
      case 'interactive':
        await interactiveMode();
        break;
      case 'batch':
        await batchMode(options);
        break;
      case 'monitor':
        await monitorMode(options);
        break;
      case 'stats':
        await statsMode(options);
        break;
    }

  } catch (error) {
    console.error(`❌ CLI Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the CLI
if (require.main === module) {
  main();
}