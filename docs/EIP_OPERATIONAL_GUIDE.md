# EIP Steel Thread - Operational Guide

## Quick Start Guide

### Prerequisites Setup
```bash
# Verify Node.js and TypeScript
node --version  # Should be 18+
npm --version

# Verify database access
psql $SUPABASE_URL -c "SELECT 1;"

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration
```bash
# Required environment variables
export EIP_BRIEF="Explain refinancing mechanism in SG"
export EIP_PERSONA="default_persona"
export EIP_FUNNEL="MOFU"
export EIP_TIER="MEDIUM"
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-key"

# Optional (for development)
export EIP_LEGACY_COMPAT="true"  # Remove after 2 weeks
export NODE_ENV="development"
```

## Database Operations

### Initial Setup
```bash
# Step 1: Apply EIP schema
npm run db:setup

# Step 2: Verify schema creation
npm run db:verify

# Step 3: Seed test data (optional)
npm run db:seed

# Step 4: Test database connectivity
npm run test:database
```

### Database Verification Commands
```sql
-- Check EIP tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'eip_%';

-- Verify bridge functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE 'get_eip_%' OR routine_name LIKE 'link_broker_%';

-- Test sample data
SELECT COUNT(*) FROM eip_artifacts;
SELECT COUNT(*) FROM eip_jobs;
SELECT COUNT(*) FROM eip_entities;
```

### Maintenance Operations
```sql
-- Clean up old draft artifacts (older than 30 days)
DELETE FROM eip_artifacts 
WHERE status = 'draft' AND created_at < NOW() - INTERVAL '30 days';

-- Archive completed jobs (older than 90 days)
DELETE FROM eip_jobs 
WHERE stage = 'completed' AND started_at < NOW() - INTERVAL '90 days';

-- Update entity validity
UPDATE eip_entities 
SET valid_to = NOW() 
WHERE type = 'rate_snapshot' AND valid_to IS NULL 
AND created_at < NOW() - INTERVAL '7 days';
```

## Orchestrator Operations

### Running the Steel Thread
```bash
# Basic execution
npm run orchestrator:start

# Custom brief execution
EIP_BRIEF="How does mortgage refinancing work in Singapore?" npm run orchestrator:start

# Heavy tier execution
EIP_TIER="HEAVY" npm run orchestrator:start

# With correlation tracking
EIP_CORRELATION_ID="user_123_session_456" npm run orchestrator:start
```

### Monitoring Execution
```bash
# Follow logs in real-time
npm run orchestrator:start 2>&1 | tee orchestration.log

# Monitor budget usage
grep -E "(tokens|budget|breach)" orchestration.log

# Check for DLQ entries
grep -i "dlq\|dead.*letter" orchestration.log
```

### Troubleshooting Common Issues

#### Budget Breaches
```bash
# Symptoms: "Budget breach" or "sent to DLQ" messages
# Solutions:
# 1. Reduce brief complexity
export EIP_BRIEF="Simple explanation of refinancing"

# 2. Use higher tier
export EIP_TIER="HEAVY"

# 3. Check for infinite loops in generation
```

#### Database Connection Issues
```bash
# Symptoms: "Database not available" messages
# Solutions:
# 1. Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# 2. Test database connectivity
psql $SUPABASE_URL -c "SELECT 1;"

# 3. Check network connectivity
ping your-supabase-hostname
```

#### IP Validation Failures
```bash
# Symptoms: "IP invariant" or "validation" errors
# Solutions:
# 1. Validate IP library
npm run ip:validate

# 2. Check IP file integrity
ls -la ip_library/
cat ip_library/framework@1.0.0.yaml

# 3. Verify persona and funnel values
export EIP_PERSONA="homeowner"
export EIP_FUNNEL="MOFU"
```

## Quality Assurance Operations

### Running Test Suites
```bash
# IP library validation
npm run ip:validate

# Compliance rule checking
npm run compliance:check

# Retrieval system testing
npm run retrieval:test

# Auditor functionality testing
npm run auditor:test

# Full integration test
npm run test:integration

# Performance budget validation
npm run test:performance
```

### Quality Gate Monitoring
```bash
# Monitor IP invariant compliance
npm run ip:validate | grep -E "(PASS|FAIL)"

# Check compliance rules
npm run compliance:check | grep -E "(allow.*list|financial|legal)"

# Verify budget enforcement
EIP_TIER="LIGHT" npm run orchestrator:start
# Should fail with budget breach for complex content
```

### Content Quality Verification
```bash
# Test micro-auditor output
npm run auditor:test

# Verify structured tags
cat << 'EOF' | node -e "
const audit = require('./orchestrator/auditor');
audit.microAudit({
  draft: 'Test content with mechanism section',
  ip: 'framework'
}).then(console.log);
"

# Check template rendering
npm run test:templates
```

## Review UI Operations

### Starting the Review Interface
```bash
# Start development server
npm run dev

# Access review interface
# Navigate to: http://localhost:3002/review
```

### Review Workflow
1. **Access Review Queue**: Navigate to `/review`
2. **Review Draft Content**: Examine generated content, ledger, and tags
3. **Quality Assessment**: Check IP structure, compliance, and overall quality
4. **Approval Actions**:
   - **Approve**: Content moves to published status
   - **Reject**: Content marked as rejected with feedback
   - **Request Changes**: Returns to draft with specific feedback

### Review UI Troubleshooting
```bash
# If review page shows no artifacts
# 1. Check database for drafts
psql $SUPABASE_URL -c "SELECT id, status, created_at FROM eip_artifacts WHERE status = 'draft';"

