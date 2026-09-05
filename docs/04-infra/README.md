# Infrastructure & Deploy — infra/

## Tổng quan

Hạ tầng chạy trên một VPS (Ubuntu), Nginx làm reverse proxy, backend chạy qua PM2 hoặc Docker Compose.

---

## Cấu trúc thư mục

```
infra/
├── env.example                   ← Template biến môi trường
├── ecosystem.production.cjs      ← PM2 production config
├── test.sh                       ← Smoke test script
├── deploy-tc-gaming.sh           ← Deploy script chính
│
├── scripts/
│   ├── deploy.sh                 ← Deploy: rsync + PM2 reload
│   ├── monitor.sh                ← Health monitoring + Telegram alerts
│   ├── rollback.sh               ← Rollback to previous release
│   ├── install-systemd.sh        ← Setup systemd service
│   └── setup-vps.sh              ← VPS initial setup
│
├── scripts.root/                 ← Bản copy scripts ở root level
│
├── nginx/
│   ├── tc-gaming.live.conf       ← Nginx config chính
│   └── snippets/
│       ├── nginx-tuning.conf     ← Performance tuning (worker, gzip, cache)
│       └── socket-io-proxy.conf  ← Socket.io WebSocket proxy config
│
├── systemd/
│   ├── resource-limits.conf      ← systemd resource controls
│   └── swap-setup.service        ← Swap memory management (8GB)
│
└── logs/                         ← Nginx access/error logs
    ├── tc-gaming-admin.access.log
    ├── tc-gaming-admin.error.log
    ├── tc-gaming-frontend.access.log
    └── tc-gaming-frontend.error.log
```

---

## Environment Variables (env.example)

```bash
# Frontend build vars
VITE_HOST_API=https://tc-gaming.live
VITE_API_URL=https://tc-gaming.live/api
VITE_SOCKET_URL=https://tc-gaming.live

# Site identity
VITE_SITE_NAME=TC Gaming
VITE_PUBLIC_SITE_URL=https://tc-gaming.live

# Support
VITE_SUPPORT_EMAIL=support@tc-gaming.live
VITE_TELEGRAM_SUPPORT_URL=https://t.me/tcgaming_support

# Admin dashboard
VITE_ADMIN_ALLOWED_HOSTS=admin.tc-gaming.live,localhost
ADMIN_PREVIEW_PORT=8781

# Domain
DOMAIN=tc-gaming.live
PUBLIC_ORIGIN=https://tc-gaming.live
```

Backend `.env` (không commit — dùng GitHub Secrets hoặc file riêng trên VPS):
```bash
NODE_ENV=production
PORT=8701
MONGODB_URL=mongodb://127.0.0.1:27017/tc-gaming
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=<strong-random-secret>
CORS_ORIGINS=https://tc-gaming.live,https://admin.tc-gaming.live
AG_CASINO_HOST=...
AG_CASINO_MERCHANT_CODE=...
AG_CASINO_SECRET_KEY=...
AG_PAY_HOST=...
AG_PAY_SN=...
AG_PAY_MERCHANT_NAME=...
AG_PAY_SECRET_KEY=...
GSC_OPERATION_CODE=...
GSC_SECRET_KEY=...
SENDGRID_API_KEY=...
TELEGRAM_BOT_TOKEN=...
```

---

## Nginx Config (`nginx/tc-gaming.live.conf`)

```nginx
# Frontend Web — static files
server {
    listen 443 ssl;
    server_name tc-gaming.live www.tc-gaming.live;

    root /var/www/tc-gaming/frontend-web/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:8701;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://127.0.0.1:8701;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Admin Dashboard — static files
server {
    listen 443 ssl;
    server_name admin.tc-gaming.live;

    root /var/www/tc-gaming/admin-dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:8701;
    }
}
```

---

## PM2 Config (`ecosystem.production.cjs`)

```javascript
module.exports = {
  apps: [
    {
      name: 'tc-api',
      script: 'apps/backend/dist/index.js',
      instances: 1,          // Fork mode (bắt buộc cho Socket.io)
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8701,
        NODE_OPTIONS: '--max-old-space-size=512'
      },
      error_file: 'infra/logs/tc-api.error.log',
      out_file: 'infra/logs/tc-api.out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '600M'
    }
  ]
};
```

