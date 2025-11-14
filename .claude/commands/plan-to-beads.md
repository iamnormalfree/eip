# Plan to Beads

**Purpose:** Convert an active implementation plan with tasks into Beads issue tracker items for execution by agents.

**Usage:** `/plan-to-beads [path-to-plan-file] [optional-supporting-files...]`

**Examples:**
- `/plan-to-beads docs/plans/active/2025-11-05-chat-resume-flow-plan.md`
- `/plan-to-beads docs/plans/active/2025-11-05-chat-resume-flow-plan.md docs/runbooks/chat/sse-waitlist-streaming.md docs/runbooks/chat/chat-transition-sse-integration.md`

---

## Instructions for Claude

When user runs this command, convert their plan into beads by following these steps:

### Step 1: Validate Input

```bash
# Parse command line arguments
PLAN_FILE="$1"
shift 1  # Remove plan file from args, leaving supporting files
SUPPORTING_FILES=("$@")  # Array of optional supporting files

# Check that beads is initialized
if [ ! -d ".beads" ]; then
  echo "❌ Beads not initialized. Run 'npx bd init' first."
  exit 1
fi

# Check that plan file exists and is readable
if [ ! -f "$PLAN_FILE" ]; then
  echo "❌ Plan file not found: $PLAN_FILE"
  exit 1
fi

# Check that plan is in docs/plans/active/
if [[ ! "$PLAN_FILE" == docs/plans/active/* ]]; then
  echo "⚠️  Warning: Plan should be in docs/plans/active/ directory"
fi

# Validate supporting files exist
for file in "${SUPPORTING_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Supporting file not found: $file"
    exit 1
  fi
done

echo "📋 Processing plan: $PLAN_FILE"
if [ ${#SUPPORTING_FILES[@]} -gt 0 ]; then
  echo "📚 Including ${#SUPPORTING_FILES[@]} supporting files:"
  printf '  - %s\n' "${SUPPORTING_FILES[@]}"
fi
```

### Step 2: Parse Plan Frontmatter

Extract from the YAML frontmatter:

```yaml
constraint: "Constraint A – Public Surfaces Ready"
can_tasks:
  - CAN-053
  - CAN-055
  - CAN-056
complexity: medium
branch: feature/constraint-a-public-surfaces
```

**Output variables:**
- `constraint_letter`: Extract A/B/C/D from constraint name
- `can_tasks`: List of CAN numbers
- `branch_name`: Feature branch to use for every bead (fallback: prompt user if missing)
- `priority`: Set based on complexity (low=P3, medium=P2, high=P1)

### Step 3: Extract Tasks from Plan

Parse the plan body to identify concrete tasks:

**Task Pattern Recognition:**

```markdown
# Phase 1 – Backend (3.5h)
1. **Task title**
   - Subtask or implementation detail
   - File path: lib/queue/broker-queue.ts
   - Integration test: tests/integration/api/brokers/queue-stream.test.ts

2. **Another task**
   - Multiple files mentioned:
     - app/api/brokers/queue-stream/[conversationId]/route.ts
     - components/chat/ChatTransitionScreen.tsx
```

**Extraction Rules:**

1. **Phase headers** (`### Phase 1`, `## Phase 1`) → Use for task grouping/dependencies
2. **Numbered lists** (`1. **Task**:`) → Each becomes a bead
3. **File paths** → Capture them so they can be embedded in the bead description body (the CLI does not support `--files`)
4. **Test files** → Mention them inside the description (e.g., `Tests: …`) or create a dedicated testing bead if needed
5. **Time estimates** → Track for validation (optional)

**File Pattern Matching:**
```bash
# Common file patterns to extract:
- lib/**/*.ts
- app/**/*.ts
- components/**/*.tsx
- tests/**/*.test.ts
- scripts/**/*.ts
- docs/**/*.md (runbooks)
```

### Step 4: Normalize Task Data

For each extracted task, create a normalized structure:

```json
{
  "title": "CAN-053: Implement queue stream API route",
  "description": "Create SSE endpoint for broker queue streaming",
  "labels": [
    "constraint-a",
    "backend",
    "api",
    "claude-pair-1"
  ],
  "files": [
    "app/api/brokers/queue-stream/[conversationId]/route.ts",
    "lib/queue/broker-queue.ts"
  ],
  "estimated_hours": 2.5,
  "phase": 1,
  "dependencies": []
}
```

