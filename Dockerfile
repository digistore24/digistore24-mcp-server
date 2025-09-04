# Use the official Node.js 20 Alpine image for smaller size
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Dependencies stage
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS builder

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM base AS runner

# Set NODE_ENV to production
ENV NODE_ENV=production

# Don't run as root
USER nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/build ./build
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Expose port (for HTTP transport mode)
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command - can be overridden for different transport modes
CMD ["node", "build/index.js"]
