# Implementation Plan Template

**Purpose:** Template for creating founder-informed implementation plans.

**Instructions:** Use this template when creating plans. Fill in ALL sections. Founder context from Founder DSL should be integrated throughout.

---

# <Project Name> Implementation Plan

**Created:** <date>
**Founder Context:** founder-context.json

---

## Executive Summary

<Brief 2-3 sentence overview of what this project does and why it matters>

---

## Goals

<What we're building - specific, measurable outcomes>

### Primary Goals
1. <Goal 1>
2. <Goal 2>
3. <Goal 3>

### Success Criteria
- <Measurable success criteria>
- <User can do X>
- <System achieves Y>

### Constraints Summary
- **Budget:** <from D5>
- **Timeline:** <from D7>
- **Scale:** <from A1>
- **Team:** <from D6>

---

## Non-Goals

<What we're explicitly NOT doing - prevents scope creep>

### Out of Scope for v1
- <Feature X> - deferred to v2
- <Feature Y> - not aligned with current goals
- <Approach Z> - over-engineering for current scale

### Rationale
<Why these are out of scope - based on founder's timeline and YAGNI principle>

---

## Constraints

<From Founder DSL Layer 1 answers - these are hard boundaries>

### Budget Constraints
- **Monthly Infrastructure:** <$amount from D5>
- **Selected Stack Cost:** <$total/month>
- **Budget Alignment:** ✅ Within budget / ❌ Exceeds budget (need to adjust)

### Timeline Constraints
- **Target:** <timeline from D7>
- **MVP-Focused:** <yes/no>
- **Skip Nice-to-Haves:** <examples>

### Scale Constraints
- **Expected Users:** <from A1>
- **Growth Rate:** <from A2>
- **Scaling Triggers:** <when to scale up>

### Team Constraints
- **Team Size:** <from D6>
- **Complexity Level:** <simple/moderate/complex>
- **Build vs Buy:** <what to build vs what to use existing>

### Risk Tolerance
- **Downtime Tolerance:** <from D8>
- **Data Loss Tolerance:** <based on B3>
- **Failure Mode:** <graceful degradation / fail-fast>

---

## Architecture

<From Founder DSL Layer 2 trade-offs - what we chose and why>

### System Overview
<High-level architecture diagram or description>

### Key Decisions

#### Storage
**Choice:** <from Layer 2>
**Rationale:** <founder's reason>
**Migration Path:** <when to change approach>
**Vendor Lock-in:** <yes/no + migration complexity>

#### Authentication
**Choice:** <from Layer 2>
**Rationale:** <founder's reason>
**Migration Path:** <if vendor, what to build instead>

#### Deployment
**Choice:** <from Layer 2>
**Rationale:** <founder's reason>
**Scaling Path:** <how to scale when needed>

#### <Other key decisions from Layer 2>

### Technology Stack
- **Frontend:** <framework, language>
- **Backend:** <framework, language>
- **Database:** <from Layer 2>
- **Hosting:** <from Layer 2>
- **Third-party Services:** <from Layer 2 or F13-F16>

---

## Security

<From Founder DSL Layer 1 E9-E12 + B3>

### Data Classification
- **Sensitivity Level:** <from B3>
- **Regulatory Requirements:** <from E9>
- **Compliance Needed:** <PDPA/GDPR/HIPAA/none>

### Threat Model
**We Defend Against:**
- <Attacker type 1>
- <Attacker type 2>

**We Do NOT Defend Against:**
- <Threat we accept>
- <Threat out of scope>

### Security Measures
- **Authentication:** <from Layer 2>
- **Authorization:** <model>
- **Encryption:** <at rest, in transit>
- **Audit Logging:** <from E11>
- **Data Retention:** <from E10>

### Compliance (if applicable)
**If E9-E12 active:**
- PDPA compliance: <requirements>
- Audit trail: <implementation>
- Data residency: <from E12>
- Consent tracking: <from E10>

---

## Data Model

### Core Entities
<Main data structures>

#### <Entity 1>
```yaml
<field_1>: <type> - <description>
<field_2>: <type> - <description>
```

#### <Entity 2>
```yaml
<field_1>: <type> - <description>
<field_2>: <type> - <description>
```

### Relationships
<How entities relate to each other>

### Validation Rules
<Per-field validation, constraints>

### Versioning
<Data format version, migration strategy>

---

## User Workflows

<Step-by-step workflows - scope appropriate for timeline>

### Workflow 1: <Primary User Action>
**Actor:** <user type>
**Trigger:** <what starts the workflow>

**Steps:**
1. <Step 1>
2. <Step 2>
3. <Step 3>
...
N. <Final state>

**Success Criteria:** <what defines success>

### Workflow 2: <Another User Action>
...

### Edge Cases
- <What happens when X fails>
- <What happens when Y is missing>
- <How to handle Z>

---

## Integrations

<From Founder DSL F13-F16, if applicable>

### External Systems
**Count:** <from F13>

#### <Integration 1>
- **System:** <external system name>
- **Type:** <API/webhook/batch from F14>
- **Sync Method:** <real-time/batch from F15>
- **Source of Truth:** <our DB / external from F16>
- **Idempotency:** <how we handle duplicates>

#### <Integration 2>
...

### Integration Architecture
<How integrations are structured>

---

## Multi-Tenancy

<From Founder DSL G17-G20, if applicable>

### Tenancy Model
- **Type:** <single/multi from G17>
- **Isolation:** <logical/hard from G20>

### Permissions
- **Model:** <from G18>
- **Roles:** <if role-based>
- **Impersonation:** <from G19>

