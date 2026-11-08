// Crews (groups): a persistent shared goal for an approved family, club or class. Any creator makes a crew;
// the creator approves every join; members' finished builds add bricks to the crew's puzzle; the only things
// that pass between members are fixed phrases and stickers, under generated labels. A report hides a post for
// the reporter and queues it for review; three reports mute the sender in that crew until reviewed. A parent
// can see every crew a player is in and take them out, from the Grown-ups corner.
//
// Identity is the pup id (x-pup header): a member is a pup. Nothing typed by a child is stored: crew names are
// put together from fixed word lists (CREW_WORDS; older crews: one of GROUP_NAMES), posts are indexes into fixed lists, labels are generated from ids.
import { labelFor } from '../room/logic.mjs';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const GROUP_TTL_MS = 180 * 86400_000;       // a crew nobody has built in for six months is deleted
export const GROUP_NAMES = ['Otter Crew', 'Brick Buddies', 'Lighthouse Builders', 'Harbour Gang', 'Snap Squad', 'Island Crew', 'Reef Builders', 'Sandcastle Club', 'Tide Team', 'Puffin Patrol', 'Starfish Society', 'Clean Build Club'];
// A crew's own name (Steff, 8 Nov 2026): three words picked from these lists ("Brave" + "Puffin" + "Patrol"), so every
// crew can have its own name and nothing typed by a child is ever stored or shown. Append only: crews store indexes.
export const CREW_WORDS = [
  ['Brave', 'Happy', 'Speedy', 'Sunny', 'Clever', 'Mighty', 'Jolly', 'Lucky', 'Busy', 'Bright', 'Cosy', 'Tiny', 'Giant', 'Bouncy', 'Starry', 'Sparkly', 'Golden', 'Silver', 'Bold', 'Calm', 'Super', 'Wild', 'Snappy', 'Merry'],
  ['Otter', 'Puffin', 'Turtle', 'Frog', 'Penguin', 'Longtail', 'Lion', 'Heron', 'Dolphin', 'Octopus', 'Starfish', 'Crab', 'Seal', 'Whale', 'Seahorse', 'Brick', 'Lighthouse', 'Island', 'Harbour', 'Rocket', 'Rainbow', 'Comet', 'Coral', 'Moon'],
  ['Crew', 'Club', 'Squad', 'Team', 'Gang', 'Patrol', 'Builders', 'Buddies', 'Society', 'Pack', 'Band', 'Explorers'],
];
export const crewWords = (n) => Array.isArray(n) && n.length === 3 && n.every((k, i) => Number.isInteger(k) && k >= 0 && k < CREW_WORDS[i].length);
export const nameOf = (g) => crewWords(g.name) ? g.name.map((k, i) => CREW_WORDS[i][k]).join(' ') : (GROUP_NAMES[g.name] || GROUP_NAMES[0]);
export const PHRASES = ['Nice clean build!', 'Race you!', 'Let’s bloppit!', 'Great relay!', 'Welcome to the crew!', 'Good night, builders!', 'Almost there!', 'Snap!'];
export const STICKERS = ['🦦', '🧱', '⭐', '🏝️', '🎉', '👏', '🔥', '🌊'];
export const GOAL_BRICKS = 2000;                   // a crew puzzle: 2,000 bricks built together finish it
// The crew puzzles (drawn in public/game/index.html, CREW_PUZZLES): large and only for crews. The maker picks one
// when making the crew (the first is suggested), and picks the next once it's finished. (Steff, 7 Nov 2026)
export const PUZZLE_COUNT = 4, SUGGESTED_PUZZLE = 0;
const puzzleOf = (g) => (Number.isInteger(g.puzzle) && g.puzzle >= 0 && g.puzzle < PUZZLE_COUNT ? g.puzzle : SUGGESTED_PUZZLE);
const progressOf = (g) => g.members.reduce((a, m) => a + m.bricks, 0) - (g.base || 0);   // bricks towards this puzzle
// Inside a crew (Steff, 7 Nov 2026): a Crew Quick Game (a live room any member starts; the others see it and join),
// Pass the Puzzle (one model passed round the crew over days, each member building their share of pages in turn) and
// the Crew Mega Build (the big puzzle above).
const LIVE_MS = 3 * 3600_000;                       // a Crew Quick Game shows on the crew for 3 hours
const MAX_MODEL_CHARS = 2_500_000;
const passModelKey = (c) => `gpass/${c}`;
function cleanMoves(list, nBricks) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 5000).map((m) => ({ b: Math.floor(Number(m.b)), x: Math.round(Number(m.x)), z: Math.round(Number(m.z)) }))
    .filter((m) => m.b >= 0 && m.b < nBricks && Number.isFinite(m.x) && Number.isFinite(m.z));
}
// Whose turn it is: the next member in the order who is still in the crew
function passTurnId(g) { const p = g.pass; if (!p || p.done) return ''; const ids = new Set(g.members.map((m) => m.id));
  for (let k = 0; k < p.order.length; k++) { const id = p.order[(p.turn + k) % p.order.length]; if (ids.has(id)) return id; } return ''; }
