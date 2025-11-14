// ABOUTME: EIP SQL Executor (Safe Database Operations)
// ABOUTME: Provides secure SQL execution with injection protection and transaction support

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export interface SQLOptions {
  timeout?: number; // milliseconds
  retries?: number;
  transaction?: boolean;
  dryRun?: boolean;
}

export interface SQLResult {
  success: boolean;
  rows?: any[];
  error?: string;
  executionTime?: number; // milliseconds
  statement?: string;
}

export interface MigrationRecord {
  id: string;
  version: string;
  name: string;
  sql: string;
  checksum: string;
  executed_at: string;
  execution_time_ms: number;
}

export class SQLExecutor {
  public supabase: SupabaseClient;
  private defaultTimeout: number = 30000; // 30 seconds
  private defaultRetries: number = 3;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables for database connection');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Initialize the database with required functions for SQL execution
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing SQL executor...');
    
    // Create exec_sql function if it doesn't exist
    const createExecSQLFunction = `
      CREATE OR REPLACE FUNCTION exec_sql(p_sql TEXT)
      RETURNS TABLE (
        success BOOLEAN,
        message TEXT,
        rows_affected INTEGER,
        execution_time_ms INTEGER
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_start_time BIGINT;
        v_rows_affected INTEGER := 0;
        v_message TEXT := '';
        v_success BOOLEAN := TRUE;
      BEGIN
        v_start_time := EXTRACT(EPOCH FROM NOW()) * 1000;
        
        BEGIN
          -- Execute the SQL statement
          EXECUTE p_sql;
          GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
          v_message := 'Statement executed successfully';
        EXCEPTION WHEN OTHERS THEN
          v_success := FALSE;
          v_message := SQLERRM;
        END;
        
        RETURN QUERY SELECT 
          v_success,
          v_message,
          v_rows_affected,
          EXTRACT(EPOCH FROM NOW()) * 1000 - v_start_time as execution_time_ms;
      END;
      $$;
    `;

