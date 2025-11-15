// ABOUTME: Deterministic router for EIP IP selection with enhanced API
// ABOUTME: Maps persona/funnel to Educational IP with predictable logic and comprehensive routing

type RouterInput = { 
  persona?: string; 
  funnel?: string;
  brief?: string; // Optional brief for content-based routing
  query?: string; // Alternative to brief for query processing
  intent?: string; // Processing intent for better routing
  entities?: string[]; // Extracted entities for routing decisions
};

interface IPMapping {
  id: string;
  name: string;
  funnels: string[];
  personas: string[];
  keywords: string[];
  invariants: string[]; // IP invariants for compliance
  complexity_score: number;
  use_cases: string[];
}

// Router versioning and metadata
export const ROUTER_VERSION = '1.0.0';
export const ROUTER_LAST_UPDATED = '2025-11-15';

// Educational IP registry - deterministic mapping with invariants
const IP_REGISTRY: Record<string, IPMapping> = {
  'framework@1.0.0': {
    id: 'framework@1.0.0',
    name: 'Framework IP',
    funnels: ['mofu', 'mid', 'consideration'],
    personas: ['learner', 'professional'],
    keywords: ['framework', 'structure', 'methodology'],
    invariants: ['has_overview', 'has_mechanism', 'has_examples'],
    complexity_score: 0.7,
    use_cases: ['strategic_planning', 'process_design', 'systematic_approach']
  },
  'process@1.0.0': {
    id: 'process@1.0.0',
    name: 'Process IP',
    funnels: ['bofu', 'bottom', 'decision'],
    personas: ['decision_maker', 'manager'],
    keywords: ['process', 'workflow', 'step-by-step'],
    invariants: ['has_steps', 'has_timeline', 'has_requirements'],
    complexity_score: 0.5,
    use_cases: ['application_process', 'procedural_guidance', 'workflow']
  },
  'comparative@1.0.0': {
    id: 'comparative@1.0.0',
    name: 'Comparative IP',
    funnels: ['tofu', 'top', 'awareness'],
    personas: ['researcher', 'analyst'],
    keywords: ['comparison', 'versus', 'alternative'],
    invariants: ['has_options', 'has_criteria', 'has_recommendation'],
    complexity_score: 0.6,
    use_cases: ['option_comparison', 'decision_support', 'trade_analysis']
  },
  'checklist@1.0.0': {
    id: 'checklist@1.0.0',
    name: 'Checklist IP',
    funnels: ['bofu', 'bottom', 'decision'],
    personas: ['practitioner', 'implementer'],
    keywords: ['checklist', 'steps', 'action'],
    invariants: ['has_items', 'has_completion_criteria', 'has_validation'],
    complexity_score: 0.3,
    use_cases: ['implementation_check', 'validation', 'readiness_assessment']
  },
  'explanation@1.0.0': {
    id: 'explanation@1.0.0',
    name: 'Explanation IP',
    funnels: ['mofu', 'mid', 'consideration'],
    personas: ['learner', 'student'],
    keywords: ['explain', 'understand', 'learn'],
    invariants: ['has_concept', 'has_examples', 'has_clarification'],
    complexity_score: 0.4,
    use_cases: ['concept_explanation', 'learning_content', 'knowledge_transfer']
  }
};

/**
 * Primary routing API - routeToIP (adopted from test expectations)
 * Returns comprehensive routing information with confidence and reasoning
 */
