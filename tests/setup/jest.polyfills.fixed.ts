// ABOUTME: Simplified Node.js polyfills for Jest test environment
// ABOUTME: Must run before any modules that require these globals

// setImmediate polyfill for jsdom environment
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (callback: (...args: any[]) => void, ...args: any[]) => {
    return setTimeout(() => callback(...args), 0);
  };
}

// clearImmediate polyfill
if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id: any) => clearTimeout(id);
}

// Ensure process exists (needed for many modules)
if (typeof process === 'undefined') {
  (global as any).process = {
    env: {},
    version: 'v20.0.0',
    platform: 'browser',
  };
}

// Ensure process.stdout and process.stderr exist (Winston needs these)
if (typeof process.stdout === 'undefined') {
  process.stdout = {
    write: () => {},
    isTTY: false
  } as any;
}

if (typeof process.stderr === 'undefined') {
  process.stderr = {
    write: () => {},
    isTTY: false
  } as any;
}

// Essential performance polyfill
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    timeOrigin: Date.now(),
    timing: {
      navigationStart: Date.now(),
      loadEventEnd: Date.now() + 100
    }
  } as any;
}

// Mock crypto.getRandomValues for UUID generation
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  } as any;
}

// Buffer polyfill for queue operations
if (typeof global.Buffer === 'undefined') {
  (global as any).Buffer = require('buffer').Buffer;
}

export {};
