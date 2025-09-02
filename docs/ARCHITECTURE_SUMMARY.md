# Architecture Summary

This document provides a technical overview of the Digistore24 MCP server architecture and design decisions.

## 🏗️ System Architecture

### Overview

The Digistore24 MCP server is a **hosted service** that provides AI assistants with access to the Digistore24 API through the Model Context Protocol (MCP). It's designed to be stateless, secure, and scalable.

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   AI Assistant  │───▶│  MCP Server         │───▶│  Digistore24    │
│   (Claude,      │    │  (mcp.digistore24.  │    │  API            │
│    Cursor)      │    │   com)              │    │                 │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
```

## 🔧 Technical Components

### 1. MCP Server Core (`src/index.ts`)

- **Protocol Implementation**: Full MCP 2024-11-05 specification support
- **Tool Registry**: 60+ Digistore24 API endpoints as MCP tools
- **Authentication**: Stateless API key validation
- **Error Handling**: Comprehensive error formatting and logging

### 2. HTTP Transport (`src/streamable-http.ts`)

- **Framework**: Hono.js for lightweight, fast HTTP handling
- **MCP Transport**: StreamableHTTP transport from MCP SDK
- **Session Management**: UUID-based session tracking
- **CORS Support**: Cross-origin request handling

### 3. API Integration

- **HTTP Client**: Axios for Digistore24 API calls
- **Schema Validation**: Zod schemas for runtime validation
- **Response Processing**: Consistent error handling and formatting

## 🔐 Security Architecture

### Authentication Flow

```
1. Client Request → Authorization: Bearer API_KEY
2. Server Validation → Set process.env.API_KEY_APIKEYAUTH
3. API Call → Forward to Digistore24 with X-DS-API-KEY
4. Response → Return to client
5. Cleanup → API key discarded (stateless)
```

### Security Features

- **Stateless Design**: No server-side storage of customer API keys
- **Per-Request Auth**: Every request validates the API key
- **HTTPS Only**: All communication encrypted in transit
- **Session Isolation**: Each customer connection independent
- **Input Validation**: Zod schemas prevent injection attacks

## 📡 Transport Layer

### Supported Protocols

1. **HTTP (Production)**: `https://mcp.digistore24.com/mcp`
   - Primary transport for hosted service
   - Stateless authentication
   - Scalable and load-balancer friendly

2. **STDIO (Development)**: Local development only
   - For testing and development
   - Not intended for customer use

### HTTP Endpoints

- **`/mcp`**: Main MCP communication endpoint
- **`/health`**: Health check and status
- **`/test-api-key`**: API key validation testing

## 🚀 Performance & Scalability

### Stateless Design Benefits

- **Horizontal Scaling**: Can run multiple instances behind load balancer
- **No Session Storage**: Each request is independent
- **Memory Efficiency**: No persistent state to maintain
- **Fault Tolerance**: Instance failures don't affect other requests

### Optimization Features

- **Connection Reuse**: HTTP keep-alive support
- **Response Caching**: Static file serving
- **Error Handling**: Fast failure detection and reporting
- **Logging**: Structured logging for monitoring

## 🔄 Data Flow

### Request Processing

```
1. HTTP Request → MCP Server
2. API Key Extraction → Authorization header
3. Environment Setup → Set API key for this request
4. MCP Protocol → Parse and route to appropriate tool
5. Digistore24 API → Forward request with customer's API key
6. Response Processing → Format and return to client
7. Cleanup → Reset environment variables
```

### Tool Execution

```
1. Tool Selection → Based on MCP method
2. Parameter Validation → Zod schema validation
3. API Call → To Digistore24 with customer credentials
4. Response Handling → Format MCP response
5. Error Handling → Consistent error reporting
```

## 🏠 Hosting Strategy

### Production Environment

- **Domain**: `mcp.digistore24.com`
- **Infrastructure**: Cloud-based hosting
- **SSL**: Let's Encrypt or commercial certificate
- **Monitoring**: Health checks and logging
- **Backup**: Configuration and code backup

### Customer Access

- **No Self-Hosting**: Customers use hosted service only
- **API Key Management**: Customers manage their own Digistore24 API keys
- **Configuration**: Simple JSON configuration in MCP clients
- **Support**: Centralized support and maintenance

## 📊 Monitoring & Observability

### Health Checks

- **Endpoint**: `/health`
- **Metrics**: Server status, version, uptime
- **Frequency**: 30-second intervals
- **Alerts**: Response time and status monitoring

### Logging

- **Structured Logs**: JSON format for easy parsing
- **Request Tracking**: Session ID and API key usage
- **Error Logging**: Detailed error information
- **Performance**: Response time tracking

### Metrics

- **Request Volume**: Number of MCP requests
- **API Calls**: Digistore24 API usage
- **Error Rates**: Authentication and API failures
- **Response Times**: Performance monitoring

## 🔧 Development & Deployment

### Build Process

```bash
npm install          # Install dependencies
npm run build       # TypeScript compilation
npm start -- --http # Start HTTP server
```

### Environment Variables

- **`NODE_ENV`**: Environment (development/production)
- **`PORT`**: Server port (default: 3000)
- **`API_KEY_APIKEYAUTH`**: Only for local development

### Deployment

- **Containerization**: Docker support (optional)
- **Process Management**: PM2 or systemd
- **Reverse Proxy**: Nginx for SSL termination
- **Load Balancing**: Multiple instances support

## 🎯 Design Principles

### 1. Customer-First
- **Easy Setup**: Simple configuration for customers
- **No Self-Hosting**: Hosted service approach
- **Clear Documentation**: Step-by-step setup guides

### 2. Security by Design
- **Stateless Auth**: No persistent credential storage
- **Input Validation**: Prevent injection attacks
- **HTTPS Only**: Encrypted communication

### 3. Scalability
- **Horizontal Scaling**: Multiple instance support
- **Stateless Design**: No shared state between instances
- **Load Balancer Ready**: Designed for production deployment

### 4. Maintainability
- **Clean Code**: TypeScript with clear structure
- **Comprehensive Testing**: Built-in validation and error handling
- **Documentation**: Complete setup and troubleshooting guides

## 🔮 Future Considerations

### Potential Enhancements

- **Rate Limiting**: Per-customer API usage limits
- **Analytics Dashboard**: Customer usage statistics
- **Webhook Support**: Real-time notifications
- **Multi-Region**: Geographic distribution for performance

### Scalability Plans

- **Microservices**: Split into smaller, focused services
- **Caching Layer**: Redis for frequently accessed data
- **Queue System**: Async processing for heavy operations
- **Monitoring**: Advanced metrics and alerting

---

**Key Takeaway**: This is a **hosted service** designed for Digistore24 customers to easily connect their AI assistants. The architecture prioritizes security, scalability, and ease of use over self-hosting capabilities.
