import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest configuration for the DalaShift web application.
 * Phase 1: test harness only. Product tests land with the Phase 2 features.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/.next/**', '**/tests/**'],
    },
  },
});
