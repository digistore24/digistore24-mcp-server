# Project Structure

```
digistore24-mcp-server/
├── README.md                    # Main project documentation
├── LICENSE                      # MIT License
├── Dockerfile                   # Production Docker image
├── .dockerignore               # Docker build optimization
├── docker-compose.yml          # Development/testing setup
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
└── docs/                       # Documentation
    ├── CUSTOMER_SETUP_GUIDE.md     # Customer-facing setup instructions (primary)
    ├── CURSOR_SETUP_GUIDE.md       # Specific instructions for Cursor users
    └── ARCHITECTURE_SUMMARY.md     # Technical overview and design decisions
```

## Key Files

### Core Application
- **`src/index.ts`** - Main MCP server with all 60+ Digistore24 API tools
- **`src/streamable-http.ts`** - HTTP transport with stateless authentication
- **`package.json`** - Project metadata and dependencies

### Documentation  
- **`README.md`** - Complete project overview and quick start
- **`docs/CUSTOMER_SETUP_GUIDE.md`** - **Customer-facing setup instructions** (primary guide)
- **`docs/CURSOR_SETUP_GUIDE.md`** - Cursor-specific configuration
- **`docs/HOSTING_DEPLOYMENT_GUIDE.md`** - Internal deployment guide (for Digistore24 team)
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
2. **Customer Guides** - **Primary focus** - For end users setting up AI assistants
3. **Technical Guides** - For internal team deployment and maintenance
4. **Architecture** - For understanding the technical design

## Ready for Production

- ✅ Clean code structure
- ✅ Comprehensive documentation  
- ✅ Security best practices
- ✅ **Customer-ready setup guides** (primary focus)
- ✅ Production deployment instructions (internal use)
- ✅ MIT license for distribution
- ✅ **Hosted service approach** (no self-hosting for customers)
