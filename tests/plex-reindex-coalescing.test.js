const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);

const taskStart = firmware.indexOf('void plexImportTask(void *pvParameters) {');
const taskEnd = firmware.indexOf('// Return number of connected stations', taskStart);
const task = firmware.slice(taskStart, taskEnd);

assert.notEqual(taskStart, -1, 'Plex import task should exist');
assert.match(firmware, /bool deferPlexReindexPath\(std::vector<String> &pendingPaths/);
assert.match(firmware, /pending\.equalsIgnoreCase\(normalized\)/,
  'duplicate paths should be coalesced case-insensitively for FAT storage');
assert.match(firmware, /void flushPlexReindexPaths\(std::vector<String> &pendingPaths\)/);
assert.match(task, /std::vector<String> deferredReindexPaths;/);
assert.match(task, /if \(!job\) \{\s+vTaskDelay\(pdMS_TO_TICKS\(PLEX_REINDEX_IDLE_GRACE_MS\)\)/,
  'the worker should allow burst requests to join the current batch');
assert.match(task, /bool queueRefilled = plexQueuedCountLocked\(\) > 0;[\s\S]*if \(queueRefilled\) continue;[\s\S]*flushPlexReindexPaths\(deferredReindexPaths\);/,
  'the queue should be rechecked before deferred indexes flush');
assert.match(task, /bool queueArrivedDuringFlush = plexQueuedCountLocked\(\) > 0;/,
  'the queue should be rechecked before the worker releases ownership');
assert.match(task, /deferPlexReindexPath\(deferredReindexPaths, artworkDir\)/);
assert.match(task, /deferPlexReindexPath\(deferredReindexPaths, job->reindexRoot\)/);
assert.doesNotMatch(task, /enqueueIndexUpdateForPath\(/,
  'the import loop should not enqueue index work between queued jobs');

for (const field of [
  'reindexRequestedCount',
  'reindexCoalescedCount',
  'reindexFlushedCount',
  'reindexBatchCount',
  'reindexPendingCount',
  'reindexLastBatchPaths'
]) {
  assert.match(firmware, new RegExp(`plex\\["${field}"\\]`),
    `debug status should expose ${field}`);
}

console.log('Plex reindex coalescing tests passed');
