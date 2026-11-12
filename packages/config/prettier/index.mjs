/**
 * Shared Prettier configuration for the DalaShift monorepo.
 * Referenced from the root package.json `prettier` field.
 *
 * @type {import("prettier").Config}
 */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  quoteProps: 'as-needed',
  embeddedLanguageFormatting: 'auto',
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'preserve',
        printWidth: 80,
      },
    },
    {
      files: ['*.json', '*.jsonc', '*.yml', '*.yaml'],
      options: { printWidth: 100 },
    },
  ],
};

export default config;
