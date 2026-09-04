import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // Hạ ngưỡng cảnh báo về mức hợp lý (mặc định 500KB quá thấp, 1500KB quá cao)
    chunkSizeWarningLimit: 600,
    // esbuild minify — nhanh hơn terser ~10x, không cần cài thêm
    minify: 'esbuild',
    target: 'es2020',
    // Tắt sourcemap trên production — giảm ~50% kích thước dist
    sourcemap: false,
    rollupOptions: {
      output: {
        // Code splitting thủ công — tách vendor chunk để browser cache lâu dài
        manualChunks: {
          // React core — thay đổi rất hiếm → cache 1 năm
          'vendor-react': ['react', 'react-dom'],
          // Router — tách riêng vì thường ổn định
          'vendor-router': ['react-router-dom'],
          // Redux stack — tách riêng
          'vendor-state': ['@reduxjs/toolkit', 'redux', 'redux-saga', 'react-redux'],
          // Socket.IO — nặng, ít thay đổi
          'vendor-socket': ['socket.io-client'],
          // UI libraries
          'vendor-ui': ['swiper', 'lucide-react', 'clsx', 'tailwind-merge'],
          // QR / utils nhỏ
          'vendor-misc': ['qrcode.react', 'md5', 'axios'],
        },
        // Đặt tên chunk rõ ràng với hash — cache busting tự động
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Giảm overhead khi build song song
    reportCompressedSize: false,
  },
  // esbuild options: bỏ console.log và debugger trên production
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
})
