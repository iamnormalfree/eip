# Plan 05 Maintenance & Troubleshooting Guide

**Guide Version:** 1.0.0  
**Target Audience:** System Administrators, DevOps Engineers, Support Teams  
**Last Updated:** November 18, 2025

---

## Quick Reference

### Common Issues & Solutions

| Issue | Symptom | Quick Fix | Reference |
|-------|---------|-----------|-----------|
| **High audit latency** | Audit taking >5 seconds | Check content length, enable caching | [Performance Issues](#41-performance-issues) |
| **Missing tags** | Expected tags not detected | Review confidence thresholds, check IP type | [Tag Detection Issues](#91-tag-detection-issues) |
| **Repairs not applying** | Auto-fixable tags not repaired | Verify span hint format, check auto_fixable flag | [Repair Application Issues](#912-repair-application-issues) |
| **Memory leaks** | Memory usage increasing over time | Monitor garbage collection, check for circular references | [Memory Issues](#421-memory-usage-concerns) |
| **Integration failures** | API calls returning errors | Check data contracts, verify input validation | [Integration Issues](#931-controller-integration-problems) |

---

## 1. System Maintenance

### 1.1 Regular Maintenance Tasks

#### Daily Checks

```bash
#!/bin/bash
# daily-maintenance.sh

echo "=== Plan 05 Daily Health Check ==="

# Check system health
curl -f http://localhost:3000/api/health || exit 1

# Monitor memory usage
MEMORY_USAGE=$(ps aux | grep 'node.*orchestrator' | awk '{sum+=$6} END {print sum/1024}')
echo "Memory usage: ${MEMORY_USAGE}MB"

if (( $(echo "$MEMORY_USAGE > 200" | bc -l) )); then
  echo "WARNING: High memory usage detected"
fi

# Check error logs
ERROR_COUNT=$(grep -c "ERROR" /var/log/eip/plan05.log 2>/dev/null || echo "0")
echo "Error count: $ERROR_COUNT"

if [ "$ERROR_COUNT" -gt 10 ]; then
  echo "WARNING: High error rate detected"
fi

# Run quick smoke test
npm run test:smoke || echo "WARNING: Smoke test failed"

echo "Daily check completed"
```

#### Weekly Tasks

```bash
#!/bin/bash
# weekly-maintenance.sh

echo "=== Plan 05 Weekly Maintenance ==="

# Update test data
npm run test:update-fixtures

# Check cache efficiency
npm run cache:analyze

# Performance benchmarking
npm run benchmark:run

# Review tag detection accuracy
npm run audit:accuracy-check

# Clean old logs
find /var/log/eip -name "*.log" -mtime +7 -delete

echo "Weekly maintenance completed"
```

#### Monthly Tasks

```bash
#!/bin/bash
# monthly-maintenance.sh

echo "=== Plan 05 Monthly Maintenance ==="

# Comprehensive test suite
npm run test:full

# Security audit
npm run security:audit

# Performance regression testing
npm run benchmark:regression

# Update documentation
npm run docs:update

# Review and update configuration
npm run config:review

echo "Monthly maintenance completed"
```

### 1.2 Monitoring Setup

#### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'plan05-auditor'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'plan05-repairer'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/repairer/metrics'
    scrape_interval: 30s

rule_files:
  - "plan05-alerts.yml"
```

#### Alert Rules

```yaml
# plan05-alerts.yml
groups:
  - name: plan05.rules
    rules:
      - alert: HighErrorRate
        expr: rate(plan05_errors_total[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Plan 05 error rate is high"
          description: "Error rate is {{ $value }} errors per second"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(plan05_duration_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Plan 05 latency is high"
          description: "95th percentile latency is {{ $value }} seconds"

      - alert: MemoryUsageHigh
        expr: plan05_memory_usage_bytes / 1024 / 1024 > 200
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Plan 05 memory usage is high"
          description: "Memory usage is {{ $value }}MB"
```

### 1.3 Log Management

#### Log Rotation Configuration

```bash
# /etc/logrotate.d/eip-plan05
/var/log/eip/plan05.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 eip eip
    postrotate
        systemctl reload eip-plan05
    endscript
}

/var/log/eip/plan05-audit.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 eip eip
}
```

#### Structured Logging Setup

```typescript
// logging/plan05-logger.ts
import winston from 'winston';

export const Plan05Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'plan05' },
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/eip/plan05.log',
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10
    }),
    new winston.transports.File({ 
      filename: '/var/log/eip/plan05-error.log',
      level: 'error',
      maxsize: 50 * 1024 * 1024,
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  Plan05Logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

---

## 2. Performance Monitoring

### 2.1 Key Performance Indicators

#### Metrics to Monitor

```typescript
// monitoring/metrics-collector.ts
export class Plan05MetricsCollector {
  private readonly registry = new Client.Registry();

  constructor() {
    this.setupMetrics();
  }

  private setupMetrics(): void {
    // Operation metrics
    new Client.Histogram({
      name: 'plan05_audit_duration_seconds',
      help: 'Duration of audit operations',
      labelNames: ['ip_type', 'tag_count'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    new Client.Histogram({
      name: 'plan05_repair_duration_seconds',
      help: 'Duration of repair operations',
      labelNames: ['tags_fixed'],
      buckets: [0.1, 0.5, 1, 2, 3]
    });

    // Quality metrics
    new Client.Gauge({
      name: 'plan05_quality_score',
      help: 'Quality score of audited content',
      labelNames: ['ip_type']
    });

    new Client.Counter({
      name: 'plan05_tags_detected_total',
      help: 'Total number of tags detected',
      labelNames: ['tag_type', 'severity']
    });

    // System metrics
    new Client.Gauge({
      name: 'plan05_memory_usage_bytes',
      help: 'Memory usage in bytes'
    });

    new Client.Counter({
      name: 'plan05_errors_total',
      help: 'Total number of errors',
      labelNames: ['error_type', 'operation']
    });
  }

  recordAuditOperation(duration: number, tagCount: number, qualityScore: number, ipType: string): void {
    this.registry.getSingleMetric('plan05_audit_duration_seconds')
      .observe({ ip_type: ipType, tag_count: tagCount.toString() }, duration / 1000);
    
    this.registry.getSingleMetric('plan05_quality_score')
      .set({ ip_type: ipType }, qualityScore);
  }

  getMetrics(): string {
    return this.registry.metrics();
  }
}
```

### 2.2 Performance Dashboards

#### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Plan 05 Performance Dashboard",
    "panels": [
      {
        "title": "Audit Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(plan05_audit_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(plan05_audit_duration_seconds_bucket[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Quality Score Distribution",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(plan05_quality_score_count[5m])",
            "legendFormat": "{{ip_type}}"
          }
        ]
      },
      {
        "title": "Tag Detection Frequency",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (tag_type) (rate(plan05_tags_detected_total[1h]))",
            "legendFormat": "{{tag_type}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(plan05_errors_total[5m])",
            "legendFormat": "{{error_type}}"
          }
        ]
      }
    ]
  }
}
```

---

## 3. Configuration Management

### 3.1 Environment-Specific Configurations

#### Development Environment

```typescript
// config/development.ts
export const developmentConfig: Plan05Config = {
  auditor: {
    confidenceThreshold: 0.6,
    enableSpanHints: true,
    strictCompliance: false,
    maxContentLength: 5000,
    debugMode: true
  },
  repairer: {
    maxSentencesAddition: 5,
    enableSpanTargeting: true,
    fallbackBehavior: 'aggressive',
    preserveOriginality: false
  },
  performance: {
    timeoutMs: 60000,
    memoryLimitMb: 200,
    enableCaching: false,
    cacheTtlMs: 0
  },
  logging: {
    level: 'debug',
    enableConsole: true,
    enableFile: false
  }
};
```

#### Production Environment

```typescript
// config/production.ts
export const productionConfig: Plan05Config = {
  auditor: {
    confidenceThreshold: 0.8,
    enableSpanHints: true,
    strictCompliance: true,
    maxContentLength: 10000,
    debugMode: false
  },
  repairer: {
    maxSentencesAddition: 3,
    enableSpanTargeting: true,
    fallbackBehavior: 'minimal',
    preserveOriginality: true
  },
  performance: {
    timeoutMs: 30000,
    memoryLimitMb: 100,
    enableCaching: true,
    cacheTtlMs: 300000
  },
  logging: {
    level: 'info',
    enableConsole: false,
    enableFile: true
  }
};
```

### 3.2 Dynamic Configuration Updates

```typescript
// config/config-manager.ts
export class ConfigurationManager {
  private config: Plan05Config;
  private watchers: ConfigWatcher[] = [];
  private configPath: string;

