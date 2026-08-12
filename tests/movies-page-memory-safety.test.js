const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'JcorpNomadProject', 'JcorpNomadProject.ino'),
  'utf8'
);
const movies = fs.readFileSync(
  path.join(root, 'SD_Card_Template', 'movies.html'),
  'utf8'
);

const head = movies.slice(0, movies.indexOf('<style>'));
assert.doesNotMatch(head, /plyr\.min\.js|plyr\.css/,
  'Plyr assets must not load during initial library rendering');
assert.match(movies, /function ensurePlyrAssets\(\)/);
assert.match(movies, /await ensurePlyrAssets\(\)/);
assert.match(movies, /const COVER_LOAD_LIMIT = 1/);
assert.match(movies, /data-src="\$\{item\.cover\}"/);
assert.match(movies, /IntersectionObserver/);
assert.doesNotMatch(head, /src="\/theme-boot\.js"|src="\/nomad-utils\.js"|src="\/theme-manager\.js"/,
  'shared scripts must not fan out during the initial Movies request');
assert.match(movies, /setTimeout\(loadThemeManagerLater, 5000\)/);
assert.match(movies, /await ensureNomadUtils\(\)[\s\S]{0,80}await ensurePlyrAssets\(\)/);

assert.match(firmware, /MAX_PSRAM_UI_ASSET_BYTES = 256 \* 1024/);
assert.match(firmware, /sendPsramResponse\(request, mime\.c_str\(\), body, cacheControl\)/);
assert.match(firmware, /ESP\.getFreeHeap\(\) < HEALTH_LOW_HEAP_RESTART_BYTES/);
assert.match(firmware, /busy->addHeader\("Retry-After", "1"\)/);
assert.match(firmware, /url\.startsWith\("\/Movies\/"\)[\s\S]{0,100}handleRangeRequest\(request\)/);

console.log('movies page memory safety tests passed');
