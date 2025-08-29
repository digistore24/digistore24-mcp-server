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
- [Hosting for Customers](#hosting-for-customers)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Deployment](#deployment)
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

**📖 See [docs/HOSTING_DEPLOYMENT_GUIDE.md](./docs/HOSTING_DEPLOYMENT_GUIDE.md) for detailed deployment instructions**

### For Developers (Local Development)

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

- Node.js 18+ 
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

## 🌐 Hosting for Customers

This server is designed to be hosted as a public service, allowing your customers to connect their AI assistants to Digistore24 using their own API keys.

### Architecture

- **Stateless Authentication**: No server-side storage of customer API keys
- **Per-Request Auth**: API key required and validated on every request
- **Session Isolation**: Each customer connection is completely isolated
- **Maximum Security**: API keys never persist in server memory

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
├── src/
│   ├── index.ts           # Main MCP server logic
│   └── streamable-http.ts # HTTP transport implementation
├── build/                 # Compiled JavaScript
├── public/               # Static files
├── docs/                 # Documentation
│   ├── CUSTOMER_SETUP_GUIDE.md
│   ├── CURSOR_SETUP_GUIDE.md
│   ├── HOSTING_DEPLOYMENT_GUIDE.md
│   └── ARCHITECTURE_SUMMARY.md
└── README.md             # This file
```

### Building

```bash
npm run build
```

### Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test API key validation
curl -H "Authorization: Bearer test" http://localhost:3000/test-api-key

# Test MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping"}'
```

## 📖 Documentation

- **[Customer Setup Guide](./docs/CUSTOMER_SETUP_GUIDE.md)** - How customers connect their AI assistants
- **[Cursor Setup Guide](./docs/CURSOR_SETUP_GUIDE.md)** - Specific instructions for Cursor users  
- **[Hosting Guide](./docs/HOSTING_DEPLOYMENT_GUIDE.md)** - How to deploy and host the server
- **[Architecture Summary](./docs/ARCHITECTURE_SUMMARY.md)** - Technical overview and design decisions  

## 🤝 Support

- **Documentation**: https://docs.digistore24.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
