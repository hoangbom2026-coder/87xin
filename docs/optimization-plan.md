# TC-Gaming Optimization Plan
## Chuẩn hóa, tối ưu hóa, và hoàn thiện toàn bộ monorepo

---

## Tổng quan

**Mục tiêu:** Đưa 3 app (backend, frontend-web, admin-dashboard) từ trạng thái hoạt động một phần lên production-ready theo các tiêu chí:
1. Tất cả routes backend được mount trong `routes.ts`
2. Frontend-web có đầy đủ page routing và Redux-Saga wired
3. Admin sidebar data đồng bộ với App.tsx routes
4. Shared types được dùng nhất quán từ `@game/shared-types`
5. Không có console.log debug, hardcoded values, hay dead code

**Scope thực tế từ audit:**
- Backend: `routes.ts` chỉ mount 5/50+ routers — 45+ routers chưa được wire
- Frontend-web: `App.tsx` chỉ có 1 route `path="*"` placeholder — toàn bộ pages chưa render
- Frontend-web: `authSaga.ts` yields `all([])` — Redux-Saga chưa có effect nào
- Admin-dashboard: `adminSidebarData.ts` chỉ có 5 nav items thay vì 70+ routes
- Admin-dashboard: `adminAuth.ts` login response dùng `accessToken` nhưng backend trả `token`

**Không làm:**
- Không thêm test infrastructure
- Không đổi tech stack
- Không refactor business logic service files
- Không thêm dependency mới

---

## Sub-task 1 — Backend: Wire tất cả routers vào routes.ts

**Intent:** `routes.ts` hiện chỉ mount 5 routers. Toàn bộ 45+ router còn lại trong `src/main/routes/` chưa được đăng ký, khiến API endpoint không hoạt động dù controller và service đã có.

**Expected Outcomes:**
- Tất cả 50+ routers được mount đúng path trong `routes.ts`
- Không còn router file nào bị bỏ sót
- Thứ tự mount hợp lý: auth → user → payment → game → admin

**Todo List:**
1. Đọc tất cả file trong `src/main/routes/` để liệt kê đầy đủ
2. Xác định path prefix phù hợp cho từng router (quy tắc: tên file bỏ `.router.ts` → kebab-case)
3. Admin routers (`admin-*.router.ts`) mount dưới `/admin/[tên]`
4. Thêm static import cho từng router vào `routes.ts`
5. Mount với `router.use(path, router)` theo nhóm: auth, player, payment, game, affiliate, admin
6. Giữ nguyên `/health` endpoint và 5 route đang có

**Relevant Context:**
- File: `apps/backend/src/routes.ts` — điểm duy nhất cần sửa
- Pattern hiện tại: `router.use('/auth', authRouter)` — giữ nguyên pattern này
- Admin routers cần middleware `admin-only` — kiểm tra từng router có tự include chưa

**Status:** [ ] pending

---

## Sub-task 2 — Frontend-web: Wire App.tsx với tất cả page routes

**Intent:** `App.tsx` hiện render 1 placeholder cho tất cả paths. Codebase đã có đủ 18+ page directories, `routes/ProtectedRoute.tsx`, và `routes/AppRoutes` export — chỉ cần wire vào App.tsx.

**Expected Outcomes:**
- Mỗi page directory có route tương ứng trong App.tsx
- Protected routes (Account, Wallet, Affiliate, VIP, Agency, Store) cần token
- Public routes (Home, Promo, HelpCenter, About, Contact, Privacy, Terms) không cần token
- `SiteProvider` và `SocketContext` được wrap đúng cấp
- Lazy loading cho tất cả pages

**Todo List:**
1. List tất cả page components trong `src/pages/`
2. Tạo lazy import cho mỗi page
3. Phân loại: public pages vs protected pages
4. Wire `SiteProvider` bọc ngoài Router (cần site data cho toàn app)
5. Sửa App.tsx: thêm đầy đủ `<Route>` với path logic đúng
6. Giữ header + LanguageSwitcher, thay phần Routes

**Relevant Context:**
- File: `apps/frontend-web/src/App.tsx` — file chính cần sửa
- `src/routes/ProtectedRoute.tsx` — đã có, check token từ Redux
- `src/contexts/SiteContext.tsx` — cần `SiteProvider` wrap App
- `src/pages/` — 18 directories, mỗi dir có `index.tsx` hoặc named file
- Pattern: pages dùng `React.lazy()` + `Suspense`

**Status:** [ ] pending

---

## Sub-task 3 — Frontend-web: Implement Redux-Saga async effects

