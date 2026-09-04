# DAY-003 — Fix rootDir + TypeScript clean (zero errors)

> **Mục tiêu: `npm run typecheck -w apps/backend` → 0 errors**
> Session này xử lý các lỗi còn lại sau DAY-001 và DAY-002.

---

## Bước 1 — Kiểm tra lỗi còn lại

```bash
cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | sort -u
```

Đọc toàn bộ output và phân loại lỗi theo nhóm.

---

## Bước 2 — Fix `rootDir` error

**Lỗi hiện tại:**
```
src/index.ts: File '/var/app/game/libs/db/index.ts' is not under 'rootDir'
src/index.ts: File '/var/app/game/libs/cron/index.ts' is not under 'rootDir'
```

**Đọc trước:** `apps/backend/tsconfig.json` FULL content.

**Fix:** Thêm `"composite": false` và bỏ `rootDir` hoặc dùng `paths` thay vì direct import.

**Cách đúng nhất:** Trong `apps/backend/tsconfig.json`, thay `"rootDir": "src"` bằng cách dùng `include` và bỏ `rootDir` restriction, hoặc thêm `../../libs` vào `include`:

```json
{
  "include": ["src/**/*.ts", "../../libs/**/*.ts"],
  "compilerOptions": {
    "outDir": "dist"
    // bỏ "rootDir" hoặc set thành "." để cover libs
  }
}
```

**Kiểm tra:** Sau khi sửa, `npm run build -w apps/backend` phải tạo ra `dist/` đúng cấu trúc.

---

## Bước 3 — Fix `redis` type declarations

**Lỗi:** `libs/db/index.ts(2,30): error TS2307: Cannot find module 'redis'`

**Kiểm tra:**
```bash
ls /var/app/game/node_modules/@types/redis 2>/dev/null || echo "NO_TYPES"
cat /var/app/game/libs/db/package.json
```

**Fix options:**
- Option A: `redis` v4 has built-in types — `@types/redis` không cần. Kiểm tra version trong `package.json`
- Option B: Nếu dùng `redis@4.x` → types bundled, thêm `"types": ["redis"]` vào tsconfig
- Option C: Nếu `node_modules/redis` chưa install trong `libs/db/` → chạy `npm install` tại root

---

## Bước 4 — Fix ObjectId type mismatches

**Lỗi:** `ag-casino.controller.ts(131,65): Argument of type 'ObjectId' is not assignable to parameter of type 'string'`

**Đọc trước:** `apps/backend/src/main/controllers/ag-casino.controller.ts` dòng 125-135.

**Fix:** Dùng `String(objectId)` hoặc `.toString()` tại điểm bị lỗi.

---

## Bước 5 — Fix remaining `Cannot find module` errors

Với mỗi lỗi còn lại:
1. Đọc file đang báo lỗi
2. Xem method nào được dùng từ module bị thiếu
3. Tạo minimal implementation nếu không tồn tại

---

## Bước 6 — Fix `user.model.ts` errors (nếu còn)

**Đọc:** `apps/backend/src/main/models/user.model.ts`

Sửa type errors theo output của typecheck.

---

## Bước 7 — Fix promotion.router.ts và setting.router.ts

**Đọc cả 2 file.** Nếu chúng import controllers không tồn tại → tạo stub controllers.

---

## Bước 8 — Verify ZERO errors

```bash
cd /var/app/game && npm run typecheck -w apps/backend 2>&1 | grep "error TS" | wc -l
```

**Phải là `0`.** Nếu không phải 0 → đọc từng lỗi còn lại và fix cho đến khi đạt 0.

---

## Bước 9 — Verify build thực sự

```bash
cd /var/app/game && npm run build -w apps/backend 2>&1 | tail -10
ls /var/app/game/apps/backend/dist/index.js && echo "BUILD SUCCESS"
```

---

## Bước 10 — Run tests

```bash
cd /var/app/game && npm run test -w apps/backend 2>&1 | tail -20
```

Tất cả test phải pass (hiện chỉ có `balance.service.spec.ts`).

---

## Bước 11 — Git commit

```bash
cd /var/app/game
git add apps/backend/
git commit -m "fix(backend): achieve zero TypeScript errors, fix rootDir and type mismatches"
```

---

## Bước 12 — Cập nhật docs

Append vào `docs/AI/CHANGELOG.md`:
```markdown
## [DAY-003] <date> — TypeScript clean
- Backend TypeScript errors: N → 0
- Fixed: rootDir, redis types, ObjectId mismatches
- Build verified: dist/index.js generated successfully
- Tests: all pass
```

Cập nhật `docs/AI/ROADMAP.md`:
- Phase 2.1 → ✅ Done nếu Controller-Service boundary clean
- Phase 4.1 → ✅ Done (CI/CD đã có)
