const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);
const rangeHandler = firmware.slice(
  firmware.indexOf('void handleRangeRequest(AsyncWebServerRequest *request) {'),
  firmware.indexOf('void handleListFiles(AsyncWebServerRequest *request) {')
);

assert.match(firmware, /bool parseByteRange\(/);
assert.match(firmware, /if \(!startStr\.length\(\)\)[\s\S]{0,500}fileSize - \(size_t\)suffixLength/,
  'suffix ranges must resolve relative to the end of the file');
assert.match(firmware, /if \(!endStr\.length\(\)\) \{\s*endByte = fileSize - 1;/,
  'open-ended ranges must extend to the end of the file');
assert.match(firmware, /beginResponse\(416, "text\/plain", "Requested range not satisfiable"\)/);
assert.match(firmware, /"Content-Range", "bytes \*\/" \+ String\(fileSize\)/);
assert.match(firmware, /beginResponse\(200, mimeType, ""\)/,
  'HEAD responses must report the same media type as GET responses');
assert.match(firmware, /request->onDisconnect\(\[streamId\]\(\) \{\s*closeStreamById\(streamId\);/,
  'abandoned open-ended ranges must release the stream immediately');
assert.doesNotMatch(firmware, /openEndedRange/,
  'open-ended ranges must not be silently truncated');
assert.doesNotMatch(rangeHandler, /response->addHeader\("Connection", "close"\)/,
  'the async response owns its Connection header');

console.log('media HTTP range tests passed');
