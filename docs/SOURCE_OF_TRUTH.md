# SOURCE_OF_TRUTH.md — Hệ Thống Thẩm Quyền và Quy Tắc Bằng Chứng

_Last updated: 2026-09-04 by Lead Repository Architect_

---

## 1. Thứ Bậc Thẩm Quyền (Authority Order)

Khi có sự bất đồng hoặc mâu thuẫn giữa các nguồn thông tin trong kho mã nguồn `/var/app/game`, thứ bậc thẩm quyền cao nhất được áp dụng theo thứ tự sau:

```
1. LIVE FILESYSTEM & ACTIVE CODE/CONFIGS (Thực tế đĩa cứng)
   └── package.json (root), tsconfig.base.json, apps/*, libs/*, infra/nginx, infra/ecosystem.production.cjs
2. HIẾN PHÁP DỰ ÁN & TIÊU CHUẨN
   └── docs/AI/PROJECT_MEMORY.md, docs/MASTER_ORCHESTRATION.md, docs/master/DEV_STANDARD.md
3. BÁO CÁO PHÁT HIỆN & KIỂM TRA BẰNG CHỨNG
   └── docs/99-reports/audits/REPOSITORY_DISCOVERY.md, docs/AI/BASELINE.md
4. TÀI LIỆU HỆ THỐNG MỞ RỘNG (00-overview → 06-standards)
5. PROMPT LOGS VÀ TÀI LIỆU LỊCH SỬ (Legacy Prompts)
```

---

## 2. Nguyên Tắc Bằng Chứng (Evidence-Based Rule)

1. **Trích Dẫn Bắt Buộc:** Mọi khẳng định kỹ thuật trong tài liệu (port, path, model, package, API contract) PHẢI kèm theo đường dẫn file thực tế chứng minh.
2. **Không Ảo Tưởng (No Hallucination):** Nếu một thành phần chưa thể kiểm chứng trực tiếp từ mã nguồn, ghi rõ trạng thái: `UNKNOWN` hoặc `PARTIALLY VERIFIED`.
3. **Tên Dự Án Thực Tế:** Tuyệt đối không dùng tên của các dự án tiền thân (87xin, AXVN, LKVIP, Cuocbong99). Dự án chính thức duy nhất là **TC-Gaming** (`tc-gaming.live`).
4. **Cô Lập Legacy/Archive:** Các thư mục sau được định danh là **LEGACY / BACKUP / META** và KHÔNG thuộc luồng runtime hoạt động:
   - `/.backup-roots/` — Thư mục lưu trữ backup tạm thời.
   - `/.gemini/` — Cấu hình editor meta.
   - `/libs.old-root/` — Bản sao thư mục root cũ trước khi chuyển đổi quyền.
   - `/libs/*.root/`, `/infra/*.root/` — Các bản snapshot quyền root cũ.
