import baseConfig from '@dalashift/config-eslint';

/**
 * Root ESLint flat config for the DalaShift monorepo.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
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
