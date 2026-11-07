// Every film's link carries a fingerprint of its file (FILM_V in public/game/index.html), so phones that saved an older
// cut fetch the new one. Run: node --test tests/films.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('film fingerprints match the files in public/video (update FILM_V after replacing a film)', () => {
  const html = readFileSync(new URL('../public/game/index.html', import.meta.url), 'utf8');
  const v = JSON.parse(html.match(/const FILM_V=(\{[^;]*\});/)[1]);
  const dir = new URL('../public/video/', import.meta.url);
  const films = readdirSync(dir).filter((f) => f.endsWith('.mp4') && !f.startsWith('how-to-play') && f !== 'for-groups.mp4').map((f) => f.slice(0, -4)).sort();
  assert.deepEqual(Object.keys(v).sort(), films, 'one fingerprint per film');
  for (const f of films) assert.equal(v[f], createHash('sha256').update(readFileSync(new URL(f + '.mp4', dir))).digest('hex').slice(0, 8), `${f}.mp4 changed: update its FILM_V line`);
});
