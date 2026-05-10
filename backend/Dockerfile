# Stage 1: Build
FROM golang:1.26-alpine AS builder

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /app/server ./cmd/server

# Stage 2: Runtime
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

RUN adduser -D -h /app appuser

WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

COPY --from=builder /src/migrations ./migrations
COPY --from=builder /src/seeds ./seeds

RUN mkdir -p /app/data && chown appuser:appuser /app/data

EXPOSE 8080

USER appuser

LABEL org.opencontainers.image.title="Finance Tracker API" \
      org.opencontainers.image.description="Backend API for personal finance tracking" \
      org.opencontainers.image.source="https://github.com/chamoouske/finance-tracker" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.licenses="MIT"

CMD ["./server"]
