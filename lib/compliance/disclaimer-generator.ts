// ABOUTME: Template-based Disclaimer Generator for Singapore Compliance
// ABOUTME: Generates intent-based disclaimers with Singapore-specific regulatory requirements
// ABOUTME: Provides placement recommendations and template variable substitution

import { IntentAnalysisResult } from './intent-analyzer';
import { ComplianceViolation, ComplianceStatus } from './compliance-engine';
import { policyLoader, DisclaimerTemplates, LocalizedText } from './policy-loader';
import { getLogger } from '../../orchestrator/logger';

const logger = getLogger();

export type DisclaimerLevel = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'critical';
export type DisclaimerPlacement = 'inline' | 'footer' | 'sidebar' | 'header' | 'modal';

export interface DisclaimerRecommendation {
  level: DisclaimerLevel;
  template: string;
  placement: DisclaimerPlacement[];
  variables: Record<string, string>;
  singapore_specific: boolean;
  mas_required: boolean;
  risk_level: 'informational' | 'guidance' | 'advisory' | 'financial_risk';
}

export interface DisclaimerConfig {
  defaultLanguage: 'en' | 'en-sg';
  singaporeContext: boolean;
  masCompliance: boolean;
  riskWarnings: boolean;
  placementStrategy: 'conservative' | 'balanced' | 'minimal';
  customTemplates?: Record<string, LocalizedText>;
}

export interface TemplateVariables {
  content_type?: string;
  target_audience?: string;
  geographical_focus?: string[];
  regulatory_authorities?: string;
  last_updated?: string;
  expert_contact?: string;
  source_count?: number;
  compliance_score?: string;
}

export class DisclaimerGenerator {
  private disclaimerTemplates: DisclaimerTemplates;
  private config: DisclaimerConfig;

  constructor(config?: Partial<DisclaimerConfig>) {
    try {
      this.disclaimerTemplates = policyLoader.getDisclaimerTemplates();
    } catch (error) {
      logger.error('Failed to load disclaimer templates', { error });
      throw new Error(`DisclaimerGenerator initialization failed: ${error}`);
    }

    this.config = {
      defaultLanguage: 'en-sg',
      singaporeContext: true,
      masCompliance: true,
      riskWarnings: true,
      placementStrategy: 'balanced',
      ...config
    };

    logger.debug('Disclaimer generator initialized', {
      defaultLanguage: this.config.defaultLanguage,
      singaporeContext: this.config.singaporeContext,
      masCompliance: this.config.masCompliance
    });
  }

  /**
   * Generate comprehensive disclaimer recommendation based on compliance analysis
   */
  async generateRecommendation(
    intentAnalysis: IntentAnalysisResult,
    violations: ComplianceViolation[],
    authorityLevel: 'low' | 'medium' | 'high',
    customVariables?: TemplateVariables
  ): Promise<DisclaimerRecommendation> {
    logger.debug('Generating disclaimer recommendation', {
      intent: intentAnalysis.intent,
      disclaimerLevel: intentAnalysis.disclaimer_level,
      violationsCount: violations.length,
      authorityLevel,
      singaporeContext: intentAnalysis.singapore_context
    });

    try {
      // Step 1: Determine disclaimer level based on intent and violations
      const disclaimerLevel = this.determineDisclaimerLevel(intentAnalysis, violations);
      
      // Step 2: Select appropriate template
      const template = this.selectTemplate(disclaimerLevel, intentAnalysis);
      
      // Step 3: Determine optimal placement
      const placement = this.determinePlacement(disclaimerLevel, intentAnalysis, authorityLevel);
      
      // Step 4: Extract and prepare template variables
      const variables = this.prepareTemplateVariables(intentAnalysis, violations, authorityLevel, customVariables);
      
      // Step 5: Generate final disclaimer text
      const renderedTemplate = this.renderTemplate(template, variables);
      
      // Step 6: Determine risk level and regulatory requirements
      const { riskLevel, masRequired, singaporeSpecific } = this.determineRiskRequirements(
        disclaimerLevel,
        intentAnalysis,
        violations
      );

      const recommendation: DisclaimerRecommendation = {
        level: disclaimerLevel,
        template: renderedTemplate,
        placement,
        variables,
        singapore_specific: singaporeSpecific,
        mas_required: masRequired,
        risk_level: riskLevel
      };

      logger.debug('Disclaimer recommendation generated', {
        level: disclaimerLevel,
        riskLevel,
        placement: placement.join(', '),
        masRequired,
        templateLength: renderedTemplate.length
      });

      return recommendation;

    } catch (error) {
      logger.error('Failed to generate disclaimer recommendation', { error });
      
      // Fallback to minimal disclaimer for resilience
      return this.generateFallbackRecommendation(intentAnalysis);
    }
  }

