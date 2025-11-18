// Test to prove the field weighting claims are wrong
const { parallelRetrieve } = require('./dist/retrieval');

async function testRealBM25FieldWeighting() {
  console.log('🔍 TESTING REAL BM25 FIELD WEIGHTING');
  console.log('=====================================\n');

  // Test with a query that should match "Fixed Rate Mortgage"
  const result = await parallelRetrieve({
    query: 'mortgage loan fixed rate',
    max_results: 5
  });

  console.log('Query: "mortgage loan fixed rate"');
  console.log('Results:');

  result.candidates.forEach((candidate, i) => {
    console.log(`${i+1}. ID: ${candidate.id}`);
    console.log(`   Content: "${candidate.content.substring(0, 100)}..."`);
    console.log(`   Score: ${candidate.score}`);
    console.log(`   Method: ${candidate.metadata?.retrieval_method || 'unknown'}`);
    console.log(`   Has index version: ${!!candidate.metadata?.index_version}`);
    console.log('');
  });

  console.log('🎯 FIELD WEIGHTING ANALYSIS:');
  console.log('============================');

  // Check if we're actually using the loaded index
  const usingLoadedIndex = result.candidates.some(c =>
    c.metadata?.retrieval_method === 'bm25_file_index'
  );

  const usingMockFallback = result.candidates.some(c =>
    c.metadata?.retrieval_method === 'bm25_mock_fallback'
  );

  console.log(`Using loaded Supabase index: ${usingLoadedIndex}`);
  console.log(`Using mock fallback: ${usingMockFallback}`);

  if (usingMockFallback) {
    console.log('❌ CLAIM VERIFIED: System falls back to mock documents');
    console.log('❌ This means field weighting from builder is ignored');
    console.log('❌ "Single source of truth" claim is FALSE');
  } else if (usingLoadedIndex) {
    console.log('✅ Actually using loaded index - field weighting should work');
  } else {
    console.log('⚠️  Unclear which method was used');
  }

  // Check if any of the returned documents are from the loaded index UUIDs
  const hasRealIndexIds = result.candidates.some(c =>
    c.id.startsWith('entity_') && c.id.length > 20
  );

  console.log(`Contains real Supabase IDs: ${hasRealIndexIds}`);

  if (!hasRealIndexIds) {
    console.log('❌ All returned documents have mock IDs (test-doc-X)');
    console.log('❌ This proves the loaded index results are being discarded');
  }

  return {
    usingLoadedIndex,
    usingMockFallback,
    hasRealIndexIds,
    candidates: result.candidates.length
  };
}

testRealBM25FieldWeighting().catch(console.error);