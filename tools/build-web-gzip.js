const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..', 'SD_Card_Template');
const extensions = new Set(['.css', '.html', '.js', '.json', '.mjs', '.svg']);

let generated = 0;
let sourceBytes = 0;
let gzipBytes = 0;

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const extension = path.extname(entry.name).toLowerCase();
  if (!extensions.has(extension)) continue;

  const sourcePath = path.join(root, entry.name);
  const gzipPath = sourcePath + '.gz';
  const source = fs.readFileSync(sourcePath);
  const compressed = zlib.gzipSync(source, { level: 9, mtime: 0 });
  fs.writeFileSync(gzipPath, compressed);
  generated++;
  sourceBytes += source.length;
  gzipBytes += compressed.length;
}

const reduction = sourceBytes
  ? ((1 - gzipBytes / sourceBytes) * 100).toFixed(1)
  : '0.0';
console.log(`Generated ${generated} gzip assets: ${sourceBytes} -> ${gzipBytes} bytes (${reduction}% smaller)`);
