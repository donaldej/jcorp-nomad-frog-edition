const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const moviesPage = fs.readFileSync(
  path.join(root, 'SD_Card_Template', 'movies.html'),
  'utf8'
);
const builder = moviesPage.slice(
  moviesPage.indexOf('async function buildFromIndexes(root)'),
  moviesPage.indexOf('function prettify(filename)')
);

assert.match(builder, /const seenEntryPaths = new Set\(\)/,
  'root and child indexes should share one path-deduplication set');
assert.match(builder, /const full = normalizePath\(entry\.p \|\| fallbackPath\)/,
  'canonical index paths should take precedence over reconstructed paths');
assert.match(builder, /const pathKey = `\$\{entry\.t \|\| 'f'\}::\$\{full\.toLowerCase\(\)\}`/,
  'deduplication should tolerate case differences on the FAT filesystem');
assert.match(builder, /if\(seenEntryPaths\.has\(pathKey\)\) return/);
assert.equal((builder.match(/addIndexEntry\([^;]+\);/g) || []).length, 2,
  'both root and child index records should use the same deduplicating helper');

console.log('movie index deduplication tests passed');
