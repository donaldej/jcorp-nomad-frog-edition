const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);
const route = firmware.slice(
  firmware.indexOf('server.on("/api/debug/throughput/ram"'),
  firmware.indexOf('server.on("/api/debug/status"')
);

assert.ok(route.length > 0, 'RAM throughput route must be registered');
assert.match(route, /checkAdminAuth\(request\)/,
  'the diagnostic download must use admin authentication');
assert.match(firmware, /RAM_THROUGHPUT_DEFAULT_BYTES = 4UL \* 1024UL \* 1024UL/);
assert.match(firmware, /RAM_THROUGHPUT_MIN_BYTES = 1UL \* 1024UL \* 1024UL/);
assert.match(firmware, /RAM_THROUGHPUT_MAX_BYTES = 16UL \* 1024UL \* 1024UL/);
assert.match(route, /invalidValue \|\| requestedBytes < RAM_THROUGHPUT_MIN_BYTES[\s\S]{0,100}requestedBytes > RAM_THROUGHPUT_MAX_BYTES/,
  'user-selected benchmark sizes must remain bounded');
assert.match(route, /ramThroughputActiveId\.compare_exchange_strong/,
  'only one benchmark response may run at a time');
assert.match(route, /memset\(buffer, 0xA5, count\)/,
  'benchmark data must be generated without SD-card access');
assert.doesNotMatch(route, /SD_MMC|sdMutex|File\s/,
  'the RAM benchmark must remain independent from the SD path');
assert.match(route, /Cache-Control", "no-store"/);
assert.match(route, /X-Nomad-Benchmark-Source", "ram"/);
assert.match(route, /request->onDisconnect\(\[benchmarkId\]/,
  'abandoned benchmarks must release the concurrency guard');
assert.match(firmware, /http\["ramThroughputCompletedCount"\]/);
assert.match(firmware, /http\["ramThroughputCancelledCount"\]/);
assert.match(firmware, /http\["ramThroughputLastDurationMs"\]/);

console.log('RAM throughput diagnostics tests passed');
