// ABOUTME: Enhanced micro-auditor with 10 critical quality tags
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
    suggestion: 'Add a clear "How it Works" or "Mechanism" section'
  },
  {
    tag: 'NO_EXAMPLES',
    patterns: [/example/i, /for.*instance/i, /case.*study/i, /demonstration/i],
    severity: 'warning' as const,
    rationale: 'Content lacks practical examples or demonstrations',
    suggestion: 'Include concrete examples or case studies'
  },
  {
    tag: 'NO_STRUCTURE',
    patterns: [/#{1,3}\s/, /\*\*.*\*\*/, /^-\s/, /^\d+\./m],
    severity: 'error' as const,
    rationale: 'Content lacks clear hierarchical structure',
    suggestion: 'Add headings, subheadings, and bullet points'
  },
  {
    tag: 'COMPLETION_DRIVE',
    patterns: [/thoroughly/i, /comprehensive/i, /exhaustive/i, /complete/i],
    severity: 'warning' as const,
    rationale: 'Content shows signs of completion drive bias',
    suggestion: 'Focus on key points rather than exhaustive coverage'
  },
  {
    tag: 'QUESTION_SUPPRESSION',
    patterns: [/\?/, /unclear/i, /uncertain/i, /may.*be/i],
    severity: 'info' as const,
    rationale: 'Content may be suppressing valid questions',
    suggestion: 'Acknowledge limitations and uncertainties'
  },
  {
    tag: 'DOMAIN_MIXING',
    patterns: [/however/i, /alternatively/i, /on.*other.*hand/i, /contrast/i],
    severity: 'warning' as const,
    rationale: 'Content may be mixing domains without clear separation',
    suggestion: 'Clearly separate different domains or perspectives'
  },
  {
    tag: 'CONSTRAINT_OVERRIDE',
    patterns: [/always/i, /never/i, /everyone/i, /without.*exception/i],
    severity: 'warning' as const,
    rationale: 'Content may be ignoring important constraints',
    suggestion: 'Add qualifications and acknowledge exceptions'
  },
  {
    tag: 'TOKEN_PADDING',
    patterns: [/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi],
    severity: 'info' as const,
    rationale: 'Content may have unnecessary wordiness',
    suggestion: 'Remove redundant words and be more concise'
  },
  {
    tag: 'NO_COMPLIANCE_CHECK',
    patterns: [/\(.* MAS.*\)|\(.* IRAS.*\)|\(.* regulation.*\)/i],
    severity: 'error' as const,
    rationale: 'Content may lack regulatory compliance references',
    suggestion: 'Add appropriate regulatory disclaimers and references'
  },
  {
    tag: 'NO_EVIDENCE_LINKS',
    patterns: [/\[.*\]\(.*\)|source:|reference:|according to/i],
    severity: 'warning' as const,
    rationale: 'Content lacks evidence citations or source references',
    suggestion: 'Add verifiable sources and evidence links'
  }
];

function calculatePatternScores(content: string): AuditOutput['pattern_analysis'] {
  const lowerContent = content.toLowerCase();
  
  // Pattern detection scores
  const completionDrive = (lowerContent.match(/(thoroughly|comprehensive|exhaustive|complete|fully|detailed)/g) || []).length / content.length * 100;
  const questionSuppression = (lowerContent.match(/\?/g) || []).length === 0 ? 0.8 : 0.2;
  const domainMixing = (lowerContent.match(/(however|alternatively|on.*other.*hand|in.*contrast|whereas)/g) || []).length / content.length * 100;
  
  return {
    completion_drive: Math.min(completionDrive, 1.0),
    question_suppression: questionSuppression,
    domain_mixing: Math.min(domainMixing, 1.0)
  };
}

function analyzeContentStructure(content: string): AuditOutput['content_analysis'] {
  const wordCount = content.split(/\s+/).length;
  const sectionCount = (content.match(/^#{1,3}\s+/gm) || []).length;
  const hasMechanism = /(mechanism|how.*work|process|step.*by.*step)/i.test(content);
  const hasExamples = /(example|for.*instance|case.*study|demonstration)/i.test(content);
  const hasStructure = /^#{1,3}\s+/m.test(content) || /^\d+\./m.test(content);
  
  return {
    word_count: wordCount,
    section_count: sectionCount,
    has_mechanism: hasMechanism,
    has_examples: hasExamples,
    has_structure: hasStructure
  };
}

function detectQualityTags(content: string, ip: string): QualityTag[] {
  const tags: QualityTag[] = [];
  
  for (const tagDef of CRITICAL_TAGS) {
    const hasPattern = tagDef.patterns.some(pattern => {
      if (tagDef.tag === 'TOKEN_PADDING') {
        const matches = content.match(pattern);
        const wordCount = content.split(/\s+/).length;
        return matches && matches.length > wordCount * 0.4; // >40% common words
      }
      return !pattern.test(content);
    });
    
    if (hasPattern) {
      const confidence = calculateTagConfidence(content, tagDef);
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

function calculateTagConfidence(content: string, tagDef: any): number {
  // Simple confidence calculation based on content length and pattern strength
  const contentLength = content.length;
  
  if (tagDef.severity === 'error') {
    return Math.min(0.9, contentLength / 1000); // Higher confidence for longer content
  } else if (tagDef.severity === 'warning') {
    return Math.min(0.7, contentLength / 1500);
  } else {
    return Math.min(0.5, contentLength / 2000);
  }
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
  const autoFixableTags = ['NO_STRUCTURE', 'TOKEN_PADDING', 'NO_EXAMPLES'];
  return autoFixableTags.includes(tag);
}

function calculateOverallScore(tags: QualityTag[]): number {
  let score = 100;
  
  for (const tag of tags) {
    const deduction = tag.severity === 'error' ? 20 : tag.severity === 'warning' ? 10 : 5;
    score -= deduction * tag.confidence;
  }
  
  return Math.max(0, Math.round(score));
}

export async function microAudit(input: AuditInput): Promise<AuditOutput> {
  console.log('Auditor: Analyzing content for IP:', input.ip);
  
  const content = input.draft;
  const structure = analyzeContentStructure(content);
  const patterns = calculatePatternScores(content);
  const tags = detectQualityTags(content, input.ip);
  const overallScore = calculateOverallScore(tags);
  
  console.log('Auditor: Analysis complete', {
    overall_score: overallScore,
    tags_detected: tags.length,
    word_count: structure.word_count,
    section_count: structure.section_count
  });
  
  return {
    tags,
    overall_score: overallScore,
    content_analysis: structure,
    pattern_analysis: patterns
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
