const { SimpleBM25 } = require('./dist/retrieval.js');

// Create test data
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
  ]
};

const fieldBm25 = new SimpleBM25([]);
fieldBm25.loadedDocuments = mockLoadedIndex;
fieldBm25.docCount = mockLoadedIndex.documents.length;

// Monkey patch calculateBM25Score to add debug
const originalCalc = fieldBm25.calculateBM25Score.bind(fieldBm25);
fieldBm25.calculateBM25Score = function(tf, idf, docLength, fieldWeight) {
  console.log(`\\n=== BM25 SCORE DEBUG ===`);
  console.log(`TF: ${tf}`);
  console.log(`IDF: ${idf}`);
  console.log(`Doc Length: ${docLength}`);
  console.log(`Field Weight: ${fieldWeight}`);
  console.log(`k1: ${this.k1}`);
  console.log(`b: ${this.b}`);
  console.log(`Avg Doc Length: ${this.avgDocLength}`);
  
  const numerator = tf * (this.k1 + 1) * fieldWeight;
  const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
  const score = idf * (numerator / denominator);
  
  console.log(`Numerator: ${numerator}`);
  console.log(`Denominator: ${denominator}`);
  console.log(`Final Score: ${score}`);
  console.log(`=== END BM25 SCORE DEBUG ===\\n`);
  
  return score;
};

console.log('Testing BM25 score calculation...');
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
