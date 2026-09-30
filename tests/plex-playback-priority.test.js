const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);

const taskStart = firmware.indexOf('void plexImportTask(void *pvParameters) {');
const helperStart = firmware.lastIndexOf('bool waitForPlaybackBeforePlexImport(', taskStart);
const taskEnd = firmware.indexOf('// Return number of connected stations', taskStart);
const helper = firmware.slice(helperStart, taskStart);
const task = firmware.slice(taskStart, taskEnd);

assert.notEqual(helperStart, -1, 'playback-priority helper should exist');
assert.match(helper, /if \(!job \|\| !mediaStreamingActive\) return true;/,
  'idle imports should not incur a delay');
assert.match(helper, /while \(mediaStreamingActive && !job->cancelRequested\)/,
  'queued imports should wait while playback remains active');
assert.match(helper, /Waiting for playback to finish/);
assert.match(helper, /vTaskDelay\(pdMS_TO_TICKS\(PLEX_PLAYBACK_WAIT_POLL_MS\)\)/);
assert.match(task, /if \(!waitForPlaybackBeforePlexImport\(job\)\)/,
  'each job should pass the playback gate before bulk transfer mode begins');
assert.ok(
  task.indexOf('waitForPlaybackBeforePlexImport(job)') < task.indexOf('if (settings.bulkTransferMode)'),
  'playback should be checked before background tasks are stopped for an import'
);

for (const field of [
  'waitingForPlayback',
  'playbackWaitCount',
  'playbackWaitTotalMs',
  'playbackWaitLastMs'
]) {
  assert.match(firmware, new RegExp(`plex\\["${field}"\\]`),
    `debug status should expose ${field}`);
}

console.log('Plex playback priority tests passed');
