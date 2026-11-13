/**
 * Check that every relative Markdown link in the repository resolves.
 *
 * Usage:
 *   node scripts/validation/check-markdown-links.mjs
 *
 * Exits non-zero if any relative link points at a file that does not exist.
 * Absolute URLs are not fetched. This checks structure, not the network.
 */
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const markdownFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.md')) markdownFiles.push(full);
  }
}

walk(repoRoot);

const linkPattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const broken = [];
let checked = 0;

for (const file of markdownFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const relative = path.relative(repoRoot, file);

  for (const match of content.matchAll(linkPattern)) {
    const target = match[1];
    if (!target) continue;

    // Skip external URLs, mailto, anchors and absolute paths.
    if (/^(https?:|mailto:|tel:|#|\/)/.test(target)) continue;

    checked += 1;

    // Strip any anchor fragment.
    const [pathPart] = target.split('#');
    if (!pathPart) continue;

    const resolved = path.resolve(path.dirname(file), pathPart);
    if (!fs.existsSync(resolved)) {
      broken.push({ file: relative, target, resolved: path.relative(repoRoot, resolved) });
    }
  }
}

console.log(`Checked ${checked} relative links across ${markdownFiles.length} Markdown files.`);

if (broken.length > 0) {
  console.error(`\n${broken.length} broken link(s):\n`);
  for (const item of broken) {
    console.error(`  ${item.file} -> ${item.target}  (resolves to ${item.resolved})`);
  }
  process.exit(1);
}

console.log('All relative Markdown links resolve.');