function publicPass(g, pid) {
  const p = g.pass; if (!p) return null; const turnId = passTurnId(g);
  return { id: p.id, title: p.title, nBricks: p.nBricks, steps: p.steps, page: p.page, chunk: p.chunk, done: !!p.done, myTurn: turnId === pid,
    turnLabel: turnId ? labelFor(turnId) : '', byLabel: labelFor(p.by), byMe: p.by === pid, inIt: p.order.includes(pid), at: p.at,
    history: p.history.map((h) => ({ label: labelFor(h.id), me: h.id === pid, from: h.from, to: h.to, at: h.at })) };
}
const MAX_MEMBERS = 24, MAX_PENDING = 12, MAX_POSTS = 40, MUTE_AT = 3, MAX_GROUPS_PER_PUP = 6;

const rand = (n, chars) => { let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); for (const v of a) s += chars[v % chars.length]; return s; };
const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
const cleanId = (s) => /^[a-z0-9]{24}$/.test(String(s || '')) ? String(s) : '';
const gKey = (c) => `group/${c}`;
const memberKey = (pid) => `gmember/${pid}`;            // the crews a pup is in (codes), so a parent can list them

export function publicGroup(g, pid) {
  const me = g.members.find((m) => m.id === pid);
  const creator = g.members.find((m) => m.id === g.creator);
  const members = g.members.map((m) => ({ label: labelFor(m.id), bricks: m.bricks, builds: m.builds, joined: m.joined, me: m.id === pid, creator: m.id === g.creator, muted: !!m.muted }))
    .sort((a, b) => b.bricks - a.bricks);
  const posts = g.posts.filter((p) => !(p.reports || []).includes(pid))
    .map((p) => ({ id: p.id, label: labelFor(p.by), me: p.by === pid, phrase: p.phrase, sticker: p.sticker, at: p.at, reported: (p.reports || []).length > 0 && g.creator === pid }));
  const total = Math.min(GOAL_BRICKS, Math.max(0, progressOf(g)));
  return { code: g.code, name: nameOf(g), nameIdx: g.name, puzzle: puzzleOf(g), done: g.done || [], goal: GOAL_BRICKS, total,
    pct: Math.min(100, Math.floor(100 * total / GOAL_BRICKS)),
    builds: g.members.reduce((a, m) => a + m.builds, 0), created: g.created, members, posts, me: me ? { creator: g.creator === pid, muted: !!me.muted } : null,
    pending: g.creator === pid ? (g.pending || []).map((w) => ({ k: w.k, label: labelFor(w.id), at: w.at })) : undefined,
    pendingMe: (g.pending || []).some((w) => w.id === pid), creatorLabel: creator ? labelFor(creator.id) : '',
    pass: me ? publicPass(g, pid) : null,
    live: me && g.live && Date.now() - g.live.at < LIVE_MS ? { room: g.live.room, label: labelFor(g.live.by), me: g.live.by === pid, at: g.live.at } : null };
}

async function readGroup(store, code) {
  const r = await store.get(gKey(code));
  if (!r || !r.data) return null;
  if (Date.now() - (r.data.updated || 0) > GROUP_TTL_MS) return null;
  return r;
}
async function listFor(store, pid) { const r = await store.get(memberKey(pid)); return r && Array.isArray(r.data.codes) ? r.data.codes : []; }
async function remember(store, pid, code, on) {
  for (let i = 0; i < 6; i++) {
    const r = await store.get(memberKey(pid)); const codes = r && Array.isArray(r.data.codes) ? r.data.codes : [];
    const next = on ? [...new Set([code, ...codes])].slice(0, MAX_GROUPS_PER_PUP) : codes.filter((c) => c !== code);
    const { modified } = await store.set(memberKey(pid), { codes: next, updated: Date.now() }, r ? { onlyIfMatch: r.etag } : { onlyIfNew: true });
    if (modified) return;
  }
}
// Read-modify-write with retries on the etag
async function update(store, code, fn) {
  for (let i = 0; i < 8; i++) {
    const r = await readGroup(store, code);
    if (!r) return { status: 404, body: { error: 'That crew code wasn’t found.' } };
    const g = r.data, out = fn(g);
    if (out && out.error) return { status: out.status || 400, body: { error: out.error } };
    g.updated = Date.now();
    const { modified } = await store.set(gKey(code), g, { onlyIfMatch: r.etag });
    if (modified) return { status: 200, body: { group: g }, after: out && out.after };
    await new Promise((res) => setTimeout(res, 40 + Math.random() * 120));
  }
  return { status: 409, body: { error: 'The crew was busy. Please try again.' } };
}

