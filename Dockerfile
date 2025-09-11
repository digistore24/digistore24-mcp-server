# Optimized Dockerfile for Digistore24 MCP Server with BuildKit optimizations
# NOTE: Use BuildKit for better caching and performance

# Define ARGs for user ID and group ID with defaults for flexibility
ARG USER_UID=1001
ARG USER_GID=1001
ARG NODE_VERSION=20

# Define ARGs for environment configuration
ARG NODE_ENV=production

# Multi-stage build for Digistore24 MCP Server
# Stage 1: Build stage
FROM node:${NODE_VERSION}-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation using --link for better caching
COPY --link package*.json ./

# Install all dependencies with cache mount for better performance
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production=false

# Copy source code using --link for better layer caching
COPY --link . .

# Build the TypeScript project
RUN npm run build

# Stage 2: Production stage
FROM builder AS production

# Define ARGs again for this stage
ARG USER_UID=1001
ARG USER_GID=1001
ARG NODE_ENV=production

# Group environment variables together to reduce layers
ENV NODE_ENV=${NODE_ENV} \
    USER=digistore24 \
    USER_UID=${USER_UID} \
    USER_GID=${USER_GID}

# Install system packages
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache dumb-init ca-certificates

# Create non-root user for security with configurable UID/GID
RUN addgroup -g ${USER_GID} -S nodejs && \
    adduser -S ${USER} -u ${USER_UID} -G nodejs -s /bin/sh && \
    mkdir -p /app && \
    chown -R ${USER}:nodejs /app

# Set working directory
WORKDIR /app

# Copy package files using --link for better caching
COPY --link package*.json ./

# Install only production dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/home/${USER}/.npm \
    npm ci --only=production && \
    npm cache clean --force && \
    chown -R ${USER}:nodejs /app/node_modules

# Copy built application from builder stage using --link and proper ownership
COPY --link --from=builder --chown=${USER}:nodejs /app/build ./build
COPY --link --from=builder --chown=${USER}:nodejs /app/docs ./docs
COPY --link --from=builder --chown=${USER}:nodejs /app/README.md ./README.md
COPY --link --from=builder --chown=${USER}:nodejs /app/LICENSE ./LICENSE

# Switch to non-root user
USER ${USER}

# Expose port (hardcoded since app uses command-line args, not env vars)
EXPOSE 3000

# Enhanced health check with better timing
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Use exec form of CMD for better signal handling
CMD ["node", "build/index.js", "--transport=streamable-http"]
