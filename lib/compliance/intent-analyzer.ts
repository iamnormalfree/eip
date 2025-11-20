// ABOUTME: Intent Classification Engine for Singapore Compliance
// ABOUTME: Analyzes content intent and determines appropriate disclaimer requirements

import { policyLoader, IntentPatterns, DisclaimerTemplates, WebPolicy } from './policy-loader';

export interface IntentAnalysisResult {
  intent: string;
  confidence: number;
  disclaimer_level: string;
  singapore_context: boolean;
  mas_compliance_required: boolean;
  requires_source_links: boolean;
  risk_warning_required: boolean;
  detected_patterns: string[];
  detected_keywords: string[];
  singapore_specific_indicators: string[];
}

export interface ContentContext {
  title?: string;
  content: string;
  target_audience?: string;
  content_type?: string;
  geographical_focus?: string[];
  language?: string;
}

export class IntentAnalyzer {
  private intentPatterns: IntentPatterns;
  private disclaimerTemplates: DisclaimerTemplates;
  private webPolicy: WebPolicy;

  constructor() {
    try {
      this.intentPatterns = policyLoader.getIntentPatterns();
      this.disclaimerTemplates = policyLoader.getDisclaimerTemplates();
      this.webPolicy = policyLoader.getWebPolicy();
    } catch (error) {
      throw new Error(`Failed to initialize IntentAnalyzer: ${error}`);
    }
  }

  // Main intent analysis method
  analyzeIntent(contentContext: ContentContext): IntentAnalysisResult {
    const { content, title, geographical_focus, language } = contentContext;
    const fullText = this.prepareTextForAnalysis(content, title);
    
    // Check if content is Singapore-focused first
    const isSingaporeFocused = this.isSingaporeFocused(fullText, geographical_focus, language);
    
    // Detect base intent categories
    const baseIntent = this.detectBaseIntent(fullText);
    
    // Check for Singapore-specific intents
    const singaporeIntent = isSingaporeFocused ? this.detectSingaporeIntent(fullText, geographical_focus, language) : null;
    
    // Resolve intent conflicts and determine final intent
    const resolvedIntent = this.resolveIntentConflict(baseIntent, singaporeIntent, isSingaporeFocused);
    
    // Determine compliance requirements
    const complianceRequirements = this.determineComplianceRequirements(resolvedIntent);
    
    return {
      ...resolvedIntent,
      ...complianceRequirements,
      detected_patterns: this.extractMatchingPatterns(fullText),
      detected_keywords: this.extractMatchingKeywords(fullText),
      singapore_specific_indicators: this.detectSingaporeIndicators(fullText)
    };
  }

  // Prepare text for analysis
  private prepareTextForAnalysis(content: string, title?: string): string {
    const textParts = [content.toLowerCase()];
    if (title) {
      textParts.unshift(title.toLowerCase());
    }
    return textParts.join(' ');
  }

  // Detect base intent categories
  private detectBaseIntent(text: string): { intent: string; confidence: number } {
    const { intent_categories } = this.intentPatterns;
    let bestMatch = { intent: 'educational', confidence: 0 };

    // Check each intent category
    for (const [intentName, intentData] of Object.entries(intent_categories)) {
      const confidence = this.calculateIntentConfidence(text, intentData);
      if (confidence > bestMatch.confidence) {
        bestMatch = { intent: intentName, confidence };
      }
    }

    return bestMatch;
  }

  // Detect Singapore-specific intents
  private detectSingaporeIntent(
    text: string, 
    geographicalFocus?: string[], 
    language?: string
  ): { intent: string; confidence: number } | null {
    const { singapore_intents } = this.intentPatterns;
    
    let bestMatch = { intent: '', confidence: 0 };

    // Check each Singapore-specific intent
    for (const [intentName, intentData] of Object.entries(singapore_intents)) {
      const confidence = this.calculateIntentConfidence(text, intentData);
      if (confidence > bestMatch.confidence) {
        bestMatch = { intent: intentName, confidence };
      }
    }

    return bestMatch.confidence > 0 ? bestMatch : null;
  }

