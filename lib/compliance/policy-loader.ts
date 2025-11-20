// ABOUTME: Policy Loader for Singapore Compliance Framework
// ABOUTME: Loads and caches YAML compliance policies with proper TypeScript interfaces

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

// TypeScript interfaces for compliance policy structure
export interface WebPolicy {
  allow_domains: {
    financial: string[];
    technology: string[];
    enterprise: string[];
    sme_advisory: string[];
  };
  freshness_rules: {
    financial_sources: number;
    technology_sources: number;
    enterprise_research: number;
    sme_sources: number;
    government_sources: number;
    educational_sources: number;
  };
  content_rules: {
    financial_advisory: {
      require_disclaimer: boolean;
      allowed_sources: string[];
      risk_level: string;
    };
    regulatory_references: {
      require_source_links: boolean;
      allowed_domains: string[];
      validation_required: boolean;
    };
    educational_content: {
      minimum_freshness: number;
      preferred_domains: string[];
    };
    business_advice: {
      require_singapore_context: boolean;
      sme_focus_required: boolean;
      allowed_enterprise_sources: boolean;
    };
  };
}

export interface DomainAuthority {
  domain_authority: {
    critical: AuthorityLevel;
    high: AuthorityLevel;
    medium: AuthorityLevel;
    standard: AuthorityLevel;
  };
  singapore_rules: {
    government_domains: SingaporeDomainRule;
    financial_institutions: SingaporeDomainRule;
    educational_institutions: SingaporeDomainRule;
    sme_business_advisors: SingaporeDomainRule;
  };
  wildcard_handling: {
    allowed_wildcards: string[];
    excluded_patterns: string[];
  };
  regional_context: {
    singapore_focus: {
      language_preferences: string[];
      currency_references: string[];
      regulatory_framework: string;
    };
    asean_compatibility: {
      allowed_regional_sources: string[];
      trust_level_modifier: number;
      additional_validation: boolean;
    };
  };
}

export interface AuthorityLevel {
  patterns: string[];
  trust_level: number;
  auto_approve: boolean;
  freshness_requirement: number;
}

export interface SingaporeDomainRule {
  required_for: string[];
  verification_method?: string;
  license_verification?: boolean;
  mas_registry_check?: boolean;
  moe_registration_check?: boolean;
  enterprise_sg_partnership?: boolean;
}

export interface IntentPatterns {
  intent_categories: {
    educational: IntentCategory;
    methodological: IntentCategory;
    comparative: IntentCategory;
    advisory: IntentCategory;
  };
  singapore_intents: {
    financial_advisory: SingaporeIntent;
    business_guidance: SingaporeIntent;
    regulatory_compliance: SingaporeIntent;
  };
  disclaimer_levels: {
    minimal: DisclaimerLevel;
    low: DisclaimerLevel;
    medium: DisclaimerLevel;
    high: DisclaimerLevel;
    critical: DisclaimerLevel;
  };
  detection_rules: {
    priority_order: string[];
    conflict_resolution: {
      rule: string;
      fallback: string;
    };
    confidence_thresholds: {
      high_confidence: number;
      medium_confidence: number;
      low_confidence: number;
    };
    fallback_behavior: {
      default_intent: string;
      default_disclaimer: string;
      require_review: boolean;
    };
  };
}

export interface IntentCategory {
  description: string;
  patterns: string[];
  keywords: string[];
  disclaimer_level: string;
  singapore_context: boolean;
}

export interface SingaporeIntent {
  description: string;
  patterns: string[];
  keywords: string[];
  disclaimer_level: string;
  [key: string]: any; // For additional properties like mas_compliance
}

export interface DisclaimerLevel {
  triggers: string[];
  template: string;
  require_source_links: boolean;
  source_validation?: boolean;
  risk_warning?: boolean;
  mas_compliance?: boolean;
}

