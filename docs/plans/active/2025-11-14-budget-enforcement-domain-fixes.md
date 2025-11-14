# Budget Enforcement Domain Audit Fixes Implementation Plan

**Date**: 2025-11-14  
**Phase**: 0 → 1 (Core Infrastructure → Quality Framework)  
**Impact**: Core - Blocks all performance features  
**Risk**: High - Type safety, missing stages, no circuit breakers  

## Critical Audit Findings

### LCL Constraints Addressed
- ✅ `constraint::architecture::budget_enforcement_must_be_yaml_sot_not_hardcoded`  
- ✅ `constraint::performance::performance_budgets_must_trigger_circuit_breakers_automatically`
- ✅ `integration_contract::budget_system::budget_violations_must_trigger_automatic_rollback`
- ✅ `risk::high_priority::budget_enforcement_not_type_safe_missing_retrieval_stage`
- ✅ `pattern::existing::budgets_yaml_exists_but_runtime_uses_hardcoded_values`

### System Issues Identified
1. **Budgets not YAML-driven**: `budget.ts` hardcodes tiers instead of reading from `budgets.yaml`
2. **Type safety gaps**: No runtime validation for budget structures, `BudgetEnforcer` accepts invalid stages
3. **Missing retrieval stage**: Controller tracks 'retrieval' but `BudgetEnforcer` only supports planner/generator/auditor/repairer
4. **No circuit breaker integration**: Budget violations don't trigger automatic DLQ/rollback
5. **Performance monitoring gaps**: Budget tracking doesn't integrate with monitoring/alerting

## Implementation Approaches

### Approach 1: Direct YAML Integration with Zod Validation (Recommended)

**Architecture**: YAML → Zod Schema → Runtime Validation → Type Safety

#### Implementation Strategy
```typescript
// Core Architecture
budgets.yaml → Zod Schema → RuntimeValidator → BudgetEnforcer
```

#### Key Components
1. **Zod Budget Schema**: Type-safe YAML validation with runtime enforcement
2. **BudgetLoader**: Centralized budget loading with fallback to defaults
3. **Enhanced BudgetEnforcer**: Full stage support including retrieval
4. **CircuitBreaker Integration**: Automatic DLQ/rollback on violations

#### YAML Schema Enhancement
```yaml
budgets:
  LIGHT:
    retrieval: 300    # Add retrieval stage
    planner: 200
    generator: 1400
    auditor: 200
    repairer: 100
    wallclock_s: 20
    circuit_breaker:
      enabled: true
      threshold: 1.0  # 100% budget utilization triggers DLQ
  MEDIUM:
    retrieval: 800    # Add retrieval stage
    planner: 1000
    generator: 2400
    auditor: 700
    repairer: 600
    wallclock_s: 45
    circuit_breaker:
      enabled: true
      threshold: 0.95  # 95% budget utilization triggers DLQ
```

#### Integration Contracts
- **YAML → BudgetLoader**: Validated budget structures with type safety
- **BudgetLoader → BudgetEnforcer**: Runtime-validated budget configuration
- **BudgetEnforcer → Controller**: Stage-aware budget tracking with retrieval
- **BudgetEnforcer → DLQ**: Automatic circuit breaker triggers

#### Performance Benefits
- **Type Safety**: Runtime validation prevents invalid configurations
- **Maintainability**: Single source of truth in YAML
- **Reliability**: Circuit breaker prevents budget overruns
- **Monitoring**: Integrated performance tracking and alerting

### Approach 2: Configuration Service Pattern

**Architecture**: YAML → ConfigService → Caching Layer → BudgetEnforcer

#### Implementation Strategy
```typescript
// Service-based approach
ConfigService → BudgetCache → BudgetEnforcer → Monitoring
```

#### Key Components
1. **BudgetConfigService**: Centralized configuration management
2. **BudgetCache**: Hot budget configuration with refresh capability
3. **BudgetMonitor**: Real-time performance tracking and alerting
4. **Enhanced CircuitBreaker**: Sophisticated violation handling

#### Benefits
- **Hot Reload**: Budget changes without restart
- **Monitoring Integration**: Enhanced performance tracking
- **Validation Layer**: Multi-tier configuration validation
- **Audit Trail**: Configuration change tracking