  // Calculate confidence score for an intent
  private calculateIntentConfidence(text: string, intentData: any): number {
    let patternScore = 0;
    let keywordScore = 0;

    // Check pattern matches
    if (intentData.patterns && intentData.patterns.length > 0) {
      const matchedPatterns = intentData.patterns.filter((pattern: string) => 
        new RegExp(pattern, 'i').test(text)
      );
      patternScore = matchedPatterns.length / intentData.patterns.length;
    }

    // Check keyword matches
    if (intentData.keywords && intentData.keywords.length > 0) {
      const matchedKeywords = intentData.keywords.filter((keyword: string) => 
        text.includes(keyword.toLowerCase())
      );
      keywordScore = matchedKeywords.length / intentData.keywords.length;
    }

    // Weighted average (patterns have higher weight)
    return (patternScore * 0.7 + keywordScore * 0.3);
  }

  // Check if content is Singapore-focused
  private isSingaporeFocused(
    text: string, 
    geographicalFocus?: string[], 
    language?: string
  ): boolean {
    // Explicit geographical focus
    if (geographicalFocus?.includes('singapore') || geographicalFocus?.includes('sg')) {
      return true;
    }

    // Language preference
    if (language === 'en-sg') {
      return true;
    }

    // Singapore-specific indicators in text
    const singaporeIndicators = [
      'singapore', 'sg', 'sgd', 'cpf', 'hdb', 'mas', 'iras', 'mom', 
      'moe', 'nus', 'ntu', 'smu', 'sutd', 'orchard', 'marina bay',
      'changi', 'jurong', 'raffles place', 'central business district'
    ];

    const indicatorCount = singaporeIndicators.filter(indicator => 
      text.includes(indicator.toLowerCase())
    ).length;

    return indicatorCount >= 2; // Require at least 2 Singapore indicators
  }

  // Resolve intent conflicts according to priority rules
  private resolveIntentConflict(
    baseIntent: { intent: string; confidence: number },
    singaporeIntent: { intent: string; confidence: number } | null,
    isSingaporeFocused: boolean
  ): { intent: string; confidence: number; disclaimer_level: string; singapore_context: boolean } {
    const { detection_rules } = this.intentPatterns;
    const { priority_order } = detection_rules;

    // Get disclaimer levels for both intents
    const baseDisclaimerLevel = this.getDisclaimerLevel(baseIntent.intent);
    const singaporeDisclaimerLevel = singaporeIntent 
      ? this.getDisclaimerLevel(singaporeIntent.intent, true)
      : null;

    // Determine final intent based on priority rules
    if (singaporeIntent && singaporeIntent.confidence > detection_rules.confidence_thresholds.medium_confidence) {
      // Singapore intent takes precedence if it meets confidence threshold
      return {
        intent: singaporeIntent.intent,
        confidence: singaporeIntent.confidence,
        disclaimer_level: singaporeDisclaimerLevel || baseDisclaimerLevel,
        singapore_context: true
      };
    }

    // Base intent with Singapore context if applicable
    return {
      intent: baseIntent.intent,
      confidence: baseIntent.confidence,
      disclaimer_level: baseDisclaimerLevel,
      singapore_context: isSingaporeFocused
    };
  }

  // Get disclaimer level for intent
  private getDisclaimerLevel(intentName: string, isSingaporeSpecific = false): string {
    const { disclaimer_levels } = this.intentPatterns;
    
    for (const [level, levelData] of Object.entries(disclaimer_levels)) {
      if (levelData.triggers.includes(intentName)) {
        return level;
      }
    }

    // Fallback to safe default
    return this.intentPatterns.detection_rules.fallback_behavior.default_disclaimer;
  }

