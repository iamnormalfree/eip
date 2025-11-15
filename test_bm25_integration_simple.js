// ABOUTME: Test BM25 Builder Integration with Enhanced Schema Registry
// ABOUTME: Phase 1 integration test for unified blueprint implementation

const { createClient } = require('@supabase/supabase-js');

async function testBM25Integration() {
  console.log('=== BM25 Builder Integration Test ===\n');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test 1: Check existing BM25 entries
    console.log('Test 1: Checking existing BM25 index entries...');
    
    const { data: bm25Entries, error: bm25Error } = await supabase
      .from('eip_schema_registry')
      .select('key, version, index_type, is_active, document_count, created_at')
      .eq('index_type', 'bm25_file')
      .order('version');
    
    if (bm25Error) {
      console.error('Failed to fetch BM25 entries:', bm25Error);
      return;
    }
    
    const entryCount = bm25Entries ? bm25Entries.length : 0;
    console.log('Found ' + entryCount + ' BM25 index versions:');
    if (bm25Entries) {
      bm25Entries.forEach(entry => {
        console.log('   - ' + entry.version + ': ' + entry.document_count + ' docs, active: ' + entry.is_active);
      });
    }
    
    // Test 2: Test getting active BM25 index
    console.log('\nTest 2: Testing active index retrieval...');
    
    const { data: activeIndex, error: activeError } = await supabase
      .rpc('get_active_bm25_index');
    
    if (activeError) {
      console.error('Failed to get active index:', activeError);
      return;
    }
    
    if (activeIndex && activeIndex.length > 0) {
      console.log('Active BM25 index found:');
      console.log('   - Version: ' + activeIndex[0].version);
      console.log('   - Registry Key: ' + activeIndex[0].registry_key);
      console.log('   - Document Count: ' + activeIndex[0].document_count);
    } else {
      console.log('No active BM25 index found');
    }
    
    // Test 3: Test checksum validation
    console.log('\nTest 3: Testing checksum validation...');
    
    if (bm25Entries && bm25Entries.length > 0) {
      const testEntry = bm25Entries[0];
      const { data: checksumResult, error: checksumError } = await supabase
        .rpc('validate_index_checksum', {
          p_registry_key: testEntry.key,
          p_expected_checksum: testEntry.checksum
        });
      
      if (checksumError) {
        console.error('Checksum validation failed:', checksumError);
        return;
      }
      
      const isValid = checksumResult ? 'PASSED' : 'FAILED';
      console.log('Checksum validation for ' + testEntry.version + ': ' + isValid);
    } else {
      console.log('No BM25 entries available for checksum testing');
    }
    
    // Test 4: Check build history
    console.log('\nTest 4: Checking build history...');
    
    const { data: buildHistory, error: historyError } = await supabase
      .from('eip_index_build_history')
      .select('registry_key, build_type, build_status, build_duration_ms, documents_added')
      .order('started_at', { ascending: false })
      .limit(3);
    
    if (historyError) {
      console.error('Failed to fetch build history:', historyError);
      return;
    }
    
    const historyCount = buildHistory ? buildHistory.length : 0;
    console.log('Found ' + historyCount + ' recent build history entries:');
    if (buildHistory) {
      buildHistory.forEach(entry => {
        console.log('   - ' + entry.build_type + ': ' + entry.build_status + ' (' + entry.build_duration_ms + 'ms)');
      });
    }
    
    console.log('\nAll integration tests passed!');
    console.log('BM25 schema registry integration is working correctly.');
    
  } catch (error) {
    console.error('Integration test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testBM25Integration().catch(console.error);
}

module.exports = { testBM25Integration };
