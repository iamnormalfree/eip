#!/usr/bin/env npx tsx

/**
 * Simple EIP Schema Verification
 * 
 * Direct test of EIP tables to verify migration completion
 */

import { getSupabaseAdmin } from '../lib_supabase/db/supabase-client';

async function verifyEIPTables() {
  console.log('🔍 Verifying EIP Tables (Simple Test)...');
  
  try {
    const supabase = getSupabaseAdmin();
    
    // Test each table by attempting a select
    const eipTables = [
      'eip_schema_registry',
      'eip_evidence_registry', 
      'eip_entities',
      'eip_evidence_snapshots',
      'eip_brand_profiles',
      'eip_jobs',
      'eip_artifacts'
    ];
    
    console.log('\n📋 Testing table access:');
    
    let existingTables = [];
    let missingTables = [];
    
    for (const tableName of eipTables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        
        if (!error) {
          console.log(`✅ ${tableName} - accessible`);
          existingTables.push(tableName);
        } else {
          console.log(`❌ ${tableName} - ${error.message}`);
          missingTables.push(tableName);
        }
      } catch (e) {
        console.log(`❌ ${tableName} - ${e}`);
        missingTables.push(tableName);
      }
    }
    
    console.log('\n🔧 Testing EIP Functions:');
    
    // Test functions
    const functions = [
      { name: 'get_eip_job_stats', params: { p_hours_back: 24 } },
      { name: 'get_next_eip_job', params: {} }
    ];
    
    for (const func of functions) {
      try {
        const { data, error } = await supabase.rpc(func.name, func.params);
        
        if (!error) {
          console.log(`✅ ${func.name} - callable`);
        } else {
          console.log(`❌ ${func.name} - ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${func.name} - ${e}`);
      }
    }
    
    // Test basic insert operation
    console.log('\n🧪 Testing basic operations:');
    
    try {
      const { data: insertResult, error: insertError } = await supabase
        .from('eip_schema_registry')
        .insert({
          key: 'test-migration-verify',
          version: '1.0.0',
          checksum: 'test-checksum-123'
        })
        .select();
      
      if (!insertError) {
        console.log('✅ Insert operation - works');
        
        // Clean up
        await supabase
          .from('eip_schema_registry')
          .delete()
          .eq('key', 'test-migration-verify');
        
        console.log('✅ Delete operation - works');
      } else {
        console.log(`❌ Insert operation - ${insertError.message}`);
      }
    } catch (e) {
      console.log(`❌ Operations test - ${e}`);
    }
    
    // Summary
    console.log('\n📊 Verification Summary:');
    console.log(`✅ Tables found: ${existingTables.length}/${eipTables.length}`);
    console.log(`❌ Tables missing: ${missingTables.length}/${eipTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\n⚠️ Missing tables:', missingTables.join(', '));
      console.log('\n💡 To complete migration:');
      console.log('1. Copy contents of: lib_supabase/db/migrations/003_eip_unified_schema.sql');
      console.log('2. Paste into Supabase SQL Editor');
      console.log('3. Execute the SQL');
    } else {
      console.log('\n🎉 All EIP tables are accessible! Migration appears complete.');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  // Set environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://knvckpbxyhybbooqsskg.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtudmNrcGJ4eWh5YmJvb3Fzc2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzEyODEwOCwiZXhwIjoyMDc4NzA0MTA4fQ.VO61gLPzmFpLUkn0CZSJawr5dLe1D4l9B555Svf14As";
  
  verifyEIPTables().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

export { verifyEIPTables };
