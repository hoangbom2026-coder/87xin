/**
 * Tuỳ chọn: API + static SPA bằng `serve` (không dùng Nginx root dist).
 * Cần: `npm i -D serve@^14` trong **frontend1** và **admin**, build `dist` xong.
 * Nginx: proxy / → 127.0.0.1:8780 (FE), admin → 8781; `/api/` → :8701 — dùng deploy/nginx/87app-pm2.conf (tương đương nginx-cuocbong99.live.conf).
 *
 *   ECOSYSTEM_FILE=ecosystem.pm2-spa.cjs sudo bash /var/87app/deploy/deploy.sh
 *   # hoặc: pm2 start /var/87app/deploy/ecosystem.pm2-spa.cjs
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
      instances: Number(process.env.PM2_API_INSTANCES || 2),
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
      name: "87app-frontend1",
      cwd: `${ROOT}/frontend1`,
      script: "./node_modules/serve/build/main.js",
      args: ["-s", "dist", "-l", "8780"],
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: { NODE_ENV: "production" },
      error_file: `${ROOT}/deploy/logs/pm2-frontend1-error.log`,
      out_file: `${ROOT}/deploy/logs/pm2-frontend1-out.log`,
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
