# Plan 06 Quick Start Checklist
**For developer with zero EIP context**

## ⏰ TIME ESTIMATE: 12-16 hours total

## 📋 PRE-WORK (15 minutes)
- [ ] Read `docs/eip/prd.md` - Find "Templates: Jinja JSON-LD & FAQ atom renderers" section
- [ ] Read `orchestrator/publisher.ts` - Current implementation structure
- [ ] Read `templates/article.jsonld.j2` - Existing template format
- [ ] Read `orchestrator/template-renderer.ts` - Template utilities
- [ ] Run `npm test` to confirm system works
- [ ] Read `docs/plans/active/06-publisher-and-templates-IMPLEMENTATION-GUIDE.md`

## 🔧 FILE LOCATIONS TO KNOW
```
Primary Files:
- orchestrator/publisher.ts     # ✅ EXISTS - modify this
- tests/orchestrator/jsonld.test.ts      # ❌ CREATE THIS
- tests/orchestrator/ledger.test.ts      # ❌ CREATE THIS
- tests/orchestrator/publisher.test.ts     # ✅ EXISTS - modify this

Reference Files:
- templates/article.jsonld.j2  # ✅ EXISTS - reference template structure
- templates/faq.jsonld.j2       # ✅ EXISTS - reference template structure
- orchestrator/template-renderer.ts # ✅ EXISTS - template rendering utilities
- docs/eip/prd.md               # Domain knowledge
```

## 🎯 EXACTLY WHAT TO DO

### **Day 1: Foundation (4-6 hours)**
1. **Run existing tests:** `npm test tests/orchestrator/publisher-minimal.test.ts`
2. **Create JSON-LD validation tests** in `tests/orchestrator/jsonld.test.ts`
3. **Create ledger validation tests** in `tests/orchestrator/ledger.test.ts`
4. **Commit:** "feat(publisher): JSON-LD and ledger validation tests"

### **Day 2: Implementation (6-8 hours)**
1. **Implement publishContent()** in `orchestrator/publisher.ts`
2. **Add helper functions** for extraction and MDX building
3. **Enhance publisher tests** in `tests/orchestrator/publisher.test.ts`
4. **Commit:** "feat(publisher): implement assembly logic for MDX + ledger + JSON-LD"

### **Day 3: Polish & Validation (2-4 hours)**
1. **Enhance templates** if needed (add retrieval integration)
2. **Add documentation comments** to publisher.ts
3. **Run integration tests:** `npm test tests/orchestrator/controller-integration.test.ts`
4. **Final commit:** "feat(plan-06): complete publisher and templates implementation"

## 🚨 CRITICAL REQUIREMENTS

### **JSON-LD Schema Requirements ONLY:**
```
Article schema: @context, @type, headline, dateCreated, author, mainEntityOfPage
FAQPage schema: @context, @type, mainEntity (ItemList with Question/Answer pairs)
```
**DO NOT** add schema.org fields that aren't in the existing templates.

### **Ledger Requirements (Must Include):**
```typescript
frontmatter = {
  ip_id: string,           // IP used (e.g., 'framework@1.0.0')
  invariants: string[],    // IP invariants satisfied
  tags: Array<{tag: string, severity: string}>, // Quality tags
  sources: Array<{id: string, type: string, confidence: number}>, // Evidence sources
  flags: Record<string, boolean>, // Processing flags
  created_at: string,
  correlation_id: string
}
```

### **Template-Driven Output:**
- **No LLM calls** for JSON-LD generation
- **Nunjucks/Jinja2** templates only
- **Deterministic output** - same input = same output
- **Schema validation** - must validate for Article/FAQPage

## ✅ SUCCESS METRICS
- [ ] Article template renders valid JSON-LD with retrieval sources
- [ ] FAQPage template renders valid JSON-LD
- [ ] Publisher returns MDX + complete ledger + JSON-LD
- [ ] All JSON-LD validates against schema.org
- [ ] Test coverage >85%
- [ ] Performance within budget limits

## 🆘 IF YOU GET STUCK
1. **Check with me before** implementing complex template logic
2. **Look at existing templates** in `templates/` directory
3. **Reference Schema.org docs** for JSON-LD vocabulary
4. **Run tests frequently** - catch template issues early
5. **Focus on templates** - don't over-engineer assembly logic

## 📞 READY TO START?
If you've read the implementation guide and this checklist, you're ready to begin with Task 1.

**Current status:** Plan 05 pending → Ready for Plan 06 🚀

## 🔍 QUICK REFERENCE

### **Publisher Output Structure:**
```typescript
interface PublishResult {
  mdx: string;           // Markdown with YAML frontmatter
  frontmatter: {         // Ledger metadata
    ip_id: string;
    invariants: string[];
    tags: Array<{tag: string, severity: string}>;
    sources: Array<{id: string, type: string, confidence: number}>;
    flags: Record<string, boolean>;
    created_at: string;
    correlation_id: string;
  };
  jsonld: string;         // JSON-LD structured data
}
```

### **Template Rendering Pattern:**
```typescript
const templateData = { frontmatter, ...metadata };
const jsonld = await templateRenderer.render('article.jsonld.j2', templateData);
```

**Starting Point:** Task 1 - Understand current publisher structure