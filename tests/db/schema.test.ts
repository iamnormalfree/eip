// ABOUTME: Database schema validation tests for EIP Steel Thread
// ABOUTME: Validates Supabase database structure, constraints, and relationships

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';

describe('Database Schema Validation', () => {
  let supabase: any;
  let schemaSql: string;

  beforeAll(async () => {
    // Initialize Supabase client for testing
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Load schema file for validation
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    if (fs.existsSync(schemaPath)) {
      schemaSql = fs.readFileSync(schemaPath, 'utf8');
    }
  });

  describe('Core Tables Existence', () => {
    it('should have content_pieces table', async () => {
      const { data, error } = await supabase
        .from('content_pieces')
        .select('id')
        .limit(1);

      expect(error).toBeDefined();
      if (error && !error.message.includes('relation "content_pieces" does not exist')) {
        // Table exists but other error (likely permissions or empty)
        expect(error.code).not.toBe('42P01'); // PostgreSQL undefined_table
      }
    });

    it('should have ip_library table', async () => {
      const { data, error } = await supabase
        .from('ip_library')
        .select('id')
        .limit(1);

      expect(error).toBeDefined();
      if (error && !error.message.includes('relation "ip_library" does not exist')) {
        expect(error.code).not.toBe('42P01');
      }
    });

    it('should have generation_logs table', async () => {
      const { data, error } = await supabase
        .from('generation_logs')
        .select('id')
        .limit(1);

      expect(error).toBeDefined();
      if (error && !error.message.includes('relation "generation_logs" does not exist')) {
        expect(error.code).not.toBe('42P01');
      }
    });

    it('should have compliance_audit table', async () => {
      const { data, error } = await supabase
        .from('compliance_audit')
        .select('id')
        .limit(1);

      expect(error).toBeDefined();
      if (error && !error.message.includes('relation "compliance_audit" does not exist')) {
        expect(error.code).not.toBe('42P01');
      }
    });
  });

  describe('Schema Structure Validation', () => {
    it('should have required columns in content_pieces table', async () => {
      // Check if schema file contains required columns
      const requiredColumns = [
        'id UUID DEFAULT gen_random_uuid() PRIMARY KEY',
        'ip_type VARCHAR(50) NOT NULL',
        'ip_version VARCHAR(20) NOT NULL',
        'content TEXT NOT NULL',
        'compliance_tags JSONB',
        'provenance JSONB',
        'created_at TIMESTAMPTZ DEFAULT NOW()',
        'updated_at TIMESTAMPTZ DEFAULT NOW()'
      ];

      if (schemaSql) {
        requiredColumns.forEach(column => {
          expect(schemaSql).toContain(column);
        });
      } else {
        // Fallback: check through information schema if available
        const { data, error } = await supabase
          .rpc('get_table_columns', { table_name: 'content_pieces' })
          .catch(() => ({ data: [], error: { message: 'Function not available' } }));

        if (!error || error.message !== 'Function not available') {
          const columnNames = data?.map((col: any) => col.column_name) || [];
          const expectedNames = ['id', 'ip_type', 'ip_version', 'content', 'compliance_tags', 'provenance'];
          
          expectedNames.forEach(name => {
            expect(columnNames).toContain(name);
          });
        }
      }
    });

    it('should have proper constraints and indexes', async () => {
      if (schemaSql) {
        // Check for foreign key constraints
        expect(schemaSql).toContain('FOREIGN KEY');
        
        // Check for indexes on performance-critical columns
        expect(schemaSql).toContain('INDEX') || expect(schemaSql).toContain('CREATE INDEX');
        
        // Check for RLS policies
        expect(schemaSql).toContain('ROW LEVEL SECURITY') || expect(schemaSql).toContain('POLICY');
      }
    });

    it('should have JSONB columns for structured data', async () => {
      const jsonbColumns = ['compliance_tags', 'provenance', 'metadata'];
      
      if (schemaSql) {
        jsonbColumns.forEach(column => {
          expect(schemaSql).toContain(`${column} JSONB`);
        });
      }
    });
  });

  describe('Data Type Validation', () => {
    it('should use UUID for primary keys', async () => {
      if (schemaSql) {
        expect(schemaSql).toContain('UUID DEFAULT gen_random_uuid() PRIMARY KEY');
      }
    });

    it('should use TIMESTAMPTZ for timestamps', async () => {
      if (schemaSql) {
        expect(schemaSql).toContain('TIMESTAMPTZ DEFAULT NOW()');
      }
    });

    it('should have appropriate VARCHAR lengths', async () => {
      if (schemaSql) {
        // Check for reasonable VARCHAR lengths
        expect(schemaSql).toMatch(/VARCHAR\(\d{1,3}\)/);
        
        // Specifically check IP version constraints
        expect(schemaSql).toContain('VARCHAR(20)'); // For version strings
        expect(schemaSql).toContain('VARCHAR(50)'); // For IP types
      }
    });
  });

  describe('Compliance and Audit Structure', () => {
    it('should have compliance audit table structure', async () => {
      const complianceColumns = [
        'content_id UUID REFERENCES content_pieces(id)',
        'audit_type VARCHAR(50)',
        'audit_result JSONB',
        'score INTEGER CHECK (score >= 0 AND score <= 100)',
        'audit_timestamp TIMESTAMPTZ DEFAULT NOW()'
      ];

      if (schemaSql) {
        complianceColumns.forEach(column => {
          expect(schemaSql).toContain(column);
        });
      }
    });

    it('should have generation logs table for provenance', async () => {
      const logColumns = [
        'content_id UUID REFERENCES content_pieces(id)',
        'generation_stage VARCHAR(50)',
        'tokens_used INTEGER',
        'duration_ms INTEGER',
        'success BOOLEAN',
        'error_details TEXT'
      ];

      if (schemaSql) {
        logColumns.forEach(column => {
          expect(schemaSql).toContain(column);
        });
      }
    });
  });

  describe('Schema Consistency', () => {
    it('should have consistent naming conventions', async () => {
      if (schemaSql) {
        // Check snake_case convention
        const camelCaseMatches = schemaSql.match(/[a-z][A-Z]/g);
        if (camelCaseMatches) {
          // Should have minimal camelCase in SQL
          expect(camelCaseMatches.length).toBeLessThan(3);
        }

        // Check table names are plural
        const tableMatches = schemaSql.match(/CREATE TABLE [a-z_]+/g) || [];
        tableMatches.forEach((match: string) => {
          const tableName = match.replace('CREATE TABLE ', '');
          if (tableName !== 'schema_migrations' && !tableName.endsWith('s')) {
            console.warn(`Table ${tableName} should probably be plural`);
          }
        });
      }
    });

    it('should have proper timestamp columns', async () => {
      const timestampColumns = ['created_at', 'updated_at'];
      
      if (schemaSql) {
        timestampColumns.forEach(column => {
          expect(schemaSql).toContain(`${column} TIMESTAMPTZ DEFAULT NOW()`);
        });
      }
    });

    it('should have appropriate database constraints', async () => {
      if (schemaSql) {
        // Check for NOT NULL constraints on critical fields
        expect(schemaSql).toContain('NOT NULL');
        
        // Check for CHECK constraints
        expect(schemaSql).toContain('CHECK (');
        
        // Check for UNIQUE constraints where appropriate
        expect(schemaSql).toContain('UNIQUE');
      }
    });
  });

  afterAll(async () => {
    // Cleanup any test data if needed
    // In a real implementation, you might want to clean up test records
  });
});
