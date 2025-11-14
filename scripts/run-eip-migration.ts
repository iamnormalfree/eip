#!/usr/bin/env npx tsx

/**
 * EIP Schema Migration Runner
 * 
 * This script executes the EIP unified schema migration using the Supabase client.
 * It follows the same pattern as existing migration scripts in the project.
 */

import { getSupabaseAdmin } from '../lib_supabase/db/supabase-client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  console.log('🚀 Starting EIP Schema Migration...');
  
  try {
    // Get the Supabase admin client
    const supabase = getSupabaseAdmin();
    
    // Read the migration SQL file
    const migrationPath = join(__dirname, '../lib_supabase/db/migrations/003_eip_unified_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded:', migrationPath);
    
    // Execute the migration
    console.log('🔄 Executing migration SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If exec_sql function doesn't exist, we'll need to use a different approach
      console.log('⚠️ exec_sql function not available, attempting direct SQL execution...');
      
      // For Supabase, we might need to split the SQL into individual statements
      // or use the SQL editor if direct execution isn't available through the client
      
      throw new Error(`Direct SQL execution through client not supported: ${error.message}`);
    }
    
    console.log('✅ Migration executed successfully!');
    console.log('📊 Migration result:', data);
    
    // Verify the migration by checking if EIP tables exist
    console.log('🔍 Verifying migration results...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'eip_schema_registry',
        'eip_evidence_registry', 
        'eip_entities',
        'eip_evidence_snapshots',
        'eip_brand_profiles',
        'eip_jobs',
        'eip_artifacts'
      ]);
    
    if (tablesError) {
      console.warn('⚠️ Could not verify table creation:', tablesError.message);
    } else {
      const createdTables = tables?.map(t => t.table_name) || [];
      console.log('📋 EIP Tables created:', createdTables);
      
      const expectedTables = [
        'eip_schema_registry',
        'eip_evidence_registry', 
        'eip_entities',
        'eip_evidence_snapshots',
        'eip_brand_profiles',
        'eip_jobs',
        'eip_artifacts'
      ];
      
      const missingTables = expectedTables.filter(table => !createdTables.includes(table));
      
      if (missingTables.length > 0) {
        console.warn('⚠️ Missing tables:', missingTables);
      } else {
        console.log('🎉 All EIP tables created successfully!');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error.message.includes('exec_sql')) {
      console.log('\n💡 Alternative approaches:');
      console.log('1. Run the SQL manually in Supabase SQL Editor:');
      console.log(`   File: ${join(__dirname, '../lib_supabase/db/migrations/003_eip_unified_schema.sql')}`);
      console.log('2. Use Supabase CLI: supabase db push');
      console.log('3. Use psql with connection string from environment');
    }
    
    process.exit(1);
  }
}

// Alternative approach: Try to use raw SQL if RPC isn't available
async function runMigrationWithRawSQL() {
  console.log('🔄 Attempting raw SQL execution...');
  
  try {
    const supabase = getSupabaseAdmin();
    
    // Since we can't execute arbitrary SQL through the JS client,
    // we'll provide instructions for manual execution
    const migrationPath = join(__dirname, '../lib_supabase/db/migrations/003_eip_unified_schema.sql');
    
    console.log(`
🔧 EIP Schema Migration Instructions:

The migration SQL has been prepared at:
📁 ${migrationPath}

To complete the migration, choose one of these approaches:

1️⃣  Supabase Dashboard (Recommended):
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Copy and paste the contents of the migration file
   - Execute the SQL

2️⃣  Supabase CLI (if available):
   cd ${process.cwd()}
   supabase db push

3️⃣  psql (direct database connection):
   psql $SUPABASE_DB_URL -f ${migrationPath}

4️⃣  Verify migration after execution:
   node -e "
   const { getSupabaseAdmin } = require('./lib_supabase/db/supabase-client');
   const supabase = getSupabaseAdmin();
   supabase.from('eip_schema_registry').select('*').then(r => console.log('EIP tables exist:', !r.error));
   "

The migration will create these tables:
✅ eip_schema_registry
✅ eip_evidence_registry  
✅ eip_entities
✅ eip_evidence_snapshots
✅ eip_brand_profiles
✅ eip_jobs
✅ eip_artifacts

And these functions:
✅ get_next_eip_job
✅ complete_eip_job
✅ fail_eip_job_to_dlq
✅ get_eip_job_stats
`);
    
  } catch (error) {
    console.error('❌ Failed to provide migration instructions:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('EIP Unified Schema Migration Runner');
  console.log('=====================================\n');
  
  // Check if required environment variables are set
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.log('\nPlease set these variables in your .env.local file');
    process.exit(1);
  }
  
  // Try direct execution first, fallback to instructions
  await runMigration().catch(runMigrationWithRawSQL);
}

// Run the migration
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Migration runner failed:', error);
    process.exit(1);
  });
}

export { runMigration, runMigrationWithRawSQL };
