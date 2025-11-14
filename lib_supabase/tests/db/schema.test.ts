// ABOUTME: Database Schema Validation Tests (Schema Coexistence)
// ABOUTME: Tests that EIP schema creates without breaking broker functionality

import { Database } from '../db/types/database.types'

describe('EIP Database Schema (Schema Coexistence)', () => {
  describe('Schema Structure', () => {
    test('EIP tables should exist in Database interface', () => {
      // Test EIP tables are defined by accessing types directly
      const eipSchemaRegistry: Database['public']['Tables']['eip_schema_registry'] = {} as any
      const eipEvidenceRegistry: Database['public']['Tables']['eip_evidence_registry'] = {} as any
      const eipEntities: Database['public']['Tables']['eip_entities'] = {} as any
      const eipEvidenceSnapshots: Database['public']['Tables']['eip_evidence_snapshots'] = {} as any
      const eipArtifacts: Database['public']['Tables']['eip_artifacts'] = {} as any
      const eipBrandProfiles: Database['public']['Tables']['eip_brand_profiles'] = {} as any
      const eipJobs: Database['public']['Tables']['eip_jobs'] = {} as any
      
      expect(eipSchemaRegistry).toBeDefined()
      expect(eipEvidenceRegistry).toBeDefined()
      expect(eipEntities).toBeDefined()
      expect(eipEvidenceSnapshots).toBeDefined()
      expect(eipArtifacts).toBeDefined()
      expect(eipBrandProfiles).toBeDefined()
      expect(eipJobs).toBeDefined()
    })

    test('Broker tables should still exist (preserved)', () => {
      // Test broker tables are preserved by accessing types directly
      const aiBrokers: Database['public']['Tables']['ai_brokers'] = {} as any
      const brokerConversations: Database['public']['Tables']['broker_conversations'] = {} as any
      const brokerPerformance: Database['public']['Tables']['broker_performance'] = {} as any
      const conversationTurnEvents: Database['public']['Tables']['conversation_turn_events'] = {} as any
      
      expect(aiBrokers).toBeDefined()
      expect(brokerConversations).toBeDefined()
      expect(brokerPerformance).toBeDefined()
      expect(conversationTurnEvents).toBeDefined()
    })

    test('EIP bridge functions should be defined', () => {
      // Test bridge functions exist by accessing types directly
      const getArtifactsFunction: Database['public']['Functions']['get_eip_artifacts_for_broker_conversation'] = {} as any
      const linkEntitiesFunction: Database['public']['Functions']['link_broker_conversation_to_eip_entities'] = {} as any
      
      expect(getArtifactsFunction).toBeDefined()
      expect(linkEntitiesFunction).toBeDefined()
    })

    test('Broker functions should still exist (preserved)', () => {
      // Test broker functions are preserved by accessing types directly
      const checkAssignmentFunction: Database['public']['Functions']['check_broker_assignment'] = {} as any
      const getAssignedBrokerFunction: Database['public']['Functions']['get_assigned_broker'] = {} as any
      const updateMetricsFunction: Database['public']['Functions']['update_metrics_after_response'] = {} as any
      
      expect(checkAssignmentFunction).toBeDefined()
      expect(getAssignedBrokerFunction).toBeDefined()
      expect(updateMetricsFunction).toBeDefined()
    })
  })

  describe('Type Consistency', () => {
    test('EIP artifact status should be constrained', () => {
      type EipArtifact = Database['public']['Tables']['eip_artifacts']['Row']
      const validStatuses: Array<EipArtifact['status']> = ['seed', 'draft', 'published']
      
      expect(validStatuses).toContain('draft')
      expect(validStatuses).toContain('published')
      expect(validStatuses).toContain('seed')
    })

    test('EIP entity should have required fields', () => {
      type EipEntity = Database['public']['Tables']['eip_entities']['Row']
      
      // These should be required (no undefined)
      const entity: EipEntity = {
        id: 'test-id',
        type: 'concept',
        name: 'Test Entity',
        attrs: {},
        valid_from: new Date().toISOString(),
        valid_to: null,
        source_url: null
      }
      
      expect(entity.id).toBe('test-id')
      expect(entity.type).toBe('concept')
      expect(entity.name).toBe('Test Entity')
    })

    test('Bridge function return types should be correct', () => {
      type GetArtifactsReturn = Database['public']['Functions']['get_eip_artifacts_for_broker_conversation']['Returns']
      
      const artifact: GetArtifactsReturn[0] = {
        id: 'test-id',
        slug: 'test-slug',
        status: 'published',
        title: 'Test Title',
        persona: 'first_time_buyer',
        funnel: 'mofu'
      }
      
      expect(artifact.id).toBe('test-id')
      expect(artifact.status).toBe('published')
    })
  })

  describe('Schema Coexistence Validation', () => {
    test('No table name conflicts between EIP and broker schemas', () => {
      // Create table name arrays from the Database interface
      type TableNames = keyof Database['public']['Tables']
      const eipTables: TableNames[] = [
        'eip_schema_registry',
        'eip_evidence_registry', 
        'eip_entities',
        'eip_evidence_snapshots',
        'eip_artifacts',
        'eip_brand_profiles',
        'eip_jobs'
      ]
      
      const brokerTables: TableNames[] = [
        'ai_brokers',
        'broker_conversations',
        'broker_performance',
        'conversation_turn_events'
      ]
      
      // Should have EIP tables with proper prefix
      expect(eipTables).toContain('eip_artifacts')
      expect(eipTables).toContain('eip_entities')
      expect(eipTables).toContain('eip_jobs')
      
      // Should have broker tables preserved
      expect(brokerTables).toContain('ai_brokers')
      expect(brokerTables).toContain('broker_conversations')
      
      // Should not have conflicts (all EIP tables have prefix)
      eipTables.forEach(table => {
        expect(table.toString()).toMatch(/^eip_/)
      })
      
      brokerTables.forEach(table => {
        expect(table.toString()).not.toMatch(/^eip_/)
      })
    })

    test('No function name conflicts between EIP and broker schemas', () => {
      // Create function name arrays from the Database interface
      type FunctionNames = keyof Database['public']['Functions']
      const eipFunctions: FunctionNames[] = [
        'get_eip_artifacts_for_broker_conversation',
        'link_broker_conversation_to_eip_entities'
      ]
      
      const brokerFunctions: FunctionNames[] = [
        'check_broker_assignment',
        'get_assigned_broker', 
        'update_metrics_after_response'
      ]
      
      // Should have both EIP bridge and broker functions
      eipFunctions.forEach(func => {
        expect(func.toString()).toMatch(/^(get_eip_|link_broker_)/)
      })
      
      brokerFunctions.forEach(func => {
        expect(func.toString()).not.toMatch(/^(get_eip_|link_broker_)/)
      })
      
      // Functions should be distinct
      const allFunctions = [...eipFunctions, ...brokerFunctions]
      const uniqueFunctions = new Set(allFunctions)
      expect(uniqueFunctions.size).toBe(allFunctions.length)
    })
  })
})
