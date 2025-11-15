
const { parallelRetrieve } = require('./dist/orchestrator/retrieval');

async function test() {
  console.log('Testing BEFORE fix (static edges)...');

  const result = await parallelRetrieve({
    query: 'financial planning',
    max_results: 3
  });

  console.log('BEFORE Results:');
  console.log('- candidates:', result.candidates.length);
  console.log('- graph_edges:', result.graph_edges?.length || 0);
  console.log('- graph_sparse:', result.flags.graph_sparse);
  console.log('- calculation: (graph_edges.length) < (candidates.length) =', (result.graph_edges?.length || 0), '<', result.candidates.length, '=', result.flags.graph_sparse);
}

test().catch(console.error);
