# Plan 08 — Production Review UI and Quality Feedback System

## CONTEXT (Zero-Context Developer Read This First)

### What This System Does
EIP (Educational-IP Content Runtime) is an AI-powered content generation system for regulated industries. We generate educational/financial content that must pass strict quality, compliance, and regulatory checks before human reviewers can approve it for publication.

### What You're Building
A **human review interface** where quality reviewers can:
- View AI-generated content drafts (MDX format)
- See quality audit results (10 critical tags from micro-auditor)
- Check compliance status (MAS/IRAS regulatory rules)
- Inspect evidence sources and citations
- Approve/reject with structured feedback
- Update brand DNA based on review decisions

### Why This Matters
This is the **critical human feedback loop** that makes our AI system trustworthy and compliant. Without this, we can't scale content production while maintaining quality standards required for financial/educational content.

---

## PREREQUISITES (Before You Start)

### Required Knowledge
- **TypeScript/Next.js**: This is a Next.js app with TypeScript
- **React Server Components**: The review page is a server component that fetches data
- **Tailwind CSS**: All styling uses Tailwind utility classes
- **Supabase**: Our database (PostgreSQL) with TypeScript types
- **MDX**: Markdown with JSX - our content format

### Environment Setup
```bash
# Install dependencies
npm install

# Environment variables required (check .env.local):
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # For admin operations

# Start development servers
npm run dev          # Review UI at http://localhost:3000
npm run orchestrator:dev  # Content generation pipeline
```

### Key Dependencies We Use
- `@supabase/supabase-js`: Database client
- `@mdx-js/react`: MDX rendering
- `tailwindcss`: Styling
- `@types/react`: TypeScript types
- `zod`: Schema validation

---

## DATABASE STRUCTURE YOU NEED TO KNOW

### Main Tables You'll Query
```sql
-- eip_artifacts: Generated content pieces
CREATE TABLE eip_artifacts (
  id uuid PRIMARY KEY,
  status text NOT NULL, -- 'draft', 'approved', 'rejected'
  persona text,         -- Target audience
  funnel text,          -- Customer journey stage
  title text,           -- Content title
  mdx_content text,     -- Generated content (MDX format)
  ledger jsonb,         -- Quality audit results
  json_ld jsonb,        -- Structured data for SEO
  compliance_report jsonb, -- Regulatory compliance check
  created_at timestamptz,
  updated_at timestamptz
);

-- brand_profiles: Quality standards and reviewer feedback
CREATE TABLE brand_profiles (
  id uuid PRIMARY KEY,
  voice_profile jsonb,  -- Brand voice characteristics
  rubric_scores jsonb,  -- Reviewer evaluation scores
  feedback_history jsonb, -- Accumulated reviewer insights
  updated_at timestamptz
);
```

### TypeScript Types
All database types are auto-generated in `lib_supabase/db/types/database.types.ts`. You'll use these for type safety.

---

## CURRENT CODEBASE STATE

### What Already Exists
- ✅ Basic review page scaffold at `src/app/review/page.tsx`
- ✅ Review components in `src/components/review/`
- ✅ Supabase client connection patterns
- ✅ Database schema and types
- ✅ Test infrastructure with Jest

### What You're Completing
- ❌ **Missing:** Rich content preview with MDX rendering
- ❌ **Missing:** Interactive quality tag display
- ❌ **Missing:** Compliance report integration
- ❌ **Missing:** Approve/reject workflow with feedback
- ❌ **Missing:** Brand DNA update functionality
- ❌ **Missing:** Review analytics

---

## CLAUDE SESSION BREAKDOWN (Context-Aware Task Chunks)

### 🎯 How to Use This Guide
Each session below is designed for a **single Claude context window** (~200K tokens limit). Complete one session fully before starting the next. Each session includes:

- **Time estimate**: 1-2 hours of focused development
- **Files to touch**: Specific file paths for implementation
- **Dependencies**: What you need before starting
- **Success criteria**: How to verify completion

---

## SESSION 1: Foundation Components (2 hours)

### 🎯 Session Focus
Build the core display components that reviewers will interact with most frequently.

### 📋 Tasks in This Session

