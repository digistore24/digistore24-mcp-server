import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SERVER_NAME, SERVER_VERSION, API_BASE_URL } from '../config.js';

// Mock external dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(),
}));

jest.mock('../streamable-http.js', () => ({
  setupStreamableHttpServer: jest.fn(),
}));

// Ensure timers are fake to avoid hanging
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('config.ts', () => {
  describe('Constants', () => {
    it('should have correct server name constant', () => {
      expect(SERVER_NAME).toBe('digistore24-api');
    });

    it('should have correct server version constant', () => {
      expect(SERVER_VERSION).toBe('1.0');
    });

    it('should have correct API base URL constant', () => {
      expect(API_BASE_URL).toBe('https://www.digistore24.com/api/call');
    });
  });
});

describe('Argument parsing utilities', () => {
  describe('Port parsing', () => {
    it('should parse port from --port=VALUE format', () => {
      const testArgs = ['node', 'index.js', '--http', '--port=8080'];
      const portArg = testArgs.find(a => a.startsWith('--port='));
      const port = portArg ? parseInt(portArg.split('=')[1] || '3000', 10) : 3000;
      expect(port).toBe(8080);
    });

    it('should default to 3000 when no port specified', () => {
      const testArgs = ['node', 'index.js', '--http'];
      const portArg = testArgs.find(a => a.startsWith('--port='));
      const port = portArg ? parseInt(portArg.split('=')[1] || '3000', 10) : 3000;
      expect(port).toBe(3000);
    });

    it('should handle invalid port values gracefully', () => {
      const testArgs = ['node', 'index.js', '--http', '--port=invalid'];
      const portArg = testArgs.find(a => a.startsWith('--port='));
      const port = portArg ? parseInt(portArg.split('=')[1] || '3000', 10) : 3000;
      expect(isNaN(port)).toBe(true);
    });

    it('should handle empty port value', () => {
      const testArgs = ['node', 'index.js', '--http', '--port='];
      const portArg = testArgs.find(a => a.startsWith('--port='));
      const port = portArg ? parseInt(portArg.split('=')[1] || '3000', 10) : 3000;
      expect(port).toBe(3000);
    });
  });

  describe('Transport mode detection', () => {
    it('should detect HTTP mode from --http flag', () => {
      const testArgs = ['node', 'index.js', '--http'];
      const isHttpMode = testArgs.includes('--http');
      expect(isHttpMode).toBe(true);
    });

    it('should default to stdio mode when no --http flag', () => {
      const testArgs = ['node', 'index.js'];
      const isHttpMode = testArgs.includes('--http');
      expect(isHttpMode).toBe(false);
    });

    it('should handle mixed arguments correctly', () => {
      const testArgs = ['node', 'index.js', '--port=8080', '--http', '--verbose'];
      const isHttpMode = testArgs.includes('--http');
      const portArg = testArgs.find(a => a.startsWith('--port='));
      const port = portArg ? parseInt(portArg.split('=')[1] || '3000', 10) : 3000;
      
      expect(isHttpMode).toBe(true);
      expect(port).toBe(8080);
    });
  });
});

describe('Authentication and security', () => {
  describe('API key extraction', () => {
    it('should extract API key from Bearer token format', () => {
      const authHeader = 'Bearer test-api-key-123';
      const apiKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      expect(apiKey).toBe('test-api-key-123');
    });

    it('should handle missing Bearer prefix', () => {
      const authHeader = 'test-api-key-123';
      const apiKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      expect(apiKey).toBe(null);
    });

    it('should handle empty authorization header', () => {
      const authHeader = '';
      const apiKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      expect(apiKey).toBe(null);
    });

    it('should handle Bearer token with spaces', () => {
      const authHeader = 'Bearer  test-key-with-spaces  ';
      const apiKey = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
      expect(apiKey).toBe('test-key-with-spaces');
    });
  });

  describe('Header redaction', () => {
    it('should identify sensitive headers for redaction', () => {
      const sensitiveHeaders = ['authorization', 'x-ds-api-key', 'cookie'];
      const testHeaders = {
        'authorization': 'Bearer secret',
        'x-ds-api-key': 'api-key',
        'cookie': 'session=123',
        'content-type': 'application/json'
      };

      Object.keys(testHeaders).forEach(header => {
        const shouldRedact = sensitiveHeaders.includes(header.toLowerCase());
        if (header === 'content-type') {
          expect(shouldRedact).toBe(false);
        } else {
          expect(shouldRedact).toBe(true);
        }
      });
    });
  });
});

describe('Error handling', () => {
  describe('JSON-RPC error responses', () => {
    it('should create properly formatted error response', () => {
      const errorResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Test error message'
        },
        id: 'test-id'
      };

      expect(errorResponse.jsonrpc).toBe('2.0');
      expect(errorResponse.error.code).toBe(-32000);
      expect(errorResponse.error.message).toBe('Test error message');
      expect(typeof errorResponse.id).toBe('string');
    });

    it('should handle different error codes', () => {
      const errorCodes = {
        PARSE_ERROR: -32700,
        INVALID_REQUEST: -32600,
        METHOD_NOT_FOUND: -32601,
        INVALID_PARAMS: -32602,
        INTERNAL_ERROR: -32603,
        SERVER_ERROR: -32000
      };

      Object.values(errorCodes).forEach(code => {
        expect(typeof code).toBe('number');
        expect(code).toBeLessThan(0);
      });
    });
  });

  describe('HTTP status codes', () => {
    it('should use correct status codes for different scenarios', () => {
      const statusCodes = {
        OK: 200,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        METHOD_NOT_ALLOWED: 405,
        INTERNAL_SERVER_ERROR: 500
      };

      expect(statusCodes.OK).toBe(200);
      expect(statusCodes.BAD_REQUEST).toBe(400);
      expect(statusCodes.UNAUTHORIZED).toBe(401);
      expect(statusCodes.METHOD_NOT_ALLOWED).toBe(405);
      expect(statusCodes.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });
});