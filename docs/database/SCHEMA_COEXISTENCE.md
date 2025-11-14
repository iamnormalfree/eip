# EIP Database Schema Coexistence Implementation

## Overview

The Database Domain implements the **Schema Coexistence** approach as specified in the EIP Steel Thread blueprint. This approach ensures zero-risk migration by:

- Preserving all existing broker functionality without any changes
- Adding EIP tables with `eip_` prefix to avoid naming conflicts  
- Creating bridge functions for cross-domain queries
- Maintaining type safety with extended TypeScript definitions

## Architecture

### Schema Design

**Broker Tables (Preserved, Unchanged):**
- `ai_brokers` - AI broker profiles and availability
- `broker_conversations` - Customer conversations and assignments  
- `broker_performance` - Broker performance metrics
- `conversation_turn_events` - Message event tracking

**EIP Tables (New, with `eip_` prefix):**
- `eip_schema_registry` - Version tracking for EIP components
- `eip_evidence_registry` - Compliance allow-list domains
- `eip_entities` - Generic entities (concepts, personas, offers)
- `eip_evidence_snapshots` - Versioned evidence data
- `eip_artifacts` - Generated content and metadata
- `eip_brand_profiles` - Brand DNA and voice profiles
- `eip_jobs` - Orchestration tracking and metrics

### Bridge Functions

**Cross-Domain Integration:**
- `get_eip_artifacts_for_broker_conversation()` - Retrieve relevant EIP content for broker conversations
- `link_broker_conversation_to_eip_entities()` - Map conversation context to EIP entities

## Implementation Details

### Files Created/Modified

1. **`db/schema.sql`** - Complete EIP schema with `eip_` prefixed tables
2. **`db/seed_registries.sql`** - Initial registry data for evidence and schema tracking
3. **`db/setup.ts`** - Database setup script applying EIP schema to existing Supabase
4. **`lib_supabase/db/types/database.types.ts`** - Extended TypeScript types preserving broker schema
5. **`lib_supabase/tests/db/schema.test.ts`** - Validation tests for schema coexistence

### Key Features

#### Zero-Risk Migration
- All existing broker tables remain completely untouched
- No breaking changes to broker functionality
- EIP tables use explicit `eip_` prefix for clear separation

#### Type Safety
- Full TypeScript definitions for all tables and functions
- Helper types for both EIP and broker entities
- Compile-time validation of cross-domain operations

#### Cross-Domain Integration
- Bridge functions enable broker-EIP data sharing
- Relevant EIP content can be retrieved for broker conversations
- Conversation context can be mapped to EIP entities

## Validation Results

### Schema Tests
✅ All EIP tables properly defined in Database interface  
✅ Broker tables preserved without conflicts  
✅ Bridge functions correctly typed  
✅ No naming conflicts between schemas  

### Type Validation
✅ EIP artifact status properly constrained (`seed|draft|published`)  
✅ EIP entity required fields enforced  
✅ Bridge function return types correct  

### Integration Verification
✅ EIP tables use `eip_` prefix consistently  
✅ Broker table names remain unprefixed  
✅ Function names distinct and non-conflicting  

## Usage

### Database Setup

```bash
# Apply EIP schema to existing Supabase instance
npm run db:setup

# Optional: Add demo data
npm run db:seed
```

### Type Imports

```typescript
import { Database } from './lib_supabase/db/types/database.types'

// EIP types
type EipArtifact = Database['public']['Tables']['eip_artifacts']['Row']
type EipEntity = Database['public']['Tables']['eip_entities']['Row']

// Broker types (preserved)
type Broker = Database['public']['Tables']['ai_brokers']['Row']
type Conversation = Database['public']['Tables']['broker_conversations']['Row']

// Bridge function usage
const artifacts = await supabase
  .rpc('get_eip_artifacts_for_broker_conversation', {
    p_conversation_id: 123,
    p_persona: 'first_time_buyer'
  })
```

## Compliance with Blueprint

### Implementation Sequence ✅
- **Database First Critical Path**: Schema created before other domains
- **Zero-Risk Migration**: Existing broker tables preserved unchanged

### Integration Contracts ✅
- **EIP Tables Contract**: All tables use `eip_` prefix as specified
- **Bridge Functions Contract**: Cross-domain functions implemented
- **TypeScript Extension Contract**: Existing Database interface preserved and extended

### Technical Decisions ✅
- **Schema Coexistence**: Approach A implemented exactly as designed
- **Preserve Broker Tables**: No modifications to existing functionality
- **EIP Prefix Consistency**: All new tables follow naming convention

## Next Steps

1. Apply schema to Supabase instance using `npm run db:setup`
2. Verify bridge functions work with actual data
3. Integrate with Orchestrator domain for content generation
4. Connect with Review UI for EIP content approval workflow

## Files Created

- `/mnt/HC_Volume_103339633/projects/eip/db/schema.sql`
- `/mnt/HC_Volume_103339633/projects/eip/db/seed_registries.sql` 
- `/mnt/HC_Volume_103339633/projects/eip/db/setup.ts`
- `/mnt/HC_Volume_103339633/projects/eip/lib_supabase/tests/db/schema.test.ts`
- `/mnt/HC_Volume_103339633/projects/eip/docs/database/SCHEMA_COEXISTENCE.md`

## Files Modified

- `/mnt/HC_Volume_103339633/projects/eip/lib_supabase/db/types/database.types.ts`
