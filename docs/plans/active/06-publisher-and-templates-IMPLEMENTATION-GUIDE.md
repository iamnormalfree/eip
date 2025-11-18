# Plan 06 Implementation Guide - Publisher & Templates
**Developer assumes zero context** - Everything you need to know is documented here

## 🎯 GOAL

Create a publisher that generates publish-ready content with structured data and provenance:
- **Publisher**: Combines draft + ledger + JSON-LD into structured artifacts
- **Templates**: JSON-LD templates for Article and FAQPage schemas
- **Ledger**: Complete provenance trail with IP invariants, sources, and quality metrics

## 📚 REQUIRED READING (15 minutes max)

### **Context Files to Understand FIRST:**
1. `docs/eip/prd.md` - Read "Templates: Jinja JSON-LD & FAQ atom renderers" section
2. `orchestrator/publisher.ts` - Read entire file (current implementation structure)
3. `templates/article.jsonld.j2` - See existing template structure
4. `orchestrator/template-renderer.ts` - Understand template rendering system

### **Problem Domain:**
We need to transform raw generated content into structured web-ready artifacts. The publisher creates three outputs:
1. **MDX** - Content with frontmatter metadata (for web display)
2. **Ledger** - Complete provenance and quality information
3. **JSON-LD** - Structured data for search engines and AI systems

### **Key Constraints:**
- **No LLM schema invention** - Templates must be pre-defined
- **Deterministic output** - Same input always produces same JSON-LD
- **Schema compliance** - Must validate for Article and FAQPage
- **Template-driven** - JSON-LD rendered via Nunjucks/Jinja templates

## 🔧 TECHNICAL CONTEXT

### **Toolchain You'll Use:**
- **Nunjucks/Jinja2** - Template engine (already configured)
- **TemplateRenderer** - Existing utility class
- **Schema.org** - JSON-LD vocabulary (Article, FAQPage)
- **TypeScript** - Strong typing required

### **Current Code Structure:**
```
orchestrator/
├── publisher.ts     # ✅ EXISTS - needs assembly logic implementation
├── template-renderer.ts  # ✅ EXISTS - template rendering utilities
templates/
├── article.jsonld.j2   # ✅ EXISTS - Article schema template
├── faq.jsonld.j2        # ✅ EXISTS - FAQPage schema template
tests/
├── orchestrator/publisher.test.ts     # ✅ EXISTS - needs ledger/JSON-LD tests
├── orchestrator/jsonld.test.ts      # ❌ MISSING - create this
└── orchestrator/ledger.test.ts      # ❌ MISSING - create this
```

### **JSON-LD Schema Requirements:**

**Article Schema (Minimal Required Fields):**
```json
{
  "@context": "https://schema.org",
  "@type": ["Article", "EducationalContent"],
  "headline": "Article Title",
  "dateCreated": "2025-11-18",
  "author": {"@type": "Organization", "name": "EIP Content Runtime"},
  "mainEntityOfPage": {"@type": "WebPage", "@id": "#content"}
}
```

