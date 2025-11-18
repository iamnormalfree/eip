// ABOUTME: Integration tests for hooks with compatibility utilities

import { renderHook, act } from '@testing-library/react';
import * as React from 'react';
import { getWithAliases, setCanonical, isLegacyCompat } from '../../utils/compat';

describe('hooks compatibility integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EIP_LEGACY_COMPAT = 'true';
    
    // Mock localStorage and sessionStorage
    global.localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    } as any;
    
    global.sessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    } as any;
  });

  describe('useStorage with compatibility', () => {
    it('should migrate legacy data to new keys', () => {
      // Mock legacy data exists
      (global.localStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'user_preferences') return null;
        if (key === 'legacy_user_preferences') return JSON.stringify({ theme: 'dark' });
        return null;
      });

      // Simple hook for testing
      const useStorage = (key: string, storageType: 'localStorage' | 'sessionStorage' = 'localStorage') => {
        const [value, setValue] = React.useState<any>(null);
        
        React.useEffect(() => {
          const storage = storageType === 'localStorage' ? global.localStorage : global.sessionStorage;
          const retrievedValue = getWithAliases([key, `legacy_${key}`], storageType);
          setValue(retrievedValue);
        }, [key, storageType]);
        
        const updateValue = (newValue: any) => {
          setCanonical(key, newValue, storageType);
          setValue(newValue);
        };
        
        return [value, updateValue] as const;
      };

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

      const useStorage = (key: string, storageType: 'localStorage' | 'sessionStorage' = 'localStorage') => {
        const [value, setValue] = React.useState<any>(null);
        
        React.useEffect(() => {
          const storage = storageType === 'localStorage' ? global.localStorage : global.sessionStorage;
          const retrievedValue = getWithAliases([key, `legacy_${key}`], storageType);
          setValue(retrievedValue);
        }, [key]);
        
        return [value, jest.fn()] as const;
      };

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

      const useStorage = (key: string, storageType: 'localStorage' | 'sessionStorage' = 'localStorage') => {
        const [value, setValue] = React.useState<any>(null);
        
        React.useEffect(() => {
          const storage = storageType === 'localStorage' ? global.localStorage : global.sessionStorage;
          const retrievedValue = getWithAliases([key, `legacy_${key}`], storageType);
          setValue(retrievedValue);
        }, [key]);
        
        return [value, jest.fn()] as const;
      };

      const { result } = renderHook(() => useStorage('app_config'));

      // Should only read canonical key when feature disabled
      expect(result.current[0]).toEqual({ version: '2.0' });
    });
  });

  describe('performance considerations', () => {
    it('should cache storage access during render', () => {
      let callCount = 0;
      (global.localStorage.getItem as jest.Mock).mockImplementation(() => {
        callCount++;
        return JSON.stringify({ cached: true });
      });

      const useStorage = (key: string) => {
        const [value, setValue] = React.useState<any>(null);
        
        React.useEffect(() => {
          const retrievedValue = getWithAliases([key], 'localStorage');
          setValue(retrievedValue);
        }, [key]);
        
        return value;
      };
      
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

      const useStorage = (key: string) => {
        const [value, setValue] = React.useState<any>(null);
        
        const updateValue = (newValue: any) => {
          setCanonical(key, newValue, 'localStorage');
          setValue(newValue);
        };
        
        return [value, updateValue] as const;
      };

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

      const useStorage = (key: string) => {
        const [value, setValue] = React.useState<any>(null);
        
        React.useEffect(() => {
          const retrievedValue = getWithAliases([key], 'localStorage');
          setValue(retrievedValue);
        }, [key]);
        
        return value;
      };

      // Should handle corrupted data
      const { result } = renderHook(() => useStorage('corrupted_key'));
      expect(result.current).toBeNull();
    });
  });
});
