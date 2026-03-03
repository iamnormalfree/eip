#!/bin/bash
# ABOUTME: Contribute changes from MAF subtree to MAF HQ via PR
# ABOUTME: Handles fork creation, branch management, and PR submission

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[CONTRIB]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BOLD}[STEP]${NC} $1"; }

# Cleanup temp dirs
TMP_DIR=""
cleanup() {
    if [[ -n "${TMP_DIR:-}" ]] && [[ -d "${TMP_DIR:-}" ]]; then
        rm -rf "$TMP_DIR" 2>/dev/null || true
    fi
}
trap cleanup EXIT

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository. Please run from your project root."
    exit 1
fi

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
cd "$PROJECT_ROOT"

# Parse arguments
PR_TITLE="${1:-}"
PR_BODY="${2:-}"

if [[ -z "$PR_TITLE" ]]; then
    cat << EOF
╔════════════════════════════════════════════════════════════╗
║           MAF Contribution Helper                          ║
║     Submit changes from maf/ subtree to MAF HQ            ║
╚════════════════════════════════════════════════════════════╝

Usage: $0 "<PR Title>" ["PR Description"]

Example:
  $0 "Add custom debugging skill" "This skill helps with..."

What this script does:
  1. Detects your changes in the maf/ subtree
  2. Creates a feature branch
  3. Commits your changes
  4. Pushes to your GitHub fork
  5. Opens a PR to MAF HQ

Requirements:
  - GitHub CLI installed (gh)
  - Authenticated with: gh auth login
  - Changes in maf/ directory to contribute

EOF
    exit 0
fi

# Check for GitHub CLI
if ! command -v gh > /dev/null 2>&1; then
    log_error "GitHub CLI (gh) is required but not installed."
    log_info "Install from: https://cli.github.com/"
    log_info "Then authenticate with: gh auth login"
    exit 1
fi

# Check authentication
if ! gh auth status > /dev/null 2>&1; then
    log_error "Not authenticated with GitHub CLI."
    log_info "Run: gh auth login"
    exit 1
fi

# Get GitHub username
GITHUB_USERNAME=$(gh api user --jq '.login' 2>/dev/null || echo "")
if [[ -z "$GITHUB_USERNAME" ]]; then
    log_error "Could not determine GitHub username."
    log_info "Make sure you're authenticated: gh auth login"
    exit 1
fi

log_info "Authenticated as: $GITHUB_USERNAME"
echo

# Step 1: Detect changes to contribute (works in both franchisee and HQ repos)
log_step "1/6: Detecting MAF changes to contribute..."

# Franchisee repo: `maf/` is a subtree prefix.
# HQ repo: repository root is MAF itself (no `maf/` directory).
SUBTREE_PREFIX=""
if [[ -d "$PROJECT_ROOT/maf/scripts/maf" ]]; then
    SUBTREE_PREFIX="maf"
fi

if [[ -n "$SUBTREE_PREFIX" ]]; then
    log_info "Mode: franchisee (subtree at maf/)"
    CHANGE_PATHSPEC="maf/"
    DIFF_RELATIVE_ARGS=(--relative=maf)
else
    log_info "Mode: MAF HQ (direct repo layout)"
    CHANGE_PATHSPEC="."
    DIFF_RELATIVE_ARGS=()
fi

# Refuse untracked files in the contribution set (patch cannot include them safely).
UNTRACKED_COUNT="$(git ls-files --others --exclude-standard -- "$CHANGE_PATHSPEC" | wc -l | tr -d ' ')"
if [[ "$UNTRACKED_COUNT" != "0" ]]; then
    log_error "Untracked files detected under $CHANGE_PATHSPEC."
    log_info "Please stage or remove them before running contrib:"
    log_info "  git add <files>   # or delete if accidental"
    git ls-files --others --exclude-standard -- "$CHANGE_PATHSPEC" | head -20
    exit 1
fi

