# DAY-006 — Security audit & cleanup

> **Mục tiêu:** Fix secrets, hardening production config, dọn infra
> Điều kiện: DAY-001 → DAY-003 đã xong (backend build clean)

---

## Bước 1 — Security scan toàn bộ

```bash
# CHANGE_ME trong env
grep -rn "CHANGE_ME" /var/app/game/.env.production

# Hardcoded secrets trong code
grep -rn "password\|secret\|api.key\|apikey" \
  /var/app/game/apps/backend/src \
  --include="*.ts" -i | grep -v "process\.env\|req\.body\|config\.\|hash\|isPasswordMatch\|// " | head -20

# Kiểm tra .gitignore
cat /var/app/game/.gitignore | grep -E "\.env|dist|secret"
```

---

## Bước 2 — Kiểm tra và generate JWT_SECRET thực

**Kiểm tra:** `apps/backend/.env` có tồn tại không?

```bash
ls /var/app/game/apps/backend/.env 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

Nếu MISSING → tạo từ template:
```bash
cp /var/app/game/.env.production /var/app/game/apps/backend/.env
```

**Generate JWT_SECRET thực:**
```bash
openssl rand -hex 32
```

Hướng dẫn user: thay `CHANGE_ME_use_openssl_rand_hex_32` bằng giá trị vừa generate.
**KHÔNG commit file `.env` vào git.**

---

## Bước 3 — Kiểm tra CORS config

Đọc `apps/backend/src/config/index.ts`.

Verify:
- `corsOrigin` đọc từ `CORS_ORIGIN` env var ✅
- Không hardcode origin nào trong code
- Fallback `['*']` chỉ cho dev, không cho production

Nếu có vấn đề → fix trong `config/index.ts`.

---

## Bước 4 — Kiểm tra rate limiting

Đọc `apps/backend/src/middlewares/rate-limit.ts`.

Verify theo ADR-010:
- Auth routes: 10 req/15min/IP
- OTP routes: 5 req/15min/IP
- Nếu thiếu → thêm

---

## Bước 5 — Kiểm tra helmet config

Đọc `apps/backend/src/app.ts` — `helmet()` configuration.

Verify:
- `helmet()` là middleware đầu tiên ✅
- Content-Security-Policy không block Socket.IO connections

---

## Bước 6 — Kiểm tra `.gitignore` hoàn chỉnh

Đọc `.gitignore` hiện tại. Đảm bảo có:

```gitignore
# Env & secrets
.env
.env.*
apps/**/.env
apps/**/.env.*
!.env.example
!**/.env.example

# Build
apps/*/dist/
dist/
node_modules/

# Logs
*.log
infra/logs/

# System
.DS_Store
Thumbs.db
```

Thêm nếu thiếu.

---

## Bước 7 — Kiểm tra và dọn infra

```bash
ls /var/app/game/infra/
```

Kiểm tra file nào còn lại sau khi đã xóa `ecosystem.prod.js`, `reload.sh`, `ecosystem.config.cjs`:
- Nếu còn file cũ/trùng lặp → xóa
- Đảm bảo `infra/ecosystem.production.cjs` là file PM2 config duy nhất

---

## Bước 8 — Cập nhật `.env.production` với các biến mới từ DAY-002

Đọc `.env.production` hiện tại. Nếu chưa có các biến từ DAY-002 (GS_PAY_*, NOWPAY_*, SLOT_*) → thêm vào section `=== Bổ sung tự động ===` đã có.

---

## Bước 9 — Kiểm tra frontend-web secrets

```bash
grep -rn "http://\|localhost\|127.0.0.1" \
  /var/app/game/apps/frontend-web/src \
  --include="*.ts" --include="*.tsx" | grep -v "// \|test\|spec" | head -10
```

URL backend nên đọc từ `import.meta.env.VITE_API_URL` — không hardcode.

---

## Bước 10 — Tạo `.env.example` files

Tạo `apps/backend/.env.example`:
```bash
# Copy từ .env.production, thay values bằng placeholder
sed 's/=.*/=/' /var/app/game/.env.production | sed 's/CHANGE_ME.*/REQUIRED/' > /var/app/game/apps/backend/.env.example
```

---

## Bước 11 — Git commit

```bash
cd /var/app/game
git add .gitignore
git add apps/backend/.env.example
git add apps/backend/src/middlewares/rate-limit.ts
git add apps/backend/src/app.ts
git add .env.production
git commit -m "security: hardening CORS, rate-limit, gitignore, env.example, infra cleanup"
```

---

## Bước 12 — Cập nhật docs

Append `docs/AI/CHANGELOG.md`:
```markdown
## [DAY-006] <date> — Security audit
- Verified: CORS config, helmet, rate-limiting
- Created: apps/backend/.env.example
- Fixed: .gitignore covers all sensitive files
- Cleaned: infra/ directory (removed legacy configs)
- JWT_SECRET: placeholder documented, instructions given
```

Thêm ADR mới nếu có quyết định security mới:
```markdown
## ADR-012 — Environment secrets management
Date: <date>
Status: ACCEPTED
Decision: All secrets via .env files (gitignored). .env.example committed as template.
```