#### Task 1.1: Rich Content Preview Component
**Files to touch:**
- `src/components/review/ArtifactContentPreview.tsx` (create)
- `tests/ui/ArtifactContentPreview.test.tsx` (create)
- `package.json` (add dependencies)

**Dependencies:**
- Existing Supabase client patterns from `lib_supabase/db/supabase-client.ts`
- MDX parsing knowledge

**Steps:**
1. **Install dependencies:**
   ```bash
   npm install @mdx-js/react react-syntax-highlighter
   npm install -D @types/react-syntax-highlighter
   ```

2. **Test first** - Create `tests/ui/ArtifactContentPreview.test.tsx`:
   ```tsx
   // Test: Renders MDX content properly
   // Test: Handles code blocks with syntax highlighting
   // Test: Shows frontmatter metadata
   // Test: Gracefully handles malformed MDX
   ```

3. **Implementation** - Component should:
   - Accept `mdxContent: string` prop
   - Parse frontmatter from MDX
   - Render content with proper typography
   - Highlight code blocks using `react-syntax-highlighter`
   - Handle parse errors gracefully

**Success criteria:** Tests pass, component renders MDX properly with syntax highlighting.

#### Task 1.2: Quality Tags Display Component
**Files to touch:**
- `src/components/review/QualityTagsDisplay.tsx` (create)
- `tests/ui/QualityTagsDisplay.test.tsx` (create)

**Dependencies:**
- Micro-auditor tag definitions from Plan 05
- Understanding of the 10 critical tags

**Steps:**
1. **Test first** - Create `tests/ui/QualityTagsDisplay.test.tsx`:
   ```tsx
   // Test: Displays critical tags with severity levels
   // Test: Shows tag rationales and span hints
   // Test: Handles missing/empty ledger gracefully
   ```

2. **Implementation:**
   - Accept `ledger: any` prop from artifact.ledger
   - Parse the 10 critical tags: NO_MECHANISM, NO_COUNTEREXAMPLE, NO_TRANSFER, EVIDENCE_HOLE, LAW_MISSTATE, DOMAIN_MIXING, CONTEXT_DEGRADED, CTA_MISMATCH, ORPHAN_CLAIM, SCHEMA_MISSING
   - Color-code by severity (red=critical, orange=warning)
   - Expandable details showing rationale

**Success criteria:** Tags display correctly with proper severity indicators and expandable details.

### ✅ Session Complete When:
- Both components have passing tests
- Components render with mock data
- No console errors
- Code follows existing patterns

---

## SESSION 2: Compliance and Basic Workflow (2 hours)

### 🎯 Session Focus
Build compliance display and basic review action functionality.

### 📋 Tasks in This Session

#### Task 2.1: Compliance Status Display Component
**Files to touch:**
- `src/components/review/ComplianceStatusDisplay.tsx` (create)
- `tests/ui/ComplianceStatusDisplay.test.tsx` (create)

**Dependencies:**
- Compliance system from Plan 07
- Understanding of MAS/IRAS regulatory rules

**Steps:**
1. **Test first** - Create `tests/ui/ComplianceStatusDisplay.test.tsx`:
   ```tsx
   // Test: Shows compliance status (pass/fail/warning)
   // Test: Displays domain authority validation results
   // Test: Shows evidence freshness check results
   // Test: Handles missing compliance report gracefully
   ```

2. **Implementation:**
   - Accept `complianceReport: any` prop
   - Show overall compliance status with clear visual indicators
   - Display specific checks: domain authority, evidence freshness
   - Link to source URLs for evidence verification

**Success criteria:** Compliance status displays correctly with working links.

#### Task 2.2: Basic Review Actions Component
**Files to touch:**
- `src/components/review/ReviewActions.tsx` (create)
- `tests/ui/ReviewActions.test.tsx` (create)

**Dependencies:**
- Supabase update patterns
- Form validation patterns

**Steps:**
1. **Test first** - Create `tests/ui/ReviewActions.test.tsx`:
   ```tsx
   // Test: Shows approve/reject buttons
   // Test: Reject button opens feedback form
   // Test: Approve requires confirmation
   // Test: Form validation works
   ```