### Data Partitioning
<How tenant data is separated>

---

## Agents & AI

<From Founder DSL I25-I28, if applicable>

### Agent Capabilities
- **Autonomy Level:** <from I25>
- **Approval Required:** <from I26>
- **Blast Radius:** <from I27>

### Governance
- **Action Classifier:** <safe vs destructive vs customer-facing>
- **Approval Queue:** <how approvals work>
- **Audit Trail:** <how agent decisions are logged>
- **Kill Switch:** <emergency stop mechanism>

---

## Implementation

<B breakdown by founder's timeline from D7>

### Phase 1: Foundation (<time period>)
- [ ] <Task 1>
- [ ] <Task 2>
- [ ] <Task 3>

### Phase 2: Core Features (<time period>)
- [ ] <Task 1>
- [ ] <Task 2>
- [ ] <Task 3>

### Phase 3: Polish & Launch (<time period>)
- [ ] <Task 1>
- [ ] <Task 2>
- [ ] <Task 3>

### Deferred to Post-MVP
- <Feature that didn't make timeline>
- <Feature that's nice-to-have>
- <Feature that's premature optimization>

---

## Testing

<Aligned with timeline from D7 and team from D6>

### Test Strategy
- **Unit Tests:** <coverage target>
- **Integration Tests:** <what to test>
- **E2E Tests:** <critical workflows>

### Test Categories
#### Happy Path
- <Scenario 1>
- <Scenario 2>

#### Edge Cases
- <Edge case 1>
- <Edge case 2>

#### Failure Modes
- <Failure scenario 1>
- <Failure scenario 2>

### E2E Acceptance Criteria
**Scenario 1: <Primary user workflow>**
```
Given <initial state>
When <user action>
Then <expected outcome>
```

**Scenario 2: <Another workflow>**
...

---

## Performance

<Based on scale expectations from A1 and A2>

### Performance Budgets
#### Load Time
- **Target:** <based on D8>
- **Measurement:** <how to measure>

#### Response Time
- **p50:** <target>
- **p95:** <target>
- **p99:** <target>

#### Throughput
- **Read Requests:** <target req/sec>
- **Write Requests:** <target req/sec>
- **Concurrent Users:** <target>

### Optimization Strategy
- **What We're Optimizing:** <critical paths>
- **What We're NOT Optimizing:** <premature optimizations to avoid>
- **Scaling Triggers:** <when to optimize/scale>

---

## Observability

<From Founder DSL H21-H24, if applicable>

### Monitoring Strategy
- **Level:** <from H22>
- **Tools:** <based on budget>
- **Alerting:** <from H21>

### Logging
- **What to Log:** <key events>
- **Log Format:** <structured/json/text>
- **Retention:** <from H22>

### Dashboards
- **Metrics Dashboard:** <yes/no from H24>
- **Admin Panel:** <yes/no from H24>

### On-Call
- **Who:** <from H23>
- **Escalation:** <how to escalate>
- **Runbooks:** <what to have documented>

---

## Failure Modes

<Based on risk tolerance from D8>

### Error Scenarios
#### <Error Type 1>
- **User Message:** <what user sees>
- **Technical Details:** <what happened>
- **Logging:** <what to log>
- **Recovery:** <how to recover>

#### <Error Type 2>
...

### Empty States
- **No Data:** <what user sees>
- **No Search Results:** <what user sees>
- **Error State:** <what user sees>

### Downtime Strategy
- **Tolerance:** <from D8>
- **Backup/Restore:** <approach>
- **Failover:** <approach if D8=c/d>

---

## Deployment

<From Layer 2 deployment choice>

### Architecture
- **Type:** <static/serverless/containers/paas>
- **Provider:** <specific provider>
- **Regions:** <data residency from E12>

### Pipeline
1. **Build:** <how to build>
2. **Test:** <how to test>
3. **Deploy:** <how to deploy>
4. **Verify:** <health checks>

### Environments
- **Development:** <setup>
- **Staging:** <setup>
- **Production:** <setup>

---

## Operations

### Runbooks
- **Deployment:** <how to deploy>
- **Rollback:** <how to rollback>
- **Incident Response:** <how to handle incidents>

### Maintenance
- **Updates:** <how to update dependencies>
- **Backups:** <frequency and method>
- **Monitoring:** <what to watch>

---

## Future Impact Warnings

<From Founder DSL Layer 3 patterns and Layer 2 trade-offs>

### Known Limitations

#### <Limitation 1>
- **What:** <description>
- **When Problematic:** <trigger condition>
- **Migration Path:** <how to address>
- **Complexity:** <low/medium/high>

#### <Limitation 2>
...

### Vendor Lock-in
**If using vendor services:**
- **Vendor:** <name>
- **Lock-in Risk:** <what's hard to migrate>
- **Migration Complexity:** <low/medium/high>
- **Alternative:** <what to build instead>

### Scaling Triggers
- **Trigger 1:** <condition> → <action to take>
- **Trigger 2:** <condition> → <action to take>

### Migration Expectations
**From J29-J31:**
- **What Will Change:** <from J29>
- **Migration Triggers:** <from J30>
- **Downtime Tolerance:** <from J31>

---

## Glossary

<Define any domain-specific terms or acronyms>

---

## Appendix

### Founder Context Reference
- **Founder Profile:** <summary of key answers>
- **Trade-offs Selected:** <summary>
- **Patterns Applied:** <summary>
- **Full Context:** See `founder-context.json`

### Related Documents
- <link to design doc if exists>
- <link to API spec if exists>
- <link to other relevant docs>
