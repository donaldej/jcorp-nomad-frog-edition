const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);

assert.match(firmware, /BaseType_t createBackgroundTask\(/);
assert.match(
  firmware,
  /MALLOC_CAP_SPIRAM \| MALLOC_CAP_8BIT[\s\S]*MALLOC_CAP_INTERNAL \| MALLOC_CAP_8BIT/,
  'background tasks must prefer PSRAM and retain an internal-RAM fallback'
);

for (const taskName of [
  'IndexWorker',
  'StorageMonitor',
  'IncScanBoot',
  'ImmediateEnq',
  'HttpHealth',
  'BootCoord',
  'PlexSyncSchedule'
]) {
  const nameIndex = firmware.indexOf(`"${taskName}"`);
  assert.notEqual(nameIndex, -1, `${taskName} task was not found`);
  const factoryIndex = firmware.lastIndexOf('createBackgroundTask(', nameIndex);
  const internalIndex = firmware.lastIndexOf('xTaskCreatePinnedToCore(', nameIndex);
  assert.ok(
    factoryIndex > internalIndex,
    `${taskName} should use the PSRAM-first background task factory`
  );
}

assert.match(
  firmware,
  /xTaskCreatePinnedToCore\(\+\[\]\(void \*param\)[\s\S]{0,700}"StreamingTask"/,
  'the hardware-facing streaming task must retain an internal stack'
);
assert.match(
  firmware,
  /xTaskCreatePinnedToCore\(\+\[\]\(void \*param\)[\s\S]{0,1200}"UiTask"/,
  'the LVGL UI task must retain an internal stack'
);

assert.match(firmware, /tasks\["psramStackTasksCreated"\]/);
assert.match(firmware, /tasks\["internalStackFallbacks"\]/);
assert.match(firmware, /void indexWorkerTask\([\s\S]{0,700}vTaskDeleteWithCaps\(NULL\)/);
assert.match(firmware, /void storageMonitorTask\([\s\S]{0,500}vTaskDeleteWithCaps\(NULL\)/);
assert.match(firmware, /void bootCoordinatorTask\([\s\S]{0,2500}vTaskDeleteWithCaps\(NULL\)/);

console.log('PSRAM background stack tests passed');
