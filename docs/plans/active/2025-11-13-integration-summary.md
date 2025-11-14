# Integration Contracts Summary — EIP Steel Thread

## Quick Reference for Phase 2

### #LCL_EXPORT_CRITICAL: Cross-Domain Dependency Map

```yaml
critical_dependencies:
  database_schema_to_orchestrator:
    contract: jobs_table_contract
    validation: tests/db/schema.test.ts
    failure_mode: job_rejection_to_dlq
    
  ip_library_to_router:
    contract: ip_selection_contract  
    validation: npm run ip:validate
    failure_mode: early_termination
    
  budgets_to_orchestrator:
    contract: enforcement_contract
    validation: orchestrator/budgets.yaml
    failure_mode: dlq_with_audit_trail
    
  templates_to_publisher:
    contract: rendering_contract
    validation: jsonld_schema_tests
    failure_mode: repair_cycle
    
  review_ui_to_database:
    contract: approval_workflow_contract
    validation: ui_state_sync_tests
    failure_mode: non_blocking_error_display
    
  scripts_to_all_domains:
    contract: validation_contract
    validation: end_to_end_pipeline_tests
    failure_mode: logged_non_blocking
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

## Key Integration Decisions

### #PATH_DECISION: Queue Architecture
- **Decision**: Separate Redis namespace for EIP orchestrator queue
- **Implementation**: Use `eip:` prefix for all EIP queue keys
- **Rationale**: Prevents conflicts with existing broker queue system

### #PATH_DECISION: Budget Enforcement Strategy  
- **Decision**: Hard enforcement at orchestrator level with circuit breakers
- **Implementation**: Token counters + wallclock timers with DLQ on breach
- **Rationale**: Ensures cost control and performance predictability

### #PATH_DECISION: Error Recovery Approach
- **Decision**: Graceful degradation with audit trails
- **Implementation**: Structured error logging with correlation IDs
- **Rationale**: Maintains system reliability while preserving debugging information

## Critical Risk Mitigations

1. **Queue System Integration**
   - Risk: Redis key collisions with broker queue
   - Mitigation: Strict namespace separation with 'eip:' prefix
   
2. **Budget Enforcement Integration**  
   - Risk: Performance impact from token counting
   - Mitigation: Efficient counters + periodic validation
   
3. **Database Schema Integration**
   - Risk: Breaking changes to existing schema
   - Mitigation: Additive changes only, migration scripts
   
4. **Template System Integration**
   - Risk: JSON-LD schema validation failures
   - Mitigation: Pre-render validation + repair cycles

## Legacy Compatibility Patterns

**Preserve:**
- Dual client pattern (anon/admin) for database access
- Separate Redis prefixes for queue isolation
- BullMQ patterns from lib_supabase/queue
- Structured logging with correlation IDs

**Handle with Care:**
- Redis connection management (don't interfere with broker queue)
- Database connection pooling (share existing patterns)
- Error handling consistency (follow existing conventions)
- Monitoring integration (extend existing patterns)

---

*This summary provides the critical integration exports for Phase 2 planning and implementation.*