export interface DisclaimerTemplates {
  template_categories: {
    educational_context: TemplateCategory;
    methodology_disclaimer: TemplateCategory;
    comparative_disclaimer: TemplateCategory;
    advisory_disclaimer: TemplateCategory;
    financial_disclaimer: TemplateCategory;
  };
  templates: {
    educational_context: LocalizedText;
    methodology_disclaimer: LocalizedText;
    comparative_disclaimer: LocalizedText;
    advisory_disclaimer: LocalizedText;
    financial_disclaimer: LocalizedText;
  };
  risk_warnings: {
    general: LocalizedText;
    financial: LocalizedText;
    business: LocalizedText;
  };
  mas_compliance: {
    required_elements: string[];
    regulated_activities: Record<string, string>;
  };
  template_variables: Record<string, any>;
  singapore_adaptations: {
    language_preferences: {
      primary: string;
      secondary: string;
      formal_context: string;
    };
    cultural_context: {
      formality_level: string;
      directness: string;
      authority_respect: string;
    };
    common_phrases: {
      instead_of: string[];
      prefer: string[];
    };
    regulatory_references: {
      full_names: boolean;
      acronym_usage: string;
      website_links: string;
    };
  };
  validation_rules: {
    required_elements: Record<string, string[]>;
    prohibited_phrases: string[];
    source_link_requirements: Record<string, string>;
  };
}

export interface TemplateCategory {
  level: string;
  use_case: string;
  singapore_specific: boolean;
  mas_required?: boolean;
}

export interface LocalizedText {
  en: string;
  'en-sg': string;
}

// Policy Loader class with caching
export class PolicyLoader {
  private static instance: PolicyLoader;
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly POLICY_DIR = join(process.cwd(), 'compliance');

  private constructor() {}

  static getInstance(): PolicyLoader {
    if (!PolicyLoader.instance) {
      PolicyLoader.instance = new PolicyLoader();
    }
    return PolicyLoader.instance;
  }

  // Load and cache YAML policy files
  private loadYaml<T>(filename: string): T {
    const cacheKey = filename;
    const now = Date.now();

    // Check cache first
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.cache.get(cacheKey);
    }

    const filePath = join(this.POLICY_DIR, filename);
    
    if (!existsSync(filePath)) {
      throw new Error(`Policy file not found: ${filePath}`);
    }

    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const parsed = yaml.load(fileContent) as T;
      
      // Cache the result
      this.cache.set(cacheKey, parsed);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);
      
      return parsed;
    } catch (error) {
      throw new Error(`Failed to load policy file ${filename}: ${error}`);
    }
  }

  // Public methods to load specific policy files
  getWebPolicy(): WebPolicy {
    return this.loadYaml<WebPolicy>('web_policy.yaml');
  }

  getDomainAuthority(): DomainAuthority {
    return this.loadYaml<DomainAuthority>('domain_authority.yaml');
  }

  getIntentPatterns(): IntentPatterns {
    return this.loadYaml<IntentPatterns>('intent_patterns.yaml');
  }

  getDisclaimerTemplates(): DisclaimerTemplates {
    return this.loadYaml<DisclaimerTemplates>('disclaimer_templates.yaml');
  }

  // Get all policies at once (useful for initialization)
  getAllPolicies(): {
    webPolicy: WebPolicy;
    domainAuthority: DomainAuthority;
    intentPatterns: IntentPatterns;
    disclaimerTemplates: DisclaimerTemplates;
  } {
    return {
      webPolicy: this.getWebPolicy(),
      domainAuthority: this.getDomainAuthority(),
      intentPatterns: this.getIntentPatterns(),
      disclaimerTemplates: this.getDisclaimerTemplates()
    };
  }

  // Clear cache (useful for development/testing)
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Validate policy structure (useful for development)
  validatePolicies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.getWebPolicy();
    } catch (error) {
      errors.push(`Web policy validation failed: ${error}`);
    }

    try {
      this.getDomainAuthority();
    } catch (error) {
      errors.push(`Domain authority validation failed: ${error}`);
    }

    try {
      this.getIntentPatterns();
    } catch (error) {
      errors.push(`Intent patterns validation failed: ${error}`);
    }

    try {
      this.getDisclaimerTemplates();
    } catch (error) {
      errors.push(`Disclaimer templates validation failed: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance for easy usage
export const policyLoader = PolicyLoader.getInstance();
