// Simplified domain validator for testing
const { URL } = require('url');

const AuthorityLevel = {
  HIGH: 'high',
  MEDIUM: 'medium', 
  LOW: 'low'
};

class DomainValidator {
  constructor(config) {
    this.rules = [];
    this.buildRules(config.allowListDomains, config.customRules);
  }

  buildRules(allowListDomains, customRules) {
    this.rules = [];

    for (const domain of allowListDomains) {
      const rule = this.createRuleFromDomain(domain);
      if (rule) {
        this.rules.push(rule);
      }
    }

    if (customRules) {
      this.rules.push(...customRules);
    }

    // Sort by authority level
    this.rules.sort((a, b) => {
      const authorityOrder = {
        [AuthorityLevel.HIGH]: 0,
        [AuthorityLevel.MEDIUM]: 1,
        [AuthorityLevel.LOW]: 2
      };
      
      const authorityDiff = authorityOrder[a.authority] - authorityOrder[b.authority];
      if (authorityDiff !== 0) return authorityDiff;
      
      const aWildcards = (a.pattern.match(/\*/g) || []).length;
      const bWildcards = (b.pattern.match(/\*/g) || []).length;
      return aWildcards - bWildcards;
    });
  }

  createRuleFromDomain(domain) {
    if (!domain || typeof domain !== 'string') {
      return null;
    }

    const cleanDomain = domain.trim().toLowerCase();
    let authority;
    let pattern;

    if (!cleanDomain.includes('*')) {
      authority = AuthorityLevel.HIGH;
      pattern = cleanDomain;
    } else if (cleanDomain.includes('*.gov') || cleanDomain.includes('*.mas') || 
               cleanDomain.includes('*.iras') || cleanDomain.includes('*.hdb')) {
      authority = AuthorityLevel.MEDIUM;
      pattern = cleanDomain;
    } else if (cleanDomain.includes('*.bank') || cleanDomain.includes('*.banking')) {
      authority = AuthorityLevel.MEDIUM;
      pattern = cleanDomain;
    } else {
      authority = AuthorityLevel.LOW;
      pattern = cleanDomain;
    }

    return {
      pattern,
      authority,
      description: `Domain rule for ${domain}`
    };
  }

  validateUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        return {
          isValid: false,
          domain: '',
          reason: 'Invalid URL: empty or not a string'
        };
      }

      const urlObj = new URL(url.trim());
      const domain = urlObj.hostname.toLowerCase();

      for (const rule of this.rules) {
        const match = this.matchDomain(domain, rule.pattern);
        if (match) {
          return {
            isValid: true,
            domain,
            authorityLevel: rule.authority,
            matchedPattern: rule.pattern
          };
        }
      }

      return {
        isValid: false,
        domain,
        reason: `Domain ${domain} is not in the allow list`
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      
      return {
        isValid: false,
        domain: '',
        reason: `Invalid URL format: ${errorMessage}`
      };
    }
  }

  matchDomain(domain, pattern) {
    if (pattern === domain) {
      return true;
    }

    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(domain);
    }

    return false;
  }
}

function createSingaporeDomainValidator() {
  const singaporeDomains = [
    'mas.gov.sg',
    'iras.gov.sg', 
    'hdb.gov.sg',
    'gov.sg',
    'dbs.com.sg',
    'ocbc.com',
    'uob.com.sg',
    'posb.com.sg',
    'nus.edu.sg',
    'ntu.edu.sg',
    'smu.edu.sg',
    'edu.sg',
    '*.gov.sg',
    '*.mas.gov.sg',
    '*.iras.gov.sg',
    '*.hdb.gov.sg',
    '*.bank',
    '*.edu.sg'
  ];

  return new DomainValidator({
    allowListDomains: singaporeDomains
  });
}

// Test the implementation
console.log('Testing Domain Validator...');

try {
  const validator = new DomainValidator({
    allowListDomains: ['mas.gov.sg', '*.gov.sg', 'test.com'],
    enableLogging: false
  });

  console.log('✅ Domain validator created successfully');

  const testUrls = [
    'https://mas.gov.sg/regulations',
    'https://agency.gov.sg/info', 
    'https://untrusted.com/page',
    'not-a-valid-url'
  ];

  testUrls.forEach(url => {
    const result = validator.validateUrl(url);
    const status = result.isValid ? 'Valid' : 'Invalid';
    const details = result.reason || result.authorityLevel || 'No reason';
    console.log('🔍 ' + url + ': ' + status + ' (' + details + ')');
  });

  const sgValidator = createSingaporeDomainValidator();
  const sgResult = sgValidator.validateUrl('https://mas.gov.sg/regulations');
  const sgStatus = sgResult.isValid ? 'Valid' : 'Invalid';
  console.log('🇸🇬 Singapore validator test: ' + sgStatus);

  console.log('🎉 Domain validator tests completed successfully!');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
