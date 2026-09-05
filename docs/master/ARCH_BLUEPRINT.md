# ARCH_BLUEPRINT — tc-gaming.live

## 1. Dependency Graph (Strict Enforcement)
- **Layer 1 (Apps):** `apps/web`, `apps/admin`, `apps/api`. **NO IMPORTS ALLOWED** between apps.
- **Layer 2 (Libs):** `libs/ui`, `libs/models`, `libs/shared-types`, `libs/i18n`, `libs/db`, `libs/cron`.
- **Layer 3 (Root):** `configs/*` (ESLint, Prettier, tsconfig.base).

## 2. Data Flow
- **Client (Web/Admin) -> Backend (API):** Sử dụng các Type/Interface từ `@game/types`.
- **Backend -> Database:** Mongoose Models (`libs/models`) -> Services (`apps/backend/src/main/services`) -> Controllers (`apps/backend/src/main/controllers`).
- **Internal Communication:** Mọi logic dùng chung (utility, format, crypto) đều nằm ở `@game/shared-utils`.

## 3. Communication Contract
- **Request/Response:** Mọi phản hồi API BẮT BUỘC theo format: 
  `{ success: boolean, data?: any, error?: { code: string, message: string } }`
