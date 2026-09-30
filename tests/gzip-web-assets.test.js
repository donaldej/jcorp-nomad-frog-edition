const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const template = path.join(root, 'SD_Card_Template');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);
const extensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.svg']);

let checked = 0;
for (const entry of fs.readdirSync(template, { withFileTypes: true })) {
  if (!entry.isFile() || !extensions.has(path.extname(entry.name).toLowerCase())) continue;
  const source = fs.readFileSync(path.join(template, entry.name));
  const gzipPath = path.join(template, entry.name + '.gz');
  assert.ok(fs.existsSync(gzipPath), `${entry.name}.gz should be generated`);
  assert.deepEqual(zlib.gunzipSync(fs.readFileSync(gzipPath)), source,
    `${entry.name}.gz should expand to the source bytes`);
  checked++;
}

assert.ok(checked >= 20, 'the normal UI asset set should be covered');
assert.match(firmware, /request->hasHeader\("Accept-Encoding"\)/);
assert.match(firmware, /accepted\.indexOf\("gzip"\) >= 0/);
assert.match(firmware, /response->addHeader\("Content-Encoding", "gzip"\)/);
assert.match(firmware, /response->addHeader\("Vary", "Accept-Encoding"\)/);
assert.match(firmware, /request->hasHeader\("Range"\)/,
  'range requests should retain identity representation semantics');
assert.match(firmware,
  /String fullPath = dir == "\/" \? "\/" \+ filename : dir \+ "\/" \+ filename;/,
  'root uploads should produce /filename instead of a rejected //filename path');

console.log(`gzip web asset tests passed (${checked} assets)`);
