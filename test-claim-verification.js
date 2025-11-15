#!/usr/bin/env node

// Test script to verify the graph_edges claim actually works
// We need to require the TypeScript file directly
const fs = require('fs');
const path = require('path');

// Read and eval the TypeScript file (quick hack for testing)
const retrievalCode = fs.readFileSync('./orchestrator/retrieval.ts', 'utf8');

// Extract the parallelRetrieve function by transpiling on the fly
const { execSync } = require('child_process');

function testRetrieval() {
  return new Promise((resolve, reject) => {
    execSync(`npx ts-node -e "
import { parallelRetrieve } from './orchestrator/retrieval';
parallelRetrieve({
  query: 'financial planning investment',
  max_results: 3
}).then(result => {
  console.log(JSON.stringify({
    candidates: result.candidates.length,
    graph_edges: result.graph_edges?.length || 0,
    graph_sparse: result.flags.graph_sparse
  }));
}).catch(err => {
  console.error('Error:', err.message);
});
"`, { encoding: 'utf8', cwd: process.cwd() });
  });
}

console.log('🔍 TESTING CLAIM: Graph edges fix behavior');
console.log('==========================================\n');

async function testClaim() {
  try {
    // Test 1: Query with candidates (should show graph_sparse: true)
    console.log('Test 1: Query that returns candidates');
    console.log('Expected: graph_edges: 0, graph_sparse: true');
    const result1 = await parallelRetrieve({
      query: 'financial planning investment',
      max_results: 3
    });

    console.log('Actual result:');
    console.log(`  - candidates: ${result1.candidates.length}`);
    console.log(`  - graph_edges: ${result1.graph_edges?.length || 0}`);
    console.log(`  - graph_sparse: ${result1.flags.graph_sparse}`);
    console.log(`  - graph_sparse calculation: ${result1.graph_edges?.length || 0} < ${result1.candidates.length} = ${result1.flags.graph_sparse}\n`);

    // Test 2: Query with no candidates (should show graph_sparse: false)
    console.log('Test 2: Query that returns no candidates');
    console.log('Expected: graph_edges: 0, graph_sparse: false');
    const result2 = await parallelRetrieve({
      query: 'xyz123nonexistentquery',
      max_results: 5
    });

    console.log('Actual result:');
    console.log(`  - candidates: ${result2.candidates.length}`);
    console.log(`  - graph_edges: ${result2.graph_edges?.length || 0}`);
    console.log(`  - graph_sparse: ${result2.flags.graph_sparse}`);
    console.log(`  - graph_sparse calculation: ${result2.graph_edges?.length || 0} < ${result2.candidates.length} = ${result2.flags.graph_sparse}\n`);

    // Verify the claim
    console.log('CLAIM VERIFICATION:');
    console.log('==================');

    const claim1 = result1.graph_edges?.length === 0;
    const claim2 = result1.flags.graph_sparse === true;
    const claim3 = result2.graph_edges?.length === 0;
    const claim4 = result2.flags.graph_sparse === false;

    console.log(`✅ graph_edges is empty when candidates exist: ${claim1}`);
    console.log(`✅ graph_sparse is true when candidates exist: ${claim2}`);
    console.log(`✅ graph_edges is empty when no candidates: ${claim3}`);
    console.log(`✅ graph_sparse is false when no candidates: ${claim4}`);

    const allClaimsValid = claim1 && claim2 && claim3 && claim4;
    console.log(`\n🎯 OVERALL CLAIM STATUS: ${allClaimsValid ? 'VALIDATED' : 'REJECTED'}`);

    if (allClaimsValid) {
      console.log('✅ The claim is CORRECT - graph_edges is empty and sparse detection works meaningfully');
    } else {
      console.log('❌ The claim is INCORRECT - behavior does not match description');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testClaim();