**Intent:** `authSaga.ts` và `adminSaga.ts` hiện yields `all([])` — empty. Auth flow cần saga để xử lý login/logout/profile fetch async mà không block UI. `authSlice.ts` đã có actions `setUser, setToken, setLoading, setError, logout`.

**Expected Outcomes:**
- `authSaga.ts` có watcher cho login, logout, fetchProfile
- Login saga: call authService.login → dispatch setToken + setUser hoặc setError
- Logout saga: clear localStorage → dispatch logout action
- FetchProfile saga: call authService.getProfile → dispatch setUser
- rootSaga.ts yields all sagas đúng

**Todo List:**
1. Đọc `authService.ts` để hiểu API interface (login, register, getProfile, logout)
2. Tạo saga effect types (LOGIN_REQUEST, LOGOUT_REQUEST, FETCH_PROFILE_REQUEST)
3. Implement `watchLogin`: takeLatest → call authService.login → dispatch success/error
4. Implement `watchLogout`: takeLatest → call authService.logout → dispatch logout
5. Implement `watchFetchProfile`: takeLatest → call authService.getProfile → dispatch setUser
6. Export `authSaga` function gồm all([watchLogin, watchLogout, watchFetchProfile])
7. Update `rootSaga.ts` để include authSaga

**Relevant Context:**
- File: `apps/frontend-web/src/features/auth/authSaga.ts` — rewrite
- File: `apps/frontend-web/src/store/rootSaga.ts` — update
- File: `apps/frontend-web/src/services/authService.ts` — API calls đã có
- File: `apps/frontend-web/src/features/auth/authSlice.ts` — actions để dispatch
- Redux-Saga pattern: `takeLatest`, `call`, `put`, `select`

**Status:** [ ] pending

---

## Sub-task 4 — Admin-dashboard: Sync sidebar với routes

**Intent:** `adminSidebarData.ts` hiện chỉ có 5 nav items tĩnh. App.tsx đã định nghĩa 70+ routes. Sidebar cần map đầy đủ tất cả routes thành nav tree có grouping và icons.

**Expected Outcomes:**
- `adminSidebarData.ts` có đủ nav items cho tất cả 70+ routes trong App.tsx
- Items được nhóm logic: Dashboard, Users, Finance, Games, Affiliate, Content, System
- Mỗi item có `to`, `icon`, `label` đúng với route path trong App.tsx
- `filterAdminSidebar` function vẫn hoạt động đúng với data mới

**Todo List:**
1. Liệt kê tất cả route paths từ App.tsx admin routes
2. Map từng path thành NavItem với icon phù hợp từ lucide-react
3. Tổ chức thành sections: Core, Finance, Gaming, Marketing, System, VIP/Rewards
4. Với các nhóm con (admin, VIP variants) dùng `AdminNavParent` với `children[]`
5. Verify type compatibility với `AdminNavLeaf | AdminNavParent` interface

**Relevant Context:**
- File: `apps/admin-dashboard/client/components/layout/adminSidebarData.ts` — rewrite
- File: `apps/admin-dashboard/client/App.tsx` — source of truth cho paths
- Interface: `AdminNavLeaf { to, icon, label }`, `AdminNavParent { label, icon, children }`
- Icons từ `lucide-react` (đã installed)

**Status:** [ ] pending

---

## Sub-task 5 — Admin-dashboard: Fix auth token key mismatch

**Intent:** `adminAuth.ts` gọi `setAdminToken(res.accessToken)` nhưng backend `auth.controller.ts` login trả `{ user, token, tokens: { access: { token } } }` — không có field `accessToken`. Dẫn đến login thành công nhưng token không được lưu, mọi request tiếp theo đều 401.

**Expected Outcomes:**
- `adminAuth.ts` extract token đúng từ response structure của backend
- `lib/api.ts` fallback token key consistent (`adminAccessToken` only, bỏ fallback `token`)
- Login flow: form submit → adminLogin() → setAdminToken(token) → navigate /admin/dashboard

**Todo List:**
1. Đọc `auth.controller.ts` adminLogin response: `res.send({ user, token, tokens: { access: { token } } })`
2. Sửa `adminAuth.ts` adminLogin: extract `res.token ?? res.accessToken ?? res.tokens?.access?.token`
3. Sửa `lib/api.ts` ProtectedRoute: chỉ check `adminAccessToken`, không fallback sang `token`
4. Kiểm tra `AuthProvider.tsx` login handler: `setAdminToken(res.accessToken)` → `setAdminToken(resolvedToken)`

