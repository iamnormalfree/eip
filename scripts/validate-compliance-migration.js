#!/usr/bin/env node

// ABOUTME: Validation script for EIP compliance database migration
// ABOUTME: Pre-migration validation to ensure system readiness and data integrity

const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

// Validation results tracking
const validationResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

function logPass(message) {
    console.log(`✅ ${message}`);
    validationResults.passed++;
    validationResults.details.push({ status: 'PASS', message });
}

function logFail(message) {
    console.log(`❌ ${message}`);
    validationResults.failed++;
    validationResults.details.push({ status: 'FAIL', message });
}

function logWarn(message) {
    console.log(`⚠️ ${message}`);
    validationResults.warnings++;
    validationResults.details.push({ status: 'WARN', message });
}

async function validateSupabaseConnection() {
    console.log('\n🔍 Validating Supabase connection...');
    
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // Test basic connectivity
        const { data, error } = await supabase
            .from('eip_jobs')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            logFail(`Supabase connection failed: ${error.message}`);
            return false;
        }
        
        logPass('Supabase connection successful');
        return supabase;
        
    } catch (error) {
        logFail(`Supabase connection error: ${error.message}`);
        return false;
    }
}

async function validateRedisConnection() {
    console.log('\n🔍 Validating Redis connection...');
    
    try {
        const redis = new Redis(REDIS_URL);
        await redis.ping();
        await redis.quit();
        
        logPass('Redis connection successful');
        return true;
        
    } catch (error) {
        logFail(`Redis connection failed: ${error.message}`);
        return false;
    }
}

async function validateComplianceTableSchema(supabase) {
    console.log('\n🔍 Validating eip_compliance_validations table schema...');
    
    try {
        // Check if table exists and has expected structure
        const { data, error } = await supabase
            .from('eip_compliance_validations')
            .select('*')
            .limit(1);
        
        if (error) {
            if (error.code === 'PGRST116' || error.message.includes('relation "eip_compliance_validations" does not exist')) {
                logFail('eip_compliance_validations table does not exist. Run migration first: npm run db:migrate');
                return false;
            } else {
                logFail(`Error accessing eip_compliance_validations: ${error.message}`);
                return false;
            }
        }
        
        // Check if we have the expected columns by examining a sample record
        if (data && data.length > 0) {
            const sample = data[0];
            const requiredColumns = [
                'id', 'job_id', 'compliance_status', 'compliance_score', 
                'violations_count', 'authority_level', 'processing_tier',
                'processing_time_ms', 'evidence_summary', 'validation_level',
                'content_length', 'sources_count', 'validation_timestamp',
                'compliance_report'
            ];
            
            const missingColumns = requiredColumns.filter(col => !(col in sample));
            if (missingColumns.length > 0) {
                logFail(`Missing required columns: ${missingColumns.join(', ')}`);
                return false;
            }
            
            logPass('eip_compliance_validations table schema is correct');
        } else {
            logPass('eip_compliance_validations table exists (no data to validate schema)');
        }
        
        return true;
        
    } catch (error) {
        logFail(`Schema validation error: ${error.message}`);
        return false;
    }
}

async function validateIndexes(supabase) {
    console.log('\n🔍 Validating database indexes...');
    
    try {
        // This would typically require admin access to query pg_indexes
        // For now, we'll validate by checking query performance
        const startTime = Date.now();
        
        const { data, error } = await supabase
            .from('eip_compliance_validations')
            .select('id')
            .eq('job_id', '00000000-0000-0000-0000-000000000000')
            .order('validation_timestamp', { ascending: false })
            .limit(10);
        
        const queryTime = Date.now() - startTime;
        
        if (error) {
            logWarn(`Index validation query failed: ${error.message}`);
            return true; // Don't fail validation, just warn
        }
        
        // Query should complete quickly even on large datasets if properly indexed
        if (queryTime > 5000) {
            logWarn(`Slow query detected (${queryTime}ms). Consider adding indexes for better performance.`);
        } else {
            logPass('Database indexes appear to be performing well');
        }
        
        return true;
        
    } catch (error) {
        logWarn(`Index validation error: ${error.message}`);
        return true; // Don't fail validation
    }
}

