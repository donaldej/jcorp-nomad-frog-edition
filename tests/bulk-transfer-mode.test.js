const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);
const page = fs.readFileSync(path.join(root, 'SD_Card_Template', 'plex-import.html'), 'utf8');

assert.match(firmware, /bool bulkTransferMode = false/);
assert.match(firmware, /doc\["bulkTransferMode"\]/);
assert.match(firmware, /while \(\(indexingInProgress \|\| indexingTasksActive \|\| sdScanInProgress\)/);
assert.match(firmware, /shutdownBackgroundTasksForStreaming\(\)/);
assert.match(firmware, /startBackgroundTasksIfNeeded\(\)/);
assert.match(firmware, /WiFi\.setSleep\(false\)/);
assert.doesNotMatch(firmware, /bulkTransferActive[\s\S]{0,500}softAPdisconnect/);
assert.match(firmware, /bulkTransferActive\s*\?\s*15000UL/);
assert.match(firmware, /bulkTransferActive\s*\?\s*120000UL/);

assert.match(page, /id="bulk-transfer-mode"/);
assert.match(page, /bulkTransferMode: els\.bulkTransferMode\.checked/);
assert.match(page, /els\.bulkTransferMode\.checked = Boolean\(settings\.bulkTransferMode\)/);

console.log('bulk transfer mode tests passed');
