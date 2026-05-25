import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

function blockEnvProbeRequests(): Plugin {
  const blocked = /(?:^|\/)\.env(?:$|[./-])/i;
  return {
    name: 'block-env-probe-requests',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url || '').split('?')[0] || '/';
        if (blocked.test(pathOnly)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Not Found');
          return;
        }
        next();
      });
    },
  };
}

const adminPreviewHosts = (
  process.env.VITE_ADMIN_ALLOWED_HOSTS ||
  'admin.cuocbong99.live,www.admin.cuocbong99.live,localhost,127.0.0.1'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const adminPreviewPort =
  Number(process.env.ADMIN_PREVIEW_PORT || process.env.PORT) || 8712;

export default defineConfig({
  base: '/',
  plugins: [blockEnvProbeRequests(), react()],
  build: {
    // Admin bundle gộp nhiều trang; tránh cảnh báo 500kB+ mặc định của Vite
    chunkSizeWarningLimit: 1500,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client'),
    },
  },
  server: {
    fs: {
      allow: [
        resolve(__dirname),
        resolve(__dirname, 'client'),
        resolve(__dirname, 'node_modules'),
      ],
    },
    proxy:
      process.env.PROXY_TARGET ||
      process.env.VITE_PROXY_TARGET ||
      process.env.VITE_BACKEND_URL
        ? {
            "/api": {
              target: String(
                process.env.PROXY_TARGET ||
                  process.env.VITE_PROXY_TARGET ||
                  process.env.VITE_BACKEND_URL,
              ),
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
  },
  preview: {
    host: '127.0.0.1',
    port: adminPreviewPort,
    strictPort: true,
    allowedHosts: adminPreviewHosts,
  },
});
