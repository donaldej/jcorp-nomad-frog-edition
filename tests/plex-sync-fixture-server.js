const http = require('node:http');

const port = Number(process.env.PORT || 32401);
const mediaSize = 1024 * 1024;
const media = Buffer.alloc(mediaSize, 0x5a);

function item(ratingKey, title) {
  return {
    ratingKey: String(ratingKey),
    title,
    year: 2026,
    type: 'movie',
    Media: [{ Part: [{
      key: '/fixture.mp4',
      file: `C:\\Fixtures\\${title}.mp4`,
      size: mediaSize,
      container: 'mp4'
    }] }]
  };
}

function sendJson(response, value) {
  const body = Buffer.from(JSON.stringify(value));
  response.writeHead(200, {
    'Content-Type': 'application/json',
    'Content-Length': body.length
  });
  response.end(body);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/playlists') {
    return sendJson(response, { MediaContainer: { Metadata: [
      { ratingKey: '1', title: 'Nomad Sync Fixture', playlistType: 'video' }
    ] } });
  }
  if (url.pathname === '/library/sections/1/collections') {
    return sendJson(response, { MediaContainer: { Metadata: [
      { ratingKey: '2', title: 'Nomad Collection Fixture', subtype: 'movie' }
    ] } });
  }
  if (url.pathname === '/playlists/1/items') {
    return sendJson(response, { MediaContainer: { Metadata: [item(999001, 'Playlist Fixture')] } });
  }
  if (url.pathname === '/library/collections/2/children') {
    return sendJson(response, { MediaContainer: { Metadata: [item(999002, 'Collection Fixture')] } });
  }
  if (url.pathname === '/fixture.mp4') {
    const range = request.headers.range;
    let start = 0;
    if (range) {
      const match = /^bytes=(\d+)-/.exec(range);
      if (match) start = Math.min(Number(match[1]), mediaSize);
    }
    const body = media.subarray(start);
    response.writeHead(start ? 206 : 200, {
      'Accept-Ranges': 'bytes',
      'Content-Type': 'video/mp4',
      'Content-Length': body.length,
      ...(start ? { 'Content-Range': `bytes ${start}-${mediaSize - 1}/${mediaSize}` } : {})
    });
    return response.end(body);
  }
  response.writeHead(404, { 'Content-Type': 'text/plain' });
  response.end('Not found');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Plex sync fixture listening on ${port}`);
});
