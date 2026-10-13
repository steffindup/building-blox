// Blitz challenges and the Daily Bloppit. Kept free of Netlify imports so it can be tested locally.
//
// A challenge is an async race: one player builds a puzzle against the clock, gets a 6-character code,
// and sends it to a friend, who builds the same puzzle later. Everyone who plays it is listed by total time.
// The Daily Bloppit is one library puzzle a day that everybody plays; the server only keeps a list of
// times for each day (no names), so a player can see how they did compared with everyone else.
//
// The store adapter is the same as the room server's:
//   get(key) -> { data, etag } | null
//   set(key, data, { onlyIfMatch?, onlyIfNew? }) -> { modified }
import { cleanName } from '../room/logic.mjs';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CHALLENGE_TTL_MS = 30 * 86400_000; // challenges are forgotten 30 days after the last run
export const DAILY_KEEP_DAYS = 7;               // daily times are kept for a week
const MAX_RUNS = 12;                            // players per challenge
const MAX_MODEL_CHARS = 2_500_000;
const MAX_DAILY = 20_000;
const DAILY_BOARD = 50;                          // names shown on each day's scoreboard                       // times kept per day
const MISS_MS = 1000;                           // each miss adds 1 second (same as Blitz)
const HINT_MS = 5000;                           // each hint adds 5 seconds (same as Blitz)
const MIN_MS_PER_BRICK = 300;                   // faster than this per brick isn't a real build
const MAX_MS = 3 * 3600_000;

const rand = (n, chars) => { let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); for (const v of a) s += chars[v % chars.length]; return s; };
const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
const chKey = (c) => `ch/${c}`;
const chModelKey = (c) => `chmodel/${c}`;
const dayKey = (d) => `daily/${d}`;
export const total = (r) => r.ms + r.miss * MISS_MS + (r.hint || 0) * HINT_MS;

// UTC calendar day, as YYYY-MM-DD
export const dayOf = (t) => new Date(t).toISOString().slice(0, 10);
// The daily puzzle is chosen by day, so a player a few hours either side of UTC can still send their time
const dayOk = (d, now) => [-1, 0, 1].some((k) => dayOf(now + k * 86400_000) === d);

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

// Daily scoreboard names are seen by every player, so they're stricter than room names: a first name or nickname
// in plain letters (no numbers, @handles or web addresses), rude words become "Player", and anyone can play as
// "A player" instead.
export function boardName(s) {
  const raw = String(s || '');
  if (/@|www|https?:|\.(com|net|org|io|gg|tv|me)\b|\d{3,}/i.test(raw)) return 'Player';
  const n = cleanName(raw.normalize('NFKC').replace(/[^\p{L}\p{M} '\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 12));
  return n || 'Player';
}
const dailyTop = (d, k) => (d.board || []).slice(0, k).map((e) => ({ name: e.name, t: e.t }));

export async function handle(method, query, body, store) {
  const now = Date.now();
  if (method === 'GET') {
    if (query.ping) return { status: 200, body: { ok: true } };
    if (query.daily) {
      const day = String(query.daily);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { status: 400, body: { error: 'Bad day.' } };
      const r = await store.get(dayKey(day));
      const d = r ? r.data : { times: [] };
      return { status: 200, body: { day, n: d.times.length, best: d.times.length ? d.times[0] : null, top: dailyTop(d, query.board ? DAILY_BOARD : 3) } };
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

  // Daily Bloppit: add a time to today's list and say where it comes
  if (a === 'daily') {
    const day = String(body.day || '');
    if (!dayOk(day, now)) return { status: 400, body: { error: 'That daily puzzle has finished.' } };
    const nBricks = Math.floor(Number(body.nBricks)) || 0;
    const run = cleanRun(body, nBricks);
    if (run.error) return { status: 400, body: { error: run.error } };
    const t = total(run);
    for (let i = 0; i < 8; i++) {
      const r = await store.get(dayKey(day));
      const d = r ? r.data : { day, times: [] };
      // Keep the list sorted; once it's very long, only the fastest times are kept
      let k = 0, hi = d.times.length; while (k < hi) { const m = (k + hi) >> 1; if (d.times[m] < t) k = m + 1; else hi = m; }
      d.times.splice(k, 0, t); if (d.times.length > MAX_DAILY) d.times.length = MAX_DAILY;
      // The scoreboard: the fastest few, with the name each player chose (or "A player")
      const name = body.anon ? 'A player' : boardName(body.name);
      const b = d.board || (d.board = []);
      let j = 0; while (j < b.length && b[j].t <= t) j++;
      if (j < DAILY_BOARD) { b.splice(j, 0, { name, t }); if (b.length > DAILY_BOARD) b.length = DAILY_BOARD; }
      const { modified } = await store.set(dayKey(day), d, r ? { onlyIfMatch: r.etag } : { onlyIfNew: true });
      if (modified) return { status: 200, body: { day, rank: k + 1, n: d.times.length, best: d.times[0], top: dailyTop(d, 3), name } };
      await new Promise((res) => setTimeout(res, 40 + Math.random() * 120));
    }
    return { status: 409, body: { error: 'Lots of people are playing right now. Please try again.' } };
  }

  return { status: 400, body: { error: 'Unknown action.' } };
}
