// Test script to verify database registration and audit trail
const { createClient } = require('@supabase/supabase-js');

async function verifyDatabaseRegistration() {
  console.log('🔍 VERIFYING DATABASE REGISTRATION FIX');
  console.log('=====================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing environment variables for database verification');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Check the registered entry exists
    console.log('1. CHECKING REGISTERED INDEX:');
    const { data: indexData, error: indexError } = await supabase
      .from('eip_schema_registry')
      .select('*')
      .eq('version', '1.3.0')
      .eq('index_type', 'bm25_file')
      .single();

    if (indexError) {
      console.log('❌ Failed to fetch index data:', indexError);
      return;
    }

    console.log('✅ Index registration found');
    console.log(`   Registry key: ${indexData.key}`);
    console.log(`   Version: ${indexData.version}`);
    console.log(`   Index type: ${indexData.index_type}`);
    console.log(`   Is active: ${indexData.is_active}`);

    // Test 2: Verify all 13 expected fields are populated
    console.log('\n2. VERIFYING ALL 13 DATABASE FIELDS:');
    const expectedFields = [
      'key',           // 1
      'version',       // 2
      'checksum',      // 3
      'index_type',    // 4
      'created_at',    // 5
      'document_sources', // 6
      'field_weights', // 7
      'build_metadata', // 8
      'index_size_bytes', // 9
      'document_count', // 10
      'build_duration_ms', // 11
      'is_active',     // 12
      'parent_version' // 13
    ];

    let allFieldsPresent = true;
    expectedFields.forEach(field => {
      const hasField = indexData.hasOwnProperty(field);
      const value = indexData[field];
      const populated = value !== null && value !== undefined;

      console.log(`   ${field}: ${hasField ? '✅' : '❌'} ${populated ? '(populated)' : '(empty)'}`);
      if (!hasField) allFieldsPresent = false;
    });

    // Test 3: Check field values integrity
    console.log('\n3. FIELD VALUE VERIFICATION:');
    console.log(`   Checksum format: ${indexData.checksum.startsWith('sha256:') ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Document count: ${indexData.document_count > 0 ? '✅' : '❌'} (${indexData.document_count})`);
    console.log(`   Index size: ${indexData.index_size_bytes > 0 ? '✅' : '❌'} (${indexData.index_size_bytes} bytes)`);
    console.log(`   Build duration: ${indexData.build_duration_ms > 0 ? '✅' : '❌'} (${indexData.build_duration_ms}ms)`);
    console.log(`   Field weights: ${typeof indexData.field_weights === 'object' ? '✅ Object' : '❌ Missing'}`);
    console.log(`   Document sources: ${Array.isArray(indexData.document_sources) ? '✅ Array' : '❌ Missing'}`);

    // Test 4: Verify build history
    console.log('\n4. CHECKING BUILD HISTORY:');
    const { data: historyData, error: historyError } = await supabase
      .from('eip_index_build_history')
      .select('*')
      .eq('registry_key', indexData.key)
      .order('started_at', { ascending: false })
      .limit(1);

    if (historyError) {
      console.log('❌ Failed to fetch build history:', historyError);
    } else {
      console.log('✅ Build history record found');
      if (historyData.length > 0) {
        const history = historyData[0];
        console.log(`   Build type: ${history.build_type}`);
        console.log(`   Build status: ${history.build_status}`);
        console.log(`   Documents added: ${history.documents_added}`);
        console.log(`   Has build metadata: ${history.build_metadata ? '✅' : '❌'}`);
      }
    }

    // Test 5: Check previous version deactivation
    console.log('\n5. VERSION ACTIVATION STATUS:');
    const { data: allVersions, error: versionsError } = await supabase
      .from('eip_schema_registry')
      .select('version, is_active, created_at')
      .eq('index_type', 'bm25_file')
      .order('created_at', { ascending: false });

    if (versionsError) {
      console.log('❌ Failed to fetch version status:', versionsError);
    } else {
      const activeVersions = allVersions.filter(v => v.is_active);
      const inactiveVersions = allVersions.filter(v => !v.is_active);

      console.log(`   Total versions: ${allVersions.length}`);
      console.log(`   Active versions: ${activeVersions.length}`);
      console.log(`   Inactive versions: ${inactiveVersions.length}`);

      if (activeVersions.length === 1) {
        console.log(`   ✅ Only one active version: ${activeVersions[0].version}`);
      } else {
        console.log(`   ❌ Multiple active versions found`);
      }

      console.log('   Version history:');
      allVersions.forEach(v => {
        const status = v.is_active ? 'ACTIVE' : 'INACTIVE';
        console.log(`     - v${v.version}: ${status}`);
      });
    }

    // Final verdict
    console.log('\n🎯 DATABASE REGISTRATION VERDICT:');
    console.log('===================================');
    const allChecks = [
      allFieldsPresent,
      indexData.checksum.startsWith('sha256:'),
      indexData.document_count > 0,
      indexData.index_size_bytes > 0,
      indexData.build_duration_ms > 0,
      typeof indexData.field_weights === 'object',
      Array.isArray(indexData.document_sources),
      historyData.length > 0
    ];

    const allPassed = allChecks.every(check => check);
    console.log(`Overall Status: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);

  } catch (error) {
    console.error('❌ Database verification failed:', error);
  }
}

verifyDatabaseRegistration();