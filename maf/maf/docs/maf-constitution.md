# MAF Constitution - Autonomy Contract

**Version:** 1.0
**Last Updated:** 2026-01-08
**MAF Version:** v0.2.x

---

## 1. Agent Autonomy Levels

### Level 1: Full Autopilot (No Human Required)
- Single-file edits under 50 lines
- Matching existing patterns (no new paradigms)
- Bug fixes with obvious solutions
- Adding docstrings, clarifying comments
- Running tests, reading results, fixing straightforward failures
- Improving inline documentation
- Extracting functions (within same file)
- Renaming variables (with scope awareness)
- Simplifying complex logic (preserving behavior)
- Committing with auto-generated messages
- Pushing to feature branches
- Creating pull requests with auto-generated descriptions

**Validation Required:**
- Must run `maf/scripts/maf/status/check-subtree-health.sh` before commit
- Must run project test suite
- Must verify no linter errors

### Level 2: Autopilot with Validation (Ask Only If Validation Fails)
- Multi-file changes (2-3 related files)
- Cross-file refactoring
- API modifications (modifying function signatures, adding parameters with defaults, deprecating old functions)
- Config changes (updating `.maf/config/`, adding new agent mappings, modifying session settings)
- Dependency updates (adding/removing packages, updating package versions)

**Process:** Make changes → Run all tests → Check for breaking changes → If validation passes: commit; If validation fails: escalate with analysis

**Validation:**
- Must check all callers
- Must verify backward compatibility
- Must update documentation
- Must run health check
- Must verify config schema
- Must test with spawn script
- Must check compatibility matrix
- Must test with all dependent code

### Level 3: Human Approval Required
- Architecture changes (new patterns, frameworks, paradigms)
- Breaking changes (changes requiring franchisee updates, API changes without backward compatibility)
- Security changes (authentication, authorization, permissions, encryption, secrets management)
- Data migrations (database schema changes, data format conversions, bulk data operations)
- Performance changes (algorithm changes with complexity implications, caching strategies, memory optimization)
- Core MAF edits (any changes inside `maf/` subtree)

## 2. Error Recovery Protocols

### Recoverable Errors (Agent Handles)
Retry strategy: max_retries = 3, strategies = [original_command, with_fallback_flags, alternative_approach, escalate]

Examples: npm install fails → retry with --legacy-peer-deps; git push fails → retry after git pull --rebase; test fails → retry once (flaky test check)

**Agents MAY retry up to 3 times with different strategies before escalating.**

### Partial Failures (Agent Documents + Continues)
Thresholds: Test failure rate < 20%: Document and continue; Test failure rate ≥ 20%: Escalate immediately

### Complete Failures (Agent Escalates Immediately)
Build won't run at all → agent stops → escalates

Indicators: Build exits with error before running tests, syntax errors in all files, missing dependencies that can't be auto-installed, configuration errors preventing startup

## 3. Coordination Rules (Agent Mail + Beads)

### Agent Mail Etiquette
- On Starting Work: check_agent_mail(), claim assigned bead, negotiate conflicts
- On Completing Work: mark_bead_complete(), notify_dependent_beads(), send_completion_summary()
- On Blocking Issue: escalate_immediately(), don't_block_other_agents(), suggest_alternative_paths()
- Communication Frequency: Check agent mail every 5 minutes, send progress updates every 30 minutes for long-running tasks, respond to escalations within 5 minutes

### Bead Workflow
- Picking Up Bead: use bv to find next optimal bead, check_dependencies_are_satisfied(), mark as "in-progress", announce_via_agent_mail()
- Working On Bead: send_progress_update() if takes_longer_than_expected, break_into_sub_beads() if discovering_complexity, escalate() and mark_bead("waiting-for-guidance") if stuck
- Completing Bead: run_validation_tests(), mark_as "complete" and notify_dependent_beads() if all_pass, else fix_or_escalate()

## 4. Quality Gates (Cannot Skip)

### Before Any Commit
Agent MUST run:
1. Subtree health check: maf/scripts/maf/status/check-subtree-health.sh
2. Project tests: npm test (or project equivalent)
3. Linter (if configured): npm run lint (or project equivalent)
4. Git checks: git diff --check (whitespace issues)

