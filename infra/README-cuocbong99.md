# Triển khai production — cuocbong99.live

Hướng dẫn ngắn cho VPS Ubuntu, stack: **Nginx + PM2 + Node**, repo tại `/var/87app`.

## Điều kiện cần

- Ubuntu 22.04+ (hoặc tương đương), **Node 20+**, **MongoDB**, **Redis** (nếu backend dùng), **PM2**, **Nginx**.
- DNS bản ghi **A** (hoặc AAAA nếu IPv6):
  - `cuocbong99.live`, `www.cuocbong99.live`
  - `admin.cuocbong99.live`, `www.admin.cuocbong99.live`
  - `api.cuocbong99.live` (tuỳ chọn nhưng khuyến nghị cho `/health` và client gọi API riêng subdomain)
- Firewall mở **80**, **443**.

## Cổng và tên PM2 (chuẩn repo)

| Thành phần | Cổng | PM2 `name` (trong ecosystem) |
|-------------|------|------------------------------|
| Backend API | **8701** | `87app-api` |
| Admin (`vite preview`) | **8781** | `87app-admin` |
| Frontend qua PM2 (chỉ chế độ SPA) | **8780** | `87app-frontend1` |

- **Mặc định khuyên dùng:** API + admin chạy PM2; **frontend** do Nginx phục vụ thư mục `frontend1/dist` → file Nginx `deploy/nginx/87app.conf`.
- **Full PM2 SPA:** thêm `serve` cho FE :8780 → `ecosystem.pm2-spa.cjs` + Nginx `deploy/nginx/87app-pm2.conf` (tương đương nội dung `deploy/nginx-cuocbong99.live.conf`).

File PM2:

- `deploy/ecosystem.config.cjs` — production mặc định (API + admin).
- `deploy/ecosystem.prod.js` — **alias** trỏ cùng nội dung `ecosystem.config.cjs`.
- `deploy/ecosystem.pm2-spa.cjs` — API + FE :8780 + admin :8781 (cần `serve` trong `frontend1`).

## Biến môi trường trên server

**Không commit secret.** Tạo file trên server:

```bash
cp backend/.env.example   backend/.env
cp frontend1/.env.example frontend1/.env
cp admin/.env.example     admin/.env
cp deploy/env.example     deploy/env.local    # tuỳ chọn (build Vite / DOMAIN)
```

- **`backend/.env`:** `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`, `BACKEND_URL`, v.v. Port lắng nghe phải khớp **8701** với Nginx và PM2 (`PORT` trong ecosystem ghi đè khi `--update-env`).
- **`frontend1/.env`:** biến `VITE_*` lúc **build**. Ví dụ cùng origin qua Nginx: `VITE_API_URL=/api`, `VITE_ADMIN_URL=https://admin.cuocbong99.live/api`. Nếu build gọi API qua subdomain: dùng URL đầy đủ `https://api.cuocbong99.live/api` (có thể set qua `deploy/env.local` rồi `source` trước build — xem `deploy/env.example`).
- **`admin/.env`:** các `VITE_*` cho admin (theo `admin/.env.example`).

## Thứ tự build

Script `deploy/deploy.sh` thực hiện lần lượt:

1. **Backend:** `tsc` → `backend/dist/`
2. **Frontend1:** `vite build` → `frontend1/dist/`
3. **Admin:** `vite build` → `admin/dist/` (PM2 chạy `vite preview` đọc `dist`)
4. **Nginx:** `nginx -t` và `systemctl reload nginx` (cần quyền root/sudo)
5. **PM2:** `reload` hoặc `start` theo ecosystem

Chạy một lệnh (khuyên dùng sudo để reload Nginx):

```bash
sudo bash /var/87app/deploy/deploy.sh
```

Chỉ build một phần: `SKIP_BACKEND=1`, `SKIP_FRONTEND=1`, `SKIP_ADMIN=1`.

Full PM2 SPA + Nginx proxy:

```bash
ECOSYSTEM_FILE=ecosystem.pm2-spa.cjs NGINX_CONF_FILE=nginx/87app-pm2.conf sudo bash /var/87app/deploy/deploy.sh
```

## Nginx: kiểm tra và reload

```bash
sudo nginx -t && sudo systemctl reload nginx
```

- Symlink site bật bởi script: `/etc/nginx/sites-enabled/87app.conf` → file trong repo (mặc định `deploy/nginx/87app.conf`).
- File tên `cuocbong99.live.conf` trong `sites-enabled` bị **gỡ** để tránh trùng `server_name` với site chính.

## PM2: start / reload

```bash
pm2 status
pm2 logs 87app-api --lines 100
# Sau deploy.sh đã gọi reload/start; tay:
pm2 start /var/87app/deploy/ecosystem.config.cjs
# hoặc
pm2 reload /var/87app/deploy/ecosystem.config.cjs --update-env
pm2 save
```

## SSL (Certbot)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
  -d cuocbong99.live -d www.cuocbong99.live \
  -d admin.cuocbong99.live -d www.admin.cuocbong99.live \
  -d api.cuocbong99.live
```

Gia hạn tự động thường đã cài timer; kiểm tra: `sudo certbot renew --dry-run`.

## Smoke test nhanh

```bash
# API (subdomain hoặc chỉnh Host tùy cấu hình DNS)
curl -fsS https://api.cuocbong99.live/health

# Health qua Nginx chính (nếu backend mount /api/health)
curl -fsS -H 'Host: cuocbong99.live' http://127.0.0.1/api/health

# Trang chủ
curl -I -H 'Host: cuocbong99.live' http://127.0.0.1/
```

Thay `https://` và host cho đúng môi trường sau khi có TLS.

## Tài liệu liên quan

- `DEPLOY.md` — checklist tổng quát VPS.
- `deploy/env.example` — mẫu `env.local` cho biến build.
