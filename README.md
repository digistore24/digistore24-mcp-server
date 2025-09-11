# Digistore24 MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to the Digistore24 API. This server allows AI tools like Claude Desktop, Cursor, and other MCP clients to interact with Digistore24's e-commerce platform programmatically.

## 🚀 Features

- **Complete Digistore24 API Coverage**: Access to all Digistore24 API endpoints
- **Secure Authentication**: Stateless API key authentication via Authorization headers
- **Multiple Transport Modes**: Both stdio (local) and HTTP (hosted) support
- **Production Ready**: Built for hosting as a public service
- **Customer-Friendly**: Easy setup for customers with their own API keys

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Hosted Service](#hosted-service)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Security](#security)
- [Support](#support)

## 🚀 Quick Start

### For Customers (Using Hosted Service)

If you're a Digistore24 customer wanting to use this with your AI assistant:

```json
{
  "mcpServers": {
    "digistore24": {
      "type": "http",
      "url": "https://mcp.digistore24.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_DIGISTORE24_API_KEY"
      }
    }
  }
}
```

**📖 See [docs/CUSTOMER_SETUP_GUIDE.md](./docs/CUSTOMER_SETUP_GUIDE.md) for detailed setup instructions**

### For Developers (Local Development - Internal Use Only)

```bash
# Clone and install
git clone https://github.com/digistore24/digistore24-mcp-server.git
cd digistore24-mcp-server
npm install

# Set your API key
echo "API_KEY_APIKEYAUTH=your_api_key_here" > .env

# Run locally with Claude Desktop
npm start

# Or run as HTTP server
npm start -- --http
```

## 📦 Installation

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Digistore24 API key

### Local Installation

```bash
git clone https://github.com/digistore24/digistore24-mcp-server.git
cd digistore24-mcp-server
npm install
npm run build
```

### Environment Setup

Create a `.env` file:

```bash
# Required for local development
API_KEY_APIKEYAUTH=your_digistore24_api_key

# Optional
PORT=3000
NODE_ENV=development
```

## 🔧 Usage

### Available Commands

```bash
# Build the project
npm run build

# Run with stdio transport (for Claude Desktop)
npm start

# Run with HTTP transport (for hosting)
npm start -- --http
npm start -- --transport=streamable-http

# Run on specific port
PORT=3001 npm start -- --http
```

### Available Tools

Once connected, you have access to 60+ Digistore24 API endpoints:

#### Order Management
- `PostCreateorder` - Create new orders
- `PostCreatebillingondemand` - Create billing on demand
- `PostAddbalancetopurchase` - Add balance to purchases
- `GetPurchases` - Get purchase information

#### Product Management  
- `PostCopyproduct` - Copy products
- `PostCreateimage` - Create product images
- `GetProducts` - Get product listings

#### Customer & Member Management
- `PostLogmemberaccess` - Log member access
- `GetPurchases` - Get customer purchases

#### Validation & Verification
- `validateAffiliate` - Validate affiliate relationships
- `validateCouponCode` - Validate discount codes
- `validateEticket` - Validate e-tickets
- `validateLicenseKey` - Validate license keys

#### Analytics & Reporting
- Various reporting and analytics endpoints

**📖 See the full API documentation in your MCP client after connecting**

## 🌐 Hosted Service

This server is hosted by Digistore24 as a public service, allowing customers to connect their AI assistants to Digistore24 using their own API keys.

### Architecture

- **Stateless Authentication**: No server-side storage of customer API keys
- **Per-Request Auth**: API key required and validated on every request
- **Session Isolation**: Each customer connection is completely isolated
- **Maximum Security**: API keys never persist in server memory
- **Hosted Only**: Customers use the service at mcp.digistore24.com

## 📚 API Reference

### Health Check

```http
GET /health
```

Returns server status and version information.

### API Key Testing

```http
GET /test-api-key?api_key=YOUR_KEY
GET /test-api-key
Authorization: Bearer YOUR_KEY
```

Validates an API key against Digistore24.

### MCP Endpoint

```http
POST /mcp
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

Main MCP communication endpoint for all tool interactions.

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `API_KEY_APIKEYAUTH` | For local dev | Your Digistore24 API key | - |
| `PORT` | No | Server port | `3000` |
| `NODE_ENV` | No | Environment | `development` |

### MCP Client Configuration

#### Claude Desktop

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "digistore24": {
      "type": "http",
      "url": "https://mcp.digistore24.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

#### Cursor

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "digistore24": {
      "type": "http", 
      "url": "https://mcp.digistore24.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

**📖 See [docs/CURSOR_SETUP_GUIDE.md](./docs/CURSOR_SETUP_GUIDE.md) for Cursor-specific instructions**

## 🔒 Security

### Customer API Keys

- ✅ **Stateless**: No server-side storage of API keys
- ✅ **HTTPS Only**: All communication encrypted in transit  
- ✅ **Per-Request Auth**: API key validated on every request
- ✅ **Isolated Sessions**: Each customer connection independent
- ✅ **No Persistence**: API keys discarded after each request

### Best Practices

- Always use HTTPS in production
- Never commit API keys to version control
- Rotate API keys regularly
- Monitor API usage for anomalies
- Use environment variables for sensitive data

## 🏗️ Development

### Project Structure

```
digistore24-mcp-server/
├── Dockerfile             # Production Docker image
├── .dockerignore          # Docker build optimization
├── docker-compose.yml     # Development/testing setup
├── .github/               # GitHub Actions workflows
│   └── workflows/
│       ├── build-docker.yml    # Docker build & publish
│       ├── cleanup-cache.yml   # Cache cleanup
├── src/
│   ├── index.ts           # Main MCP server logic
│   └── streamable-http.ts # HTTP transport implementation
├── build/                 # Compiled JavaScript
├── docs/                  # Documentation
│   ├── CUSTOMER_SETUP_GUIDE.md
│   ├── CURSOR_SETUP_GUIDE.md
│   └── ARCHITECTURE_SUMMARY.md
└── README.md              # This file
```

### Building

```bash
npm run build
```

### Docker Setup

#### Using Pre-built Image (Recommended)

```bash
# Pull and run the latest image from GitHub Container Registry
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  --name digistore24-mcp \
  ghcr.io/digistore24/digistore24-mcp-server:latest
```

#### Development/Testing

```bash
# Development with docker compose
docker compose up -d

# Or build locally
docker build -t digistore24-mcp-server .
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  digistore24-mcp-server
```

#### Available Image Tags

- `latest` - Latest stable release from main branch
- `main` - Latest commit from main branch
- `v*` - Specific version releases (e.g., `v1.0.0`)

### Testing (Internal Development Only)

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test API key validation
curl -H "Authorization: Bearer test" http://localhost:3000/test-api-key

# Test MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {"tools": {}},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    }
  }'

```

## 📖 Documentation

- **[Customer Setup Guide](./docs/CUSTOMER_SETUP_GUIDE.md)** - **Start here!** How customers connect their AI assistants
- **[Cursor Setup Guide](./docs/CURSOR_SETUP_GUIDE.md)** - Specific instructions for Cursor users  
- **[Hosting Guide](./docs/HOSTING_DEPLOYMENT_GUIDE.md)** - Internal deployment guide (for Digistore24 team)
- **[Architecture Summary](./docs/ARCHITECTURE_SUMMARY.md)** - Technical overview and design decisions  

## 🤝 Support

- **Documentation**: https://docs.digistore24.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