# Check for changes (staged OR unstaged) under the contribution path.
if git diff --quiet -- "$CHANGE_PATHSPEC" && git diff --cached --quiet -- "$CHANGE_PATHSPEC"; then
    log_error "No changes detected under $CHANGE_PATHSPEC."
    log_info "Make your edits first, then run this script."
    if [[ -n "$SUBTREE_PREFIX" ]]; then
        log_info "Example: vim maf/scripts/maf/health-check.sh"
    else
        log_info "Example: vim scripts/maf/health-check.sh"
    fi
    exit 1
fi

log_info "Changes detected (first 40):"
git diff --name-status -- "$CHANGE_PATHSPEC" | head -40
git diff --cached --name-status -- "$CHANGE_PATHSPEC" | head -40
echo

# Step 2: Get or create fork
log_step "2/6: Checking for your fork..."

MAF_HQ_REPO="iamnormalfree/maf"
YOUR_FORK="${GITHUB_USERNAME}/maf"

# Check if user is repo owner
IS_REPO_OWNER=false
if [[ "$YOUR_FORK" == "$MAF_HQ_REPO" ]]; then
    IS_REPO_OWNER=true
    log_info "Mode: Repo Owner (direct to MAF HQ, no fork needed)"
    log_info "This still creates a PR for review - maintains franchisee model"
else
    log_info "Mode: Franchisee (via fork)"
fi

if [[ "$IS_REPO_OWNER" == false ]]; then
    # Check if fork exists
    FORK_EXISTS=$(gh repo view "$YOUR_FORK" --json name --jq '.name' 2>/dev/null || echo "")

    if [[ -z "$FORK_EXISTS" ]]; then
        log_warning "Fork not found at: $YOUR_FORK"
        echo
        read -rp "Create fork now? [y/N]: " -n 1 create_fork
        echo

        if [[ "$create_fork" =~ ^[Yy]$ ]]; then
            log_info "Creating fork from $MAF_HQ_REPO..."
            if gh repo fork "$MAF_HQ_REPO" --clone=false 2>/dev/null; then
                log_success "Fork created: $YOUR_FORK"
            else
                log_error "Failed to create fork."
                log_info "You can create it manually at: https://github.com/$MAF_HQ_REPO/fork"
                exit 1
            fi
        else
            log_error "Cannot proceed without a fork."
            exit 1
        fi
    else
        log_success "Fork found: $YOUR_FORK"
    fi
fi
echo

# Step 3: Create branch in your fork of MAF HQ
log_step "3/6: Creating feature branch..."