**Label Mapping:**
- `constraint-[letter]` from frontmatter
- Domain: `backend`, `frontend`, `tests`, `docs`, `infra`
- Type: `api`, `component`, `util`, `integration`, `e2e`
- Agent: `claude-pair-1`, `claude-backend`, `claude-frontend` (default: `claude-pair-1`)

### Codex Profile Requirements

**Each Codex agent must declare CODEX_PROFILE:**

For any beads that will be executed by Codex agents (codex-reviewer, codex-plus agents, etc.), you must specify the required profile configuration:

```bash
# Add Codex profile labels to beads requiring API access
bd create "Task: Review API endpoint" \
  --label constraint-a \
  --label codex-review \
  --label claude-pair-1 \
  --label codex-profile-codex-plus-1

# For tasks that can use any available profile
bd create "Task: Code review" \
  --label constraint-a \
  --label codex-review \
  --label claude-pair-1 \
  --label codex-profile-auto
```

**Available Codex Profile Labels:**
- `codex-profile-auto` - Use automatic profile selection (default)
- `codex-profile-codex-plus-1` - Force use of codex-plus-1 profile
- `codex-profile-codex-plus-2` - Force use of codex-plus-2 profile
- `codex-profile-codex-plus-3` - Force use of codex-plus-3 profile

**Quota Enforcement:**
- When `codex-profile-auto` is used, the MAF claim-task CLI automatically selects the best available profile based on quota usage
- Specific profile labels bypass quota checks and force usage of that profile
- Profile rotation automatically occurs when quota limits are approached
- Real-time quota monitoring is available via `npm run maf:quota-monitor`

**Profile Configuration Reference:**
See `docs/runbooks/maf/CODEX_PROFILE_MANAGEMENT.md` for complete profile setup and configuration details.
### Step 4.5: Handle Supplementary Documentation

**Process Supporting Files:**
```bash
# Add supporting files to all beads for context
for support_file in "${SUPPORTING_FILES[@]}"; do
  echo "📚 Processing supporting file: $support_file"

  # Add to bead notes as reference
  bead_note+="\nRefer to: $support_file"

  # Extract additional tasks or context from supporting files
  if [[ "$support_file" == *.md ]]; then
    echo "ℹ️  Supporting runbook/doc detected - will be referenced in bead notes"
  fi
done
```

**Extract Plan-Referenced Docs:**
```bash
# Find all referenced documents in the plan
plan_references=$(grep -oE '\`([^`]+\.(md|yaml|json))`' "$PLAN_FILE" | sed 's/`//g' | sort -u)

