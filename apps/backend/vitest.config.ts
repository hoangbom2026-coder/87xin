import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.spec.ts', 'src/**/*.{test,spec}.ts'],
  },
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, './src/main'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@config': path.resolve(__dirname, './src/config'),
      '@middlewares': path.resolve(__dirname, './src/middlewares'),
      '@game/types': path.resolve(__dirname, '../../libs/shared-types/src/index.ts'),
      '@game/shared-types': path.resolve(__dirname, '../../libs/shared-types/src/index.ts'),
      '@game/db': path.resolve(__dirname, '../../libs/db/index.ts'),
      '@game/cron': path.resolve(__dirname, '../../libs/cron/index.ts'),
      '@game/models': path.resolve(__dirname, '../../libs/models/index.ts'),
      '@game/i18n': path.resolve(__dirname, '../../libs/i18n/index.ts'),
      '@game/ui': path.resolve(__dirname, '../../libs/ui/src/index.ts'),
    },
  },
});
