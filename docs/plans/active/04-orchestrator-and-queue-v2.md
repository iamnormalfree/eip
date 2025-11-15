# Plan 04 v2 — Complete Orchestrator Pipeline Integration

**Date**: 2025-11-15
**Phase**: 1 → 2 (Quality Framework → Operations)
**Impact**: Critical - Core content generation pipeline
**Risk**: Medium - Complex integrations with existing systems

## Goal

Complete the orchestrator end-to-end pipeline with queue integration, deterministic routing, budget enforcement, and comprehensive logging.

## Current State Assessment

Based on codebase analysis, most components exist but need integration, testing, and refinement:

### ✅ Already Implemented
- **Budget System**: `orchestrator/budgets.yaml` with tier-specific limits
- **Queue Infrastructure**: BullMQ setup in `lib_supabase/queue/`
- **Controller Skeleton**: `orchestrator/controller.ts` with basic pipeline
- **Router Framework**: `orchestrator/router.ts` with basic structure
- **Test Infrastructure**: Comprehensive test patterns in `tests/orchestrator/`

### ⚠️ Needs Integration/Completion
- **Budget Enforcement**: Missing circuit breaker integration and retrieval stage
- **Router Rules**: Incomplete persona+funnel mapping logic
- **Controller-Queue Integration**: Partial integration with workers
- **Structured Logging**: Missing correlation tracking and structured logs
- **End-to-End Testing**: Gap in pipeline integration tests

## Implementation Plan (5 Bite-Sized Phases)

### Phase 1: Validate and Fix Budget System (Days 1-2)

**Objective**: Ensure YAML-driven budgets work with circuit breakers

#### Detailed Tasks

**Task 1.1: Audit Budget Configuration**
- **File**: `orchestrator/budgets.yaml`
- **Action**: Verify configuration matches all orchestrator stages
- **Validation**: Ensure all pipeline stages have budget limits
- **Tests**: Validate YAML schema and required fields

**Task 1.2: Fix BudgetEnforcer Retrieval Stage**
- **File**: `orchestrator/budget.ts`
- **Action**: Add missing 'retrieval' stage support to BudgetEnforcer
- **Code Changes**:
  ```typescript
  // Add retrieval to stage validation
  private readonly validStages = ['retrieval', 'planner', 'generator', 'auditor', 'repairer', 'review'];

  // Add retrieval stage tracking
  startStage(stage: 'retrieval' | OrchestratorStage): void {
    // Implementation for retrieval budget tracking
  }
  ```
- **Validation**: Circuit breaker triggers on retrieval budget violations

**Task 1.3: Add Circuit Breaker Triggers**
- **File**: `orchestrator/budget.ts`
- **Action**: Implement automatic DLQ routing on budget violations
- **Integration**: Connect with `lib_supabase/queue/eip-dlq-worker.ts`
- **Code Changes**:
  ```typescript
  shouldTriggerCircuitBreaker(): boolean {
    return this.currentUsage.tokens > this.budget.tokens * 0.95;
  }

  async handleBudgetViolation(jobId: string, violation: BudgetViolation): Promise<void> {
    // Route to DLQ with detailed context
  }
  ```

**Task 1.4: Write Comprehensive Budget Tests**
- **File**: `tests/orchestrator/budgets-circuit-breaker.test.ts`
- **Test Cases**:
  - YAML loading and validation
  - Retrieval stage budget tracking
  - Circuit breaker thresholds
  - DLQ routing on violations
  - Performance under load

**Task 1.5: Integration Commit**
- **Message**: `feat(orchestrator): complete budget enforcement with circuit breakers`
- **Files**: Budget system files and tests

#### Success Criteria
- [ ] Budgets.yaml validates against schema
- [ ] All orchestrator stages have budget limits
- [ ] Circuit breaker triggers at 95% budget utilization
- [ ] DLQ receives budget violation records
- [ ] Budget tests pass with >85% coverage

---