#### Trade-offs
- **Complexity**: Additional service layer
- **Dependencies**: Cache invalidation complexity
- **Overhead**: Potential performance impact

### Approach 3: Runtime Schema Generation

**Architecture**: YAML → Schema Generation → Runtime Types → BudgetEnforcer

#### Implementation Strategy
```typescript
// Dynamic schema approach
YAML → SchemaGen → Runtime Types → BudgetEnforcer
```

#### Key Components
1. **YAML Schema Generator**: Dynamic TypeScript type generation
2. **Runtime Type Guards**: Generated validation functions
3. **Budget Runtime**: Dynamic budget enforcement
4. **Performance Integration**: Runtime monitoring integration

#### Benefits
- **Flexibility**: Dynamic budget structure changes
- **Type Safety**: Generated TypeScript types
- **Validation**: Runtime type checking
- **Extensibility**: Easy to add new budget dimensions

#### Trade-offs
- **Complexity**: Schema generation overhead
- **Build Time**: Additional compilation step
- **Debugging**: Generated code complexity

## Decision Framework

### #PATH_DECISION: Multiple viable budget architecture approaches
All three approaches address the core LCL constraints but with different trade-offs:

- **Approach 1**: Best for immediate Phase 1 implementation - minimal complexity, maximal type safety
- **Approach 2**: Best for Phase 2 operations - enhanced monitoring and hot reload capabilities  
- **Approach 3**: Best for Phase 3 optimization - maximum flexibility and extensibility

### #POISON_PATH: Avoid "budgets are just configuration" thinking
Budgets are **critical enforcement infrastructure**, not simple configuration:
- They enforce performance guarantees and cost controls
- They trigger circuit breakers and system protections
- They require runtime validation and type safety
- They integrate with monitoring and alerting systems

### #FIXED_FRAMING: Budget enforcement as performance-critical infrastructure
Treat budget system with same rigor as security systems:
- **Type Safety**: Runtime validation prevents misconfigurations
- **Circuit Breakers**: Automatic protection against budget overruns
- **Monitoring**: Real-time performance tracking and alerting
- **Reliability**: Fallback mechanisms and error handling

### #PLAN_UNCERTAINTY: Validate orchestrator stage budget tracking
Need to verify that all orchestrator stages can be safely budget-tracked:
- **Retrieval Stage**: Currently tracked by controller but not supported by BudgetEnforcer
- **Stage Ordering**: Ensure budget tracking doesn't interfere with pipeline flow
- **Token Estimation**: Validate token counting accuracy across all stages
- **Error Propagation**: Ensure budget violations properly trigger circuit breakers

## Integration Contracts Definition

### Budgets → Controller Contract
```typescript
interface BudgetControllerContract {
  // Load validated budgets for orchestrator
  loadBudgets(tier: Tier): ValidatedBudgetConfig;
  
  // Stage budget tracking with retrieval support
  trackStageUsage(stage: OrchestratorStage, tokens: number): void;
  
  // Budget validation before stage execution
  validateStageBudget(stage: OrchestratorStage): BudgetValidationResult;
  
  // Circuit breaker integration
  handleBudgetViolation(violation: BudgetViolation): DLQRecord;
}
```

### Budgets → BudgetEnforcer Contract
```typescript
interface BudgetEnforcerContract {
  // Type-safe budget structure with retrieval stage
  constructor(config: ValidatedBudgetConfig): BudgetEnforcer;
  
  // Full orchestrator stage support
  startStage(stage: 'retrieval' | 'planner' | 'generator' | 'auditor' | 'repairer'): void;
  
  // Runtime budget validation
  validateStageBudget(stage: OrchestratorStage): ValidationResult;
  
  // Circuit breaker triggers
  shouldTriggerCircuitBreaker(): boolean;
  createCircuitBreakerEvent(): CircuitBreakerEvent;
}
```

### Budgets → DLQ Contract
```typescript
interface BudgetDLQContract {
  // Automatic DLQ on budget violations
  failJobToDLQ(jobId: string, budgetViolation: BudgetViolation): Promise<void>;
  
  // Rollback procedures for budget breaches
  rollbackJob(jobId: string, breach: BudgetBreach): Promise<void>;
  
  // Circuit breaker event handling
  handleCircuitBreaker(event: CircuitBreakerEvent): Promise<void>;
}
```

