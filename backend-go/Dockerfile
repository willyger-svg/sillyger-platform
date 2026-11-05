# Multi-stage build for ultra-small, lightning-fast Go container
FROM golang:1.27-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o sillyger-server ./cmd/server

# Final scratch/alpine runner
FROM alpine:latest

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/sillyger-server .

EXPOSE 8080

CMD ["./sillyger-server"]
