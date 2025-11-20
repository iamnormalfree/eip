#!/usr/bin/env node

// ABOUTME: End-to-end test script for EIP compliance database migration
// ABOUTME: Validates all components work together correctly

const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');
const { ComplianceDatabaseExtension } = require('../orchestrator/database-compliance-v2');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const testResults = {
    passed: 0,
    failed: 0,
    details: []
};

function logTest(name, passed, message) {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name} - ${message}`);
    
    testResults[passed ? 'passed' : 'failed']++;
    testResults.details.push({ name, passed, message });
}

async function testDatabaseConnections() {
    console.log('\n🔍 Testing Database Connections...');
    
    try {
        // Test Supabase connection
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        const { data, error } = await supabase.from('eip_jobs').select('count', { count: 'exact', head: true });
        
        if (error) {
            logTest('Supabase Connection', false, error.message);
            return { supabase: null, redis: null };
        }
        
        logTest('Supabase Connection', true, 'Connected successfully');
        
        // Test Redis connection
        const redis = new Redis(REDIS_URL);
        await redis.ping();
        await redis.quit();
        
        logTest('Redis Connection', true, 'Connected successfully');
        
        return { supabase, redis: new Redis(REDIS_URL) };
        
    } catch (error) {
        logTest('Database Connections', false, error.message);
        return { supabase: null, redis: null };
    }
}

async function testComplianceDatabaseExtension() {
    console.log('\n🔍 Testing Compliance Database Extension...');
    
    try {
        const complianceDb = new ComplianceDatabaseExtension();
        
        // Test storing compliance validation
        const mockComplianceReport = {
            status: 'compliant',
            overall_score: 85,
            violations: [],
            authority_level: 'high',
            processing_time_ms: 1500,
            evidence_summary: {
                total_sources: 5,
                high_authority_sources: 3,
                medium_authority_sources: 2,
                low_authority_sources: 0,
                stale_sources: 0,
                accessible_sources: 5
            },
            metadata: {
                processing_tier: 'MEDIUM'
            }
        };
        
        const storeResult = await complianceDb.storeComplianceValidation({
            job_id: 'test-job-' + Date.now(),
            artifact_id: 'test-artifact-' + Date.now(),
            compliance_report: mockComplianceReport,
            validation_metadata: {
                content_length: 1500,
                sources_count: 5,
                validation_level: 'standard',
                correlation_id: 'test-' + Date.now()
            }
        });
        
        if (!storeResult.success) {
            logTest('Compliance Storage', false, storeResult.error || 'Storage failed');
            return;
        }
        
        logTest('Compliance Storage', true, 'Stored successfully with ID: ' + storeResult.result_id);
        
        // Test retrieving compliance validation
        const getResult = await complianceDb.getComplianceValidation(storeResult.result_id);
        
        if (getResult.error || !getResult.validation) {
            logTest('Compliance Retrieval', false, getResult.error || 'Retrieval failed');
            return;
        }
        
        logTest('Compliance Retrieval', true, 'Retrieved successfully');
        
        // Test data integrity
        const validation = getResult.validation;
        if (validation.compliance_score !== 85 || 
            validation.authority_level !== 'high' ||
            validation.sources_count !== 5) {
            logTest('Data Integrity', false, 'Data mismatch during storage/retrieval');
            return;
        }
        
        logTest('Data Integrity', true, 'All data preserved correctly');
        
    } catch (error) {
        logTest('Compliance Database Extension', false, error.message);
    }
}

async function testRedisFallback() {
    console.log('\n🔍 Testing Redis Fallback...');
    
    try {
        // Create compliance database with forced Redis fallback
        const complianceDb = new ComplianceDatabaseExtension();
        // Force Redis fallback by setting the internal flag
        complianceDb.useRedisFallback = true;
        
        const storeResult = await complianceDb.storeComplianceValidation({
            job_id: 'redis-fallback-test-' + Date.now(),
            artifact_id: 'redis-fallback-artifact-' + Date.now(),
            compliance_report: {
                status: 'compliant',
                overall_score: 75,
                violations: [],
                authority_level: 'medium',
                processing_time_ms: 2000,
                evidence_summary: { total_sources: 3, high_authority_sources: 1, medium_authority_sources: 2, low_authority_sources: 0, stale_sources: 0, accessible_sources: 3 },
                metadata: { processing_tier: 'MEDIUM' }
            },
            validation_metadata: {
                content_length: 1000,
                sources_count: 3,
                validation_level: 'standard'
            }
        });
        
        if (!storeResult.success) {
            logTest('Redis Fallback Storage', false, storeResult.error || 'Redis storage failed');
            return;
        }
        
        logTest('Redis Fallback Storage', true, 'Stored in Redis successfully');
        
        // Test retrieval from Redis fallback
        const getResult = await complianceDb.getComplianceValidation(storeResult.result_id);
        
        if (getResult.error || !getResult.validation) {
            logTest('Redis Fallback Retrieval', false, getResult.error || 'Redis retrieval failed');
            return;
        }
        
        logTest('Redis Fallback Retrieval', true, 'Retrieved from Redis successfully');
        
    } catch (error) {
        logTest('Redis Fallback', false, error.message);
    }
}

async function testComplianceStatistics() {
    console.log('\n🔍 Testing Compliance Statistics...');
    
    try {
        const complianceDb = new ComplianceDatabaseExtension();
        
        // Store some test data
        const testData = [
            { score: 85, status: 'compliant' },
            { score: 45, status: 'non_compliant' },
            { score: 92, status: 'compliant' }
        ];
        
        for (let i = 0; i < testData.length; i++) {
            await complianceDb.storeComplianceValidation({
                job_id: 'stats-test-' + i + '-' + Date.now(),
                compliance_report: {
                    status: testData[i].status,
                    overall_score: testData[i].score,
                    violations: testData[i].status === 'compliant' ? [] : [{ type: 'test', severity: 'low' }],
                    authority_level: 'medium',
                    processing_time_ms: 1500,
                    evidence_summary: { total_sources: 3, high_authority_sources: 1, medium_authority_sources: 2, low_authority_sources: 0, stale_sources: 0, accessible_sources: 3 },
                    metadata: { processing_tier: 'MEDIUM' }
                },
                validation_metadata: {
                    content_length: 1000,
                    sources_count: 3,
                    validation_level: 'standard'
                }
            });
        }
        
        // Get statistics
        const stats = await complianceDb.getComplianceStatistics(24);
        
        if (stats.error) {
            logTest('Compliance Statistics', false, stats.error);
            return;
        }
        
        if (stats.total_validations < 3) {
            logTest('Compliance Statistics', false, 'Expected at least 3 validations, got ' + stats.total_validations);
            return;
        }
        
        logTest('Compliance Statistics', true, 
            `Total: ${stats.total_validations}, Compliant: ${stats.compliant_count}, Non-compliant: ${stats.non_compliant_count}`);
        
    } catch (error) {
        logTest('Compliance Statistics', false, error.message);
    }
}

async function testMigrationValidation() {
    console.log('\n🔍 Testing Migration Validation Functions...');
    
    try {
        const { validateComplianceRecord } = require('./migrate-compliance-data-redis-to-supabase.js');
        
        // Test valid record
        const validRecord = {
            id: 'test-id-123',
            job_id: 'test-job-123',
            compliance_score: 85,
            violations_count: 2,
            processing_time_ms: 1500,
            evidence_summary: JSON.stringify({ total_sources: 5 }),
            compliance_report: JSON.stringify({ status: 'compliant' })
        };
        
        const validErrors = validateComplianceRecord(validRecord);
        if (validErrors.length !== 0) {
            logTest('Migration Validation - Valid Record', false, 'Valid record failed validation: ' + validErrors.join(', '));
            return;
        }
        
        logTest('Migration Validation - Valid Record', true, 'Valid record passed validation');
        
        // Test invalid record
        const invalidRecord = {
            id: '', // Invalid
            job_id: 'test-job-123',
            compliance_score: 150, // Invalid (> 100)
            violations_count: -1, // Invalid (< 0)
            processing_time_ms: -100, // Invalid (< 0)
            evidence_summary: 'invalid-json', // Invalid JSON
            compliance_report: 'also-invalid-json' // Invalid JSON
        };
        
        const invalidErrors = validateComplianceRecord(invalidRecord);
        if (invalidErrors.length === 0) {
            logTest('Migration Validation - Invalid Record', false, 'Invalid record passed validation (should have failed)');
            return;
        }
        
        logTest('Migration Validation - Invalid Record', true, 'Invalid record correctly failed with ' + invalidErrors.length + ' errors');
        
    } catch (error) {
        logTest('Migration Validation', false, error.message);
    }
}

async function generateTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 END-TO-END TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    
    const totalTests = testResults.passed + testResults.failed;
    const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : '0.0';
    
    console.log(`Success Rate: ${successRate}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.details
            .filter(detail => !detail.passed)
            .forEach(detail => console.log(`   - ${detail.name}: ${detail.message}`));
        
        console.log('\n❌ Some tests failed. Please review the implementation.');
        return false;
    }
    
    console.log('\n🎉 All tests passed!');
    console.log('✅ EIP Compliance Database Migration implementation is working correctly.');
    
    console.log('\nNext steps:');
    console.log('   1. Run database migration: npm run db:migrate');
    console.log('   2. Validate migration: node scripts/validate-compliance-migration.js');
    console.log('   3. Run data migration when ready: node scripts/migrate-compliance-data-redis-to-supabase.js');
    
    return true;
}

async function main() {
    console.log('🧪 EIP Compliance Database Migration - End-to-End Test');
    console.log('='.repeat(60));
    
    try {
        // Run all tests
        await testDatabaseConnections();
        await testComplianceDatabaseExtension();
        await testRedisFallback();
        await testComplianceStatistics();
        await testMigrationValidation();
        
        // Generate report
        const allTestsPassed = await generateTestReport();
        
        process.exit(allTestsPassed ? 0 : 1);
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// Run tests
if (require.main === module) {
    main();
}

module.exports = { main, testResults };
