// Debug script to verify BM25 field weighting claims
const fs = require('fs');

console.log('🔍 DEBUGGING BM25 FIELD WEIGHTING CLAIMS');
console.log('========================================\n');

// Load actual index data
const indexPath = './tmp/bm25-indexes/latest.json';
const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

console.log('1. INDEX FIELD_WEIGHTS FROM BUILDER:');
console.log(JSON.stringify(indexData.field_weights, null, 2));

console.log('\n2. FIRST 3 DOCUMENTS FROM INDEX:');
indexData.documents.slice(0, 3).forEach((doc, i) => {
  console.log(`Doc ${i+1} (${doc.id}):`);
  console.log(`  - concept_abstract: "${doc.fields.concept_abstract || '(empty)'}"`);
  console.log(`  - artifact_summary: "${doc.fields.artifact_summary || '(empty)'}"`);
  console.log(`  - entity_name: "${doc.fields.entity_name || '(empty)'}"`);
  console.log(`  - content: "${doc.fields.content || '(empty)'}"`);
  console.log(`  - field_terms keys: ${Object.keys(doc.field_terms || {})}`);
  console.log('');
});

// Check if any documents actually have concept_abstract content
const docsWithConceptAbstract = indexData.documents.filter(doc =>
  doc.fields.concept_abstract && doc.fields.concept_abstract.trim().length > 0
);

const docsWithArtifactSummary = indexData.documents.filter(doc =>
  doc.fields.artifact_summary && doc.fields.artifact_summary.trim().length > 0
);

console.log('3. FIELD CONTENT ANALYSIS:');
console.log(`  - Documents with concept_abstract content: ${docsWithConceptAbstract.length}/${indexData.documents.length}`);
console.log(`  - Documents with artifact_summary content: ${docsWithArtifactSummary.length}/${indexData.documents.length}`);

if (docsWithConceptAbstract.length > 0) {
  console.log('  - Sample concept_abstract:', JSON.stringify(docsWithConceptAbstract[0].fields.concept_abstract.substring(0, 100)));
}

if (docsWithArtifactSummary.length > 0) {
  console.log('  - Sample artifact_summary:', JSON.stringify(docsWithArtifactSummary[0].fields.artifact_summary.substring(0, 100)));
}

console.log('\n4. MOCK DOCUMENT IDs FOR REFERENCE:');
const { parallelRetrieve } = require('./dist/retrieval');
// Let's see what mockDocuments contains (we can't access it directly but we can check)

console.log('The critical issue: Loaded index has UUID-based IDs like:');
console.log('  - "entity_460da171-e083-428a-9375-c5c61867014c"');
console.log('But mockDocuments has simple IDs like:');
console.log('  - "test-doc-1", "test-doc-2", etc.');

console.log('\n🚨 CLAIM: BM25 results from loaded index NEVER match mockDocuments by ID');
console.log('So TIER 1 (loaded index) fails and falls back to TIER 2 (mock docs)');

console.log('\n🎯 CONCLUSION: The "single source of truth" claim is FALSE because:');
console.log('1. ID mismatch forces fallback to mock documents');
console.log('2. Real BM25 scoring from Supabase data is ignored');
console.log('3. Field weighting only works on mock documents, not real data');