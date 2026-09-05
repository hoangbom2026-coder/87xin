# CLEANUP_POLICY — Quy Trình Dọn Dẹp Mã Nguồn

_Ngày áp dụng: 2026-09-04_
_Vai trò: Hermes (Người gác cổng)_

---

## 1. QUY TẮC "ĐÈN XANH" — Xóa không cần hỏi

Mọi thư mục hoặc file có đặc điểm sau **được phép xóa ngay** khi dry-run xác nhận:

| Loại | Pattern | Ví dụ |
|---|---|---|
| Thư mục `.old` | `*.old/` | `dist.old/`, `libs.old-root/` |
| Thư mục `.backup` | `*.backup/` | `infra.backup/` |
| Thư mục `.tmp` | `*.tmp/` | `build.tmp/` |
| File log cũ | `*.log` (trừ log hiện tại của ứng dụng) | `debug.log`, `npm-debug.log` |
| Thư mục trống | Chỉ chứa `.DS_Store` hoặc `Thumbs.db` | Thư mục rỗng bất kỳ |

---

## 2. QUY TẮC "ĐÈN VÀNG" — Cần hỏi trước khi xóa

Mọi file có đặc điểm sau **PHẢI gửi danh sách cho User duyệt trước** khi xóa:

| Loại | Điều kiện | Lý do |
|---|---|---|
| File `.js` / `.ts` ngoài vùng | Không nằm trong `apps/`, `libs/`, hoặc `configs/` | Có thể là config build hoặc tool script quan trọng |
| File cấu hình trùng lặp | Hai file cấu hình khác nhau trong khi đã có root config | Cần xác nhận cái nào là source of truth |

---

## 3. QUY TRÌNH DỌN RÁC (Dry-run First)

### Bước 1: Quét & Liệt kê
- Tìm các file/thư mục thuộc chính sách dọn dẹp.
- Xuất bảng danh sách (tên file, lý do, severity: XANH/VÀNG).
- Gửi cho User duyệt (dạng bảng).

### Bước 2: Duyệt
- User gõ **"Duyệt"** -> Hermes được phép xóa các mục đã liệt kê.
- Nếu User gõ **"Bỏ qua [tên file]"** -> Bỏ qua file đó, xóa phần còn lại.

### Bước 3: Xóa & Verify
- Thực hiện xóa theo danh sách đã duyệt.
- Chạy `npm run typecheck` tại root để đảm bảo không gãy import.
- Báo cáo kết quả: số file đã xóa, số file bỏ qua, kết quả typecheck.

---

## 4. LOG DỌN DẸP

Mỗi lần dọn dẹp, ghi nhận vào `docs/99-reports/audits/CLEANUP_LOG.md`:
- Ngày thực hiện.
- Danh sách file đã xóa.
- Kết quả typecheck.
- Người duyệt (User).

---

_Luôn tuân thủ: Không xóa file mà chưa có sự đồng ý của User đối với các mục "Đèn Vàng"._
