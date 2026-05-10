# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodeuser && \
    adduser --system --uid 1001 nodeuser

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

LABEL org.opencontainers.image.title="Finance Tracker - Frontend"
LABEL org.opencontainers.image.description="Next.js frontend for personal finance management application"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.authors="Finance Tracker Team"

USER nodeuser

EXPOSE 3000

CMD ["node_modules/.bin/next", "start"]
