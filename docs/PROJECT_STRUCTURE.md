# Project Structure

```
digistore24-mcp-server/
├── README.md                    # Main project documentation
├── LICENSE                      # MIT License
├── package.json                 # Project configuration and dependencies
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Test configuration
├── .gitignore                  # Git ignore rules
│
├── src/                        # Source code
│   ├── index.ts                # Main MCP server logic and API tools
│   └── streamable-http.ts      # HTTP transport implementation
│
├── build/                      # Compiled JavaScript (generated)
│   ├── index.js
│   ├── index.d.ts
│   ├── streamable-http.js
│   └── streamable-http.d.ts
│
├── docs/                       # Documentation
│   ├── CUSTOMER_SETUP_GUIDE.md     # How customers connect their AI assistants
│   ├── CURSOR_SETUP_GUIDE.md       # Specific instructions for Cursor users
│   ├── HOSTING_DEPLOYMENT_GUIDE.md # How to deploy and host the server
│   └── ARCHITECTURE_SUMMARY.md     # Technical overview and design decisions
│
└── public/                     # Static files (optional web interface)
    └── index.html              # Basic web interface
```

## Key Files

### Core Application
- **`src/index.ts`** - Main MCP server with all 60+ Digistore24 API tools
- **`src/streamable-http.ts`** - HTTP transport with stateless authentication
- **`package.json`** - Project metadata and dependencies

### Documentation  
- **`README.md`** - Complete project overview and quick start
- **`docs/CUSTOMER_SETUP_GUIDE.md`** - Customer-facing setup instructions
- **`docs/CURSOR_SETUP_GUIDE.md`** - Cursor-specific configuration
- **`docs/HOSTING_DEPLOYMENT_GUIDE.md`** - Production deployment guide
- **`docs/ARCHITECTURE_SUMMARY.md`** - Technical architecture overview

### Configuration
- **`tsconfig.json`** - TypeScript compiler settings
- **`.gitignore`** - Git ignore patterns (includes .env)
- **`LICENSE`** - MIT license

## Build Process

1. **Development**: `npm start` (stdio mode for Claude Desktop)
2. **HTTP Mode**: `npm start -- --http` (for hosting)
3. **Build**: `npm run build` (compiles TypeScript to JavaScript)
4. **Production**: `NODE_ENV=production npm start -- --http`

## Documentation Hierarchy

1. **README.md** - Start here for overview
2. **Customer Guides** - For end users setting up AI assistants
3. **Technical Guides** - For developers and deployment
4. **Architecture** - For understanding the technical design

## Ready for Production

- ✅ Clean code structure
- ✅ Comprehensive documentation  
- ✅ Security best practices
- ✅ Customer-ready setup guides
- ✅ Production deployment instructions
- ✅ MIT license for distribution
