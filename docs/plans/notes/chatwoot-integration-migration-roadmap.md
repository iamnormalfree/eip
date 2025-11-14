# Chatwoot Integration Migration Roadmap

## Executive Summary
**Migration Item:** Legacy NextNest integration ID in Chatwoot client  
**Current State:** `nextnest_${Date.now()}` source identifier  
**Target State:** `eip_${Date.now()}` source identifier  
**Priority:** Medium (Phase 2 - Operations)  
**Impact:** External system integration tracking  
**Timeline:** 90-day phased migration  

## Current Implementation Analysis

### Location and Context
**File:** `lib_supabase/integrations/chatwoot-client.ts`  
**Line:** 292  
**Current Code:**
```typescript
// Legacy NextNest integration ID pattern
const sourceId = `nextnest_${Date.now()}`;
```

### Integration Impact Assessment
1. **Data Dependencies**
   - Historical conversation tracking in Chatwoot
   - Source identifier analytics and reporting
   - External system integration mapping

2. **System Dependencies**
   - Chatwoot conversation attribution
   - Analytics source tracking
   - Integration monitoring and debugging

3. **Migration Risks**
   - Breaking existing conversation continuity
   - Analytics data fragmentation
   - Integration monitoring alerts

## Migration Strategy

### Phase 1: Preparation (Days 1-15)

#### 1.1 Impact Analysis
**Tasks:**
- [x] Document current Chatwoot integration usage
- [x] Identify all dependent systems and reports
- [x] Assess data retention requirements
- [x] Create migration test scenarios

**Evidence Required:**
- Chatwoot API usage logs
- Analytics reports using source IDs
- System integration documentation
- Data retention policy compliance

#### 1.2 Compatibility Layer Development
**Implementation:**
```typescript
// Enhanced source ID generation with legacy support
class SourceIdGenerator {
  private static readonly LEGACY_PREFIX = 'nextnest';
  private static readonly CANONICAL_PREFIX = 'eip';
  
  static generateSourceId(useLegacy: boolean = false): string {
    const prefix = useLegacy ? this.LEGACY_PREFIX : this.CANONICAL_PREFIX;
    return `${prefix}_${Date.now()}`;
  }
  
  static parseSourceId(sourceId: string): { prefix: string; timestamp: number; isLegacy: boolean } {
    const match = sourceId.match(/^(nextnest|eip)_(\d+)$/);
    if (!match) throw new Error('Invalid source ID format');
    
    return {
      prefix: match[1],
      timestamp: parseInt(match[2]),
      isLegacy: match[1] === this.LEGACY_PREFIX
    };
  }
}
```

#### 1.3 Feature Flag Implementation
**Environment Variable:** `EIP_CHATWOOT_MIGRATION_MODE`  
**Options:**
- `legacy`: Continue using NextNest prefix
- `dual`: Generate both prefixes for testing
- `canonical`: Use EIP prefix only
- `transitional`: Generate canonical with legacy fallback

### Phase 2: Dual-Write Implementation (Days 16-45)

#### 2.1 Dual-Write Strategy
**Implementation:**
```typescript
// Dual-write implementation for gradual migration
class ChatwootClient {
  private generateSourceId(): string {
    const migrationMode = process.env.EIP_CHATWOOT_MIGRATION_MODE || 'legacy';
    
    switch (migrationMode) {
      case 'canonical':
        return SourceIdGenerator.generateSourceId(false);
      
      case 'dual':
        // Generate both for testing
        const canonicalId = SourceIdGenerator.generateSourceId(false);
        const legacyId = SourceIdGenerator.generateSourceId(true);
        
        // Store mapping for analytics
        this.storeSourceIdMapping(canonicalId, legacyId);
        return canonicalId;
      
      case 'transitional':
        // Try canonical, fallback to legacy if needed
        try {
          return SourceIdGenerator.generateSourceId(false);
        } catch (error) {
          return SourceIdGenerator.generateSourceId(true);
        }
      
      default:
        return SourceIdGenerator.generateSourceId(true);
    }
  }
  
  private async storeSourceIdMapping(canonicalId: string, legacyId: string): Promise<void> {
    // Store mapping in Supabase for analytics continuity
    await this.supabase.from('source_id_mappings').insert({
      canonical_id: canonicalId,
      legacy_id: legacyId,
      created_at: new Date().toISOString(),
      migration_phase: 'dual-write'
    });
  }
}
```