**FAQPage Schema (Minimal Required Fields):**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "Question",
        "name": "Question text",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Answer text"
        }
      }
    ]
  }
}
```

## 📋 IMPLEMENTATION PLAN (7 Bite-Sized Tasks)

### **Task 1: Understand Current Publisher Structure (1 hour)**
**Files to Read:**
- `orchestrator/publisher.ts` - entire file
- `tests/orchestrator/publisher-minimal.test.ts` - existing tests
- `orchestrator/template-renderer.ts` - template utilities

**What You'll See:**
- Basic TypeScript interfaces already defined
- TemplateRenderer integration exists
- Mock implementation for testing
- Integration point in controller.ts

**Deliverable:** Run existing tests to confirm they pass
```bash
npm test tests/orchestrator/publisher-minimal.test.ts
```

### **Task 2: Create JSON-LD Validation Tests (2 hours)**
**File to Create:** `tests/orchestrator/jsonld.test.ts`

**Test Pattern:**
```typescript
describe('JSON-LD Template Validation', () => {
  it('should generate valid Article schema from template', async () => {
    const templateData = {
      frontmatter: {
        title: 'Test Article',
        created_at: '2025-11-18T10:00:00Z',
        ip_pattern: 'framework@1.0.0',
        tier: 'MEDIUM'
      }
    };

    const result = await templateRenderer.render('article.jsonld.j2', templateData);
    const parsed = JSON.parse(result);

    // Validate required Article fields
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toContain('Article');
    expect(parsed.headline).toBe('Test Article');
    expect(parsed.author.name).toBe('EIP Content Runtime');
  });

  // Similar tests for FAQPage template...
});
```

### **Task 3: Create Ledger Validation Tests (2 hours)**
**File to Create:** `tests/orchestrator/ledger.test.ts`

**Ledger Requirements (from PRD):**
```typescript
interface PublishResult {
  mdx: string;           // MDX content with frontmatter
  frontmatter: {         // YAML frontmatter metadata
    ip_id: string;       // IP used (e.g., 'framework@1.0.0')
    invariants: string[]; // IP invariants satisfied
    tags: Array<{tag: string, severity: string}>; // Quality tags
    sources: Array<{id: string, type: string, confidence: number}>; // Evidence sources
    flags: Record<string, boolean>; // Processing flags
    created_at: string;
    correlation_id: string;
    // ... other metadata
  };
  jsonld: string;         // JSON-LD structured data
}
```

**Test Pattern:**
```typescript
describe('PublishResult Structure Validation', () => {
  it('should include all required ledger fields', async () => {
    const input = {
      draft: '# Test Content\nThis is test content.',
      ip: 'framework@1.0.0',
      audit: { tags: [] },
      retrieval: { flags: {} },
      metadata: { correlation_id: 'test-123' }
    };

    const result = await publishContent(input);

    // Validate frontmatter (ledger)
    expect(result.frontmatter.ip_id).toBe('framework@1.0.0');
    expect(result.frontmatter.invariants).toBeDefined();
    expect(result.frontmatter.tags).toBeDefined();
    expect(result.frontmatter.correlation_id).toBe('test-123');
    expect(result.frontmatter.created_at).toBeDefined();

    // Validate JSON-LD
    expect(typeof result.jsonld).toBe('string');
    const parsed = JSON.parse(result.jsonld);
    expect(parsed['@context']).toBe('https://schema.org');
  });
});
```

### **Task 4: Implement Publisher Assembly Logic (3 hours)**
**File to Touch:** `orchestrator/publisher.ts`

**Core Algorithm:**
```typescript
async function publishContent(input: PublishInput): Promise<PublishResult> {
  // 1. Get IP invariants
  const ipInvariants = await getIPInvariants(input.ip);

  // 2. Build frontmatter (ledger)
  const frontmatter = {
    ip_id: input.ip,
    invariants: ipInvariants,
    tags: input.audit.tags,
    sources: extractSources(input.retrieval),
    flags: input.retrieval.flags,
    // ... metadata from input.metadata
  };

  // 3. Build MDX content
  const mdx = buildMDX(input.draft, frontmatter);

  // 4. Render JSON-LD using templates
  const templateData = { frontmatter, ...input.metadata };
  const jsonld = await templateRenderer.render(
    frontmatter.content_type === 'faq' ? 'faq.jsonld.j2' : 'article.jsonld.j2',
    templateData
  );

  return { mdx, frontmatter, jsonld };
}

// Helper functions to implement:
function extractSources(retrieval): Array<{id: string, type: string, confidence: number}> {
  // Extract source information from retrieval results
  if (retrieval.candidates?.length > 0) {
    return retrieval.candidates.map((candidate, index) => ({
      id: candidate.id || `source_${index}`,
      type: candidate.type || 'unknown',
      confidence: candidate.confidence || 0.8
    }));
  }
  return [];
}

