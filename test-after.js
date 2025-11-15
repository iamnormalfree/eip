const { parallelRetrieve } = require('./dist/retrieval');

async function test() {
  console.log('Testing AFTER fix (empty edges)...');

  console.log('\nTest 1: Query that returns candidates');
  const result1 = await parallelRetrieve({
    query: 'financial planning',
    max_results: 3
  });

  console.log('AFTER Results:');
  console.log('- candidates:', result1.candidates.length);
  console.log('- graph_edges:', result1.graph_edges?.length || 0);
  console.log('- graph_sparse:', result1.flags.graph_sparse);
  console.log('- calculation:', (result1.graph_edges?.length || 0), '<', result1.candidates.length, '=', result1.flags.graph_sparse);

  console.log('\nTest 2: Query that returns no candidates');
  const result2 = await parallelRetrieve({
    query: 'xyz123nonexistent',
    max_results: 5
  });

  console.log('AFTER Results:');
  console.log('- candidates:', result2.candidates.length);
  console.log('- graph_edges:', result2.graph_edges?.length || 0);
  console.log('- graph_sparse:', result2.flags.graph_sparse);
  console.log('- calculation:', (result2.graph_edges?.length || 0), '<', result2.candidates.length, '=', result2.flags.graph_sparse);

  console.log('\n🎯 CLAIM VERIFICATION:');
  console.log('===================');

  const claim1 = result1.graph_edges?.length === 0;
  const claim2 = result1.flags.graph_sparse === true;
  const claim3 = result2.graph_edges?.length === 0;
  const claim4 = result2.flags.graph_sparse === false;

  console.log(`✅ graph_edges empty with candidates: ${claim1}`);
  console.log(`✅ graph_sparse true with candidates: ${claim2}`);
  console.log(`✅ graph_edges empty without candidates: ${claim3}`);
  console.log(`✅ graph_sparse false without candidates: ${claim4}`);

  const allValid = claim1 && claim2 && claim3 && claim4;
  console.log(`\n🎯 FINAL CLAIM STATUS: ${allValid ? 'VALIDATED ✅' : 'REJECTED ❌'}`);
}

test().catch(console.error);