#### 2.2 Analytics Continuity
**Implementation:**
```typescript
// Analytics adapter for source ID continuity
class SourceIdAnalytics {
  async getConversationMetrics(startDate: Date, endDate: Date): Promise<any> {
    // Query both canonical and legacy source IDs
    const { data: canonicalMetrics } = await this.supabase
      .from('conversations')
      .select('*')
      .like('source_id', 'eip_%')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    const { data: legacyMetrics } = await this.supabase
      .from('conversations')
      .select('*')
      .like('source_id', 'nextnest_%')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    return {
      total: [...canonicalMetrics, ...legacyMetrics],
      canonical: canonicalMetrics,
      legacy: legacyMetrics,
      migration_progress: this.calculateMigrationProgress(canonicalMetrics, legacyMetrics)
    };
  }
  
  private calculateMigrationProgress(canonical: any[], legacy: any[]): number {
    const total = canonical.length + legacy.length;
    return total > 0 ? (canonical.length / total) * 100 : 0;
  }
}
```

### Phase 3: Gradual Migration (Days 46-75)

#### 3.1 Traffic Splitting
**Implementation:**
```typescript
// Gradual traffic splitting for migration
class MigrationController {
  private getMigrationPercentage(): number {
    // Gradual increase from 0% to 100% over 30 days
    const migrationStart = new Date('2025-12-01'); // Example start date
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - migrationStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.min(100, Math.max(0, (daysSinceStart / 30) * 100));
  }
  
  shouldUseCanonical(): boolean {
    const migrationPercentage = this.getMigrationPercentage();
    const randomValue = Math.random() * 100;
    
    return randomValue < migrationPercentage;
  }
  
  generateSourceId(): string {
    const useCanonical = this.shouldUseCanonical();
    const sourceId = SourceIdGenerator.generateSourceId(!useCanonical);
    
    // Log migration decision for monitoring
    this.logMigrationDecision(sourceId, useCanonical, this.getMigrationPercentage());
    
    return sourceId;
  }
}
```

#### 3.2 Monitoring and Alerting
**Implementation:**
```typescript
// Migration monitoring and alerting
class MigrationMonitor {
  async checkMigrationHealth(): Promise<MigrationHealthStatus> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const canonicalCount = await this.getCountByPrefix('eip_', last24Hours);
    const legacyCount = await this.getCountByPrefix('nextnest_', last24Hours);
    const expectedCanonical = this.getExpectedCanonicalPercentage();
    const actualCanonical = (canonicalCount / (canonicalCount + legacyCount)) * 100;
    
    return {
      healthy: Math.abs(actualCanonical - expectedCanonical) < 5,
      canonicalCount,
      legacyCount,
      expectedCanonical,
      actualCanonical,
      deviation: actualCanonical - expectedCanonical
    };
  }
  
  private async getCountByPrefix(prefix: string, since: Date): Promise<number> {
    const { count } = await this.supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .like('source_id', `${prefix}%`)
      .gte('created_at', since.toISOString());
    
    return count || 0;
  }
}
```

### Phase 4: Legacy Deprecation (Days 76-90)

#### 4.1 Legacy Sunset Planning
**Tasks:**
- [ ] Confirm 100% migration to canonical source IDs
- [ ] Validate analytics continuity
- [ ] Update monitoring dashboards
- [ ] Document legacy deprecation timeline

#### 4.2 Cleanup Implementation
```typescript
// Legacy cleanup and finalization
class LegacyCleanup {
  async deprecateLegacySupport(): Promise<void> {
    // Remove legacy source ID generation
    process.env.EIP_CHATWOOT_MIGRATION_MODE = 'canonical';
    
    // Archive legacy source ID mappings
    await this.archiveLegacyMappings();
    
    // Update documentation
    await this.updateIntegrationDocumentation();
    
    // Notify stakeholders
    await this.sendMigrationCompleteNotification();
  }
  
  private async archiveLegacyMappings(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Move old mappings to archive table
    await this.supabase
      .from('source_id_mappings')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .lt('created_at', thirtyDaysAgo.toISOString());
  }
}
```

## Risk Management

