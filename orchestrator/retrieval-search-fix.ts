  search(query: string, limit: number = 5): Array<{ id: string; score: number }> {
    const queryTerms = this.tokenize(query.toLowerCase());
    const scores: { [docId: string]: number } = {};

    if (this.loadedDocuments) {
      // Use field-weighted scoring for loaded documents
      const fieldWeights = this.loadedDocuments.field_weights || {
        concept_abstract: 2.0,
        artifact_summary: 1.0,
        entity_name: 1.5,
        content: 1.0
      };

      for (const doc of this.loadedDocuments.documents) {
        let score = 0;
        const allTerms = [
          ...(doc.field_terms?.concept_abstract || []),
          ...(doc.field_terms?.artifact_summary || []),
          ...(doc.field_terms?.entity_name || []),
          ...(doc.field_terms?.content || [])
        ];
        const docLength = allTerms.length;

        for (const term of queryTerms) {
          let termScore = 0;

          // Check each field for the term and apply field weight
          if (doc.field_terms?.concept_abstract?.includes(term)) {
            const tf = doc.field_terms.concept_abstract.filter(t => t === term).length;
            const idf = this.idf(term);
            const fieldWeight = fieldWeights.concept_abstract || 2.0;
            termScore += this.calculateBM25Score(tf, idf, docLength, fieldWeight);
          }

          if (doc.field_terms?.artifact_summary?.includes(term)) {
            const tf = doc.field_terms.artifact_summary.filter(t => t === term).length;
            const idf = this.idf(term);
            const fieldWeight = fieldWeights.artifact_summary || 1.0;
            termScore += this.calculateBM25Score(tf, idf, docLength, fieldWeight);
          }

          if (doc.field_terms?.entity_name?.includes(term)) {
            const tf = doc.field_terms.entity_name.filter(t => t === term).length;
            const idf = this.idf(term);
            const fieldWeight = fieldWeights.entity_name || 1.5;
            termScore += this.calculateBM25Score(tf, idf, docLength, fieldWeight);
          }

          if (doc.field_terms?.content?.includes(term)) {
            const tf = doc.field_terms.content.filter(t => t === term).length;
            const idf = this.idf(term);
            const fieldWeight = fieldWeights.content || 1.0;
            termScore += this.calculateBM25Score(tf, idf, docLength, fieldWeight);
          }

          score += termScore;
        }

        if (score > 0) {
          scores[doc.id] = score;
        }
      }
    } else {
      // Use standard BM25 scoring for in-memory documents
      for (const doc of this.docs) {
        const docLength = doc.terms.length;
        let score = 0;

        for (const term of queryTerms) {
          if (!doc.terms.includes(term)) continue;

          const tf = doc.terms.filter(t => t === term).length;
          const idf = this.idf(term);
          const fieldWeight = 1.0; // Default weight for old format
          score += this.calculateBM25Score(tf, idf, docLength, fieldWeight);
        }

        if (score > 0) {
          scores[doc.id] = score;
        }
      }
    }

    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id, score]) => ({ id, score }));
  }