### Budgets → Monitoring Contract
```typescript
interface BudgetMonitoringContract {
  // Real-time budget utilization tracking
  trackBudgetUtilization(tier: Tier, stage: OrchestratorStage, utilization: number): void;
  
  // Performance metrics collection
  collectBudgetMetrics(jobId: string, tracker: BudgetTracker): void;
  
  // Alert triggering for budget violations
  triggerBudgetAlert(alert: BudgetAlert): void;
  
  // Circuit breaker event monitoring
  monitorCircuitBreaker(event: CircuitBreakerEvent): void;
}
```

## Implementation Roadmap

### Phase 1: Core YAML Integration (Immediate - Sprint 1)
**Objective**: Replace hardcoded budgets with YAML-driven system

#### Implementation Tasks
1. **Create Zod Budget Schema** (`orchestrator/budget-schema.ts`)
   - Define type-safe YAML structure with retrieval stage
   - Add circuit breaker configuration schema
   - Include validation rules for budget constraints

2. **Implement BudgetLoader** (`orchestrator/budget-loader.ts`)
   - Load and validate budgets.yaml with Zod
   - Provide fallback to safe defaults on validation failure
   - Cache validated budgets for performance

3. **Enhance BudgetEnforcer** (`orchestrator/budget.ts`)
   - Add retrieval stage support (lines 84-87, 94-98)
   - Fix type safety issues with runtime validation
   - Integrate circuit breaker triggers
   - Add performance monitoring hooks

4. **Update Controller Integration** (`orchestrator/controller.ts`)
   - Use BudgetLoader instead of hardcoded BUDGETS
   - Validate all stages including retrieval (line 84-87)
   - Integrate circuit breaker DLQ handling

#### Quality Gates
- [ ] All TypeScript compilation issues resolved
- [ ] Budgets.yaml successfully loaded and validated
- [ ] Retrieval stage budget tracking functional
- [ ] Circuit breaker triggers on violations
- [ ] End-to-end budget enforcement workflow

### Phase 2: Circuit Breaker Integration (Sprint 2)
**Objective**: Integrate budget violations with automatic rollback

#### Implementation Tasks
1. **Circuit Breaker Enhancement** (`orchestrator/circuit-breaker.ts`)
   - Sophisticated violation detection logic
   - Configurable breach thresholds per tier
   - Automatic DLQ routing with detailed context
   - Rollback procedures for partial completions

2. **DLQ Integration** (`orchestrator/database.ts`)
   - Budget violation DLQ record structure
   - Automatic job failure routing
   - Retry policies for budget violations
   - Monitoring integration for breach tracking

3. **Performance Monitoring** (`orchestrator/budget-monitor.ts`)
   - Real-time budget utilization tracking
   - Alert generation for approaching limits
   - Historical budget performance analysis
   - Integration with existing monitoring systems

#### Quality Gates
- [ ] Circuit breaker triggers automatically on violations
- [ ] DLQ records created with full breach context
- [ ] Monitoring system tracks budget performance
- [ ] Alert system notifies on budget issues
- [ ] Historical budget analytics functional

### Phase 3: Advanced Features (Sprint 3)
**Objective**: Add hot reload and advanced budget management

#### Implementation Tasks
1. **Budget Hot Reload** (`orchestrator/budget-hot-reload.ts`)
   - File watching for budgets.yaml changes
   - Runtime budget updates without restart
   - Validation of new budget configurations
   - Graceful migration between budget versions

2. **Budget Analytics** (`orchestrator/budget-analytics.ts`)
   - Budget utilization trend analysis
   - Cost optimization recommendations
   - Performance bottleneck identification
   - Budget adjustment suggestions

#### Quality Gates
- [ ] Hot reload updates budgets without downtime
- [ ] Analytics provides actionable insights
- [ ] Budget optimization recommendations accurate
- [ ] System remains stable during budget updates

## Testing Strategy

### Unit Tests
```typescript
describe('BudgetLoader', () => {
  test('loads and validates budgets.yaml');
  test('provides fallback on invalid YAML');
  test('caches validated budgets');
  test('handles missing YAML gracefully');
});

describe('BudgetEnforcer', () => {
  test('supports retrieval stage budgeting');
  test('triggers circuit breaker on violations');
  test('tracks tokens accurately per stage');
  test('handles invalid stage types');
});

describe('CircuitBreaker', () => {
  test('triggers DLQ on budget breach');
  test('creates detailed breach records');
  test('handles multiple violations');
  test('integrates with rollback procedures');
});
```

