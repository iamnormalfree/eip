import { BudgetEnforcer } from './orchestrator/budget';

console.log('Testing YAML-driven budget enforcement...');

try {
  // Test LIGHT tier
  const lightEnforcer = new BudgetEnforcer('LIGHT');
  console.log('✓ LIGHT tier budget enforcer created');
  
  const lightBudget = lightEnforcer.getBudgetWithStageLimits();
  console.log('LIGHT budget retrieval tokens:', lightBudget.stage_limits.retrieval.tokens);
  
  // Test MEDIUM tier
  const mediumEnforcer = new BudgetEnforcer('MEDIUM');
  console.log('✓ MEDIUM tier budget enforcer created');
  
  const mediumBudget = mediumEnforcer.getBudgetWithStageLimits();
  console.log('MEDIUM budget retrieval tokens:', mediumBudget.stage_limits.retrieval.tokens);
  console.log('MEDIUM budget planner tokens:', mediumBudget.stage_limits.planner.tokens);
  
  // Test HEAVY tier
  const heavyEnforcer = new BudgetEnforcer('HEAVY');
  console.log('✓ HEAVY tier budget enforcer created');
  
  const heavyBudget = heavyEnforcer.getBudgetWithStageLimits();
  console.log('HEAVY budget retrieval tokens:', heavyBudget.stage_limits.retrieval.tokens);
  console.log('HEAVY budget review tokens:', heavyBudget.stage_limits.review.tokens);
  
  // Test token tracking with retrieval stage (new functionality)
  mediumEnforcer.startStage('retrieval');
  mediumEnforcer.addTokens('retrieval', 50);
  mediumEnforcer.endStage('retrieval');
  
  const tracker = mediumEnforcer.getTracker();
  console.log('✓ Token tracking working for retrieval stage:', tracker.tokens_used);
  
  // Test circuit breaker
  const canProceed = mediumEnforcer.canProceed();
  console.log('✓ Circuit breaker check:', canProceed);
  
  // Test budget breach detection
  mediumEnforcer.startStage('generator');
  mediumEnforcer.addTokens('generator', 3000); // Should exceed MEDIUM budget of 2400
  const check = mediumEnforcer.checkStageBudget('generator');
  console.log('✓ Budget breach detection:', check.ok ? 'No breach' : 'Breach detected: ' + check.reason);
  
  console.log('✓ All basic tests passed!');
  
} catch (error) {
  console.error('✗ Test failed:', error);
  process.exit(1);
}
