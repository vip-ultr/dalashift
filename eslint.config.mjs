import baseConfig from '@dalashift/config-eslint';

/**
 * Root ESLint flat config for the DalaShift monorepo.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  {
    // Vendored, minified third-party worker copied verbatim from maplibre-gl.
    ignores: ['apps/web/public/maplibre-gl-worker.mjs'],
  },
  ...baseConfig,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off',
    },
  },
];
