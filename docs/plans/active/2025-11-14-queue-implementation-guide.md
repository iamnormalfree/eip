# BullMQ/Redis Queue Implementation Guide

**Quick Reference for EIP Queue Integration**

## Architecture Decision

**Selected:** Queue-First Architecture (Approach 1)
- Queues as primary orchestrator
- Workers for processing stages
- Durable DLQ with retry strategies
- Real-time budget enforcement

## Implementation Checklist

### Phase 1: Queue Infrastructure
- [ ] Copy broker-queue.ts patterns to eip-queue.ts
- [ ] Define EIP-specific job interfaces
- [ ] Set up content generation queue
- [ ] Configure budget validation queue
- [ ] Implement DLQ queue with persistence
- [ ] Add queue monitoring endpoints

### Phase 2: Worker Implementation
- [ ] Content generation worker with stages
- [ ] Budget validation worker
- [ ] DLQ processing worker with retry logic
- [ ] Worker health monitoring
- [ ] Circuit breaker implementation

### Phase 3: Controller Integration
- [ ] Modify controller to submit jobs
- [ ] Replace runOnce with queue-based processing
- [ ] Integrate budget checkpoints
- [ ] Add queue-aware error handling
- [ ] Maintain database persistence

### Phase 4: Production Features
- [ ] Load testing (100+ jobs/min)
- [ ] Budget breach latency (<100ms)
- [ ] DLQ recovery (<5 min MTTR)
- [ ] Monitoring dashboard
- [ ] Alerting configuration

## Key Files to Create/Modify

### New Files
```
lib_supabase/queue/eip-queue.ts           # EIP queue manager
lib_supabase/queue/eip-dlq.ts            # DLQ handling
lib_supabase/queue/eip-workers.ts        # Worker implementations
lib_supabase/queue/eip-types.ts          # Type definitions
orchestrator/workers/                    # Worker directory
```

### Modified Files
```
orchestrator/controller.ts               # Queue integration
orchestrator/budget.ts                   # DLQ routing
lib_supabase/queue/redis-config.ts       # EIP queue config
app/api/generate/route.ts               # Queue submission API
```

## Integration Patterns

### Job Submission Pattern
```typescript
// API endpoint → Queue submission
const job = await eipQueue.submitContentGeneration({
  brief, persona, funnel, tier,
  correlation_id,
  priority: tier === 'HEAVY' ? 1 : tier === 'MEDIUM' ? 3 : 5
});
```

### Worker Processing Pattern
```typescript
// Queue → Worker → Results
await worker.process(async (job) => {
  const budget = new BudgetEnforcer(job.data.tier);
  
  // Process stage with budget checkpoints
  budget.startStage('generation');
  const result = await generateContent(job.data);
  budget.addTokens('generation', estimateTokens(result));
  
  if (!budget.checkStageBudget('generation').ok) {
    throw new BudgetExhaustedError('Generation budget exceeded');
  }
  
  return result;
});
```

### DLQ Recovery Pattern
```typescript
// DLQ → Retry/Escalate
await dlqWorker.process(async (job) => {
  const { retry_count, breach_type } = job.data;
  
  if (retry_count >= MAX_RETRIES) {
    await escalateToHumanReview(job.data);
    return;
  }
  
  if (breach_type === 'tokens') {
    const upgradedJob = upgradeTier(job.data.original_job);
    await resubmitWithDelay(upgradedJob, getRetryDelay(retry_count));
  }
});
```

## Configuration

### Redis Configuration
```typescript
// EIP-specific Redis settings
const EIP_REDIS_CONFIG = {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => times < 10 ? Math.min(times * 100, 3000) : null,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  keepAlive: 30000
};
```

### Queue Configuration
```typescript
// BullMQ queue options
const QUEUE_OPTIONS = {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 604800 }
  }
};
```

## Monitoring

### Health Checks
```typescript
// Queue health endpoint
app.get('/api/health/queues', async (req, res) => {
  const metrics = await getEIPQueueMetrics();
  const healthy = metrics.failed_count < 10 && metrics.waiting < 50;
  
  res.json({
    status: healthy ? 'healthy' : 'degraded',
    metrics,
    timestamp: Date.now()
  });
});
```

### Budget Monitoring
```typescript
// Budget breach alerts
if (budgetBreachRate > 0.05) { // 5% breach rate
  await alerting.sendAlert({
    type: 'budget_breach_spike',
    severity: 'warning',
    message: `Budget breach rate: ${(budgetBreachRate * 100).toFixed(1)}%`,
    metrics: { budgetBreachRate, activeJobs, dlqDepth }
  });
}
```

## Common Issues & Solutions

### Redis Connection Issues
**Problem:** Redis connection timeouts  
**Solution:** Connection pooling with retry strategies
```typescript
const pool = new RedisPool({
  max: 20,
  min: 5,
  retryDelayOnFailover: 100
});
```

### Queue Backpressure
**Problem:** Queue depth growing without bound  
**Solution:** Dynamic worker scaling
```typescript
if (queueDepth > 100) {
  await workerManager.scaleUp(Math.min(queueDepth / 10, 20));
}
```

### Budget Enforcement Gaps
**Problem:** Budget violations detected too late  
**Solution:** Predictive budget checking
```typescript
const estimatedCost = predictJobCost(job);
if (estimatedCost > budget.remaining) {
  await routeToDLQ(job, 'predicted_budget_exhaustion');
}
```

## Performance Targets

### Throughput
- **Target:** 100+ jobs/minute
- **Current:** 1 job/runOnce execution
- **Improvement:** 100x increase in processing capacity

### Latency
- **Job Queue Add:** < 10ms
- **Budget Enforcement:** < 100ms
- **DLQ Routing:** < 50ms
- **Worker Processing:** Variable by tier

### Reliability
- **Job Success Rate:** > 99%
- **DLQ Recovery Rate:** > 95%
- **Budget Breach Detection:** Real-time
- **System Uptime:** > 99.9%

## Emergency Procedures

### Queue Drain
```bash
# Emergency queue drain
curl -X POST /api/admin/queues/drain \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### DLQ Manual Recovery
```bash
# Manual DLQ processing
curl -X POST /api/admin/dlq/reprocess \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"job_ids": ["job1", "job2"]}'
```

### Budget Override
```bash
# Emergency budget increase
curl -X POST /api/admin/budget/override \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"tier": "HEAVY", "increase_percent": 20}'
```

---

**Timeline:** 1 week core implementation, 1 week production hardening  
**Success Criteria:** Queue processing 100+ jobs/min with <1% failure rate  
**Risk Mitigation:** Leverage existing broker queue patterns, phased rollout
