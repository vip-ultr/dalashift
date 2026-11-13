/**
 * Enforce the project's writing conventions.
 *
 * The single hard rule: no em dash (U+2014) anywhere in the repository's
 * tracked text files. This exists so the documentation reads like it was
 * written by engineers, not by a language model. The em dash is the single
 * most recognisable tell.
 *
 * Usage:
 *   node scripts/validation/check-writing-style.mjs
 *
 * Exits non-zero and prints every offending location if the rule is broken.
 */

import fs from 'node:fs';
import path from 'node:path';

const EM_DASH = '\u2014';

const repoRoot = process.cwd();

const SCAN_DIRECTORIES = ['apps', 'packages', 'scripts', 'docs', 'data', '.github'];
const SCAN_ROOT_FILES = [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'PRD.md',
  'ARCHITECTURE.md',
  'ARCHITECTURE_ESSENTIALS.md',
  'SECURITY.md',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  '.env.example',
  '.gitignore',
  '.editorconfig',
  '.prettierignore',
];

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.mdx',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.yml',
  '.yaml',
  '.css',
  '.txt',
]);

const IGNORED_DIRECTORIES = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage']);

function collectFiles() {
  const files = [];

  for (const rootFile of SCAN_ROOT_FILES) {
    const full = path.join(repoRoot, rootFile);
    if (fs.existsSync(full)) files.push(full);
  }

  function walk(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) continue;
      files.push(full);
    }
  }

  for (const directory of SCAN_DIRECTORIES) {
    walk(path.join(repoRoot, directory));
  }

  return files;
}

const violations = [];

for (const file of collectFiles()) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relative = path.relative(repoRoot, file);

  lines.forEach((line, lineIndex) => {
    let searchFrom = 0;
    for (;;) {
      const index = line.indexOf(EM_DASH, searchFrom);
      if (index === -1) break;
      searchFrom = index + EM_DASH.length;

      violations.push({
        file: relative,
        line: lineIndex + 1,
        column: index + 1,
        text: line.trim().slice(0, 120),
      });
    }
  });
}

if (violations.length > 0) {
  console.error(
    `Found ${violations.length} em dash(es). The project convention is: use a colon, a comma, a full stop or parentheses. Never an em dash.\n`,
  );
  for (const violation of violations) {
    console.error(`  ${violation.file}:${violation.line}:${violation.column}`);
    console.error(`    ${violation.text}`);
  }
  console.error('\nSee AGENTS.md section 7 (Coding conventions) for the rule.');
  process.exit(1);
}

console.log('Writing style check passed: no em dashes found.');
