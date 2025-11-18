#!/usr/bin/env node

console.log('🔍 TESTING CLAIM: Graph edges fix behavior');
console.log('==========================================\n');

const { execSync } = require('child_process');

function runTest(query, description) {
  console.log(`${description}:`);
  console.log(`Query: "${query}"`);

  try {
    const result = execSync(`npx ts-node -e "
import { parallelRetrieve } from './orchestrator/retrieval';
parallelRetrieve({
  query: '${query}',
  max_results: 5
}).then(result => {
  console.log('RESULT:', JSON.stringify({
    candidates: result.candidates.length,
    graph_edges: result.graph_edges?.length || 0,
    graph_sparse: result.flags.graph_sparse,
    calculation: \`\${result.graph_edges?.length || 0} < \${result.candidates.length} = \${result.flags.graph_sparse}\`
  }));
}).catch(err => {
  console.error('ERROR:', err.message);
});
"`, { encoding: 'utf8', cwd: process.cwd() });

    return result.trim();
  } catch (error) {
    return error.message;
  }
}

console.log('Test 1: Query that should return candidates');
const result1 = runTest('financial planning', 'Test 1');
console.log(result1);

console.log('\nTest 2: Query that should return no candidates');
const result2 = runTest('xyz123nonexistent', 'Test 2');
console.log(result2);

console.log('\nCLAIM ANALYSIS:');
console.log('===============');
console.log('If the claim is correct, both tests should show:');
console.log('- graph_edges: 0 (empty)');
console.log('- graph_sparse: true when candidates > 0, false when candidates = 0');