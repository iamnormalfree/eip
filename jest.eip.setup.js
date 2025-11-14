// ABOUTME: EIP-specific test setup for orchestrator and smoke testing
// ABOUTME: Provides comprehensive mocks for EIP Steel Thread testing

// Mock BullMQ for orchestrator testing
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
    getJob: jest.fn().mockResolvedValue({ 
      id: 'test-job-id',
      finished: jest.fn().mockResolvedValue({ result: 'success' }),
      failed: jest.fn().mockResolvedValue(false)
    }),
    pause: jest.fn(),
    resume: jest.fn(),
    close: jest.fn()
  })),
  Worker: jest.fn().mockImplementation(() => ({
    run: jest.fn(),
    close: jest.fn()
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    close: jest.fn()
  }))
}));

// Mock AI SDK for generator testing
jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn().mockReturnValue({
    generateText: jest.fn().mockResolvedValue({
      text: 'Mock AI response for testing',
      usage: { totalTokens: 150 }
    })
  })
}));

jest.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: jest.fn().mockReturnValue({
    generateText: jest.fn().mockResolvedValue({
      text: 'Mock Anthropic response for testing',
      usage: { totalTokens: 200 }
    })
  })
}));

// Mock Supabase client for orchestrator testing
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue(() => ({
    from: jest.fn().mockReturnValue(() => ({
      select: jest.fn().mockReturnValue(() => ({
        data: [],
        error: null
      })),
      insert: jest.fn().mockReturnValue(() => ({
        data: { id: 'test-id' },
        error: null
      })),
      update: jest.fn().mockReturnValue(() => ({
        data: { id: 'test-id', updated: true },
        error: null
      })),
      delete: jest.fn().mockReturnValue(() => ({
        error: null
      }))
    }))
  }))
}));

// Mock Redis for BullMQ testing
jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    flushall: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn()
  }))
}));

// Mock Winston logger for orchestrator testing
jest.mock('winston', () => ({
  createLogger: jest.fn().mockReturnValue(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    errors: jest.fn(),
    json: jest.fn()
  },
  transports: {
    Console: jest.fn()
  }
}));

// Global test utilities for EIP testing
global.eipTestUtils = {
  // Create mock retrieval result
  createMockRetrievalResult: (overrides = {}) => ({
    candidates: [
      {
        id: 'test_doc_001',
        content: 'Test content for BM25 retrieval validation',
        source: 'test_source',
        score: 0.85,
        metadata: {
          type: 'test',
          domain: 'testing',
          retrieval_method: 'bm25'
        }
      }
    ],
    graph_edges: [],
    flags: {
      graph_sparse: false,
      bm25_used: true,
      vector_used: false,
      cache_hit: false,
      retrieval_time_ms: 150
    },
    query_analysis: {
      terms: ['test', 'content'],
      complexity: 'low',
      domain: 'testing'
    },
    ...overrides
  }),

  // Create mock audit result
  createMockAuditResult: (overrides = {}) => ({
    tags: [
      {
        tag: 'NO_MECHANISM',
        severity: 'error',
        rationale: 'Content lacks mechanism explanation',
        suggestion: 'Add mechanism section',
        confidence: 0.8,
        auto_fixable: false
      }
    ],
    overall_score: 75,
    content_analysis: {
      word_count: 150,
      section_count: 2,
      has_mechanism: false,
      has_examples: false,
      has_structure: true
    },
    pattern_analysis: {
      completion_drive: 0.3,
      question_suppression: 0.2,
      domain_mixing: 0.1
    },
    ...overrides
  }),

  // Create mock budget tracker
  createMockBudgetTracker: (tier = 'MEDIUM') => ({
    start_time: Date.now(),
    tokens_used: 1200,
    stage_tokens: {
      planner: tier === 'MEDIUM' ? 500 : 0,
      generator: 700,
      auditor: 0,
      repairer: 0
    },
    stage_times: {
      planner: 5000,
      generator: 15000,
      auditor: 0,
      repairer: 0
    },
    breaches: []
  }),

  // Performance measurement utilities
  measurePerformance: async (fn) => {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  },

  // Budget validation utilities
  validateBudgetUsage: (tracker, budget) => {
    const violations = [];
    
    if (tracker.tokens_used > budget.tokens) {
      violations.push(`Token budget exceeded: ${tracker.tokens_used} > ${budget.tokens}`);
    }
    
    const elapsed = (Date.now() - tracker.start_time) / 1000;
    if (elapsed > budget.wallclock_s) {
      violations.push(`Time budget exceeded: ${elapsed}s > ${budget.wallclock_s}s`);
    }
    
    return violations;
  }
};

// Console filtering for EIP tests
const originalConsole = global.console;

beforeEach(() => {
  // Filter console noise for smoke tests
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
});

afterEach(() => {
  global.console = originalConsole;
});

// Set test environment variables
process.env.EIP_TEST_MODE = 'steel_thread';
process.env.EIP_MOCK_SERVICES = 'true';
process.env.NODE_ENV = 'test';
