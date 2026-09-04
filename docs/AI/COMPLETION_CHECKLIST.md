# COMPLETION_CHECKLIST.md — Monorepo Standardization Checklist

_Last updated: 2026-09-04 by AI System Architect_

---

## 1. Hardcoded Configuration Elimination
- [x] **Brand & Domain Standardization**: All `cuocbong99` domain strings eliminated and replaced with `tc-gaming.live` / environment variables across all apps and configuration files.
- [x] `libs/shared-utils/src/config.ts`: Centralized `SYSTEM_CONFIG` constants and dynamic resolver helpers (`getPublicSiteUrl`, `getApiBaseUrl`, `getSupportEmail`, `getTelegramSupportUrl`).
- [x] `README.md` & `configs/DEPLOY.md`: Cleaned up to reflect `tc-gaming.live`, SSL domain setup, and modern monorepo deployment commands.
- [x] `apps/admin-dashboard/vite.config.ts`: Default `VITE_ADMIN_ALLOWED_HOSTS` set to `admin.tc-gaming.live,localhost,127.0.0.1`.
- [x] `apps/admin-dashboard/index.html`: `window.__API_BASE` updated to `/api` default fallback.
- [x] `apps/frontend-web/src/constants/siteUrls.ts`: `SITE_ORIGIN` default `https://tc-gaming.live`, support email `support@tc-gaming.live`.
- [x] `apps/frontend-web/src/constants/brandDefaults.ts`: `DEFAULT_SITE_NAME` fallback `TC Gaming`.
- [x] `apps/backend/src/config/index.ts`: Centralized runtime secrets with strict required fallbacks.
- [x] `apps/backend/src/main/constants/affiliate-extras-defaults.ts`: Standardized support email and referral links.
- [x] `apps/backend/src/main/controllers/user-affiliate.controller.ts`: Invite link uses dynamic `FRONTEND_URL` / `https://tc-gaming.live`.

## 2. Infrastructure & Deployment Standardization
- [x] `infra/nginx/tc-gaming.live.conf`: Complete production Nginx config with TLS termination and reverse proxy routing.
- [x] `infra/ecosystem.production.cjs`: Single modern PM2 configuration managing `tc-api` and `tc-admin`.
- [x] `infra/scripts/deploy.sh`: Zero-downtime release deployment script with symlink swaps.
- [x] `infra/scripts/monitor.sh`: Clean realtime resource and PM2 health monitor (no emojis).
- [x] `infra/env.example`: Standardized environment variable template for `tc-gaming.live`.
- [x] Removed legacy orphan files: `README-cuocbong99.md`, `nginx-cuocbong99.live.conf`, `ecosystem-spa.config.cjs`, `ecosystem.config.cjs`, `ecosystem.pm2-spa.cjs`, `ecosystem.prod.js`, `reload.sh`, `87app.conf`, `87app-pm2.conf`.

## 3. Backend Error Handling Standardization
- [x] `apps/backend/src/middlewares/error.ts`: Standardized error payload structure:
  ```json
  {
    "success": false,
    "error": { "code": 400, "message": "..." },
    "message": "..."
  }
  ```
- [x] `apps/backend/src/utils/ApiError.ts`: Operational error class supporting status codes and stack trace capture.

## 4. Shared Libraries & Type Contracts
- [x] `libs/shared-utils/`: Centralized system constants and URL resolver functions (`@game/shared-utils`).
- [x] `libs/shared-types/`: Standardized `IApiResponse<T>`, `IApiResponseList<T>`, `IApiError`, `IUserResponse`, `IGameResponse`.
- [x] `libs/db/`: Centralized `connectDatabase()` manager for MongoDB and Redis.
- [x] `libs/cron/`: Centralized `startAllCrons()` background worker orchestrator.
- [x] `libs/ui/`: Unified UI component system with `AdminLayout`, `DataTable`, and Radix UI components.
- [x] `libs/i18n/`: Shared Vietnamese and English locale definitions.

## 5. CI/CD & Testing Infrastructure
- [x] `.github/workflows/pr-check.yml`: Automated PR quality gate running typecheck across all 3 workspaces.
- [x] `.github/workflows/deploy.yml`: Multi-stage build, artifact bundling, SSH rsync, zero-downtime PM2 reload, and healthcheck.
- [x] `apps/backend/vitest.config.ts`: Vitest test configuration.
- [x] `apps/backend/src/main/services/__tests__/balance.service.spec.ts`: Unit test suite for balance operations.
