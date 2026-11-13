/**
 * Regenerate the dependency table in THIRD_PARTY_NOTICES.md.
 *
 * Reads every workspace package.json, resolves each direct dependency's
 * licence from the installed package metadata, and prints a Markdown table.
 *
 * Usage:
 *   node scripts/validation/generate-third-party-notices.mjs
 *
 * It prints the table; it does not rewrite the file. The data-source
 * attribution table must be maintained by hand. No script can know which
 * external APIs the project uses.
 */
import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE_PACKAGES = [
  'package.json',
  'apps/web/package.json',
  'packages/shared/package.json',
];

const repoRoot = process.cwd();

function findInstalledPackage(name) {
  const candidates = [
    path.join(repoRoot, 'node_modules', name, 'package.json'),
    path.join(repoRoot, 'apps/web/node_modules', name, 'package.json'),
    path.join(repoRoot, 'packages/shared/node_modules', name, 'package.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, 'utf8'));
    }
  }
  return null;
}

function normaliseLicense(license) {
  if (!license) return 'UNKNOWN';
  if (typeof license === 'string') return license;
  if (typeof license === 'object' && license.type) return license.type;
  return 'UNKNOWN';
}

const found = new Map();

for (const relativePath of WORKSPACE_PACKAGES) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) continue;

  const pkg = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  for (const group of ['dependencies', 'devDependencies']) {
    for (const name of Object.keys(pkg[group] ?? {})) {
      if (name.startsWith('@dalashift/')) continue;
      if (found.has(name)) continue;

      const installed = findInstalledPackage(name);
      found.set(name, {
        license: normaliseLicense(installed?.license),
        version: installed?.version ?? '?',
        group: group === 'dependencies' ? 'runtime' : 'dev',
      });
    }
  }
}

const rows = [...found.entries()].sort(([a], [b]) => a.localeCompare(b));

const runtime = rows.filter(([, value]) => value.group === 'runtime');
const dev = rows.filter(([, value]) => value.group === 'dev');

function toTable(entries) {
  return entries
    .map(([name, value]) => `| \`${name}\` | ${value.license} | ${value.version} |`)
    .join('\n');
}

console.log('### Runtime dependencies\n');
console.log('| Package | Licence | Version |');
console.log('| ------- | ------- | ------- |');
console.log(toTable(runtime));

console.log('\n### Development dependencies\n');
console.log('| Package | Licence | Version |');
console.log('| ------- | ------- | ------- |');
console.log(toTable(dev));

const unknown = rows.filter(([, value]) => value.license === 'UNKNOWN');
console.log(`\nTotal: ${rows.length} direct dependencies.`);
if (unknown.length > 0) {
  console.log(
    `WARNING: ${unknown.length} licence(s) unresolved: ${unknown.map(([n]) => n).join(', ')}`,
  );
  console.log('Resolve these manually before updating THIRD_PARTY_NOTICES.md.');
}