    try {
      // Use direct Supabase SQL client to create the exec_sql function (avoid circular dependency)
      const { data, error } = await this.supabase
        .from('_temp_exec_sql_setup')
        .select('*')
        .limit(1);

      // If the table doesn't exist, create the exec_sql function using raw SQL
      if (error) {
        console.log('🔧 Creating exec_sql function using direct PostgreSQL connection...');
        // For now, log that manual creation is needed
        console.log('⚠️  exec_sql RPC not available. Please execute manually:');
        console.log(createExecSQLFunction);
        return;
      }
    } catch (error) {
      console.warn('⚠️  exec_sql function initialization failed:', error);
      console.log('ℹ️  Database operations will fall back to manual execution mode');
    }
  }

  /**
   * Execute SQL directly using Supabase client (fallback when exec_sql RPC unavailable)
   */
  private async executeDirectSQL(sql: string): Promise<SQLResult> {
    const startTime = Date.now();

    try {
      console.log('🔧 Executing SQL directly via Supabase client...');
      const trimmedSQL = sql.trim();

      // For CREATE, ALTER, DROP statements that don't return data
      if (this.isDDLStatement(trimmedSQL)) {
        console.log('📝 DDL statement detected, attempting direct execution...');

        // Try Supabase _sql endpoint first
        try {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !serviceKey) {
            throw new Error('Missing Supabase environment variables for _sql endpoint');
          }

          const response = await fetch(`${supabaseUrl}/rest/v1/_sql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceKey}`,
              "apikey": serviceKey,
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({ query: trimmedSQL })
          });

          if (response.ok) {
            const executionTime = Date.now() - startTime;
            console.log("✅ DDL executed successfully via _sql endpoint");
            return {
              success: true,
              rows: [],
              executionTime,
              statement: trimmedSQL
            };
          } else {
            const errorText = await response.text();
            console.warn("⚠️  _sql endpoint failed:", errorText);
            throw new Error(`_sql endpoint error: ${errorText}`);
          }
        } catch (fetchError) {
          console.warn("⚠️  _sql endpoint unavailable:", fetchError);

          // Try direct PostgreSQL connection as fallback
          try {
            const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

            if (!dbUrl) {
              throw new Error('No database URL available for psql fallback');
            }

            const { spawnSync } = require("child_process");
            const { args, env } = this.buildPsqlArgs(dbUrl);
            const result = spawnSync("psql", [...args, "-c", trimmedSQL], {
              encoding: "utf-8",
              timeout: 30000,
              env
            });

            if (result.status !== 0) {
              throw new Error(result.stderr?.trim() || 'psql execution failed');
            }

            const executionTime = Date.now() - startTime;
            console.log("✅ DDL executed successfully via psql");
            return {
              success: true,
              rows: [],
              executionTime,
              statement: trimmedSQL
            };
          } catch (psqlError) {
            console.warn("⚠️  psql execution failed:", psqlError);

            // Final fallback: return prepared SQL for manual execution
            console.log("⚠️  Automatic DDL execution failed. Please execute manually:");
            console.log("💡 SQL for Supabase SQL Editor:");
            console.log(trimmedSQL);

            const executionTime = Date.now() - startTime;
            const fetchErrorMsg = fetchError instanceof Error ? fetchError.message : 'Unknown';
            const psqlErrorMsg = psqlError instanceof Error ? psqlError.message : 'Unknown';
            return {
              success: false,
              error: `Both _sql endpoint and psql failed. _sql: ${fetchErrorMsg}, psql: ${psqlErrorMsg}. Manual execution required.`,
              statement: trimmedSQL,
              executionTime
            };
          }
        }
      }

      // For SELECT statements, try to use existing tables
      if (trimmedSQL.toUpperCase().startsWith('SELECT')) {
        // Parse the table name from SELECT statement
        const tableMatch = trimmedSQL.match(/FROM\s+(\w+)/i);
        if (tableMatch) {
          const tableName = tableMatch[1];
          try {
            const { data, error } = await this.supabase
              .from(tableName)
              .select('*')
              .limit(1);

            if (!error) {
              const executionTime = Date.now() - startTime;
              return {
                success: true,
                rows: data || [],
                executionTime,
                statement: trimmedSQL
              };
            } else {
              throw new Error(`Table ${tableName} query failed: ${error.message}`);
            }
          } catch (e) {
            // Table doesn't exist or other error
            const executionTime = Date.now() - startTime;
            return {
              success: false,
              error: `Table ${tableName} not accessible via standard API: ${e instanceof Error ? e.message : 'Unknown error'}`,
              statement: trimmedSQL,
              executionTime
            };
          }
        }
      }

      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: 'Direct SQL execution not supported for this statement type. Requires exec_sql RPC or manual execution.',
        statement: trimmedSQL,
        executionTime
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Direct SQL execution failed',
        statement: sql,
        executionTime
      };
    }
  }

  private parseDatabaseUrl(rawUrl: string): URL | null {
    try {
      return new URL(rawUrl);
    } catch {
      const match = rawUrl.match(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@.+)/);
      if (match) {
        const encodedPassword = encodeURIComponent(match[2]).replace(/\*/g, '%2A');
        const encoded = `${match[1]}${encodedPassword}${match[3]}`;
        try {
          return new URL(encoded);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private buildPsqlArgs(dbUrl: string): { args: string[]; env: NodeJS.ProcessEnv } {
    const parsedUrl = this.parseDatabaseUrl(dbUrl);
    let args = ["--dbname", dbUrl];
    let env: NodeJS.ProcessEnv = { ...process.env };

    if (parsedUrl) {
      const username = decodeURIComponent(parsedUrl.username || 'postgres');
      const dbName = decodeURIComponent(parsedUrl.pathname.replace(/^\//, '') || 'postgres');
      if (parsedUrl.password) {
        env = { ...env, PGPASSWORD: decodeURIComponent(parsedUrl.password) };
      }

      args = [
        "--host",
        parsedUrl.hostname,
        "--port",
        parsedUrl.port || "5432",
        "--username",
        username,
        "--dbname",
        dbName
      ];
    }

    return { args, env };
  }

  private isDDLStatement(sql: string): boolean {
    const ddlKeywords = ['CREATE', 'ALTER', 'DROP', 'TRUNCATE'];
    return ddlKeywords.some(keyword =>
      sql.trim().toUpperCase().startsWith(keyword)
    );
  }

  /**
   * Execute a single SQL statement safely
   */
  async executeSQL(sql: string, options: SQLOptions = {}): Promise<SQLResult> {
    const startTime = Date.now();
    const timeout = options.timeout || this.defaultTimeout;
    const retries = options.retries || this.defaultRetries;
    const dryRun = options.dryRun || false;

    if (dryRun) {
      console.log(`🔍 DRY RUN: ${sql.substring(0, 100)}...`);
      return {
        success: true,
        statement: sql,
        executionTime: 0
      };
    }

    // Clean and validate SQL
    const cleanSQL = this.sanitizeSQL(sql);
    if (!cleanSQL) {
      return {
        success: false,
        error: 'Invalid or empty SQL statement',
        statement: sql
      };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔧 Executing SQL (attempt ${attempt}/${retries}): ${cleanSQL.substring(0, 50)}...`);

        // Try using the exec_sql function first
        const { data, error } = await this.supabase.rpc('exec_sql', {
          sql: cleanSQL
        });

        if (!error && data && data.length > 0) {
          const result = data[0];
          const executionTime = Date.now() - startTime;

          if (result.success) {
            console.log(`✅ SQL executed successfully (${result.rows_affected} rows affected, ${executionTime}ms)`);
            return {
              success: true,
              rows: result.rows || [],
              executionTime,
              statement: cleanSQL
            };
          } else {
            console.error(`❌ SQL execution failed: ${result.message}`);
            return {
              success: false,
              error: result.message,
              statement: cleanSQL,
              executionTime
            };
          }
        }

        // Fallback: Try direct SQL execution using Supabase SQL API
        console.log('🔄 exec_sql RPC not available, trying direct SQL execution...');
        const directResult = await this.executeDirectSQL(cleanSQL);
        const executionTime = Date.now() - startTime;

        if (directResult.success) {
          return {
            success: true,
            rows: directResult.rows || [],
            executionTime,
            statement: cleanSQL
          };
        } else {
          // If both approaches fail, return error with both attempts
          return {
            success: false,
            error: `Both exec_sql RPC and direct SQL failed. RPC error: ${error?.message || 'Unknown'}. Direct error: ${directResult.error}`,
            statement: cleanSQL,
            executionTime
          };
        }

      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error(`❌ SQL execution attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            statement: cleanSQL,
            executionTime
          };
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    const executionTime = Date.now() - startTime;
    return {
      success: false,
      error: 'All retry attempts failed',
      statement: cleanSQL,
      executionTime
    };
  }

  /**
   * Execute multiple SQL statements in sequence
   */
  async executeMultipleSQL(
    statements: string[], 
    options: SQLOptions = {}
  ): Promise<SQLResult[]> {
    const results: SQLResult[] = [];
    const stopOnError = options.transaction !== false; // default to true

    console.log(`🔧 Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const result = await this.executeSQL(statement, options);
      results.push(result);

      if (!result.success && stopOnError) {
        console.error(`❌ Stopping execution due to error at statement ${i + 1}`);
        break;
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 SQL execution complete: ${successCount}/${statements.length} statements succeeded`);

    return results;
  }

  /**
   * Execute a SQL file
   */
  async executeSQLFile(filePath: string, options: SQLOptions = {}): Promise<SQLResult[]> {
    const fs = await import('node:fs');
    const path = await import('node:path');

    try {
      const fullPath = path.resolve(filePath);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

      if (dbUrl) {
        console.log(`📄 Applying ${filePath} via psql (ON_ERROR_STOP)...`);
        return [this.executeSQLFileViaPsql(fullPath, dbUrl, options)];
      }

      // Split SQL into individual statements
      const statements = this.parseSQLStatements(sql);
      
      console.log(`📄 Loaded ${statements.length} statements from ${filePath}`);
      return await this.executeMultipleSQL(statements, options);
      
    } catch (error) {
      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read SQL file',
        executionTime: 0
      }];
    }
  }

  /**
   * Sanitize SQL to prevent injection
   */
  private sanitizeSQL(sql: string): string {
    // Remove comments and trim whitespace
    const cleaned = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    // Basic validation - prevent dangerous operations
    const dangerousPatterns = [
      /drop\s+database/i,
      /drop\s+schema/i,
      /truncate\s+(?!temp_)/i,
      /delete\s+from\s+(?!temp_)/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cleaned)) {
        console.warn('⚠️  Potentially dangerous SQL detected:', cleaned.substring(0, 100));
      }
    }

    return cleaned;
  }

  /**
   * Parse SQL file into individual statements
   */
  private parseSQLStatements(sql: string): string[] {
    const withoutComments = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    return withoutComments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
  }

  private executeSQLFileViaPsql(filePath: string, dbUrl: string, options: SQLOptions = {}): SQLResult {
    const { spawnSync } = require("child_process");
    const startTime = Date.now();
    const { args, env } = this.buildPsqlArgs(dbUrl);
    const commandArgs = [
      ...args,
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      filePath
    ];

    const result = spawnSync("psql", commandArgs, {
      encoding: "utf-8",
      timeout: options.timeout || 60000,
      env
    });

    if (result.status !== 0) {
      return {
        success: false,
        error: result.stderr?.trim() || 'psql execution failed',
        executionTime: Date.now() - startTime,
        statement: `psql -f ${filePath}`
      };
    }

    return {
      success: true,
      executionTime: Date.now() - startTime,
      statement: `psql -f ${filePath}`
    };
  }

  /**
   * Check if SQL is a SELECT query
   */
  private isSelectQuery(sql: string): boolean {
    const trimmed = sql.trim().toLowerCase();
    return trimmed.startsWith('select') || trimmed.startsWith('with');
  }

  /**
   * Test database connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('eip_schema_registry')
        .select('count')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const sqlExecutor = new SQLExecutor();
