/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  plugins: [
    angular(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    setupFiles: ['src/testing/setup-vitest.ts'],
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
  },
}));
