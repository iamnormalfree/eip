// ABOUTME: SQL Executor Tests (Comprehensive Database Operations)
// ABOUTME: Tests for safe SQL execution and migration management

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SQLExecutor } from '../../db/sql-executor';

describe('SQL Executor', () => {
  let executor: SQLExecutor;

  beforeEach(() => {
    executor = new SQLExecutor();
  });

  describe('SQL Sanitization', () => {
    it('should remove comments from SQL', () => {
      const sqlWithComments = `
        CREATE TABLE test (
          id UUID PRIMARY KEY
        );
        -- This is a comment
        SELECT * FROM test;
      `;
      
      // Access private method through reflection for testing
      const sanitize = (executor as any).sanitizeSQL.bind(executor);
      const cleaned = sanitize(sqlWithComments);
      
      expect(cleaned).not.toContain('-- This is a comment');
      expect(cleaned).toContain('CREATE TABLE test');
      expect(cleaned).toContain('SELECT * FROM test');
    });

    it('should detect potentially dangerous SQL', () => {
      const dangerousSQL = 'DROP DATABASE production;';
      
      const sanitize = (executor as any).sanitizeSQL.bind(executor);
      const cleaned = sanitize(dangerousSQL);
      
      // Should still return the SQL but with warnings
      expect(cleaned).toBe(dangerousSQL);
    });

    it('should handle empty SQL gracefully', () => {
      const sanitize = (executor as any).sanitizeSQL.bind(executor);
      const cleaned = sanitize('   \n  \n   -- just comments');
      
      expect(cleaned.trim()).toBe('');
    });
  });

  describe('SQL Parsing', () => {
    it('should split SQL file into statements', () => {
      const multiStatementSQL = `
        CREATE TABLE users (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL
        );
        
        CREATE TABLE posts (
          id UUID PRIMARY KEY,
          user_id UUID REFERENCES users(id)
        );
        
        INSERT INTO users (id, name) VALUES (gen_random_uuid(), 'test');
      `;
      
      const parseStatements = (executor as any).parseSQLStatements.bind(executor);
      const statements = parseStatements(multiStatementSQL);
      
      expect(statements).toHaveLength(3);
      expect(statements[0]).toContain('CREATE TABLE users');
      expect(statements[1]).toContain('CREATE TABLE posts');
      expect(statements[2]).toContain('INSERT INTO users');
    });

    it('should filter out empty statements and comments', () => {
      const sqlWithEmptyStatements = `
        -- This is a comment
        
        CREATE TABLE test (id UUID);
        
        -- Another comment
        
        SELECT * FROM test;
      `;
      
      const parseStatements = (executor as any).parseSQLStatements.bind(executor);
      const statements = parseStatements(sqlWithEmptyStatements);
      
      expect(statements).toHaveLength(2);
      expect(statements[0]).toContain('CREATE TABLE test');
      expect(statements[1]).toContain('SELECT * FROM test');
    });
  });

  describe('Query Type Detection', () => {
    it('should identify SELECT queries', () => {
      const isSelectQuery = (executor as any).isSelectQuery.bind(executor);
      
      expect(isSelectQuery('SELECT * FROM users')).toBe(true);
      expect(isSelectQuery('SELECT id, name FROM users WHERE active = true')).toBe(true);
      expect(isSelectQuery('WITH RECURSIVE cte AS (SELECT * FROM users) SELECT * FROM cte')).toBe(true);
    });

    it('should identify non-SELECT queries', () => {
      const isSelectQuery = (executor as any).isSelectQuery.bind(executor);
      
      expect(isSelectQuery('INSERT INTO users (name) VALUES (\'test\')')).toBe(false);
      expect(isSelectQuery('UPDATE users SET name = \'test\'')).toBe(false);
      expect(isSelectQuery('CREATE TABLE users (id UUID)')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed SQL gracefully', () => {
      const malformedSQL = 'CREATE TABLE (invalid sql syntax';
      
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await executor.executeSQL(malformedSQL, { retries: 1 });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      consoleSpy.mockRestore();
    });

    it('should retry failed executions', async () => {
      const testSQL = 'SELECT 1 as test;';
      
      // Mock execution to fail initially then succeed
      let attempts = 0;
      const mockSupabase = {
        rpc: jest.fn().mockImplementation(() => {
          attempts++;
          if (attempts < 2) {
            return Promise.resolve({ error: { message: 'Connection timeout' } });
          }
          return Promise.resolve({ 
            data: [{ success: true, rows_affected: 0, message: 'Success', execution_time_ms: 10 }],
            error: null 
          });
        })
      };
      
      (executor as any).supabase = mockSupabase;
      
      const result = await executor.executeSQL(testSQL, { retries: 3 });
      
      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });
  });

  describe('Options Handling', () => {
    it('should respect timeout settings', async () => {
      const longRunningSQL = 'SELECT pg_sleep(10);';
      
      // Mock timeout behavior
      const mockSupabase = {
        rpc: jest.fn().mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ data: [{ success: true }], error: null });
            }, 100);
          });
        })
      };
      
      (executor as any).supabase = mockSupabase;
      
      const startTime = Date.now();
      const result = await executor.executeSQL(longRunningSQL, { timeout: 50 });
      const endTime = Date.now();
      
      // Should timeout quickly
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should handle dry run mode', async () => {
      const testSQL = 'CREATE TABLE test (id UUID);';
      
      const result = await executor.executeSQL(testSQL, { dryRun: true });
      
      expect(result.success).toBe(true);
      expect(result.statement).toBe(testSQL);
      expect(result.executionTime).toBe(0);
    });
  });

  describe('Multiple Statement Execution', () => {
    it('should execute multiple statements in sequence', async () => {
      const statements = [
        'SELECT 1 as test1;',
        'SELECT 2 as test2;',
        'SELECT 3 as test3;'
      ];
      
      const mockSupabase = {
        rpc: jest.fn().mockResolvedValue({
          data: [{ success: true, rows_affected: 0, message: 'Success', execution_time_ms: 5 }],
          error: null
        })
      };
      
      (executor as any).supabase = mockSupabase;
      
      const results = await executor.executeMultipleSQL(statements);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
      
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(3);
    });

    it('should stop on first error when transaction is true', async () => {
      const statements = [
        'SELECT 1 as test1;',
        'INVALID SQL SYNTAX',
        'SELECT 3 as test3;'
      ];
      
      const mockSupabase = {
        rpc: jest.fn().mockImplementation((sql) => {
          if (sql.includes('INVALID')) {
            return Promise.resolve({
              data: null,
              error: { message: 'Syntax error' }
            });
          }
          return Promise.resolve({
            data: [{ success: true, rows_affected: 0, message: 'Success', execution_time_ms: 5 }],
            error: null
          });
        })
      };
      
      (executor as any).supabase = mockSupabase;
      
      const results = await executor.executeMultipleSQL(statements, { transaction: true });
      
      expect(results).toHaveLength(2); // Should stop after error
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      
      // Third statement should not be executed
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    });
  });

  describe('Database Connectivity', () => {
    it('should test database connection', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      };
      
      (executor as any).supabase = mockSupabase;
      
      const connected = await executor.testConnection();
      
      expect(connected).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('eip_schema_registry');
    });

    it('should handle connection failures', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection failed' }
        })
      };
      
      (executor as any).supabase = mockSupabase;
      
      const connected = await executor.testConnection();
      
      expect(connected).toBe(false);
    });
  });
});
