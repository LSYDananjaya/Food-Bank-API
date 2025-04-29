FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install build dependencies for native modules and then install dependencies
RUN apk add --no-cache --virtual .gyp python3 make g++ && \
    npm install && \
    apk del .gyp

# Copy application code
COPY . .

# Create production image
FROM node:18-alpine

# Set NODE_ENV
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy package.json files
COPY --from=builder /usr/src/app/package*.json ./

# Install production dependencies only (no devDependencies)
# Make sure to install bcrypt from scratch to compile for the correct architecture
RUN apk add --no-cache --virtual .gyp python3 make g++ && \
    npm install --only=production && \
    apk del .gyp

# Copy source code
COPY --from=builder /usr/src/app/src ./src

# Create non-root user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Expose the port the app runs on
EXPOSE 5003

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5003/health || exit 1

# Command to run the application
CMD ["node", "src/server.js"]
