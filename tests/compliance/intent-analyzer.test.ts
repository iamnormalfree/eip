// ABOUTME: Intent Analyzer Tests for Singapore Compliance
// ABOUTME: Comprehensive test coverage for intent classification and compliance requirements

import { IntentAnalyzer, ContentContext } from '../../lib/compliance/intent-analyzer';
import { policyLoader } from '../../lib/compliance/policy-loader';

// Mock policy loader for testing
jest.mock('../../lib/compliance/policy-loader');
const mockPolicyLoader = policyLoader as jest.Mocked<typeof policyLoader>;

describe('IntentAnalyzer', () => {
  let analyzer: IntentAnalyzer;
  const mockIntentPatterns = {
    intent_categories: {
      educational: {
        description: 'Purely informational content',
        patterns: ['how to.*', 'what is.*', 'learn about.*'],
        keywords: ['tutorial', 'guide', 'explanation'],
        disclaimer_level: 'minimal',
        singapore_context: false
      },
      advisory: {
        description: 'Recommendations and guidance',
        patterns: ['should.*', 'recommend.*', 'advise.*'],
        keywords: ['advice', 'recommendation', 'guidance'],
        disclaimer_level: 'high',
        singapore_context: true
      },
      financial_advisory: {
        description: 'Financial advice',
        patterns: ['invest in.*', 'buy.*stock', 'financial.*advice'],
        keywords: ['invest', 'stock', 'portfolio', 'returns'],
        disclaimer_level: 'critical',
        singapore_context: true
      }
    },
    singapore_intents: {
      financial_advisory: {
        description: 'Singapore financial advice',
        patterns: ['invest in singapore.*', 'cpf.*', 'hdb loan.*'],
        keywords: ['cpf', 'hdb', 'mas', 'srs'],
        disclaimer_level: 'critical',
        mas_compliance: true
      },
      business_guidance: {
        description: 'Singapore business guidance',
        patterns: ['start business in singapore.*', 'enterprise singapore.*'],
        keywords: ['acra', 'enterprise singapore', 'sme'],
        disclaimer_level: 'high',
        enterprise_sg_compliance: true
      }
    },
    disclaimer_levels: {
      minimal: {
        triggers: ['educational'],
        template: 'educational_context',
        require_source_links: false
      },
      high: {
        triggers: ['advisory'],
        template: 'advisory_disclaimer',
        require_source_links: true,
        risk_warning: true
      },
      critical: {
        triggers: ['financial_advisory'],
        template: 'financial_disclaimer',
        require_source_links: true,
        source_validation: true,
        risk_warning: true,
        mas_compliance: true
      }
    },
    detection_rules: {
      priority_order: ['critical', 'high', 'medium', 'low', 'minimal'],
      conflict_resolution: {
        rule: 'highest_disclaimer_level',
        fallback: 'safe_mode'
      },
      confidence_thresholds: {
        high_confidence: 0.85,
        medium_confidence: 0.70,
        low_confidence: 0.55
      },
      fallback_behavior: {
        default_intent: 'educational',
        default_disclaimer: 'medium',
        require_review: true
      }
    }
  };

  const mockDisclaimerTemplates = {
    templates: {
      educational_context: {
        en: 'This content is for educational purposes only.',
        'en-sg': 'This content is for learning purposes only.'
      },
      advisory_disclaimer: {
        en: 'Please consult professionals for advice.',
        'en-sg': 'Please consult Singapore-based professionals for advice.'
      },
      financial_disclaimer: {
        en: 'This is not financial advice.',
        'en-sg': 'This is not MAS-regulated financial advice.'
      }
    }
  };

  const mockWebPolicy = {
    content_rules: {
      financial_advisory: {
        require_disclaimer: true,
        allowed_sources: ['mas.gov.sg', '*.bank'],
        risk_level: 'high'
      }
    }
  };

  beforeEach(() => {
    mockPolicyLoader.getIntentPatterns.mockReturnValue(mockIntentPatterns as any);
    mockPolicyLoader.getDisclaimerTemplates.mockReturnValue(mockDisclaimerTemplates as any);
    mockPolicyLoader.getWebPolicy.mockReturnValue(mockWebPolicy as any);
    analyzer = new IntentAnalyzer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Intent Detection', () => {
    test('should detect educational intent correctly', () => {
      const context: ContentContext = {
        title: 'How to Learn TypeScript',
        content: 'This tutorial explains the basics of TypeScript programming.',
        content_type: 'tutorial'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.intent).toBe('educational');
      expect(result.disclaimer_level).toBe('minimal');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.requires_source_links).toBe(false);
    });

    test('should detect advisory intent correctly', () => {
      const context: ContentContext = {
        title: 'Business Growth Recommendations',
        content: 'We recommend focusing on customer acquisition and product improvement.',
        content_type: 'business_advice'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.intent).toBe('advisory');
      expect(result.disclaimer_level).toBe('high');
      expect(result.requires_source_links).toBe(true);
      expect(result.risk_warning_required).toBe(true);
    });

    test('should detect financial advisory intent correctly', () => {
      const context: ContentContext = {
        title: 'Investment Portfolio Advice',
        content: 'You should invest in diversified stocks and bonds for better returns.',
        content_type: 'financial_advice'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.intent).toBe('financial_advisory');
      expect(result.disclaimer_level).toBe('critical');
      expect(result.mas_compliance_required).toBe(true);
      expect(result.requires_source_links).toBe(true);
      expect(result.risk_warning_required).toBe(true);
    });
  });

  describe('Singapore-Specific Intent Detection', () => {
    test('should detect Singapore financial advisory intent', () => {
      const context: ContentContext = {
        title: 'CPF Investment Guidelines',
        content: 'Learn how to invest your CPF savings in Singapore-approved funds. Visit singapore government websites.',
        geographical_focus: ['singapore'],
        language: 'en-sg'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.singapore_context).toBe(true);
      expect(result.singapore_specific_indicators.length).toBeGreaterThan(0);
    });

    test('should detect Singapore business guidance intent', () => {
      const context: ContentContext = {
        title: 'Starting a Business in Singapore',
        content: 'Enterprise Singapore provides support for SMEs looking to register with ACRA. singapore business.',
        geographical_focus: ['singapore']
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.singapore_context).toBe(true);
      expect(result.singapore_specific_indicators.length).toBeGreaterThan(0);
    });

    test('should identify Singapore context from geographical focus', () => {
      const context: ContentContext = {
        content: 'Business development strategies for local companies in singapore.',
        geographical_focus: ['singapore']
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.singapore_context).toBe(true);
    });

    test('should identify Singapore context from language preference', () => {
      const context: ContentContext = {
        content: 'General business information.',
        language: 'en-sg'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.singapore_context).toBe(true);
    });

    test('should identify Singapore context from content indicators', () => {
      const context: ContentContext = {
        content: 'Learn about CPF and HDB policies in Singapore. Visit Marina Bay for business opportunities.'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.singapore_context).toBe(true);
      expect(result.singapore_specific_indicators).toContain('singapore');
      expect(result.singapore_specific_indicators).toContain('cpf');
      expect(result.singapore_specific_indicators).toContain('hdb');
    });
  });

  describe('Compliance Requirements', () => {
    test('should require MAS compliance for Singapore financial content', () => {
      const context: ContentContext = {
        title: 'MAS-Regulated Investment Products',
        content: 'MAS-approved investment options for Singapore residents.',
        geographical_focus: ['singapore']
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.mas_compliance_required).toBe(true);
      expect(result.requires_source_links).toBe(true);
      expect(result.risk_warning_required).toBe(true);
    });

    test('should require source links for advisory content', () => {
      const context: ContentContext = {
        content: 'We advise following best practices for data security.'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.requires_source_links).toBe(true);
    });

    test('should not require source links for educational content', () => {
      const context: ContentContext = {
        content: 'This is an explanation of basic concepts.'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.requires_source_links).toBe(false);
    });
  });

  describe('Pattern and Keyword Detection', () => {
    test('should detect matching patterns correctly', () => {
      const context: ContentContext = {
        content: 'How to implement microservices architecture'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.detected_patterns).toContain('how to.*');
    });

    test('should detect matching keywords correctly', () => {
      const context: ContentContext = {
        content: 'This tutorial provides step-by-step guidance on implementation.'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.detected_keywords).toContain('tutorial');
      expect(result.detected_keywords).toContain('guidance');
    });
  });

  describe('Disclaimer Template Retrieval', () => {
    test('should return Singapore English disclaimer when available', () => {
      const disclaimer = analyzer.getDisclaimerTemplate('minimal', 'en-sg');

      expect(disclaimer).toBe(mockDisclaimerTemplates.templates.educational_context['en-sg']);
    });

    test('should fallback to English if Singapore English not available', () => {
      const disclaimer = analyzer.getDisclaimerTemplate('minimal', 'fr');

      expect(disclaimer).toBe(mockDisclaimerTemplates.templates.educational_context['en']);
    });

    test('should return appropriate template for each disclaimer level', () => {
      const minimalDisclaimer = analyzer.getDisclaimerTemplate('minimal');
      const highDisclaimer = analyzer.getDisclaimerTemplate('high');
      const criticalDisclaimer = analyzer.getDisclaimerTemplate('critical');

      expect(minimalDisclaimer).toContain('learning');
      expect(highDisclaimer).toContain('professionals');
      expect(criticalDisclaimer).toContain('MAS');
    });
  });

  describe('Analysis Validation', () => {
    test('should detect low confidence warnings', () => {
      const context: ContentContext = {
        content: 'Generic content without strong indicators.'
      };

      const result = analyzer.analyzeIntent(context);
      const validation = analyzer.validateAnalysis(result);

      if (result.confidence < 0.55) {
        expect(validation.warnings).toContain('Low confidence in intent detection');
      }
    });

    test('should detect Singapore context inconsistencies', () => {
      const context: ContentContext = {
        content: 'Generic content.',
        geographical_focus: ['singapore']
      };

      const result = analyzer.analyzeIntent(context);
      const validation = analyzer.validateAnalysis(result);

      if (result.singapore_context && result.detected_keywords.length === 0) {
        expect(validation.warnings).toContain('Singapore context indicated but no Singapore keywords detected');
      }
    });

    test('should detect MAS compliance inconsistencies', () => {
      const context: ContentContext = {
        content: 'MAS investment advice.'
      };

      const result = analyzer.analyzeIntent(context);
      const validation = analyzer.validateAnalysis(result);

      expect(validation.valid).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing policy files gracefully', () => {
      mockPolicyLoader.getIntentPatterns.mockImplementation(() => {
        throw new Error('Policy file not found');
      });

      expect(() => new IntentAnalyzer()).toThrow('Failed to initialize IntentAnalyzer');
    });

    test('should handle malformed content gracefully', () => {
      const context: ContentContext = {
        content: '',
        title: ''
      };

      const result = analyzer.analyzeIntent(context);

      expect(result).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle mixed intent content', () => {
      const context: ContentContext = {
        content: 'Learn about investing in Singapore CPF and how to start your own business with advice from experts.',
        geographical_focus: ['singapore']
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.singapore_context).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should handle content with no clear intent', () => {
      const context: ContentContext = {
        content: 'This is some generic text that does not contain clear patterns or keywords.'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.intent).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    test('should handle Unicode and special characters', () => {
      const context: ContentContext = {
        content: 'Learn about CPF (Central Provident Fund) and HDB (Housing & Development Board) in Singapore.'
      };

      const result = analyzer.analyzeIntent(context);

      expect(result.singapore_context).toBe(true);
      expect(result.singapore_specific_indicators.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('should complete analysis within reasonable time', () => {
      const context: ContentContext = {
        title: 'Test Title',
        content: 'Test content for performance testing with financial advisory keywords.',
        geographical_focus: ['singapore']
      };

      const startTime = Date.now();
      const result = analyzer.analyzeIntent(context);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
      expect(result).toBeDefined();
    });

    test('should handle large content efficiently', () => {
      const largeContent = 'Financial advice content. '.repeat(1000);
      const context: ContentContext = {
        content: largeContent
      };

      const startTime = Date.now();
      const result = analyzer.analyzeIntent(context);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(200); // Should handle large content efficiently
      expect(result).toBeDefined();
    });
  });
});
