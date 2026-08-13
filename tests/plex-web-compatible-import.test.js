const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);
const page = fs.readFileSync(
  path.join(root, 'SD_Card_Template', 'plex-import.html'),
  'utf8'
);

assert.match(firmware, /String importMode = "original"/);
assert.match(firmware, /doc\["importMode"\] = job->importMode/);
assert.match(firmware, /job->importMode = doc\["importMode"\] \| "original"/);
assert.match(firmware, /transcode\/universal\/start\.mp4/);
assert.match(firmware, /X-Plex-Platform=Chrome/);
assert.match(firmware, /bool resumable = job->importMode == "original"/);
assert.match(firmware, /job->importMode = "web"/,
  'automatic sync should default to browser-compatible media');
assert.match(firmware, /Web-compatible import requires a Plex rating key/);

assert.match(page, /id="import-mode"/);
assert.match(page, /<option value="web" selected>Web compatible<\/option>/);
assert.match(page, /ratingKey: selected\.ratingKey/);
assert.match(page, /importMode: els\.importMode\.value/);
assert.match(page, /Plex will convert audio for browser playback/);

console.log('Plex web-compatible import tests passed');
