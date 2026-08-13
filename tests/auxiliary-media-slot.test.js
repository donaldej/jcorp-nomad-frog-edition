const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);

assert.match(firmware, /static const size_t MAX_AUXILIARY_ASSET_BYTES = 2UL \* 1024UL \* 1024UL/,
  'auxiliary responses must have a strict size bound');
assert.match(firmware, /bool isAuxiliaryAssetPath\(const String &filePath\)/);
for (const extension of ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'vtt', 'srt', 'json', 'ndjson']) {
  assert.match(firmware, new RegExp(`endsWith\\(\\"\\.${extension}\\"\\)`),
    `${extension} assets should use the auxiliary class`);
}
assert.match(firmware, /bool isAuxiliaryAsset = isAuxiliaryAssetPath\(filePath\) &&\s*fileSize <= MAX_AUXILIARY_ASSET_BYTES;/);
assert.match(firmware, /activeAuxiliaryStreams >= MAX_CONCURRENT_AUXILIARY_STREAMS/);
assert.match(firmware, /activePrimaryStreams >= MAX_CONCURRENT_PRIMARY_STREAMS/);
assert.match(firmware, /sh\.auxiliary = isAuxiliaryAsset;/,
  'each open handle must retain its response class');
assert.match(firmware, /if \(isAuxiliaryAsset && rangeHeader\.length\(\) == 0\)/,
  'normal auxiliary GETs should bypass the seekable SD stream registry');
assert.match(firmware, /sendBufferedSdFile\(request, filePath, mimeType, MAX_AUXILIARY_ASSET_BYTES\)/,
  'normal auxiliary GETs should be served from PSRAM after closing the SD file');
assert.match(firmware, /isAuxiliaryAssetPath\(lower\)[\s\S]{0,100}"public, max-age=86400"/,
  'versioned posters and metadata should remain cached to avoid repeated device work');
assert.match(firmware, /tasks\["activePrimaryStreams"\] = primaryStreamCount;/);
assert.match(firmware, /tasks\["activeAuxiliaryStreams"\] = auxiliaryStreamCount;/);

console.log('auxiliary media slot tests passed');
