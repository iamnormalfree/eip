// ABOUTME: Diff-bounded repairer with targeted fixes
// ABOUTME: Applies minimal, focused repairs based on audit tags

type RepairInput = { 
  draft: string; 
  audit: { 
    tags: Array<{ 
      tag: string; 
      severity: string; 
      section?: string; 
      suggestion?: string;
      auto_fixable: boolean;
      confidence: number;
    }>;
    content_analysis?: any;
    pattern_analysis?: any;
  };
};

interface RepairResult {
  repaired_draft: string;
  fixes_applied: Array<{
    tag: string;
    action: string;
    changes_made: number;
    confidence: number;
  }>;
  repair_summary: {
    total_fixes: number;
    sections_modified: string[];
    overall_improvement: number;
  };
}

interface DiffBound {
  max_additions: number;
  max_deletions: number;
  max_modifications: number;
}

class DiffBoundedRepairer {
  private diffBounds: DiffBound;

  constructor(bounds?: Partial<DiffBound>) {
    this.diffBounds = {
      max_additions: bounds?.max_additions || 200,
      max_deletions: bounds?.max_deletions || 100,
      max_modifications: bounds?.max_modifications || 150
    };
  }

  async repairDraft(input: RepairInput): Promise<RepairResult> {
    console.log('Repairer: Starting diff-bounded repair process');
    
    const originalDraft = input.draft;
    let repairedDraft = originalDraft;
    const fixesApplied: RepairResult['fixes_applied'] = [];
    const sectionsModified = new Set<string>();

    // Process tags in priority order
    const prioritizedTags = this.prioritizeTags(input.audit.tags);
    
    for (const tag of prioritizedTags) {
      if (tag.auto_fixable && tag.confidence > 0.5) {
        const fixResult = await this.applyFix(repairedDraft, tag);
        
        if (fixResult.changes_made > 0) {
          repairedDraft = fixResult.repaired_content;
          fixesApplied.push({
            tag: tag.tag,
            action: fixResult.action_description,
            changes_made: fixResult.changes_made,
            confidence: tag.confidence
          });
          
          if (tag.section) {
            sectionsModified.add(tag.section);
          }
          
          // Check diff bounds
          if (!this.withinDiffBounds(originalDraft, repairedDraft)) {
            console.log('Repairer: Diff bounds reached, stopping repairs');
            break;
          }
        }
      }
    }

    const improvement = this.calculateImprovement(originalDraft, repairedDraft, input.audit.tags);
    
    const repairSummary: RepairResult['repair_summary'] = {
      total_fixes: fixesApplied.length,
      sections_modified: Array.from(sectionsModified),
      overall_improvement: improvement
    };

    console.log('Repairer: Repair complete', repairSummary);
    
    return {
      repaired_draft: repairedDraft,
      fixes_applied: fixesApplied,
      repair_summary: repairSummary
    };
  }

  private prioritizeTags(tags: RepairInput['audit']['tags']): RepairInput['audit']['tags'] {
    const severityOrder = { error: 3, warning: 2, info: 1 };
    
    return tags
      .filter(tag => tag.auto_fixable)
      .sort((a, b) => {
        const aSeverity = severityOrder[a.severity as keyof typeof severityOrder] || 0;
        const bSeverity = severityOrder[b.severity as keyof typeof severityOrder] || 0;
        
        if (aSeverity !== bSeverity) {
          return bSeverity - aSeverity;
        }
        
        return b.confidence - a.confidence;
      });
  }

  private async applyFix(content: string, tag: RepairInput['audit']['tags'][0]): Promise<{
    repaired_content: string;
    action_description: string;
    changes_made: number;
  }> {
    switch (tag.tag) {
      case 'NO_STRUCTURE':
        return this.addStructure(content);
      case 'NO_EXAMPLES':
        return this.addExamples(content);
      case 'TOKEN_PADDING':
        return this.removePadding(content);
      case 'NO_COMPLIANCE_CHECK':
        return this.addCompliance(content);
      case 'NO_MECHANISM':
        return this.addMechanism(content);
      default:
        return {
          repaired_content: content,
          action_description: 'No fix available for ' + tag.tag,
          changes_made: 0
        };
    }
  }

