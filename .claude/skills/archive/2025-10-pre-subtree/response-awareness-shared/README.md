# Response-Awareness Framework: Shared Modules

**Purpose**: Single source of truth for cross-cutting observability features used across all response-awareness tiers.

**Created**: 2025-10-18
**Motivation**: Prevent duplication and ensure observability features survive framework migrations

---

## Modules

### **LOGGING_INSTRUCTIONS.md**
- Purpose: Optional verbose logging protocol
- Used by: MEDIUM, HEAVY, FULL tiers
- When loaded: If LOGGING_LEVEL != none (set via --light-logging or --verbose-logging flags)
- Location: `docs/completion_drive_logs/DD-MM-YYYY_task-name/`

### **PLAN_PERSISTENCE.md**
- Purpose: Mandatory plan and blueprint persistence
- Used by: MEDIUM (optional), HEAVY (mandatory), FULL (mandatory)
- When loaded: Always for HEAVY/FULL, conditionally for MEDIUM
- Location: `docs/completion_drive_plans/DD-MM-YYYY_task-name/`

### **NEXTNEST_CUSTOMIZATIONS.md** ⭐ (NextNest-specific)
- Purpose: NextNest project customizations for response-awareness framework
- Used by: Router (Phase 0 extensions) and all tiers (compliance checks)
- When loaded: Always
- Features:
  - Configuration loading from `.claude/config/`
  - Git worktree integration (Phase 0.1)
  - Brainstorming pre-checks (Phase 0.2)
  - Debug task detection (Phase 0.3)
  - TDD enforcement
  - CANONICAL_REFERENCES checks
  - Component placement validation
  - YAGNI ruthlessness
  - Logging/plan path overrides

---

## How Tier Skills Use These Modules

Each tier skill starts with:

```markdown
## Load Shared Observability Modules

**If LOGGING_LEVEL != none**:
Read file `.claude/skills/response-awareness-shared/LOGGING_INSTRUCTIONS.md`

**Always** (for HEAVY/FULL):
Read file `.claude/skills/response-awareness-shared/PLAN_PERSISTENCE.md`

[Tier-specific orchestration logic follows...]
```

---

## Benefits

✅ **Single Source of Truth**: Update once, affects all tiers
✅ **Evolution-Proof**: Can't forget to migrate shared/ folder
✅ **Maintainability**: ~591 lines consolidated to 2 files
✅ **Clarity**: Tier logic separated from observability
✅ **Reusability**: Other frameworks can reference these modules

---

## Maintenance

**To update logging**:
- Edit `LOGGING_INSTRUCTIONS.md`
- All tiers automatically use updated version

**To update plan format**:
- Edit `PLAN_PERSISTENCE.md`
- All tiers automatically use updated format

**To add new observability feature**:
- Create new module file
- Update tier skills to Read it
- Document in this README

---

## Architecture Decision

**Chosen**: Shared module pattern (Option B)
**Rejected**: Separate skills (unclear if supported), conventions docs (manual copy-paste)
**Rationale**: Uses familiar Read tool, low complexity, high maintainability

See: docs/work-log.md 2025-10-18 for detailed architectural discussion