# Generate branch name from PR title
BRANCH_NAME=$(echo "$PR_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50)
BRANCH_NAME="feature/${BRANCH_NAME}-$(date +%Y%m%d)"

log_info "Branch name: $BRANCH_NAME"

# Work in a temp clone of MAF HQ so we can submit a clean PR.
TMP_DIR="$(mktemp -d -t maf-contrib-XXXXXXXX)"
CLONE_DIR="$TMP_DIR/maf"

log_info "Cloning MAF HQ into: $CLONE_DIR"
gh repo clone "$MAF_HQ_REPO" "$CLONE_DIR" -- --quiet

cd "$CLONE_DIR"
git checkout -b "$BRANCH_NAME" origin/main
log_success "Created branch in clone: $BRANCH_NAME"
echo

# Step 4: Apply patch and commit
log_step "4/6: Applying your changes and committing..."

PATCH_FILE="$TMP_DIR/maf-contrib.patch"
cd "$PROJECT_ROOT"

# Build patch from staged + unstaged changes (tracked files only).
git diff --binary "${DIFF_RELATIVE_ARGS[@]}" -- "$CHANGE_PATHSPEC" > "$PATCH_FILE"
git diff --binary "${DIFF_RELATIVE_ARGS[@]}" --cached -- "$CHANGE_PATHSPEC" >> "$PATCH_FILE"

cd "$CLONE_DIR"
if [[ ! -s "$PATCH_FILE" ]]; then
    log_error "Internal error: patch file is empty."
    exit 1
fi

if git apply --index --3way "$PATCH_FILE"; then
    log_success "Patch applied cleanly"
else
    log_error "Patch failed to apply cleanly."
    log_info "Patch file: $PATCH_FILE"
    log_info "Resolve conflicts in $CLONE_DIR, then commit and push manually."
    exit 1
fi

log_info "Changes to be committed:"
git diff --cached --name-status
echo

# Default commit message
COMMIT_MSG="feat: $PR_TITLE"

git commit -m "$COMMIT_MSG"
log_success "Committed to clone"
echo

# Step 5: Push branch
log_step "5/6: Pushing feature branch..."

if [[ "$IS_REPO_OWNER" == true ]]; then
    # Repo owner: push directly to origin (MAF HQ)
    log_info "Pushing to $MAF_HQ_REPO..."
    if git push -u origin "$BRANCH_NAME" --force-with-lease; then
        log_success "Pushed to MAF HQ"
    else
        log_error "Failed to push to MAF HQ."
        log_info "Check your authentication: gh auth status"
        exit 1
    fi
else
    # Franchisee: push to fork
    FORK_REMOTE="fork"
    if ! git remote | grep -q "^${FORK_REMOTE}$"; then
        log_info "Adding remote 'fork' for $YOUR_FORK..."
        git remote add "$FORK_REMOTE" "https://github.com/$YOUR_FORK.git"
    fi

    log_info "Pushing to $YOUR_FORK..."
    if git push -u "$FORK_REMOTE" "$BRANCH_NAME" --force-with-lease; then
        log_success "Pushed to fork"
    else
        log_error "Failed to push to fork."
        log_info "Check your SSH keys or GitHub token."
        exit 1
    fi
fi
echo

# Step 6: Create PR
log_step "6/6: Creating pull request to MAF HQ..."

# Default PR body if not provided
if [[ -z "$PR_BODY" ]]; then
    PR_BODY="## Summary
$(echo "$PR_TITLE")

## Changes
- [ ] Added/modified files in maf/ subtree
- [ ] Tested locally before submitting

## Type
- [ ] Bug fix
- [ ] Feature
- [ ] Documentation
- [ ] Refactoring
- [ ] Other (please describe)

## Checklist
- [ ] Code follows MAF style guidelines
- [ ] Self-reviewed before submitting
- [ ] Comments explain complex logic
- [ ] Documentation updated if needed"
fi

# Create PR
log_info "Creating PR: $PR_TITLE"
echo

# Determine head branch format based on repo owner status
if [[ "$IS_REPO_OWNER" == true ]]; then
    # Repo owner: just branch name (same repo, different branch)
    HEAD_BRANCH="$BRANCH_NAME"
    MANUAL_URL="https://github.com/$MAF_HQ_REPO/compare/main...$BRANCH_NAME"
else
    # Franchisee: user/repo:branch format (fork to HQ)
    HEAD_BRANCH="$YOUR_FORK:$BRANCH_NAME"
    MANUAL_URL="https://github.com/$MAF_HQ_REPO/compare/main...$YOUR_FORK:$BRANCH_NAME"
fi

if gh pr create \
    --repo "$MAF_HQ_REPO" \
    --base main \
    --head "$HEAD_BRANCH" \
    --title "$PR_TITLE" \
    --body "$PR_BODY"; then
    echo
    log_success "Pull request created!"
    echo
    log_info "PR URL:"
    gh pr view --repo "$MAF_HQ_REPO" --web
else
    log_error "Failed to create PR automatically."
    log_info "Create it manually at:"
    echo "  $MANUAL_URL"
    exit 1
fi

# Summary
echo
echo "═══════════════════════════════════════════════════════════"
log_success "Contribution complete!"
echo
log_info "What happens next:"
echo "  1. MAF HQ team will review your PR"
echo "  2. They may request changes or approve it"
echo "  3. Once merged, all franchisees get your update"
echo
log_info "Track your PR:"
echo "  gh pr status --repo $MAF_HQ_REPO"
echo "  gh pr view --repo $MAF_HQ_REPO"
echo
log_info "Switch back to main branch when ready:"
echo "  git checkout main"
echo "═══════════════════════════════════════════════════════════"
