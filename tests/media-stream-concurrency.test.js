const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);

assert.match(firmware, /static const int MAX_CONCURRENT_PRIMARY_STREAMS = 1/,
  'the async web stack must still allow only one primary media response');
assert.match(firmware, /static const int MAX_CONCURRENT_AUXILIARY_STREAMS = 1/,
  'only one bounded thumbnail or metadata response may accompany playback');
assert.match(firmware, /static const int MAX_CONCURRENT_STREAMS = 2/,
  'the overall response cap must remain bounded');
assert.doesNotMatch(firmware, /streamPathIndex/,
  'separate clients must never share a seekable SD file handle');
assert.doesNotMatch(firmware, /\[Stream\] Reuse|\[Stream\] Evicting/,
  'new requests must not seek or close another active response');
assert.match(firmware, /Too many active media requests; retry shortly/);
assert.match(firmware, /Retry-After", "2"/);
assert.match(firmware, /video\/x-matroska/);
assert.match(firmware, /\[streamId, filePath, startByte, contentLength, isAuxiliaryAsset\]/);
assert.match(firmware, /index \+ bytesRead >= contentLength/);
assert.match(firmware, /streamingFiles\.erase\(it\);\s*updateActiveStreamCountsLocked\(\);/);
assert.match(firmware, /lastActivity > 30000UL/,
  'abandoned browser ranges should release their stream slots promptly');

console.log('media stream concurrency tests passed');
