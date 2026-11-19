# Oort — Sovereign S3 & High-Performance Mornye NAS Storage

Oort is a sovereign, self-hosted object storage engine and management platform designed for cloud-independence, extreme throughput, and strict security isolation.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │  oort.linuxguy.space (Nginx Ingress) │
                      └──────────────────┬───────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
    ┌───────────────────────────┐                 ┌───────────────────────────┐
    │  Oort Go Backend (:8000)   │                 │     MinIO S3 (:9010)      │
    │  - Sovereign Landing Page │                 │  - Native S3 API / STS   │
    │  - Interactive S3 Console │                 │  - Multi-part upload      │
    │  - Quotas & Presigned URLs│                 │  - Bucket policies        │
    │  - ScyllaDB Authentication│                 └───────────────────────────┘
    └─────────────┬─────────────┘
                  ▼
    ┌───────────────────────────┐
    │     ScyllaDB Cluster      │
    │  - Distributed Users      │
    │  - 256-bit Session Tokens │
    │  - Bucket Metadata        │
    └───────────────────────────┘
```

---

## Core Capabilities

- **Native S3 Compatibility**: Full interoperability with AWS CLI, `boto3`, Terraform S3 backend, and rclone via MinIO.
- **Sovereign Web Console**: Dynamic, real-time bucket explorer with drag-and-drop chunked uploads, audio/video streaming, and object management.
- **Enterprise Session Security**:
  - 256-bit cryptographic session tokens (`crypto/rand`).
  - Session rotation on every authentication event.
  - Automatic sliding session revocation and server-side invalidation.
- **Cloudflare Turnstile Bot Defense**: Seamless invisible security challenge integration on authentication endpoints.
- **Presigned Share Engine**: Time-limited and download-limited cryptographic download links (`/s/{token}`).
- **Hardened Nginx Ingress**: Rate-limiting zones (`auth_limit` at 5 req/min, burst 10) and strict security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `SameSite=Lax`).

---

## Quickstart

### Prerequisites
- Go 1.22+
- ScyllaDB / Cassandra (`127.0.0.1:9042`)
- MinIO (`127.0.0.1:9010`)
- Nginx reverse proxy

### Build and Run
```bash
# Compile binary with embedded templates
go build -o oort .

# Run service
./oort
```

### Systemd Service
```ini
[Unit]
Description=Oort Sovereign S3 & NAS Storage Service
After=network.target docker.service minio.service

[Service]
User=debian
WorkingDirectory=/home/debian/oort
ExecStart=/home/debian/oort/oort
EnvironmentFile=-/etc/oort/turnstile.env
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## License
MIT License. Sovereign, self-hosted, telemetry-free.
