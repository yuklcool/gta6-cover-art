// Local preview server for the cover maker (Node 22, standard library
// only). Run `node serve.ts` and open http://localhost:8080 — it serves
// the files under app/ so the editor can be tried without a build step.
// It is a development helper only: it binds to loopback, never writes
// anything, and refuses every path that would escape app/.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_DIR = resolve(fileURLToPath(new URL('./app', import.meta.url)));

function pickPort() {
  const flag = process.argv.indexOf('--port');
  const wanted = flag === -1 ? 8080 : Number(process.argv[flag + 1]);
  return Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;
}

const TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf'],
  ['.otf', 'font/otf'],
  ['.wav', 'audio/wav'],
  ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'],
  ['.wasm', 'application/wasm'],
]);

function mimeFor(file) {
  return TYPES.get(extname(file).toLowerCase()) ?? 'application/octet-stream';
}

// Turn a request path into a file under APP_DIR, or null when it escapes.
function safeJoin(rawPath) {
  const clean = rawPath.endsWith('/') ? rawPath + 'index.html' : rawPath;
  const target = resolve(join(APP_DIR, decodeURIComponent(clean)));
  return target === APP_DIR || target.startsWith(APP_DIR + sep) ? target : null;
}

function fail(response, code, message) {
  response.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' });
  response.end(message);
}

const server = createServer((request, response) => {
  let target;
  try {
    target = safeJoin(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    fail(response, 400, 'bad request');
    return;
  }
  if (target === null) {
    fail(response, 403, 'forbidden');
    return;
  }
  let info;
  try {
    info = statSync(target);
    if (!info.isFile()) throw new Error('not a file');
  } catch {
    fail(response, 404, 'not found');
    return;
  }
  response.writeHead(200, {
    'content-type': mimeFor(target),
    'content-length': info.size,
    'cache-control': 'no-store',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(target).pipe(response);
});

const port = pickPort();
server.listen(port, '127.0.0.1', () => {
  console.log(`cover maker preview: http://localhost:${port}`);
});
