# SYSTEM_COMMAND_CENTER — tc-gaming.live

## 1. MỤC TIÊU TỐI THƯỢNG
Vận hành toàn bộ dự án `/var/app/game` theo mô hình Monorepo chuẩn. 
- Mọi thay đổi phải tuân thủ Dependency Rule (`Apps -> Libs`).
- Mọi logic phải sạch (Controller -> Service).
- Mọi giao diện phải chuẩn (AdminLayout + DataTable).

## 2. QUY TRÌNH "MỘT LỆNH" (THE ONE-COMMAND FLOW)
Khi nhận lệnh từ người dùng (ví dụ: "Hãy làm [Task X]"), Hermes phải:
1. **TRUY VẤN**: Dùng `openviking_query` hoặc `grep` để tìm source code thực tế.
2. **LẬP KẾ HOẠCH**: Tự tạo `TASK-ID.md` trong `.ai/tasks/` (bỏ qua bước người dùng tạo).
3. **THỰC THI**: Gọi tool (Replace, Write_file, Run_shell) để thực hiện task.
4. **KIỂM CHỨNG**: Tự chạy `typecheck` và `test`.
5. **BÁO CÁO**: Trả lời ngắn gọn cho người dùng: "Đã xong [Task X]. Kết quả: [Status]. Đã cập nhật [File tài liệu]."

## 3. CÁC TÀI LIỆU THAM CHIẾU (Nguồn sự thật)
- `docs/master/ARCH_BLUEPRINT.md`: Kiến trúc.
- `docs/master/DEV_STANDARD.md`: Chuẩn code.
- `docs/16-roadmap/ROADMAP.md`: Trạng thái dự án.

## 4. CẤU HÌNH GIAO TIẾP VỚI AGENTS BỔ TRỢ
- Nếu task quá phức tạp (> 20 file), Hermes tự động kích hoạt sub-agent (OpenHands) thông qua lệnh `invoke_agent`.
- Hermes phải đóng vai trò Reviewer cho mọi kết quả mà sub-agent trả về.
