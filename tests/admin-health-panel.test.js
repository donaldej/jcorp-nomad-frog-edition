const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'SD_Card_Template', 'admin.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'SD_Card_Template', 'admin.js'), 'utf8');
const start = source.indexOf('function formatHealthBytes');
const end = source.indexOf('let healthPollActive', start);

assert.notEqual(start, -1, 'health renderer was not found');
assert.notEqual(end, -1, 'health renderer boundary was not found');

const requiredIds = [
  'health-state', 'health-updated', 'health-build', 'health-boot', 'health-heap',
  'health-heap-detail', 'health-psram', 'health-psram-detail', 'health-wifi',
  'health-wifi-detail', 'health-sd', 'health-sd-detail', 'health-activity',
  'health-activity-detail', 'health-watchdog', 'health-watchdog-detail',
  'health-restart', 'health-restart-detail'
];

for (const id of requiredIds) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
}

const elements = Object.fromEntries(requiredIds.map((id) => [id, {
  textContent: '',
  className: ''
}]));
const context = {
  console,
  Date,
  document: {
    getElementById: (id) => elements[id] || null
  }
};

vm.createContext(context);
vm.runInContext(source.slice(start, end), context);

function payload(overrides = {}) {
  return {
    buildId: 'test-build',
    uptimeMs: 3600000,
    freeHeap: 42000,
    minFreeHeap: 26000,
    maxAllocHeap: 28000,
    freePsram: 7000000,
    minFreePsram: 6500000,
    maxAllocPsram: 6800000,
    restart: { bootCount: 7, currentResetReasonName: 'software-restart' },
    wifi: { staConnected: true, staSsid: 'Home', staIp: '192.168.1.25', staRssi: -51, apStations: 1 },
    sd: { mutexExists: true, mutexAvailableNow: true, mutexProbeMs: 0, cachedUsed: 1000000, scanInProgress: false },
    tasks: { indexingInProgress: false, indexProgressPercent: 0, indexQueueDepth: 0, activeStreams: 0 },
    http: { lowHeapWarnBytes: 24576, lowHeapRestartBytes: 16384, lowHeapWarnCount: 0, criticalHeapCount: 0, criticalHeapStreak: 0 },
    plexImport: { active: false },
    ...overrides
  };
}

context.renderDeviceHealth(payload());
assert.equal(elements['health-state'].textContent, 'Healthy');
assert.match(elements['health-state'].className, /good/);
assert.equal(elements['health-build'].textContent, 'test-build');
assert.equal(elements['health-wifi'].textContent, '192.168.1.25');

context.renderDeviceHealth(payload({
  plexImport: { active: true, downloaded: 50, total: 100, averageMiBPerSec: 1.25 }
}));
assert.equal(elements['health-state'].textContent, 'Busy');
assert.equal(elements['health-activity'].textContent, 'Plex import');
assert.match(elements['health-activity-detail'].textContent, /50%.*1\.25 MiB\/s/);

context.renderDeviceHealth(payload({ freeHeap: 12000 }));
assert.equal(elements['health-state'].textContent, 'Critical');
assert.match(elements['health-state'].className, /critical/);

console.log('admin health panel tests passed');
