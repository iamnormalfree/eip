// ABOUTME: Integration tests for hooks with compatibility utilities

import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { getWithAliases, setCanonical, isLegacyCompat } from '../utils/compat';

// Mock React hooks for testing
const createMockHook = () => {
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };
  
  const useStorage = (key: string, storageType: 'localStorage' | 'sessionStorage' = 'localStorage') => {
    const [value, setValue] = React.useState(null);
    
    React.useEffect(() => {
      const storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage;
      const retrievedValue = getWithAliases([key, `legacy_${key}`], storageType);
      setValue(retrievedValue);
    }, [key, storageType]);
    
    const updateValue = (newValue: any) => {
      setCanonical(key, newValue, storageType);
      setValue(newValue);
    };
    
    return [value, updateValue] as const;
  };
  
  return { useStorage, mockStorage };
};

describe('hooks compatibility integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EIP_LEGACY_COMPAT = 'true';
  });

  describe('useStorage with compatibility', () => {
    it('should migrate legacy data to new keys', () => {
      // Mock legacy data exists
      (global.localStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'user_preferences') return null;
        if (key === 'legacy_user_preferences') return JSON.stringify({ theme: 'dark' });
        return null;
      });

      const { useStorage } = createMockHook();
      const { result } = renderHook(() => useStorage('user_preferences'));

      // Should read from legacy key
      expect(result.current[0]).toEqual({ theme: 'dark' });

      // Write new data
      act(() => {
        result.current[1]({ theme: 'light', language: 'en' });
      });

      // Should write to canonical key
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'user_preferences',
        JSON.stringify({ theme: 'light', language: 'en' })
      );
    });

    it('should prefer canonical key when both exist', () => {
      (global.localStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'user_settings') return JSON.stringify({ notifications: true });
        if (key === 'legacy_user_settings') return JSON.stringify({ notifications: false });
        return null;
      });

      const { useStorage } = createMockHook();
      const { result } = renderHook(() => useStorage('user_settings'));

      // Should prefer canonical key
      expect(result.current[0]).toEqual({ notifications: true });
    });

    it('should respect feature flag for legacy compatibility', () => {
      process.env.EIP_LEGACY_COMPAT = 'false';
      
      (global.localStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'app_config') return JSON.stringify({ version: '2.0' });
        if (key === 'legacy_app_config') return JSON.stringify({ version: '1.0' });
        return null;
      });

      const { useStorage } = createMockHook();
      const { result } = renderHook(() => useStorage('app_config'));

      // Should only read canonical key when feature disabled
      expect(result.current[0]).toEqual({ version: '2.0' });
      
      // Should not have tried to read legacy key
      expect(global.localStorage.getItem).toHaveBeenCalledWith('app_config');
      expect(global.localStorage.getItem).not.toHaveBeenCalledWith('legacy_app_config');
    });
  });

  describe('performance considerations', () => {
    it('should cache storage access during render', () => {
      let callCount = 0;
      (global.localStorage.getItem as jest.Mock).mockImplementation(() => {
        callCount++;
        return JSON.stringify({ cached: true });
      });

      const { useStorage } = createMockHook();
      
      // Multiple renders should not cause multiple storage calls
      const { rerender } = renderHook(() => useStorage('cached_key'));
      
      // Initial mount should call storage
      expect(callCount).toBeGreaterThan(0);
      
      const initialCallCount = callCount;
      
      rerender();
      
      // Rerender should not make additional storage calls
      expect(callCount).toBe(initialCallCount);
    });
  });

  describe('error handling in hooks', () => {
    it('should handle storage quota exceeded gracefully', () => {
      (global.localStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { useStorage } = createMockHook();
      const { result } = renderHook(() => useStorage('error_key'));

      expect(() => {
        act(() => {
          result.current[1]({ large: 'data' });
        });
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(
        'Failed to set value for key "error_key":',
        expect.any(Error)
      );
    });

    it('should handle corrupted data gracefully', () => {
      (global.localStorage.getItem as jest.Mock).mockReturnValue('invalid json{');

      const { useStorage } = createMockHook();
      const { result } = renderHook(() => useStorage('corrupted_key'));

      // Should handle corrupted data
      expect(result.current[0]).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });
  });
});

// React mock for testing
const React = {
  useState: jest.fn((initial) => [initial, jest.fn()]),
  useEffect: jest.fn((fn) => fn()),
  createContext: jest.fn(() => ({ Provider: jest.fn(), Consumer: jest.fn() })),
  useContext: jest.fn(() => ({})),
  useRef: jest.fn(() => ({ current: null })),
  useCallback: jest.fn((fn) => fn),
  useMemo: jest.fn((fn) => fn()),
  Component: class Component {},
  PureComponent: class PureComponent {},
  Fragment: 'Fragment',
};

// Mock @testing-library/react
jest.mock('@testing-library/react', () => ({
  renderHook: ({ initialProps }) => {
    const hook = initialProps();
    const result = { current: hook };
    
    // Simulate hook behavior
    if (typeof hook === 'function') {
      const hookResult = hook();
      result.current = hookResult;
    }
    
    const rerender = () => {
      const newHook = initialProps();
      result.current = typeof newHook === 'function' ? newHook() : newHook;
    };
    
    return { result, rerender };
  },
}));

// Mock act from @testing-library/react
jest.mock('@testing-library/react', () => ({
  ...jest.requireActual('@testing-library/react'),
  act: (fn) => fn(),
}));

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWithMatchingKey(pattern: RegExp): R;
    }
  }
}
