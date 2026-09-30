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

for (const field of ['artworkKey', 'artworkPath', 'artworkStatus', 'artworkMessage']) {
  assert.match(firmware, new RegExp(`String ${field}`), `queue job should store ${field}`);
  assert.match(firmware, new RegExp(`doc\\["${field}"\\] = job->${field}`),
    `queue persistence should write ${field}`);
  assert.match(firmware, new RegExp(`job->${field} = doc\\["${field}"\\]`),
    `queue restoration should read ${field}`);
}

assert.match(firmware, /\/photo\/:\/transcode\?width=600&height=900/,
  'Plex should return a bounded poster instead of the full original artwork');
assert.match(firmware, /PLEX_ARTWORK_MAX_BYTES \(2UL \* 1024UL \* 1024UL\)/);
assert.match(firmware, /Plex artwork response was not an image/);
assert.match(firmware, /\(artworkKey\.length\(\) == 0\) != \(artworkPath\.length\(\) == 0\)/,
  'artwork validation should require presence of both fields, not equal string lengths');
assert.match(firmware, /String tempPath = job->artworkPath \+ "\.part"/);
assert.match(firmware, /SD_MMC\.rename\(tempPath, job->artworkPath\)/,
  'only a completed poster should replace the final artwork path');
assert.match(firmware, /"Complete; artwork unavailable"/,
  'an artwork failure must not fail an otherwise completed media import');
assert.match(firmware, /mediaAlreadyExists = true;\s+ok = true;/,
  'an existing media file should allow a missing poster to be backfilled');
assert.match(firmware, /Media already present; artwork ready/,
  'artwork-only backfills should report that the media transfer was skipped');
assert.match(firmware, /stream\.print\("\\\",\\\"status\\\":\\\""\)/,
  'queue status JSON should close importMode before serializing status');
assert.match(firmware, /String artworkDir = parentDirFromPath\(job->artworkPath\)/);
assert.match(firmware, /deferPlexReindexPath\(deferredReindexPaths, artworkDir\)/,
  'the poster parent index should refresh so library pages discover the image');
assert.match(firmware, /job->artworkKey = item\["thumb"\] \| ""/,
  'automatic Plex sync should retain movie artwork metadata');

assert.match(page, /artworkKey: video\.thumb \|\| ''/,
  'movie imports should use the Plex movie poster');
assert.match(page, /video\.grandparentThumb \|\| video\.parentThumb \|\| video\.thumb/,
  'episode imports should prefer the series poster');
assert.match(page, /artworkPath: `\/Shows\/\$\{show\}\/poster\.jpg`/);
assert.match(page, /artworkPath: `\/Movies\/\$\{basename\}\/\$\{basename\}\.jpg`/);
assert.match(page, /Artwork: \$\{job\.artworkMessage \|\| job\.artworkStatus\}/,
  'the persistent queue should report poster progress');

console.log('Plex artwork import tests passed');
