# Integration Contracts Plan — EIP Steel Thread Cross-Domain Coordination

**Domain**: Integration (cross-system contracts and dependencies)  
**Phase**: 0 → 1 Transition  
**Impact Level**: High (coordinates all 6 domains, single point of failure)  
**Risk Level**: High (complex contracts between multiple domains)

## Phase 0 Context Analysis

**Existing Constraints from Phase 0:**
- LCL: constraint::performance::end_to_end_pipeline_must_complete_within_medium_budget
- LCL: constraint::architecture::queue_integration_must_not_conflict_with_existing_broker_queue
- LCL: pattern::existing::legacy_compatibility_patterns_in_place
- LCL: risk::high_priority::multiple_integration_points_must_work_together

**Current Integration State:**
- BullMQ broker queue exists with Redis (`lib_supabase/queue/broker-queue.ts`)
- Budgets configuration scaffolded (`orchestrator/budgets.yaml`)
- Database schema minimal but SoT pattern established
- Legacy compatibility patterns identified (dual client pattern, Redis prefixes)

## EIP Domain Mapping

**Primary Integration Domains:**
1. **Database** (Supabase) - Source of Truth
2. **Orchestrator** - Pipeline Control & Budgets
3. **IP Library** - Educational Structure Definitions
4. **Templates** - JSON-LD & Content Rendering
5. **Review UI** - Human-in-the-Loop Interface
6. **Scripts & Components** - Supporting Infrastructure

**Critical Integration Points:**
- Database ↔ Orchestrator: Job lifecycle, artifact persistence
- Templates ↔ Publisher: Content rendering & JSON-LD generation
- Review UI ↔ Database: Draft approval workflow
- Scripts ↔ Components: Testing & validation infrastructure
- IP Library ↔ Router: Deterministic IP selection
- Queue System ↔ All domains: Async coordination

## Integration Approach Analysis

### Approach 1: Sequential Integration (RECOMMENDED)

**Pattern**: Database → IP Library → Orchestrator → Templates → Review UI → Scripts

**Advantages:**
- Clear dependency chain with minimal parallel complexity
- Allows incremental validation at each integration point
- Follows existing steel thread sequence from Plan 01
- Reduces risk of circular dependencies

**Integration Contracts:**

```
1. Database Integration Contract
   - Schema validation: `tests/db/schema.test.ts`
   - Connection management: Supabase client singleton pattern
   - Migration strategy: Version-controlled schema.sql
   - Error boundary: Connection failures → DLQ

2. IP Library Integration Contract  
   - Validation gate: `npm run ip:validate` must pass
   - Router dependency: IP selection before content generation
   - Version management: Semver enforcement in filenames
   - Error boundary: Invalid IPs → job rejection

3. Orchestrator Integration Contract
   - Budget enforcement: MEDIUM tier limits (2400 tokens, 45s)
   - Queue coordination: Separate Redis namespace from broker queue
   - State management: Job records with correlation IDs
   - Error boundary: Budget breaches → DLQ with audit trail

4. Templates Integration Contract
   - JSON-LD validation: Schema compliance before publishing
   - Template discovery: Jinja/Nunjucks loader pattern
   - Rendering pipeline: MDX + frontmatter generation
   - Error boundary: Template failures → repair cycle

5. Review UI Integration Contract
   - State sync: Real-time draft status from database
   - Approval workflow: Brand profile feedback integration
   - UI consistency: Component library integration
   - Error boundary: UI failures → non-blocking content display

6. Scripts Integration Contract
   - Test coordination: End-to-end pipeline validation
   - Monitoring integration: Health checks across domains
   - Automation hooks: Pre-deployment validation gates
   - Error boundary: Script failures → logged but non-blocking
```

### Approach 2: Parallel Domain Integration (ALTERNATIVE)

**Pattern**: Simultaneous development with integration contracts

**Advantages:**
- Faster parallel development potential
- Early identification of cross-domain conflicts
- Better resource utilization across teams

**Risks:**
- #PARALLEL_DEGRADATION: High complexity tracking multiple domain interactions
- Integration conflicts discovered late
- Higher coordination overhead

### Approach 3: Event-Driven Integration (FUTURE PHASE)

**Pattern**: Domain communication via Redis events/queues

**Advantages:**
- Loose coupling between domains
- Better scalability for Phase 2+
- Natural async patterns

