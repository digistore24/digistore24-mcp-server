# Hosting & Deployment Guide

This guide covers deploying the Digistore24 MCP server to production for hosting customers.

## 🎯 Production Deployment

### Target Environment

- **Domain**: `mcp.digistore24.com`
- **Protocol**: HTTPS only
- **Port**: 443 (standard HTTPS)
- **Environment**: Production

### Infrastructure Requirements

- **Node.js**: 20.x or higher
- **Memory**: Minimum 512MB RAM
- **CPU**: 1+ vCPU
- **Storage**: 1GB+ disk space
- **SSL Certificate**: Valid for `mcp.digistore24.com`

## 🚀 Deployment Steps

### 1. Build the Application

```bash
npm install
npm run build
```

### 2. Environment Configuration

Create `.env` file:

```bash
NODE_ENV=production
PORT=3000
# Note: No API_KEY_APIKEYAUTH needed for hosted service
```

### 3. Start the HTTP Server

```bash
npm start -- --http
```

### 4. Reverse Proxy Setup (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name mcp.digistore24.com;
    
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. Systemd Service (Optional)

Create `/etc/systemd/system/digistore24-mcp.service`:

```ini
[Unit]
Description=Digistore24 MCP Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/digistore24-mcp-server
ExecStart=/usr/bin/node build/index.js --http
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

## 🔒 Security Configuration

### SSL/TLS
- **Force HTTPS**: Redirect all HTTP to HTTPS
- **Modern Ciphers**: Use TLS 1.3 and strong ciphers
- **HSTS**: Enable HTTP Strict Transport Security

### Firewall
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP (redirect to HTTPS)
ufw allow 443   # HTTPS
ufw enable
```

### Rate Limiting
```nginx
# Add to Nginx configuration
limit_req_zone $binary_remote_addr zone=mcp:10m rate=10r/s;
location /mcp {
    limit_req zone=mcp burst=20 nodelay;
    # ... other proxy settings
}
```

## 📊 Monitoring & Logging

### Health Checks
- **Endpoint**: `https://mcp.digistore24.com/health`
- **Frequency**: Every 30 seconds
- **Alert**: If response time > 2 seconds or status != 200

### Logging
```bash
# Application logs
pm2 logs digistore24-mcp

# Nginx access logs
tail -f /var/log/nginx/access.log

# Error monitoring
tail -f /var/log/nginx/error.log
```

### Metrics
- **Response times**
- **Error rates**
- **API key validation success/failure**
- **Connection counts**

## 🚨 Customer-Focused Design

### Important: Hosted Service Only

**This server is designed to be hosted ONLY by Digistore24 as a public service.**

- ❌ **Do NOT** provide easy instructions for customers to run their own instances
- ❌ **Do NOT** include detailed local development setup
- ✅ **DO** emphasize the hosted service at `mcp.digistore24.com`
- ✅ **DO** provide clear customer setup guides

### Customer Configuration

Customers should use this configuration:

```json
{
  "mcpServers": {
    "digistore24": {
      "type": "http",
      "url": "https://mcp.digistore24.com/mcp",
      "headers": {
        "Authorization": "Bearer THEIR_API_KEY"
      }
    }
  }
}
```

## 🔄 Deployment Process

### 1. Staging Deployment
```bash
# Deploy to staging first
NODE_ENV=staging npm start -- --http
```

### 2. Production Deployment
```bash
# Deploy to production
NODE_ENV=production npm start -- --http
```

### 3. Health Check Verification
```bash
curl https://mcp.digistore24.com/health
curl https://mcp.digistore24.com/test-api-key?api_key=test
```

## 🆘 Troubleshooting

### Common Issues

#### Server Won't Start
- Check Node.js version (requires 20+)
- Verify port 3000 is available
- Check environment variables

#### SSL Issues
- Verify SSL certificate is valid
- Check certificate chain
- Ensure private key permissions

#### Performance Issues
- Monitor memory usage
- Check CPU utilization
- Review Nginx configuration

### Debug Commands
```bash
# Check server status
systemctl status digistore24-mcp

# View logs
journalctl -u digistore24-mcp -f

# Test MCP endpoint
curl -X POST https://mcp.digistore24.com/mcp \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

## 📈 Scaling Considerations

### Horizontal Scaling
- **Load Balancer**: Distribute requests across multiple instances
- **Session Management**: Ensure stateless design (already implemented)
- **Database**: No database required (stateless API)

### Vertical Scaling
- **Memory**: Increase if handling many concurrent connections
- **CPU**: Scale based on request processing needs
- **Network**: Ensure sufficient bandwidth for API calls

## 🔄 Maintenance

### Regular Tasks
- **SSL Renewal**: Monitor certificate expiration
- **Security Updates**: Keep Node.js and dependencies updated
- **Log Rotation**: Prevent log files from growing too large
- **Backup**: Backup configuration files

### Update Process
```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart service
systemctl restart digistore24-mcp
```

---

**Remember**: This is a hosted service for Digistore24 customers. Focus on reliability, security, and ease of use rather than providing self-hosting instructions.
