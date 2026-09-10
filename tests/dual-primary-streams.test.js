const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);

assert.match(firmware, /static const int MAX_CONCURRENT_PRIMARY_STREAMS = 2/);
assert.match(firmware, /static const int MAX_CONCURRENT_STREAMS = 2/);
assert.match(firmware, /NOMAD_MEDIA_TCP_SEND_BUFFER_BYTES = 4UL \* CONFIG_LWIP_TCP_MSS/);
assert.match(firmware, /NOMAD_BENCHMARK_TCP_SEND_BUFFER_BYTES = 8UL \* CONFIG_LWIP_TCP_MSS/);
assert.match(
  firmware,
  /if \(isMediaStream\) tuneStreamingTcpSendBuffer\(request, NOMAD_MEDIA_TCP_SEND_BUFFER_BYTES\)/
);

console.log('dual primary stream tests passed');
