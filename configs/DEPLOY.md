# Triển khai VPS (Ubuntu)

> Chi tiết stack & dev xem `README.md`. File này tập trung vào checklist VPS.

## 1. Chuẩn bị

- VPS Ubuntu 22.04+ (Node 20+, MongoDB, Redis, PM2, Nginx).
- DNS: `A` apex → IP; `A` `admin.*`; `A` `api.*`. Mặc định: `cuocbong99.live`, `admin.cuocbong99.live`, `api.cuocbong99.live`.
- Repo nằm tại `/var/87app` (sửa biến `ROOT` trong `deploy/*.cjs` nếu khác).

## 2. Biến môi trường

```bash
cp backend/.env.example   backend/.env
cp frontend1/.env.example frontend1/.env
cp admin/.env.example     admin/.env
cp deploy/env.example     deploy/env.local      # tuỳ chọn
```

Bắt buộc trong `backend/.env`:

- `JWT_SECRET` — chuỗi ngẫu nhiên dài, không dùng giá trị mẫu.
- `DATABASE_URL` — chuỗi kết nối MongoDB.
- `CORS_ORIGIN` — danh sách origin chính (phẩy ngăn cách), ví dụ `https://cuocbong99.live,https://admin.cuocbong99.live`. Bỏ trống / `*` để cho phép tất cả (KHÔNG khuyến nghị production).
- `FRONTEND_URL`, `BACKEND_URL`.

`frontend1/.env` production thường chỉ cần:

```
VITE_API_URL=/api
VITE_ADMIN_URL=https://admin.cuocbong99.live/api
```

(Cùng origin với Nginx, không cần CORS.)

## 3. Build & PM2 & Nginx

```bash
chmod +x deploy/deploy.sh
sudo bash /var/87app/deploy/deploy.sh
```

Hai chế độ:

| Chế độ | Ecosystem | Nginx | FE | Admin | API |
|--------|-----------|-------|----|-------|-----|
| **Mặc định** (khuyên dùng) | `ecosystem.config.cjs` | `deploy/nginx/87app.conf` | Nginx serve `frontend1/dist` | PM2 `vite preview` :8781 | PM2 cluster :8701 |
| Full PM2 SPA | `ecosystem.pm2-spa.cjs` | `deploy/nginx/87app-pm2.conf` | PM2 `serve` :8780 | PM2 `vite preview` :8781 | PM2 :8701 |

Chế độ full PM2 (Nginx proxy :8780/:8781):

```bash
ECOSYSTEM_FILE=ecosystem.pm2-spa.cjs NGINX_CONF_FILE=nginx/87app-pm2.conf sudo bash /var/87app/deploy/deploy.sh
```

PM2 ecosystem alias production (`ecosystem.prod.js` = cùng `ecosystem.config.cjs`).

Chi tiết domain `cuocbong99.live`: `deploy/README-cuocbong99.md`.

## 4. SSL

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx \
  -d cuocbong99.live -d www.cuocbong99.live \
  -d admin.cuocbong99.live -d www.admin.cuocbong99.live \
  -d api.cuocbong99.live
```

## 5. Healthcheck & log

- `GET https://api.cuocbong99.live/health` → `{"status":"ok"}`
- `pm2 status` / `pm2 logs 87app-api --lines 200`
- Nginx: `/var/log/nginx/87app-*.log`

## 6. Cập nhật mã nguồn

```bash
cd /var/87app && git pull
sudo bash deploy/deploy.sh         # tự rebuild + reload
```

Build chỉ một phần (skip flags):

```bash
SKIP_BACKEND=1 SKIP_ADMIN=1 sudo bash deploy/deploy.sh   # chỉ FE
```
