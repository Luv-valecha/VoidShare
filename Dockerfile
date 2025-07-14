# Stage 1: Build frontend
FROM node:18 AS builder

WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Stage 2: Production container
FROM node:18

WORKDIR /app

# Install root dependencies (concurrently)
COPY package.json package-lock.json ./
RUN npm install

# Copy server
COPY server ./server
WORKDIR /app/server
RUN npm install

# Copy built frontend
WORKDIR /app
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/package.json ./frontend/package.json
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/frontend/next.config.mjs ./frontend/next.config.mjs

# Expose only one port (Render expects 3000)
EXPOSE 3000

# Start both servers using concurrently
CMD ["npm", "run", "start"]
