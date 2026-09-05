# TASK-002: Refactor Admin Staff Controller to Service Pattern

### Task ID: TASK-002
### Title: Refactor Admin Staff Controller to Service Pattern & DTO Standardization
### Priority: 🟠 HIGH

---

## 1. Scope
- **Files bị ảnh hưởng:**
  - `apps/backend/src/main/controllers/admin-staff.controller.ts` (Refactor: loại bỏ 100% DB query, hash mật khẩu, audit logging trực tiếp và chuyển thành thin controller)
  - `apps/backend/src/main/services/admin-staff.service.ts` (Tạo mới: chứa business logic, tương tác UserModel, bcrypt, adminAuditService, DTO validation)
  - `apps/backend/src/main/routes/admin-staff.router.ts` (Kiểm tra route bindings)
- **Nguyên tắc cần tuân thủ (Trích từ DEV_STANDARD & ARCH_BLUEPRINT):**
  - "Controller CHỈ nhận request, validate/parse và gọi Service. KHÔNG ĐƯỢC CHỨA LOGIC MONGOOSE/DATABASE." (`docs/master/DEV_STANDARD.md`).
  - "Mọi thao tác thay đổi dữ liệu staff (create, update, reset password, downgrade/remove) PHẢI sinh audit log qua `adminAuditService.logAdminAction` trong Service Layer."
  - "Xử lý lỗi: ném `ApiError` với mã HTTP chuẩn (`400 BAD_REQUEST`, `403 FORBIDDEN`, `404 NOT_FOUND`)."

---

## 2. Logic Nghiệp Vụ & DTO Cần Tuân Thủ

### 2.1 DTO Schemas
1. **`IListStaffQuery`**:
   - `keyword?: string` (tìm theo regex case-insensitive trên username, email, phone)
   - `role?: string` (chỉ chấp nhận `owner` hoặc `admin`)
   - `status?: string` (chỉ chấp nhận `active` hoặc `blocked`)
   - `page?: number` (mặc định 1)
   - `limit?: number` (mặc định 50, tối đa 200)

2. **`ICreateStaffDto`**:
   - `username`: string (bắt buộc, không trùng lặp)
   - `email`: string (bắt buộc, không trùng lặp)
   - `password`: string (bắt buộc, hash bcrypt salt 8)
   - `phone?`: string
   - `firstName?`: string
   - `lastName?`: string
   - `role?`: `'admin' | 'owner'` (mặc định `'admin'`)

3. **`IUpdateStaffDto`**:
   - `firstName?`, `lastName?`, `phone?`, `status?` (`'active' | 'blocked'`), `role?` (`'admin' | 'owner' | 'user'`)
   - Không cho phép sửa đổi tài khoản có role `owner` nếu người thực hiện không phải là `owner`.

4. **`IResetStaffPasswordDto`**:
   - `newPassword`: string (bắt buộc, hash bcrypt salt 8)

### 2.2 Các Hàm Của Service Layer (`admin-staff.service.ts`)
- `listStaff(query: IListStaffQuery): Promise<{ items: any[]; total: number; page: number; limit: number }>`
- `createStaff(data: ICreateStaffDto, actor: { id: string; username?: string; role: string; ip?: string }): Promise<any>`
- `updateStaff(targetId: string, data: IUpdateStaffDto, actor: { id: string; username?: string; role: string; ip?: string }): Promise<any>`
- `resetStaffPassword(targetId: string, newPassword: string, actor: { id: string; username?: string; role: string; ip?: string }): Promise<void>`
- `removeStaff(targetId: string, actor: { id: string; username?: string; role: string; ip?: string }): Promise<void>` (chuyển role về `'user'`)

---

## 3. Implementation Steps

1. **Tạo `apps/backend/src/main/services/admin-staff.service.ts`:**
   - Di chuyển `PROJECTION = '_id username email phone role status emailVerified phoneVerified avatar firstName lastName createdAt updatedAt'`.
   - Di chuyển toàn bộ các lệnh `UserModel.find`, `UserModel.countDocuments`, `UserModel.isUsernameTaken`, `UserModel.isEmailTaken`, `UserModel.create`, `UserModel.findByIdAndUpdate`, `bcrypt.hash`, và `adminAuditService.logAdminAction` từ controller sang service.
   - Ném `ApiError` rõ ràng khi username/email đã tồn tại hoặc không tìm thấy user hoặc không đủ quyền sửa `owner`.

2. **Refactor `apps/backend/src/main/controllers/admin-staff.controller.ts`:**
   - Chỉ giữ lại:
     - `listStaff`: parse `req.query` -> gọi `adminStaffService.listStaff` -> `res.send(...)`.
     - `createStaff`: gọi `adminStaffService.createStaff(req.body, { id: req.user.id, username: req.user.username, role: req.user.role, ip: req.ip })` -> `res.status(201).send(...)`.
     - `updateStaff`: gọi `adminStaffService.updateStaff(req.params.id, req.body, ...)` -> `res.send(...)`.
     - `resetStaffPassword`: gọi `adminStaffService.resetStaffPassword(req.params.id, req.body.newPassword, ...)` -> `res.send({ success: true, message: 'Password updated' })`.
     - `removeStaff`: gọi `adminStaffService.removeStaff(req.params.id, ...)` -> `res.send({ success: true, message: 'Staff role removed' })`.
   - Xóa bỏ import `bcrypt`, `UserModel`, `PROJECTION` trong controller.

---

## 4. Verification Criteria
- [ ] `apps/backend/src/main/controllers/admin-staff.controller.ts` KHÔNG CÒN chứa bất kỳ lệnh gọi `UserModel` hay `bcrypt` nào.
- [ ] Mọi business logic và audit log được chuyển vào `apps/backend/src/main/services/admin-staff.service.ts`.
- [ ] `npm run typecheck` tại root không phát sinh lỗi liên quan đến module admin-staff.
- [ ] Tuân thủ triệt để Dependency Rule (Apps -> Libs/Services).
