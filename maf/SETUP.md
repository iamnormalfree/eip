# MAF Setup Guide

Complete guide to adding MAF (Multi-Agent Framework) to your repository.

## What is MAF?

MAF is a sophisticated autonomous agent orchestration system that enables AI agents to work collaboratively on your codebase. It includes:

- **Core Library**: Orchestration engine, scheduling, decision-making
- **Response Awareness**: Metacognitive workflow system for complex tasks
- **Operational Scripts**: 170+ scripts for agent coordination
- **MCP Agent Mail**: Inter-agent communication layer
- **Beads Integration**: Task tracking and management
- **Monitoring**: Context management and health checks

## Vendor Architecture

MAF uses **git subtrees** to manage external dependencies:

- **vendor/agent-mail/** - MCP Agent Mail (inter-agent communication)
- **maf/** - MAF core library (orchestration, scripts, skills)

**Why Subtrees?**
- Clean separation between MAF and external dependencies
- No extra `.gitmodules` file (unlike submodules)
- Automatic updates for franchisees (no `git submodule update` needed)
- Franchisees can customize vendor code via patch system

See [docs/VENDOR_ARCHITECTURE.md](docs/VENDOR_ARCHITECTURE.md) for complete vendor management guide.

## Quick Start (5 minutes)

### Option A: Automated Setup (Recommended)

After adding MAF as a subtree, run the automated setup script:

```bash
# From your repository root (after adding MAF subtree)
bash maf/scripts/setup-maf.sh
```

**The script will:**
- Create all necessary directories and config files
- Detect and use environment variables for credentials (e.g., `OPENAI_API_KEY`)
- Fall back to credential files if env vars not set
- Initialize Agent Mail (from vendor/agent-mail)
- Install dependencies
- Validate the installation

**Using Environment Variables:**
```bash
# Set your API keys as environment variables (script will auto-detect)
export OPENAI_API_KEY=sk-your-key-here
export GITHUB_TOKEN=ghp-your-token-here

# Then run the setup script
bash maf/scripts/setup-maf.sh
```

### Option B: Manual Setup

If you prefer manual setup or need to customize each step:

### 1. Add MAF to Your Repository

```bash
# From your repository root
git subtree add --prefix=maf https://github.com/iamnormalfree/maf main --squash
```

This creates a `maf/` directory with everything needed.

### 2. Configure Your Agent Team

```bash
# Copy and customize agent topology
mkdir -p .maf/config
cp maf/.maf/config/agent-topology.json.example .maf/config/agent-topology.json

# Edit for your needs (number of agents, their roles)
nano .maf/config/agent-topology.json
```

### 3. Add Credentials

**Option 1: Use Environment Variables (Recommended)**
```bash
# Export your API keys (add to ~/.bashrc or ~/.zshrc for persistence)
export OPENAI_API_KEY=sk-your-key-here
export GITHUB_TOKEN=ghp-your-token-here
```

**Option 2: Use Credential Files**
```bash
# Create credentials directory
mkdir -p .maf/credentials

# Copy example files
cp maf/.maf/credentials/*.example .maf/credentials/

# Add your actual API keys
nano .maf/credentials/openai.env
nano .maf/credentials/github.env
```

### 4. Initialize Agent Mail

Agent Mail is installed as a git subtree at `vendor/agent-mail/`.

```bash
bash maf/scripts/maf/bootstrap-agent-mail.sh
```

This will:
- Check if vendor/agent-mail exists
- Install Python dependencies
- Start the Agent Mail server
- Create .agent-mail/ directory for local state

### 5. Install Dependencies

```bash
pnpm install
```

### 6. Install Beads System (Optional but Recommended)

The **Beads** system provides task tracking and dependency management for agents. It includes TWO tools:

**A. Beads CLI (`bd`)** - Command-line interface
```bash
# Install the beads CLI globally
npm install -g @beads/bd

# Verify installation
bd --version
# Should show: bd version 0.x.x

# Initialize beads in your project
bd init
```

**B. Beads TUI Viewer (`bv`)** - Interactive terminal interface
```bash
# Install the beads TUI viewer (Go binary)
curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/beads_viewer/main/install.sh?$(date +%s)" | bash

# Verify installation
bv --version
# Should show: bv v0.x.x

# Launch the TUI (auto-watches .beads/beads.jsonl)
bv
```

**What is Beads?**
- Lightweight issue tracker designed for AI agents
- Dependency tracking between tasks (DAG-based)
- SQLite-based with Git integration
- Used by MAF agents to track work and manage epic-level projects

**Common Commands:**

**CLI (`bd`)**:
```bash
bd ready                    # Show ready-to-work tasks
bd triage                   # Get task recommendations
bd plan                     # Show parallel execution tracks
bd close <id>               # Close a completed task
bd --robot-next             # Get single top recommendation
bd --help                   # See all commands
```

**TUI (`bv`)** - Interactive viewer with:
- Vim-style navigation (j/k keys)
- Multiple views (list, Kanban, graph)
- Live file watching (auto-refreshes)
- PageRank and dependency metrics
```bash
bv                          # Launch TUI
bv --robot-triage           # Show triage in JSON format
bv --robot-insights         # Show graph metrics
```

### 7. Install Memlayer (Optional - For Enhanced Agent Memory)

**Memlayer** provides persistent memory and context management for agents.

```bash
# Create Python virtual environment for memlayer
python3 -m venv venv_memlayer

# Activate and install
source venv_memlayer/bin/activate
pip install memlayer

# Apply MAF compatibility patches
bash maf/scripts/maf/memlayer-patch.sh

# Deactivate when done
deactivate
```

**What is Memlayer?**
- Long-term memory storage for agent conversations
- Context persistence across sessions
- Enables agents to recall previous work and decisions
- Integrates with MCP Agent Mail for seamless memory access

**Note**: Memlayer is optional. MAF works without it, but agents will have limited memory across sessions.

### 8. Spawn Your First Agents

```bash
bash maf/scripts/maf/spawn-agents.sh --layout minimal_2_pane --workers 2
```

That's it! You now have autonomous agents ready to work on your codebase.

## What Gets Installed

```
your-repo/
├── maf/                          # MAF subtree (shared code)
│   ├── lib/maf/                  # Core library
│   ├── .claude/                  # Response Awareness
│   │   ├── skills/               # All metacognitive skills
│   │   ├── agents/               # Specialized agents
│   │   └── commands/             # Entry point commands
│   ├── scripts/maf/              # Operational scripts
│   │   ├── lib/                  # Helper libraries
│   │   ├── prompt-agent.sh       # Agent communication
│   │   ├── spawn-agents.sh       # Start agents
│   │   ├── context-manager-v2.sh # Monitoring
│   │   ├── governance/           # Proposal workflow
│   │   └── maintenance/          # Automation
│   ├── .maf/config/              # Configuration examples
│   └── SETUP.md                  # This file
│
├── vendor/                       # External dependencies (git subtrees)
│   └── agent-mail/               # MCP Agent Mail subtree
│       ├── mcp_agent_mail/       # Agent Mail source code
│       └── pyproject.toml        # Python project config
│
├── .maf/                         # Your local configuration (gitignored)
│   ├── config/
│   │   └── agent-topology.json   # Your team structure
│   ├── patches/                  # Your custom vendor patches
│   └── credentials/              # Your API keys (gitignored)
│
├── .claude/                      # Claude skills (merged from MAF + your custom)
│   ├── .maf-manifest.json        # MAF file ownership tracking
│   ├── skills/                   # MAF-managed + your custom skills
│   └── your-custom-skill/        # Your franchisee-owned skills
│
├── .beads/                       # Your task tracking (if using Beads)
│
└── your existing code/           # Your project code
```

## Customization Rules

### MUST Customize (Required for each repo):

**Agent Team Structure** (`.maf/config/agent-topology.json`):
```json
{
  "panes": [
    {"index": 0, "role": "supervisor", "agent_name": "GreenMountain"},
    {"index": 1, "role": "reviewer", "agent_name": "BlackDog"},
    {"index": 2, "role": "implementor-1", "agent_name": "OrangePond"},
    {"index": 3, "role": "implementor-2", "agent_name": "FuchsiaCreek"}
  ]
}
```

Adjust based on your needs:
- 2-pane minimal: supervisor + 1 implementor
- 4-pane full: supervisor + reviewer + 2 implementors

**API Credentials** (`.maf/credentials/openai.env`):
```
OPENAI_API_KEY=sk-your-key-here
```

### MAY Customize (Optional, with care):

**Repo-Specific Skills** (`.claude/skills/`):
```bash
# Add your domain-specific skills
mkdir -p .claude/skills/my-domain
# Custom skills for your specific needs
```

**Agent Behavior** (`.maf/config/custom-agent-config.json`):
```bash
cp maf/.maf/config/default-agent-config.json .maf/config/custom-agent-config.json
# Adjust agent parameters
```

**Agent Specialization** (`.maf/agents/`):
```bash
# Create specialized prompts for each agent
mkdir -p .maf/agents

# Create role-specific prompts for your agents
# Example: Supervisor prompt for coordination logic
cat > .maf/agents/mysupervisor-prompt.md << 'EOF'
# MySupervisor - Project Coordinator Agent

You are **MySupervisor**, the coordinator agent for my project.

## Your Responsibilities
- Route tasks to appropriate implementors
- Coordinate overall progress
- Resolve blockers
- Manage merge gate

## Decision Routing Logic
When a task comes in, classify it by type:
- Backend tasks → Implementor-1
- Frontend tasks → Implementor-2
- Review needed → Reviewer
EOF

# Example: Implementor prompt with Response-Awareness
cat > .maf/agents/myimplementor-prompt.md << 'EOF'
# MyImplementor - Backend Implementor

## Mandatory Workflow: Response-Awareness

For ALL implementation tasks, you **MUST** start with:

/response-awareness "Implement [task description]"

This ensures proper orchestration through the 6-phase workflow.
EOF
```

**Agent Specialization Features:**
- **Role-specific prompts**: Each agent gets domain expertise
- **Automatic loading**: `rebuild-maf-cli-agents.sh` detects and loads prompts
- **Environment variables**: `AGENT_NAME` and `AGENT_PROMPT_FILE` available to agents
- **Best practices**: See `.maf/agents/README.md` for detailed guide

**Example**: Nextnest mortgage system uses:
- RateRidge (Supervisor) - mortgage coordination logic
- AuditBay (Reviewer) - Playwright visual review
- LedgerLeap (Imp-1) - backend with response-awareness
- PrimePortal (Imp-2) - frontend with response-awareness

### SHOULD NOT Customize (Use as-is):

**Core Library** (`maf/lib/maf/`): Always use from subtree
**Helper Scripts** (`maf/scripts/maf/lib/`): tmux-utils.sh, agent-utils.sh, error-handling.sh
**Agent Prompting** (`maf/scripts/maf/prompt-agent.sh`): Critical for coordination
**Response Awareness** (`maf/.claude/skills/response-awareness*`): Core workflow

## Updating MAF

MAF uses git subtrees for both core code and vendor dependencies. When updating:

```bash
# Update MAF core
git subtree pull --prefix=maf https://github.com/iamnormalfree/maf main --squash

# Update vendor dependencies (Agent Mail, etc.)
git subtree pull --prefix=vendor/agent-mail \
    https://github.com/Dicklesworthstone/mcp_agent_mail main --squash

# Or use automated update script (recommended)
bash scripts/franchisee-update.sh all
```

The automated script will:
- Create restore point before updating
- Pull latest code from MAF and vendors
- Re-apply your custom vendor patches
- Merge .claude/ directories (preserves your customizations)
- Run health checks
- Roll back on failure

**After updating:**
```bash
# Review what changed
git log --oneline -10

# Test your agents still work
bash maf/scripts/maf/spawn-agents.sh --layout minimal_2_pane --agents 2
```

See [docs/VENDOR_ARCHITECTURE.md](docs/VENDOR_ARCHITECTURE.md) for complete update guide.

## Agent Workflows

### Basic Workflow

```bash
# 1. Spawn agents
bash maf/scripts/maf/spawn-agents.sh

# 2. Assign work (via Agent Mail or Beads)
bd ready  # If using Beads

# 3. Monitor progress
tmux attach -t maf-cli:agents

# 4. Agents use Response Awareness for complex tasks
# (Automatically invoked by implementors)

# 5. Review and complete
bash maf/scripts/maf/receipt.sh
```

### Using Response Awareness

Implementors automatically use Response Awareness for bead implementation:

```bash
# In agent conversation:
"I'm implementing bead ABC-123"

# Agent automatically:
# 1. Invokes /response-awareness
# 2. Goes through 6-phase workflow
# 3. Uses specialized subagents
# 4. Generates metacognitive tags
# 5. Completes with verification
```

## Common Tasks

### Check Agent Health

```bash
bash maf/scripts/maf/context-manager-v2.sh status
```

### Send Message to Agent

```bash
bash maf/scripts/maf/prompt-agent.sh supervisor "Check Agent Mail for new tasks"
```

### Generate Completion Receipt

```bash
bash maf/scripts/maf/receipt.sh <bead-id>
```

### View Agent Dashboard

```bash
pnpm maf:dashboard
```

## Troubleshooting

### Agents Won't Spawn

```bash
# Check tmux
tmux ls

# Check for existing sessions
bash maf/scripts/maf/session-cleanup.sh

# Try again
bash maf/scripts/maf/spawn-agents.sh
```

### MCP Agent Mail Not Working

```bash
# Check server is running
bash maf/scripts/maf/bootstrap-agent-mail.sh

# Check logs
cat .agent-mail/server.log | tail -50
```

### Scripts Not Found

```bash
# Verify MAF subtree is present
ls -la maf/

# If missing, add it
git subtree add --prefix=maf https://github.com/yourorg/maf main --squash
```

## Telegram Bot Integration (Optional)

MAF includes a Telegram bot for remote agent coordination and monitoring.

### Creating Your Bot

**Step 1: Create a Telegram Bot**

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts to:
   - Choose a name for your bot (e.g., "MyProject MAF Bot")
   - Choose a username (e.g., `myproject_maf_bot`)
4. **Copy the bot token** (format: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`)

**Step 2: (Optional) Customize Your Bot**

- Set description: `/setdescription`
- Set about text: `/setabouttext`
- Set profile picture: `/setuserpic`
- Enable commands: `/setcommands`

### Setup

```bash
# 1. Configure the bot token
cp maf/.agent-mail/telegram.env.example .agent-mail/telegram.env
# Edit .agent-mail/telegram.env and set your bot token:
# TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
chmod 600 .agent-mail/telegram.env

# 2. Install the service (requires sudo)
sudo maf/scripts/setup-telegram-bot.sh

# 3. Start the bot
maf/scripts/manage-telegram-bot.sh start
```

**Important Security Notes:**
- Never commit `telegram.env` to git (it's in `.gitignore`)
- Keep your bot token secret
- The bot token allows full control of your bot
- If leaked, use `/revoke` in BotFather to generate a new token

### Available Commands

Once your bot is running, send these commands to it in Telegram:

- `/start` - Initialize the bot
- `/broadcast` - Execute broadcast-role-prompts.sh
- `/broadcast-pack` - Show/set the active prompt pack
- `/broadcast-targeted` - Prompt only the roles that need action
- `/activity` - Check agent activity
- `/snapshot` - Beads snapshot + tmux activity
- `/stale` - Stale in-progress beads (default: 3 days)
- `/status` - System status

### Management Commands

```bash
# Start the bot
maf/scripts/manage-telegram-bot.sh start

# Stop the bot
maf/scripts/manage-telegram-bot.sh stop

# Restart the bot
maf/scripts/manage-telegram-bot.sh restart

# Check status
maf/scripts/manage-telegram-bot.sh status

# View logs
maf/scripts/manage-telegram-bot.sh logs

# Test locally (not as service)
maf/scripts/manage-telegram-bot.sh test

# Uninstall service
sudo maf/scripts/manage-telegram-bot.sh uninstall
```

See [docs/telegram-maf-setup.md](docs/telegram-maf-setup.md) for complete guide.

## Next Steps

1. **Read the agent operations guide**: [agents.md](agents.md) - Guardrails, workflows, spawning
2. **Read the Claude operations guide**: [claude.md](claude.md) - Response Awareness, skills, commands
3. **Explore Response Awareness**: `.claude/skills/`
4. **Customize your agent team**: Edit `.maf/config/agent-topology.json`
5. **Set up Telegram bot** (optional): See above
6. **Join the community**: github.com/yourorg/maf/discussions

## Support

- **Issues**: github.com/yourorg/maf/issues
- **Discussions**: github.com/yourorg/maf/discussions
- **Documentation**: See [docs/](docs/) directory for runbooks and architecture plans
