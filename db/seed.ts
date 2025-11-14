// ABOUTME: EIP Database Seed Implementation (Fixed)
// ABOUTME: Populates database with demo jobs, artifacts, and entities

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

const SEED_JOB_IDS = [
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
];

const SEED_ARTIFACT_IDS = [
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
];

dotenv.config({ path: '.env.local' });

export class DatabaseSeeder {
  private supabase: SupabaseClient;

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

  async seedDatabase(): Promise<{ success: boolean; error?: string }> {
    console.log('🌱 Starting database seeding...');
    
    try {
      const [jobId1, jobId2, jobId3] = SEED_JOB_IDS;

      // Seed jobs
      console.log('📝 Seeding 3 demo jobs...');
      
      const jobs = [
        {
          id: jobId1,
          brief: 'Create a comprehensive guide to Singapore property tax rates for first-time homebuyers',
          persona: 'property_tax_advisor',
          funnel: 'mortgage_application',
          tier: 'MEDIUM',
          correlation_id: 'demo_001',
          queue_job_id: null,
          status: 'completed',
          stage: 'seeded_data',
          inputs: { target_audience: 'first_time_homebuyers' },
          budget_tracker: { tokens_used: 0, cost_cents: 0, time_ms: 0 },
          retry_count: 0
        },
        {
          id: jobId2,
          brief: 'Explain HDB loan eligibility criteria for young couples',
          persona: 'housing_loan_specialist',
          funnel: 'loan_inquiry',
          tier: 'LIGHT',
          correlation_id: 'demo_002',
          queue_job_id: null,
          status: 'completed',
          stage: 'seeded_data',
          inputs: { target_audience: 'young_couples' },
          budget_tracker: { tokens_used: 0, cost_cents: 0, time_ms: 0 },
          retry_count: 0
        },
        {
          id: jobId3,
          brief: 'Detailed comparison between bank loans and HDB loans with case studies',
          persona: 'mortgage_analyst',
          funnel: 'loan_comparison',
          tier: 'HEAVY',
          correlation_id: 'demo_003',
          queue_job_id: null,
          status: 'completed',
          stage: 'seeded_data',
          inputs: { comparison_type: 'bank_vs_hdb' },
          budget_tracker: { tokens_used: 0, cost_cents: 0, time_ms: 0 },
          retry_count: 0
        }
      ];

      for (const job of jobs) {
        const { error } = await this.supabase.from('eip_jobs').insert(job);
        if (error) {
          console.error('❌ Failed to seed job:', error.message);
          return { success: false, error: error.message };
        }
      }

      // Seed artifacts
      console.log('📄 Seeding 2 demo artifacts...');
      
      const artifacts = [
        {
          id: SEED_ARTIFACT_IDS[0],
          job_id: jobId1,
          brief: 'Create a comprehensive guide to Singapore property tax rates for first-time homebuyers',
          ip_used: 'Framework',
          tier: 'MEDIUM',
          persona: 'property_tax_advisor',
          funnel: 'mortgage_application',
          status: 'published',
          content: '# Singapore Property Tax Guide for First-Time Homebuyers\n\n## Understanding Property Tax Basics\n\nProperty tax in Singapore is an annual tax on property ownership.',
          frontmatter: { title: 'Demo: Singapore Property Tax Guide', persona: 'property_tax_advisor' },
          jsonld: { '@context': 'https://schema.org', '@type': 'Article' },
          ledger: { compliance_checks: [], sources_verified: [], human_review: { status: 'seed_data' } },
          reviewer_score: 4
        },
        {
          id: SEED_ARTIFACT_IDS[1],
          job_id: jobId2,
          brief: 'Explain HDB loan eligibility criteria for young couples',
          ip_used: 'Process',
          tier: 'LIGHT',
          persona: 'housing_loan_specialist',
          funnel: 'loan_inquiry',
          status: 'published',
          content: '# HDB Loan Eligibility for Young Couples\n\n## Basic Requirements\n\nTo qualify for an HDB loan as a young couple:',
          frontmatter: { title: 'Demo: HDB Loan Eligibility', persona: 'housing_loan_specialist' },
          jsonld: { '@context': 'https://schema.org', '@type': 'Article' },
          ledger: { compliance_checks: [], sources_verified: [], human_review: { status: 'seed_data' } },
          reviewer_score: 5
        }
      ];

      for (const artifact of artifacts) {
        const { error } = await this.supabase.from('eip_artifacts').insert(artifact);
        if (error) {
          console.error('❌ Failed to seed artifact:', error.message);
          return { success: false, error: error.message };
        }
      }

      // Seed entities
      console.log('🏷️ Seeding 4 demo entities...');
      
      const entities = [
        {
          id: uuidv4(),
          type: 'persona',
          name: 'property_tax_advisor',
          attrs: { expertise: ['property_tax'], specialization: 'singapore_property_tax' },
          source_url: 'seed-data'
        },
        {
          id: uuidv4(),
          type: 'persona',
          name: 'housing_loan_specialist',
          attrs: { expertise: ['hdb_loans'], specialization: 'first_time_homebuyers' },
          source_url: 'seed-data'
        },
        {
          id: uuidv4(),
          type: 'funnel',
          name: 'mortgage_application',
          attrs: { stage: 'consideration', intent: 'apply_for_mortgage' },
          source_url: 'seed-data'
        },
        {
          id: uuidv4(),
          type: 'funnel',
          name: 'loan_inquiry',
          attrs: { stage: 'research', intent: 'understand_loan_options' },
          source_url: 'seed-data'
        }
      ];

      for (const entity of entities) {
        const { error } = await this.supabase.from('eip_entities').insert(entity);
        if (error) {
          console.error('❌ Failed to seed entity:', error.message);
          return { success: false, error: error.message };
        }
      }

      console.log('✅ Database seeding completed successfully!');
      console.log('📊 Summary:');
      console.log('   - 3 demo jobs (MEDIUM, LIGHT, HEAVY tiers)');
      console.log('   - 2 demo artifacts (published content)');
      console.log('   - 4 demo entities (personas and funnels)');
      
      return { success: true };

    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown seeding error' 
      };
    }
  }

  async clearSeedData(): Promise<{ success: boolean; error?: string }> {
    console.log('🧹 Clearing seed data...');

    try {
      // Clear artifacts inserted by this script
      const { error: artifactsError } = await this.supabase
        .from('eip_artifacts')
        .delete()
        .in('id', SEED_ARTIFACT_IDS);

      if (artifactsError) {
        console.warn('⚠️  Warning clearing artifacts:', artifactsError.message);
      }

      // Clear jobs inserted by this script
      const { error: jobsError } = await this.supabase
        .from('eip_jobs')
        .delete()
        .in('id', SEED_JOB_IDS);

      if (jobsError) {
        console.warn('⚠️  Warning clearing jobs:', jobsError.message);
      }

      // Clear entities with seed-data source
      const { error: entitiesError } = await this.supabase
        .from('eip_entities')
        .delete()
        .like('source_url', '%seed-data%');

      if (entitiesError) {
        console.warn('⚠️  Warning clearing entities:', entitiesError.message);
      }

      console.log('✅ Seed data cleared');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to clear seed data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

async function main() {
  const seeder = new DatabaseSeeder();
  
  try {
    console.log('🚀 Starting EIP database seeding...');
    
    await seeder.clearSeedData();
    const result = await seeder.seedDatabase();
    
    if (result.success) {
      console.log('🎉 Database seeding completed successfully!');
      console.log('\n💡 You can now test the orchestrator with this data!');
      console.log('   - Run: npm run orchestrator:dev');
      console.log('   - Visit: http://localhost:3002/review');
    } else {
      console.error('❌ Database seeding failed:', result.error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  }
}


if (require.main === module) {
  main();
}
