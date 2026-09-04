/**
 * PM2 Production — API + admin SPA.
 * Root: /var/app/game/apps
 */
const ROOT = "/var/app/game/apps";
const LOG_ROOT = "/var/app/game/infra/logs";

module.exports = {
  apps: [
    {
      name: "87app-api",
      cwd: `${ROOT}/backend`,
      script: "./dist/index.js",
      interpreter: "node",
      exec_mode: "cluster",
      instances: Number(process.env.PM2_API_INSTANCES || 1),
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "8701",
      },
      error_file: `${LOG_ROOT}/pm2-api-error.log`,
      out_file: `${LOG_ROOT}/pm2-api-out.log`,
      merge_logs: true,
      time: true,
    },
    {
      name: "87app-admin",
      cwd: `${ROOT}/admin-dashboard`,
      script: "./node_modules/vite/bin/vite.js",
      args: ["preview", "--host", "127.0.0.1", "--port", "8781"],
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: { NODE_ENV: "production" },
      error_file: `${LOG_ROOT}/pm2-admin-error.log`,
      out_file: `${LOG_ROOT}/pm2-admin-out.log`,
      merge_logs: true,
      time: true,
    },
  ],
};
