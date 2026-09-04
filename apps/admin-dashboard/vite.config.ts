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
  'admin.tc-gaming.live,www.admin.tc-gaming.live,localhost,127.0.0.1'
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
    chunkSizeWarningLimit: 600,
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            // Tách từng page admin thành chunk riêng (lazy load)
            if (id.includes('/client/pages/admin/')) {
              const name = id.split('/pages/admin/')[1].replace(/\.tsx?$/, '').toLowerCase();
              return `page-${name}`;
            }
            if (id.includes('/client/pages/affiliate/')) {
              return 'pages-affiliate';
            }
            return undefined;
          }
          // Vendor splits — cache lâu dài
          // React core phải đứng trước các check khác để tránh circular
          if (id.includes('/react-dom/') || id.includes('\\react-dom\\')) return 'vendor-react';
          if (id.includes('/node_modules/react/') || id.match(/[/\\]react[/\\]index\.js/)) return 'vendor-react';
          if (id.includes('react-router'))                       return 'vendor-router';
          if (id.includes('@tanstack'))                          return 'vendor-query';
          if (id.includes('@radix-ui'))                          return 'vendor-radix';
          if (id.includes('recharts') || id.includes('d3-'))     return 'vendor-charts';
          if (id.includes('react-hook-form') || id.includes('@hookform')) return 'vendor-forms';
          if (id.includes('lucide-react') || id.includes('@iconify')) return 'vendor-icons';
          if (id.includes('react-quill'))                        return 'vendor-editor';
          // Tất cả vendor còn lại vào một chunk
          return 'vendor-misc';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
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