  // Determine compliance requirements based on resolved intent
  private determineComplianceRequirements(resolvedIntent: any): {
    disclaimer_level: string;
    singapore_context: boolean;
    mas_compliance_required: boolean;
    requires_source_links: boolean;
    risk_warning_required: boolean;
  } {
    const disclaimerLevel = resolvedIntent.disclaimer_level;
    const levelData = this.intentPatterns.disclaimer_levels[disclaimerLevel];

    return {
      disclaimer_level: disclaimerLevel,
      singapore_context: resolvedIntent.singapore_context,
      mas_compliance_required: levelData.mas_compliance || false,
      requires_source_links: levelData.require_source_links || false,
      risk_warning_required: levelData.risk_warning || false
    };
  }

  // Extract matching patterns from text
  private extractMatchingPatterns(text: string): string[] {
    const allPatterns = [
      ...this.getAllPatterns(this.intentPatterns.intent_categories),
      ...this.getAllPatterns(this.intentPatterns.singapore_intents)
    ];

    return allPatterns.filter(pattern => 
      new RegExp(pattern, 'i').test(text)
    );
  }

  // Extract matching keywords from text
  private extractMatchingKeywords(text: string): string[] {
    const allKeywords = [
      ...this.getAllKeywords(this.intentPatterns.intent_categories),
      ...this.getAllKeywords(this.intentPatterns.singapore_intents)
    ];

    return allKeywords.filter(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  // Detect Singapore-specific indicators
  private detectSingaporeIndicators(text: string): string[] {
    const indicators = [
      'singapore', 'sg', 'sgd', 'cpf', 'hdb', 'mas', 'iras', 'mom', 'moe',
      'nus', 'ntu', 'smu', 'sutd', 'suss', 'sit', 'polytechnic', 'ite',
      'orchard', 'marina bay', 'changi', 'jurong', 'raffles place', 'cbd'
    ];

    return indicators.filter(indicator => 
      text.includes(indicator.toLowerCase())
    );
  }

  // Helper methods to extract patterns and keywords
  private getAllPatterns(intentData: Record<string, any>): string[] {
    const patterns: string[] = [];
    for (const data of Object.values(intentData)) {
      if (data.patterns) {
        patterns.push(...data.patterns);
      }
    }
    return patterns;
  }

  private getAllKeywords(intentData: Record<string, any>): string[] {
    const keywords: string[] = [];
    for (const data of Object.values(intentData)) {
      if (data.keywords) {
        keywords.push(...data.keywords);
      }
    }
    return keywords;
  }

  // Public method to get disclaimer template
  getDisclaimerTemplate(level: string, language: string = 'en-sg'): string {
    const { templates } = this.disclaimerTemplates;
    const templateKey = this.getTemplateKeyForLevel(level);
    
    if (!templateKey || !templates[templateKey]) {
      return templates.educational_context[language] || templates.educational_context['en'];
    }

    return templates[templateKey][language] || templates[templateKey]['en'];
  }

  // Map disclaimer level to template key
  private getTemplateKeyForLevel(level: string): string {
    const mapping = {
      'minimal': 'educational_context',
      'low': 'methodology_disclaimer',
      'medium': 'comparative_disclaimer',
      'high': 'advisory_disclaimer',
      'critical': 'financial_disclaimer'
    };
    return mapping[level] || 'educational_context';
  }

  // Validate analysis results
  validateAnalysis(result: IntentAnalysisResult): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (result.confidence < this.intentPatterns.detection_rules.confidence_thresholds.low_confidence) {
      warnings.push('Low confidence in intent detection');
    }

    if (result.singapore_context && result.detected_keywords.length === 0) {
      warnings.push('Singapore context indicated but no Singapore keywords detected');
    }

    if (result.mas_compliance_required && !result.requires_source_links) {
      warnings.push('MAS compliance required but source links not required');
    }

    return {
      valid: warnings.length === 0,
      warnings
    };
  }
}