2. **Implementation:**
   - Approve button with confirmation dialog
   - Reject button with feedback form (required: reason, severity)
   - Rubric scoring: tone (1-5), novelty (1-5), strategic_alignment (1-5)
   - Submit button with loading states

**Success criteria:** Actions work, forms validate, loading states show properly.

### ✅ Session Complete When:
- Compliance component shows status correctly
- Review actions have working forms
- All tests pass
- Components integrate with mock data

---

## SESSION 3: Brand DNA and Detail Page (2 hours)

### 🎯 Session Focus
Build the brand DNA update logic and combine all components into a detailed review page.

### 📋 Tasks in This Session

#### Task 3.1: Brand DNA Update Service
**Files to touch:**
- `src/lib/brand-dna-updater.ts` (create)
- `tests/lib/brand-dna-updater.test.ts` (create)

**Dependencies:**
- Supabase admin client patterns
- Brand profile database schema

**Steps:**
1. **Test first** - Create `tests/lib/brand-dna-updater.test.ts`:
   ```tsx
   // Test: Updates rubric scores correctly
   // Test: Appends feedback to history
   // Test: Calculates new voice profile averages
   // Test: Validates score ranges
   ```

2. **Implementation:**
   ```typescript
   export async function updateBrandDNA(brandProfileId: string, reviewData: {
     rubricScores: { tone: number; novelty: number; strategic_alignment: number; compliance_risk: string };
     feedback: string;
     artifactId: string;
   }) {
     // Fetch current brand profile
     // Update rubric scores with weighted averaging
     // Append feedback to history with timestamp
     // Save updated profile to database
   }
   ```

**Success criteria:** Brand DNA updates correctly, tests pass, handles concurrent updates.

#### Task 3.2: Review Detail Page
**Files to touch:**
- `src/app/review/[id]/page.tsx` (create)
- `src/components/review/ArtifactHeader.tsx` (create)
- `tests/ui/review-detail-page.test.tsx` (create)

**Dependencies:**
- All previous session components
- Next.js dynamic routing patterns
- Server component data fetching

**Steps:**
1. **Test first** - Create `tests/ui/review-detail-page.test.tsx`:
   ```tsx
   // Test: Renders artifact with all components
   // Test: Shows 404 for non-existent artifact
   // Test: Loads data server-side correctly
   ```

2. **Implementation:**
   ```tsx
   // Server component to fetch single artifact
   export default async function ReviewArtifactPage({ params }: { params: { id: string } }) {
     const artifact = await fetchArtifact(params.id);

     return (
       <div className="review-detail">
         <ArtifactHeader artifact={artifact} />
         <div className="content-grid">
           <ArtifactContentPreview mdxContent={artifact.mdx_content} />
           <div className="sidebar">
             <QualityTagsDisplay ledger={artifact.ledger} />
             <ComplianceStatusDisplay complianceReport={artifact.compliance_report} />
             <ReviewActions artifactId={artifact.id} />
           </div>
         </div>
       </div>
     );
   }
   ```

**Success criteria:** Detail page loads, shows all components, handles 404s gracefully.

### ✅ Session Complete When:
- Brand DNA updates work end-to-end
- Detail page combines all components
- Navigation from list to detail works
- All integration tests pass

---

## SESSION 4: Enhanced Review List and Analytics (2 hours)

### 🎯 Session Focus
Improve the main review queue and add analytics dashboard.

### 📋 Tasks in This Session

#### Task 4.1: Enhanced Review List
**Files to touch:**
- `src/components/review/ReviewArtifactList.tsx` (modify)
- `src/components/review/ReviewArtifactCard.tsx` (modify)
- `tests/ui/ReviewArtifactList.test.tsx` (update)

**Dependencies:**
- Existing list components
- Search and filter patterns

**Steps:**
1. **Update tests** in `tests/ui/ReviewArtifactList.test.tsx`:
   ```tsx
   // Test: Filters by persona and funnel
   // Test: Search by title and content
   // Test: Sorts by date and priority
   // Test: Shows quality status indicators
   ```

2. **Implementation:**
   - Add search input for title/content search
   - Add filters for persona, funnel, creation date range
   - Show quality indicators (critical tag count, compliance status)
   - Add pagination for large lists