⚠ **Fork mode bắt buộc** — Cluster mode sẽ phá vỡ Socket.io (cần sticky sessions).

---

## Deploy Script (`scripts/deploy.sh`)

### Quy trình deploy
```bash
# 1. Pull source mới nhất
git -C /var/www/tc-gaming pull origin main

# 2. Install dependencies
npm ci --workspaces --if-present

# 3. Build backend
cd apps/backend && npm run build

# 4. Build frontend
cd apps/frontend-web && npm run build

# 5. Build admin
cd apps/admin-dashboard && npm run build

# 6. PM2 reload (zero-downtime)
pm2 reload tc-api --update-env

# 7. Health check (retry 5 lần, mỗi lần 3s)
for i in {1..5}; do
  curl -sf http://localhost:8701/health && break
  sleep 3
done
```

---

## Monitoring (`scripts/monitor.sh`)

Script chạy định kỳ (cron hoặc systemd timer), gửi alert Telegram khi vượt ngưỡng.

### Thresholds
| Metric | Alert threshold |
|---|---|
| CPU usage | > 75% |
| RAM usage | > 80% |
| Disk usage | > 85% |
| PM2 process `tc-api` | không running |
| Port 8701 | không mở |

### Cách chạy
```bash
# Một lần
bash infra/scripts/monitor.sh

# Cron mỗi 5 phút
*/5 * * * * /bin/bash /var/www/tc-gaming/infra/scripts/monitor.sh >> /var/log/tc-gaming-monitor.log 2>&1
```

### Telegram Alert format
```
[TC-GAMING ALERT] 2024-01-15 14:30:00
Host: tc-gaming-vps
WARNING: CPU usage high: 78%
WARNING: PM2 process tc-api is not running
```

---

## CI/CD Pipeline (GitHub Actions)

### Files
```
.github/workflows/
├── pr-check.yml    ← Pull Request: typecheck
└── deploy.yml      ← Push to main: build + deploy
```

### pr-check.yml
```yaml
on: [pull_request]
jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup Node 20
      - npm ci
      - typecheck backend:  cd apps/backend && npx tsc --noEmit
      - typecheck admin:    cd apps/admin-dashboard && npx tsc --noEmit
      - typecheck frontend: cd apps/frontend-web && npx tsc --noEmit
```

### deploy.yml
```yaml
on:
  push:
    branches: [main]
jobs:
  deploy:
    steps:
      - checkout
      - npm ci
      - build all apps
      - SSH to VPS (secrets: SSH_HOST, SSH_USER, SSH_KEY, SSH_PORT)
      - rsync dist/ files
      - pm2 reload tc-api
      - health check with retry
```

### GitHub Secrets cần thiết
| Secret | Giá trị |
|---|---|
| `SSH_HOST` | IP VPS |
| `SSH_USER` | User SSH (vd: `ubuntu`) |
| `SSH_KEY` | Private key SSH (PEM format) |
| `SSH_PORT` | Port SSH (default: 22) |

---

## VPS Setup (setup-vps.sh)

Chạy một lần khi khởi tạo VPS mới:

```bash
# Packages
apt-get install -y nodejs npm nginx certbot python3-certbot-nginx redis-server

# PM2
npm install -g pm2
pm2 startup systemd

# Swap 8GB
fallocate -l 8G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# SSL
certbot --nginx -d tc-gaming.live -d admin.tc-gaming.live
```

---

## Rollback (`scripts/rollback.sh`)

```bash
# Rollback về release trước
bash infra/scripts/rollback.sh

# Quy trình:
# 1. pm2 stop tc-api
# 2. Restore từ .backup-roots/ hoặc git checkout HEAD~1
# 3. npm ci + build
# 4. pm2 start tc-api
```

---

## Port Reference

| Service | Port | Notes |
|---|---|---|
| Nginx HTTP | 80 | redirect → 443 |
| Nginx HTTPS | 443 | phục vụ static + proxy /api |
| Backend API | 8701 | PM2 managed, không expose ra ngoài |
| MongoDB | 27017 | bind 127.0.0.1 only |
| Redis | 6379 | bind 127.0.0.1 only |
| Admin Dev | 8781 | chỉ dev |
| Frontend Dev | 5173 | chỉ dev |
