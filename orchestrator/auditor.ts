// ABOUTME: Enhanced micro-auditor with 10 critical quality tags - FIXED VERSION
// ABOUTME: Comprehensive content quality assessment with pattern detection

type AuditInput = { 
  draft: string; 
  ip: string;
  context?: any; // Optional context from retrieval or generation
};

interface QualityTag {
  tag: string;
  severity: 'error' | 'warning' | 'info';
  section?: string;
  rationale: string;
  suggestion?: string;
  confidence: number; // 0-1 scale
  auto_fixable: boolean;
}

interface AuditOutput {
  tags: QualityTag[];
  overall_score: number; // 0-100 scale
  content_analysis: {
    word_count: number;
    section_count: number;
    has_mechanism: boolean;
    has_examples: boolean;
    has_structure: boolean;
  };
  compliance_analysis?: {
    financial_claims_detected: number;
    financial_claims_sourced: number;
    domains_used: string[];
    compliance_score: number;
    warnings: string[];
    errors: string[];
  };
  pattern_analysis: {
    completion_drive: number; // 0-1 score
    question_suppression: number; // 0-1 score
    domain_mixing: number; // 0-1 score
  };
}

// Critical tag definitions with pattern detection
const CRITICAL_TAGS = [
  {
    tag: 'NO_MECHANISM',
    patterns: [/mechanism/i, /how.*work/i, /process/i, /step.*by.*step/i],
    severity: 'error' as const,
    rationale: 'Content lacks explicit mechanism or process explanation',
    suggestion: 'Add a clear "How it Works" or "Mechanism" section',
    is_absence_tag: true // Detect when pattern is MISSING
  },
  {
    tag: 'NO_EXAMPLES',
    patterns: [
      /for\s+example(?!.*planning)/i,
      /for\s+instance/i,
      /such\s+as/i,
      /like(?!.*planning)/i,
      /e\.g\./i,
      /i\.e\./i,
      /case\s+study/i,
      /demonstration/i,
      /^##\s+Example\s*$/m,  // "## Example" heading
      /^example:\s*$/im      // "Example:" on its own line
    ],
    severity: 'warning' as const,
    rationale: 'Content lacks practical examples or demonstrations',
    suggestion: 'Include concrete examples or case studies',
    is_absence_tag: true // Detect when pattern is MISSING
  },
  {
    tag: 'NO_STRUCTURE',
    patterns: [/#{1,3}\s/, /\*\*.*\*\*/, /^-\s/m, /^\d+\.\s/m],
    severity: 'error' as const,
    rationale: 'Content lacks clear hierarchical structure',
    suggestion: 'Add headings, subheadings, and bullet points',
    is_absence_tag: true // Detect when pattern is MISSING
  },
  {
    tag: 'COMPLETION_DRIVE',
    patterns: [/thoroughly/i, /comprehensive/i, /exhaustive/i, /complete/i, /fully/i, /detailed/i],
    severity: 'warning' as const,
    rationale: 'Content shows signs of completion drive bias',
    suggestion: 'Focus on key points rather than exhaustive coverage',
    is_absence_tag: false // Detect when pattern IS PRESENT
  },
  {
    tag: 'QUESTION_SUPPRESSION',
    patterns: [/\?/, /unclear/i, /uncertain/i, /may.*be/i, /might.*be/i],
    severity: 'info' as const,
    rationale: 'Content may be suppressing valid questions',
    suggestion: 'Acknowledge limitations and uncertainties',
    is_absence_tag: false // Detect when pattern IS PRESENT
  },
  {
    tag: 'DOMAIN_MIXING',
    patterns: [/however/i, /alternatively/i, /on.*other.*hand/i, /contrast/i, /whereas/i],
    severity: 'warning' as const,
    rationale: 'Content may be mixing domains without clear separation',
    suggestion: 'Clearly separate different domains or perspectives',
    is_absence_tag: false // Detect when pattern IS PRESENT
  },
  {
    tag: 'CONSTRAINT_OVERRIDE',
    patterns: [/always/i, /never/i, /everyone/i, /without.*exception/i],
    severity: 'warning' as const,
    rationale: 'Content may be ignoring important constraints',
    suggestion: 'Add qualifications and acknowledge exceptions',
    is_absence_tag: false // Detect when pattern IS PRESENT
  },
  {
    tag: 'TOKEN_PADDING',
    patterns: [/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi],
    severity: 'info' as const,
    rationale: 'Content may have unnecessary wordiness',
    suggestion: 'Remove redundant words and be more concise',
    is_absence_tag: false // Special handling
  },
  {
    tag: 'NO_COMPLIANCE_CHECK',
    patterns: [/\(.*MAS.*\)|\(.*IRAS.*\)|\(.*regulation.*\)|source:.*mas|source:.*iras/i],
    severity: 'warning' as const,
    rationale: 'Content may lack regulatory compliance references',
    suggestion: 'Add appropriate regulatory disclaimers and references',
    is_absence_tag: true // Detect when pattern is MISSING for financial content
  },
  {
    tag: 'NO_EVIDENCE_LINKS',
    patterns: [/\[.*\]\(.*\)|source:|reference:|according to/i],
    severity: 'warning' as const,
    rationale: 'Content lacks evidence citations or source references',
    suggestion: 'Add verifiable sources and evidence links',
    is_absence_tag: true // Detect when pattern is MISSING
  },
  {
    tag: 'INSUFFICIENT_CONTENT',
    patterns: [/./], // Always checked
    severity: 'error' as const,
    rationale: 'Content is too short to be meaningful',
    suggestion: 'Expand content to provide meaningful information',
    is_absence_tag: false // Special handling based on word count
  }
];

function calculatePatternScores(content: string): AuditOutput['pattern_analysis'] {
  const lowerContent = content.toLowerCase();
  const wordCount = content.split(/\s+/).length;
  
  // Pattern detection scores - normalized and more reasonable
  const completionDriveWords = (lowerContent.match(/(thoroughly|comprehensive|exhaustive|complete|fully|detailed)/g) || []).length;
  const completionDrive = Math.min(completionDriveWords / Math.max(wordCount / 20, 1), 0.8); // Threshold: 1 word per 20 words
  
  const questionCount = (content.match(/\?/g) || []).length;
  const questionSuppression = questionCount === 0 && wordCount > 30 ? 0.6 : questionCount === 0 ? 0.3 : 0.1;
  
  const domainMixingWords = (lowerContent.match(/(however|alternatively|on.*other.*hand|in.*contrast|whereas)/g) || []).length;
  const domainMixing = Math.min(domainMixingWords / Math.max(wordCount / 50, 1), 0.7); // Threshold: 1 word per 50 words
  
  return {
    completion_drive: completionDrive,
    question_suppression: questionSuppression,
    domain_mixing: domainMixing
  };
}

function analyzeContentStructure(content: string): AuditOutput['content_analysis'] {
  const wordCount = content.split(/\s+/).length;
  const sectionCount = (content.match(/^#{1,3}\s+/gm) || []).length;
  const hasMechanism = /(mechanism|how.*work|process|step.*by.*step)/i.test(content);
  
  // Improved example detection - check for various example patterns
  const hasGoodExamples = /^##\s+Example\s*$/m.test(content) ||
                          /example:\s*$/im.test(content) ||
                          /for\s+example(?!.*planning)/i.test(content) ||
                          /for\s+instance/i.test(content) ||
                          /such\s+as/i.test(content) ||
                          /case\s+study/i.test(content);
  
  const hasStructure = /^#{1,3}\s+/m.test(content) || /^\d+\.\s+/m.test(content) || /^-\s/m.test(content);
  
  return {
    word_count: wordCount,
    section_count: sectionCount,
    has_mechanism: hasMechanism,
    has_examples: hasGoodExamples,
    has_structure: hasStructure
  };
}

function detectQualityTags(content: string, ip: string): QualityTag[] {
  const tags: QualityTag[] = [];
  const wordCount = content.split(/\s+/).length;
  
  for (const tagDef of CRITICAL_TAGS) {
    let shouldTag = false;
    
    if (tagDef.tag === 'TOKEN_PADDING') {
      // Special handling for token padding
      const matches = content.match(tagDef.patterns[0]);
      const commonWordRatio = matches ? matches.length / Math.max(wordCount, 1) : 0;
      shouldTag = commonWordRatio > 0.4; // >40% common words indicates padding
    } else if (tagDef.tag === 'NO_COMPLIANCE_CHECK') {
      // Special handling: only check for compliance if financial content is detected
      const hasFinancialContent = /financial|bank|investment|capital|ratio|regulation/i.test(content);
      if (hasFinancialContent) {
        shouldTag = !tagDef.patterns.some(pattern => pattern.test(content));
      }
    } else if (tagDef.tag === 'INSUFFICIENT_CONTENT') {
      // Special handling: check word count
      shouldTag = wordCount < 15;
    } else if (tagDef.is_absence_tag) {
      // For absence tags, detect when NONE of the patterns are found
      shouldTag = !tagDef.patterns.some(pattern => pattern.test(content));
    } else {
      // For presence tags, detect when ANY of the patterns are found
      shouldTag = tagDef.patterns.some(pattern => pattern.test(content));
    }
    
    if (shouldTag) {
      const confidence = calculateTagConfidence(content, tagDef, shouldTag);
      tags.push({
        tag: tagDef.tag,
        severity: tagDef.severity,
        section: detectTagSection(content, tagDef.tag),
        rationale: tagDef.rationale,
        suggestion: tagDef.suggestion,
        confidence,
        auto_fixable: isAutoFixable(tagDef.tag)
      });
    }
  }
  
  return tags;
}

function calculateTagConfidence(content: string, tagDef: any, shouldTag: boolean): number {
  const contentLength = content.length;
  const wordCount = content.split(/\s+/).length;
  
  // Special handling for very short content
  if (tagDef.tag === 'INSUFFICIENT_CONTENT') {
    return wordCount < 10 ? 0.9 : wordCount < 15 ? 0.7 : 0.5;
  }
  
  // Base confidence on severity and content characteristics
  let baseConfidence = 0.5;
  
  if (tagDef.severity === 'error') {
    baseConfidence = 0.7;
  } else if (tagDef.severity === 'warning') {
    baseConfidence = 0.6;
  }
  
  // Adjust for content length - longer content gets higher confidence for absence detection
  if (tagDef.is_absence_tag && wordCount > 50) {
    baseConfidence += 0.2;
  }
  
  // Adjust for very short content - higher confidence for issues
  if (wordCount < 20) {
    baseConfidence += 0.2;
  }
  
  // Adjust for very long content - reduce confidence slightly
  if (wordCount > 200) {
    baseConfidence -= 0.1;
  }
  
  return Math.max(0.3, Math.min(0.95, baseConfidence));
}

function detectTagSection(content: string, tag: string): string | undefined {
  const lines = content.split('\n');
  const sectionHeaders = lines.filter(line => /^#{1,3}\s/.test(line));
  
  if (sectionHeaders.length > 0) {
    return sectionHeaders[sectionHeaders.length - 1].replace(/^#{1,3}\s/, '').trim();
  }
  
  return undefined;
}

function isAutoFixable(tag: string): boolean {
  const autoFixableTags = ['NO_STRUCTURE', 'TOKEN_PADDING', 'NO_EXAMPLES', 'INSUFFICIENT_CONTENT'];
  return autoFixableTags.includes(tag);
}

function calculateOverallScore(tags: QualityTag[], wordCount: number): number {
  let score = 100;
  
  // Base score deduction for tags
  for (const tag of tags) {
    const deduction = tag.severity === 'error' ? 18 : tag.severity === 'warning' ? 10 : 4;
    score -= deduction * tag.confidence;
  }
  
  // Additional deductions for very short content
  if (wordCount < 20) {
    score -= 20;
  } else if (wordCount < 30) {
    score -= 10;
  }
  
  // Additional deductions for too few tags (lack of structure)
  if (tags.length === 0 && wordCount > 50) {
    score -= 15; // Long content with no detected issues is suspicious
  }
  
  return Math.max(0, Math.round(score));
}

export async function microAudit(input: AuditInput): Promise<AuditOutput> {
  console.log('Auditor: Analyzing content for IP:', input.ip);
  
  const content = input.draft;
  const structure = analyzeContentStructure(content);
  const patterns = calculatePatternScores(content);
  const tags = detectQualityTags(content, input.ip);
  const overallScore = calculateOverallScore(tags, structure.word_count);
  
  console.log('Auditor: Analysis complete', {
    overall_score: overallScore,
    tags_detected: tags.length,
    word_count: structure.word_count,
    section_count: structure.section_count
  });
  
  // Compliance analysis
  const compliance_analysis = {
    financial_claims_detected: (content.match(/financial|bank|investment|capital|ratio|regulation/g) || []).length,
    financial_claims_sourced: 0,
    domains_used: content.match(/mas.gov.sg|iras.gov.sg|.gov.sg|.edu/g) || [],
    compliance_score: 85,
    warnings: [],
    errors: []
  };
  
  // Adjust compliance score based on detected issues
  if (compliance_analysis.financial_claims_detected > 0) {
    if (compliance_analysis.domains_used.length > 0) {
      compliance_analysis.compliance_score = 90; // High score for properly sourced financial content
    } else {
      compliance_analysis.compliance_score = 60; // Lower score for unsourced claims
      compliance_analysis.errors.push("Financial claims detected but not properly sourced");
    }
  }
  
  if (compliance_analysis.domains_used.length === 0 && compliance_analysis.financial_claims_detected > 0) {
    compliance_analysis.warnings.push("Financial content detected but no trusted domains used");
  }
  
  return {
    tags,
    overall_score: overallScore,
    content_analysis: structure,
    pattern_analysis: patterns,
    compliance_analysis
  };
}

// Additional utility functions
export function getTagDefinitions() {
  return CRITICAL_TAGS.map(tag => ({
    tag: tag.tag,
    severity: tag.severity,
    rationale: tag.rationale,
    auto_fixable: isAutoFixable(tag.tag)
  }));
}

export function calculateRepairPriority(tags: QualityTag[]): QualityTag[] {
  return tags
    .sort((a, b) => {
      // Sort by severity first, then by confidence
      const severityOrder = { error: 3, warning: 2, info: 1 };
      const aSeverity = severityOrder[a.severity];
      const bSeverity = severityOrder[b.severity];
      
      if (aSeverity !== bSeverity) {
        return bSeverity - aSeverity;
      }
      
      return b.confidence - a.confidence;
    });
}

export function suggestAutoFixes(content: string, tags: QualityTag[]): Array<{ type: string; suggestion: string }> {
  return tags
    .filter(tag => tag.auto_fixable)
    .map(tag => ({
      type: tag.tag,
      suggestion: tag.suggestion || `Address ${tag.tag} issue automatically`
    }));
}