export async function routeToIP(input: RouterInput): Promise<{
  selected_ip: string;
  confidence: number;
  reasoning: {
    primary_indicators: string[];
    complexity_match: number;
    scenario_fit: number;
    [key: string]: any;
  };
  alternatives: string[];
  invariants: string[]; // IP invariants for compliance
}> {
  // Handle null/undefined input gracefully
  if (!input) {
    input = {};
  }

  const funnel = (input.funnel || '').toLowerCase().trim();
  const persona = (input.persona || '').toLowerCase().trim();
  const brief = (input.brief || input.query || '').toLowerCase();
  
  console.log('Router: Determining IP for', { funnel, persona, brief_length: brief.length });

  let selectedIP = 'framework@1.0.0'; // Default fallback
  let confidence = 0.5;
  const reasoning: any = {
    primary_indicators: [],
    complexity_match: 0,
    scenario_fit: 0
  };
  const alternatives: string[] = [];

  // Primary routing by funnel
  if (funnel) {
    for (const [ipId, mapping] of Object.entries(IP_REGISTRY)) {
      if (mapping.funnels.includes(funnel)) {
        // Check persona compatibility if specified
        if (persona && mapping.personas.length > 0) {
          if (mapping.personas.includes(persona)) {
            selectedIP = ipId;
            confidence = 0.9;
            reasoning.primary_indicators.push(`funnel+persona: ${funnel}+${persona}`);
            reasoning.scenario_fit = 0.95;
            console.log('Router: Selected IP by funnel+persona:', ipId);
            break;
          }
        } else {
          selectedIP = ipId;
          confidence = 0.8;
          reasoning.primary_indicators.push(`funnel: ${funnel}`);
          reasoning.scenario_fit = 0.85;
          console.log('Router: Selected IP by funnel:', ipId);
          break;
        }
      }
    }
  }

  // Secondary routing by persona if no funnel match
  if (confidence < 0.8 && persona) {
    for (const [ipId, mapping] of Object.entries(IP_REGISTRY)) {
      if (mapping.personas.includes(persona)) {
        selectedIP = ipId;
        confidence = 0.7;
        reasoning.primary_indicators.push(`persona: ${persona}`);
        reasoning.scenario_fit = 0.75;
        console.log('Router: Selected IP by persona:', ipId);
        break;
      }
    }
  }

  // Tertiary routing by brief content keywords
  if (confidence < 0.8 && brief) {
    for (const [ipId, mapping] of Object.entries(IP_REGISTRY)) {
      for (const keyword of mapping.keywords) {
        if (brief.includes(keyword)) {
          if (confidence < 0.7) { // Only downgrade if we haven't found a good match
            selectedIP = ipId;
            confidence = 0.6;
            reasoning.primary_indicators.push(`keyword: ${keyword}`);
          }
          reasoning.scenario_fit = Math.max(reasoning.scenario_fit, 0.6);
          console.log('Router: Keyword match:', ipId, 'keyword:', keyword);
          break;
        }
      }
    }
  }

  // Calculate complexity match
  const ipMapping = IP_REGISTRY[selectedIP];
  reasoning.complexity_match = ipMapping.complexity_score;

  // Generate alternatives with lower confidence
  for (const [ipId, mapping] of Object.entries(IP_REGISTRY)) {
    if (ipId === selectedIP) continue;
    if (alternatives.length >= 3) break; // Limit to 3 alternatives
    
    let altScore = 0.1; // Base score
    
    if (funnel && mapping.funnels.includes(funnel)) altScore += 0.3;
    if (persona && mapping.personas.includes(persona)) altScore += 0.2;
    if (brief && mapping.keywords.some(k => brief.includes(k))) altScore += 0.2;
    
    if (altScore > 0.3) {
      alternatives.push(ipId);
    }
  }

  // Add intent-specific reasoning
  if (input.intent) {
    reasoning.processing_intent = input.intent;
    if (input.intent === 'planning_guidance' && selectedIP.includes('framework')) {
      confidence = Math.min(confidence + 0.1, 1.0);
      reasoning.primary_indicators.push('intent_planning_framework_match');
    }
    if (input.intent === 'procedural_guidance' && selectedIP.includes('process')) {
      confidence = Math.min(confidence + 0.1, 1.0);
      reasoning.primary_indicators.push('intent_procedural_process_match');
    }
    if (input.intent === 'comparison_analysis' && selectedIP.includes('comparative')) {
      confidence = Math.min(confidence + 0.1, 1.0);
      reasoning.primary_indicators.push('intent_comparison_match');
    }
  }

  // Add entity-based reasoning
  if (input.entities && input.entities.length > 0) {
    reasoning.entities = input.entities;
    if (input.entities.includes('compare') || input.entities.includes('versus')) {
      if (selectedIP.includes('comparative')) {
        confidence = Math.min(confidence + 0.05, 1.0);
        reasoning.primary_indicators.push('entity_comparison_match');
      }
    }
    if (input.entities.includes('step') || input.entities.includes('process')) {
      if (selectedIP.includes('process')) {
        confidence = Math.min(confidence + 0.05, 1.0);
        reasoning.primary_indicators.push('entity_process_match');
      }
    }
  }

  console.log('Router: Final selection', {
    ip: selectedIP,
    confidence,
    indicators: reasoning.primary_indicators,
    alternatives: alternatives.length
  });

  return {
    selected_ip: selectedIP,
    confidence,
    reasoning,
    alternatives,
    invariants: ipMapping.invariants
  };
}

