# Use multi-stage to build Next.js separately
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Copy frontend files
COPY frontend ./frontend

# Install and build frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Final stage: production container
FROM node:18

# Create app directory
WORKDIR /app

# Copy server files
COPY server ./server

# Copy built frontend from builder
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/frontend/next.config.mjs ./frontend/next.config.mjs

# Install any server dependencies if needed
WORKDIR /app/server
RUN npm install

# Expose port
EXPOSE 3000

# Start both servers
WORKDIR /app
CMD node server/server.js & npm --prefix frontend run start
