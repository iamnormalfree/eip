// Check if database migrations were properly applied
require('dotenv').config({ path: '.env.local' });

async function checkMigrationStatus() {
  console.log('🔍 CHECKING DATABASE MIGRATION STATUS');
  console.log('======================================\n');

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. CHECKING SCHEMA REGISTRY TABLE STRUCTURE:');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_schema', { table_name: 'eip_schema_registry' })
      .catch(() => ({ data: null, error: { message: 'Function not available' } }));

    if (tableError) {
      console.log('   Using alternative method to check table structure...');

      // Try to query all columns to see what exists
      const { data: sampleData, error: sampleError } = await supabase
        .from('eip_schema_registry')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log(`   ❌ Cannot access table: ${sampleError.message}`);
        return;
      }

      if (sampleData && sampleData.length > 0) {
        const availableColumns = Object.keys(sampleData[0]);
        console.log('   Available columns:');
        availableColumns.forEach(col => console.log(`     - ${col}`));
      } else {
        console.log('   ❌ No data in table to inspect columns');
      }
    }

    console.log('\n2. CHECKING BUILD HISTORY TABLE:');
    const { data: historyTableCheck, error: historyError } = await supabase
      .from('eip_index_build_history')
      .select('count')
      .limit(1);

    if (historyError) {
      console.log(`   ❌ Build history table issue: ${historyError.message}`);
      console.log('   This suggests the migration was not fully applied');
    } else {
      console.log('   ✅ Build history table exists and accessible');
    }

    console.log('\n3. TESTING MIGRATION RE-APPLICATION:');
    console.log('   Checking if migration file exists...');
    const fs = require('fs');
    const migrationPath = './supabase/migrations/20251114185745_extend_schema_registry_bm25.sql';

    if (fs.existsSync(migrationPath)) {
      console.log('   ✅ Migration file exists');

      const migrationContent = fs.readFileSync(migrationPath, 'utf8');
      const hasCreatedAtColumn = migrationContent.includes('ADD COLUMN IF NOT EXISTS created_at');
      const hasBuildHistoryTable = migrationContent.includes('CREATE TABLE IF NOT EXISTS eip_index_build_history');

      console.log(`   Has created_at column: ${hasCreatedAtColumn ? '✅' : '❌'}`);
      console.log(`   Has build history table: ${hasBuildHistoryTable ? '✅' : '❌'}`);
    } else {
      console.log('   ❌ Migration file not found');
    }

    console.log('\n4. CHECKING DATABASE FUNCTION:');
    const { data: functionCheck, error: functionError } = await supabase
      .rpc('get_active_bm25_index')
      .catch(() => ({ data: null, error: { message: 'Function not available' } }));

    if (functionError) {
      console.log(`   ❌ get_active_bm25_index function: ${functionError.message}`);
    } else {
      console.log('   ✅ get_active_bm25_index function works');
      console.log(`   Active index data: ${functionCheck ? 'Available' : 'None'}`);
    }

    console.log('\n🎯 MIGRATION STATUS VERDICT:');
    console.log('============================');

  } catch (error) {
    console.error('❌ Migration check failed:', error.message);
  }
}

checkMigrationStatus();