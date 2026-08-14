const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);
const buildOptions = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'build_opt.h'),
  'utf8'
);
const tuningHelper = firmware.slice(
  firmware.indexOf('bool tuneStreamingTcpSendBuffer('),
  firmware.indexOf('BaseType_t createBackgroundTask(')
);
const rangeHandler = firmware.slice(
  firmware.indexOf('void handleRangeRequest(AsyncWebServerRequest *request) {'),
  firmware.indexOf('void handleListFiles(AsyncWebServerRequest *request) {')
);
const ramRoute = firmware.slice(
  firmware.indexOf('server.on("/api/debug/throughput/ram"'),
  firmware.indexOf('server.on("/api/debug/status"')
);

assert.match(firmware, /NOMAD_STREAM_TCP_SEND_BUFFER_BYTES = 8UL \* CONFIG_LWIP_TCP_MSS/,
  'streaming connections should target eight TCP segments');
assert.match(buildOptions, /-DCONFIG_ASYNC_TCP_STACK_SIZE=8192/,
  'AsyncTCP should use a measured 8 KiB stack to preserve internal heap');
assert.match(tuningHelper, /LOCK_TCPIP_CORE\(\)[\s\S]{0,700}UNLOCK_TCPIP_CORE\(\)/,
  'raw PCB accounting must be changed under the lwIP core lock');
assert.match(tuningHelper, /pcb->snd_lbb - pcb->lastack/,
  'capacity calculation must include bytes already queued or in flight');
assert.match(tuningHelper, /pcb->snd_buf \+= NOMAD_STREAM_TCP_SEND_BUFFER_BYTES - currentCapacity/,
  'only missing capacity should be added so keep-alive requests cannot grow it repeatedly');
const streamLimitPos = rangeHandler.indexOf('if ((int)streamingFiles.size() >= MAX_CONCURRENT_STREAMS');
const mediaTunePos = rangeHandler.indexOf('if (isMediaStream) tuneStreamingTcpSendBuffer(request);');
assert.ok(streamLimitPos >= 0 && mediaTunePos > streamLimitPos,
  'audio and video responses should tune TCP only after securing a stream slot');
assert.match(ramRoute, /if \(activePrimaryStreams > 0\)[\s\S]{0,500}Media stream active; retry benchmark later/,
  'the RAM benchmark must not compete with active playback for internal TCP memory');
assert.match(ramRoute, /ramThroughputRequestCount[\s\S]{0,150}tuneStreamingTcpSendBuffer\(request\)/,
  'the RAM benchmark must exercise the same TCP tuning');
assert.match(firmware, /http\["tcpSendBufferTargetBytes"\]/);
assert.match(firmware, /http\["tcpSendBufferTuneFailureCount"\]/);
assert.match(firmware, /http\["tcpSendBufferLastAfterBytes"\]/);
assert.match(firmware, /tasks\["asyncTcpStackConfiguredBytes"\] = CONFIG_ASYNC_TCP_STACK_SIZE/);
assert.match(firmware, /tasks\["asyncTcpStackHighWaterBytes"\] = asyncTcpStackHighWaterBytes/);

console.log('TCP send buffer tuning tests passed');
