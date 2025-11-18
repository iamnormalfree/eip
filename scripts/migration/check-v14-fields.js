// Check v1.4.0 registration fields
require('dotenv').config({ path: '.env.local' });

async function checkV14Fields() {
  console.log('🔍 CHECKING V1.4.0 DATABASE REGISTRATION FIELDS');
  console.log('===============================================\n');

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('eip_schema_registry')
      .select('*')
      .eq('version', '1.4.0')
      .single();

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log('📋 REGISTRATION RECORD DETAILS:');
    console.log('===============================');

    console.log(`Registry key: ${data.key}`);
    console.log(`Version: ${data.version}`);
    console.log(`Index type: ${data.index_type}`);
    console.log(`Checksum: ${data.checksum}`);
    console.log(`Created at: ${data.created_at}`);

    console.log('\n📊 QUANTITATIVE FIELDS:');
    console.log(`Document count: ${data.document_count}`);
    console.log(`Index size bytes: ${data.index_size_bytes}`);
    console.log(`Build duration ms: ${data.build_duration_ms}`);
    console.log(`Is active: ${data.is_active}`);

    console.log('\n🔗 ARRAY/OBJECT FIELDS:');
    console.log(`Document sources: ${data.document_sources ? Array.isArray(data.document_sources) ? `Array[${data.document_sources.length}]` : 'Not array' : 'NULL'}`);
    console.log(`Field weights: ${data.field_weights ? typeof data.field_weights : 'NULL'}`);
    console.log(`Build metadata: ${data.build_metadata ? typeof data.build_metadata : 'NULL'}`);

    console.log('\n🔗 RELATIONSHIP FIELDS:');
    console.log(`Parent version: ${data.parent_version || 'NULL (no parent)'}`);

    if (data.document_sources && Array.isArray(data.document_sources)) {
      console.log(`\n📄 Document sources sample (${Math.min(3, data.document_sources.length)} of ${data.document_sources.length}):`);
      data.document_sources.slice(0, 3).forEach((source, i) => {
        console.log(`   ${i+1}. ${source}`);
      });
    }

    if (data.build_metadata) {
      console.log(`\n🔧 Build metadata preview:`);
      console.log(`   Build type: ${data.build_metadata.build_type || 'N/A'}`);
      console.log(`   Builder version: ${data.build_metadata.builder_version || 'N/A'}`);
      console.log(`   Environment: ${data.build_metadata.environment || 'N/A'}`);
      console.log(`   Timestamp: ${data.build_metadata.build_timestamp || 'N/A'}`);
    }

    console.log('\n✅ FIELD POPULATION ANALYSIS:');
    console.log('=============================');

    const fieldAnalysis = [
      { name: 'key', value: data.key, expected: 'string', status: data.key ? '✅' : '❌' },
      { name: 'version', value: data.version, expected: 'string', status: data.version ? '✅' : '❌' },
      { name: 'checksum', value: data.checksum, expected: 'sha256:string', status: data.checksum?.startsWith('sha256:') ? '✅' : '❌' },
      { name: 'index_type', value: data.index_type, expected: 'bm25_file', status: data.index_type === 'bm25_file' ? '✅' : '❌' },
      { name: 'created_at', value: data.created_at, expected: 'timestamp', status: data.created_at ? '✅' : '❌' },
      { name: 'document_sources', value: data.document_sources, expected: 'array', status: Array.isArray(data.document_sources) && data.document_sources.length > 0 ? '✅' : '❌' },
      { name: 'field_weights', value: data.field_weights, expected: 'object', status: typeof data.field_weights === 'object' ? '✅' : '❌' },
      { name: 'build_metadata', value: data.build_metadata, expected: 'object', status: typeof data.build_metadata === 'object' ? '✅' : '❌' },
      { name: 'index_size_bytes', value: data.index_size_bytes, expected: 'number>0', status: data.index_size_bytes > 0 ? '✅' : '❌' },
      { name: 'document_count', value: data.document_count, expected: 'number>0', status: data.document_count > 0 ? '✅' : '❌' },
      { name: 'build_duration_ms', value: data.build_duration_ms, expected: 'number>0', status: data.build_duration_ms > 0 ? '✅' : '❌' },
      { name: 'is_active', value: data.is_active, expected: 'boolean', status: typeof data.is_active === 'boolean' ? '✅' : '❌' },
      { name: 'parent_version', value: data.parent_version, expected: 'string|null', status: data.parent_version === null || typeof data.parent_version === 'string' ? '✅' : '❌' }
    ];

    fieldAnalysis.forEach(field => {
      console.log(`${field.status} ${field.name}: ${field.expected} | actual: ${field.value ? 'populated' : 'empty'}`);
    });

    const successCount = fieldAnalysis.filter(f => f.status === '✅').length;
    console.log(`\n🎯 OVERALL SUCCESS: ${successCount}/13 fields properly populated`);

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkV14Fields();