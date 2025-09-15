
/**
 * StreamableHTTP server setup for HTTP-based MCP communication using Hono
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { v4 as uuid } from 'uuid';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { InitializeRequestSchema, JSONRPCError } from "@modelcontextprotocol/sdk/types.js";
import { toReqRes, toFetchResponse } from 'fetch-to-node';
import axios from 'axios';
import { runWithRequestContext } from './request-context.js';


// Import server configuration constants
import { SERVER_NAME, SERVER_VERSION } from './config.js';

// Constants
const SESSION_ID_HEADER_NAME = "mcp-session-id";
const JSON_RPC = "2.0";

/**
 * StreamableHTTP MCP Server handler
 */
export class MCPStreamableHttpServer {
  server: Server;
  // Store active transports by session ID with timeout tracking
  transports: {[sessionId: string]: StreamableHTTPServerTransport} = {};
  private transportTimeouts: {[sessionId: string]: NodeJS.Timeout} = {};
  private sessionLastActive: {[sessionId: string]: number} = {};
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(server: Server) {
    this.server = server;
    
    // Cleanup expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }
  
  /**
   * Handle GET requests (returns Method Not Allowed)
   */
  async handleGetRequest(c: any) {
    console.info("GET request received - StreamableHTTP transport only supports POST");
    return c.text('Method Not Allowed', 405, {
      'Allow': 'POST'
    });
  }
  
  /**
   * Handle POST requests (all MCP communication)
   */
  async handlePostRequest(c: any) {
    const sessionId = c.req.header(SESSION_ID_HEADER_NAME);
    console.info(`POST request received ${sessionId ? 'with session ID: ' + sessionId : 'without session ID'}`);
    
    // Extract API key from Authorization header only
    const authHeader = c.req.header('authorization');
    const bearerApiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    const customerApiKey = bearerApiKey;
    
    // Require API key on every request - stateless authentication
    if (!customerApiKey) {
      return c.json(
        this.createErrorResponse("Authentication required: Please provide your API key via Authorization: Bearer YOUR_KEY header"),
        401
      );
    }
    
    console.info(`API key provided via Authorization header for request`);
    
    try {
      const body = await c.req.json();
      
      // Convert Fetch Request to Node.js req/res
      const { req, res } = toReqRes(c.req.raw);
      
      const run = async () => {
        // Reuse existing transport if we have a session ID
        if (sessionId && this.transports[sessionId]) {
          const transport = this.transports[sessionId];
          
          // Handle the request with the transport
          await transport.handleRequest(req, res, body);
          
          // Update last activity and refresh timeout
          this.markSessionActivity(sessionId);
          
          // Cleanup when the response ends
          res.on('close', () => {
            console.info(`Request closed for session ${sessionId}`);
          });
          
          // Convert Node.js response back to Fetch Response
          return toFetchResponse(res);
        }
        
        // Create new transport for initialize requests
        if (!sessionId && this.isInitializeRequest(body)) {
          console.info("Creating new StreamableHTTP transport for initialize request");
          
          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => uuid(),
          });
          
          // Add error handler for debug purposes
          transport.onerror = (err) => {
            console.error('StreamableHTTP transport error:', err);
          };
          
          // Connect the transport to the MCP server
          await this.server.connect(transport);
          
          // Handle the request with the transport
          await transport.handleRequest(req, res, body);
          
          // Store the transport if we have a session ID
          const newSessionId = transport.sessionId;
          if (newSessionId) {
            console.info(`New session established: ${newSessionId}`);
            this.transports[newSessionId] = transport;
            this.sessionLastActive[newSessionId] = Date.now();
            
            // Set up timeout for this session and refresh on activity
            this.refreshSessionTimeout(newSessionId);
            
            // Set up clean-up for when the transport is closed
            transport.onclose = () => {
              console.info(`Session closed: ${newSessionId}`);
              this.removeTransport(newSessionId, true);
            };
          }
          
          // Cleanup when the response ends
          res.on('close', () => {
            console.info(`Request closed for new session`);
          });
          
          // Convert Node.js response back to Fetch Response
          return toFetchResponse(res);
        }
        
        // Invalid request (no session ID and not initialize)
        return c.json(
          this.createErrorResponse("Bad Request: invalid session ID or method."),
          400
        );
      };
      
      return await runWithRequestContext({ apiKey: customerApiKey, sessionId: sessionId ?? null }, run);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      return c.json(
        this.createErrorResponse("Internal server error."),
        500
      );
    }
  }
  
  /**
   * Create a JSON-RPC error response
   */
  private createErrorResponse(message: string): JSONRPCError {
    return {
      jsonrpc: JSON_RPC,
      error: {
        code: -32000,
        message: message,
      },
      id: uuid(),
    };
  }
  
  /**
   * Check if the request is an initialize request
   */
  private isInitializeRequest(body: any): boolean {
    const isInitial = (data: any) => {
      const result = InitializeRequestSchema.safeParse(data);
      return result.success;
    };
    
    if (Array.isArray(body)) {
      return body.some(request => isInitial(request));
    }
    
    return isInitial(body);
  }
  
  /**
   * Cleanup expired sessions to prevent memory leaks
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];
    
    for (const [sessionId, lastActive] of Object.entries(this.sessionLastActive)) {
      if (now - lastActive > this.SESSION_TIMEOUT_MS) {
        expiredSessions.push(sessionId);
      }
    }
    
    // Remove expired sessions
    expiredSessions.forEach(sessionId => {
      this.removeTransport(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      console.info(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
  
  /**
   * Remove transport and cleanup resources
   */
  private removeTransport(sessionId: string, alreadyClosed: boolean = false): void {
    const transport = this.transports[sessionId];
    if (transport) {
      if (!alreadyClosed) {
        try {
          transport.close();
        } catch (error) {
          console.error(`Error closing transport ${sessionId}:`, error);
        }
      }
      delete this.transports[sessionId];
      delete this.sessionLastActive[sessionId];
      
      // Clear timeout
      if (this.transportTimeouts[sessionId]) {
        clearTimeout(this.transportTimeouts[sessionId]);
        delete this.transportTimeouts[sessionId];
      }
    }
  }

  private markSessionActivity(sessionId: string): void {
    this.sessionLastActive[sessionId] = Date.now();
    this.refreshSessionTimeout(sessionId);
  }

  private refreshSessionTimeout(sessionId: string): void {
    if (this.transportTimeouts[sessionId]) {
      clearTimeout(this.transportTimeouts[sessionId]);
    }
    this.transportTimeouts[sessionId] = setTimeout(() => {
      console.info(`Session timeout for ${sessionId}`);
      this.removeTransport(sessionId);
    }, this.SESSION_TIMEOUT_MS);
    // Allow process to exit even if timers exist
    (this.transportTimeouts[sessionId] as any)?.unref?.();
  }
  
  /**
   * Cleanup method for testing - clears all intervals and timeouts
   */
  public cleanup(): void {
    // Clear the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Clear all transport timeouts
    Object.entries(this.transportTimeouts).forEach(([sessionId, timeout]) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      delete this.transportTimeouts[sessionId];
    });
    
    // Clear all transports
    Object.entries(this.transports).forEach(([sessionId, transport]) => {
      try {
        // Prevent recursive onclose -> removeTransport -> close loop
        (transport as any).onclose = undefined;
        transport.close();
      } catch (error) {
        // Ignore errors during cleanup
      }
      this.removeTransport(sessionId, true);
    });
    
    // Clear session activity map
    Object.keys(this.sessionLastActive).forEach((sessionId) => {
      delete this.sessionLastActive[sessionId];
    });
  }
}