### Phase 2: Complete Router Implementation (Days 3-4)

**Objective**: Finalize deterministic IP routing with comprehensive testing

#### Detailed Tasks

**Task 2.1: Audit Router Rules**
- **File**: `orchestrator/router.ts`
- **Action**: Review current implementation for completeness
- **Validation**: Check brand profile integration and persona mapping
- **Code Review**: Ensure deterministic behavior and fallback logic

**Task 2.2: Add Persona+Funnel Mapping**
- **File**: `orchestrator/router.ts`
- **Action**: Implement brand profile-based routing logic
- **Integration**: Connect with IP library for available IPs
- **Code Changes**:
  ```typescript
  interface RoutingRule {
    persona: string;
    funnel: string;
    primary_ip: string;
    secondary_ip?: string;  // Future enhancement
    priority: number;
    version: string;
  }

  selectIP(persona: string, funnel: string, brandProfile?: BrandProfile): string {
    // Deterministic routing logic with brand profile awareness
  }
  ```

**Task 2.3: Version Router Rules**
- **File**: `orchestrator/router.ts`
- **Action**: Add rule versioning and change tracking
- **Features**:
  - Rule version validation
  - Backward compatibility checks
  - Change logging and audit trail
  - Migration support for rule updates

**Task 2.4: Write Router Stability Tests**
- **File**: `tests/orchestrator/router-comprehensive.test.ts`
- **Test Cases**:
  - Deterministic routing behavior
  - Persona+funnel mapping accuracy
  - Brand profile integration
  - Rule versioning and migration
  - Edge cases and error handling
  - Performance under load

**Task 2.5: Router Implementation Commit**
- **Message**: `feat(orchestrator): complete deterministic router with stability tests`
- **Files**: Router implementation and comprehensive tests

#### Success Criteria
- [ ] Router deterministically maps persona+funnel to IP
- [ ] Brand profile integration working correctly
- [ ] Rule versioning prevents breaking changes
- [ ] All edge cases handled gracefully
- [ ] Router tests pass with >90% coverage

---

### Phase 3: Integrate Controller with Queue System (Days 5-7)

**Objective**: Seamlessly integrate orchestrator with BullMQ queues

#### Detailed Tasks

**Task 3.1: Audit Controller-Queue Integration**
- **File**: `orchestrator/controller.ts`
- **Action**: Review current queue usage and integration points
- **Validation**: Ensure proper queue handoff between stages
- **Code Review**: Check for race conditions and proper error handling

**Task 3.2: Fix Stage-by-Stage Processing**
- **File**: `orchestrator/controller.ts`
- **Action**: Ensure proper queue handoff between pipeline stages
- **Integration**: Connect with all worker types in `lib_supabase/queue/`
- **Code Changes**:
  ```typescript
  async processJob(job: Job): Promise<void> {
    // Stage 1: Planning with queue handoff
    await this.submitToQueue('planning', jobData);

    // Stage 2: Retrieval with budget tracking
    await this.submitToQueue('retrieval', jobData);

    // Continue for all stages...
  }
  ```

**Task 3.3: Add Correlation Tracking**
- **File**: `orchestrator/controller.ts`
- **Action**: Implement job correlation across queues
- **Features**:
  - Correlation ID generation and propagation
  - Stage transition tracking
  - Job state synchronization
  - Error context preservation

**Task 3.4: Write Controller Integration Tests**
- **File**: `tests/orchestrator/controller-queue-integration.test.ts`
- **Test Cases**:
  - End-to-end queue processing
  - Stage-by-stage handoff
  - Correlation ID propagation
  - Error handling and recovery
  - Performance under load
  - Queue worker integration

**Task 3.5: Controller Integration Commit**
- **Message**: `feat(orchestrator): complete controller queue integration`
- **Files**: Controller with queue integration and tests