/**
 * Legacy routeIP function for backward compatibility
 * Routes to IP using simple string return
 */
export function routeIP(input: RouterInput): string {
  // Handle null/undefined input gracefully
  if (!input) {
    input = {};
  }

  // Use the new routeToIP but return just the IP string for compatibility
  const funnel = (input.funnel || '').toLowerCase().trim();
  const persona = (input.persona || '').toLowerCase().trim();
  const brief = (input.brief || '').toLowerCase();
  
  console.log('Router: Determining IP for', { funnel, persona, brief_length: brief.length });

  // Primary routing by funnel
  if (funnel) {
    for (const [ipId, mapping] of Object.entries(IP_REGISTRY)) {
      if (mapping.funnels.includes(funnel)) {
        // Check persona compatibility if specified
        if (persona && mapping.personas.length > 0) {
          if (mapping.personas.includes(persona)) {
            console.log('Router: Selected IP by funnel+persona:', ipId);
            return ipId;
          }
        } else {
          console.log('Router: Selected IP by funnel:', ipId);
          return ipId;
        }
      }
    }
  }

  // Secondary routing by persona
  if (persona) {
    for (const [ipId, mapping] of Object.entries(IP_REGISTRY)) {
      if (mapping.personas.includes(persona)) {
        console.log('Router: Selected IP by persona:', ipId);
        return ipId;
      }
    }
  }

  // Tertiary routing by brief content keywords
  if (brief) {
    for (const [ipId, mapping] of Object.entries(IP_REGISTRY)) {
      for (const keyword of mapping.keywords) {
        if (brief.includes(keyword)) {
          console.log('Router: Selected IP by keyword match:', ipId, 'keyword:', keyword);
          return ipId;
        }
      }
    }
  }

  // Fallback to default framework IP
  const defaultIP = 'framework@1.0.0';
  console.log('Router: Using default IP:', defaultIP);
  return defaultIP;
}

// Additional function for multi-IP scenarios (future use)
export function routeIPs(input: RouterInput, maxResults: number = 3): Array<{ ip: string; confidence: number }> {
  const primaryIP = routeIP(input);
  const results = [{ ip: primaryIP, confidence: 1.0 }];
  
  // Add alternative IPs with lower confidence
  const funnel = (input.funnel || '').toLowerCase().trim();
  const persona = (input.persona || '').toLowerCase().trim();
  
  for (const [ipId, mapping] of Object.entries(IP_REGISTRY)) {
    if (ipId === primaryIP) continue;
    
    let confidence = 0.1; // Base confidence for all IPs
    
    // Boost confidence based on funnel match
    if (funnel && mapping.funnels.includes(funnel)) {
      confidence += 0.3;
    }
    
    // Boost confidence based on persona match
    if (persona && mapping.personas.includes(persona)) {
      confidence += 0.2;
    }
    
    if (confidence > 0.2) {
      results.push({ ip: ipId, confidence });
    }
  }
  
  // Sort by confidence and limit results
  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxResults);
}

// Function to validate IP exists in registry
export function validateIP(ipId: string): boolean {
  return ipId in IP_REGISTRY;
}

// Function to get IP metadata with invariants
export function getIPMetadata(ipId: string): IPMapping | null {
  return IP_REGISTRY[ipId] || null;
}

// Function to get IP invariants for compliance checking
export function getIPInvariants(ipId: string): string[] {
  const mapping = IP_REGISTRY[ipId];
  return mapping ? mapping.invariants : [];
}

/**
 * Get router metadata for versioning and change tracking
 */
export function getRouterMetadata() {
  return {
    version: ROUTER_VERSION,
    last_updated: ROUTER_LAST_UPDATED,
    available_ips: Object.keys(IP_REGISTRY),
    ip_count: Object.keys(IP_REGISTRY).length,
    supported_funnels: [...new Set(Object.values(IP_REGISTRY).flatMap(ip => ip.funnels))],
    supported_personas: [...new Set(Object.values(IP_REGISTRY).flatMap(ip => ip.personas))]
  };
}

// Export all available IPs for reference
export function listAvailableIPs(): IPMapping[] {
  return Object.values(IP_REGISTRY);
}
