# BM25 Schema Registry Integration - Phase 1 Implementation

## Overview

This document describes the complete implementation of BM25 index version tracking integration with the EIP schema registry, according to the unified blueprint from Phase 2 synthesis.

## Architecture

### Schema Registry Extension

The existing `eip_schema_registry` table has been extended with BM25-specific fields:

- `index_type`: Type of index ('bm25_file', 'vector_db', 'hybrid', 'legacy')
- `document_sources`: Array of document source identifiers
- `field_weights`: JSONB field for BM25 field weighting configuration
- `build_metadata`: JSONB field for build-time metadata
- `index_size_bytes`: Size of the index file in bytes
- `document_count`: Number of documents in the index
- `build_duration_ms`: Build time in milliseconds
- `is_active`: Boolean flag for currently active version
- `parent_version`: Reference to parent version for incremental builds
- `rollback_version`: Reference to rollback target version
- `created_at`: Timestamp for version creation

### Build History Table

New `eip_index_build_history` table provides comprehensive audit trail:

- Tracks all build operations (full, incremental, rollback)
- Records build status, duration, and document counts
- Stores build metadata and checksums
- Enables detailed build analysis and debugging

### Database Functions

#### Core Functions

1. **`register_bm25_index_version()`** - Register new BM25 index version
   - Automatically deactivates previous active version
   - Creates build history entry
   - Handles rollback on error

2. **`validate_index_checksum()`** - Validate index integrity
   - Compares stored checksum with provided checksum
   - Returns boolean validation result

3. **`rollback_bm25_index()`** - Rollback to previous version
   - Deactivates current version
   - Activates target version
   - Creates rollback audit trail

4. **`get_active_bm25_index()`** - Retrieve currently active index
   - Returns full index metadata
   - Used by retrieval system for index loading

### Views and Indexes

#### Performance Indexes

- Index on `index_type` for fast filtering
- Index on `version` for version lookups
- Index on `created_at` for temporal queries
- Index on `is_active` for active version lookup
- GIN indexes on `document_sources` and `field_weights`

#### BM25 Versions View

`v_bm25_index_versions` provides comprehensive overview:
- All BM25 index versions with metadata
- Build counts and latest build status
- Active status and version relationships

## Integration Points

### BM25 Builder Integration

The BM25 builder script (`scripts/build-bm25.ts`) integrates with the schema registry:

1. **Index Registration**: After successful build, registers version in schema registry
2. **Metadata Storage**: Stores build metadata, document sources, and field weights
3. **Checksum Validation**: Calculates and stores SHA-256 checksums
4. **Version Management**: Supports semantic versioning and incremental builds

### Retrieval System Integration

The retrieval system can now:

1. **Load Active Index**: Query for currently active BM25 index version
2. **Validate Integrity**: Verify index checksum before loading
3. **Track Usage**: Monitor index access and performance
4. **Handle Updates**: Respond to new index version notifications

## Sample Data

### Seeded BM25 Index Versions

1. **Version 1.0.0** - Initial index with basic entity data
   - 8 documents, 2MB size
   - Basic field weights configuration
   - Full build type

2. **Version 1.1.0** - Enhanced with additional artifacts
   - 10 documents, 3MB size
   - Improved field weights
   - Incremental build from 1.0.0

3. **Version 1.2.0** - Current active version
   - 12 documents, 4MB size
   - Optimized field weights and tokenization
   - Incremental build from 1.1.0

### Build History Examples

- Full builds with complete document processing
- Incremental builds with delta updates
- Failed builds with error tracking
- Rollback operations with audit trails

## Quality Gates

### Schema Validation

- All BM25 entries must have valid semantic versions
- Checksums must follow SHA-256 format
- Document counts and build times must be non-negative
- Index types must be from approved list

### Data Integrity

- Foreign key constraints ensure history links to valid registry entries
- Check constraints prevent invalid data states
- Unique constraints prevent duplicate registry keys
- Transactional operations maintain consistency

