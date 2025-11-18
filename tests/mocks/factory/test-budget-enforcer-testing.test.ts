import { mockFactory } from './mock-factory';

describe('createBudgetEnforcerForTesting method', () => {
  it('should create a testing budget enforcer with controlled private access', () => {
    const result = mockFactory.createBudgetEnforcerForTesting({
      tier: 'MEDIUM',
      initialTokens: 500
    });

    expect(result.success).toBe(true);
    expect(result.mock).toBeDefined();
    
    const mock = result.mock;
    
    // Standard methods should be jest mocks
    expect(jest.isMockFunction(mock.startStage)).toBe(true);
    expect(jest.isMockFunction(mock.addTokens)).toBe(true);
    expect(jest.isMockFunction(mock.checkStageBudget)).toBe(true);
    expect(jest.isMockFunction(mock.checkOverallBudget)).toBe(true);
    expect(jest.isMockFunction(mock.canProceed)).toBe(true);
    
    // Testing-specific controlled access methods
    expect(typeof mock._getPrivateTracker).toBe('function');
    expect(typeof mock._setPrivateTracker).toBe('function');
    expect(typeof mock._getBreaches).toBe('function');
    expect(typeof mock._addBreach).toBe('function');
    expect(typeof mock._setActiveStages).toBe('function');
    expect(typeof mock._getActiveStages).toBe('function');
    
    // Test private tracker access
    const privateTracker = mock._getPrivateTracker();
    expect(privateTracker).toBeDefined();
    expect(typeof privateTracker.start_time).toBe('number');
    expect(privateTracker.tokens_used).toBe(500);
    expect(privateTracker.breaches).toEqual([]);
    expect(privateTracker.active_stages).toBeInstanceOf(Set);
    
    // Test controlled mutation
    mock._addBreach({ type: 'token', stage: 'test' });
    expect(mock._getBreaches()).toHaveLength(1);
    
    const newStages = new Set(['retrieval', 'generator']);
    mock._setActiveStages(newStages);
    expect(mock._getActiveStages()).toBe(newStages);
  });

  it('should use default budget limits when not specified', () => {
    const result = mockFactory.createBudgetEnforcerForTesting({
      tier: 'HEAVY'
    });

    expect(result.success).toBe(true);
    const mock = result.mock;
    
    expect(mock.tier).toBe('HEAVY');
    expect(mock.tokenLimit).toBe(4000);
    expect(mock.timeLimit).toBe(90000);
    expect(mock.costLimit).toBe(0.05);
    
    const tracker = mock._getPrivateTracker();
    expect(tracker.tokens_used).toBe(0); // default initialTokens
  });
});