export async function handle(method, query, body, store) {
  const now = Date.now(), pid = cleanId(query.pid);
  if (method === 'GET') {
    if (query.ping) return { status: 200, body: { ok: true } };
    if (!pid) return { status: 401, body: { error: 'Finish one build first; then you can join a crew.' } };
    if (query.mine) {
      const codes = await listFor(store, pid), groups = [];
      for (const c of codes) { const r = await readGroup(store, c); if (r) groups.push(publicGroup(r.data, pid)); }
      return { status: 200, body: { groups } };
    }
    const code = cleanCode(query.code);
    if (code.length !== 6) return { status: 400, body: { error: 'Crew codes have 6 letters and numbers.' } };
    const r = await readGroup(store, code);
    if (!r) return { status: 404, body: { error: 'That crew code wasn’t found. Check it with whoever made the crew.' } };
    if (query.pass) {
      const g = r.data; if (!g.members.some((m) => m.id === pid)) return { status: 403, body: { error: 'You’re not in this crew.' } };
      if (!g.pass) return { status: 404, body: { error: 'This crew has no Pass the Puzzle yet.' } };
      const m = await store.get(passModelKey(code)); if (!m) return { status: 404, body: { error: 'The puzzle has gone. Start a new one.' } };
      return { status: 200, body: { pass: publicPass(g, pid), moves: g.pass.moves, model: m.data } };
    }
    return { status: 200, body: { group: publicGroup(r.data, pid) } };
  }
  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
  if (!pid) return { status: 401, body: { error: 'Finish one build first; then you can make or join a crew.' } };
  const a = body && body.action;

  if (a === 'create') {
    // Three words from CREW_WORDS; a bare number is one of the older names (apps from before 8 Nov 2026 send that)
    const name = Array.isArray(body.name) ? body.name.slice(0, 4) : Math.floor(Number(body.name));
    if (!(Array.isArray(name) ? crewWords(name) : name >= 0 && name < GROUP_NAMES.length)) return { status: 400, body: { error: 'Pick your crew’s name from the lists.' } };
    const puzzle = body.puzzle == null ? SUGGESTED_PUZZLE : Math.floor(Number(body.puzzle));
    if (!(puzzle >= 0 && puzzle < PUZZLE_COUNT)) return { status: 400, body: { error: 'Pick a crew puzzle from the list.' } };
    if ((await listFor(store, pid)).length >= MAX_GROUPS_PER_PUP) return { status: 409, body: { error: `You can be in ${MAX_GROUPS_PER_PUP} crews at most.` } };
    for (let i = 0; i < 10; i++) {
      const code = rand(6, ALPHABET);
      const g = { code, name, puzzle, base: 0, done: [], creator: pid, created: now, updated: now, members: [{ id: pid, joined: now, bricks: 0, builds: 0 }], pending: [], posts: [], reports: [] };
      const { modified } = await store.set(gKey(code), g, { onlyIfNew: true });
      if (!modified) continue;
      await remember(store, pid, code, true);
      return { status: 200, body: { group: publicGroup(g, pid) } };
    }
    return { status: 500, body: { error: 'Couldn’t make a crew code. Please try again.' } };
  }
  const code = cleanCode(body.code);
  if (code.length !== 6) return { status: 400, body: { error: 'Crew codes have 6 letters and numbers.' } };

  if (a === 'join') {
    if ((await listFor(store, pid)).length >= MAX_GROUPS_PER_PUP) return { status: 409, body: { error: `You can be in ${MAX_GROUPS_PER_PUP} crews at most.` } };
    const r = await update(store, code, (g) => {
      if (g.members.some((m) => m.id === pid)) return { error: 'You’re already in this crew.', status: 409 };
      if (g.pending.some((w) => w.id === pid)) return { error: 'You’ve already asked. Wait for the crew’s maker to let you in.', status: 409 };
      if (g.members.length >= MAX_MEMBERS) return { error: `This crew is full (${MAX_MEMBERS}).`, status: 409 };
      if (g.pending.length >= MAX_PENDING) return { error: 'Lots of people are waiting to join. Try again later.', status: 409 };
      g.pending.push({ id: pid, k: rand(8, ALPHABET), at: now });
    });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'approve' || a === 'deny') {
    let who = '';
    const r = await update(store, code, (g) => {
      if (g.creator !== pid) return { error: 'Only the crew’s maker can do that.', status: 403 };
      const i = g.pending.findIndex((w) => w.k === String(body.k || '')); if (i < 0) return { error: 'That request has gone.', status: 404 };
      const w = g.pending.splice(i, 1)[0]; who = w.id;
      if (a === 'approve' && !g.members.some((m) => m.id === w.id)) g.members.push({ id: w.id, joined: now, bricks: 0, builds: 0 });
    });
    if (r.status === 200 && a === 'approve' && who) await remember(store, who, code, true);
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'leave' || a === 'remove') {
    // leave: yourself (or a parent, from the Grown-ups corner). remove: the maker takes someone out, by label.
    let who = pid;
    const r = await update(store, code, (g) => {
      if (a === 'remove') { if (g.creator !== pid) return { error: 'Only the crew’s maker can do that.', status: 403 }; const m = g.members.find((x) => labelFor(x.id) === String(body.label || '')); if (!m || m.id === pid) return { error: 'Not found.', status: 404 }; who = m.id; }
      if (who === g.creator && g.members.length > 1) { g.creator = g.members.find((m) => m.id !== who).id; }   // the crew passes to the next member
      g.members = g.members.filter((m) => m.id !== who); g.pending = g.pending.filter((w) => w.id !== who);
    });
    if (r.status === 200) { await remember(store, who, code, false); if (!r.body.group.members.length) await store.del(gKey(code)); }
    return r.status === 200 ? { status: 200, body: { group: r.body.group.members.length ? publicGroup(r.body.group, pid) : null } } : r;
  }
  if (a === 'contribute') {
    const bricks = Math.floor(Number(body.bricks)); if (!(bricks > 0 && bricks < 5000)) return { status: 400, body: { error: 'Bad build size.' } };
    const r = await update(store, code, (g) => { const m = g.members.find((x) => x.id === pid); if (!m) return { error: 'You’re not in this crew.', status: 403 }; m.bricks += bricks; m.builds += 1; });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'puzzle') {
    // The maker can change the puzzle before anyone has built towards it, and picks the next one once it's finished.
    const puzzle = Math.floor(Number(body.puzzle)); if (!(puzzle >= 0 && puzzle < PUZZLE_COUNT)) return { status: 400, body: { error: 'Pick a crew puzzle from the list.' } };
    const r = await update(store, code, (g) => {
      if (g.creator !== pid) return { error: 'Only the crew’s maker can do that.', status: 403 };
      const prog = progressOf(g);
      if (prog >= GOAL_BRICKS) { g.done = [...(g.done || []), puzzleOf(g)]; g.base = (g.base || 0) + GOAL_BRICKS; }   // extra bricks carry over
      else if (prog > 0) return { error: 'The crew has started this puzzle. Finish it first, then pick the next one.', status: 409 };
      g.puzzle = puzzle;
    });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'live') {
    // A member started a Crew Quick Game: the room's code shows on the crew for the others (the host still lets each one in)
    const room = String(body.room || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (room.length !== 5) return { status: 400, body: { error: 'Bad room code.' } };
    const r = await update(store, code, (g) => { if (!g.members.some((m) => m.id === pid)) return { error: 'You’re not in this crew.', status: 403 }; g.live = { room, by: pid, at: now }; });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'live-end') {
    const r = await update(store, code, (g) => { if (g.live && g.live.by === pid) g.live = null; });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'pass-start') {
    // Pass the Puzzle: the starter's own first share of pages comes with the model. Everyone in the crew now takes a turn.
    const model = body.model, nBricks = Math.floor(Number(body.nBricks)), steps = Math.floor(Number(body.steps)), to = Math.floor(Number(body.to));
    if (!model || !Array.isArray(model.photos) || !model.photos.length) return { status: 400, body: { error: 'No puzzle to pass.' } };
    if (JSON.stringify(model).length > MAX_MODEL_CHARS) return { status: 413, body: { error: 'That puzzle is too big to pass round. Try a smaller one.' } };
    if (!(nBricks > 1 && nBricks < 5000) || !(steps > 1 && steps < 5000) || !(to >= 1 && to < steps)) return { status: 400, body: { error: 'Bad puzzle size.' } };
    const moves = cleanMoves(body.moves, nBricks); if (!moves.length) return { status: 400, body: { error: 'Build your pages first.' } };
    const r0 = await readGroup(store, code); if (!r0) return { status: 404, body: { error: 'That crew code wasn’t found.' } };
    if (r0.data.pass && !r0.data.pass.done) return { status: 409, body: { error: 'Your crew is already passing a puzzle round. Finish that one first.' } };
    await store.set(passModelKey(code), model, {});
    const r = await update(store, code, (g) => {
      if (!g.members.some((m) => m.id === pid)) return { error: 'You’re not in this crew.', status: 403 };
      if (g.members.length < 2) return { error: 'Pass the Puzzle needs at least two in the crew.', status: 409 };
      if (g.pass && !g.pass.done) return { error: 'Your crew is already passing a puzzle round. Finish that one first.', status: 409 };
      const order = [pid, ...g.members.map((m) => m.id).filter((id) => id !== pid)];
      const chunk = Math.max(1, Math.ceil(steps / order.length));
      g.pass = { id: rand(8, ALPHABET), title: String(body.title || 'Puzzle').slice(0, 24), nBricks, steps, chunk, order, turn: 1 % order.length, page: Math.min(to, steps - 1),
        moves, by: pid, at: now, done: false, history: [{ id: pid, from: 0, to: Math.min(to, steps - 1), at: now }] };
    });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'pass-turn') {
    const r = await update(store, code, (g) => {
      const p = g.pass; if (!p || p.done || p.id !== String(body.id || '')) return { error: 'That puzzle has moved on. Open the crew again.', status: 409 };
      if (passTurnId(g) !== pid) return { error: 'It isn’t your turn yet.', status: 409 };
      const to = Math.floor(Number(body.to)); if (!(to > p.page && to <= p.steps)) return { error: 'Bad pages.', status: 400 };
      const moves = cleanMoves(body.moves, p.nBricks); if (!moves.length) return { error: 'Build your pages first.', status: 400 };
      const k = p.order.indexOf(pid);
      p.moves = p.moves.concat(moves).slice(0, 5000); p.history.push({ id: pid, from: p.page, to, at: now }); p.page = to; p.at = now;
      if (to >= p.steps) p.done = true; else p.turn = (k + 1) % p.order.length;
    });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'post') {
    const phrase = body.phrase == null ? null : Math.floor(Number(body.phrase)), sticker = body.sticker == null ? null : Math.floor(Number(body.sticker));
    if (!((phrase != null && phrase >= 0 && phrase < PHRASES.length) || (sticker != null && sticker >= 0 && sticker < STICKERS.length))) return { status: 400, body: { error: 'Pick a phrase or a sticker.' } };
    const r = await update(store, code, (g) => {
      const m = g.members.find((x) => x.id === pid); if (!m) return { error: 'You’re not in this crew.', status: 403 };
      if (m.muted) return { error: 'Your posts in this crew are paused while a report is looked at.', status: 403 };
      const last = g.posts.filter((p) => p.by === pid).slice(-3); if (last.length === 3 && now - last[0].at < 60_000) return { error: 'Slow down a little: three posts a minute.', status: 429 };
      g.posts.push({ id: rand(10, 'abcdefghijklmnopqrstuvwxyz0123456789'), by: pid, phrase: phrase != null ? phrase : undefined, sticker: sticker != null ? sticker : undefined, at: now, reports: [] });
      if (g.posts.length > MAX_POSTS) g.posts = g.posts.slice(-MAX_POSTS);
    });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'report') {
    const r = await update(store, code, (g) => {
      const m = g.members.find((x) => x.id === pid); if (!m) return { error: 'You’re not in this crew.', status: 403 };
      const p = g.posts.find((x) => x.id === String(body.post || '')); if (!p) return { error: 'That post has gone.', status: 404 };
      if (!p.reports.includes(pid)) p.reports.push(pid);
      g.reports.push({ post: p.id, by: pid, at: now });                      // the review queue (the maker's weekly look)
      const sender = g.members.find((x) => x.id === p.by);
      if (sender && g.posts.filter((x) => x.by === p.by).reduce((n, x) => n + x.reports.length, 0) >= MUTE_AT) sender.muted = true;
    });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  if (a === 'unmute') {
    const r = await update(store, code, (g) => { if (g.creator !== pid) return { error: 'Only the crew’s maker can do that.', status: 403 }; const m = g.members.find((x) => labelFor(x.id) === String(body.label || '')); if (!m) return { error: 'Not found.', status: 404 }; m.muted = false; g.posts.forEach((p) => { if (p.by === m.id) p.reports = []; }); });
    return r.status === 200 ? { status: 200, body: { group: publicGroup(r.body.group, pid) } } : r;
  }
  return { status: 400, body: { error: 'Unknown action.' } };
}
