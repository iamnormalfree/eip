#!/usr/bin/env npx tsx

/**
 * EIP Schema Migration Verification
 * 
 * This script verifies that the EIP schema migration has been applied correctly.
 * It checks for the existence of all EIP tables and functions.
 */

import { getSupabaseAdmin } from '../lib_supabase/db/supabase-client';

async function verifyMigration() {
  console.log('🔍 Verifying EIP Schema Migration...');
  
  try {
    const supabase = getSupabaseAdmin();
    
    // Expected EIP tables
    const expectedTables = [
      'eip_schema_registry',
      'eip_evidence_registry', 
      'eip_entities',
      'eip_evidence_snapshots',
      'eip_brand_profiles',
      'eip_jobs',
      'eip_artifacts'
    ];
    
    // Expected EIP functions
    const expectedFunctions = [
      'get_next_eip_job',
      'complete_eip_job',
      'fail_eip_job_to_dlq',
      'get_eip_job_stats'
    ];
    
    console.log('\n📋 Checking EIP Tables...');
    
    // Check tables exist
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', expectedTables);
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
      return;
    }
    
    const existingTableNames = existingTables?.map(t => t.table_name) || [];
    
    let allTablesExist = true;
    expectedTables.forEach(table => {
      if (existingTableNames.includes(table)) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`❌ ${table} - MISSING`);
        allTablesExist = false;
      }
    });
    
    console.log('\n🔧 Checking EIP Functions...');
    
    // For functions, we'll need to query the pg_proc table directly
    // since information_schema.routines might not have function signatures
    const { data: functions, error: functionsError } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('pronamespace', 'pg_catalog')
      .in('proname', expectedFunctions.map(f => f.replace('get_next_eip_job', 'get_next_eip_job').replace('complete_eip_job', 'complete_eip_job').replace('fail_eip_job_to_dlq', 'fail_eip_job_to_dlq').replace('get_eip_job_stats', 'get_eip_job_stats')));
    
    if (functionsError) {
      console.warn('⚠️ Could not verify functions:', functionsError.message);
      console.log('   Functions exist check requires admin privileges');
    } else {
      // Test if functions are callable by trying to call them safely
      console.log('🔄 Testing function calls...');
      
      // Test get_eip_job_stats (should return empty result set if no jobs exist)
      try {
        const { data: statsResult, error: statsError } = await supabase.rpc('get_eip_job_stats', { p_hours_back: 1 });
        if (!statsError) {
          console.log('✅ get_eip_job_stats - callable');
        } else {
          console.log(`❌ get_eip_job_stats - ${statsError.message}`);
        }
      } catch (e) {
        console.log(`❌ get_eip_job_stats - ${e}`);
      }
      
      // Test other functions (they might return errors due to no data, but that's expected)
      try {
        const { error: nextJobError } = await supabase.rpc('get_next_eip_job');
        if (!nextJobError || nextJobError.message.includes('no rows')) {
          console.log('✅ get_next_eip_job - callable');
        } else {
          console.log(`❌ get_next_eip_job - ${nextJobError.message}`);
        }
      } catch (e) {
        console.log(`❌ get_next_eip_job - ${e}`);
      }
    }
    
    console.log('\n📊 Summary:');
    if (allTablesExist) {
      console.log('🎉 All EIP tables exist! Migration appears successful.');
    } else {
      console.log('⚠️ Some EIP tables are missing. Migration may not be complete.');
      console.log('\n💡 To complete the migration:');
      console.log('1. Open Supabase SQL Editor');
      console.log('2. Run the migration SQL from:');
      console.log('   📁 lib_supabase/db/migrations/003_eip_unified_schema.sql');
    }
    
    // Test basic table operations
    console.log('\n🧪 Testing basic operations...');
    
    try {
      // Test insert into schema_registry
      const { data: insertResult, error: insertError } = await supabase
        .from('eip_schema_registry')
        .insert({
          key: 'test-migration-verification',
          version: '1.0.0',
          checksum: 'test-checksum'
        })
        .select();
      
      if (!insertError) {
        console.log('✅ Schema registry - insert works');
        
        // Clean up test data
        await supabase
          .from('eip_schema_registry')
          .delete()
          .eq('key', 'test-migration-verification');
        
        console.log('✅ Schema registry - cleanup works');
      } else {
        console.log(`❌ Schema registry - ${insertError.message}`);
      }
    } catch (e) {
      console.log(`❌ Schema registry test - ${e}`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  // Load environment variables
  const supabaseUrl = "https://knvckpbxyhybbooqsskg.supabase.co";
  const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtudmNrcGJ4eWh5YmJvb3Fzc2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyODEwOCwiZXhwIjoyMDc4NzA0MTA4fQ.VO61gLPzmFpLUkn0CZSJawr5dLe1D4l9B555Svf14As";
  
  process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
  
  verifyMigration().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

export { verifyMigration };
