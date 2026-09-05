# MASTER ORCHESTRATION — tc-gaming.live

## 1. HỆ TƯ TƯỞNG (CORE ARCHITECTURE)
- **Kiến trúc:** Monorepo (pnpm workspace/path-mapping).
- **Quy tắc phụ thuộc (Dependency Rule):** `Apps -> Libs`, `Libs -> Libs`. **KHÔNG BAO GIỜ** `App -> App`.
- **Nguồn sự thật:** 
  - `tsconfig.base.json`: Path Aliases (`@game/*`).
  - `docs/AI/`: Tài liệu kiến trúc và roadmap.

## 2. QUY TẮC PHÁT TRIỂN (DEVELOPMENT RULES)
- **Backend:** Controller chỉ nhận request, Service chứa logic, Model (Mongoose) ở `libs/models/`.
- **Frontend/Admin:** Bắt buộc dùng `AdminLayout` và `DataTable` từ `@game/ui`.
- **Styling:** Không dùng hard-coded colors. Dùng Tailwind CSS variables (defined in `tailwind.config.ts`).
- **Data Contract:** Mọi API Type nằm ở `@game/types` (`libs/shared-types`).

## 3. QUY TRÌNH TASK (TASK LIFECYCLE)
1. **DISCOVER**: Quét repo, phát hiện vấn đề.
2. **PLAN**: Chia task nhỏ, tạo file `.ai/tasks/`.
3. **EXECUTE**: Làm trên branch `hermes/<task-id>` hoặc `openhands/<task-id>`.
4. **VERIFY**: `npm run typecheck`, `npm run test` (Vitest).
5. **REPORT**: Cập nhật `CHANGELOG.md` và tạo PR vào `main`.

## 4. CI/CD & OPS
- **Build:** GitHub Actions (Cache Docker layers, Push GHCR).
- **Deploy:** SSH -> Docker Compose (`docker-compose up -d --force-recreate`).
- **Monitoring:** Log JSON (Structured Logger), Sentry (tương lai), Swap memory (8GB).

---
## LỆNH KÍCH HOẠT (ONE-COMMAND TRIGGER)
> "Đọc tài liệu `docs/MASTER_ORCHESTRATION.md` và thực thi bước tiếp theo theo Roadmap trong `docs/AI/ROADMAP.md`. Đảm bảo tuân thủ mọi quy tắc đã định nghĩa ở đây."
