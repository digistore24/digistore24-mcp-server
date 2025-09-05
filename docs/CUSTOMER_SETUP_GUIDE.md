# Digistore24 MCP Server - Customer Setup Guide

This guide shows you how to connect your AI assistant (Claude Desktop, Cursor, etc.) to the hosted Digistore24 MCP server using your own API key.

## 🚀 Quick Setup

### 1. Get Your Digistore24 API Key

1. Log into your [Digistore24 account](https://www.digistore24.com)
2. Go to **Settings** → **API**
3. Create a new API key with the permissions you need
4. Copy your API key (keep it secure!)

### 2. Configure Your MCP Client

Add this configuration to your MCP client:

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

**Replace `YOUR_DIGISTORE24_API_KEY` with your actual API key.**

## 🔧 Client-Specific Instructions

### Claude Desktop

1. Open Claude Desktop
2. Go to **Settings** → **MCP Servers**
3. Add a new server with the configuration above
4. Restart Claude Desktop

### Cursor

1. Open Cursor
2. Go to **Settings** → **Extensions** → **MCP**
3. Add the server configuration above
4. Restart Cursor

### Other MCP Clients

Most MCP clients support the same configuration format. Look for MCP server settings in your client's configuration.

## ✅ Verification

After connecting, you should see:

- **60+ Digistore24 tools** available in your AI assistant
- **Product management** tools (create, update, delete products)
- **Order management** tools (create orders, manage billing)
- **Customer management** tools (manage buyers, track purchases)
- **Analytics and reporting** tools

## 🔒 Security Features

- **Stateless Authentication**: Your API key is never stored on our servers
- **Per-Request Validation**: Every request validates your API key
- **HTTPS Only**: All communication is encrypted
- **Session Isolation**: Your connection is completely separate from other users

## 🆘 Troubleshooting

### "Authentication Required" Error
- Make sure you've added the `Authorization: Bearer YOUR_KEY` header
- Verify your API key is correct
- Check that your API key hasn't expired

### "API Key Invalid" Error
- Verify your API key in your Digistore24 account
- Ensure you have the correct permissions
- Try regenerating your API key

### Connection Issues
- Check your internet connection
- Verify the URL: `https://mcp.digistore24.com/mcp`
- Try the health check: `https://mcp.digistore24.com/health`

## 📞 Support

If you need help:

1. **Check your API key** in your Digistore24 account
2. **Verify the configuration** matches the example above
3. **Contact Digistore24 support** for API key issues
4. **Check our documentation** at docs.digistore24.com

## 🔄 API Key Management

- **Rotate regularly**: Change your API key every 90 days
- **Monitor usage**: Check your Digistore24 API usage logs
- **Restrict permissions**: Only grant the permissions you need
- **Secure storage**: Never share your API key publicly

---

**Ready to get started?** Follow the quick setup steps above and you'll be using Digistore24 with your AI assistant in minutes!
