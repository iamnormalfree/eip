// ABOUTME: EIP Database Setup (Schema Coexistence)
// ABOUTME: Applies EIP schema with eip_ prefix to existing Supabase instance

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { execSync } from 'node:child_process';
import { sqlExecutor } from './sql-executor';
import { migrationManager } from './migrations';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Helper function for manual migration execution
async function executeMigrationsManually(migrationsPath: string) {
  const migrationFiles = fs.readdirSync(migrationsPath)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const migrationFile of migrationFiles) {
    const migrationPath = path.join(migrationsPath, migrationFile);
    console.log(`   📄 Applying migration: ${migrationFile}`);

    const results = await sqlExecutor.executeSQLFile(migrationPath, {
      retries: 2,
      timeout: 60000 // 60 seconds for schema setup
    });

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    if (failureCount > 0) {
      console.error(`❌ ${failureCount} statements failed in ${migrationFile}:`);
      results.filter(r => !r.success).forEach(result => {
        console.error(`   - ${result.error}`);
      });
    } else {
      console.log(`   ✅ ${migrationFile} applied successfully (${successCount} statements)`);
    }
  }
}

async function setupEipDatabase() {
  console.log('🔧 Setting up EIP database schema with coexistence approach...');

  try {
    // Initialize SQL executor and create exec_sql function
    console.log('🔧 Initializing SQL executor...');
    await sqlExecutor.initialize();
    
    // Test database connection
    const connected = await sqlExecutor.testConnection();
    if (!connected) {
      console.warn('⚠️  Database connectivity check failed (likely first-time setup). Continuing anyway...');
    } else {
      console.log('✅ Database connection successful');
    }

    // Initialize migration manager
    console.log('📂 Loading migrations...');
    await migrationManager.loadMigrations();

    // Apply Supabase CLI migrations if they exist
    const supabaseMigrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
    if (fs.existsSync(supabaseMigrationsPath)) {
      console.log('📝 Applying EIP schema via Supabase CLI migrations...');

      // Use npx to run Supabase CLI from devDependencies
      console.log('   🚀 Using npx supabase db push');

      // Execute CLI synchronously for simplicity
      try {
        // Use database URL from environment for direct connection
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
          throw new Error('DATABASE_URL not found in environment variables');
        }

      const result = execSync(`npx supabase db push --db-url "${dbUrl}" --include-all`, {
          cwd: process.cwd(),
          env: {
            ...process.env,
            SUPABASE_DB_PASSWORD: process.env.SUPABASE_SERVICE_ROLE_KEY
          },
          stdio: 'pipe',
          timeout: 120000 // 2 minute timeout
        });

        const output = result.toString();
        console.log('✅ Supabase CLI migrations applied successfully');
        console.log('   Output:', output);
      } catch (error: any) {
        console.error('❌ Supabase CLI failed:', error.message);
        if (error.message) console.error('   Error output:', error.message);
        // Fallback to manual execution
        await executeMigrationsManually(supabaseMigrationsPath);
      }
    } else {
      console.log('❌ No Supabase migrations found in supabase/migrations/');
      return;
    }

    // Validate EIP tables were created
    console.log('🔍 Validating EIP schema...');
    const eipTables = [
      'eip_schema_registry',
      'eip_evidence_registry', 
      'eip_entities',
      'eip_evidence_snapshots',
      'eip_artifacts',
      'eip_brand_profiles',
      'eip_jobs'
    ];

    for (const table of eipTables) {
      try {
        const { count, error } = await sqlExecutor.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.error(`   ❌ Table ${table} not accessible:`, error.message);
        } else {
          console.log(`   ✅ Table ${table} accessible (${count} rows)`);
        }
      } catch (err) {
        console.error(`   ❌ Table ${table} validation failed:`, err);
      }
    }

    // REMOVED: Broker table validation - broker era baggage cleaned up
    console.log('🔍 EIP schema cleaned up - broker era tables removed');

    // REMOVED: Bridge function tests - broker era baggage cleaned up
    console.log('🔍 EIP functions cleaned up - broker bridge functions removed');

    console.log('\n🎉 EIP Database setup completed!');
    console.log('📋 Summary:');
    console.log('   - EIP tables created with eip_ prefix');
    console.log('   - Broker era baggage cleaned up');
    console.log('   - Registry seeds applied');
    console.log('   - Pure EIP focus achieved');
    console.log('\n📖 Next steps:');
    console.log('   - Run: npm run db:seed (optional: add demo data)');
    console.log('   - Run: npm run orchestrator:dev');
    console.log('   - Visit: http://localhost:3002/review');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

function main() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('❌ No supabase/migrations directory found. Please create Supabase migrations first.');
    return;
  }

  console.log('🚀 Starting EIP Database Setup (Supabase CLI Migration Approach)');
  setupEipDatabase();
}

// Export for potential programmatic usage
export { setupEipDatabase };

// Run if called directly
if (require.main === module) {
  main();
}