  /**
   * Determine disclaimer level based on intent analysis and violations
   */
  private determineDisclaimerLevel(
    intentAnalysis: IntentAnalysisResult,
    violations: ComplianceViolation[]
  ): DisclaimerLevel {
    // Start with intent-based level
    let level = this.mapIntentLevelToDisclaimerLevel(intentAnalysis.disclaimer_level);

    // Escalate based on violations
    const criticalViolations = violations.filter(v => v.severity === 'critical').length;
    const highViolations = violations.filter(v => v.severity === 'high').length;

    if (criticalViolations > 0) {
      level = 'critical';
    } else if (highViolations > 0 || intentAnalysis.mas_compliance_required) {
      level = 'high';
    } else if (intentAnalysis.singapore_context && intentAnalysis.risk_warning_required) {
      level = 'medium';
    } else if (violations.length > 0) {
      level = 'low';
    }

    // Apply placement strategy modifiers
    if (this.config.placementStrategy === 'minimal' && level !== 'critical') {
      level = level === 'high' ? 'medium' : level === 'medium' ? 'low' : level;
    } else if (this.config.placementStrategy === 'conservative' && level !== 'none') {
      level = level === 'low' ? 'medium' : level === 'medium' ? 'high' : level;
    }

    return level;
  }

  /**
   * Map intent analysis disclaimer level to standardized level
   */
  private mapIntentLevelToDisclaimerLevel(intentLevel: string): DisclaimerLevel {
    const mapping: Record<string, DisclaimerLevel> = {
      'none': 'none',
      'minimal': 'minimal',
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'critical'
    };

    return mapping[intentLevel] || 'minimal';
  }

  /**
   * Select appropriate template based on level and context
   */
  private selectTemplate(level: DisclaimerLevel, intentAnalysis: IntentAnalysisResult): string {
    const { templates } = this.disclaimerTemplates;
    const language = this.config.defaultLanguage;

    // Map disclaimer level to template key
    const templateKey = this.getTemplateKeyForLevel(level);
    
    if (!templateKey || !templates[templateKey]) {
      logger.warn('Template not found for level, using fallback', { level, templateKey });
      return templates.educational_context?.[language] || templates.educational_context?.['en'] || 
             'This content is for informational purposes only.';
    }

    const template = templates[templateKey][language] || templates[templateKey]['en'];
    
    if (!template) {
      logger.warn('Language template not found, using English fallback', { templateKey, language });
      return templates[templateKey]['en'] || 'This content is for informational purposes only.';
    }

    return template;
  }

  /**
   * Map disclaimer level to template key
   */
  private getTemplateKeyForLevel(level: DisclaimerLevel): string {
    const mapping: Record<DisclaimerLevel, string> = {
      'none': 'educational_context',
      'minimal': 'educational_context',
      'low': 'methodology_disclaimer',
      'medium': 'comparative_disclaimer',
      'high': 'advisory_disclaimer',
      'critical': 'financial_disclaimer'
    };

    return mapping[level];
  }

