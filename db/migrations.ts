// ABOUTME: EIP Database Migration Manager
// ABOUTME: Handles version-controlled database migrations with rollback support

import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { sqlExecutor, SQLResult, MigrationRecord } from './sql-executor';

export interface Migration {
  id: string;
  version: string;
  name: string;
  description?: string;
  up: string; // SQL to apply migration
  down?: string; // SQL to rollback migration
  dependencies?: string[]; // Migration IDs that must run first
  checksum?: string;
}

export interface MigrationResult {
  migration: Migration;
  success: boolean;
  executionTime: number;
  error?: string;
  rowsAffected?: number;
}

export interface MigrationStatus {
  pending: Migration[];
  applied: MigrationRecord[];
  failed: MigrationResult[];
}

export class MigrationManager {
  private migrationsPath: string;
  private migrations: Migration[] = [];

  constructor(migrationsPath: string = './db/migrations') {
    this.migrationsPath = path.resolve(migrationsPath);
  }

  /**
   * Load all migrations from the migrations directory
   */
  async loadMigrations(): Promise<void> {
    console.log(`📂 Loading migrations from ${this.migrationsPath}...`);
    
    if (!fs.existsSync(this.migrationsPath)) {
      console.log('📁 Creating migrations directory...');
      fs.mkdirSync(this.migrationsPath, { recursive: true });
    }

    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Execute in filename order

    this.migrations = [];

    for (const file of migrationFiles) {
      const filePath = path.join(this.migrationsPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse migration file
      const migration = this.parseMigrationFile(file, content);
      if (migration) {
        this.migrations.push(migration);
      }
    }

    console.log(`📄 Loaded ${this.migrations.length} migrations`);
  }

  /**
   * Parse a migration file to extract metadata and SQL
   */
  private parseMigrationFile(filename: string, content: string): Migration | null {
    try {
      // Extract version from filename (e.g., "001_create_tables.sql" -> "001")
      const fileVersion = filename.split('_')[0];
      const fileName = filename.replace(/^\d+_/, '').replace('.sql', '');

      // Simple split for UP/DOWN migrations
      const upDownSplit = content.split(/^--\s*DOWN:\s*$/m);
      const up = upDownSplit[0].trim();
      const down = upDownSplit[1] ? upDownSplit[1].trim() : undefined;

      const migration: Migration = {
        id: fileVersion,
        version: fileVersion,
        name: fileName,
        up,
        down
      };

      // Generate checksum
      migration.checksum = this.generateChecksum(migration);

      return migration;

    } catch (error) {
      console.error(`❌ Failed to parse migration file ${filename}:`, error);
      return null;
    }
  }

  /**
   * Generate checksum for migration to detect changes
   */
  private generateChecksum(migration: Migration): string {
    const content = JSON.stringify({
      version: migration.version,
      name: migration.name,
      up: migration.up,
      down: migration.down
    });
    
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Get migration status (pending, applied, failed)
   */
  async getStatus(): Promise<MigrationStatus> {
    console.log('🔍 Checking migration status...');
    
    // Initialize database if needed
    await this.ensureMigrationTable();

    // Get applied migrations
    const { data: appliedMigrations, error } = await sqlExecutor.supabase
      .from('eip_schema_registry')
      .select('*')
      .order('version');

    if (error) {
      console.error('❌ Failed to get migration status:', error);
      return { pending: this.migrations, applied: [], failed: [] };
    }

    const applied = appliedMigrations || [];
    const appliedIds = new Set(applied.map((m: any) => m.checksum));

    // Find pending migrations
    const pending = this.migrations.filter(migration => {
      return !appliedIds.has(migration.checksum || '');
    });

    console.log(`📊 Migration status: ${pending.length} pending, ${applied.length} applied`);

    return {
      pending,
      applied,
      failed: []
    };
  }

  /**
   * Ensure migration tracking table exists
   */
  private async ensureMigrationTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS eip_schema_registry (
          key TEXT PRIMARY KEY,
          version TEXT NOT NULL,
          checksum TEXT NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await sqlExecutor.executeSQL(createTableSQL);
  }

  /**
   * Apply pending migrations
   */
  async migrate(targetVersion?: string): Promise<MigrationResult[]> {
    console.log('🚀 Starting database migration...');
    
    const status = await this.getStatus();
    const migrationsToRun = targetVersion 
      ? status.pending.filter(m => m.version <= targetVersion)
      : status.pending;

    if (migrationsToRun.length === 0) {
      console.log('✅ No pending migrations to apply');
      return [];
    }

    const results: MigrationResult[] = [];

    for (const migration of migrationsToRun) {
      console.log(`📦 Applying migration ${migration.id}: ${migration.name}...`);
      
      const startTime = Date.now();
      
      try {
        // Apply the migration
        const sqlResults = await sqlExecutor.executeMultipleSQL(
          this.parseSQLStatements(migration.up)
        );

        const executionTime = Date.now() - startTime;
        const failed = sqlResults.filter(r => !r.success);

        if (failed.length > 0) {
          const error = failed.map(r => r.error).join('; ');
          console.error(`❌ Migration ${migration.id} failed: ${error}`);
          
          results.push({
            migration,
            success: false,
            executionTime,
            error
          });

          // Stop on first failure
          break;
        }

        // Record successful migration
        await this.recordMigration(migration, executionTime);
        
        console.log(`✅ Migration ${migration.id} applied successfully (${executionTime}ms)`);
        
        results.push({
          migration,
          success: true,
          executionTime,
          rowsAffected: sqlResults.reduce((sum, r) => sum + (r.rows?.length || 0), 0)
        });

      } catch (error) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        console.error(`❌ Migration ${migration.id} failed:`, errorMessage);
        
        results.push({
          migration,
          success: false,
          executionTime,
          error: errorMessage
        });

        // Stop on first failure
        break;
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log(`📋 Migration complete: ${successCount} succeeded, ${failureCount} failed`);

    return results;
  }

  /**
   * Parse SQL statements from migration content
   */
  private parseSQLStatements(sql: string): string[] {
    return sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !/^(--|\s*$)/.test(stmt));
  }

  /**
   * Record a migration in the registry
   */
  private async recordMigration(migration: Migration, executionTime: number): Promise<void> {
    const { error } = await sqlExecutor.supabase
      .from('eip_schema_registry')
      .upsert({
        key: `migration_${migration.id}`,
        version: migration.version,
        checksum: migration.checksum || '',
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Failed to record migration:', error);
      throw error;
    }
  }
}

// Singleton instance
export const migrationManager = new MigrationManager();
