/**
 * PM2 Production — API (cluster) + Admin SPA (vite preview)
 * VPS: 4 CPU / 8 GB RAM
 * Root: /var/app/game/apps
 *
 * Khởi động: pm2 startOrReload /var/app/game/infra/ecosystem.production.cjs --update-env
 */
const ROOT     = '/var/app/game/apps';
const LOG_ROOT = '/var/app/game/infra/logs';

module.exports = {
  apps: [
    // -----------------------------------------------------------------------
    // API — Express + Socket.IO (port 8701)
    // Socket.IO cần 1 process (hoặc Redis adapter cho multi-instance).
    // Tăng PM2_API_INSTANCES > 1 chỉ khi đã cấu hình Redis adapter.
    // -----------------------------------------------------------------------
    {
      name: 'tc-api',
      cwd: `${ROOT}/backend`,
      script: './dist/index.js',
      interpreter: 'node',
      // Fork mode bắt buộc với Socket.IO — cluster mode sẽ làm WSS bị mất session
      // Chỉ đổi sang cluster khi đã cấu hình Redis adapter cho Socket.IO
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      // PM2 restart nếu vượt RAM — bảo vệ VPS 8GB
      max_memory_restart: '1200M',
      // Node.js flags cho production VPS 8GB
      node_args: [
        '--max-old-space-size=1024',   // V8 heap cap 1GB → để 200MB buffer cho OS
        '--max-semi-space-size=64',    // Young gen nhỏ → GC nhanh hơn
        '--expose-gc',                 // Cho phép manual GC nếu cần
      ],
      error_file:  `${LOG_ROOT}/pm2-api-error.log`,
      out_file:    `${LOG_ROOT}/pm2-api-out.log`,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || '8701',
        // Tăng libuv thread pool từ 4 → 8 cho MongoDB/disk I/O song song
        UV_THREADPOOL_SIZE: '8',
      },
      kill_timeout: 5000,
      listen_timeout: 8000,
    },

    // -----------------------------------------------------------------------
    // Admin SPA — vite preview (port 8781 / ADMIN_PREVIEW_PORT)
    // Chỉ serve static, không cần nhiều RAM.
    // -----------------------------------------------------------------------
    {
      name: 'tc-admin',
      cwd: `${ROOT}/admin-dashboard`,
      script: './node_modules/.bin/vite',
      args: ['preview', '--host', '127.0.0.1', '--port', String(process.env.ADMIN_PREVIEW_PORT || '8781'), '--strictPort'],
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      node_args: ['--max-old-space-size=256'],
      error_file:  `${LOG_ROOT}/pm2-admin-error.log`,
      out_file:    `${LOG_ROOT}/pm2-admin-out.log`,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
      env: {
        NODE_ENV: 'production',
        ADMIN_PREVIEW_PORT: process.env.ADMIN_PREVIEW_PORT || '8781',
        VITE_ADMIN_ALLOWED_HOSTS: 'admin.tc-gaming.live,www.admin.tc-gaming.live,127.0.0.1,localhost',
      },
      kill_timeout: 3000,
      listen_timeout: 5000,
    },
  ],
};