/**
 * Sets up a web server for the MCP server using StreamableHTTP transport
 * 
 * @param server The MCP Server instance
 * @param port The port to listen on (default: 3000)
 * @returns The Hono app instance
 */
export async function setupStreamableHttpServer(server: Server, port = 3000) {
  // Create Hono app
  const app = new Hono();
  
  // Enable CORS
  app.use('*', cors());
  
  // Create MCP handler
  const mcpHandler = new MCPStreamableHttpServer(server);
  
  // Add a simple health check endpoint
  app.get('/health', (c) => {
    return c.json({ status: 'OK', server: SERVER_NAME, version: SERVER_VERSION });
  });
  
  // Add an API key test endpoint for customers
  app.get('/test-api-key', async (c) => {
    const authHeader = c.req.header('authorization');
    const bearerApiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    const testApiKey = bearerApiKey;
    
    if (!testApiKey) {
      return c.json({ 
        error: 'No API key provided',
        message: 'Please provide your API key via Authorization: Bearer YOUR_KEY header'
      }, 400);
    }
    
    try {
      // Test the API key by making a simple call to Digistore24
      const response = await axios.post(
        'https://www.digistore24.com/api/call/ping',
        new URLSearchParams(),
        {
          headers: {
            'X-DS-API-KEY': testApiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );
      
      return c.json({
        status: 'success',
        message: 'API key is valid and working',
        apiKeyValid: true,
        response: response.data
      });
    } catch (error: any) {
      return c.json({
        status: 'error',
        message: 'API key test failed',
        apiKeyValid: false,
        error: error.response?.data || error.message
      }, 401);
    }
  });
  
  // Main MCP endpoint supporting both GET and POST
  app.get("/mcp", (c) => mcpHandler.handleGetRequest(c));
  app.post("/mcp", (c) => mcpHandler.handlePostRequest(c));
  

  
  // Start the server
  serve({
    fetch: app.fetch,
    port
  }, (info) => {
    console.info(`MCP StreamableHTTP Server running at http://localhost:${info.port}`);
    console.info(`- MCP Endpoint: http://localhost:${info.port}/mcp`);
    console.info(`- Health Check: http://localhost:${info.port}/health`);
  });
  
  return { app, mcpHandler } as const;
}