  private addStructure(content: string): { repaired_content: string; action_description: string; changes_made: number } {
    const lines = content.split('\n');
    const hasHeadings = lines.some(line => /^#{1,3}\s/.test(line));
    
    if (hasHeadings) {
      return { repaired_content: content, action_description: 'Structure already present', changes_made: 0 };
    }

    // Add basic structure
    const structured = [
      '# Overview',
      '',
      content.trim(),
      '',
      '## Key Points',
      '',
      '## Summary',
      ''
    ].join('\n');

    return {
      repaired_content: structured,
      action_description: 'Added basic heading structure',
      changes_made: 5 // Approximate number of lines added
    };
  }

  private addExamples(content: string): { repaired_content: string; action_description: string; changes_made: number } {
    const exampleSection = [
      '',
      '## Examples',
      '',
      '*Example 1:* [Specific example would be inserted here based on content context]',
      '',
      '*Example 2:* [Another practical application]',
      ''
    ].join('\n');

    const withExamples = content + exampleSection;
    
    return {
      repaired_content: withExamples,
      action_description: 'Added examples section',
      changes_made: 6
    };
  }

  private removePadding(content: string): { repaired_content: string; action_description: string; changes_made: number } {
    // Remove redundant words and phrases
    const patterns = [
      /\b(the following|the below|in order to|as well as|in addition|also)\b/gi,
      /\b(very|really|quite|rather|somewhat|fairly)\s+/gi,
      /\s+/g // Multiple spaces to single space
    ];

    let cleaned = content;
    let changes = 0;
    
    for (const pattern of patterns) {
      const before = cleaned.length;
      cleaned = cleaned.replace(pattern, ' ');
      changes += Math.abs(before - cleaned.length);
    }

    // Clean up extra whitespace
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

    return {
      repaired_content: cleaned,
      action_description: 'Removed redundant words and padding',
      changes_made: Math.ceil(changes / 10) // Approximate changes
    };
  }

  private addCompliance(content: string): { repaired_content: string; action_description: string; changes_made: number } {
    const complianceNotice = [
      '',
      '---',
      '',
      '*This content is for informational purposes only. Please consult with relevant regulatory authorities such as MAS (Monetary Authority of Singapore) for specific guidance.*',
      ''
    ].join('\n');

    const withCompliance = content + complianceNotice;
    
    return {
      repaired_content: withCompliance,
      action_description: 'Added regulatory compliance notice',
      changes_made: 4
    };
  }

  private addMechanism(content: string): { repaired_content: string; action_description: string; changes_made: number } {
    const mechanismSection = [
      '',
      '## How It Works',
      '',
      'This process operates through the following key mechanisms:',
      '',
      '1. **Initial Assessment** - Evaluation of current conditions',
      '2. **Processing** - Application of specific procedures',
      '3. **Outcome** - Expected results and next steps',
      ''
    ].join('\n');

    const withMechanism = content + mechanismSection;
    
    return {
      repaired_content: withMechanism,
      action_description: 'Added mechanism section',
      changes_made: 8
    };
  }

  private withinDiffBounds(original: string, repaired: string): boolean {
    const originalLines = original.split('\n');
    const repairedLines = repaired.split('\n');
    
    const additions = Math.max(0, repairedLines.length - originalLines.length);
    const deletions = Math.max(0, originalLines.length - repairedLines.length);
    const modifications = Math.min(originalLines.length, repairedLines.length);
    
    return additions <= this.diffBounds.max_additions &&
           deletions <= this.diffBounds.max_deletions &&
           modifications <= this.diffBounds.max_modifications;
  }

  private calculateImprovement(original: string, repaired: string, tags: RepairInput['audit']['tags']): number {
    // Simple improvement calculation based on fixes applied vs. issues detected
    const totalIssues = tags.length;
    const fixableIssues = tags.filter(tag => tag.auto_fixable).length;
    const estimatedFixes = (repaired.length - original.length) / 50; // Rough estimate
    
    return Math.min(100, Math.round((estimatedFixes / fixableIssues) * 100));
  }
}

export async function repairDraft(input: RepairInput): Promise<string> {
  console.log('Repairer: Processing draft with', input.audit.tags.length, 'audit tags');
  
  const repairer = new DiffBoundedRepairer();
  const result = await repairer.repairDraft(input);
  
  console.log('Repairer: Applied', result.repair_summary.total_fixes, 'fixes');
  
  return result.repaired_draft;
}

// Additional exports for advanced usage
export { DiffBoundedRepairer, type RepairResult, type DiffBound };
export { calculateRepairPriority, suggestAutoFixes } from './auditor';
