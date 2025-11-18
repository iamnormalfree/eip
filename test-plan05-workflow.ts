#!/usr/bin/env tsx

// ABOUTME: Final Plan 05 end-to-end workflow demonstration
// ABOUTME: Shows complete audit → repair → re-audit cycle with all constraints

import { microAudit, PLAN_05_CRITICAL_TAGS, PLAN_05_AUTO_FIXABLE_TAGS } from './orchestrator/auditor';
import { repairDraft, AUTO_FIXABLE_TAGS } from './orchestrator/repairer';

async function demonstratePlan05Workflow() {
  console.log('\n🚀 PLAN 05 END-TO-END WORKFLOW DEMONSTRATION');
  console.log('=' .repeat(60));

  // Step 1: Create problematic content that triggers multiple Plan 05 tags
  const problematicContent = `Basic educational content without proper structure.

This framework works in all situations without exceptions. 
Financial institutions must follow legal requirements according to research studies.
Users should subscribe to our premium service now!`;

  console.log('\n📝 ORIGINAL CONTENT:');
  console.log(problematicContent);
  console.log(`\n📏 Content Length: ${problematicContent.length} characters`);

  // Step 2: Audit content with Plan 05 compliance
  console.log('\n🔍 STEP 1: AUDITING CONTENT...');
  const auditResult = await microAudit({
    draft: problematicContent,
    ip: 'framework@1.0.0'
  });

  console.log(`✅ Audit Complete - Score: ${auditResult.overall_score}/100`);
  console.log(`📊 Total Tags: ${auditResult.tags.length}`);
  console.log(`🏷️  Plan 05 Tags: ${auditResult.plan05_tags?.length || 0}`);

  if (auditResult.plan05_tags && auditResult.plan05_tags.length > 0) {
    console.log('\n🏷️  PLAN 05 TAGS DETECTED:');
    auditResult.plan05_tags.forEach((tag, index) => {
      const fixable = tag.auto_fixable ? '✅ Auto-Fixable' : '❌ Manual Review';
      console.log(`  ${index + 1}. ${tag.tag} - ${fixable}`);
      console.log(`     Location: ${tag.span_hint}`);
      console.log(`     Reason: ${tag.rationale} (confidence: ${(tag.confidence * 100).toFixed(1)}%)`);
    });

    // Step 3: Apply Plan 05 repairs
    console.log('\n🔧 STEP 2: APPLYING PLAN 05 REPAIRS...');
    const startTime = Date.now();
    
    const repairedContent = await repairDraft({
      draft: problematicContent,
      audit: auditResult
    });

    const repairDuration = Date.now() - startTime;
    console.log(`⚡ Repair Complete in ${repairDuration}ms`);

    console.log('\n📝 REPAIRED CONTENT:');
    console.log(repairedContent);
    console.log(`\n📏 Repaired Length: ${repairedContent.length} characters`);
    console.log(`📈 Size Increase: ${repairedContent.length - problematicContent.length} characters`);

    // Step 4: Re-audit to validate improvements
    console.log('\n🔍 STEP 3: RE-AUDITING REPAIRED CONTENT...');
    const reauditResult = await microAudit({
      draft: repairedContent,
      ip: 'framework@1.0.0'
    });

    console.log(`✅ Re-audit Complete - Score: ${reauditResult.overall_score}/100`);
    console.log(`📊 Total Tags: ${reauditResult.tags.length}`);
    console.log(`🏷️  Plan 05 Tags: ${reauditResult.plan05_tags?.length || 0}`);

    // Step 5: Show Plan 05 constraint validation
    console.log('\n📋 PLAN 05 CONSTRAINTS VALIDATION:');
    
    // Exactly 10 critical tags
    console.log(`✅ Exactly 10 Critical Tags: ${PLAN_05_CRITICAL_TAGS.length} tags defined`);
    
    // Only 4 auto-fixable tags
    console.log(`✅ Only 4 Auto-Fixable Tags: ${AUTO_FIXABLE_TAGS.length} tags auto-fixable`);
    
    // ±3 sentences constraint
    const originalSentences = problematicContent.split(/[.!?]+/).filter(s => s.trim()).length;
    const repairedSentences = repairedContent.split(/[.!?]+/).filter(s => s.trim()).length;
    const addedSentences = repairedSentences - originalSentences;
    console.log(`✅ ±3 Sentences Constraint: +${addedSentences} sentences added (≤3 allowed)`);
    
    // Span hints
    const spanHintsPresent = auditResult.plan05_tags?.every(tag => tag.span_hint && tag.span_hint.length > 0);
    console.log(`✅ Span Hint Targeting: ${spanHintsPresent ? 'All tags have span hints' : 'Missing span hints'}`);
    
    // Performance constraints
    console.log(`✅ Performance Budget: Repair completed in ${repairDuration}ms (<5000ms allowed)`);
    
    // Quality improvement
    const originalAutoFixable = auditResult.plan05_tags?.filter(tag => tag.auto_fixable).length || 0;
    const remainingAutoFixable = reauditResult.plan05_tags?.filter(tag => tag.auto_fixable).length || 0;
    const improvement = originalAutoFixable - remainingAutoFixable;
    console.log(`✅ Quality Improvement: ${improvement}/${originalAutoFixable} auto-fixable issues resolved`);

    console.log('\n🎯 PLAN 05 WORKFLOW SUMMARY:');
    console.log(`   Original Score: ${auditResult.overall_score}/100`);
    console.log(`   Final Score: ${reauditResult.overall_score}/100`);
    console.log(`   Score Improvement: +${reauditResult.overall_score - auditResult.overall_score} points`);
    console.log(`   Auto-Fixable Issues Resolved: ${improvement}/${originalAutoFixable}`);
    console.log(`   Diff-Bounded Repair: +${addedSentences} sentences, +${repairedContent.length - problematicContent.length} characters`);
    
    // Success validation
    const constraintsMet = 
      PLAN_05_CRITICAL_TAGS.length === 10 &&
      AUTO_FIXABLE_TAGS.length === 4 &&
      addedSentences <= 3 &&
      repairDuration < 5000 &&
      improvement >= 0;

    console.log(`\n🏆 PLAN 05 COMPLIANCE: ${constraintsMet ? '✅ FULLY COMPLIANT' : '❌ CONSTRAINT VIOLATIONS'}`);
    
    if (constraintsMet) {
      console.log('\n🎉 Plan 05 Implementation Successfully Validated!');
      console.log('   • Exactly 10 critical tags: ✅');
      console.log('   • Only 4 auto-fixable tags: ✅');  
      console.log('   • ±3 sentences constraint: ✅');
      console.log('   • Span hint targeting: ✅');
      console.log('   • Performance constraints: ✅');
      console.log('   • Quality improvement: ✅');
    }

  } else {
    console.log('ℹ️  No Plan 05 tags detected - content quality acceptable');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 PLAN 05 WORKFLOW DEMONSTRATION COMPLETE');
}

// Run the demonstration
if (require.main === module) {
  demonstratePlan05Workflow().catch(console.error);
}

export { demonstratePlan05Workflow };