#### Success Criteria
- [ ] Controller successfully submits jobs to all stage queues
- [ ] Correlation IDs track jobs across entire pipeline
- [ ] Stage handoff works without race conditions
- [ ] Error handling preserves job context
- [ ] Queue integration tests pass with >85% coverage

---

### Phase 4: Implement Structured Logging System (Days 8-9)

**Objective**: Add comprehensive logging with correlation tracking

#### Detailed Tasks

**Task 4.1: Add Winston Logger**
- **File**: `orchestrator/controller.ts` (or new `orchestrator/logger.ts`)
- **Action**: Implement structured logging throughout pipeline
- **Features**:
  - Structured JSON logging format
  - Log levels (error, warn, info, debug)
  - Performance metrics logging
  - Token usage tracking

**Task 4.2: Correlation ID Propagation**
- **File**: `orchestrator/controller.ts`
- **Action**: Track jobs across all stages and queues
- **Implementation**:
  ```typescript
  interface LogContext {
    correlationId: string;
    jobId: string;
    stage: OrchestratorStage;
    userId?: string;
    persona: string;
    funnel: string;
  }

  logger.info('Stage completed', {
    ...logContext,
    duration: stageDuration,
    tokensUsed: stageTokens,
    budgetRemaining: this.getBudgetRemaining()
  });
  ```

**Task 4.3: Performance Logging**
- **File**: `orchestrator/controller.ts`
- **Action**: Add timing and token usage tracking
- **Metrics**:
  - Stage duration tracking
  - Token usage per stage
  - Budget utilization
  - Queue processing times
  - Error rates and types

**Task 4.4: Write Logging Tests**
- **File**: `tests/orchestrator/logging-correlation.test.ts`
- **Test Cases**:
  - Correlation ID propagation across stages
  - Structured log format validation
  - Performance metrics accuracy
  - Error logging completeness
  - Log aggregation compatibility

**Task 4.5: Logging Implementation Commit**
- **Message**: `feat(orchestrator): structured logging with correlation tracking`
- **Files**: Logging system and tests

#### Success Criteria
- [ ] All pipeline stages generate structured logs
- [ ] Correlation IDs trace jobs end-to-end
- [ ] Performance metrics are accurate and complete
- [ ] Log format is aggregation-ready
- [ ] Logging tests pass with >90% coverage

---

### Phase 5: End-to-End Integration and Testing (Days 10-12)

**Objective**: Complete pipeline testing and documentation

#### Detailed Tasks

**Task 5.1: Write End-to-End Pipeline Tests**
- **File**: `tests/orchestrator/pipeline-e2e.test.ts`
- **Test Cases**:
  - Complete content generation workflow
  - Budget enforcement under real load
  - Queue processing under load
  - Error scenarios and recovery
  - Performance benchmarking
  - Integration with all components

**Task 5.2: Performance Validation**
- **File**: `tests/orchestrator/pipeline-performance.test.ts`
- **Test Cases**:
  - Budget enforcement under MEDIUM/HEAVY tiers
  - Queue throughput benchmarks
  - Pipeline latency measurements
  - Resource utilization monitoring
  - Scalability testing

**Task 5.3: Error Handling Validation**
- **File**: `tests/orchestrator/pipeline-error-handling.test.ts`
- **Test Cases**:
  - DLQ routing and recovery
  - Circuit breaker behavior
  - Partial failure handling
  - Retry logic validation
  - Error context preservation

**Task 5.4: Create Operations Runbook**
- **File**: `docs/runbooks/orchestrator-operations.md`
- **Content**:
  - Pipeline operation procedures
  - Monitoring and alerting setup
  - Troubleshooting common issues
  - Performance tuning guidelines
  - Emergency procedures

**Task 5.5: Final Integration Tests**
- **Files**: Integration test suite
- **Validation**: Complete system integration
- **Coverage**: Ensure >85% test coverage
- **Performance**: Validate against budget constraints

**Task 5.6: Documentation and Final Commit**
- **Message**: `feat(orchestrator): complete end-to-end pipeline with documentation`
- **Files**: All tests, runbooks, and final integration