### Integration Tests
```typescript
describe('Budget Integration', () => {
  test('end-to-end YAML-driven budgeting');
  test('controller uses loaded budgets');
  test('budget violations trigger DLQ');
  test('monitoring tracks budget performance');
});
```

### Performance Tests
```typescript
describe('Budget Performance', () => {
  test('budget loading under 100ms');
  test('budget validation under 50ms');
  test('circuit breaker triggers under 10ms');
  test('monitoring overhead under 5%');
});
```

## Success Criteria

### Functional Requirements
- ✅ Budgets read from `orchestrator/budgets.yaml` (Plan 01 Step 2)
- ✅ Retrieval stage budget tracking functional
- ✅ TypeScript compilation without errors
- ✅ Circuit breaker integration with DLQ
- ✅ Runtime budget validation and type safety

### Non-Functional Requirements
- ✅ Budget loading performance < 100ms
- ✅ Budget validation performance < 50ms  
- ✅ Zero regression in existing functionality
- ✅ Comprehensive test coverage (> 85%)
- ✅ Documentation and runbooks complete

### Integration Requirements
- ✅ Backward compatibility with existing controller
- ✅ Integration with existing DLQ system
- ✅ Monitoring system integration
- ✅ Alert system integration
- ✅ Database persistence compatibility

## Risk Mitigation

### Technical Risks
1. **Type Safety Issues**: Mitigated by Zod runtime validation
2. **Performance Impact**: Mitigated by budget caching and optimized validation
3. **Integration Complexity**: Mitigated by comprehensive integration testing
4. **Backward Compatibility**: Mitigated by gradual migration and fallback mechanisms

### Operational Risks
1. **Budget Configuration Errors**: Mitigated by runtime validation and safe defaults
2. **Circuit Breaker False Positives**: Mitigated by configurable thresholds and testing
3. **Monitoring Overhead**: Mitigated by efficient data collection and sampling
4. **DLQ Overload**: Mitigated by intelligent retry policies and monitoring

## Export for Phase 2

### #LCL_EXPORT_CRITICAL: Budget System Integration Contracts
- **Controller → BudgetLoader**: Load validated budgets with retrieval stage support
- **BudgetEnforcer → CircuitBreaker**: Automatic violation detection and DLQ routing
- **BudgetMonitor → Alerting**: Real-time budget utilization monitoring and alerts
- **DLQ → BudgetAnalytics**: Historical breach analysis and optimization insights

### #LCL_EXPORT_FIRM: Budget Architecture Decisions  
- **YAML-driven**: Single source of truth in `orchestrator/budgets.yaml`
- **Zod Validation**: Runtime type safety and configuration validation
- **Circuit Breaker**: Automatic protection against budget overruns
- **Stage Support**: Full orchestrator stage support including retrieval

### #LCL_EXPORT_CASUAL: Budget Configuration Preferences
- **Tier Definitions**: LIGHT/MEDIUM/HEAVY with escalating resource limits
- **Circuit Breaker Thresholds**: 100%/95%/90% budget utilization triggers
- **Monitoring cadence**: Real-time tracking with per-job granularity
- **Alert Configuration**: Warning at 80%, critical at 95% budget utilization

## Implementation Timeline

**Sprint 1 (Weeks 1-2)**: Core YAML Integration
- Week 1: Zod schema, BudgetLoader, enhanced BudgetEnforcer
- Week 2: Controller integration, testing, documentation

**Sprint 2 (Weeks 3-4)**: Circuit Breaker Integration  
- Week 3: Circuit breaker implementation, DLQ integration
- Week 4: Monitoring integration, testing, performance validation

**Sprint 3 (Weeks 5-6)**: Advanced Features
- Week 5: Hot reload implementation, budget analytics
- Week 6: Optimization, documentation, deployment preparation

**Total Timeline**: 6 weeks for complete budget enforcement domain fixes

This implementation plan addresses all critical LCL constraints while providing a robust, type-safe, and performant budget enforcement system that integrates seamlessly with the existing EIP orchestrator infrastructure.
