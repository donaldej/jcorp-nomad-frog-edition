const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);
const page = fs.readFileSync(path.join(root, 'SD_Card_Template', 'plex-import.html'), 'utf8');

for (const setting of [
  'plexSyncEnabled', 'plexSyncSourceType', 'plexSyncSourceKey',
  'plexSyncDestDir', 'plexSyncIntervalHours', 'plexSyncMinFreeGB',
  'plexSyncPruneManaged'
]) {
  assert.match(firmware, new RegExp(setting), `missing ${setting}`);
}

assert.match(firmware, /BasicJsonDocument<PsramJsonAllocator>/);
assert.match(firmware, /PLEX_SYNC_MANIFEST_PATH/);
assert.match(firmware, /job->managedSync && !appendPlexSyncManifest/);
assert.match(firmware, /actualSize == selectedSize/);
assert.match(firmware, /checkedPath\.startsWith\(normalizedRoot \+ "\/"\)/);
assert.match(firmware, /settings\.plexSyncPruneManaged \|\| !evictOldestPlexSyncFile/);
assert.match(firmware, /plexSyncQueueContains\(ratingKey\)/);
assert.match(firmware, /plexSyncManifestContains\(ratingKey\)/);
assert.match(firmware, /\/playlists\/" \+ settings\.plexSyncSourceKey \+ "\/items/);
assert.match(firmware, /\/library\/collections\/" \+ settings\.plexSyncSourceKey \+ "\/children/);
assert.match(firmware, /server\.on\("\/api\/plex\/sync"/);
assert.match(firmware, /plexSyncSchedulerTask/);

for (const id of [
  'sync-source-type', 'sync-library', 'sync-source-key', 'sync-source-select',
  'sync-dest-dir', 'sync-interval', 'sync-min-free', 'sync-enabled',
  'sync-prune', 'sync-save', 'sync-load-sources', 'sync-run', 'sync-message'
]) {
  assert.match(page, new RegExp(`id=["']${id}["']`), `missing #${id}`);
}

assert.match(page, /\/api\/plex\/playlists/);
assert.match(page, /\/api\/plex\/collections\?libraryKey=/);
assert.match(page, /\/api\/plex\/sync-status/);

console.log('automatic Plex sync tests passed');
