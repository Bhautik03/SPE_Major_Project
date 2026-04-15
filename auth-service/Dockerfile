# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies if needed for builds)
RUN npm install

# Copy source code
COPY . .

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Use production environment
ENV NODE_ENV=production

# Copy only production dependencies from a clean install or previous stage
COPY package*.json ./
RUN npm install --production

# Copy application source
COPY . .

# Expose the service port
EXPOSE 5001

CMD ["node", "index.js"]
