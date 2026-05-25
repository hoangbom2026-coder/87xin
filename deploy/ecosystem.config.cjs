/**
 * PM2 mặc định — API + admin SPA (`vite preview` :8781).
 * Frontend: Nginx `root .../frontend1/dist` (xem deploy/nginx/87app.conf).
 * Admin: Nginx proxy `admin.*` → 127.0.0.1:8781; `/api/` → API :8701 (MongoDB qua backend .env).
 *
 *   pm2 start /var/87app/deploy/ecosystem.config.cjs
 *
 * Muốn cả FE qua PM2 (`serve` :8780): dùng ecosystem.pm2-spa.cjs và chỉnh Nginx theo comment trong file đó.
 */
const ROOT = "/var/87app";

module.exports = {
  apps: [
    {
      name: "87app-api",
      cwd: `${ROOT}/backend`,
      script: "./dist/index.js",
      interpreter: "node",
      exec_mode: "cluster",
      /** Socket.IO cần 1 process hoặc Redis adapter — mặc định 1 để tránh lỗi WSS. */
      instances: Number(process.env.PM2_API_INSTANCES || 1),
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "8701",
      },
      error_file: `${ROOT}/deploy/logs/pm2-api-error.log`,
      out_file: `${ROOT}/deploy/logs/pm2-api-out.log`,
      merge_logs: true,
      time: true,
    },
    {
      name: "87app-admin",
      cwd: `${ROOT}/admin`,
      script: "./node_modules/vite/bin/vite.js",
      args: ["preview", "--host", "127.0.0.1", "--port", "8781"],
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: { NODE_ENV: "production" },
      error_file: `${ROOT}/deploy/logs/pm2-admin-error.log`,
      out_file: `${ROOT}/deploy/logs/pm2-admin-out.log`,
      merge_logs: true,
      time: true,
    },
  ],
};
