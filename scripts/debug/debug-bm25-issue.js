// ABOUTME: Debug script to test SimpleBM25 field-weighted search
// ABOUTME: Isolate the issue with field-weighted BM25 implementation

const { SimpleBM25 } = require('./dist/retrieval.js');

console.log('=== SimpleBM25 Field-Weighted Search Debug ===\n');

// Create test data matching the failing test
const mockLoadedIndex = {
  version: '1.0.0',
  field_weights: {
    concept_abstract: 2.0,
    artifact_summary: 1.0,
    entity_name: 1.5,
    content: 1.0
  },
  documents: [
    {
      id: 'concept-doc',
      fields: {
        concept_abstract: 'Financial planning requires careful consideration',
        content: 'Some other content'
      },
      field_terms: {
        concept_abstract: ['financial', 'planning', 'requires', 'careful', 'consideration'],
        content: ['some', 'other', 'content']
      }
    },
    {
      id: 'artifact-doc',
      fields: {
        artifact_summary: 'Financial strategies require detailed analysis',
        content: 'Different content here'
      },
      field_terms: {
        artifact_summary: ['financial', 'strategies', 'require', 'detailed', 'analysis'],
        content: ['different', 'content', 'here']
      }
    }
  ]
};

console.log('1. Creating SimpleBM25 instance...');
const fieldBm25 = new SimpleBM25([]);
fieldBm25.loadedDocuments = mockLoadedIndex;
fieldBm25.docCount = mockLoadedIndex.documents.length;

// Set avgDocLength
const totalTerms = mockLoadedIndex.documents.reduce((sum, doc) => {
  const docTerms = [
    ...(doc.field_terms?.concept_abstract || []),
    ...(doc.field_terms?.artifact_summary || []),
    ...(doc.field_terms?.entity_name || []),
    ...(doc.field_terms?.content || [])
  ];
  return sum + docTerms.length;
}, 0);
fieldBm25.avgDocLength = totalTerms / mockLoadedIndex.documents.length;

console.log('Document count:', fieldBm25.docCount);
console.log('Average doc length:', fieldBm25.avgDocLength);
console.log('Has loadedDocuments:', !!fieldBm25.loadedDocuments);

console.log('\n2. Testing tokenization...');
const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2);
};

const queryTerms = tokenize('financial planning');
console.log('Query:', 'financial planning');
console.log('Query terms:', queryTerms);

console.log('\n3. Testing IDF calculation...');
for (const term of queryTerms) {
  console.log(`\nCalculating IDF for term: "${term}"`);
  
  // Manually calculate document frequency
  let df = 0;
  for (const doc of mockLoadedIndex.documents) {
    const allTerms = [
      ...(doc.field_terms?.concept_abstract || []),
      ...(doc.field_terms?.artifact_summary || []),
      ...(doc.field_terms?.entity_name || []),
      ...(doc.field_terms?.content || [])
    ];
    const hasTerm = allTerms.includes(term);
    console.log(`  Document ${doc.id}: has "${term}" = ${hasTerm}`);
    if (hasTerm) df++;
  }
  
  console.log(`  Document frequency (df): ${df}`);
  const idf = df === 0 ? 0 : Math.log((fieldBm25.docCount - df + 0.5) / (df + 0.5));
  console.log(`  IDF: ${idf}`);
}

console.log('\n4. Testing search method...');
const results = fieldBm25.search('financial planning', 5);
console.log('Search results:', results);
