import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the shared package.
 * Phase 1: validates the shared vocabulary (units, resolutions, schemas).
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts', '**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
