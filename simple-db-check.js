// Simple database check
require('dotenv').config({ path: '.env.local' });

async function simpleCheck() {
  console.log('🔍 SIMPLE DATABASE MIGRATION CHECK');
  console.log('===================================\n');

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('1. CHECKING SCHEMA REGISTRY:');
    const { data: schemaData, error: schemaError } = await supabase
      .from('eip_schema_registry')
      .select('key, version, index_type, created_at, document_sources, parent_version')
      .eq('version', '1.3.0')
      .limit(1);

    if (schemaError) {
      console.log(`   ❌ Error: ${schemaError.message}`);
      return;
    }

    if (schemaData && schemaData.length > 0) {
      const record = schemaData[0];
      console.log('   ✅ Table accessible');
      console.log(`   - key: ${record.key}`);
      console.log(`   - version: ${record.version}`);
      console.log(`   - index_type: ${record.index_type}`);
      console.log(`   - created_at: ${record.created_at ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   - document_sources: ${record.document_sources ? '✅ EXISTS' : '❌ NULL'}`);
      console.log(`   - parent_version: ${record.parent_version ? record.parent_version : 'NULL (expected)'}`);
    }

    console.log('\n2. CHECKING BUILD HISTORY TABLE:');
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('eip_index_build_history')
        .select('count')
        .limit(1);

      if (historyError) {
        console.log(`   ❌ Build history table: ${historyError.message}`);
        console.log('   This indicates the migration was not fully applied');
      } else {
        console.log('   ✅ Build history table exists');
      }
    } catch (err) {
      console.log(`   ❌ Build history table: ${err.message}`);
    }

    console.log('\n3. TESTING REGISTER FUNCTION:');
    try {
      const { data: funcData, error: funcError } = await supabase
        .rpc('register_bm25_index_version', {
          p_version: 'test_1.0.0',
          p_checksum: 'sha256:test123',
          p_document_count: 1,
          p_index_size_bytes: 100
        });

      if (funcError) {
        console.log(`   ❌ Function: ${funcError.message}`);
      } else {
        console.log('   ✅ Function exists and works');
      }
    } catch (err) {
      console.log(`   ❌ Function test: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

simpleCheck();