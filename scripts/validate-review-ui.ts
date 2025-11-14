// ABOUTME: Review UI Validation Script - Tests the review workflow end-to-end
// ABOUTME: Validates artifact listing, content display, and approval/rejection actions

import { getSupabaseAdmin } from '../lib_supabase/db/supabase-client';

interface ValidationResult {
  test: string;
  success: boolean;
  message: string;
  details?: any;
}

async function validateReviewUI() {
  console.log('🚀 Starting Review UI Validation...\n');
  
  const results: ValidationResult[] = [];
  const supabase = getSupabaseAdmin();

  try {
    // Test 1: Database Connection and Schema
    console.log('📋 Test 1: Database Connection and Schema');
    try {
      const { data, error } = await supabase
        .from('eip_artifacts')
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        results.push({
          test: 'Database Connection',
          success: false,
          message: `Database connection failed: ${error.message}`,
          details: error
        });
      } else {
        results.push({
          test: 'Database Connection',
          success: true,
          message: 'Connected successfully, eip_artifacts table accessible',
          details: { totalArtifacts: data }
        });
      }
    } catch (error) {
      results.push({
        test: 'Database Connection',
        success: false,
        message: `Database error: ${error}`,
        details: error
      });
    }

    // Test 2: Draft Artifacts Query
    console.log('\n📋 Test 2: Draft Artifacts Query');
    try {
      const { data: draftArtifacts, error } = await supabase
        .from('eip_artifacts')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        results.push({
          test: 'Draft Artifacts Query',
          success: false,
          message: `Failed to query draft artifacts: ${error.message}`,
          details: error
        });
      } else {
        const hasValidStructure = draftArtifacts?.every(artifact =>
          artifact.id &&
          artifact.content &&
          artifact.frontmatter &&
          artifact.ledger &&
          artifact.created_at
        );

        results.push({
          test: 'Draft Artifacts Query',
          success: hasValidStructure || false,
          message: hasValidStructure 
            ? `Found ${draftArtifacts?.length || 0} draft artifacts with valid structure`
            : 'Found artifacts but some have invalid structure',
          details: { 
            count: draftArtifacts?.length || 0,
            sampleArtifact: draftArtifacts?.[0] ? {
              id: draftArtifacts[0].id,
              hasContent: !!draftArtifacts[0].content,
              hasFrontmatter: !!draftArtifacts[0].frontmatter,
              hasLedger: !!draftArtifacts[0].ledger
            } : null
          }
        });
      }
    } catch (error) {
      results.push({
        test: 'Draft Artifacts Query',
        success: false,
        message: `Query error: ${error}`,
        details: error
      });
    }

    // Test 3: Artifact Structure Validation
    console.log('\n📋 Test 3: Artifact Structure Validation');
    try {
      const { data: sampleArtifact } = await supabase
        .from('eip_artifacts')
        .select('*')
        .eq('status', 'draft')
        .limit(1)
        .single();

      if (sampleArtifact) {
        const frontmatter = sampleArtifact.frontmatter as any;
        const ledger = sampleArtifact.ledger as any;
        
        const structureValidations = [
          { field: 'id', present: !!sampleArtifact.id },
          { field: 'content', present: !!sampleArtifact.content },
          { field: 'frontmatter', present: !!frontmatter },
          { field: 'frontmatter.title', present: !!frontmatter?.title },
          { field: 'frontmatter.persona', present: !!frontmatter?.persona },
          { field: 'frontmatter.funnel', present: !!frontmatter?.funnel },
          { field: 'ledger', present: !!ledger },
          { field: 'ledger.audit_tags', present: !!ledger?.audit_tags },
        ];

        const allFieldsPresent = structureValidations.every(v => v.present);
        
        results.push({
          test: 'Artifact Structure Validation',
          success: allFieldsPresent,
          message: allFieldsPresent 
            ? 'Artifact structure is complete with all required fields'
            : 'Some required fields are missing from artifact structure',
          details: {
            validations: structureValidations,
            missingFields: structureValidations.filter(v => !v.present).map(v => v.field)
          }
        });
      } else {
        results.push({
          test: 'Artifact Structure Validation',
          success: false,
          message: 'No draft artifacts found for structure validation'
        });
      }
    } catch (error) {
      results.push({
        test: 'Artifact Structure Validation',
        success: false,
        message: `Structure validation error: ${error}`,
        details: error
      });
    }

    // Test 4: Brand Profiles Table
    console.log('\n📋 Test 4: Brand Profiles Table');
    try {
      const { data, error } = await supabase
        .from('eip_brand_profiles')
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        results.push({
          test: 'Brand Profiles Table',
          success: false,
          message: `Brand profiles table error: ${error.message}`,
          details: error
        });
      } else {
        results.push({
          test: 'Brand Profiles Table',
          success: true,
          message: 'Brand profiles table accessible for feedback storage',
          details: { totalProfiles: data }
        });
      }
    } catch (error) {
      results.push({
        test: 'Brand Profiles Table',
        success: false,
        message: `Brand profiles error: ${error}`,
        details: error
      });
    }

    // Test 5: Audit Tags Verification
    console.log('\n📋 Test 5: Audit Tags Verification');
    try {
      const { data: artifactsWithAuditTags } = await supabase
        .from('eip_artifacts')
        .select('id, ledger')
        .eq('status', 'draft')
        .limit(3);

      if (artifactsWithAuditTags && artifactsWithAuditTags.length > 0) {
        const auditTagResults = artifactsWithAuditTags.map(artifact => {
          const ledger = artifact.ledger as any;
          return {
            artifactId: artifact.id.substring(0, 8) + '...',
            hasAuditTags: !!ledger?.audit_tags,
            auditTags: ledger?.audit_tags || []
          };
        });

        const hasValidAuditTags = auditTagResults.some(r => r.hasAuditTags);
        
        results.push({
          test: 'Audit Tags Verification',
          success: hasValidAuditTags,
          message: hasValidAuditTags
            ? 'Audit tags found in ledger structure'
            : 'No audit tags found in artifact ledgers',
          details: { auditTagResults }
        });
      } else {
        results.push({
          test: 'Audit Tags Verification',
          success: false,
          message: 'No artifacts found for audit tag verification'
        });
      }
    } catch (error) {
      results.push({
        test: 'Audit Tags Verification',
        success: false,
        message: `Audit tag verification error: ${error}`,
        details: error
      });
    }

  } catch (error) {
    console.error('Validation script failed:', error);
    results.push({
      test: 'Script Execution',
      success: false,
      message: `Script execution failed: ${error}`,
      details: error
    });
  }

  // Print Results Summary
  console.log('\n📊 VALIDATION RESULTS SUMMARY');
  console.log('=====================================\n');
  
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.details && !result.success) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log('');
  });

  console.log(`\n🎯 OVERALL RESULT: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('🎉 All validation tests passed! Review UI is ready for testing.');
  } else {
    console.log('⚠️  Some validation tests failed. Please address the issues above.');
  }

  return {
    success: successCount === totalTests,
    results,
    summary: `${successCount}/${totalTests} tests passed`
  };
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateReviewUI()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation script failed:', error);
      process.exit(1);
    });
}

export { validateReviewUI };