#### Success Criteria
- [ ] End-to-end pipeline tests pass consistently
- [ ] Performance meets budget constraints
- [ ] Error handling is robust and reliable
- [ ] Operations runbook is complete and accurate
- [ ] System integration validated with >85% coverage

---

## Overall Success Criteria

### Functional Requirements
- [ ] Controller runs jobs through complete pipeline: plan → retrieve → generate → audit → repair → re-audit → publish
- [ ] Budget violations automatically trigger circuit breakers and DLQ routing
- [ ] Router deterministically maps persona+funnel to IP selections
- [ ] All jobs have correlation tracking with structured logs
- [ ] End-to-end pipeline tests pass with >85% coverage

### Non-Functional Requirements
- [ ] Pipeline performance within budget constraints (all tiers)
- [ ] Queue processing handles expected load without bottlenecks
- [ ] Error recovery is automatic and preserves job context
- [ ] Logging is comprehensive and aggregation-ready
- [ ] System monitoring and alerting is functional

### Integration Requirements
- [ ] Seamless integration with existing queue infrastructure
- [ ] Compatibility with current database schema
- [ ] Integration with MAF profile management system
- [ ] Compatibility with IP library structure
- [ ] Integration with compliance and audit systems

---

## Key Reference Files

### Budget System
- `orchestrator/budgets.yaml` - Budget configuration
- `orchestrator/budget.ts` - Budget enforcement logic
- `orchestrator/yaml-budget-loader.ts` - YAML loading utilities

### Queue Infrastructure
- `lib_supabase/queue/eip-queue.ts` - Main queue interface
- `lib_supabase/queue/eip-*.worker.ts` - Stage-specific workers
- `lib_supabase/queue/eip-dlq-worker.ts` - Dead letter queue handling

### Core Components
- `orchestrator/controller.ts` - Main pipeline controller
- `orchestrator/router.ts` - IP routing logic
- `ip_library/` - Educational IP definitions
- `compliance/` - Compliance rules and validation

### Testing and Documentation
- `tests/orchestrator/*.test.ts` - Test patterns and examples
- `docs/runbooks/` - Operations documentation
- `docs/plans/active/2025-11-13-integration-summary.md` - Integration patterns

---

## Testing Strategy

### Unit Testing
- Component-specific functionality
- Budget enforcement accuracy
- Router determinism
- Logging format validation

### Integration Testing
- Component interaction validation
- Queue processing workflows
- Database integration
- Error propagation

### Performance Testing
- Budget constraint validation
- Queue throughput testing
- Pipeline latency measurement
- Resource utilization monitoring

### End-to-End Testing
- Complete workflow validation
- Error scenario testing
- Recovery procedure validation
- System integration verification

---

## Risk Mitigation

### Technical Risks
1. **Budget Enforcement Performance**: Mitigated by efficient token tracking and periodic validation
2. **Queue System Bottlenecks**: Mitigated by proper queue configuration and monitoring
3. **Router Rule Conflicts**: Mitigated by versioning and comprehensive testing
4. **Logging Performance Impact**: Mitigated by async logging and sampling strategies

### Integration Risks
1. **Component Coupling**: Mitigated by clear interfaces and contract testing
2. **Data Consistency**: Mitigated by transaction boundaries and validation
3. **Error Propagation**: Mitigated by structured error handling and context preservation
4. **Performance Regression**: Mitigated by benchmarking and monitoring

### Operational Risks
1. **Queue Overload**: Mitigated by circuit breakers and monitoring
2. **Budget Configuration Errors**: Mitigated by validation and safe defaults
3. **Monitoring Gaps**: Mitigated by comprehensive logging and alerting
4. **Documentation Outdated**: Mitigated by automated documentation generation

---

*Last Updated: 2025-11-15*
*EIP Content Generation System - Orchestrator Pipeline Integration*