// ABOUTME: Orchestrator-specific test setup for EIP test infrastructure - DISABLED
// ABOUTME: Original setup used blanket mocks that prevented real production code testing
// DISABLED: Tests should exercise real production code, not hand-written mocks

// Original mock setup - disabled to allow real production code testing
/*
// Mock orchestrator dependencies
jest.mock('../../orchestrator/budget', () => ({
  BudgetEnforcer: jest.fn().mockImplementation(() => ({
    startStage: jest.fn(),
    endStage: jest.fn(),
    addTokens: jest.fn(),
    checkStageBudget: jest.fn(() => ({ ok: true, reason: null })),
    validateAllBudgets: jest.fn(() => ({ ok: true, violations: [] })),
    getTracker: jest.fn(() => ({
      tokens_used: 0,
      stage_tokens: {},
      active_stages: [],
      breaches: [],
      start_time: Date.now()
    })),
    getBudget: jest.fn(() => ({
      tokens: 2400,
      wallclock_s: 45,
      stage_limits: {
        planner: { tokens: 400, time_s: 10 },
        generator: { tokens: 1400, time_s: 25 },
        auditor: { tokens: 300, time_s: 5 },
        repairer: { tokens: 200, time_s: 3 },
        publisher: { tokens: 100, time_s: 2 }
      }
    })),
    reset: jest.fn()
  }))
}));

// Mock retrieval system
jest.mock('../../orchestrator/retrieval', () => ({
  parallelRetrieve: jest.fn().mockResolvedValue({
    candidates: [
      {
        id: 'test-doc-1',
        content: 'Test content for retrieval',
        source: 'Test Source',
        score: 0.95,
        metadata: { domain: 'test-domain.com' }
      }
    ],
    flags: {
      has_mas_source: false,
      has_edu_source: false,
      query_complexity: 'simple'
    },
    query_analysis: {
      original_query: 'test query',
      normalized_query: 'test query',
      intent_detected: 'information_seeking'
    }
  })
}));

// Mock auditor system
jest.mock('../../orchestrator/auditor', () => ({
  microAudit: jest.fn().mockResolvedValue({
    overall_score: 85,
    tags: [],
    content_analysis: {
      structure_score: 80,
      clarity_score: 85,
      completeness_score: 85
    },
    pattern_analysis: {
      has_mechanism: true,
      has_examples: true,
      has_overview: true
    }
  }),
  getTagDefinitions: jest.fn().mockResolvedValue([]),
  calculateRepairPriority: jest.fn().mockResolvedValue({
    priority: 'low',
    requires_repair: false
  })
}));

*/

// Set up test environment without mocking production modules
beforeEach(() => {
  process.env.NODE_ENV = 'test';
});

// Mock only external dependencies, not our own modules
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'test-job' }),
    process: jest.fn(),
    close: jest.fn(),
    getJobCounts: jest.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 0, failed: 0 })
  })),
  Worker: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
    on: jest.fn()
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
    on: jest.fn()
  }))
}));
