# HERMES PROMPT — Phase 1: Security Hardening

## Mục tiêu

Giải quyết các vấn đề bảo mật nghiêm trọng nhất trong backend của project `/var/app/game`.

---

## CONTEXT TRƯỚC KHI CHẠY

Đọc `AGENTS.md` và các file sau trước khi làm bất cứ điều gì:

- `game/AGENTS.md`
- `game/docs/AI/BASELINE.md`
- `game/docs/AI/ARCHITECTURE.md`
- `game/docs/AI/DECISIONS.md`
- `game/backend/src/app.ts`
- `game/backend/src/middlewares/auth.ts`
- `game/backend/src/main/routes/auth.router.ts`
- `game/backend/src/main/routes/verify.router.ts`
- `game/backend/package-lock.json` (phần dependencies)

---

## CRITICAL FACTS ĐÃ BIẾT

1. Backend CHƯA có `node_modules` — phải install trước khi build/test
2. Backend dùng `pnpm` (có `pnpm-lock.yaml`) nhưng CŨNG có `package-lock.json` (npm). Dùng `npm install` để install (npm lock file có mặt).
3. Hiện tại KHÔNG có `helmet` và KHÔNG có `express-rate-limit` trong dependencies
4. `user.model.ts` KHÔNG tồn tại trong `src/main/models/` — file bị thiếu hoặc gitignored. `user.service.ts` import `IUser` từ `@main/models/user.model` → cần điều tra trước khi sửa auth middleware
5. TypeScript config: `noImplicitAny: false`, `strictNullChecks: false` — không strict, cẩn thận khi thêm types
6. Backend dùng Express 4.x với TypeScript target ES6

---

## PHẠM VI TASK NÀY

Chỉ thực hiện **4 việc** theo thứ tự sau. KHÔNG làm thêm gì ngoài danh sách này:

### Task 1.1 — Giảm JSON body limit

**File:** `game/backend/src/app.ts`

**Vấn đề:** `express.json({ limit: '500mb' })` là DoS risk — bất kỳ client nào cũng có thể gửi 500MB payload để exhaust server memory.

**Yêu cầu:**
- Đổi `express.json({ limit: '500mb' })` → `express.json({ limit: '10mb' })`
- Đổi `express.urlencoded({ limit: '500mb', extended: true })` → `express.urlencoded({ limit: '10mb', extended: true })`
- Kiểm tra các route upload media — upload dùng `multer` (trong `upload-media.ts` middleware), KHÔNG đi qua JSON body parser. Việc giảm JSON limit KHÔNG ảnh hưởng đến file upload.
- Ghi ADR vào `docs/AI/DECISIONS.md`

### Task 1.2 — Thêm Helmet.js

**File:** `game/backend/src/app.ts`

**Vấn đề:** Không có HTTP security headers (X-Content-Type-Options, X-Frame-Options, HSTS, CSP...).

**Yêu cầu:**
- Install `helmet` và `@types/helmet`: `npm install helmet && npm install --save-dev @types/helmet`
- Thêm `import helmet from 'helmet';` vào `app.ts`
- Thêm `app.use(helmet());` TRƯỚC tất cả các middleware khác (sau `app.use(compression())` nhưng trước `app.use(cors(...))`)
- Ghi ADR vào `docs/AI/DECISIONS.md`

### Task 1.3 — Rate limiting trên auth endpoints

**File:** `game/backend/src/main/routes/auth.router.ts`, `game/backend/src/main/routes/verify.router.ts`

**Vấn đề:** Không có rate limiting trên login, register, forgot-password, reset-password, OTP endpoints — dễ bị brute force và OTP enumeration.

**Yêu cầu:**
- Install: `npm install express-rate-limit`
- Tạo file `game/backend/src/middlewares/rate-limit.ts` với các rate limiters:
  - `authLimiter`: 10 requests / 15 phút / IP — dùng cho login, register, forgot-password
  - `otpLimiter`: 5 requests / 15 phút / IP — dùng cho OTP/verify endpoints
- Áp dụng `authLimiter` vào `auth.router.ts` cho các route: `POST /login`, `POST /register`, `POST /admin-login`, `POST /forgot-password`, `POST /reset-password`, `POST /affiliate/login`, `POST /affiliate/register`
- Áp dụng `otpLimiter` vào `verify.router.ts` cho tất cả routes
- Ghi ADR vào `docs/AI/DECISIONS.md`

Rate limiter response format:
```json
{ "code": 429, "message": "Too many requests, please try again later." }
```

### Task 1.4 — Type safety cho req.user

**File:** `game/backend/src/middlewares/auth.ts`

**Vấn đề:** `req.user?: any` — không có type safety, dễ gây runtime error khi access user fields.

**Yêu cầu:**
1. Trước tiên: inspect `game/backend/src/main/services/user.service.ts` để hiểu `IUser` đến từ đâu
2. Vì `user.model.ts` không tồn tại trong `src/main/models/`, cần tìm xem `IUser` được định nghĩa ở đâu (có thể trong compiled dist hoặc file khác)
3. Nếu `IUser` không tồn tại: tạo `game/backend/src/types/user.types.ts` với interface `IAuthUser` chứa các fields cần thiết từ user document (tối thiểu: `_id`, `username`, `role`, `isActive`, `currencyId`)
4. Thay `user?: any` bằng `user?: IAuthUser` trong `AuthRequest`
5. KHÔNG thay đổi business logic — chỉ thêm type annotation

---

## WORKFLOW BẮT BUỘC

```
DISCOVER (đọc files liên quan)
→ PLAN (liệt kê files sẽ thay đổi)
→ IMPLEMENT (task 1.1 → 1.2 → 1.3 → 1.4, từng task một)
→ TEST (sau mỗi task: npm run typecheck && npm run lint)
→ VERIFY (npm run build cuối cùng)
→ DOCUMENT (cập nhật DECISIONS.md, CHANGELOG.md)
```

---

## COMMANDS ĐỂ CHẠY

```bash
cd /var/app/game/backend

# Install dependencies trước
npm install

# Sau mỗi task:
npm run typecheck    # hoặc npx tsc --noEmit
npm run lint

# Cuối cùng:
npm run build
```

---

## DEFINITION OF DONE

Task này HOÀN THÀNH khi:

- [ ] `express.json` limit đã giảm xuống `10mb`
- [ ] `helmet` đã được install và áp dụng trong `app.ts`
- [ ] `express-rate-limit` đã được install
- [ ] `rate-limit.ts` middleware đã tạo
- [ ] `authLimiter` đã áp dụng trên auth routes
- [ ] `otpLimiter` đã áp dụng trên verify routes
- [ ] `req.user` đã có type (không còn `any`)
- [ ] `npm run typecheck` — PASS
- [ ] `npm run lint` — PASS (hoặc chỉ warnings, không errors)
- [ ] `npm run build` — PASS
- [ ] `docs/AI/DECISIONS.md` đã cập nhật
- [ ] `docs/AI/CHANGELOG.md` đã cập nhật

---

## COMPLETION REPORT FORMAT

Khi hoàn thành, báo cáo theo format:

### Changed
- files đã sửa / tạo mới

### Tests
- typecheck: pass/fail
- lint: pass/fail
- build: pass/fail

### Problems Found
- bugs phát hiện trong quá trình làm

### Remaining
- việc chưa làm trong task này (nếu có)

### Next Step
- Phase 2: Thêm test infrastructure (Vitest) cho backend
