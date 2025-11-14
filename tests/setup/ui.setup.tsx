// ABOUTME: UI-specific test setup for EIP test infrastructure
// ABOUTME: Configures React Testing Library and UI component testing

import React from 'react';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    asPath: '/',
    route: '/'
  })
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
}));

// Mock Supabase auth for UI components
jest.mock('@supabase/auth-helpers-react', () => ({
  useUser: () => ({ user: null, loading: false }),
  Auth: ({ children }: any) => <div>{children}</div>
}));

// Mock environment variables for UI testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Global UI test utilities
global.uiTestUtils = {
  // Helper to wait for async operations
  waitForAsync: (ms: number = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to mock form data
  createMockFormData: (data: Record<string, any>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    return formData;
  }
};

// Mock IntersectionObserver for UI components
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserver for UI components
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
