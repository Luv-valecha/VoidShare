# Stage 1: Build the frontend
FROM node:18 AS builder

WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Stage 2: Final production image
FROM node:18

WORKDIR /app

# Copy server code
COPY server ./server
WORKDIR /app/server
RUN npm install

# Copy frontend build & deps
WORKDIR /app
COPY --from=builder /app/frontend ./frontend

# Install root dependencies (optional, only if needed for server)
COPY package.json package-lock.json ./
RUN npm install || true

# Expose only ONE port for Render
EXPOSE 3000

# Start server (which handles Next.js + WebSocket)
CMD ["node", "server/server.js"]
