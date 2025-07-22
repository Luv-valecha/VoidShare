# Stage 1: Build Next.js frontend
FROM node:18 AS builder
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Stage 2: Run full app (Next.js + WebSocket)
FROM node:18

WORKDIR /app

# Copy frontend (including .next, node_modules, etc.)
COPY --from=builder /app/frontend ./frontend

# Copy server.js to root
COPY server.js ./server.js

# Copy root-level package.json and install (only for server)
COPY package.json package-lock.json ./
RUN npm install

EXPOSE 3000
CMD ["node", "server.js"]
