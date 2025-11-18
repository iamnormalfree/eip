const { repairDraft } = require('./orchestrator/repairer.ts');

async function debug() {
  const auditInput = {
    draft: 'Basic planning overview without structure or mechanism.',
    audit: {
      tags: [
        {
          tag: 'NO_MECHANISM',
          severity: 'error',
          section: 'mechanism',
          suggestion: 'Add mechanism section',
          auto_fixable: true,
          confidence: 0.8
        }
      ]
    }
  };

  console.log('Input:', JSON.stringify(auditInput, null, 2));
  
  try {
    const result = await repairDraft(auditInput);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

debug();