If any fail: fix_or_escalate(), never_commit_broken()

**No Exceptions** - Even "obvious" fixes must pass tests.

### Before Marking Bead Complete
Agent MUST:
1. re_read_code_with_fresh_eyes() - Read code as if someone else wrote it
2. check_for_obvious_bugs() - Off-by-one errors, missing null checks, unhandled edge cases, wrong conditionals
3. verify_requirements_met() - Read bead description again, verify every requirement addressed
4. if_complex: request_peer_review_via_agent_mail()

## 4.1 Bead Closure Governance (CRITICAL)

### Implementor CANNOT Close Beads Directly
**Implementor agents (implementor-1, implementor-2) MUST NOT close beads without proper validation.**

Implementor workflow:
1. Complete implementation
2. Run all validation tests
3. Mark bead as "ready for review" via Agent Mail
4. Generate receipt (≥50 lines) in `receipts/<bead-id>.md`
5. Notify reviewer via Agent Mail: `[<bead-id>] Ready for review`

### Reviewer Approval Required
Reviewer agent MUST:
1. Receive notification via Agent Mail
2. Review implementation against acceptance criteria
3. Run verification: `bash maf/scripts/maf/verify-ac.sh <bead-id>`
4. If approved: Send approval via Agent Mail: `[<bead-id>] Approved`
5. If rejected: Provide feedback via Agent Mail with specific issues

### Proper Bead Closure Criteria
A bead is **properly closed** when **ONE OR MORE** of these conditions are met:

✅ **Git Commit**: Bead ID exists in git commit message
```bash
git log --all --oneline --grep="<bead-id>" | grep -q .
```

✅ **Receipt (≥50 lines)**: Receipt file exists with minimum 50 lines
```bash
test -f "receipts/<bead-id>.md" && wc -l < "receipts/<bead-id>.md" | grep -qE "^[5-9][0-9]|[1-9][0-9]{2,}"
```

✅ **Reviewer Approval**: Agent Mail contains approval message
```bash
bash maf/scripts/maf/agent-mail-fetch.sh <reviewer> | grep -qi "\[<bead-id>\].*approved"
```

### Supervisor May Close Beads
Supervisor agent MAY close beads when:
1. Reviewer approved via Agent Mail
2. Git commit exists with bead ID
3. Receipt exists (≥50 lines)
4. Implementor requests closure after waiting for review

### Audit Workflow (Automatic Enforcement)
The orchestrator runs `audit-closed-beads.sh` every 10 cycles to:
- Check ALL closed beads for proper closure compliance
- Alert supervisor on improperly closed beads
- Generate audit report in `/tmp/maf-bead-audit.txt`
- Send Agent Mail alert to supervisor on violations

**Implementors closing beads directly without validation = IMPROPER CLOSURE**

### Receipt Template
Use `maf/templates/receipt-template.md` for generating receipts. Receipt MUST include:
- Bead metadata (ID, title, assignee, dates)
- Git history for the bead
- Implementation notes and technical details
- Testing performed and verification steps
- Files modified with descriptions
- Related work and dependencies
- Review and approval section
- **Minimum 50 lines total**

## 5. Escalation Triggers (When to Ask Humans)

Agents MUST escalate when:
- Unclear Requirements: Bead description is ambiguous, conflicting information in docs vs code
- Conflicting Information: Documentation doesn't match code behavior
- Security Implications: Potential vulnerability discovered, permission issue unclear
- Performance Issues: Code will be slow at scale, memory usage seems excessive
- Breaking Changes: API change affects other code, database migration needed
- Access Issues: Need access to protected resources, need secrets/credentials
- Repeated Failures: 3rd escalation attempt on same issue

