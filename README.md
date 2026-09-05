# 87app — TC Gaming workspace

Stack: **Node/Express + MongoDB** (backend, port `8701`) · **Vite/React** (admin port `8781`, frontend port `3000`) · **PM2 + Nginx**.

```
/var/app/game
├── apps/backend/          Express API, MongoDB, JWT, socket.io
├── apps/admin-dashboard/  Vite + React admin panel
├── apps/frontend-web/     Vite + React user site
├── apps/hermes-vscode-extension/  VS Code extension
├── libs/                  Shared packages
├── infra/                 Deploy, PM2, Nginx va systemd
├── docs/                  Architecture, operations and AI documentation
└── tools/hermes/          Hermes tooling
```

Chi tiet cau truc hien tai nam trong [`docs/01-codebase/DIRECTORY_STRUCTURE.md`](docs/01-codebase/DIRECTORY_STRUCTURE.md). Mau bien moi truong dung cho local nam trong [`.env.example`](.env.example). Khong commit secret production.

## 1. Yêu cầu hệ thống

- Node 20+, npm 10+ (hoặc pnpm)
- MongoDB 6+, Redis 7+ (tuỳ chọn)
- Nginx, PM2 (`npm i -g pm2`)
- Ubuntu 22.04 hoặc tương đương

## 2. Chuẩn bị `.env`

```bash
cp .env.example apps/backend/.env
# Tao env rieng cho frontend/admin neu cac app do yeu cau bien VITE_*
```

Bắt buộc đặt `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN` thực tế trong `backend/.env`. Backend dùng `Joi` validate khi boot — biến thiếu sẽ fail nhanh.

## 3. Chạy local (dev)

```bash
# 1. backend
cd apps/backend && npm i && npm run dev          # http://localhost:8701

# 2. frontend1 (Vite tự proxy /api → :8701 qua VITE_API_PROXY_TARGET)
cd ../frontend-web && npm i && npm run dev     # http://localhost:3000

# 3. admin (tuỳ chọn)
cd ../admin-dashboard && npm i && npm run dev         # http://localhost:8781
```

Lưu ý: nếu để `VITE_API_URL=/api` trong `frontend1/.env`, mọi request `/api/*` sẽ qua Vite proxy → backend (không cần CORS local).

## 4. Build production

```bash
cd apps/backend        && npm run build
cd apps/frontend-web   && npm run build      # -> dist/
cd apps/admin-dashboard && npm run build     # -> dist/
```

Hoặc một lệnh:

```bash
sudo bash /var/87app/deploy/deploy.sh
```

Script `deploy.sh`:
1. `tsc` backend → `backend/dist`
2. `vite build` frontend1 và admin → `dist/`
3. Symlink `deploy/nginx/87app.conf` → `/etc/nginx/sites-enabled/`
4. `pm2 reload` ecosystem (mặc định `ecosystem.config.cjs`)

Chế độ full SPA qua PM2 (FE/admin chạy `vite preview` thay vì Nginx static):

```bash
ECOSYSTEM_FILE=ecosystem.pm2-spa.cjs sudo bash /var/87app/deploy/deploy.sh
```

## 5. Cổng & domain

| Service    | Port  | Domain (mặc định)            |
|------------|-------|-------------------------------|
| backend    | 8701  | `https://tc-gaming.live/api`      |
| admin      | 8781  | `admin.tc-gaming.live`       |
| frontend   | 80/443| `tc-gaming.live` (Nginx static `apps/frontend-web/dist`) |

Frontend prod gọi API theo `VITE_API_URL=/api` (cùng origin, Nginx proxy `/api/` và `/socket.io` về `:8701`).

## 6. SSL

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx \
  -d tc-gaming.live -d www.tc-gaming.live \
  -d admin.tc-gaming.live
```

## 7. Healthcheck

- `GET https://tc-gaming.live/api/health` → `{ status: "ok" }`
- `pm2 status`
- `pm2 logs 87app-api --lines 200`

## 8. Tài liệu thêm

- [`DEPLOY.md`](DEPLOY.md) — checklist deploy nhanh
- [`frontend1/STANDARDIZATION.md`](frontend1/STANDARDIZATION.md) — chuẩn UI/i18n
- [`frontend1/DEPLOYMENT.md`](frontend1/DEPLOYMENT.md) — chi tiết build FE
- [`backend/README.md`](backend/README.md)