  /**
   * Determine optimal disclaimer placement based on level and context
   */
  private determinePlacement(
    level: DisclaimerLevel,
    intentAnalysis: IntentAnalysisResult,
    authorityLevel: 'low' | 'medium' | 'high'
  ): DisclaimerPlacement[] {
    const placement: DisclaimerPlacement[] = [];

    // Base placement by level
    switch (level) {
      case 'none':
        // No placement needed
        break;
        
      case 'minimal':
        placement.push('footer');
        break;
        
      case 'low':
        if (authorityLevel === 'high') {
          placement.push('footer');
        } else {
          placement.push('footer', 'sidebar');
        }
        break;
        
      case 'medium':
        placement.push('footer', 'sidebar');
        if (intentAnalysis.singapore_context) {
          placement.push('inline');
        }
        break;
        
      case 'high':
        placement.push('footer', 'header', 'sidebar');
        if (intentAnalysis.mas_compliance_required) {
          placement.push('inline');
        }
        break;
        
      case 'critical':
        placement.push('footer', 'header', 'inline', 'modal');
        break;
    }

    // Adjust based on placement strategy
    if (this.config.placementStrategy === 'minimal') {
      return placement.filter(p => p === 'footer' || p === 'modal');
    }

    if (this.config.placementStrategy === 'conservative') {
      const conservativeSet = new Set(['footer', 'header', 'modal']);
      return placement.filter(p => conservativeSet.has(p));
    }

    return placement;
  }

  /**
   * Prepare template variables for substitution
   */
  private prepareTemplateVariables(
    intentAnalysis: IntentAnalysisResult,
    violations: ComplianceViolation[],
    authorityLevel: 'low' | 'medium' | 'high',
    customVariables?: TemplateVariables
  ): Record<string, string> {
    const variables: Record<string, any> = {
      // System variables
      content_type: intentAnalysis.intent || 'information',
      singapore_context: intentAnalysis.singapore_context ? 'Singapore' : 'general',
      authority_level: authorityLevel,
      compliance_score: String(customVariables?.compliance_score || 'N/A') as string, // Would be calculated in real implementation
      last_updated: new Date().toLocaleDateString(),
      
      // Singapore-specific variables
      regulatory_authorities: this.getRegulatoryAuthorities(intentAnalysis) as string,
      singapore_requirements: this.getSingaporeRequirements(intentAnalysis),
      
      // Custom variables override defaults
      ...customVariables
    };

    // Add MAS-specific variables if required
    if (intentAnalysis.mas_compliance_required) {
      variables.mas_requirements = this.getMASRequirements();
      variables.financial_disclaimer = this.getFinancialDisclaimer();
    }

    // Add violation-specific variables
    if (violations.length > 0) {
      variables.violation_count = violations.length.toString();
      variables.critical_violations = violations.filter(v => v.severity === 'critical').length.toString();
    }

    return variables;
  }

  /**
   * Render template with variable substitution
   */
  private renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;