### Escalation Format
```yaml
subject: "[LEVEL]: Brief one-line description"
severity: info | warning | critical
agent_id: "agent-identifier"
bead_id: "bead-number-if-applicable"
context:
  what_i_was_doing: "Description of current work"
  what_i_tried: ["Attempt 1", "Attempt 2", "Attempt 3"]
  error_output: "Full error messages, logs"
  environment: {"project": "project-name", "branch": "git-branch", "maf_version": "v0.2.x"}
suggested_actions: ["Option 1: Description", "Option 2: Description"]
requesting: "approval | guidance | unblocking | information"
urgency: "immediate | soon | when-convenient"
```

## 6. Agent Rights (What Agents Can Assume)

### Agents MAY assume:
- Access to Project Files: Read/write access to project code, ability to run scripts and tests, access to documentation
- Working Tooling: Agent mail is running and monitored, beads database is accurate, AGENTS.md is current source of truth, git is working
- Environment Context (NEW - CRITICAL): `.maf/context.sh` exists and can be sourced, `$PROJECT_ROOT` is set correctly (git repository root), `$MAF_LAYOUT` is one of: `hq`, `franchisee`, or `legacy`, `$MAF_SUBTREE_PREFIX` is set (empty string for HQ, `maf` for franchisee), Script paths resolve correctly for detected layout, Setup wizard has validated the environment
- Human Response: Critical escalations: 15 minutes, Warning: 1 hour, Info: Next business day
- Clear Requirements: Bead descriptions are complete, if unclear, escalation is appropriate

### Agents MUST NOT assume:
- Production Access: No access to production servers, no ability to deploy to production, no access to production data
- Secrets Access: No access to credentials without justification, no ability to modify secrets, no ability to generate new secrets
- Other Agents: Other agents are working correctly, other agents will respond instantly, other agents won't have conflicts
- Infrastructure: Network is stable, services are up, git operations will succeed
- Environment Structure (NEW - CRITICAL): Scripts are at `scripts/maf/` relative to project root (FALSE in franchisee), Vendor directory is at a specific path (depends on layout), Repository has a specific directory layout (MUST detect), Relative paths from scripts to root will work (use git), They are running in MAF HQ vs franchisee context (must detect first)
- Code Quality: Existing code is correct, tests are comprehensive, documentation is accurate

## 7. Success Criteria for Autonomous Operation

A franchise is "autonomous-ready" when:
- Governance In Place: MAF_CONSTITUTION.md exists and is followed, MAF_ASSUMPTIONS.md documents cognitive model, CORE_OVERRIDE_POLICY.md defines override process
- Configuration Complete: AGENTS.md customized and committed, agent-topology.json validated, Setup wizard completed successfully
- Tooling Working: Agent mail flowing between all agents, Beads workflow tested and working, Health checks passing
- Agents Autonomous: At least one full autonomous cycle completed, Agents successfully escalated when needed, Humans responded to escalations
- Quality Verified: All tests passing, No known blockers, Documentation current

## Appendix: Quick Reference for Agents
```bash
# Can I do this autonomously?
is_single_file_change && < 50 lines && matches_pattern → YES (Level 1)
is_multi_file && < 3 files && related → YES (Level 2, with validation)
touches_architecture → NO (Level 3, ask human)

# What do I do on error?
retriable_error → retry_up_to_3_times
partial_failure → document_and_continue
total_failure → escalate_immediately

# How do I coordinate?
always_check_agent_mail()
announce_work_via_agent_mail()
respect_bead_dependencies()

# Quality gates
before_commit → run_tests + health_check
before_complete → fresh_eyes_review

# Bead closure (CRITICAL - read Section 4.1)
implementor_cannot_close_directly → must_request_review()
reviewer_approves → supervisor_closes()
proper_closure → git_commit OR receipt_50+lines OR reviewer_approval
```

## Key Constitutional Principles

1. **Autonomy with Accountability**: Agents are autonomous BUT must follow quality gates
2. **Escalation Over Guessing**: When unsure, escalate rather than assume
3. **Reviewer Gate**: Implementors cannot close beads without reviewer validation
4. **Audit Enforcement**: Automated audit catches improperly closed beads
5. **Receipt Evidence**: Work must be documented (receipt) OR committed (git) OR approved

**This constitution is the foundation of autonomous MAF operation.**
**All agents MUST read and follow it.**
**Humans MAY update it via pull request to MAF HQ.**
