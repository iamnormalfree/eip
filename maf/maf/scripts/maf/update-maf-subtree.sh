#!/bin/bash
# update-maf-subtree.sh - Pull latest MAF subtree updates
# USAGE:
#   From project root: bash maf/scripts/maf/update-maf-subtree.sh
#   From anywhere:     bash /path/to/maf/scripts/maf/update-maf-subtree.sh

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
  echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
}

error() {
  echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1"
  exit 1
}

info() {
  echo -e "${BLUE}[$(date '+%H:%M:%S')] INFO:${NC} $1"
}

# Detect project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [[ -z "$PROJECT_ROOT" ]]; then
  error "Not in a git repository. Please run from a git repo."
fi

log "Project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

# Check if this is a subtree install
if [[ -d "maf" && -f "maf/README.md" ]]; then
  log "MAF subtree detected at maf/"
  SUBTREE_PREFIX="maf"
elif [[ -f "README.md" ]] && grep -q "MAF (Multi-Agent Framework)" README.md 2>/dev/null; then
  # We're inside the MAF repo itself
  warn "You're inside the MAF repository itself."
  echo "This script is for consumer projects, not MAF HQ."
  echo "If you're MAF HQ, use git pull directly."
  exit 1
else
  error "MAF subtree not found. Please install MAF first."
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  warn "You have uncommitted changes."
  echo ""
  echo "Options:"
  echo "  1. Stash changes: git stash"
  echo "  2. Commit changes: git commit -am 'message'"
  echo "  3. Discard changes: git checkout ."
  echo ""
  read -p "Continue with stash? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Stashing changes..."
    git stash
  else
    error "Uncommitted changes. Please commit or stash first."
  fi
fi

log "Checking MAF subtree structure..."

# Check structure - detect both correct and incorrect setups
HAS_CORRECT_STRUCTURE=false
HAS_NESTED_STRUCTURE=false

if [[ -f "maf/README.md" ]]; then
  # Check if files are at maf/ level (correct)
  if [[ -f "maf/scripts/maf/start-3agent-bdd.sh" ]]; then
    HAS_CORRECT_STRUCTURE=true
    log "✅ Correct structure detected: maf/README.md exists"
  fi
fi

if [[ -d "maf/maf" && -f "maf/maf/README.md" ]]; then
  # Check if nested maf/maf/ exists (incorrect)
  HAS_NESTED_STRUCTURE=true
  warn "⚠️  Nested structure detected: maf/maf/ exists"
fi

# Determine how to pull based on structure
MAF_REMOTE_URL="https://github.com/iamnormalfree/maf.git"
MAF_BRANCH="main"

if [[ "$HAS_CORRECT_STRUCTURE" == "true" && "$HAS_NESTED_STRUCTURE" == "false" ]]; then
  # Correct structure - pull from inside maf/
  log "✅ Structure is correct. Pulling from inside maf/ directory..."
  echo ""
  info "Command: cd maf && git subtree pull --prefix=. $MAF_REMOTE_URL $MAF_BRANCH --squash && cd .."
  echo ""

  (
    cd maf
    git subtree pull --prefix=. "$MAF_REMOTE_URL" "$MAF_BRANCH" --squash
  )

  log "✅ MAF subtree updated successfully!"

elif [[ "$HAS_NESTED_STRUCTURE" == "true" ]]; then
  # Nested structure detected - DON'T auto-fix, just inform
  error "Nested maf/maf/ structure detected.

Your subtree was pulled incorrectly, creating maf/maf/ instead of maf/.

To fix this MANUALLY, run:

  # From your project root:
  git rm -r maf/maf
  git commit -m \"Remove incorrect subtree structure\"
  rm -rf maf/maf

  # Then pull correctly:
  cd maf
  git subtree add --prefix=. $MAF_REMOTE_URL $MAF_BRANCH --squash
  cd ..

See: docs/runbooks/MANAGE_SUBTREE.md for detailed instructions.
"

else
  # Unknown structure
  error "Unable to detect subtree structure. Please check your MAF installation.

Files expected at maf/README.md or maf/scripts/maf/
Current directory contents: $(ls -la maf/ | head -20)"
fi

# Show what changed
log "Summary of changes:"
git log --oneline -5

echo ""
log "Next steps:"
echo "  1. Review changes: git diff HEAD@{1}"
echo "  2. Check for new features in docs/"
echo "  3. Update custom configs if needed"
echo "  4. Test: bash maf/scripts/maf/bdd-status.sh"
echo ""
info "For detailed subtree management, see: docs/runbooks/MANAGE_SUBTREE.md"