function buildMDX(draft: string, frontmatter: object): string {
  // Convert frontmatter to YAML and prepend to draft
  const yaml = `---
${Object.entries(frontmatter)
  .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
  .join('\n')}
---`;

  return `${yaml}\n\n${draft}`;
}
```

### **Task 5: Enhance Publisher Tests (2 hours)**
**File to Touch:** `tests/orchestrator/publisher.test.ts`

**Integration Tests:**
```typescript
describe('Publisher Integration Tests', () => {
  it('should assemble complete publish result with all components', async () => {
    const input = {
      draft: '# Framework Guide\nThis explains mechanisms.',
      ip: 'framework@1.0.0',
      audit: {
        tags: [{ tag: 'HIGH_QUALITY', severity: 'info' }],
        overall_score: 95
      },
      retrieval: {
        flags: { has_edu_source: true, graph_sparse: false },
        candidates: [{ id: 'source1', confidence: 0.9, type: 'educational' }]
      },
      metadata: {
        persona: 'student',
        funnel: 'awareness',
        tier: 'LIGHT',
        correlation_id: 'test-456'
      }
    };

    const result = await publishContent(input);

    // Verify MDX structure
    expect(result.mdx).toContain('---'); // YAML frontmatter
    expect(result.mdx).toContain('ip_id: framework@1.0.0');
    expect(result.mdx).toContain('# Framework Guide');

    // Verify JSON-LD structure
    const parsed = JSON.parse(result.jsonld);
    expect(parsed['@type']).toContain('Article');
    expect(parsed.provenance).toBeDefined();

    // Verify ledger completeness
    expect(result.frontmatter.invariants).toHaveLength(3); // Framework has 3 invariants
    expect(result.frontmatter.sources).toHaveLength(1);
  });
});
```

### **Task 6: Template Enhancement (1 hour)**
**Files to Touch:** `templates/article.jsonld.j2`, `templates/faq.jsonld.j2`

**Enhancements to Add:**
- Better date formatting
- Source references from retrieval
- Quality metrics from audit
- Audience targeting from metadata
- Funnel information if available

**Template Pattern:**
```nunjucks
{# Enhanced article template with retrieval integration #}
{
  "@context": "https://schema.org",
  "@type": ["Article", "EducationalContent"],
  "headline": "{{ frontmatter.title | default('Generated Article') }}",
  "dateCreated": "{{ frontmatter.created_at | default('' | now) | isoformat }}",

  {# Enhanced provenance with quality metrics #}
  "provenance": {
    "@type": "ProvenanceStatement",
    "wasGeneratedBy": {
      "@type": "SoftwareApplication",
      "name": "EIP Orchestrator"
    },
    "usedIP": "{{ frontmatter.ip_id }}",
    "qualityScore": {{ frontmatter.audit_score | default(75) }}
  },

  {# Sources from retrieval if available #}
  {% if frontmatter.sources_count > 0 %}
  "citation": [
    {% for source in frontmatter.sources %}
    {
      "@type": "CreativeWork",
      "name": "{{ source.id }}",
      "identifier": "{{ source.id }}",
      "confidence": {{ source.confidence }}
    }{% if not loop.last %},{% endif %}
    {% endfor %}
  ],
  {% endif %}
}
```

### **Task 7: Documentation & Validation (1 hour)**
**Files to Touch:** `orchestrator/publisher.ts` (comments)

**Tasks:**
- Add inline comments explaining template selection logic
- Document ledger field requirements
- Add function documentation
- Run final integration tests:
```bash
npm test tests/orchestrator/publisher*.test.ts
npm test tests/orchestrator/controller-integration.test.ts
```

## 🧪 TESTING STRATEGY (IMPORTANT)

### **Test-Driven Development (TDD) Approach:**
1. **Write test FIRST** for template validation
2. **Write test FIRST** for ledger structure
3. **Implement minimal code** to make tests pass
4. **Refactor** while keeping tests green
5. **Commit** after each working feature

### **Good Test Design:**
```typescript
// ✅ GOOD - Specific, tests real scenario, clear validation
it('should generate valid Article JSON-LD with retrieval sources', async () => {
  const input = { /* real input */ };
  const result = await publishContent(input);

  const parsed = JSON.parse(result.jsonld);
  expect(parsed.citation).toHaveLength(2);
  expect(parsed.citation[0].confidence).toBeGreaterThan(0.8);
});

// ❌ BAD - Vague, tests implementation details
it('should work correctly' () => {
  // Tests nothing specific about publisher requirements
});
```

### **Test Coverage Requirements:**
- Article JSON-LD template validation
- FAQPage JSON-LD template validation
- Frontmatter ledger completeness
- Integration with template renderer
- Error handling for missing data
- Performance within budget limits

## 🚨 FREQUENT COMMITS STRATEGY

Commit after each working task:
```bash
git add orchestrator/publisher.ts tests/orchestrator/publisher.test.ts
git commit -m "feat(publisher): implement assembly logic for MDX + ledger + JSON-LD

- ✅ MDX generation with YAML frontmatter
- ✅ Complete ledger with IP invariants and sources
- ✅ JSON-LD rendering via article/faq templates
- ✅ Template integration validation
- 🚀 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 🔧 HELPER FUNCTIONS TO USE

### **Template Rendering:**
```typescript
// Use existing template renderer
import { templateRenderer } from './template-renderer';

const jsonld = await templateRenderer.render('article.jsonld.j2', templateData);
```

### **IP Invariant Extraction:**
```typescript
// Use existing router utilities
import { getIPInvariants } from './router';

const invariants = await getIPInvariants('framework@1.0.0');
// Returns: ["Must include a Mechanism section", "Must include a Counterexample section", "Must include a Transfer section"]
```

### **JSON Validation:**
```typescript
// Simple JSON-LD validation
function validateJSONLD(jsonString: string): ValidationResult {
  try {
    const parsed = JSON.parse(jsonString);

    // Check required fields
    const required = ['@context', '@type'];
    for (const field of required) {
      if (!parsed[field]) {
        return { valid: false, errors: [`Missing required field: ${field}`] };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, errors: [`Invalid JSON: ${error.message}`] };
  }
}
```

## ⚠️ COMMON PITFALLS TO AVOID

1. **Template invention** - Don't create new JSON-LD fields, use existing templates
2. **Non-deterministic output** - Same input must always produce same output
3. **Missing schema validation** - JSON-LD must validate for Article/FAQPage
4. **Incomplete ledger** - Must include IP invariants, sources, and quality metrics
5. **Poor error handling** - Handle missing retrieval or audit data gracefully
6. **Performance issues** - Templates should render quickly within budget

## 🆘 GETTING HELP

If you're unsure about anything:
1. **Check with me before** implementing complex template logic
2. **Look at existing templates** in `templates/` directory
3. **Reference Schema.org docs** for JSON-LD vocabulary
4. **Run tests frequently** - catch template issues early
5. **Keep it simple** - YAGNI principle applies

## ✅ SUCCESS CRITERIA

You're done when:
- [ ] Article and FAQPage templates render valid JSON-LD
- [ ] Publisher returns complete PublishResult with MDX, ledger, and JSON-LD
- [ ] All tests pass (>85% coverage)
- [ ] Integration with controller works
- [ ] No performance budget overruns
- [ ] Templates are deterministic

**Estimated Time:** 12-16 hours total
**Next Step:** Move to Plan 07 (Compliance & Evidence)

---

*Remember: DRY, YAGNI, TDD, frequent commits. You're building structured content publishing, not rewriting the system.*