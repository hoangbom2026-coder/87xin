# TASK-001: Refactor Role Controller to Service Pattern

### Task ID: TASK-001
### Title: Refactor Role Controller to Service Pattern
### Priority: 🟠 HIGH

---

## 1. Scope
- **Files bị ảnh hưởng:**
  - `apps/backend/src/main/controllers/role.controller.ts` (Refactor: loại bỏ try/catch parsing và direct error mapping, chuyển sang Controller-Service chuẩn)
  - `apps/backend/src/main/services/role.service.ts` (Bổ sung domain errors, chuyển logic seed và validation vào service)
  - `apps/backend/src/main/routes/role.router.ts` (Kiểm tra route bindings)
- **Nguyên tắc cần tuân thủ (Trích từ DEV_STANDARD & ARCH_BLUEPRINT):**
  - "Controller chỉ nhận request (validate/parse) và gọi Service. Không được chứa logic nghiệp vụ hay database queries."
  - "Mọi phản hồi lỗi phải thông qua `ApiError` hoặc middleware `error.ts` theo chuẩn `{ success: false, error: { code, message } }`."
  - "Dependency Rule: Apps -> Libs. Tuyệt đối không import App -> App."

---

## 2. Implementation Steps

1. **Refactor Service Layer (`apps/backend/src/main/services/role.service.ts`):**
   - Đảm bảo `createRole`, `updateRole`, `deleteRole` ném `ApiError` với đúng mã HTTP (`BAD_REQUEST`, `FORBIDDEN`, `NOT_FOUND`) thay vì generic `Error` (để loại bỏ chuỗi so sánh `msg.includes('không thể')` ở tầng controller).
   - Đóng gói hàm `getRolesList()` tự động kiểm tra và seed role nếu cần, trả về danh sách role.
   - Thêm typing rõ ràng cho input `ICreateRoleInput`, `IUpdateRoleInput` và return type `Promise<IRole>`.

2. **Refactor Controller Layer (`apps/backend/src/main/controllers/role.controller.ts`):**
   - Rút gọn toàn bộ controller functions về dạng chuẩn:
     - `getPermissionCatalog`: Gọi `roleService.getPermissionCatalog()`, trả về response.
     - `getRoles`: Gọi `roleService.getRoles()`, trả về response.
     - `getRole`: Lấy `req.params.roleId`, gọi `roleService.getRoleById()`, trả về response.
     - `createRole`: Gọi `roleService.createRole(req.body)`, trả về status 201.
     - `updateRole`: Lấy `req.params.roleId`, gọi `roleService.updateRole()`, trả về response.
     - `deleteRole`: Lấy `req.params.roleId`, gọi `roleService.deleteRole()`, trả về `{ success: true, message: 'Role deleted' }`.
   - Bỏ toàn bộ block try/catch thủ công; để `catchAsync` tự động chuyển tiếp error sang global `errorHandler`.

3. **Cập nhật & Bổ sung Unit Tests:**
   - Tạo file test `apps/backend/src/main/services/__tests__/role.service.spec.ts` kiểm thử các luồng: `listRoles`, `createRole`, `updateRole` (không cho sửa system role), `deleteRole` (không cho xóa system role).

---

## 3. Verification Criteria
- [ ] Controller `role.controller.ts` không còn chứa `try/catch` thủ công hay chuỗi so sánh lỗi.
- [ ] `role.service.ts` quản lý toàn bộ logic nghiệp vụ, ném `ApiError` chuẩn.
- [ ] `cd apps/backend && npm run test` chạy pass toàn bộ test case của role service.
- [ ] `cd apps/backend && npm run typecheck` không có lỗi TypeScript.
- [ ] Tuân thủ Dependency Rule (Imports từ `@main/services`, `@utils/ApiError`, `@game/*`).
