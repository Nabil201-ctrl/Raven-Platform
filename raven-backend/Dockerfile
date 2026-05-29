# =========================================================
# Stage 1: Build & Compiling the NestJS TypeScript project
# =========================================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy codebase
COPY . .

# Run build command (generates the dist/ directory)
RUN npm run build

# =========================================================
# Stage 2: Install Only Production-grade Dependencies
# =========================================================
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Clean install only production dependencies
RUN npm ci --only=production

# =========================================================
# Stage 3: Lightweight, Optimized Production Runner
# =========================================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Apply secure default NODE_ENV
ENV NODE_ENV=production

# Security: Create app directories and run under a non-root system user
RUN mkdir -p data && chown -R node:node /usr/src/app

USER node

# Copy compiled build output and production node_modules from builder/dependencies stages
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node --from=dependencies /usr/src/app/node_modules ./node_modules
COPY --chown=node:node /usr/src/app/package.json ./package.json

# Declare data volume mount point for persistent JSON-based DB state
VOLUME ["/usr/src/app/data"]

# Expose production service port
EXPOSE 5000

# Health check using built-in node client (maintains slim image by not requiring curl/wget)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.request({ host: 'localhost', port: process.env.PORT || 5000, path: '/api/health', method: 'GET', timeout: 2000 }, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the application in production
CMD ["node", "dist/main.js"]