# 2. Verify orchestrator is creating artifacts
npm run orchestrator:start
psql $SUPABASE_URL -c "SELECT id, status, stage FROM eip_jobs ORDER BY created_at DESC LIMIT 5;"

# 3. Check API endpoints
curl http://localhost:3000/api/artifacts/drafts
```

## Performance Monitoring

### Budget Tracking
```bash
# Monitor real-time budget usage
npm run orchestrator:start | grep -E "(tokens|budget|cost|duration)"

# Generate performance report
npm run performance:report

# Check budget enforcement
EIP_TIER="LIGHT" npm run orchestrator:start  # Should fail appropriately
```

### System Health Checks
```bash
# Database performance
psql $SUPABASE_URL -c "
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' AND tablename LIKE 'eip_%';
"

# Query performance analysis
psql $SUPABASE_URL -c "
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements 
WHERE query LIKE '%eip_%'
ORDER BY total_time DESC
LIMIT 10;
"
```

### Alert Monitoring
```bash
# Set up log monitoring
tail -f /var/log/eip/orchestrator.log | grep -E "(ERROR|WARN|DLQ|breach)"

# Monitor database connection pool
psql $SUPABASE_URL -c "SELECT * FROM pg_stat_activity WHERE application_name LIKE '%eip%';"

# Check disk space for logs and data
df -h /var/log/eip/
df -h /var/lib/postgresql/
```

## Deployment Operations

### Pre-deployment Checklist
```bash
# 1. Verify all tests pass
npm run test

# 2. Validate database schema
npm run db:verify

# 3. Check environment variables
env | grep EIP_

# 4. Verify IP library
npm run ip:validate

# 5. Test budget enforcement
npm run test:performance
```

### Deployment Steps
```bash
# 1. Backup current database
pg_dump $SUPABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply any pending migrations
npm run db:migrate

# 3. Restart services
npm run restart

# 4. Verify deployment
npm run health:check

# 5. Run smoke test
npm run test:smoke
```

### Rollback Procedures
```bash
# 1. Stop services
npm run stop

# 2. Restore database (if needed)
psql $SUPABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 3. Restore previous code
git checkout previous-tag

# 4. Restart with previous version
npm run start

# 5. Verify rollback
npm run health:check
```

## Daily Operations Checklist

### Morning Checks
- [ ] Review overnight orchestration logs for errors
- [ ] Check DLQ for budget breaches
- [ ] Verify review queue backlog
- [ ] Monitor database performance
- [ ] Check system resource utilization

### Throughout the Day
- [ ] Monitor real-time orchestration success rates
- [ ] Watch for budget enforcement patterns
- [ ] Track content quality metrics
- [ ] Respond to review queue alerts
- [ ] Monitor system health dashboards

### End of Day
- [ ] Generate daily performance report
- [ ] Archive orchestration logs
- [ ] Review quality gate effectiveness
- [ ] Update any necessary configurations
- [ ] Prepare overnight batch jobs

## Emergency Procedures

### System Outage Response
1. **Immediate Assessment**
   ```bash
   # Check service status
   npm run health:check
   
   # Review error logs
   tail -100 /var/log/eip/orchestrator.log | grep ERROR
   
   # Check database connectivity
   psql $SUPABASE_URL -c "SELECT 1;"
   ```

2. **Service Recovery**
   ```bash
   # Restart services
   npm run restart
   
   # Clear any stuck jobs
   npm run jobs:clear-stuck
   
   # Verify recovery
   npm run health:check
   ```

3. **Communication**
   - Notify operations team
   - Update status dashboard
   - Document root cause and resolution

### Performance Degradation
1. **Identify Bottleneck**
   ```bash
   # Check query performance
   npm run db:slow-queries
   
   # Monitor resource usage
   top -p $(pgrep -f eip)
   
   # Check queue depth
   npm run queue:status
   ```

2. **Immediate Mitigation**
   ```bash
   # Scale up resources
   npm run scale:up
   
   # Clear caches if needed
   npm run cache:clear
   
   # Reduce concurrent processing
   npm run throttling:enable
   ```

### Data Integrity Issues
1. **Assessment**
   ```bash
   # Check data consistency
   npm run db:integrity-check
   
   # Verify recent changes
   npm run db:recent-changes
   
   # Backup current state
   pg_dump $SUPABASE_URL > emergency_backup.sql
   ```

2. **Recovery**
   ```bash
   # Restore from last known good backup
   psql $SUPABASE_URL < last_good_backup.sql
   
   # Verify data integrity
   npm run db:verify
   
   # Resume operations
   npm run start
   ```

---

## Support and Contact Information

### Technical Support
- **Documentation**: `/docs/` directory
- **Issue Tracking**: Use project's issue tracker
- **Emergency Contact**: Operations team lead

### Monitoring Dashboards
- **System Health**: Internal monitoring URL
- **Performance Metrics**: Grafana dashboard
- **Error Tracking**: Error monitoring service

### Service Level Agreements
- **Uptime Target**: 99.5%
- **Response Time**: < 2 seconds for API calls
- **Orchestration**: < 60 seconds for MEDIUM tier
- **Review Queue**: < 24 hours turnaround

---

*Last Updated: 2025-11-14*
*Version: 1.0*
