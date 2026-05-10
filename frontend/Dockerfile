# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the Angular application for production
RUN npm run build

# Stage 2: Runner (nginx)
FROM nginx:alpine AS runner

# Install necessary tools for the entrypoint script
RUN apk add --no-cache sed

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built Angular application from the builder stage
# Angular 21 output path: dist/finance-tracker/browser/
COPY --from=builder /app/dist/finance-tracker/browser /usr/share/nginx/html

# Copy the docker entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

LABEL org.opencontainers.image.title="Finance Tracker - Frontend"
LABEL org.opencontainers.image.description="Angular frontend for personal finance management application"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.authors="Finance Tracker Team"

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
