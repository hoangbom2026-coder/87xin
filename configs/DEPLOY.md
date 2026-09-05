# Triển khai VPS (Ubuntu) — TC-Gaming Monorepo

> Chi tiết stack & dev xem `README.md`. File này tập trung vào checklist VPS.

## 1. Chuẩn bị

- VPS Ubuntu 24.04+ (Node 22+, MongoDB, Redis, PM2, Nginx).
- DNS: `A` apex → IP; `A` `admin.*`. Mặc định: `tc-gaming.live`, `admin.tc-gaming.live`.
- Repo nằm tại `/var/app/game`.

## 2. Biến môi trường

```bash
cp apps/backend/.env.example   apps/backend/.env
cp apps/frontend-web/.env.example apps/frontend-web/.env.production
cp apps/admin-dashboard/.env.example apps/admin-dashboard/.env.production
```

Bắt buộc trong `apps/backend/.env`:

- `JWT_SECRET` — chuỗi ngẫu nhiên dài, không dùng giá trị mẫu.
- `DATABASE_URL` — chuỗi kết nối MongoDB.
- `CORS_ORIGIN` — danh sách origin chính, ví dụ `https://tc-gaming.live,https://admin.tc-gaming.live`.
- `FRONTEND_URL`=https://tc-gaming.live
- `BACKEND_URL`=http://127.0.0.1:8701

`apps/frontend-web/.env.production`:

```
VITE_API_URL=/api
VITE_PUBLIC_SITE_URL=https://tc-gaming.live
VITE_SITE_NAME=TC Gaming
VITE_SUPPORT_EMAIL=support@tc-gaming.live
VITE_TELEGRAM_SUPPORT_URL=https://t.me/tcgaming_support
```

`apps/admin-dashboard/.env.production`:

```
VITE_API_URL=/api
VITE_ADMIN_ALLOWED_HOSTS=admin.tc-gaming.live,localhost,127.0.0.1
ADMIN_PREVIEW_PORT=8781
```

## 3. Build & PM2 & Nginx

```bash
bash /var/app/game/infra/scripts/deploy.sh
```

## 4. HTTPS (Let's Encrypt)

```bash
sudo certbot --nginx \
  -d tc-gaming.live -d www.tc-gaming.live \
  -d admin.tc-gaming.live
```

## 5. Healthcheck

- `GET https://tc-gaming.live/api/health` → `{"status":"ok"}`
- `pm2 status`
- `bash /var/app/game/infra/scripts/monitor.sh`
