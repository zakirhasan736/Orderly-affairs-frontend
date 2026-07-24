import { defineConfig } from 'vitest/config';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environmentMatchGlobs: [
      ['src/components/**/*.{test,spec}.{ts,tsx}', 'jsdom'],
      ['src/**/*.rtl.{test,spec}.{ts,tsx}', 'jsdom'],
      ['src/**/*.{test,spec}.{ts,tsx}', 'node'],
    ],
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@common': path.resolve(__dirname, './src/components/common'),
    },
  },
});