**Success criteria:** Search and filtering work, performance acceptable with many artifacts.

#### Task 4.2: Review Analytics Dashboard
**Files to touch:**
- `src/components/review/ReviewAnalytics.tsx` (create)
- `tests/ui/ReviewAnalytics.test.tsx` (create)

**Dependencies:**
- Chart library (recharts or CSS-based)
- Aggregation query patterns

**Steps:**
1. **Test first** - Create `tests/ui/ReviewAnalytics.test.tsx`:
   ```tsx
   // Test: Shows review queue metrics
   // Test: Displays approval/rejection rates
   // Test: Shows average review time
   // Test: Displays quality trend charts
   ```

2. **Implementation:**
   - Queue metrics: total pending, average wait time
   - Quality metrics: tag resolution rates, compliance pass rates
   - Reviewer metrics: approval rates, average review time
   - Simple charts using CSS-based visualizations

**Success criteria:** Analytics show useful metrics, render efficiently, export works.

### ✅ Session Complete When:
- Review list has search/filter functionality
- Analytics dashboard shows meaningful metrics
- Performance acceptable with large datasets
- All components integrate properly

---

## SESSION 5: Integration Testing and Polish (2 hours)

### 🎯 Session Focus
Complete testing, error handling, and performance optimization.

### 📋 Tasks in This Session

#### Task 5.1: Integration Testing
**Files to touch:**
- `tests/integration/review-workflow-e2e.test.ts` (create)

**Dependencies:**
- All components from previous sessions
- Mock Supabase client for testing

**Steps:**
1. **Create integration tests:**
   ```tsx
   // Test: Complete workflow from draft to approval
   // Test: Brand DNA updates correctly after review
   // Test: Concurrent reviews handle conflicts properly
   // Test: Error handling and recovery
   ```

**Success criteria:** All integration tests pass, workflow works end-to-end.

#### Task 5.2: Error Handling and Edge Cases
**Files to touch:**
- All review components (updates)

**Dependencies:**
- Error boundary patterns
- Loading state patterns

**Implementation:**
- Network error handling for Supabase operations
- Loading states and skeletons
- Empty states for no artifacts
- Error boundaries for component failures

**Success criteria:** Graceful error handling, good loading UX, no console errors.

#### Task 5.3: Performance Optimization
**Files to touch:**
- Components with performance issues
- Database queries in review pages

**Implementation:**
- Server-side data fetching with proper caching
- Lazy loading for large content pieces
- Optimistic updates for better perceived performance
- React.memo usage for expensive components

**Success criteria:** Performance targets met (< 2s load, < 1s detail).

### ✅ Session Complete When:
- All integration tests pass
- Error handling is comprehensive
- Performance targets achieved
- Ready for production deployment

---

## 🔄 CLAUDE SESSION USAGE GUIDE

### How to Use Each Session
1. **Start fresh Claude context** for each session
2. **Read only the session section** you're working on
3. **Complete all tasks** in the session before moving to the next
4. **Verify success criteria** before marking session complete
5. **Commit your work** after each session

### Session Dependencies
```
Session 1 (Foundation)
    ↓
Session 2 (Compliance + Actions)
    ↓
Session 3 (Brand DNA + Detail Page)
    ↓
Session 4 (Enhanced List + Analytics)
    ↓
Session 5 (Integration + Polish)
```

### What to Tell Claude at Session Start
```
"I'm working on Session X of Plan 08. Please read the session section and guide me through implementing all tasks in this session. The session is designed to fit within a single Claude context window."
```

### Context Management Tips
- **Focus on one session only** - don't try to read ahead
- **Each session is self-contained** with all needed context
- **Files are clearly specified** for each task
- **Success criteria are explicit** for each session

### Total Project Timeline
- **5 sessions × 2 hours each** = ~10 hours total development time
- **1 session per day** recommended for best results
- **Can be compressed** to 2-3 days if needed

---

## 📊 SESSION SUMMARY