**Relevant Context:**
- File: `apps/admin-dashboard/client/lib/adminAuth.ts` — fix token extraction
- File: `apps/admin-dashboard/client/components/auth/AuthProvider.tsx` — fix setAdminToken call
- File: `apps/admin-dashboard/client/App.tsx` — ProtectedRoute token check
- Backend response: `{ user, token, tokens: { access: { token, expires } } }`

**Status:** [ ] pending

---

## Sub-task 6 — Chuẩn hóa shared types: dùng @game/shared-types nhất quán

**Intent:** `libs/shared-types/src/index.ts` định nghĩa `IApiResponseList, IApiError, IUserResponse, IGameResponse`. Nhưng cả frontend-web và admin-dashboard đều định nghĩa lại type tương tự cục bộ. Cần normalize để sử dụng shared types làm nguồn duy nhất.

**Expected Outcomes:**
- `frontend-web/src/types/index.ts` import và re-export từ `@game/shared-types` thay vì duplicate
- `admin-dashboard` dùng `IApiResponseList` thay vì inline `{ items, total, page, limit }`
- `ApiResponse<T>` trong frontend-web extend hoặc align với `@game/shared-types` pattern

**Todo List:**
1. Đọc `libs/shared-types/src/index.ts` và `frontend-web/src/types/index.ts` hiện tại
2. Identify overlap: `IApiResponseList` ↔ `ApiResponse<T[]>`, `IUserResponse` ↔ `User`
3. Extend shared-types nếu frontend cần thêm field (balance, vipLevel, etc.)
4. Update `frontend-web/src/types/index.ts` để import từ `@game/shared-types`
5. Verify `tsconfig.base.json` paths đã có `@game/shared-types` entry
6. Chỉ sửa type definitions, không sửa service/component logic

**Relevant Context:**
- File: `libs/shared-types/src/index.ts` — source of truth
- File: `apps/frontend-web/src/types/index.ts` — cần update
- Path alias: `@game/shared-types` → `libs/shared-types/src/index.ts` (đã trong tsconfig.base.json)

**Status:** [ ] pending

---

## Sub-task 7 — Frontend-web: Implement siteService và wire SiteContext

**Intent:** `SiteContext.tsx` import `getSiteData` từ `../services/siteService` nhưng `siteService.ts` có thể chưa tồn tại hoặc chưa đầy đủ. `useSite()` hook đã có nhưng `SiteProvider` chưa được wrap trong App.tsx. SiteData cần thiết cho theme vars, site config, banner display.

**Expected Outcomes:**
- `services/siteService.ts` tồn tại và export `getSiteData(), SiteData`
- `SiteProvider` được mount trong App.tsx bọc ngoài Router
- `useSite()` dùng được từ bất kỳ component nào

**Todo List:**
1. Check xem `siteService.ts` có tồn tại không (ls services/)
2. Nếu thiếu: tạo `services/siteService.ts` gọi GET `/preference` và GET `/admin/settings` → map thành `SiteData`
3. Định nghĩa `SiteData` interface dựa trên `SiteContext.tsx` dùng gì (uiTheme, siteName, etc.)
4. Wire `SiteProvider` trong App.tsx

**Relevant Context:**
- File: `apps/frontend-web/src/contexts/SiteContext.tsx` — import SiteData từ siteService
- File: `apps/frontend-web/src/services/` — kiểm tra siteService.ts
- File: `apps/frontend-web/src/App.tsx` — thêm SiteProvider wrapper

**Status:** [ ] pending

---

## Dependency Map

```
Sub-task 1 (routes.ts)          → độc lập
Sub-task 2 (frontend App.tsx)   → phụ thuộc Sub-task 7 (SiteProvider)
Sub-task 3 (Redux-Saga)         → phụ thuộc Sub-task 2 (cần route context)
Sub-task 4 (admin sidebar)      → độc lập
Sub-task 5 (admin token fix)    → độc lập
Sub-task 6 (shared types)       → độc lập, chạy trước Sub-task 3
Sub-task 7 (siteService)        → độc lập, chạy trước Sub-task 2
```

**Thứ tự thực hiện khuyến nghị:** 1 → 6 → 7 → 5 → 4 → 2 → 3

---

## Notes

- `libs/cron/index.ts` có circular dependency (import từ `apps/backend/src/`) — ghi nhận nhưng nằm ngoài scope plan này
- Frontend-web `adminSaga.ts` cũng empty giống authSaga — chỉ xử lý authSaga trong Sub-task 3, adminSaga để sau
- Backend `routes.ts` chưa mount admin routers: `admin-vip`, `admin-affiliate`, `admin-games` v.v. — tất cả trong Sub-task 1
