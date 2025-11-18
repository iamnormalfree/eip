const { SimpleBM25 } = require('./dist/retrieval.js');

// Create test data with complete structure
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
    }
  ],
  doc_stats: {
    avg_doc_length: 8.0,
    total_docs: 1,
    k1: 1.2,
    b: 0.75
  }
};

const fieldBm25 = new SimpleBM25([]);
fieldBm25.loadedDocuments = mockLoadedIndex;
fieldBm25.docCount = mockLoadedIndex.documents.length;
fieldBm25.avgDocLength = mockLoadedIndex.doc_stats.avg_doc_length; // CRITICAL FIX

console.log('Avg doc length:', fieldBm25.avgDocLength);
console.log('Doc count:', fieldBm25.docCount);

console.log('\\nTesting BM25 score calculation...');
const term = 'planning';
const tf = 1;
const idf = fieldBm25.idf(term);
const docLength = 5; // concept_abstract has 5 terms
const fieldWeight = 2.0;

const score = fieldBm25.calculateBM25Score(tf, idf, docLength, fieldWeight);
console.log('Final calculated score:', score);

console.log('\\nTesting search...');
const results = fieldBm25.search('planning', 5);
console.log('Search results:', results);

console.log('\\nTesting search for "financial"...');
const financialResults = fieldBm25.search('financial', 5);
console.log('Financial search results:', financialResults);
