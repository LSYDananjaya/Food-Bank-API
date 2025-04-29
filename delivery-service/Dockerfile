FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Create production image
FROM node:18-alpine

# Set NODE_ENV
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy from build stage
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/src ./src

# Create non-root user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Expose the port the app runs on
EXPOSE 5012

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5012/health || exit 1

# Command to run the application
CMD ["node", "src/server.js"]
