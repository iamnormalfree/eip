// ABOUTME: Essential Node.js polyfills for Jest test environment
// ABOUTME: Must run before any modules that require these globals

// Polyfill setImmediate for Winston logger compatibility
// This is required because Winston uses setInternal in its Console transport
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn: (...args: any[]) => void, ...args: any[]) => {
    if (args.length > 0) {
      return setTimeout(() => fn(...args), 0, ...args);
    }
    return setTimeout(fn, 0);
  };
}

// Polyfill clearImmediate for completeness
if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id: any) => clearTimeout(id);
}

// Ensure process.stdout and process.stderr exist (Winston needs these)
if (typeof process.stdout === 'undefined') {
  process.stdout = {
    write: () => {},
  } as any;
}

if (typeof process.stderr === 'undefined') {
  process.stderr = {
    write: () => {},
  } as any;
}

// Mock Date.now for consistent test timestamps if needed
let mockNow = Date.now();
if (typeof global.__EIP_MOCK_DATE_NOW__ !== 'undefined') {
  global.Date.now = () => mockNow;
}

export {};