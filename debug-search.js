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
    }
  ]
};

// Create a SimpleBM25 instance and add debug to the search method
const fieldBm25 = new SimpleBM25([]);
fieldBm25.loadedDocuments = mockLoadedIndex;
fieldBm25.docCount = mockLoadedIndex.documents.length;

// Monkey patch the search method to add debug
const originalSearch = fieldBm25.search.bind(fieldBm25);
fieldBm25.search = function(query, limit = 5) {
  console.log('\n=== SEARCH DEBUG ===');
  console.log('Query:', query);
  
  const queryTerms = this.tokenize(query.toLowerCase());
  console.log('Query terms:', queryTerms);
  
  console.log('Has loadedDocuments:', !!this.loadedDocuments);
  console.log('Document count:', this.docCount);
  
  if (this.loadedDocuments) {
    console.log('Field weights:', this.loadedDocuments.field_weights);
    
    for (const doc of this.loadedDocuments.documents) {
      console.log('\nDocument:', doc.id);
      console.log('Has field_terms:', !!doc.field_terms);
      console.log('concept_abstract terms:', doc.field_terms?.concept_abstract);
      
      for (const term of queryTerms) {
        console.log(`Checking term "${term}":`);
        
        if (doc.field_terms?.concept_abstract?.includes(term)) {
          console.log(`  Found in concept_abstract!`);
          const tf = doc.field_terms.concept_abstract.filter(t => t === term).length;
          console.log(`  TF: ${tf}`);
          
          // Test IDF calculation
          let df = 0;
          for (const d of this.loadedDocuments.documents) {
            const allTerms = [
              ...(d.field_terms?.concept_abstract || []),
              ...(d.field_terms?.artifact_summary || []),
              ...(d.field_terms?.entity_name || []),
              ...(d.field_terms?.content || [])
            ];
            if (allTerms.includes(term)) df++;
          }
          console.log(`  DF: ${df}`);
          
          const idf = this.idf(term);
          console.log(`  IDF: ${idf}`);
          
          if (df > 0 && idf > 0) {
            const fieldWeight = this.loadedDocuments.field_weights.concept_abstract || 2.0;
            console.log(`  Field weight: ${fieldWeight}`);
            console.log(`  Should have score > 0`);
          } else {
            console.log(`  No score: df=${df}, idf=${idf}`);
          }
        } else {
          console.log(`  Not found in concept_abstract`);
        }
      }
    }
  }
  
  const results = originalSearch(query, limit);
  console.log('Final results:', results);
  console.log('=== END SEARCH DEBUG ===\n');
  
  return results;
};

console.log('Testing search for "planning":');
const planningResults = fieldBm25.search('planning', 5);
console.log('Results:', planningResults);

console.log('Testing search for "financial":');
const financialResults = fieldBm25.search('financial', 5);
console.log('Results:', financialResults);
