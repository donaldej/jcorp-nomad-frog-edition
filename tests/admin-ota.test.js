const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'SD_Card_Template', 'admin.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'SD_Card_Template', 'admin.js'), 'utf8');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);

for (const id of ['ota-form', 'ota-file', 'ota-submit', 'ota-progress-bar', 'ota-status', 'ota-partition']) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
}

assert.match(script, /setupOtaUpdater\(\)/);
assert.match(script, /request\.open\('POST', '\/api\/firmware\/update'\)/);
assert.match(script, /X-Admin-Token/);
assert.match(script, /request\.upload\.addEventListener\('progress'/);

assert.match(firmware, /server\.on\("\/api\/firmware\/update"/);
assert.match(firmware, /Update\.begin\(UPDATE_SIZE_UNKNOWN, U_FLASH\)/);
assert.match(firmware, /armOtaBootGuard\(\)/);
assert.match(firmware, /esp_ota_set_boot_partition\(previous\)/);
assert.match(firmware, /vTaskDelay\(pdMS_TO_TICKS\(30000\)\)/);
assert.match(firmware, /esp_ota_mark_app_valid_cancel_rollback\(\)/);

console.log('admin OTA contract tests passed');
