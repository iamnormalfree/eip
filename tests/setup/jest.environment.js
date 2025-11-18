const NodeEnvironment = require('jest-environment-node');

// Custom environment that chooses between node and jsdom based on test file
class FlexibleEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
    
    // Check if this is a browser/DOM test and use jsdom
    if (config.testPath.includes('useMediaQuery.test.ts') || 
        config.testPath.includes('compatibility-integration.test.ts') ||
        config.testPath.includes('lib_supabase/hooks/__tests__/')) {
      this.jsdomAvailable = true;
    }
  }

  async setup() {
    await super.setup();
    
    if (this.jsdomAvailable) {
      try {
        const jsdom = require('jsdom');
        const dom = new jsdom.JSDOM('<!DOCTYPE html><html><body></body></html>');
        global.window = dom.window;
        global.document = dom.window.document;
        global.navigator = dom.window.navigator;
        global.location = dom.window.location;
        
        // Mock localStorage and sessionStorage
        const mockStorage = {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          clear: jest.fn(),
        };
        
        global.localStorage = mockStorage;
        global.sessionStorage = mockStorage;
        
      } catch (error) {
        console.warn('jsdom not available, running browser tests with limited DOM support:', error.message);
      }
    }
  }

  async teardown() {
    if (this.jsdomAvailable) {
      delete global.window;
      delete global.document;
      delete global.navigator;
      delete global.location;
    }
    await super.teardown();
  }
}

module.exports = FlexibleEnvironment;
