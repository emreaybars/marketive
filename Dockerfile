# Dockerfile for Production Deployment
# Multi-stage build for admin panel + API server

FROM node:20-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Admin panel build stage
FROM base AS admin-build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production dependencies
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --only=production

# API Server Production Image (Widget API)
FROM node:20-alpine AS widget-api
WORKDIR /app
COPY server/package.json ./server/
COPY server/widget-api.js ./server/
COPY public/ ./public/
WORKDIR /app/server
RUN npm ci --only=production
EXPOSE 3001
ENV NODE_ENV=production
CMD ["node", "widget-api.js"]

# Admin Panel Production Image
FROM base AS admin-panel
COPY --from=deps /app/node_modules ./node_modules
COPY --from=admin-build /app/dist ./dist
COPY --from=admin-build /app/package*.json ./
RUN npm ci --only=production
COPY server/ ./server/
COPY public/ ./public/
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "preview"]
