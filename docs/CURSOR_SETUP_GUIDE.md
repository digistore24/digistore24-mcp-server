# Cursor Setup Guide for Digistore24 MCP Server

This guide shows you how to connect Cursor to the hosted Digistore24 MCP server using your API key.

## 🚀 Quick Setup

### 1. Get Your Digistore24 API Key

1. Log into your [Digistore24 account](https://www.digistore24.com)
2. Go to **Settings** → **API**
3. Create a new API key with the permissions you need
4. Copy your API key

### 2. Configure Cursor

1. Open Cursor
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "MCP" and select **MCP: Configure Servers**
4. Add this configuration:

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

### 3. Restart Cursor

After adding the configuration, restart Cursor for the changes to take effect.

## ✅ Verification

Once connected, you should see:

- **Digistore24 tools** available in Cursor's AI features
- **60+ API endpoints** for managing your Digistore24 account
- **Product, order, and customer management** capabilities

## 🔧 Alternative Configuration Methods

### Method 1: Command Palette
1. `Cmd+Shift+P` → "MCP: Configure Servers"
2. Add the server configuration above

### Method 2: Settings File
1. `Cmd+Shift+P` → "Preferences: Open Settings (JSON)"
2. Add to your `settings.json`:

```json
{
  "mcp.servers": {
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

### Method 3: Workspace Settings
Create `.vscode/settings.json` in your project:

```json
{
  "mcp.servers": {
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

## 🆘 Troubleshooting

### "Authentication Required" Error
- Verify the `Authorization: Bearer YOUR_KEY` header is included
- Check that your API key is correct
- Ensure your API key hasn't expired

### Connection Issues
- Verify the URL: `https://mcp.digistore24.com/mcp`
- Check your internet connection
- Try the health check: `https://mcp.digistore24.com/health`

### MCP Not Working
- Restart Cursor after configuration
- Check Cursor's MCP extension is enabled
- Verify the JSON syntax is correct

## 🔒 Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for sensitive data
- **Rotate API keys** regularly
- **Monitor API usage** in your Digistore24 account

## 📚 Available Tools

Once connected, you'll have access to:

- **Product Management**: Create, update, delete products
- **Order Management**: Process orders, manage billing
- **Customer Management**: Track buyers, manage memberships
- **Analytics**: Sales reports, commission tracking
- **Marketing**: Affiliate management, voucher creation

## 🆘 Support

Need help?

1. **Check your API key** in Digistore24
2. **Verify the configuration** matches the example
3. **Restart Cursor** after making changes
4. **Contact Digistore24 support** for API issues

---

**Ready to start?** Follow the quick setup steps above and you'll be using Digistore24 with Cursor in minutes!
