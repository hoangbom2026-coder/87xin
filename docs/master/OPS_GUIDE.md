# OPS_GUIDE — tc-gaming.live

## 1. Deployment
- **Pipeline:** GitHub Actions -> Build -> Push to GHCR (Docker) -> SSH to VPS.
- **Runtime:** Docker Compose (`/infra/docker-compose.yml`).
- **Zero Downtime:** Sử dụng `docker-compose up -d --force-recreate`.

## 2. Cloudflare Rules
- **Cache:** Lưu cache cho `/_next/*`, `/*.js`, `/*.css`, `/images/*`.
- **SSL:** Full/Strict.

## 3. Backup & Security
- **Backup:** Rsync dữ liệu `mongodb/` định kỳ sang backup server.
- **Secrets:** Mọi key/password phải nằm trong `GitHub Secrets`, KHÔNG bao giờ commit vào repo.