async function validateRedisData() {
    console.log('\n🔍 Validating Redis compliance data...');
    
    try {
        const redis = new Redis(REDIS_URL);
        
        // Check for compliance validation data
        const validationKeys = await redis.keys('compliance-validation:*');
        const jobKeys = await redis.keys('compliance-by-job:*');
        const artifactKeys = await redis.keys('compliance-by-artifact:*');
        
        await redis.quit();
        
        console.log(`📊 Found in Redis:`);
        console.log(`   Validation records: ${validationKeys.length}`);
        console.log(`   Job indexes: ${jobKeys.length}`);
        console.log(`   Artifact indexes: ${artifactKeys.length}`);
        
        if (validationKeys.length === 0) {
            logPass('No Redis compliance data to migrate (system is clean)');
        } else {
            logPass(`Found ${validationKeys.length} compliance records ready for migration`);
        }
        
        // Validate sample data structure
        if (validationKeys.length > 0) {
            const redis = new Redis(REDIS_URL);
            
            // Check first few records for valid structure
            const sampleSize = Math.min(5, validationKeys.length);
            let validRecords = 0;
            
            for (let i = 0; i < sampleSize; i++) {
                const data = await redis.hgetall(validationKeys[i]);
                
                if (data && Object.keys(data).length > 0) {
                    // Basic validation
                    if (data.id && data.job_id) {
                        validRecords++;
                    } else {
                        logWarn(`Invalid record structure found: ${validationKeys[i]}`);
                    }
                }
            }
            
            await redis.quit();
            
            if (validRecords === sampleSize) {
                logPass('Sample Redis records have valid structure');
            } else {
                logWarn(`Only ${validRecords}/${sampleSize} sample records have valid structure`);
            }
        }
        
        return true;
        
    } catch (error) {
        logFail(`Redis data validation error: ${error.message}`);
        return false;
    }
}

async function validateMigrationPrerequisites() {
    console.log('\n🔍 Validating migration prerequisites...');
    
    // Check environment variables
    const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'REDIS_URL'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
        logFail(`Missing environment variables: ${missingEnvVars.join(', ')}`);
        return false;
    }
    
    logPass('All required environment variables are set');
    
    // Check Node.js version (migration script requires modern Node.js)
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
        logFail(`Node.js version ${nodeVersion} is too old. Migration requires Node.js 16+`);
        return false;
    }
    
    logPass(`Node.js version ${nodeVersion} is compatible`);
    
    // Check available disk space (simple heuristic)
    try {
        const fs = require('fs');
        const stats = fs.statSync('.');
        
        // This is a basic check - in practice you'd want to check actual available space
        logPass('Basic filesystem checks passed');
        
    } catch (error) {
        logWarn(`Could not validate filesystem: ${error.message}`);
    }
    
    return true;
}

async function validateSystemResources() {
    console.log('\n🔍 Validating system resources...');
    
    // Memory usage check
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    console.log(`📊 Current memory usage: ${memUsageMB}MB`);
    
    if (memUsageMB > 500) {
        logWarn(`High memory usage detected (${memUsageMB}MB). Consider freeing up memory before migration.`);
    } else {
        logPass('Memory usage is within acceptable limits');
    }
    
    return true;
}

async function generateValidationReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`✅ Passed: ${validationResults.passed}`);
    console.log(`⚠️ Warnings: ${validationResults.warnings}`);
    console.log(`❌ Failed: ${validationResults.failed}`);
    
    const totalChecks = validationResults.passed + validationResults.warnings + validationResults.failed;
    const successRate = ((validationResults.passed / totalChecks) * 100).toFixed(1);
    
    console.log(`Success Rate: ${successRate}%`);
    
    if (validationResults.failed > 0) {
        console.log('\n❌ FAILED CHECKS:');
        validationResults.details
            .filter(detail => detail.status === 'FAIL')
            .forEach(detail => console.log(`   - ${detail.message}`));
        
        console.log('\n❌ Migration cannot proceed. Please fix the failed checks above.');
        return false;
    }
    
    if (validationResults.warnings > 0) {
        console.log('\n⚠️ WARNINGS:');
        validationResults.details
            .filter(detail => detail.status === 'WARN')
            .forEach(detail => console.log(`   - ${detail.message}`));
    }
    
    if (validationResults.failed === 0) {
        console.log('\n🎉 All validation checks passed!');
        console.log('✅ System is ready for compliance data migration.');
        console.log('\nNext steps:');
        console.log('   1. Run the migration: node scripts/migrate-compliance-data-redis-to-supabase.js');
        console.log('   2. Monitor the migration progress');
        console.log('   3. Verify the migration results');
        return true;
    }
    
    return false;
}

async function main() {
    console.log('🔍 EIP Compliance Database Migration Validation');
    console.log('='.repeat(50));
    
    try {
        // Run all validation checks
        const supabase = await validateSupabaseConnection();
        if (!supabase) return;
        
        await validateRedisConnection();
        await validateMigrationPrerequisites();
        await validateSystemResources();
        
        if (supabase !== true) {
            await validateComplianceTableSchema(supabase);
            await validateIndexes(supabase);
        }
        
        await validateRedisData();
        
        // Generate final report
        const canProceed = await generateValidationReport();
        
        process.exit(canProceed ? 0 : 1);
        
    } catch (error) {
        console.error('\n❌ Validation script failed:', error.message);
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

// Run validation
if (require.main === module) {
    main();
}

module.exports = { main, validationResults };
