#!/usr/bin/env node

import { parallelRetrieve } from './orchestrator/retrieval';

console.log('🔍 TESTING CLAIM: Graph edges fix behavior');
console.log('==========================================\n');

async function testClaim() {
  try {
    // Test 1: Query with candidates
    console.log('Test 1: Query that should return candidates');
    console.log('Query: "financial planning"');

    const result1 = await parallelRetrieve({
      query: 'financial planning',
      max_results: 5
    });

    console.log('Results:');
    console.log(`  - candidates: ${result1.candidates.length}`);
    console.log(`  - graph_edges: ${result1.graph_edges?.length || 0}`);
    console.log(`  - graph_sparse: ${result1.flags.graph_sparse}`);
    console.log(`  - calculation: ${result1.graph_edges?.length || 0} < ${result1.candidates.length} = ${result1.flags.graph_sparse}`);

    // Test 2: Query with no candidates
    console.log('\nTest 2: Query that should return no candidates');
    console.log('Query: "xyz123nonexistent"');

    const result2 = await parallelRetrieve({
      query: 'xyz123nonexistent',
      max_results: 5
    });

    console.log('Results:');
    console.log(`  - candidates: ${result2.candidates.length}`);
    console.log(`  - graph_edges: ${result2.graph_edges?.length || 0}`);
    console.log(`  - graph_sparse: ${result2.flags.graph_sparse}`);
    console.log(`  - calculation: ${result2.graph_edges?.length || 0} < ${result2.candidates.length} = ${result2.flags.graph_sparse}`);

    // Verify claim
    console.log('\nCLAIM VERIFICATION:');
    console.log('==================');

    const hasGraphEdgesEmpty1 = result1.graph_edges?.length === 0;
    const hasGraphSparseTrue1 = result1.flags.graph_sparse === true;
    const hasGraphEdgesEmpty2 = result2.graph_edges?.length === 0;
    const hasGraphSparseFalse2 = result2.flags.graph_sparse === false;

    console.log(`✅ Test 1 - graph_edges empty: ${hasGraphEdgesEmpty1}`);
    console.log(`✅ Test 1 - graph_sparse true: ${hasGraphSparseTrue1}`);
    console.log(`✅ Test 2 - graph_edges empty: ${hasGraphEdgesEmpty2}`);
    console.log(`✅ Test 2 - graph_sparse false: ${hasGraphSparseFalse2}`);

    const allValid = hasGraphEdgesEmpty1 && hasGraphSparseTrue1 && hasGraphEdgesEmpty2 && hasGraphSparseFalse2;
    console.log(`\n🎯 FINAL CLAIM STATUS: ${allValid ? 'VALIDATED ✅' : 'REJECTED ❌'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testClaim();