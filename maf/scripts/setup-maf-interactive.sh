#!/bin/bash
# ABOUTME: Interactive MAF setup script with repo-specific configuration.
# ABOUTME: Prompts for project details and creates proper agent topology.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# Detect project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$SCRIPT_DIR" == *"/maf/scripts" ]]; then
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
else
    PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

MAF_DIR="$PROJECT_ROOT/maf"
CREDENTIALS_DIR="$PROJECT_ROOT/.maf/credentials"
CONFIG_DIR="$PROJECT_ROOT/.maf/config"

log_info "🚀 MAF Interactive Setup"
log_info "=========================="
log_info "Project root: ${BOLD}$PROJECT_ROOT${NC}"
echo ""

# Check if MAF directory exists
if [[ ! -d "$MAF_DIR" ]]; then
    log_error "MAF directory not found at: $MAF_DIR"
    log_error "Please run this script from a project with MAF installed as a subtree."
    exit 1
fi

# Step 1: Get project information
log_step "1/7 Project Configuration"
echo ""

# Prompt for project name
PROJECT_NAME_PROMPT="${PROJECT_NAME:-}"
if [[ -z "$PROJECT_NAME_PROMPT" ]]; then
    read -p "Enter project name (e.g., nextnest, nncm): " PROJECT_NAME_PROMPT
    PROJECT_NAME_PROMPT="${PROJECT_NAME_PROMPT:-$(basename "$PROJECT_ROOT")}"
fi

# Prompt for project description
read -p "Enter project description (e.g., Mortgage System, Operations CRM): " PROJECT_DESC
PROJECT_DESC="${PROJECT_DESC:-Software project}"

log_info "Project: ${BOLD}$PROJECT_NAME_PROMPT${NC}"
log_info "Description: $PROJECT_DESC"
echo ""

# Step 2: Agent Theme Configuration
log_step "2/7 Agent Theme Configuration"
echo ""
log_info "Choose agent naming theme:"
echo "  1) Mortgage-themed (RateRidge, AuditBay, etc.)"
echo "  2) Operations-themed (OpsPeak, ComplianceCove, etc.)"
echo "  3) Geography-themed (GreenMountain, BlackDog, etc.)"
echo "  4) Custom (you'll enter names)"
echo ""
read -p "Choose theme [1-4]: " THEME_CHOICE

case "$THEME_CHOICE" in
    1)
        THEME="mortgage"
        SUPERVISOR_NAME="RateRidge"
        REVIEWER_NAME="AuditBay"
        IMP1_NAME="LedgerLeap"
        IMP2_NAME="PrimePortal"
        IMP1_DESC="Backend mortgage calculations, loan formulas, API"
        IMP2_DESC="Frontend mortgage portal, client dashboards"
        ;;
    2)
        THEME="operations"
        SUPERVISOR_NAME="OpsPeak"
        REVIEWER_NAME="ComplianceCove"
        IMP1_NAME="DataDelta"
        IMP2_NAME="FlowForge"
        IMP1_DESC="Backend data processing, OCR, email ingestion"
        IMP2_DESC="Frontend client dashboards, workflow interfaces"
        ;;
    3)
        THEME="geography"
        SUPERVISOR_NAME="GreenMountain"
        REVIEWER_NAME="BlackDog"
        IMP1_NAME="OrangePond"
        IMP2_NAME="FuchsiaCreek"
        IMP1_DESC="Backend and library implementation"
        IMP2_DESC="Frontend and site implementation"
        ;;
    4)
        THEME="custom"
        read -p "Enter supervisor name: " SUPERVISOR_NAME
        read -p "Enter reviewer name: " REVIEWER_NAME
        read -p "Enter implementor 1 name: " IMP1_NAME
        read -p "Enter implementor 2 name: " IMP2_NAME
        read -p "Enter implementor 1 description: " IMP1_DESC
        read -p "Enter implementor 2 description: " IMP2_DESC
        SUPERVISOR_NAME="${SUPERVISOR_NAME:-Coordinator}"
        REVIEWER_NAME="${REVIEWER_NAME:-Reviewer}"
        IMP1_NAME="${IMP1_NAME:-Builder1}"
        IMP2_NAME="${IMP2_NAME:-Builder2}"
        IMP1_DESC="${IMP1_DESC:-Backend implementation}"
        IMP2_DESC="${IMP2_DESC:-Frontend implementation}"
        ;;
    *)
        log_warning "Invalid choice, using geography theme"
        THEME="geography"
        SUPERVISOR_NAME="GreenMountain"
        REVIEWER_NAME="BlackDog"
        IMP1_NAME="OrangePond"
        IMP2_NAME="FuchsiaCreek"
        IMP1_DESC="Backend and library implementation"
        IMP2_DESC="Frontend and site implementation"
        ;;
