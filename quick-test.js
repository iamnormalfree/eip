const { SimpleBM25 } = require('./dist/retrieval.js');

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

const fieldBm25 = new SimpleBM25([]);
fieldBm25.loadedDocuments = mockLoadedIndex;
fieldBm25.docCount = mockLoadedIndex.documents.length;

console.log('Testing search for "planning":');
const planningResults = fieldBm25.search('planning', 5);
console.log('Results:', planningResults);

console.log('\nTesting search for "financial":');
const financialResults = fieldBm25.search('financial', 5);
console.log('Results:', financialResults);

console.log('\nTesting search for "financial planning":');
const bothResults = fieldBm25.search('financial planning', 5);
console.log('Results:', bothResults);
