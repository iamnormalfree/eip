# Plan 08 — Review UI v0 (Human-in-the-Loop)

Goal: Minimal UI to review drafts, inspect ledger/tags/sources, and approve/reject with rubric score updates written back to brand DNA.

Success criteria:

- `http://localhost:3002/review` lists draft artifacts with status, persona, funnel.
- Detail view shows MDX, tags, sources, JSON-LD preview, and CTA check.
- Approve → status=published; Reject → status=draft + reviewer note; brand_profile gets tone/novelty/compliance scores.

Deliverables:

- `src/app/review/page.tsx` — list + detail
- `tests/ui/review.test.tsx` — renders, actions, Supabase calls mocked
- Reuse: `lib_supabase/db/supabase-client.ts`

Step-by-step tasks:

1) Page scaffold
   - Touch: `src/app/review/page.tsx`
   - Tests first: `tests/ui/review.test.tsx` — list renders items; clicking opens detail; approve/reject triggers update.
   - Implement: Server component fetch drafts; client actions for approve/reject; write reviewer score with small form.
   - Commit: feat(ui): review page lists and approves drafts

2) Ledger and JSON-LD preview
   - Touch: `src/app/review/page.tsx`
   - Tests first: ensure ledger fields and JSON-LD snippet appear.
   - Implement: Pretty-print ledger; collapsible JSON-LD area; highlight unresolved critical tags.
   - Commit: feat(ui): add ledger + JSON-LD preview and tag highlights

Definition of done:

- Reviewer can approve/reject with rubric scores; ledger visible; tags surfaced; Supabase writes occur; tests pass.

References:

- Big picture human loop: `docs/eip/big-picture.md`
- PRD “Human loop ≈ 15–30% where it matters”