**Risks:**
- Over-engineering for Phase 0 steel thread
- Complex debugging and tracing
- #PLAN_UNCERTAINTY: Event schema evolution challenges

## Recommended Integration Strategy: Sequential with Contract Validation

**Primary Path**: Approach 1 (Sequential Integration)

**Rationale:**
- Aligns with existing Plan 01 steel thread sequence
- Minimizes integration complexity for Phase 0
- Provides clear validation gates at each step
- Respects existing legacy compatibility patterns

**Implementation Phases:**

### Phase 1: Core Infrastructure Integration
```
Database → IP Library → Orchestrator
```

**Contract Validation Sequence:**
1. Database schema validation (`db/setup.ts`)
2. IP library validation (`scripts/validate-ips.ts`)
3. Orchestrator budget enforcement (`orchestrator/budgets.yaml`)
4. Queue namespace separation (Redis prefixes)

**Error Propagation Strategy:**
- Database failures: Immediate job rejection, logged to jobs table
- IP validation failures: Job rejection before resource allocation
- Budget breaches: Graceful degradation to DLQ with audit trail
- Queue conflicts: Separate Redis prefixes to prevent broker queue interference

### Phase 2: Content Pipeline Integration  
```
Orchestrator → Templates → Review UI
```

**Contract Validation Sequence:**
1. Template discovery and validation
2. JSON-LD schema compliance
3. Review UI state synchronization
4. Approval workflow integration

**Error Propagation Strategy:**
- Template failures: Trigger repair cycle with bounded scope
- JSON-LD validation: Content rejection with specific error tagging
- UI sync failures: Non-blocking error display with retry mechanisms
- Approval failures: Feedback loop to brand profiles

### Phase 3: Validation Infrastructure Integration
```
All Domains → Scripts & Monitoring
```

**Contract Validation Sequence:**
1. End-to-end pipeline testing
2. Cross-domain health monitoring
3. Performance budget validation
4. Compliance integration verification

## Cross-Domain Dependency Map

### Critical Path Dependencies
```
[Database (Supabase)] 
    ↓ (schema validation)
[IP Library] 
    ↓ (invariant validation)
[Orchestrator] 
    ↓ (budget enforcement)
[Templates] 
    ↓ (content rendering)
[Review UI] 
    ↓ (approval workflow)
[Scripts/Monitoring]
```

### Parallel Integration Opportunities
- Scripts can be developed alongside core domains
- Monitoring infrastructure can be integrated incrementally
- Test infrastructure can be developed in parallel with implementation

### Error Recovery Patterns
```
Database Errors → Job Rejection → Audit Trail
IP Errors → Validation Failure → Early Termination  
Budget Errors → DLQ → Repair Cycle
Template Errors → Local Repair → Re-render
UI Errors → Graceful Degradation → User Notification
```

## Integration Testing Strategy

### Unit Integration Tests
```
- Database: `tests/db/schema.test.ts`
- IP Library: `tests/ip/validator.test.ts` 
- Orchestrator: `tests/orchestrator/controller.test.ts`
- Templates: `tests/publisher/jsonld.test.ts`
- Review UI: `tests/ui/review.test.tsx`
```

### End-to-End Integration Tests
```
- Steel thread pipeline: brief → IP routing → retrieval → generation → audit → publish
- Budget enforcement: MEDIUM tier token/time limits
- Queue coordination: Non-interference with broker queue
- Error propagation: Domain boundary failure handling
```

### Performance Integration Tests
```
- MEDIUM tier compliance: 2400 tokens, 45 seconds
- Concurrent job handling: Queue throughput validation
- Resource utilization: Memory/CPU monitoring
- Database performance: Query optimization validation
```

## Integration Validation Strategy

### Pre-Integration Validation
```
1. Schema compatibility check
2. IP invariant validation  
3. Budget configuration verification
4. Template schema compliance
5. Queue namespace isolation
```

### Runtime Integration Monitoring
```
1. Cross-domain health checks
2. End-to-end latency monitoring
3. Error rate tracking by domain
4. Budget breach detection
5. Queue depth monitoring
```

### Post-Integration Validation
```
1. Artifact quality verification
2. Compliance rule adherence
3. Performance benchmark validation
4. User workflow testing
5. Rollback procedure verification
```

## Critical Integration Decisions

