// Local stand-in for Netlify: static files from public/ plus the API functions over an in-memory store.
// Run: node tests/devserver.mjs   (port 8788; PORT=… to change). The browser tests start it themselves.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mods = {
  '/api/room': await import(ROOT + '/netlify/functions/room/logic.mjs'),
  '/api/challenge': await import(ROOT + '/netlify/functions/challenge/logic.mjs'),
  '/api/pup': await import(ROOT + '/netlify/functions/pup/logic.mjs'),
  '/api/group': await import(ROOT + '/netlify/functions/group/logic.mjs'),
  '/api/event': await import(ROOT + '/netlify/functions/event/logic.mjs'),
};
export const mem = new Map();
export const store = {
  async get(k) { const v = mem.get(k); return v ? { data: JSON.parse(v.d), etag: v.e } : null; },
  async set(k, d, o = {}) { if (o.onlyIfNew && mem.has(k)) return { modified: false }; if (o.onlyIfMatch && mem.get(k)?.e !== o.onlyIfMatch) return { modified: false }; mem.set(k, { d: JSON.stringify(d), e: String(Math.random()) }); return { modified: true }; },
  async del(k) { mem.delete(k); },
};
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };
// The website loads three.js from a CDN; here it comes from node_modules so the tests run offline.
const vendor = { '/vendor/three.min.js': 'three/build/three.min.js', '/vendor/OrbitControls.js': 'three/examples/js/controls/OrbitControls.js', '/vendor/BufferGeometryUtils.js': 'three/examples/js/utils/BufferGeometryUtils.js' };
export function start(port = +(process.env.PORT || 8788)) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (mods[url.pathname]) {
      let body = null;
      if (req.method === 'POST') { let t = ''; for await (const c of req) t += c; try { body = JSON.parse(t); } catch { body = null; } }
      const query = Object.fromEntries(url.searchParams);
      if (req.headers['x-player']) query.pid = req.headers['x-player'];
      if (req.headers['x-pup']) query.pid = req.headers['x-pup'];
      const opts = { country: 'US', key: req.headers['x-admin'] || '', adminKey: 'k' };
      const r = await mods[url.pathname].handle(req.method, query, body, store, opts);
      res.writeHead(r.status, { 'content-type': 'application/json' }); res.end(JSON.stringify(r.body)); return;
    }
    let p = decodeURIComponent(url.pathname);
    if (vendor[p]) p = null;
    const f = vendor[url.pathname] ? path.join(ROOT, 'node_modules', vendor[url.pathname]) : path.join(ROOT, 'public', p.endsWith('/') ? p + 'index.html' : p);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nope'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) { await start(); console.log('dev server on', process.env.PORT || 8788); }
