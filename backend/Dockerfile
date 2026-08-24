# Production Backend Dockerfile
FROM node:20-alpine AS base

# Install curl for Docker health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies cleanly
RUN npm ci --only=production

# Copy application source
COPY . .

# Set container security user (non-root)
USER node

# Default environment variables
ENV PORT=8000 \
    NODE_ENV=production

EXPOSE 8000

# Container Healthcheck using healthz endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/healthz || exit 1

CMD ["node", "server.js"]