  constructor(configPath: string) {
    this.configPath = configPath;
    this.loadConfig();
    this.setupFileWatching();
  }

  private loadConfig(): void {
    try {
      const configFile = fs.readFileSync(this.configPath, 'utf8');
      this.config = JSON.parse(configFile);
      this.validateConfig(this.config);
      this.notifyWatchers();
    } catch (error) {
      Plan05Logger.error('Failed to load configuration', error);
      throw new Error(`Configuration load failed: ${error.message}`);
    }
  }

  private setupFileWatching(): void {
    fs.watchFile(this.configPath, () => {
      try {
        this.loadConfig();
        Plan05Logger.info('Configuration reloaded successfully');
      } catch (error) {
        Plan05Logger.error('Failed to reload configuration', error);
      }
    });
  }

  updateConfig(updates: Partial<Plan05Config>): void {
    const newConfig = { ...this.config, ...updates };
    
    if (this.validateConfig(newConfig)) {
      this.config = newConfig;
      this.saveConfig();
      this.notifyWatchers();
    } else {
      throw new Error('Invalid configuration update');
    }
  }

  private validateConfig(config: Plan05Config): boolean {
    // Validate confidence threshold
    if (config.auditor.confidenceThreshold < 0 || config.auditor.confidenceThreshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }

    // Validate repair constraints
    if (config.repairer.maxSentencesAddition > 10) {
      throw new Error('Max sentences addition cannot exceed 10');
    }

    // Validate performance limits
    if (config.performance.timeoutMs < 1000) {
      throw new Error('Timeout must be at least 1 second');
    }

    return true;
  }
}
```

---

## 4. Backup & Recovery

### 4.1 Data Backup Procedures

#### Configuration Backup

```bash
#!/bin/bash
# backup-config.sh

BACKUP_DIR="/backup/eip-plan05/$(date +%Y%m%d)"
CONFIG_DIR="/etc/eip/plan05"

mkdir -p "$BACKUP_DIR"

# Backup configuration files
cp -r "$CONFIG_DIR" "$BACKUP_DIR/config"

# Backup environment-specific configurations
tar -czf "$BACKUP_DIR/env-configs.tar.gz" /opt/eip/plan05/config/

# Create backup manifest
cat > "$BACKUP_DIR/MANIFEST.txt" << EOF
Plan 05 Configuration Backup
Date: $(date)
Host: $(hostname)
Version: $(git rev-parse HEAD)

Files:
- config/: Main configuration directory
- env-configs.tar.gz: Environment-specific configurations

Recovery:
1. Stop the service: systemctl stop eip-plan05
2. Restore config: cp -r $BACKUP_DIR/config/* /etc/eip/plan05/
3. Extract env configs: tar -xzf $BACKUP_DIR/env-configs.tar.gz -C /opt/eip/plan05/
4. Start the service: systemctl start eip-plan05