esac

log_info "Agent theme: ${BOLD}$THEME${NC}"
log_info "Supervisor: ${BOLD}$SUPERVISOR_NAME${NC}"
log_info "Reviewer: ${BOLD}$REVIEWER_NAME${NC}"
log_info "Implementor 1: ${BOLD}$IMP1_NAME${NC}"
log_info "Implementor 2: ${BOLD}$IMP2_NAME${NC}"
echo ""

# Step 3: Generate unique Agent IDs
log_step "3/7 Agent ID Generation"
echo ""

# Generate agent IDs based on project hash
PROJECT_HASH=$(echo -n "$PROJECT_NAME_PROMPT" | md5sum | cut -c1-2)
ID_BASE=$((16#$PROJECT_HASH))

SUPERVISOR_ID=$((ID_BASE + 0))
REVIEWER_ID=$((ID_BASE + 1))
IMP1_ID=$((ID_BASE + 2))
IMP2_ID=$((ID_BASE + 3))

log_info "Generated Agent IDs:"
log_info "  Supervisor ($SUPERVISOR_NAME): ${BOLD}$SUPERVISOR_ID${NC}"
log_info "  Reviewer ($REVIEWER_NAME): ${BOLD}$REVIEWER_ID${NC}"
log_info "  Implementor 1 ($IMP1_NAME): ${BOLD}$IMP1_ID${NC}"
log_info "  Implementor 2 ($IMP2_NAME): ${BOLD}$IMP2_ID${NC}"
echo ""

# Step 4: Create directory structure
log_step "4/7 Creating Directory Structure"
mkdir -p "$CREDENTIALS_DIR"
mkdir -p "$CONFIG_DIR"
log_success "Directories created"
echo ""

# Step 5: Create agent topology config
log_step "5/7 Creating Agent Topology"
cat > "$CONFIG_DIR/agent-topology.json" <<EOF
{
  "\$schema": "./agent-config-schema.json",
  "version": "1.0.0",
  "pod": {
    "session": "$PROJECT_NAME_PROMPT",
    "window": "agents",
    "full_target": "$PROJECT_NAME_PROMPT:agents"
  },
  "panes": [
    {
      "index": 0,
      "role": "supervisor",
      "agent_name": "$SUPERVISOR_NAME",
      "agent_id": $SUPERVISOR_ID,
      "aliases": ["sup", "0", "$(echo "$SUPERVISOR_NAME" | head -c2 | tr '[:upper:]' '[:lower:]')"],
      "domains": ["coordination", "routing", "merge-gate"],
      "description": "Coordinates $PROJECT_DESC work, routes tasks, manages merge gate"
    },
    {
      "index": 1,
      "role": "reviewer",
      "agent_name": "$REVIEWER_NAME",
      "agent_id": $REVIEWER_ID,
      "aliases": ["rev", "1", "$(echo "$REVIEWER_NAME" | head -c2 | tr '[:upper:]' '[:lower:]')"],
      "domains": ["review", "validation", "qa"],
      "description": "Reviews work, validates receipts, approves or reopens"
    },
    {
      "index": 2,
      "role": "implementor-1",
      "agent_name": "$IMP1_NAME",
      "agent_id": $IMP1_ID,
      "aliases": ["imp1", "2", "$(echo "$IMP1_NAME" | head -c2 | tr '[:upper:]' '[:lower:]')"],
      "domains": ["backend", "api"],
      "description": "$IMP1_DESC"
    },
    {
      "index": 3,
      "role": "implementor-2",
      "agent_name": "$IMP2_NAME",
      "agent_id": $IMP2_ID,
      "aliases": ["imp2", "3", "$(echo "$IMP2_NAME" | head -c2 | tr '[:upper:]' '[:lower:]')"],
      "domains": ["frontend", "site", "portal"],
      "description": "$IMP2_DESC"
    }
  ],
  "role_to_pane": {
    "supervisor": 0,
    "reviewer": 1,
    "implementor-1": 2,
    "implementor-2": 3
  },
  "alias_to_pane": {
    "sup": 0,
    "0": 0,
    "rev": 1,
    "1": 1,
    "imp1": 2,
    "2": 2,
    "imp2": 3,
    "3": 3
  },
  "worktrees": {
    "_schema": {
      "description": "Git worktrees for implementor isolation.",
      "properties": {
        "agent_name": "Implementor agent name",
        "path": "Absolute path to worktree directory",
        "branch": "Worktree branch name",
        "created_at": "ISO timestamp of worktree creation"
      }
    }
  }
}
EOF

log_success "Agent topology created: $CONFIG_DIR/agent-topology.json"
log_info "Session name: ${BOLD}${PROJECT_NAME_PROMPT}:agents${NC}"
echo ""

# Step 6: Setup credentials
log_step "6/7 Setting Up Credentials"
echo ""

# Function to setup credential file
setup_credential() {
    local cred_name="$1"
    local env_var="$2"
    local example_file="$3"
    local target_file="$4"

    # Check if environment variable is set
    if [[ -n "${!env_var:-}" ]]; then
        echo "$cred_name=${!env_var}" > "$target_file"
        chmod 600 "$target_file"
        log_success "$cred_name configured from environment variable \$$env_var"
        return 0
    fi

    # Check if file already exists
    if [[ -f "$target_file" ]]; then
        log_info "$cred_name file already exists: $target_file"
        return 0
    fi

    # Check if example file exists
    if [[ -f "$example_file" ]]; then
        cp "$example_file" "$target_file"
        chmod 600 "$target_file"
        log_warning "$cred_name file created from template: $target_file"
        log_warning "Please edit this file and add your $cred_name"
        log_info "  Or set $env_var environment variable and re-run this script"
        return 1
    fi

    # Create empty template
    echo "${cred_name}=your_${cred_name}_here" > "$target_file"
    chmod 600 "$target_file"
    log_warning "$cred_name file created: $target_file"
    log_warning "Please edit this file and add your $cred_name"
    log_info "  Or set $env_var environment variable and re-run this script"
    return 1
}

# Setup OpenAI API key
setup_credential \
    "OPENAI_API_KEY" \
    "OPENAI_API_KEY" \
    "$MAF_DIR/.maf/credentials/openai.env.example" \
    "$CREDENTIALS_DIR/openai.env"

# Setup GitHub token (optional)
setup_credential \
    "GITHUB_TOKEN" \
    "GITHUB_TOKEN" \
    "$MAF_DIR/.maf/credentials/github.env.example" \
    "$CREDENTIALS_DIR/github.env" || true

# Setup Anthropic API key if ANTHROPIC_API_KEY is set (optional)
if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
    setup_credential \
        "ANTHROPIC_API_KEY" \
        "ANTHROPIC_API_KEY" \
        "$MAF_DIR/.maf/credentials/anthropic.env.example" \
        "$CREDENTIALS_DIR/anthropic.env" || true
fi

echo ""

# Step 7: Install External Dependencies (Optional)
log_step "7/8 External Dependencies"
echo ""
log_info "MAF can optionally install external tools for enhanced functionality:"
echo "  • bd - Beads CLI for task tracking"
echo "  • bv - Beads TUI viewer (interactive interface)"
echo "  • memlayer - Enhanced agent memory"
echo ""
read -p "Install external dependencies? (y/N): " INSTALL_DEPS

if [[ "$INSTALL_DEPS" =~ ^[Yy]$ ]]; then
    # Install Beads CLI (bd)
    log_info "Installing Beads CLI (bd)..."
    if npm list -g @beads/bd >/dev/null 2>&1; then
        log_warning "@beads/bd already installed globally"
        bd --version
    else
        if npm install -g @beads/bd 2>&1; then
            log_success "@beads/bd installed"
            bd --version
        else
            log_error "Failed to install @beads/bd"
        fi
    fi
    echo ""

    # Install Beads TUI Viewer (bv)
    log_info "Installing Beads TUI Viewer (bv)..."
    if command -v bv >/dev/null 2>&1; then
        log_warning "bv already installed"
        bv --version
    else
        log_info "Downloading and installing bv..."
        if curl -fsSL "https://raw.githubusercontent.com/Dicklesworthstone/beads_viewer/main/install.sh?$(date +%s)" -o /tmp/install-bv.sh 2>/dev/null; then
            if bash /tmp/install-bv.sh 2>&1; then
                log_success "bv installed"
                bv --version
                rm -f /tmp/install-bv.sh
            else
                log_error "Failed to install bv (non-critical)"
            fi
        else
            log_error "Failed to download bv installer (non-critical)"
        fi
    fi
    echo ""

    # Install Memlayer (optional)
    read -p "Install memlayer for enhanced agent memory? (y/N): " INSTALL_MEMLAYER
    if [[ "$INSTALL_MEMLAYER" =~ ^[Yy]$ ]]; then
        log_info "Installing memlayer..."
        VENV_PATH="$PROJECT_ROOT/venv_memlayer"

        if [[ -d "$VENV_PATH" ]]; then
            log_warning "venv_memlayer already exists"
        else
            if python3 -m venv "$VENV_PATH" 2>/dev/null; then
                source "$VENV_PATH/bin/activate"
                if pip install memlayer >/dev/null 2>&1; then
                    log_success "memlayer installed to $VENV_PATH"

                    # Apply MAF compatibility patches
                    if [[ -f "$MAF_DIR/scripts/maf/memlayer-patch.sh" ]]; then
                        log_info "Applying MAF compatibility patches..."
                        bash "$MAF_DIR/scripts/maf/memlayer-patch.sh"
                    fi

                    deactivate
                else
                    log_error "Failed to install memlayer"
                fi
            else
                log_error "Failed to create Python virtual environment"
            fi
        fi
    else
        log_info "Skipping memlayer (optional)"
    fi
    echo ""
else
    log_info "Skipping external dependencies"
    log_info "You can install them later using the commands in maf/SETUP.md"
    echo ""
fi

# Step 8: Create .gitignore for credentials
log_step "8/8 Git Configuration"
GITIGNORE_FILE="$PROJECT_ROOT/.maf/.gitignore"
if [[ ! -f "$GITIGNORE_FILE" ]]; then
    mkdir -p "$(dirname "$GITIGNORE_FILE")"
    cat > "$GITIGNORE_FILE" <<'EOF'
# MAF local state
credentials/
*.env
*.db
*.lock
logs/
state/
EOF
    log_success "Created .maf/.gitignore"
else
    log_info ".maf/.gitignore already exists"
fi
echo ""

# Summary
echo "========================================"
log_success "✅ MAF Setup Complete!"
echo ""
log_info "${BOLD}Project Configuration:${NC}"
echo "  Name: $PROJECT_NAME_PROMPT"
echo "  Description: $PROJECT_DESC"
echo ""
log_info "${BOLD}Agent Team:${NC}"
echo "  Session: ${PROJECT_NAME_PROMPT}:agents"
echo "  Supervisor: $SUPERVISOR_NAME (ID: $SUPERVISOR_ID)"
echo "  Reviewer: $REVIEWER_NAME (ID: $REVIEWER_ID)"
echo "  Implementor 1: $IMP1_NAME (ID: $IMP1_ID)"
echo "  Implementor 2: $IMP2_NAME (ID: $IMP2_ID)"
echo ""

# Show external dependencies status
if [[ "${INSTALL_DEPS:-}" =~ ^[Yy]$ ]]; then
    log_info "${BOLD}External Dependencies:${NC}"
    echo "  bd: $(command -v bd >/dev/null 2>&1 && echo "✅ Installed ($(bd --version 2>/dev/null || echo "unknown"))" || echo "❌ Not installed")"
    echo "  bv: $(command -v bv >/dev/null 2>&1 && echo "✅ Installed ($(bv --version 2>/dev/null || echo "unknown"))" || echo "❌ Not installed")"
    if [[ "${INSTALL_MEMLAYER:-}" =~ ^[Yy]$ ]]; then
        echo "  memlayer: $([ -d "$PROJECT_ROOT/venv_memlayer" ] && echo "✅ Installed" || echo "❌ Not installed")"
    fi
    echo ""
fi

log_info "${BOLD}Next Steps:${NC}"
echo "  1. (Optional) Add credentials:"
echo "     nano .maf/credentials/openai.env"
echo ""
echo "  2. Initialize Agent Mail:"
echo "     bash maf/scripts/maf/bootstrap-agent-mail.sh install"
echo ""
echo "  3. Install dependencies:"
echo "     pnpm install"
echo ""

# Skip spawn step if deps weren't installed
if [[ ! "${INSTALL_DEPS:-}" =~ ^[Yy]$ ]]; then
    echo "  4. (Optional) Install external tools:"
    echo "     See maf/SETUP.md Section 6 for beads (bd/bv)"
    echo "     See maf/SETUP.md Section 7 for memlayer"
    echo ""
fi

echo "  5. Spawn your agents (4-pane team):"
echo "     bash maf/scripts/maf/spawn-agents.sh --layout default_4_pane --workers 4 --background"
echo ""
echo "  6. Attach to agent session:"
echo "     tmux attach -t ${PROJECT_NAME_PROMPT}:agents"
echo ""
log_info "${BOLD}Useful Commands:${NC}"
echo "  - Check health:    bash maf/scripts/maf/context-manager-v2.sh status"
echo "  - List sessions:    tmux ls"
echo "  - Send message:    bash maf/scripts/maf/prompt-agent.sh sup \"Check mail\""
echo "  - Kill all agents:  tmux kill-server"
echo ""
echo "========================================"