### Migration Risks and Mitigations

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|-------------------|
| Analytics data fragmentation | Medium | High | Dual-write phase with data mapping |
| Conversation tracking interruption | Low | High | Gradual migration with rollback capability |
| Integration monitoring alerts | Medium | Medium | Enhanced monitoring during migration |
| Performance degradation | Low | Medium | Load testing and gradual traffic splitting |
| External system compatibility | Medium | High | Extensive testing and communication |

### Rollback Procedures
1. **Immediate Rollback (within 1 hour)**
   - Switch migration mode to 'legacy'
   - Monitor system recovery
   - Document rollback trigger

2. **Partial Rollback (within 24 hours)**
   - Adjust migration percentage downward
   - Increase legacy traffic allocation
   - Monitor for stability

3. **Full Migration Reset (within 72 hours)**
   - Disable dual-write mode
   - Restore all legacy functionality
   - Conduct post-mortem analysis

## Testing Strategy

### Unit Tests
```typescript
describe('SourceIdGenerator', () => {
  it('should generate canonical source ID', () => {
    const sourceId = SourceIdGenerator.generateSourceId(false);
    expect(sourceId).toMatch(/^eip_\d+$/);
  });
  
  it('should generate legacy source ID', () => {
    const sourceId = SourceIdGenerator.generateSourceId(true);
    expect(sourceId).toMatch(/^nextnest_\d+$/);
  });
  
  it('should parse source ID correctly', () => {
    const parsed = SourceIdGenerator.parseSourceId('eip_1234567890');
    expect(parsed.prefix).toBe('eip');
    expect(parsed.timestamp).toBe(1234567890);
    expect(parsed.isLegacy).toBe(false);
  });
});
```

### Integration Tests
```typescript
describe('Chatwoot Client Migration', () => {
  it('should maintain conversation continuity during migration', async () => {
    // Test conversation tracking with mixed source IDs
    const canonicalId = SourceIdGenerator.generateSourceId(false);
    const legacyId = SourceIdGenerator.generateSourceId(true);
    
    const conversation1 = await client.createConversation(canonicalId);
    const conversation2 = await client.createConversation(legacyId);
    
    expect(conversation1.source_id).toBe(canonicalId);
    expect(conversation2.source_id).toBe(legacyId);
  });
});
```

## Monitoring and Metrics

### Migration Health Metrics
1. **Source ID Distribution**
   - Canonical source ID percentage
   - Legacy source ID percentage
   - Migration progress over time

2. **System Performance**
   - Chatwoot API response times
   - Error rates by source ID type
   - Integration health status

3. **Analytics Continuity**
   - Conversation volume consistency
   - Source attribution accuracy
   - Data completeness metrics

### Alerting Thresholds
- Migration progress deviation: ±5% from expected
- Error rate increase: >1% from baseline
- API response time: >500ms increase
- Data completeness: <95% coverage

## Documentation Requirements

### Technical Documentation
1. **Migration Architecture**
   - Dual-write implementation details
   - Traffic splitting algorithm
   - Data mapping procedures

2. **Operational Procedures**
   - Migration control commands
   - Monitoring dashboard usage
   - Rollback procedures

3. **API Documentation**
   - Source ID format specifications
   - Migration mode configurations
   - Integration guidelines

### User Communication
1. **Stakeholder Notifications**
   - Migration timeline communication
   - Impact assessment reports
   - Completion notifications

2. **Support Documentation**
   - Troubleshooting guides
   - FAQ for migration issues
   - Contact procedures

## Success Criteria

### Migration Completion Criteria
- [ ] 100% of new conversations use canonical source IDs
- [ ] Analytics continuity maintained throughout migration
- [ ] Zero data loss during migration process
- [ ] Performance metrics within acceptable thresholds
- [ ] All monitoring systems updated
- [ ] Legacy support successfully deprecated

### Verification Evidence
- [ ] Migration monitoring reports
- [ ] Analytics continuity validation
- [ ] Performance benchmark comparisons
- [ ] Stakeholder sign-off documentation
- [ ] Post-migration health assessment

---
*Migration Roadmap Created: 2025-11-13 17:55:00 UTC*  
*Target Completion: 2026-02-11*  
*Review Schedule: Bi-weekly during migration phases*  
*Owner: EIP Development Team*
