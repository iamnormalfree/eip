// Test behavior BEFORE the fix
const fs = require('fs');
const path = require('path');

// We'll compile the TypeScript and test it
const { execSync } = require('child_process');

console.log('🔍 TESTING BEFORE (with static mockGraphEdges)');
console.log('==============================================\n');

// Build and test the backup version
try {
  // Compile TypeScript first
  execSync('npx tsc orchestrator/retrieval.ts --outDir ./dist --target es2020 --module commonjs --esModuleInterop', { stdio: 'inherit' });

  // Now test the compiled version
  const testCode = `
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
`;

  fs.writeFileSync('./dist/test-before.js', testCode);
  const output = execSync('node ./dist/test-before.js', { encoding: 'utf8' });
  console.log(output);

} catch (error) {
  console.error('Test failed:', error.message);
}