
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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import server configuration constants
import { SERVER_NAME, SERVER_VERSION } from './index.js';

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
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(server: Server) {
    this.server = server;
    
    // Cleanup expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }
  
  /**
   * Handle GET requests (typically used for static files)
   */
  async handleGetRequest(c: any) {
    console.error("GET request received - StreamableHTTP transport only supports POST");
    return c.text('Method Not Allowed', 405, {
      'Allow': 'POST'
    });
  }
  
  /**
   * Handle POST requests (all MCP communication)
   */
  async handlePostRequest(c: any) {
    const sessionId = c.req.header(SESSION_ID_HEADER_NAME);
    console.error(`POST request received ${sessionId ? 'with session ID: ' + sessionId : 'without session ID'}`);
    
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
    
    console.error(`API key provided via Authorization header for request`);
    
    try {
      const body = await c.req.json();
      
      // Convert Fetch Request to Node.js req/res
      const { req, res } = toReqRes(c.req.raw);
      
      // Reuse existing transport if we have a session ID
      if (sessionId && this.transports[sessionId]) {
        const transport = this.transports[sessionId];
        
        // Handle the request with the transport
        await transport.handleRequest(req, res, body);
        
        // Cleanup when the response ends
        res.on('close', () => {
          console.error(`Request closed for session ${sessionId}`);
        });
        
        // Convert Node.js response back to Fetch Response
        return toFetchResponse(res);
      }
      
      // Create new transport for initialize requests
      if (!sessionId && this.isInitializeRequest(body)) {
        console.error("Creating new StreamableHTTP transport for initialize request");
        
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
          console.error(`New session established: ${newSessionId}`);
          this.transports[newSessionId] = transport;
          
          // Set up timeout for this session
          this.transportTimeouts[newSessionId] = setTimeout(() => {
            console.error(`Session timeout for ${newSessionId}`);
            this.removeTransport(newSessionId);
          }, this.SESSION_TIMEOUT_MS);
          
          // Set up clean-up for when the transport is closed
          transport.onclose = () => {
            console.error(`Session closed: ${newSessionId}`);
            this.removeTransport(newSessionId);
          };
        }
        
        // Cleanup when the response ends
        res.on('close', () => {
          console.error(`Request closed for new session`);
        });
        
        // Convert Node.js response back to Fetch Response
        return toFetchResponse(res);
      }
      
      // Invalid request (no session ID and not initialize)
      return c.json(
        this.createErrorResponse("Bad Request: invalid session ID or method."),
        400
      );
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
    
    for (const [sessionId, transport] of Object.entries(this.transports)) {
      if (transport.sessionId && this.transportTimeouts[sessionId]) {
        // Check if session has expired
        const timeout = this.transportTimeouts[sessionId];
        if (timeout && now > (timeout as any)._idleStart + this.SESSION_TIMEOUT_MS) {
          expiredSessions.push(sessionId);
        }
      }
    }
    
    // Remove expired sessions
    expiredSessions.forEach(sessionId => {
      this.removeTransport(sessionId);
    });
    
    if (expiredSessions.length > 0) {
      console.error(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }
  
  /**
   * Remove transport and cleanup resources
   */
  private removeTransport(sessionId: string): void {
    const transport = this.transports[sessionId];
    if (transport) {
      try {
        transport.close();
      } catch (error) {
        console.error(`Error closing transport ${sessionId}:`, error);
      }
      
      delete this.transports[sessionId];
      
      // Clear timeout
      if (this.transportTimeouts[sessionId]) {
        clearTimeout(this.transportTimeouts[sessionId]);
        delete this.transportTimeouts[sessionId];
      }
    }
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
    Object.values(this.transportTimeouts).forEach(timeout => {
      if (timeout) {
        clearTimeout(timeout);
      }
    });
    
    // Clear all transports
    Object.values(this.transports).forEach(transport => {
      try {
        transport.close();
      } catch (error) {
        // Ignore errors during cleanup
      }
    });
    
    this.transports = {};
    this.transportTimeouts = {};
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
  
  // Static files for the web client (if any)
  app.get('/*', async (c) => {
    const filePath = c.req.path === '/' ? '/index.html' : c.req.path;
    try {
      // Use Node.js fs to serve static files
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const publicPath = path.join(__dirname, '..', '..', 'public');
      const fullPath = path.join(publicPath, filePath);
      
      // Simple security check to prevent directory traversal
      if (!fullPath.startsWith(publicPath)) {
        return c.text('Forbidden', 403);
      }
      
      try {
        // Use async file operations to avoid blocking the event loop
        const stat = await fs.promises.stat(fullPath);
        if (stat.isFile()) {
          const content = await fs.promises.readFile(fullPath);
          
          // Set content type based on file extension
          const ext = path.extname(fullPath).toLowerCase();
          let contentType = 'text/plain';
          
          switch (ext) {
            case '.html': contentType = 'text/html'; break;
            case '.css': contentType = 'text/css'; break;
            case '.js': contentType = 'text/javascript'; break;
            case '.json': contentType = 'application/json'; break;
            case '.png': contentType = 'image/png'; break;
            case '.jpg': contentType = 'image/jpeg'; break;
            case '.svg': contentType = 'image/svg+xml'; break;
          }
          
          return new Response(new Uint8Array(content), {
            headers: { 'Content-Type': contentType }
          });
        }
      } catch (err) {
        // File not found or other error
        return c.text('Not Found', 404);
      }
    } catch (err) {
      console.error('Error serving static file:', err);
      return c.text('Internal Server Error', 500);
    }
    
    return c.text('Not Found', 404);
  });
  
  // Start the server
  serve({
    fetch: app.fetch,
    port
  }, (info) => {
    console.error(`MCP StreamableHTTP Server running at http://localhost:${info.port}`);
    console.error(`- MCP Endpoint: http://localhost:${info.port}/mcp`);
    console.error(`- Health Check: http://localhost:${info.port}/health`);
  });
  
  return app;
}
