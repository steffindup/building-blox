// Blitz challenges and the Weekly Bloppit. Kept free of Netlify imports so it can be tested locally.
//
// A challenge is an async race: one player builds a puzzle against the clock, gets a 6-character code,
// and sends it to a friend, who builds the same puzzle later. Everyone who plays it is listed by total time.
// The Weekly Bloppit is one puzzle a week that everybody builds; the server only keeps two counts for each
// week (how many finished, how many finished clean), so the finish screen can say "you and 68% of this week's
// builders finished clean". No names, no times, no ranks.
//
// The store adapter is the same as the room server's:
//   get(key) -> { data, etag } | null
//   set(key, data, { onlyIfMatch?, onlyIfNew? }) -> { modified }
import { cleanName } from '../room/logic.mjs';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CHALLENGE_TTL_MS = 30 * 86400_000; // challenges are forgotten 30 days after the last run
export const WEEKLY_KEEP_WEEKS = 8;             // weekly counts are kept for 8 weeks
const MAX_RUNS = 12;                            // players per challenge
const MAX_MODEL_CHARS = 2_500_000;
const MISS_MS = 1000;                           // each miss adds 1 second (same as Blitz)
const HINT_MS = 5000;                           // each hint adds 5 seconds (same as Blitz)
const MIN_MS_PER_BRICK = 300;                   // faster than this per brick isn't a real build
const MAX_MS = 3 * 3600_000;

const rand = (n, chars) => { let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); for (const v of a) s += chars[v % chars.length]; return s; };
const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
const chKey = (c) => `ch/${c}`;
const chModelKey = (c) => `chmodel/${c}`;
const weekKey = (w) => `weekly/${w}`;
export const total = (r) => r.ms + r.miss * MISS_MS + (r.hint || 0) * HINT_MS;

// The Weekly Bloppit changes on Monday at 8 am US Eastern. A week is named by that Monday's date (YYYY-MM-DD).
// The app computes the same key (weekOf in public/build/index.html); keep the two in step.
const ET = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' });
export function weekOf(t = Date.now()) {
  const p = Object.fromEntries(ET.formatToParts(t).map((x) => [x.type, x.value]));
  const dow = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  let back = (dow + 6) % 7;
  if (back === 0 && Number(p.hour) < 8) back = 7;   // Monday before 8 am ET still belongs to last week
  const d = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)));
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}
// A finish is accepted for this week and, for a few hours either side of the change, last week
const weekOk = (w, now) => w === weekOf(now) || w === weekOf(now - 7 * 86400_000);

function cleanRun(body, nBricks) {
  const ms = Math.round(Number(body.ms)), miss = Math.floor(Number(body.miss) || 0), hint = Math.floor(Number(body.hint) || 0);
  if (!(ms >= 0 && ms <= MAX_MS)) return { error: 'That time doesn’t look right.' };
  if (!(miss >= 0 && miss <= 9999)) return { error: 'That number of misses doesn’t look right.' };
  if (!(hint >= 0 && hint <= 9999)) return { error: 'That number of hints doesn’t look right.' };
  if (nBricks && ms < nBricks * MIN_MS_PER_BRICK) return { error: 'That was too quick to be a real build.' };
  return { ms, miss, hint };
}

// What anyone with the code may see. Run ids act as passwords, so only a flag says which run is yours.
function publicChallenge(c, mine) {
  const runs = [...c.runs].sort((a, b) => total(a) - total(b) || a.at - b.at)
    .map((r) => ({ name: r.name, ms: r.ms, miss: r.miss, hint: r.hint || 0, at: r.at, ...(mine && mine.includes(r.id) ? { me: true } : {}), ...(r.id === c.runs[0].id ? { maker: true } : {}) }));
  return { code: c.code, title: c.title, nBricks: c.nBricks, created: c.created, runs, full: c.runs.length >= MAX_RUNS };
}

async function readChallenge(store, code) {
  const r = await store.get(chKey(code));
  if (!r) return null;
  if (Date.now() - r.data.updated > CHALLENGE_TTL_MS) return null;
  return r;
}

