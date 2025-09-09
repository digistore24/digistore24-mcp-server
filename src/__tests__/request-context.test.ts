import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { runWithRequestContext, getRequestContext } from '../request-context.js';

describe('request-context.ts', () => {
  beforeEach(() => {
    // Ensure clean state for each test
  });

  afterEach(() => {
    // Clean up any context
  });

  describe('runWithRequestContext', () => {
    it('should execute function with provided context', () => {
      const testContext = {
        apiKey: 'test-api-key-123',
        sessionId: 'test-session-456'
      };

      let capturedContext: any = null;
      
      runWithRequestContext(testContext, () => {
        capturedContext = getRequestContext();
      });

      expect(capturedContext).toEqual(testContext);
    });

    it('should isolate context between different executions', () => {
      const context1 = {
        apiKey: 'api-key-1',
        sessionId: 'session-1'
      };

      const context2 = {
        apiKey: 'api-key-2',
        sessionId: 'session-2'
      };

      let capturedContext1: any = null;
      let capturedContext2: any = null;

      runWithRequestContext(context1, () => {
        capturedContext1 = getRequestContext();
      });

      runWithRequestContext(context2, () => {
        capturedContext2 = getRequestContext();
      });

      expect(capturedContext1).toEqual(context1);
      expect(capturedContext2).toEqual(context2);
      expect(capturedContext1).not.toEqual(capturedContext2);
    });

    it('should handle nested context execution', () => {
      const outerContext = {
        apiKey: 'outer-key',
        sessionId: 'outer-session'
      };

      const innerContext = {
        apiKey: 'inner-key',
        sessionId: 'inner-session'
      };

      let outerCaptured: any = null;
      let innerCaptured: any = null;
      let outerAfterInner: any = null;

      runWithRequestContext(outerContext, () => {
        outerCaptured = getRequestContext();

        runWithRequestContext(innerContext, () => {
          innerCaptured = getRequestContext();
        });

        outerAfterInner = getRequestContext();
      });

      expect(outerCaptured).toEqual(outerContext);
      expect(innerCaptured).toEqual(innerContext);
      expect(outerAfterInner).toEqual(outerContext);
    });

    it('should return the result of the executed function', () => {
      const testContext = {
        apiKey: 'test-key',
        sessionId: 'test-session'
      };

      const result = runWithRequestContext(testContext, () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('should handle functions that throw errors', () => {
      const testContext = {
        apiKey: 'test-key',
        sessionId: 'test-session'
      };

      expect(() => {
        runWithRequestContext(testContext, () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
    });

    it('should handle async functions', async () => {
      const testContext = {
        apiKey: 'async-key',
        sessionId: 'async-session'
      };

      let capturedContext: any = null;

      const result = await runWithRequestContext(testContext, async () => {
        capturedContext = getRequestContext();
        return 'async-result';
      });

      expect(capturedContext).toEqual(testContext);
      expect(result).toBe('async-result');
    });
  });

  describe('getRequestContext', () => {
    it('should return undefined when no context is set', () => {
      const context = getRequestContext();
      expect(context).toBeUndefined();
    });

    it('should return current context when inside runWithRequestContext', () => {
      const testContext = {
        apiKey: 'context-key',
        sessionId: 'context-session'
      };

      runWithRequestContext(testContext, () => {
        const context = getRequestContext();
        expect(context).toEqual(testContext);
      });
    });

    it('should handle context with null sessionId', () => {
      const testContext = {
        apiKey: 'key-with-null-session',
        sessionId: null
      };

      runWithRequestContext(testContext, () => {
        const context = getRequestContext();
        expect(context).toEqual(testContext);
        expect(context?.sessionId).toBeNull();
      });
    });

    it('should preserve context properties', () => {
      const testContext = {
        apiKey: 'property-test-key',
        sessionId: 'property-test-session'
      };

      runWithRequestContext(testContext, () => {
        const context = getRequestContext();
        expect(context?.apiKey).toBe('property-test-key');
        expect(context?.sessionId).toBe('property-test-session');
      });
    });
  });

  describe('Context interface', () => {
    it('should enforce required apiKey property', () => {
      const validContext = {
        apiKey: 'required-key',
        sessionId: 'optional-session'
      };

      runWithRequestContext(validContext, () => {
        const context = getRequestContext();
        expect(typeof context?.apiKey).toBe('string');
        expect(context?.apiKey.length).toBeGreaterThan(0);
      });
    });

    it('should handle sessionId as string or null', () => {
      const contextWithStringSession = {
        apiKey: 'test-key',
        sessionId: 'string-session'
      };

      const contextWithNullSession = {
        apiKey: 'test-key',
        sessionId: null
      };

      runWithRequestContext(contextWithStringSession, () => {
        const context = getRequestContext();
        expect(typeof context?.sessionId).toBe('string');
      });

      runWithRequestContext(contextWithNullSession, () => {
        const context = getRequestContext();
        expect(context?.sessionId).toBeNull();
      });
    });
  });

  describe('Thread safety and isolation', () => {
    it('should maintain context isolation in concurrent operations', async () => {
      const context1 = { apiKey: 'concurrent-1', sessionId: 'session-1' };
      const context2 = { apiKey: 'concurrent-2', sessionId: 'session-2' };

      const promise1 = runWithRequestContext(context1, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return getRequestContext();
      });

      const promise2 = runWithRequestContext(context2, async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return getRequestContext();
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(result1).toEqual(context1);
      expect(result2).toEqual(context2);
    });

    it('should not leak context between separate executions', () => {
      const context1 = { apiKey: 'leak-test-1', sessionId: 'session-1' };
      const context2 = { apiKey: 'leak-test-2', sessionId: 'session-2' };

      runWithRequestContext(context1, () => {
        const ctx = getRequestContext();
        expect(ctx).toEqual(context1);
      });

      // Context should not be available outside
      expect(getRequestContext()).toBeUndefined();

      runWithRequestContext(context2, () => {
        const ctx = getRequestContext();
        expect(ctx).toEqual(context2);
        expect(ctx).not.toEqual(context1);
      });
    });
  });
});
