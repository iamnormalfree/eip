// ABOUTME: Basic IP Validation Schema (Fallback for Enhanced Validator)
// ABOUTME: Provides basic structure validation for Educational IPs

export class IPSchemaRegistry {
  getSupportedTypes(): string[] {
    return ['framework', 'process', 'comparative', 'template', 'checklist', 'example'];
  }
  
  get(id: string) {
    const schemas = {
      framework: { name: 'Framework IP', description: 'Explains mechanisms: parts → interactions → outcome' },
      process: { name: 'Process IP', description: 'Step-by-step process with examples and guidance' },
      comparative: { name: 'Comparative IP', description: 'Compares multiple approaches or options' },
      template: { name: 'Template IP', description: 'Reusable template with structure and usage guidance' },
      checklist: { name: 'Checklist IP', description: 'Structured checklist for verification or validation' },
      example: { name: 'Example IP', description: 'Concrete example with context and analysis' }
    };
    return schemas[id as keyof typeof schemas];
  }
  
  validate(ip: any) {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!ip.id) errors.push('Missing required field: id');
    if (!ip.version) errors.push('Missing required field: version');
    if (!ip.purpose) errors.push('Missing required field: purpose');
    if (!ip.operators || !Array.isArray(ip.operators)) errors.push('Missing or invalid operators field');
    if (!ip.invariants || !Array.isArray(ip.invariants)) errors.push('Missing or invalid invariants field');
    if (!ip.sections || !Array.isArray(ip.sections)) errors.push('Missing or invalid sections field');

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      ipType: ip.id || 'unknown',
      version: ip.version || 'unknown'
    };
  }
}

export const ipSchemaRegistry = new IPSchemaRegistry();