export async function handle(method, query, body, store) {
  const now = Date.now();
  if (method === 'GET') {
    if (query.ping) return { status: 200, body: { ok: true } };
    if (query.daily) return { status: 410, body: { error: 'The Daily Bloppit is now the Weekly Bloppit. Please update the app.' } };
    if (query.weekly) {
      const week = String(query.weekly);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return { status: 400, body: { error: 'Bad week.' } };
      const r = await store.get(weekKey(week));
      const d = r ? r.data : { week, n: 0, clean: 0 };
      return { status: 200, body: { week, n: d.n, clean: d.clean, pct: d.n ? Math.round(100 * d.clean / d.n) : 0 } };
    }
    const code = cleanCode(query.code);
    if (code.length !== 6) return { status: 400, body: { error: 'Challenge codes have 6 letters and numbers.' } };
    if (query.model) {
      const m = await store.get(chModelKey(code));
      if (!m) return { status: 404, body: { error: 'That challenge wasn’t found.' } };
      return { status: 200, body: { model: m.data } };
    }
    const r = await readChallenge(store, code);
    if (!r) return { status: 404, body: { error: 'That challenge code wasn’t found. Check it, or ask for a new one.' } };
    const mine = String(query.runs || '').split(',').filter(Boolean);
    return { status: 200, body: { challenge: publicChallenge(r.data, mine) } };
  }

  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
  const a = body && body.action;

  // Make a challenge from a run that has just been played
  if (a === 'create') {
    const model = body.model, nBricks = Math.floor(Number(body.nBricks));
    if (!model || !Array.isArray(model.photos) || !model.photos.length) return { status: 400, body: { error: 'No puzzle to share.' } };
    if (JSON.stringify(model).length > MAX_MODEL_CHARS) return { status: 413, body: { error: 'Those photos are too big to share. Try a smaller puzzle.' } };
    if (!(nBricks > 1 && nBricks < 5000)) return { status: 400, body: { error: 'Bad puzzle size.' } };
    const run = cleanRun(body, nBricks);
    if (run.error) return { status: 400, body: { error: run.error } };
    const id = rand(16, 'abcdefghijklmnopqrstuvwxyz0123456789');
    for (let i = 0; i < 10; i++) {
      const code = rand(6, ALPHABET);
      const c = { code, created: now, updated: now, title: cleanName(body.title).slice(0, 24), nBricks,
        runs: [{ id, name: cleanName(body.name), ms: run.ms, miss: run.miss, hint: run.hint, at: now }] };
      const { modified } = await store.set(chKey(code), c, { onlyIfNew: true });
      if (!modified) continue;
      await store.set(chModelKey(code), model, {});
      return { status: 200, body: { code, runId: id, challenge: publicChallenge(c, [id]) } };
    }
    return { status: 500, body: { error: 'Couldn’t make a challenge code. Please try again.' } };
  }

  // Someone plays a challenge they were sent
  if (a === 'run') {
    const code = cleanCode(body.code);
    if (code.length !== 6) return { status: 400, body: { error: 'Challenge codes have 6 letters and numbers.' } };
    const id = rand(16, 'abcdefghijklmnopqrstuvwxyz0123456789');
    for (let i = 0; i < 8; i++) {
      const r = await readChallenge(store, code);
      if (!r) return { status: 404, body: { error: 'That challenge has ended.' } };
      const c = r.data;
      const run = cleanRun(body, c.nBricks);
      if (run.error) return { status: 400, body: { error: run.error } };
      if (c.runs.length >= MAX_RUNS) return { status: 409, body: { error: `This challenge is full (${MAX_RUNS} players).` } };
      c.runs.push({ id, name: cleanName(body.name), ms: run.ms, miss: run.miss, hint: run.hint, at: now });
      c.updated = now;
      const { modified } = await store.set(chKey(code), c, { onlyIfMatch: r.etag });
      const mine = [id, ...String(body.runs || '').split(',').filter(Boolean)];
      if (modified) return { status: 200, body: { runId: id, challenge: publicChallenge(c, mine) } };
      await new Promise((res) => setTimeout(res, 40 + Math.random() * 120));
    }
    return { status: 409, body: { error: 'The challenge was busy. Please try again.' } };
  }

  if (a === 'daily') return { status: 410, body: { error: 'The Daily Bloppit is now the Weekly Bloppit. Please update the app.' } };

  // Weekly Bloppit: count a finish (and whether it was clean: no misses, no hints). A player's first finish of the week only.
  if (a === 'weekly') {
    const week = String(body.week || '');
    if (!weekOk(week, now)) return { status: 400, body: { error: 'That week\'s Bloppit has finished.' } };
    const nBricks = Math.floor(Number(body.nBricks)) || 0;
    const run = cleanRun(body, nBricks);
    if (run.error) return { status: 400, body: { error: run.error } };
    const clean = run.miss === 0 && run.hint === 0;
    for (let i = 0; i < 8; i++) {
      const r = await store.get(weekKey(week));
      const d = r ? r.data : { week, n: 0, clean: 0 };
      d.n += 1; if (clean) d.clean += 1;
      const { modified } = await store.set(weekKey(week), d, r ? { onlyIfMatch: r.etag } : { onlyIfNew: true });
      if (modified) return { status: 200, body: { week, n: d.n, clean: d.clean, pct: Math.round(100 * d.clean / d.n), you: clean } };
      await new Promise((res) => setTimeout(res, 40 + Math.random() * 120));
    }
    return { status: 409, body: { error: 'Lots of people are building right now. Please try again.' } };
  }

  return { status: 400, body: { error: 'Unknown action.' } };
}