### #PATH_DECISION: Queue Architecture
**Decision**: Separate Redis namespace for EIP orchestrator queue
**Rationale**: Prevents conflicts with existing broker queue system
**Implementation**: Use `eip:` prefix for all EIP queue keys

### #PATH_DECISION: Budget Enforcement Strategy  
**Decision**: Hard enforcement at orchestrator level with circuit breakers
**Rationale**: Ensures cost control and performance predictability
**Implementation**: Token counters + wallclock timers with DLQ on breach

### #PATH_DECISION: Error Recovery Approach
**Decision**: Graceful degradation with audit trails
**Rationale**: Maintains system reliability while preserving debugging information  
**Implementation**: Structured error logging with correlation IDs

## Legacy Compatibility Considerations

### Existing Patterns to Preserve
```
- Dual client pattern (anon/admin) for database access
- Separate Redis prefixes for queue isolation
- BullMQ patterns from lib_supabase/queue
- Structured logging with correlation IDs
```

### Integration Points Requiring Care
```
- Redis connection management (don't interfere with broker queue)
- Database connection pooling (share existing patterns)
- Error handling consistency (follow existing conventions)
- Monitoring integration (extend existing patterns)
```

## Risk Mitigation Strategy

### High-Risk Integration Points
```
1. Queue System Integration
   - Risk: Redis key collisions with broker queue
   - Mitigation: Strict namespace separation with 'eip:' prefix
   
2. Budget Enforcement Integration  
   - Risk: Performance impact from token counting
   - Mitigation: Efficient counters + periodic validation
   
3. Database Schema Integration
   - Risk: Breaking changes to existing schema
   - Mitigation: Additive changes only, migration scripts
   
4. Template System Integration
   - Risk: JSON-LD schema validation failures
   - Mitigation: Pre-render validation + repair cycles
```

### Rollback Strategy
```
1. Database: Version-controlled schema rollback
2. Code: Feature flags for new integration components  
3. Queue: Drain queues before rollback
4. Configuration: Environment-based feature toggles
```

## Phase 2 Export Requirements

### #LCL_EXPORT_CRITICAL: Cross-Domain Dependency Map
```yaml
critical_dependencies:
  - database_schema_to_orchestrator: jobs_table_contract
  - ip_library_to_router: ip_selection_contract  
  - budgets_to_orchestrator: enforcement_contract
  - templates_to_publisher: rendering_contract
  - review_ui_to_database: approval_workflow_contract
  - scripts_to_all_domains: validation_contract
```

### #LCL_EXPORT_FIRM: Integration Validation Strategy
```yaml
validation_strategy:
  pre_integration:
    - schema_compatibility_check
    - ip_invariant_validation
    - budget_configuration_verification
    - template_discovery_validation
    - queue_namespace_isolation
    
  runtime_monitoring:
    - cross_domain_health_checks
    - end_to_end_latency_monitoring
    - error_rate_tracking_by_domain
    - budget_breach_detection
    - queue_depth_monitoring
    
  post_integration_validation:
    - artifact_quality_verification
    - compliance_rule_adherence
    - performance_benchmark_validation
    - user_workflow_testing
    - rollback_procedure_verification
```

## Implementation Timeline

### Week 1: Core Infrastructure Integration
- Database schema validation and setup
- IP library validator implementation
- Orchestrator budget enforcement
- Queue namespace separation

### Week 2: Content Pipeline Integration  
- Template discovery and rendering
- JSON-LD validation pipeline
- Review UI integration
- Error propagation implementation

### Week 3: Validation Infrastructure Integration
- End-to-end testing framework
- Cross-domain monitoring
- Performance validation
- Rollback procedures

## Success Criteria

**Technical Success:**
- All integration contracts validated and passing
- End-to-end pipeline completes within MEDIUM budget
- Zero queue conflicts with existing broker system
- All domain boundaries properly tested

**Operational Success:**
- Clear error propagation across domain boundaries
- Comprehensive monitoring and alerting
- Validated rollback procedures
- Documentation of all integration contracts

**Quality Success:**
- Integration tests covering all critical paths
- Performance benchmarks within acceptable ranges
- Error recovery mechanisms tested and validated
- Legacy compatibility maintained

---

*This integration plan provides the foundation for reliable cross-domain coordination while respecting existing constraints and preparing for Phase 2 expansion.*