### Performance Requirements

- Index lookups under 10ms for active versions
- Checksum validation under 5ms
- Build history queries under 50ms
- Rollback operations under 100ms

## Usage Examples

### Register New Index Version

```sql
SELECT register_bm25_index_version(
  '1.3.0',
  'sha256:abc123...',
  ARRAY['doc1', 'doc2', 'doc3'],
  '{"title": 2.0, "content": 1.0}',
  '{"build_env": "production"}',
  5242880,  -- 5MB
  15,
  3000      -- 3 seconds
);
```

### Validate Index Checksum

```sql
SELECT validate_index_checksum(
  'bm25_index_1.2.0',
  'sha256:0123456789abcdef...'
);
```

### Rollback to Previous Version

```sql
SELECT rollback_bm25_index('1.1.0', 'Performance issue detected');
```

### Get Active Index

```sql
SELECT * FROM get_active_bm25_index();
```

## Testing

### Integration Tests

1. **SQL Test Script** (`test_bm25_integration.sql`)
   - Schema verification
   - Data validation
   - Function testing
   - Build history verification

2. **Node.js Test Script** (`test_bm25_integration_simple.js`)
   - End-to-end integration testing
   - BM25 builder compatibility
   - Error handling verification
   - Performance validation

### Test Coverage

- Schema extension validation
- BM25 entry creation and retrieval
- Checksum validation
- Build history tracking
- Rollback functionality
- Active version management
- Performance requirements

## Migration Guide

### Database Migration

Run the migration script to extend the schema:

```bash
# Apply migration
psql -h localhost -U postgres -d eip_db -f supabase/migrations/20251114185745_extend_schema_registry_bm25.sql
```

### Seed Data

Load the enhanced seed data:

```bash
# Load enhanced seed data
psql -h localhost -U postgres -d eip_db -f db/seed_registries.sql
```

### Verification

Run integration tests to verify implementation:

```bash
# SQL integration test
psql -h localhost -U postgres -d eip_db -f test_bm25_integration.sql

# Node.js integration test
node test_bm25_integration_simple.js
```

## Performance Considerations

### Index Optimization

- Composite indexes on frequently queried column combinations
- Partial indexes for active version lookups
- GIN indexes for JSONB field searches
- Proper vacuum and analyze schedules

### Query Optimization

- Use views for complex queries
- Materialized views for reporting
- Query parameterization for security
- Connection pooling for scalability

### Storage Optimization

- Compress JSONB fields where appropriate
- Partition build history by date if needed
- Archive old index versions
- Monitor index size growth

## Security Considerations

### Access Control

- Schema registry functions require proper permissions
- Build history access is audited
- Rollback operations require elevated privileges
- Checksum validation prevents tampering

### Data Protection

- Sensitive metadata is encrypted
- Audit trail is immutable
- Backup and recovery procedures
- Data retention policies

## Future Enhancements

### Phase 2 Planned Features

1. **Automatic Version Promotion**
   - Staging environments
   - Gradual rollout support
   - A/B testing integration

2. **Advanced Monitoring**
   - Performance metrics collection
   - Usage analytics
   - Health checks

3. **Enhanced Rollback**
   - Point-in-time recovery
   - Multi-version rollback
   - Automated rollback triggers

### Scalability Improvements

1. **Distributed Index Management**
   - Multiple index servers
   - Load balancing
   - Failover support

2. **Storage Optimization**
   - Compression algorithms
   - Tiered storage
   - Cache management

## Conclusion

This implementation provides a comprehensive BM25 index version tracking system that:

- Maintains full audit trail of index builds
- Supports incremental updates and rollbacks
- Ensures data integrity through checksum validation
- Provides high-performance query capabilities
- Integrates seamlessly with existing EIP infrastructure

The system is production-ready and meets all quality gates specified in the unified blueprint for Phase 1 of the retrieval stack enhancement.
