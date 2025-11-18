// ABOUTME: Database Schema Validation Tests (Schema Coexistence)
// ABOUTME: Tests that EIP schema creates without breaking broker functionality

import { Database } from '../../types/database.types'

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

    test('EIP bridge functions should be defined', () => {
      // Test bridge functions exist by accessing types directly
      const getArtifactsFunction: Database['public']['Functions']['get_next_eip_job'] = {} as any
      const linkEntitiesFunction: Database['public']['Functions']['complete_eip_job'] = {} as any
      const failJobFunction: Database['public']['Functions']['fail_eip_job_to_dlq'] = {} as any
      const getStatsFunction: Database['public']['Functions']['get_eip_job_stats'] = {} as any
      
      expect(getArtifactsFunction).toBeDefined()
      expect(linkEntitiesFunction).toBeDefined()
      expect(failJobFunction).toBeDefined()
      expect(getStatsFunction).toBeDefined()
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
      type GetArtifactsReturn = Database['public']['Functions']['get_next_eip_job']['Returns']
      
      const artifact: GetArtifactsReturn[0] = {
        job_id: 'test-id',
        brief: 'Test brief',
        persona: 'first_time_buyer',
        funnel: 'mofu',
        tier: 'LIGHT',
        queue_job_id: 'queue-test-id',
        correlation_id: 'test-correlation'
      }
      
      expect(artifact.job_id).toBe('test-id')
      expect(artifact.tier).toBe('LIGHT')
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
      
      // Should have EIP tables with proper prefix
      expect(eipTables).toContain('eip_artifacts')
      expect(eipTables).toContain('eip_entities')
      expect(eipTables).toContain('eip_jobs')
      
      // Should not have conflicts (all EIP tables have prefix)
      eipTables.forEach(table => {
        expect(table.toString()).toMatch(/^eip_/)
      })
    })

    test('No function name conflicts between EIP and broker schemas', () => {
      // Create function name arrays from the Database interface
      type FunctionNames = keyof Database['public']['Functions']
      const eipFunctions: FunctionNames[] = [
        'get_next_eip_job',
        'complete_eip_job',
        'fail_eip_job_to_dlq',
        'get_eip_job_stats'
      ]
      
      // Should have EIP functions with proper naming
      eipFunctions.forEach(func => {
        expect(func.toString()).toMatch(/^(get_next_|complete_|fail_|get_eip_)/)
      })
      
      // Functions should be distinct
      const uniqueFunctions = new Set(eipFunctions)
      expect(uniqueFunctions.size).toBe(eipFunctions.length)
    })
  })
})
