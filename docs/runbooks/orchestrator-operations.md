# EIP Orchestrator Operations Runbook

**Version**: 1.0.0
**Last Updated**: 2025-11-15
**Purpose**: Operational procedures for EIP Orchestrator maintenance, monitoring, and troubleshooting

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Startup and Shutdown](#startup-and-shutdown)
3. [Health Monitoring](#health-monitoring)
4. [Performance Management](#performance-management)
5. [Troubleshooting](#troubleshooting)
6. [Circuit Breaker Management](#circuit-breaker-management)
7. [Queue Operations](#queue-operations)
8. [Budget Management](#budget-management)
9. [Log Analysis](#log-analysis)
10. [Emergency Procedures](#emergency-procedures)

---

## 🏗️ System Overview

### Architecture Components
- **Orchestrator Controller**: Main pipeline orchestrator with queue-first architecture
- **Budget Enforcer**: Token and time budget management with circuit breaker
- **Router**: Deterministic IP selection with confidence scoring
- **Logger**: Structured logging with correlation tracking
- **Queue System**: BullMQ with Redis for job processing
- **Database**: Supabase for job and artifact persistence

### Key Metrics
- **Throughput**: Jobs processed per minute
- **Latency**: End-to-end processing time
- **Error Rate**: Failed jobs percentage
- **Budget Utilization**: Token usage efficiency
- **Queue Depth**: Pending jobs count

---

## 🚀 Startup and Shutdown

### Normal Startup

```bash
# 1. Start Redis (queue backend)
redis-server

# 2. Start EIP Queue Workers
npm run orchestrator:start

# 3. Verify system health
npm run orchestrator:health-check
```

### Development Mode Startup

```bash
# Start with hot reload
npm run orchestrator:dev

# Monitor logs in real-time
tail -f logs/eip-orchestrator.log
```

### Graceful Shutdown

```bash
# 1. Stop accepting new jobs
# (Environment variable: EIP_ACCEPT_JOBS=false)

# 2. Wait for active jobs to complete (max 5 minutes)
# Monitor queue depth:
redis-cli llen bull:eip:content-generation:waiting

# 3. Stop workers
# (Send SIGTERM to orchestrator processes)

# 4. Verify all jobs completed
redis-cli keys bull:eip:*
```

### Emergency Shutdown

```bash
# Force stop (may cause data loss)
pkill -f orchestrator

# Or use systemd (if configured)
sudo systemctl stop eip-orchestrator
```

---

## 🏥 Health Monitoring

### Health Check Endpoints

```bash
# Basic health check
curl http://localhost:3002/api/health

# Detailed system status
curl http://localhost:3002/api/health/detailed

# Queue status
curl http://localhost:3002/api/health/queues
```

### Key Health Indicators

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Queue Depth | < 100 | 100-500 | > 500 |
| Error Rate | < 5% | 5-15% | > 15% |
| Response Time | < 2s | 2-5s | > 5s |
| Memory Usage | < 80% | 80-90% | > 90% |
| CPU Usage | < 70% | 70-85% | > 85% |

### Monitoring Commands

```bash
# System resources
htop
iostat -x 1

# Redis queue status
redis-cli info memory
redis-cli info stats

# Application logs
tail -f logs/eip-orchestrator.log | grep ERROR

# Recent errors
grep "ERROR" logs/eip-orchestrator.log | tail -10
```

---

## ⚡ Performance Management

### Performance Tuning

#### Budget Optimization
```yaml
# Adjust budgets.yaml for workload
budgets:
  MEDIUM:
    generator: 2000  # Reduce if over budget
    wallclock_s: 30  # Reduce if timeouts occur
```

#### Queue Configuration
```bash
# Redis memory optimization
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Worker scaling
export EIP_WORKER_CONCURRENCY=10
export EIP_QUEUE_CONCURRENCY=5
```

#### Database Optimization
```sql
-- Monitor slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Clean up old jobs (older than 30 days)
DELETE FROM orchestrator_jobs
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Performance Monitoring

```bash
# Real-time performance
npm run orchestrator:monitor

# Generate performance report
npm run orchestrator:performance-report

# Memory leak detection
node --inspect orchestrator/controller.ts
```

---

## 🔧 Troubleshooting

### Common Issues

#### High Error Rate
```bash
# Check recent errors
tail -100 logs/eip-errors.log

# Identify error patterns
grep "ERROR" logs/eip-orchestrator.log | awk '{print $5}' | sort | uniq -c

# Check budget breaches
grep "budget_enforcement" logs/eip-orchestrator.log | tail -20
```

#### Queue Backlog
```bash
# Check queue depth
redis-cli llen bull:eip:content-generation:waiting

# Check stuck jobs
redis-cli lrange bull:eip:content-generation:active 0 -1

# Clear stuck jobs (emergency only)
redis-cli del bull:eip:content-generation:active
```

#### Memory Issues
```bash
# Check memory usage
ps aux | grep orchestrator

# Monitor memory leaks
while true; do
  ps aux | grep orchestrator | awk '{print $6}' | paste -sd+ | bc
  sleep 30
done
```

#### Database Connection Issues
```bash
# Check connection pool
psql -h localhost -U postgres -c "SELECT * FROM pg_stat_activity;"

# Restart connection pool
sudo systemctl restart postgresql
```

### Debug Mode

```bash
# Enable debug logging
export EIP_LOG_LEVEL=debug
export EIP_DEBUG=true

# Run with debugger
node --inspect-brk orchestrator/controller.ts

# Generate debug report
npm run orchestrator:debug-report
```

---

## 🔄 Circuit Breaker Management

### Circuit Breaker States

| State | Description | Action |
|-------|-------------|--------|
| CLOSED | Normal operation | Monitor metrics |
| OPEN | Blocking requests | Investigate failures |
| HALF_OPEN | Testing recovery | Monitor closely |

### Circuit Breaker Commands

```bash
# Check circuit breaker status
curl http://localhost:3002/api/circuit-breaker/status

# Force reset circuit breaker
curl -X POST http://localhost:3002/api/circuit-breaker/reset

# Monitor circuit breaker events
grep "circuit_breaker" logs/eip-orchestrator.log | tail -20
```

### Recovery Procedures

```bash
# 1. Identify root cause
grep -B5 -A5 "circuit_breaker.*OPEN" logs/eip-orchestrator.log

# 2. Fix underlying issue
# (Check budget limits, external services, etc.)

# 3. Reset circuit breaker
curl -X POST http://localhost:3002/api/circuit-breaker/reset

# 4. Monitor recovery
watch -n 5 'curl -s http://localhost:3002/api/circuit-breaker/status'
```

---

## 📋 Queue Operations

### Queue Management

```bash
# View queue statistics
redis-cli info keyspace
redis-cli keys bull:eip:*

# Check specific queue
redis-cli llen bull:eip:content-generation:waiting
redis-cli llen bull:eip:content-generation:active
redis-cli llen bull:eip:content-generation:completed

# View job details
redis-cli hgetall bull:eip:content-generation:1

# Clean up completed jobs (older than 24h)
redis-cli zremrangebyscore bull:eip:content-generation:completed 0 $(date +%s --date='24 hours ago')
```

### Dead Letter Queue (DLQ)

```bash
# Check DLQ
redis-cli llen bull:eip:content-generation:dlq

# Inspect failed jobs
redis-cli lrange bull:eip:content-generation:dlq 0 10

# Retry DLQ jobs
curl -X POST http://localhost:3002/api/queue/retry-dlq

# Clear DLQ (emergency only)
redis-cli del bull:eip:content-generation:dlq
```

### Queue Scaling

```bash
# Add more workers
export EIP_WORKER_COUNT=20
npm run orchestrator:start

# Remove workers
export EIP_WORKER_COUNT=5
npm run orchestrator:start

# Monitor worker performance
ps aux | grep orchestrator | wc -l
```

---

## 💰 Budget Management

### Budget Configuration

```yaml
# budgets.yaml configuration
budgets:
  LIGHT:
    generator: 1400    # Token limit
    wallclock_s: 20    # Time limit
  MEDIUM:
    generator: 2400
    wallclock_s: 45
  HEAVY:
    generator: 4000
    wallclock_s: 90
```

### Budget Monitoring

```bash
# Check budget utilization
grep "budget_enforcement" logs/eip-orchestrator.log | tail -10

# Budget breach analysis
grep "Budget breach" logs/eip-errors.log | tail -5

# Performance vs budget
npm run orchestrator:budget-report
```

### Budget Optimization

```bash
# Identify expensive operations
grep "tokens_used" logs/eip-orchestrator.log | awk '{print $NF}' | sort -nr | head -10

# Budget efficiency analysis
npm run orchestrator:budget-analysis

# Suggest budget adjustments
npm run orchestrator:budget-recommendations
```

---

## 📊 Log Analysis

### Log Structure

```json
{
  "timestamp": "2025-11-15T10:30:00.000Z",
  "level": "info",
  "message": "Stage completed: generator",
  "correlationId": "abc-123-def-456",
  "jobId": "job-789",
  "stage": "generator",
  "event": "stage_completed",
  "duration": 2500,
  "tokensUsed": 1200
}
```

### Log Analysis Commands

```bash
# Recent activity
tail -100 logs/eip-orchestrator.log | jq '.event' | sort | uniq -c

# Error analysis
grep "ERROR" logs/eip-orchestrator.log | jq '.correlationId' | sort | uniq -c | sort -nr

# Performance outliers
grep "duration" logs/eip-orchestrator.log | jq 'select(.duration > 10000)'

# Budget breaches
grep "budget_enforcement" logs/eip-orchestrator.log | jq '.reason'

# Queue operations
grep "queue_" logs/eip-orchestrator.log | jq '.event' | sort | uniq -c
```

### Log Rotation

```bash
# Configure log rotation (logrotate.conf)
/path/to/eip/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 eip eip
}

# Force log rotation
logrotate -f /etc/logrotate.d/eip-orchestrator
```

---

## 🚨 Emergency Procedures

### System Down

```bash
# 1. Immediate assessment
curl http://localhost:3002/api/health || echo "System DOWN"

# 2. Check logs
tail -50 logs/eip-errors.log

# 3. Check system resources
free -h
df -h
ps aux | grep orchestrator

# 4. Restart services
sudo systemctl restart eip-orchestrator
sudo systemctl restart redis

# 5. Verify recovery
curl http://localhost:3002/api/health
```

### High Error Rate

```bash
# 1. Scale down workers
export EIP_WORKER_COUNT=2
npm run orchestrator:start

# 2. Check external dependencies
curl -I https://api.openai.com/v1/models
curl -I https://api.anthropic.com/v1/messages

# 3. Clear stuck jobs
redis-cli del bull:eip:content-generation:active

# 4. Reset circuit breakers
curl -X POST http://localhost:3002/api/circuit-breaker/reset

# 5. Gradually restore workers
export EIP_WORKER_COUNT=10
npm run orchestrator:start
```

### Database Issues

```bash
# 1. Check database connectivity
psql -h localhost -U postgres -c "SELECT 1;"

# 2. Check connection pool
psql -h localhost -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Restart database
sudo systemctl restart postgresql

# 4. Run in degraded mode (queue only)
export EIP_DB_MODE=disabled
npm run orchestrator:start
```

### Memory Exhaustion

```bash
# 1. Identify memory usage
ps aux --sort=-%mem | head -10

# 2. Clear Redis memory
redis-cli FLUSHDB  # WARNING: Deletes all data

# 3. Restart with reduced concurrency
export EIP_WORKER_CONCURRENCY=2
export EIP_QUEUE_CONCURRENCY=1
npm run orchestrator:start

# 4. Monitor memory
watch -n 5 'free -h'
```

---

## 📞 Contacts and Escalation

### Primary Contacts
- **On-call Engineer**: [Contact Information]
- **System Administrator**: [Contact Information]
- **Development Team**: [Contact Information]

### Escalation Procedures
1. **Level 1**: On-call engineer (15 min response)
2. **Level 2**: System administrator (30 min response)
3. **Level 3**: Development team (1 hour response)

### Communication Channels
- **Slack**: #eip-operations
- **PagerDuty**: EIP Orchestrator Service
- **Email**: eip-ops@company.com

---

## 📚 Additional Resources

### Documentation
- [System Architecture](../eip-prd.md)
- [API Documentation](../api/README.md)
- [Configuration Guide](../configuration.md)

### Tools and Scripts
```bash
# Health check script
./scripts/health-check.sh

# Performance monitoring
./scripts/performance-monitor.sh

# Log analysis
./scripts/analyze-logs.sh

# Backup script
./scripts/backup-system.sh
```

### Monitoring Dashboards
- Grafana: http://localhost:3001
- Redis Commander: http://localhost:8081
- Application Metrics: http://localhost:3002/metrics

---

**Document History**:
- v1.0.0 - 2025-11-15 - Initial version with comprehensive operational procedures

**Next Review**: 2025-12-15
**Review By**: Operations Team Lead