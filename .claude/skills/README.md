# Skills Directory

**Purpose:** Contains Claude Code skills (reusable procedural knowledge)

**Last Updated:** 2025-10-19

---

## Architecture Overview

Skills are stored in the git subtree at `.claude/frameworks/shared/frameworks/` and **linked** to this directory via Windows junctions (symlinks).

### Why Junctions?

- ✅ Skills live in git subtree (synced across projects)
- ✅ Claude Code expects skills in `.claude/skills/`
- ✅ Junctions bridge the gap without file duplication
- ✅ Each developer creates their own local junctions
- ✅ Junctions are NOT committed (in .gitignore)

---

## Active Skills (Linked from Subtree)

### Response-Awareness Framework Tiers

**Location:** `.claude/frameworks/shared/frameworks/response-awareness/`

- ✅ `response-awareness-light/` → Single-file changes, bug fixes (Complexity 0-1)
- ✅ `response-awareness-medium/` → Multi-file features (Complexity 2-4)
- ✅ `response-awareness-heavy/` → Complex single-domain features (Complexity 5-7)
- ✅ `response-awareness-full/` → Multi-domain architecture changes (Complexity 8+)

**Router:** `/response-awareness` slash command scores complexity and routes to appropriate tier

### Superpowers Skills

**Location:** `.claude/frameworks/shared/frameworks/superpowers/`

- ✅ `brainstorming/` → Transform rough ideas into designs (brainstorming.md, systematic-debugging.md)

**Note:** Brainstorming junction points to entire superpowers folder. Access via:
- `brainstorming/brainstorming.md`
- `brainstorming/systematic-debugging.md`

---

## Local Skills (Not in Subtree)

**Location:** Directly in `.claude/skills/` (committed to NextNest repo)

- ✅ `executing-plans/` → Execute detailed implementation plans

---

## Setup Instructions

### First Time Setup (Fresh Clone)

```powershell
# Run setup script to create junctions
.\scripts\setup-skill-junctions.ps1
```

**What it does:**
1. Creates junction: `response-awareness-light` → subtree location
2. Creates junction: `response-awareness-medium` → subtree location
3. Creates junction: `response-awareness-heavy` → subtree location
4. Creates junction: `response-awareness-full` → subtree location
5. Creates junction: `brainstorming` → subtree/superpowers

### Manual Setup (If Script Fails)

```powershell
cd .claude\skills

# Response-Awareness tiers
New-Item -ItemType Junction -Path "response-awareness-light" -Target "..\frameworks\shared\frameworks\response-awareness\response-awareness-light"
New-Item -ItemType Junction -Path "response-awareness-medium" -Target "..\frameworks\shared\frameworks\response-awareness\response-awareness-medium"
New-Item -ItemType Junction -Path "response-awareness-heavy" -Target "..\frameworks\shared\frameworks\response-awareness\response-awareness-heavy"
New-Item -ItemType Junction -Path "response-awareness-full" -Target "..\frameworks\shared\frameworks\response-awareness\response-awareness-full"

# Superpowers
New-Item -ItemType Junction -Path "brainstorming" -Target "..\frameworks\shared\frameworks\superpowers"
```

### Verify Setup

```powershell
# Check junctions exist
ls .claude\skills

# Should show:
# - response-awareness-light (junction)
# - response-awareness-medium (junction)
# - response-awareness-heavy (junction)
# - response-awareness-full (junction)
# - brainstorming (junction)
# - executing-plans (real folder)
```

---

## After Subtree Updates

**When you run:**
```bash
git subtree pull --prefix .claude/frameworks/shared https://github.com/iamnormalfree/claude-shared.git master --squash
```

**Junctions automatically see new content** (they're just pointers)

**No need to recreate junctions** unless you deleted `.claude/skills/` folder

---

## Troubleshooting

### Error: "Unknown skill: response-awareness-heavy"

**Cause:** Junctions not created

**Fix:**
```powershell
.\scripts\setup-skill-junctions.ps1
```

### Error: Junction already exists

**Cause:** Running setup script multiple times

**Fix:** Script skips existing junctions automatically (safe to run anytime)

### Want to delete junctions?

```powershell
# Remove junctions (not the target files)
cd .claude\skills
Remove-Item response-awareness-light
Remove-Item response-awareness-medium
Remove-Item response-awareness-heavy
Remove-Item response-awareness-full
Remove-Item brainstorming

# Recreate
cd ..\..
.\scripts\setup-skill-junctions.ps1
```

**IMPORTANT:** Use `Remove-Item` NOT `rm -rf` (removes junction, not target)

---

## File Structure

```
.claude/
├── skills/                                    # This directory
│   ├── response-awareness-light/             # Junction → subtree
│   ├── response-awareness-medium/            # Junction → subtree
│   ├── response-awareness-heavy/             # Junction → subtree
│   ├── response-awareness-full/              # Junction → subtree
│   ├── brainstorming/                        # Junction → subtree/superpowers
│   ├── executing-plans/                      # Real folder (local skill)
│   ├── archive/                              # Archived old skills
│   └── README.md (this file)
│
└── frameworks/
    └── shared/                               # Git subtree
        └── frameworks/
            ├── response-awareness/
            │   ├── response-awareness-light/
            │   ├── response-awareness-medium/
            │   ├── response-awareness-heavy/
            │   └── response-awareness-full/
            └── superpowers/
                ├── brainstorming.md
                └── systematic-debugging.md
```

---

## Adding New Skills

### From Subtree (Shared Across Projects)

1. **Add to shared repository:**
   ```bash
   cd C:\Users\HomePC\.config\claude-shared
   # Add skill to frameworks/
   git add .
   git commit -m "Add new skill"
   git push
   ```

2. **Pull to NextNest:**
   ```bash
   cd C:\Users\HomePC\Desktop\Code\NextNest
   git subtree pull --prefix .claude/frameworks/shared https://github.com/iamnormalfree/claude-shared.git master --squash
   ```

3. **Create junction:**
   ```powershell
   cd .claude\skills
   New-Item -ItemType Junction -Path "new-skill-name" -Target "..\frameworks\shared\frameworks\new-skill-name"
   ```

4. **Add to .gitignore:**
   ```gitignore
   .claude/skills/new-skill-name
   ```

### Local Only (NextNest-Specific)

1. **Create directly in `.claude/skills/`:**
   ```bash
   mkdir .claude/skills/nextnest-specific-skill
   # Add SKILL.md with YAML frontmatter
   ```

2. **Commit normally:**
   ```bash
   git add .claude/skills/nextnest-specific-skill
   git commit -m "Add NextNest-specific skill"
   ```

---

## See Also

- `UPDATE_GUIDE.md` - Git subtree sync workflow
- `scripts/setup-skill-junctions.ps1` - Junction setup script
- `.claude/frameworks/shared/README.md` - Subtree documentation
- `.claude/commands/response-awareness.md` - Skill router
