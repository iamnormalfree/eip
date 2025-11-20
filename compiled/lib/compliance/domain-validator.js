"use strict";
// ABOUTME: Domain Authority Validator for EIP Compliance System
// ABOUTME: Validates URLs against Singapore domain allow-lists with authority levels
// ABOUTME: Supports wildcard patterns and integration with policy loader
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainValidator = exports.AuthorityLevel = void 0;
exports.createSingaporeDomainValidator = createSingaporeDomainValidator;
exports.validateDomain = validateDomain;
const node_url_1 = require("node:url");
const logger_1 = require("../../orchestrator/logger");
const logger = (0, logger_1.getLogger)();
var AuthorityLevel;
(function (AuthorityLevel) {
    AuthorityLevel["HIGH"] = "high";
    AuthorityLevel["MEDIUM"] = "medium";
    AuthorityLevel["LOW"] = "low"; // General pattern match
})(AuthorityLevel || (exports.AuthorityLevel = AuthorityLevel = {}));
class DomainValidator {
    constructor(config) {
        this.rules = [];
        this.enableLogging = config.enableLogging ?? true;
        this.buildRules(config.allowListDomains, config.customRules);
    }
    /**
     * Build validation rules from domain list and custom rules
     */
    buildRules(allowListDomains, customRules) {
        this.rules = [];
        // Add rules from allow list domains
        for (const domain of allowListDomains) {
            const rule = this.createRuleFromDomain(domain);
            if (rule) {
                this.rules.push(rule);
            }
        }
        // Add custom rules
        if (customRules) {
            this.rules.push(...customRules);
        }
        // Sort by authority level (high first) then by pattern specificity
        this.rules.sort((a, b) => {
            const authorityOrder = {
                [AuthorityLevel.HIGH]: 0,
                [AuthorityLevel.MEDIUM]: 1,
                [AuthorityLevel.LOW]: 2
            };
            const authorityDiff = authorityOrder[a.authority] - authorityOrder[b.authority];
            if (authorityDiff !== 0)
                return authorityDiff;
            // More specific patterns (fewer wildcards) come first
            const aWildcards = (a.pattern.match(/\*/g) || []).length;
            const bWildcards = (b.pattern.match(/\*/g) || []).length;
            return aWildcards - bWildcards;
        });
        if (this.enableLogging) {
            logger.info('Domain validator initialized', {
                totalRules: this.rules.length,
                highAuthorityRules: this.rules.filter(r => r.authority === AuthorityLevel.HIGH).length,
                mediumAuthorityRules: this.rules.filter(r => r.authority === AuthorityLevel.MEDIUM).length,
                lowAuthorityRules: this.rules.filter(r => r.authority === AuthorityLevel.LOW).length
            });
        }
    }
    /**
     * Create a rule from a domain pattern
     */
    createRuleFromDomain(domain) {
        if (!domain || typeof domain !== 'string') {
            return null;
        }
        const cleanDomain = domain.trim().toLowerCase();
        // Determine authority level based on domain characteristics
        let authority;
        let pattern;
        // Exact domains (no wildcards) get high authority
        if (!cleanDomain.includes('*')) {
            authority = AuthorityLevel.HIGH;
            pattern = cleanDomain;
        }
        // Government domains get medium authority
        else if (cleanDomain.includes('*.gov') || cleanDomain.includes('*.mas') ||
            cleanDomain.includes('*.iras') || cleanDomain.includes('*.hdb')) {
            authority = AuthorityLevel.MEDIUM;
            pattern = cleanDomain;
        }
        // Banking domains get medium authority
        else if (cleanDomain.includes('*.bank') || cleanDomain.includes('*.banking')) {
            authority = AuthorityLevel.MEDIUM;
            pattern = cleanDomain;
        }
        // Wildcard patterns get low authority
        else {
            authority = AuthorityLevel.LOW;
            pattern = cleanDomain;
        }
        return {
            pattern,
            authority,
            description: `Domain rule for ${domain}`
        };
    }
    /**
     * Validate a single URL against the rules
     */
    validateUrl(url) {
        try {
            if (!url || typeof url !== 'string') {
                return {
                    isValid: false,
                    domain: '',
                    reason: 'Invalid URL: empty or not a string'
                };
            }
            // Parse URL to extract domain
            const urlObj = new node_url_1.URL(url.trim());
            const domain = urlObj.hostname.toLowerCase();
            // Try to match against rules (in order of priority)
            for (const rule of this.rules) {
                const match = this.matchDomain(domain, rule.pattern);
                if (match) {
                    if (this.enableLogging) {
                        logger.debug('URL validation passed', {
                            url,
                            domain,
                            matchedPattern: rule.pattern,
                            authority: rule.authority
                        });
                    }
                    return {
                        isValid: true,
                        domain,
                        authorityLevel: rule.authority,
                        matchedPattern: rule.pattern
                    };
                }
            }
            // No rules matched
            if (this.enableLogging) {
                logger.warn('URL validation failed - no matching rules', {
                    url,
                    domain,
                    availableRules: this.rules.map(r => r.pattern)
                });
            }
            return {
                isValid: false,
                domain,
                reason: `Domain ${domain} is not in the allow list`
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
            if (this.enableLogging) {
                logger.error('URL validation error', {
                    url,
                    error: errorMessage
                });
            }
            return {
                isValid: false,
                domain: '',
                reason: `Invalid URL format: ${errorMessage}`
            };
        }
    }
    /**
     * Validate multiple URLs (batch processing)
     */
    validateUrls(urls) {
        return urls.map(url => this.validateUrl(url));
    }
    /**
     * Check if a domain matches a pattern
     */
    matchDomain(domain, pattern) {
        // Exact match
        if (pattern === domain) {
            return true;
        }
        // Wildcard match
        if (pattern.includes('*')) {
            const regexPattern = pattern
                .replace(/\./g, '\\.') // Escape dots
                .replace(/\*/g, '.*'); // Convert wildcards to regex
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(domain);
        }
        return false;
    }
    /**
     * Get all loaded rules
     */
    getRules() {
        return [...this.rules];
    }
    /**
     * Get rules by authority level
     */
    getRulesByAuthority(level) {
        return this.rules.filter(rule => rule.authority === level);
    }
    /**
     * Add a custom rule
     */
    addRule(rule) {
        this.rules.push(rule);
        // Re-sort rules
        this.rules.sort((a, b) => {
            const authorityOrder = {
                [AuthorityLevel.HIGH]: 0,
                [AuthorityLevel.MEDIUM]: 1,
                [AuthorityLevel.LOW]: 2
            };
            const authorityDiff = authorityOrder[a.authority] - authorityOrder[b.authority];
            if (authorityDiff !== 0)
                return authorityDiff;
            const aWildcards = (a.pattern.match(/\*/g) || []).length;
            const bWildcards = (b.pattern.match(/\*/g) || []).length;
            return aWildcards - bWildcards;
        });
        if (this.enableLogging) {
            logger.info('Custom rule added', { pattern: rule.pattern, authority: rule.authority });
        }
    }
    /**
     * Remove a rule by pattern
     */
    removeRule(pattern) {
        const initialLength = this.rules.length;
        this.rules = this.rules.filter(rule => rule.pattern !== pattern);
        const removed = this.rules.length < initialLength;
        if (removed && this.enableLogging) {
            logger.info('Rule removed', { pattern });
        }
        return removed;
    }
    /**
     * Get validator statistics
     */
    getStats() {
        const rulesByAuthority = {
            [AuthorityLevel.HIGH]: 0,
            [AuthorityLevel.MEDIUM]: 0,
            [AuthorityLevel.LOW]: 0
        };
        for (const rule of this.rules) {
            rulesByAuthority[rule.authority]++;
        }
        return {
            totalRules: this.rules.length,
            rulesByAuthority,
            patterns: this.rules.map(r => r.pattern)
        };
    }
}
exports.DomainValidator = DomainValidator;
/**
 * Default Singapore-focused domain validator
 */
function createSingaporeDomainValidator() {
    const singaporeDomains = [
        // Government (exact matches - HIGH authority)
        'mas.gov.sg',
        'iras.gov.sg',
        'hdb.gov.sg',
        'gov.sg',
        // Singapore financial institutions
        'dbs.com.sg',
        'ocbc.com',
        'uob.com.sg',
        'posb.com.sg',
        // Educational institutions
        'nus.edu.sg',
        'ntu.edu.sg',
        'smu.edu.sg',
        'edu.sg',
        // Wildcard patterns for broader coverage
        '*.gov.sg', // Singapore government (MEDIUM authority)
        '*.mas.gov.sg', // MAS subdomains (MEDIUM authority)
        '*.iras.gov.sg', // IRAS subdomains (MEDIUM authority)
        '*.hdb.gov.sg', // HDB subdomains (MEDIUM authority)
        '*.bank', // Banking domains (MEDIUM authority)
        '*.edu.sg', // Singapore education (LOW authority)
    ];
    return new DomainValidator({
        allowListDomains: singaporeDomains,
        enableLogging: true
    });
}
/**
 * Legacy compatibility function for existing compliance system
 */
function validateDomain(url, allowListDomains) {
    const validator = new DomainValidator({
        allowListDomains,
        enableLogging: false
    });
    return validator.validateUrl(url);
}
