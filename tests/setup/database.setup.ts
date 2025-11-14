// ABOUTME: Database-specific test setup for EIP test infrastructure

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        single: jest.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signIn: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null }))
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: null, error: null })),
        download: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    },
    rpc: jest.fn(() => Promise.resolve({ data: [], error: null }))
  }))
}));

// Mock environment variables for database testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
