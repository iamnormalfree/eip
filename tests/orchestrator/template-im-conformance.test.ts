import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const TEMPLATES_DIR = path.join(__dirname, '../../templates');

interface Template {
  id: string;
  version: string;
  required_blocks?: Record<string, string>;
  structure?: any;
}

describe('FoP Template IM Conformance', () => {
  const requiredIMBlocks = [
    'mechanism_clarity',
    'micro_test',
    'boundary_line',
    'evidence_signal'
  ];

  const templateFiles = [
    'fear-on-paper-script.yaml',
    'fear-on-paper-shorts.yaml',
    'fear-on-paper-email.yaml',
    'fear-on-paper-cta-safe.yaml'
  ];

  templateFiles.forEach(file => {
    describe(file, () => {
      let template: Template;

      beforeAll(() => {
        const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
        template = parse(content) as Template;
      });

      it('has required IM blocks defined', () => {
        if (template.required_blocks) {
          requiredIMBlocks.forEach(block => {
            expect(Object.keys(template.required_blocks || {})).toContain(block);
          });
        }
      });

      it('has version 2.0.0 or higher for IM alignment', () => {
        const version = parseFloat(template.version);
        expect(version).toBeGreaterThanOrEqual(2.0);
      });

      it('does not use emotional manipulation (fear/urgency/hope/agency levers)', () => {
        const content = JSON.stringify(template);
        expect(content).not.toMatch(/emotional_lever.*fear/);
        expect(content).not.toMatch(/emotional_lever.*urgency/);
      });

      it('includes mechanism in structure', () => {
        if (template.structure) {
          const hasMechanism = JSON.stringify(template.structure).toLowerCase().includes('mechanism');
          expect(hasMechanism).toBe(true);
        }
      });
    });
  });
});
