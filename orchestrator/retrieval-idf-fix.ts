  private idf(term: string): number {
    // Use this.docs for IDF calculation (contains processed terms from both sources)
    let df = 0;
    for (const doc of this.docs) {
      if (doc.terms.includes(term)) {
        df++;
      }
    }

    if (df === 0) return 0;
    
    // Use a more stable IDF formula that handles small collections better
    // Standard BM25: log((N - df + 0.5) / (df + 0.5))
    // For small collections, this can produce negative values, so we use:
    // log(1 + (N - df) / df) which is always positive
    return Math.log(1 + (this.docCount - df) / df);
  }