| Session | Focus | Components Built | Hours | Files Created |
|---------|--------|------------------|-------|---------------|
| 1 | Foundation | Content preview, quality tags | 2 | 4 files |
| 2 | Workflow | Compliance display, actions | 2 | 4 files |
| 3 | Integration | Brand DNA updater, detail page | 2 | 5 files |
| 4 | Enhancement | List search, analytics | 2 | 4 files |
| 5 | Polish | Integration tests, optimization | 2 | 3+ files |

**Total:** 20+ new files, 10 hours, production-ready review system

---

## TESTING STRATEGY

### Unit Tests (Every Component)
```bash
# Run tests for a specific component
npm test -- tests/ui/QualityTagsDisplay.test.tsx

# Run all UI tests
npm test -- tests/ui/
```

### Integration Tests
```bash
# Run workflow integration tests
npm test -- tests/integration/review-workflow-e2e.test.ts
```

### Manual Testing Checklist
1. **Load review page** - Should show draft artifacts only
2. **View artifact details** - Click card to open detailed view
3. **Check quality tags** - Expand and interact with audit tags
4. **Verify compliance** - Check regulatory compliance status
5. **Test approval** - Approve an artifact and confirm status change
6. **Test rejection** - Reject with proper feedback form
7. **Verify brand updates** - Check that brand profile receives feedback
8. **Test edge cases** - Empty queue, network errors, malformed content

### Browser Testing
- Chrome (primary)
- Firefox (secondary)
- Safari (if available)
- Mobile responsive view

---

## DEPLOYMENT CONSIDERATIONS

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

### Database Permissions
- Reviewers need: `SELECT` on eip_artifacts, `UPDATE` on eip_artifacts and brand_profiles
- Ensure RLS (Row Level Security) policies allow proper access

### Performance Requirements
- Page load time: < 2 seconds for review queue
- Artifact detail load: < 1 second for typical content
- Approval/rejection actions: < 500ms response time

---

## SUCCESS METRICS

### Functional Requirements
- ✅ Reviewers can view draft artifacts with all context
- ✅ Quality tags are interactive and helpful
- ✅ Compliance status is clear and actionable
- ✅ Approval/rejection workflow works reliably
- ✅ Brand DNA updates correctly from feedback
- ✅ Search and filtering work efficiently

### Quality Requirements
- ✅ All components have comprehensive tests (>90% coverage)
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ Error states handled gracefully
- ✅ Performance budgets met
- ✅ Responsive design works on mobile

### Integration Requirements
- ✅ Works with existing EIP pipeline
- ✅ Proper Supabase RLS policies
- ✅ No conflicts with other plans (01-07)
- ✅ Deployable to production environment

---

## COMMON PITFALLS TO AVOID

### Don't Do This
- ❌ Bypass RLS policies for convenience
- ❌ Store sensitive compliance data in client-side state
- ❌ Make UI changes without corresponding tests
- ❌ Assume data structure - always validate with TypeScript
- ❌ Create custom authentication logic - use Supabase auth

### Do This Instead
- ✅ Write tests before implementation (TDD)
- ✅ Use TypeScript strictly - no `any` types
- ✅ Handle loading and error states properly
- ✅ Follow existing code patterns and naming conventions
- ✅ Test with realistic data volumes

---

## GETTING HELP

### Documentation to Reference
- `docs/eip/prd.md` - Complete system specification
- `docs/plans/active/05-auditor-and-repairer.md` - Micro-auditor tag definitions
- `lib_supabase/db/types/database.types.ts` - Database schema types
- Existing component patterns in `src/components/compliance/`

### Code Patterns to Follow
- Look at `src/components/compliance/ComplianceDashboard.tsx` for dashboard patterns
- Follow server component pattern from `src/app/review/page.tsx`
- Use Supabase patterns from `lib_supabase/db/supabase-client.ts`
- Test patterns from existing `tests/ui/` files

### When You're Stuck
1. Check existing implementation patterns in similar components
2. Look at database schema for available data
3. Review test files for expected behavior
4. Check PRD for business logic requirements
5. Ask questions about EIP-specific domain knowledge

---

**Remember:** This is the critical human feedback loop that makes our AI content generation system trustworthy and compliant. Quality and compliance are non-negotiable - every decision should prioritize these values.