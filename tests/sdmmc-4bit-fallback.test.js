const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);

const mountStart = firmware.indexOf('bool mountSDCardWithFallback() {');
const mountEnd = firmware.indexOf('bool tryRecoverSDCard()', mountStart);
assert.notEqual(mountStart, -1, 'SD mount fallback helper must exist');
assert.notEqual(mountEnd, -1, 'SD mount helper must precede recovery');
const mountHelper = firmware.slice(mountStart, mountEnd);

const highSpeedIndex = mountHelper.indexOf('{ false, SDMMC_FREQ_HIGHSPEED, 4');
const default4BitIndex = mountHelper.indexOf('{ false, SDMMC_FREQ_DEFAULT,   4');
const compatibilityIndex = mountHelper.indexOf('{ true,  SDMMC_FREQ_DEFAULT,   1');
assert.ok(highSpeedIndex >= 0, 'first attempt must use 4-bit high-speed SDMMC');
assert.ok(default4BitIndex > highSpeedIndex, '4-bit default-speed must be the first fallback');
assert.ok(compatibilityIndex > default4BitIndex, 'existing 1-bit mode must remain the final fallback');

assert.match(mountHelper, /SD_MMC\.end\(\);[\s\S]{0,100}delay\(150\);/,
  'failed attempts must cleanly release the SDMMC host before retrying');
assert.equal(
  (firmware.match(/mountSDCardWithFallback\(\)/g) || []).length,
  4,
  'boot and both recovery paths must use the shared mount fallback helper'
);
assert.doesNotMatch(firmware, /SD_MMC\.begin\("\/sdcard", true, false, SDMMC_FREQ_DEFAULT, 12\)/,
  'direct 1-bit-only mounts must not bypass the fallback sequence');

assert.match(firmware, /sd\["busWidth"\] = sdBusWidth;/);
assert.match(firmware, /sd\["frequencyKhz"\] = sdBusFrequencyKhz;/);
assert.match(firmware, /sd\["mountProfile"\] = sdMountProfile;/);

console.log('SDMMC 4-bit fallback tests passed');