    // Replace {{variable}} patterns with actual values
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(pattern, value);
    }

    // Handle conditional blocks {{#if variable}}...{{/if}}
    rendered = this.renderConditionals(rendered, variables);

    return rendered.trim();
  }

  /**
   * Render conditional template blocks
   */
  private renderConditionals(template: string, variables: Record<string, string>): string {
    // Simple conditional rendering for {{#if variable}}...{{/if}} blocks
    const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    
    return template.replace(conditionalRegex, (match, variable, content) => {
      const value = variables[variable];
      return value && value !== '' && value !== 'false' && value !== '0' ? content : '';
    });
  }

  /**
   * Determine risk level and regulatory requirements
   */
  private determineRiskRequirements(
    level: DisclaimerLevel,
    intentAnalysis: IntentAnalysisResult,
    violations: ComplianceViolation[]
  ): {
    riskLevel: 'informational' | 'guidance' | 'advisory' | 'financial_risk';
    masRequired: boolean;
    singaporeSpecific: boolean;
  } {
    let riskLevel: 'informational' | 'guidance' | 'advisory' | 'financial_risk' = 'informational';
    let masRequired = false;
    let singaporeSpecific = false;

    // Determine risk level
    if (level === 'critical' || intentAnalysis.mas_compliance_required) {
      riskLevel = 'financial_risk';
      masRequired = true;
    } else if (level === 'high') {
      riskLevel = 'advisory';
    } else if (level === 'medium') {
      riskLevel = 'guidance';
    }

    // Singapore-specific requirements
    if (intentAnalysis.singapore_context || this.config.singaporeContext) {
      singaporeSpecific = true;
      
      // Escalate risk level for Singapore financial content
      if (intentAnalysis.singapore_specific_indicators.some(indicator => 
        ['cpf', 'hdb', 'mas', 'iras', 'srs'].includes(indicator)
      )) {
        if (riskLevel === 'guidance') riskLevel = 'advisory';
        if (riskLevel === 'advisory') riskLevel = 'financial_risk';
        masRequired = true;
      }
    }

    return { riskLevel, masRequired, singaporeSpecific };
  }

  /**
   * Get regulatory authorities based on context
   */
  private getRegulatoryAuthorities(intentAnalysis: IntentAnalysisResult): string {
    const authorities: string[] = [];

    if (intentAnalysis.singapore_context) {
      authorities.push('Monetary Authority of Singapore (MAS)');
      authorities.push('Inland Revenue Authority of Singapore (IRAS)');
    }

    if (intentAnalysis.mas_compliance_required) {
      authorities.push('Financial Advisers Act (FAA)');
    }

    return authorities.join(', ') || 'Relevant regulatory authorities';
  }

  /**
   * Get Singapore-specific requirements
   */
  private getSingaporeRequirements(intentAnalysis: IntentAnalysisResult): string {
    const requirements: string[] = [];

    if (intentAnalysis.singapore_context) {
      requirements.push('Compliant with Singapore regulatory framework');
    }

    if (intentAnalysis.mas_compliance_required) {
      requirements.push('MAS-compliant financial information');
    }

    if (intentAnalysis.risk_warning_required) {
      requirements.push('Risk warning requirements satisfied');
    }

    return requirements.join('; ') || 'Standard compliance requirements';
  }

  /**
   * Get MAS-specific requirements
   */
  private getMASRequirements(): string {
    return 'This content complies with Monetary Authority of Singapore (MAS) guidelines for financial information. ' +
           'For specific financial advice, please consult a MAS-licensed financial adviser.';
  }

  /**
   * Get financial disclaimer
   */
  private getFinancialDisclaimer(): string {
    return 'Investment products carry risk and are not insured. Past performance is not indicative of future results. ' +
           'Please consider your financial situation and risk tolerance before making any investment decisions.';
  }

  /**
   * Generate fallback recommendation for error resilience
   */
  private generateFallbackRecommendation(intentAnalysis: IntentAnalysisResult): DisclaimerRecommendation {
    return {
      level: 'minimal',
      template: 'This content is for informational purposes only and should not be considered as professional advice.',
      placement: ['footer'],
      variables: {
        content_type: intentAnalysis.intent || 'information'
      },
      singapore_specific: intentAnalysis.singapore_context,
      mas_required: false,
      risk_level: 'informational'
    };
  }

  /**
   * Get available disclaimer templates for debugging/configuration
   */
  getAvailableTemplates(): Record<string, { languages: string[]; description: string }> {
    const { templates, template_categories } = this.disclaimerTemplates;
    const available: Record<string, { languages: string[]; description: string }> = {};

    for (const [key, category] of Object.entries(template_categories)) {
      if (templates[key as keyof typeof templates]) {
        const template = templates[key as keyof typeof templates] as LocalizedText;
        available[key] = {
          languages: Object.keys(template),
          description: category.use_case
        };
      }
    }

    return available;
  }

  /**
   * Validate disclaimer recommendation
   */
  validateRecommendation(recommendation: DisclaimerRecommendation): {
    valid: boolean;
    warnings: string[];
    errors: string[];
  } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check template is not empty
    if (!recommendation.template || recommendation.template.trim().length === 0) {
      errors.push('Disclaimer template is empty');
    }

    // Check placement is not empty for non-none levels
    if (recommendation.level !== 'none' && recommendation.placement.length === 0) {
      errors.push('No placement specified for non-none disclaimer level');
    }

    // Check MAS consistency
    if (recommendation.mas_required && !recommendation.template.toLowerCase().includes('mas')) {
      warnings.push('MAS required but MAS not mentioned in disclaimer template');
    }

    // Check Singapore consistency
    if (recommendation.singapore_specific && !recommendation.template.toLowerCase().includes('singapore')) {
      warnings.push('Singapore-specific but Singapore not mentioned in disclaimer template');
    }

    // Check risk level consistency
    if (recommendation.level === 'critical' && recommendation.risk_level !== 'financial_risk') {
      warnings.push('Critical disclaimer level should have financial_risk level');
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<DisclaimerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Disclaimer generator configuration updated', { newConfig });
  }
}