for ref in $plan_references; do
  if [ -f "$ref" ]; then
    echo "📖 Plan references: $ref"
    bead_note+="\nReference: $ref"
  elif [[ "$ref" == docs/runbooks/* ]] && [ -f "$ref" ]; then
    echo "📘 Runbook reference: $ref"
    # Add runbook label for tasks that reference runbooks
    labels+=("runbook")
  fi
done
```

**Documentation Strategy:**
```bash
# Create separate documentation beads if needed
if [ ${#plan_references} -gt 3 ]; then
  echo "📝 Creating documentation reference bead"
  docs_bead=$(bd create "Docs: References for $plan_basename" \
    --label constraint-${constraint_letter} \
    --label documentation \
    --description "Source: $(basename "$PLAN_FILE")\nReferences:\n$(printf '%s\n' "$plan_references")")

  # Link documentation bead to first implementation task
  if [ -n "$first_bead_id" ]; then
    bd dep add "$docs_bead" --blocks "$first_bead_id"
  fi
fi
```

### Step 5: Create Beads Programmatically

For each normalized task, execute:

```bash
# Create bead with labels and description
bd create "Task Title" \
  --label constraint-a \
  --label backend \
  --label claude-pair-1 \
  --label branch-${branch_name//\//-} \
--description "Files: app/api/brokers/queue-stream/route.ts, lib/queue/broker-queue.ts
Tests: tests/integration/api/brokers/queue-stream.test.ts
Source: docs/plans/active/2025-11-05-chat-resume-flow-plan.md#Phase1
Branch: ${branch_name}"

# Example: assigning agent-specific Codex profiles in the plan
# Label example: --label codex-profile-codex-plus-1
```

> Note: The current Beads CLI only supports `--description` for custom metadata. Include file paths, tests, and plan references inside the description body—do **not** attempt to pass `--files` or `--note`.

**Capture bead IDs:**
```bash
# bd create outputs: "Created issue nextnest-42"
BEAD_ID=$(bd create ... | grep "Created issue" | cut -d' ' -f3)
echo "nextnest-42:$PLAN_LINE_NUMBER" >> bead_mapping.txt
```

### Step 6: Add Dependencies

**Phase Dependencies:**
```bash
# Phase 2 tasks depend on Phase 1 completion
for phase2_bead in "${phase2_beads[@]}"; do
  for phase1_bead in "${phase1_beads[@]}"; do
    # Syntax: bd dep add <dependent-issue-id> <depends-on-issue-id> [--type blocks|related|…]
    bd dep add "$phase2_bead" "$phase1_bead"
    # CLI defaults to 'blocks' type, so no --blocks flag needed
  done
done
```

**Codex Review Dependencies:**
```bash
# Create review bead for each implementation
review_bead=$(bd create "Review: CAN-053 Queue Stream API" \
  --label constraint-a \
  --label codex-review \
  --label claude-pair-1)

# Block implementation on review completion
# Syntax: bd dep add <dependent-issue-id> <depends-on-issue-id>
bd dep add "$implementation_bead" "$review_bead"
```

### Step 7: Validate and Report

**Validation Checks:**
```bash
# Verify all tasks have beads
task_count=$(grep -c "^[0-9]\+\.\s\+\*\*" "$PLAN_FILE")
bead_count=$(bd list | grep "nextnest-" | wc -l)
echo "Tasks in plan: $task_count, Beads created: $bead_count"

# Check labels exist
bd list --json | jq '.issues[].labels' | grep constraint-a

# Verify file paths are valid
for file in $(bd list --json | jq -r '.issues[].files[]'); do
  if [ ! -f "$file" ] && [ ! -d "$file" ]; then
    echo "⚠️  File not found: $file"
  fi
done
```

**Output Report:**
```markdown
## Plan → Beads Conversion Summary

**Source Plan:** docs/plans/active/2025-11-05-chat-resume-flow-plan.md
**Constraint:** Constraint A – Public Surfaces Ready
**CAN Tasks:** CAN-053, CAN-055, CAN-056

### Supporting Documentation
**Provided Files:** 2 supporting docs included
- docs/runbooks/chat/sse-waitlist-streaming.md
- docs/runbooks/chat/chat-transition-sse-integration.md

**Plan References:** 4 docs referenced from plan
- docs/runbooks/chat/sse-waitlist-pitfalls.md
- docs/plans/active/2025-11-03-real-time-foundations.md
- lib/ab-testing/experiments.ts
- docs/runbooks/AI_BROKER_COMPLETE_GUIDE.md

### Tasks Converted
| Phase | Plan Task | Bead ID | Labels | Files | References |
|-------|-----------|---------|--------|-------|------------|
| 1 | Implement queue stream API | nextnest-42 | constraint-a,backend,claude-pair-1 | 3 files | 2 runbooks |
| 1 | Add queue status helper | nextnest-43 | constraint-a,backend,claude-pair-1 | 2 files | 1 runbook |
| 2 | EventSource wiring | nextnest-44 | constraint-a,frontend,claude-pair-1 | 2 files | 2 supporting docs |

### Dependencies Created
- Phase 1 → Phase 2 blocking relationships
- Codex review beads for 3 implementation tasks
- Documentation bead blocks first implementation task

### Agent Instructions
Each bead includes notes with:
- Source plan reference (phase and task number)
- All supporting documentation links
- Required runbook references for implementation

### Next Steps
1. ✅ **Plan branch automatically created and pushed**: All agents will work on the same branch
2. Run: `bd ready --label constraint-a` to see available work
3. Assign agents: `bd assign nextnest-42 --agent claude-backend`
4. Agents should verify they're on the plan branch: `git checkout feature/<plan-name>`
5. Commit beads state: `git add .beads/issues.jsonl && git commit -m "feat: encode chat-resume-flow plan into beads"`

**Note:** Agents will find all referenced documentation in bead descriptions for complete context

**Branch Management:** The plan's feature branch has been automatically created and pushed. All beads for this plan should be implemented on that branch until the plan is complete. Agents should check out the plan branch before starting work.

**Conversion:** ✅ Complete (8/8 tasks converted + 2 supporting docs integrated)
```

### Step 8: Create Plan Branch (Automatic)

**Critical workflow update:** Create and push the plan's branch automatically so agents know exactly where to work.

```bash
# Extract plan information for branch creation
PLAN_BASENAME=$(basename "$PLAN_FILE" .md)
PLAN_DATE=$(echo "$PLAN_BASENAME" | cut -d'-' -f1-3)
PLAN_SLUG=$(echo "$PLAN_BASENAME" | sed "s/${PLAN_DATE}-//")

# Call helper script to create and push the branch
HELPER_SCRIPT="scripts/maf/helpers/create-plan-branch.sh"
if [ -f "$HELPER_SCRIPT" ]; then
  echo "🌱 Creating plan branch..."
  bash "$HELPER_SCRIPT" "$PLAN_FILE"

  if [ $? -eq 0 ]; then
    echo "✅ Plan branch created and pushed successfully"
  else
    echo "⚠️  Warning: Branch creation failed, agents will need to create manually"
  fi
else
  echo "⚠️  Helper script not found: $HELPER_SCRIPT"
  echo "   Agents will need to create plan branch manually"
fi
```

### Step 9: Commit Artifacts

```bash
# Stage the plan file (if conversion added bead references)
git add "$PLAN_FILE"

# Stage beads state (CLI already stages git-tracked artifacts)
git add .beads/issues.jsonl  # SQLite files are gitignored by .beads/.gitignore
# Note: Only commit the JSONL file - SQLite DB files are excluded by .gitignore

# Commit with structured message
git commit -m "$(cat <<'EOF'
feat: encode $(basename "$PLAN_FILE" .md) tasks into beads

- Extracted 8 concrete tasks from plan phases
- Created beads with proper constraint/agent labels
- Added phase dependencies and Codex review blocks
- Created and pushed plan branch for all beads
- Source plan: docs/plans/active/...

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>


---

# MAF Tmux Orchestration System

**Purpose:** Comprehensive tmux-based orchestration system for Multi-Agent Framework (MAF) execution, providing parallel agent management, session layouts, health monitoring, and integration with existing NextNest workflows.

## Quick Start

### Prerequisites

The MAF tmux orchestration system requires these dependencies:

**System Dependencies:**
- **tmux** (3.0+) - Terminal multiplexer for session management
- **jq** (1.6+) - JSON processor for configuration parsing
- **git** - Version control integration
- **Node.js** (18+) - JavaScript runtime for MAF CLI
- **npm** - Package manager

**Installation:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install tmux jq git

# macOS (using Homebrew)
brew install tmux jq git

# Verify installation
npm run maf:health-check  # Checks all dependencies
```

**Verification:**
```bash
# Check system dependencies
npm run maf:diagnose

# Full health check
npm run maf:health-check
```

### Fastest Way to Get Started

```bash
# Quick development setup (minimal layout, 1 worker)
npm run maf:quick-start

# Quick demo setup (demo layout, 3 workers)
npm run maf:quick-demo

# Test orchestration and clean up
npm run maf:quick-test
```

### Basic Usage Examples

```bash
# Spawn agents with default layout
npm run maf:spawn-agents

# Spawn specific agent configurations
npm run maf:init-worker      # Single claude-worker agent
npm run maf:init-committer   # Single claude-committer agent
npm run maf:init-reviewer    # Single codex-reviewer agent
npm run maf:init-coordinator # Single coordinator agent

# Spawn with custom layouts
npm run maf:spawn-minimal    # 2-pane layout, 1 worker
npm run maf:spawn-demo       # 4-pane demo layout, 3 workers
```

## Session Management

### Session Status and Control

```bash
# List all MAF sessions
npm run maf:session-list

# Attach to most recent MAF session
npm run maf:session-attach

# Check detailed session status
npm run maf:session-status

# Clean up all MAF sessions
npm run maf:session-cleanup

# Force cleanup all tmux sessions
npm run maf:session-cleanup-force
```

### Session Layouts

MAF supports multiple session layouts for different use cases:

| Layout | Panes | Description | Use Case |
|--------|-------|-------------|----------|
| `default_4_pane` | 4 | Standard development layout | Daily development with monitoring |
| `focused_3_pane` | 3 | Focused work layout | Single task deep work |
| `minimal_2_pane` | 2 | Minimal layout | Simple tasks and demos |
| `demo_4_pane` | 4 | Demo presentation layout | Showcasing MAF capabilities |

### Session Navigation

```bash
# Inside tmux session:
# Ctrl+B, then:
#   c           - Create new window
#   &           - Kill current window
#   %           - Split vertical
#   "           - Split horizontal
#   o           - Swap panes
#   x           - Kill pane
#   arrow keys  - Navigate panes
#   d           - Detach from session
```

## Agent Types

### Available Agent Configurations

#### claude-worker
- **Purpose:** Standard development task execution
- **Capabilities:** code_implementation, debugging, testing, documentation, file_operations
- **Default Model:** claude-sonnet-4-5
- **Resource Limits:** 60% CPU, 512MB RAM, 3 max sessions

#### claude-committer
- **Purpose:** Git operations and workflow integration
- **Capabilities:** git_operations, commit_message_generation, code_review, integration_testing, workflow_automation
- **Default Model:** claude-sonnet-4-5
- **Resource Limits:** 40% CPU, 256MB RAM, 2 max sessions

#### codex-reviewer
- **Purpose:** Code review and quality assurance
- **Capabilities:** static_analysis, security_review, performance_review, accessibility_review
- **Default Model:** claude-sonnet-4-5
- **Resource Limits:** 30% CPU, 256MB RAM, 2 max sessions

#### coordinator
- **Purpose:** Agent coordination and task distribution
- **Capabilities:** task_scheduling, resource_allocation, agent_communication, progress_tracking
- **Default Model:** claude-sonnet-4-5
- **Resource Limits:** 20% CPU, 128MB RAM, 1 max session

### Agent Initialization

```bash
# Initialize specific agent types
npm run maf:init-worker      # Create claude-worker configuration
npm run maf:init-committer   # Create claude-committer configuration
npm run maf:init-reviewer    # Create codex-reviewer configuration
npm run maf:init-coordinator # Create coordinator configuration

# Initialize all agents with default configuration
npm run maf:init-agent
```

## Configuration

### Configuration Files

- **Main Config:** `.maf/config/default-agent-config.json`
- **Schema:** `.maf/config/agent-config-schema.json`
- **Tmux Config:** `.maf/tmux.conf` (auto-generated)

### Configuration Management

```bash
# Show demo configuration overview
npm run maf:config-demo

# Load example configuration
npm run maf:config-load

# Start with specific configuration
npm run maf:config-start

# Verify integration
npm run maf:config-verify
```

### Custom Configuration

Create custom agent configurations:

```bash
# Copy default configuration
cp .maf/config/default-agent-config.json .maf/config/my-config.json

# Edit as needed
nano .maf/config/my-config.json

# Use custom configuration
maf start --config .maf/config/my-config.json --layout custom_4_pane
```

### Environment Variables

MAF agents use these environment variables:

```bash
# Core MAF settings
MAF_AGENT_TYPE=claude-worker
MAF_SESSION_NAME=maf-session
MAF_LOG_LEVEL=info
MAF_CONFIG_FILE=.maf/config/default-agent-config.json

# NextNest integration
NODE_ENV=development
CLAUDE_MODEL=claude-sonnet-4-5
ENABLE_RESPONSE_AWARENESS=true
ENABLE_TDD_ENFORCEMENT=true
ENABLE_CANONICAL_REFERENCES_CHECK=true

# Resource limits
MAF_CPU_LIMIT=60
MAF_MEMORY_LIMIT=512
MAF_MAX_SESSIONS=3
```

## Monitoring and Health

### Health Checks

```bash
# Run comprehensive health check
npm run maf:health-check

# Run system diagnosis
npm run maf:diagnose

# Show recent activity
npm run maf:logs

# Full health report
npm run maf:health
```

### Monitoring Capabilities

#### Health Monitoring
- Agent process health checks
- Resource utilization tracking
- Session connectivity verification
- Configuration validation

#### Resource Monitoring
- CPU and memory usage per agent
- Network connectivity status
- Disk space monitoring
- Session performance metrics

#### Log Aggregation
- Centralized log collection from all agents
- Real-time log streaming
- Error detection and alerting
- Performance metrics logging

### Monitoring Configuration

```json
{
  "monitoring": {
    "health_checks": {
      "enabled": true,
      "interval_seconds": 30,
      "timeout_seconds": 10
    },
    "resource_monitoring": {
      "enabled": true,
      "cpu_threshold": 80,
      "memory_threshold": 85
    },
    "log_aggregation": {
      "enabled": true,
      "log_level": "info",
      "max_log_size_mb": 100
    }
  }
}
```

## Integration with Existing Workflows

### MAF CLI Integration

The tmux orchestration system integrates seamlessly with existing MAF CLI commands:

```bash
# Use existing MAF CLI with tmux sessions
npm run maf:claim-task        # Claim tasks within tmux session
npm run maf:index             # Index workflow state
npm run maf:check-beads       # Verify beads integrity
```

### Beads Workflow Integration

```bash
# Standard plan-to-beads workflow
/plan-to-beads docs/plans/active/feature-plan.md

# Execute with tmux agents
npm run maf:spawn-agents
# Agents automatically pick up beads tasks
```

### Agent Mail System Integration

```bash
# Initialize agent mail for communication
npm run maf:bootstrap-agent-mail
npm run maf:init-agent-mail

# Agents communicate via mail system during execution
# Automatic synchronization of task states
# Inter-agent message passing
```

### Git Workflow Integration

```bash
# Automatic branch management within sessions
# Smart commit message generation
# Integration with existing git hooks
# Commit synchronization across agents
```

## Development Workflows

### Development Setup

```bash
# 1. Initial setup
npm run maf:setup

# 2. Spawn development agents
npm run maf:spawn-verbose     # Detailed logging for development

# 3. Or spawn specific configuration
npm run maf:spawn-agents --layout focused_3_pane --workers 2

# 4. Attach to session
npm run maf:session-attach

# 5. Work within tmux session
#   - Each agent works in their own pane
#   - Coordinated task execution
#   - Real-time communication
```

### Testing Workflow

```bash
# Test orchestration system
npm run maf:test-orchestration

# Run full demo
npm run maf:demo-orchestration

# Test complete system
npm run maf:test-full

# Clean up after testing
npm run maf:session-cleanup
```

### Production Deployment

```bash
# Background deployment (detached sessions)
npm run maf:spawn-bg

# Production configuration
npm run maf:prod

# Monitor production sessions
npm run maf:session-status
npm run maf:health-check
```

## Advanced Usage

### Custom Session Creation

```bash
# Manual session creation with custom parameters
bash scripts/maf/spawn-agents.sh \
  --session-name my-session \
  --layout custom_4_pane \
  --workers 4 \
  --config .maf/config/production-config.json \
  --background
```

### Session Layout Customization

Create custom layouts by modifying the configuration:

```json
{
  "session_layouts": {
    "custom_4_pane": {
      "description": "Custom 4-pane layout for specific workflow",
      "panes": [
        {
          "name": "worker-1",
          "agent_type": "claude-worker",
          "command": "npm run maf:start-agent claude-worker",
          "size": "50%"
        },
        {
          "name": "committer", 
          "agent_type": "claude-committer",
          "command": "npm run maf:start-agent claude-committer",
          "size": "50%"
        },
        {
          "name": "worker-2",
          "agent_type": "claude-worker", 
          "command": "npm run maf:start-agent claude-worker",
          "size": "50%"
        },
        {
          "name": "monitor",
          "agent_type": "coordinator",
          "command": "npm run maf:start-agent coordinator", 
          "size": "50%"
        }
      ]
    }
  }
}
```

### Agent Communication

Agents communicate through multiple channels:

1. **Agent Mail System:** Asynchronous message passing
2. **Shared State:** Centralized state management
3. **Git Integration:** Coordinated version control
4. **Real-time Chat:** Direct tmux pane communication

## Troubleshooting

### Common Issues and Solutions

#### Session Issues

```bash
# Sessions not appearing
npm run maf:session-status
tmux list-sessions  # Check all tmux sessions

# Can't attach to session
npm run maf:session-attach  # Auto-attach to first MAF session
tmux attach -t session-name  # Attach to specific session

# Zombie sessions
npm run maf:session-cleanup-force  # Force cleanup all tmux sessions
```

#### Agent Issues

```bash
# Agents not starting
npm run maf:diagnose
npm run maf:health-check

# Configuration errors
npm run maf:config-verify
python3 -m json.tool .maf/config/default-agent-config.json  # Validate JSON

# Resource limits
# Check .maf/config/default-agent-config.json for resource settings
# Monitor with: npm run maf:health
```

#### Permission Issues

```bash
# Script permission errors
chmod +x scripts/maf/*.sh
chmod +x scripts/maf/lib/*.sh

# Directory permission errors
mkdir -p .maf/config .maf/logs .maf/state
chmod 755 .maf
```

### Debug Mode

```bash
# Spawn agents with debug output
npm run maf:spawn-debug

# Verbose logging
npm run maf:spawn-verbose

# Check logs
find .maf/logs -name "*.log" -exec tail -f {} \;

# Monitor real-time activity
watch -n 5 'npm run maf:session-status && npm run maf:health-check'
```

### Performance Issues

```bash
# High resource usage
npm run maf:diagnose
top -p $(pgrep -f "maf")  # Monitor MAF processes

# Session slowdown
tmux kill-session -t session-name  # Restart problematic session
npm run maf:quick-start  # Fresh start
```

## Best Practices

### Session Management

1. **Clean up regularly:** Use `npm run maf:session-cleanup` after work sessions
2. **Monitor resources:** Check `npm run maf:health` periodically
3. **Use appropriate layouts:** Match layout complexity to task requirements
4. **Background processing:** Use `npm run maf:spawn-bg` for long-running tasks

### Agent Configuration

1. **Resource limits:** Adjust CPU/memory limits based on available resources
2. **Agent specialization:** Use specific agent types for appropriate tasks
3. **Configuration validation:** Always run `npm run maf:config-verify` after changes
4. **Environment consistency:** Maintain consistent environment variables across agents

### Development Workflow

1. **Start simple:** Begin with `npm run maf:spawn-minimal` for new workflows
2. **Incremental complexity:** Add agents as needed for complex tasks
3. **Test integration:** Use `npm run maf:test-orchestration` before production use
4. **Monitor health:** Regular health checks during development

### Git Integration

1. **Commit coordination:** Let claude-committer handle git operations
2. **Branch management:** Use feature branches for each major task
3. **Commit message consistency:** Leverage automatic commit message generation
4. **Code review integration:** Use codex-reviewer for quality assurance

## Script Reference

### Core Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `spawn-agents.sh` | Main orchestrator | `npm run maf:spawn-agents` |
| `init-agents.sh` | Agent initialization | `npm run maf:init-agent` |
| `test-tmux-orchestration.sh` | System testing | `npm run maf:test-orchestration` |
| `health-check.mjs` | Health monitoring | `npm run maf:health-check` |

### Utility Libraries

- **tmux-utils.sh:** Core tmux session management
- **agent-utils.sh:** Agent lifecycle operations  
- **error-handling.sh:** Centralized error handling
- **colors.sh:** Terminal color definitions

### Configuration Scripts

- **demo-config.sh:** Configuration demonstration
- **load-config-example.sh:** Example configuration loading
- **start-maf-with-config.sh:** Custom configuration startup
- **verify-integration.sh:** Integration verification

---

*Command created: 2025-11-11*
*MAF Tmux Orchestration documentation added: 2025-01-11*
