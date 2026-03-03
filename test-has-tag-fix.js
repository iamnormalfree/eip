// ABOUTME: Fixed version of HAS_TAG edge test with proper mock setup
// ABOUTME: This addresses the call order issue revealed by TDD tests

// The issue is that the test expects calls in a specific order, but the implementation
// processes all nodes first, then edges. The mock needs to be intelligent about which
// query it's responding to, not rely on call order.

// Key insight: The test should use a function-based mock that checks the query pattern
// rather than expecting calls in specific positions.

const fixTest = () => {
  // The mockRun function should check the query pattern:
  const mockRun = jest.fn((query: string, params: any) => {
    if (query.includes('MATCH (t:Tag) WHERE t.id = $tagId OR t.name = $tagName RETURN')) {
      // This is the tag existence check - return mock record
      return Promise.resolve({ records: [mockTagRecord] });
    }
    // All other queries get empty records
    return Promise.resolve({ records: [] });
  });
  
  // Then in the test, verify calls were made regardless of order:
  const tagExistenceCall = mockRun.mock.calls.find(call => 
    call[0].includes('MATCH (t:Tag) WHERE t.id = $tagId OR t.name = $tagName RETURN')
  );
  
  const hasTagEdgeCall = mockRun.mock.calls.find(call => 
    call[0].includes('MATCH (a:Artifact {id: $artifactId}) MATCH (t:Tag) WHERE t.id = $tagId OR t.name = $tagName MERGE (a)-[:HAS_TAG]->(t)')
  );
};

console.log('Test fix analysis complete');
