// YAML budget loader with Zod validation
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';

const BudgetConfigSchema = z.object({
  budgets: z.record(z.enum(['LIGHT', 'MEDIUM', 'HEAVY']), z.object({
    retrieval: z.number().positive(),
    planner: z.number().positive(),
    generator: z.number().positive(),
    auditor: z.number().positive(),
    repairer: z.number().positive(),
    review: z.number().optional(),
    wallclock_s: z.number().positive()
  }))
});

export function loadBudgetsFromYAML() {
  try {
    const yaml = require('js-yaml');
    const configPath = join(__dirname, 'budgets.yaml');
    const yamlContent = readFileSync(configPath, 'utf8');
    const rawConfig = yaml.load(yamlContent);
    const validatedConfig = BudgetConfigSchema.parse(rawConfig);
    return validatedConfig.budgets;
  } catch (error) {
    console.error('Failed to load budgets from YAML, falling back to defaults:', error);
    // Fallback to hardcoded budgets
    return {
      LIGHT: {
        retrieval: 200,
        generator: 1400,
        wallclock_s: 20
      },
      MEDIUM: {
        retrieval: 400,
        planner: 1000,
        generator: 2400,
        auditor: 700,
        repairer: 600,
        wallclock_s: 45
      },
      HEAVY: {
        retrieval: 600,
        planner: 1400,
        generator: 4000,
        auditor: 1100,
        repairer: 1000,
        review: 300,
        wallclock_s: 90
      }
    };
  }
}
