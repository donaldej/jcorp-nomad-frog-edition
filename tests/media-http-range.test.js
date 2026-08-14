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
assert.match(firmware, /if \(!endStr\.length\(\)\) \{\s*if \(openEnded\) \*openEnded = true;\s*endByte = fileSize - 1;/,
  'the parser must identify open-ended ranges before the media policy is applied');
assert.match(firmware, /MAX_OPEN_ENDED_MEDIA_RANGE_BYTES = 16UL \* 1024UL \* 1024UL/);
assert.match(firmware, /if \(isMediaStream && openEndedRange\)[\s\S]{0,300}endByte = startByte \+ MAX_OPEN_ENDED_MEDIA_RANGE_BYTES - 1;/,
  'only open-ended audio/video responses should be capped');
assert.match(firmware, /response->addHeader\("X-Nomad-Range-Capped", "1"\)/);
assert.match(firmware, /beginResponse\(416, "text\/plain", "Requested range not satisfiable"\)/);
assert.match(firmware, /"Content-Range", "bytes \*\/" \+ String\(fileSize\)/);
assert.match(firmware, /beginResponse\(200, mimeType, ""\)/,
  'HEAD responses must report the same media type as GET responses');
assert.match(firmware, /request->onDisconnect\(\[streamId\]\(\) \{\s*closeStreamById\(streamId\);/,
  'abandoned open-ended ranges must release the stream immediately');
assert.match(firmware, /http\["boundedMediaRangeCount"\] = boundedMediaRangeCount\.load/,
  'debug status should expose how often the range cap is used');
assert.doesNotMatch(rangeHandler, /response->addHeader\("Connection", "close"\)/,
  'the async response owns its Connection header');

console.log('media HTTP range tests passed');
