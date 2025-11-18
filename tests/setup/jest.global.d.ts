// ABOUTME: Jest global type definitions for EIP test infrastructure
// ABOUTME: Provides global test utilities and environment setup

declare global {
  // Global test utilities
  namespace NodeJS {
    interface Global {
      getStorageMocks?: () => {
        localStorageMock: any;
        sessionStorageMock: any;
      };
    }
  }
}

// Export to ensure module is treated as a module
export {};
