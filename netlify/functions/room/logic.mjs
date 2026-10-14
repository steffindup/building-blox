// Room logic for "Play together". Kept free of Netlify imports so it can be tested locally.
// A store adapter must provide:
//   get(key)                      -> { data, etag } | null
//   set(key, data, { onlyIfMatch?, onlyIfNew? }) -> { modified }

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const COLORS = ['#D2352B', '#0055BF', '#237841', '#F08A00'];
const MAX_PLAYERS = 4;
const STALE_MS = 45_000;          // a player not seen for this long can be skipped
const ROOM_TTL_MS = 3 * 86400_000; // rooms are forgotten after 3 days without activity
const MAX_MODEL_CHARS = 2_500_000;
const MAX_WAITING = 6;            // people waiting for the host to let them in
const WAIT_STALE_MS = 60_000;     // a waiting person who stops checking in is dropped
const BLITZ_PER_TURN = 3;         // Bloppit Blitz: each turn is 1, 2 or 3 bricks (the player taps Done)

// No chat and no voice: rooms are for placing bricks together and nothing else passes between players.
// Typed chat and voice were switched off in October 2026 (child-safety decision); the old actions return 410.
// The word filter below only guards the player name shown in the room.

const BAD = new Set(('ass arse asshole arsehole asswipe bastard bitch bitches bollocks boobs bullshit cock cum cunt dick dickhead '
  + 'dildo fag faggot fck fk fuck fucked fucker fucking fuk motherfucker nigga nigger penis piss porn prick pussy rape '
  + 'retard retarded sex sexy shit shitty slut stfu tits twat vagina wank wanker whore wtf kys').split(' '));
const BAD_PREFIX = ['fuck', 'fuk', 'shit', 'bitch', 'cunt', 'wank', 'twat', 'slut', 'whore', 'nigg', 'fagg', 'retard', 'motherf'];
const LEET = { '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b' };
const squash = (w) => w.replace(/(.)\1+/g, '$1');
const BAD_SQUASHED = new Set([...BAD].filter((w) => w.length >= 4).map(squash));
export function isBad(token) {
  const w = token.toLowerCase().replace(/[01!34@5$78]/g, (c) => LEET[c]).replace(/[^a-z]/g, '');
  if (!w) return false;
  if (BAD.has(w) || BAD_PREFIX.some((p) => w.startsWith(p))) return true;
  const sq = squash(w);
  return sq.length >= 4 && BAD_SQUASHED.has(sq);
}

const rand = (n, chars) => { let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); for (const v of a) s += chars[v % chars.length]; return s; };
const newCode = () => rand(5, ALPHABET);
const newId = () => rand(20, 'abcdefghijklmnopqrstuvwxyz0123456789');
// Nothing a child typed is shown to another child: players and knockers get a generated label from their id
// ("Brave Otter 214"); the typed name stays on its own device. Shared by the challenge server.
const ADJ = ['Brave', 'Sunny', 'Quick', 'Clever', 'Happy', 'Mighty', 'Gentle', 'Speedy', 'Sandy', 'Salty', 'Jolly', 'Lucky', 'Curious', 'Bouncy', 'Shiny', 'Cosy'];
const ANIMAL = ['Otter', 'Crab', 'Puffin', 'Turtle', 'Gull', 'Dolphin', 'Seal', 'Whale', 'Starfish', 'Parrotfish', 'Heron', 'Pelican'];
export function labelFor(id) { let h = 7; for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `${ADJ[h % ADJ.length]} ${ANIMAL[(h >>> 4) % ANIMAL.length]} ${100 + ((h >>> 8) % 900)}`; }
export const cleanName = (s) => {
  const n = String(s || '').replace(/[<>&"]/g, '').trim().slice(0, 16);
  // Names are shown to everyone in the room, so a rude one becomes plain "Player".
  return !n || n.split(/[\s.,_\-]+/).some(isBad) || isBad(n) ? 'Player' : n;
};

const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
const roomKey = (c) => `room/${c}`;
const modelKey = (c) => `model/${c}`;

// What everyone may see: never send player ids (they act as passwords).
// Who is waiting to join is only sent to players in the room
// (`viewer` is the asking player's index, or -1), not to anyone who just knows the code.
function publicState(s, viewer = -1) {
  const now = Date.now();
  const out = {
    code: s.code, ver: s.ver, started: s.started, finished: s.finished, perTurn: s.perTurn, mode: s.mode || 'classic',
    nBricks: s.nBricks, title: s.title, level: s.level, host: s.host, turn: s.turn,
    turnPlaced: s.turnPlaced, turnStart: s.turnStart, moves: s.moves, now, quota: s.quota || 0,
    players: s.players.map((p) => ({ name: p.name, color: p.color, pen: p.pen, stale: now - p.seen > STALE_MS,
      ...(s.mode === 'blitz' ? { ms: p.ms || 0, miss: p.miss || 0, hint: p.hint || 0, n: p.n || 0 } : {}) })),
  };
  if (viewer >= 0) {
    out.me = viewer;
    out.waiting = (s.waiting || []).filter((w) => now - w.seen <= WAIT_STALE_MS).map((w) => ({ k: w.k, name: w.name }));
  }
  return out;
}
function prune(s) {
  const now = Date.now();
  if (s.waiting) s.waiting = s.waiting.filter((w) => now - w.seen <= WAIT_STALE_MS);
  // Rooms made before chat and voice were switched off may still carry them: drop them on sight.
  delete s.chat; delete s.chatN; delete s.sig; delete s.sigN; delete s.voice;
  s.players.forEach((p) => { delete p.vc; delete p.chatAt; });
}

// Bloppit Blitz: each player's clock only runs during their own turn. The server keeps the time,
// so a device's clock can't be used to cheat. Time is added up when a turn ends (or the model is finished).
const blitz = (s) => s.mode === 'blitz';
function stopClock(s) {
  if (!blitz(s) || !s.started) return;
  const p = s.players[s.turn];
  if (p) p.ms = (p.ms || 0) + Math.max(0, Date.now() - s.turnStart);
}
// In Blitz everyone places the same number of bricks (their share), so a player who has placed theirs is skipped.
const shareDone = (s, i) => blitz(s) && s.quota > 0 && (s.players[i].n || 0) >= s.quota;
function nextTurn(s) {
  stopClock(s);
  for (let k = 0; k < s.players.length; k++) {
    s.turn = (s.turn + 1) % s.players.length;
    if (!shareDone(s, s.turn)) break;
  }
  s.turnPlaced = 0;
  s.turnStart = Date.now();
}

async function readRoom(store, code) {
  const r = await store.get(roomKey(code));
  if (!r) return null;
  if (Date.now() - r.data.updated > ROOM_TTL_MS) return null;
  return r;
}

// Read-modify-write with an etag check. Only the player whose turn it is
// places bricks, so collisions are rare; on one we simply re-read and retry.
async function update(store, code, fn, viewerId) {
  for (let i = 0; i < 8; i++) {
    const r = await readRoom(store, code);
    if (!r) return { status: 404, body: { error: 'That room code wasn’t found. Check it, or start a new game.' } };
    const s = r.data;
    const out = fn(s);
    if (out && out.error) return { status: out.status || 400, body: { error: out.error } };
    prune(s);
    s.ver += 1; s.updated = Date.now();
    const { modified } = await store.set(roomKey(code), s, { onlyIfMatch: r.etag });
    if (modified) return { status: 200, body: { ...(out || {}), state: publicState(s, viewerId ? findPlayer(s, viewerId) : -1) } };
    await new Promise((res) => setTimeout(res, 40 + Math.random() * 120));
  }
  return { status: 409, body: { error: 'The room was busy. Please try again.' } };
}

const findPlayer = (s, id) => s.players.findIndex((p) => p.id === id);
const mergePen = (a, b) => {
  const o = { hint: 0, auto: 0, miss: 0, ...a };
  if (b) for (const k of ['hint', 'auto', 'miss']) o[k] = Math.max(o[k] || 0, Math.min(9999, Number(b[k]) || 0));
  return o;
};

export async function handle(method, query, body, store) {
  if (method === 'GET') {
    if (query.ping) return { status: 200, body: { ok: true } };
    const code = cleanCode(query.code);
    if (!code) return { status: 400, body: { error: 'Missing room code.' } };
    if (query.model) {
      const m = await store.get(modelKey(code));
      if (!m) return { status: 404, body: { error: 'Room not found.' } };
      return { status: 200, body: { model: m.data } };
    }
    const r = await readRoom(store, code);
    if (!r) return { status: 404, body: { error: 'That room code wasn’t found. Check it, or start a new game.' } };
    if (query.since && Number(query.since) === r.data.ver) return { status: 200, body: { same: true, ver: r.data.ver } };
    const s = r.data, idx = query.pid ? findPlayer(s, query.pid) : -1;
    if (idx < 0 && query.pid) {
      if ((s.waiting || []).some((w) => w.id === query.pid)) return { status: 200, body: { waiting: true, state: publicState(s) } };
      if ((s.denied || []).includes(query.pid)) return { status: 200, body: { denied: true } };
    }
    return { status: 200, body: { state: publicState(s, idx) } };
  }

  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
  const a = body && body.action;

  if (a === 'create') {
    const model = body.model;
    const nBricks = Math.floor(Number(body.nBricks));
    if (!model || !Array.isArray(model.photos) || !model.photos.length) return { status: 400, body: { error: 'No model to build.' } };
    if (JSON.stringify(model).length > MAX_MODEL_CHARS) return { status: 413, body: { error: 'Those photos are too big to share. Try a smaller model.' } };
    if (!(nBricks > 0 && nBricks < 5000)) return { status: 400, body: { error: 'Bad model size.' } };
    const mode = body.mode === 'blitz' ? 'blitz' : 'classic';
    const perTurn = mode === 'blitz' ? BLITZ_PER_TURN : Math.max(1, Math.min(20, Math.floor(Number(body.perTurn) || 5)));
    const now = Date.now();
    const pid = newId(), player = { id: pid, name: labelFor(pid), color: COLORS[0], pen: { hint: 0, auto: 0, miss: 0 }, seen: now, ms: 0, miss: 0 };
    for (let i = 0; i < 10; i++) {
      const code = newCode();
      const s = {
        code, ver: 1, created: now, updated: now, started: false, finished: false, mode, perTurn, nBricks,
        title: cleanName(body.title).slice(0, 24), level: Number.isInteger(body.level) ? body.level : null,
        host: 0, turn: 0, turnPlaced: 0, turnStart: now, moves: [], players: [player],
      };
      const { modified } = await store.set(roomKey(code), s, { onlyIfNew: true });
      if (!modified) continue;
      await store.set(modelKey(code), model, {});
      return { status: 200, body: { code, playerId: player.id, me: 0, state: publicState(s, 0) } };
    }
    return { status: 500, body: { error: 'Couldn’t make a room code. Please try again.' } };
  }

  const code = cleanCode(body && body.code);
  if (!code) return { status: 400, body: { error: 'Missing room code.' } };

  // Joining: someone already in the room just comes back in. Anyone new waits until the host lets them in.
  if (a === 'join') {
    let me = -1, pid = null, waiting = false;
    const res = await update(store, code, (s) => {
      const now = Date.now();
      const idx = body.playerId ? findPlayer(s, body.playerId) : -1;
      if (idx >= 0) { s.players[idx].seen = now; me = idx; pid = body.playerId; return {}; }
      if (s.finished) return { error: 'That game has already finished.' };
      if (s.players.length >= MAX_PLAYERS) return { error: 'That room is full (4 players).' };
      s.waiting = (s.waiting || []).filter((w) => now - w.seen <= WAIT_STALE_MS);
      const w0 = body.playerId ? s.waiting.find((w) => w.id === body.playerId) : null;
      if (w0) { w0.seen = now; pid = w0.id; waiting = true; return {}; }
      if (s.waiting.length >= MAX_WAITING) return { error: 'Lots of people are already waiting to join. Try again in a minute.' };
      const wid = newId(), w = { id: wid, k: rand(8, ALPHABET), name: labelFor(wid), seen: now };
      s.waiting.push(w); pid = w.id; waiting = true;
      return {};
    }, body.playerId);
    if (res.status === 200) {
      Object.assign(res.body, { code, playerId: pid, me, waiting });
    }
    return res;
  }
  // Someone waiting checks in (and can stop waiting)
  if (a === 'wait' || a === 'cancel') {
    return update(store, code, (s) => {
      const w = (s.waiting || []).find((x) => x.id === body.playerId);
      if (!w) return findPlayer(s, body.playerId) >= 0 ? {} : { error: 'You’re no longer waiting to join this room.', status: 404 };
      if (a === 'cancel') s.waiting = s.waiting.filter((x) => x !== w); else w.seen = Date.now();
      return {};
    }, body.playerId);
  }

  const pid = body.playerId;
  const mine = (s) => { const i = findPlayer(s, pid); if (i < 0) return -1; s.players[i].seen = Date.now(); return i; };

  if (a === 'ping') return update(store, code, (s) => (mine(s) < 0 ? { error: 'You’re not in this room.', status: 403 } : {}), pid);

  if (a === 'start') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (i !== s.host) return { error: 'Only the player who made the room can start it.', status: 403 };
      if (!s.started) {
        if (blitz(s)) {
          s.quota = Math.floor(s.nBricks / s.players.length);
          if (s.quota < 1) return { error: 'This model doesn’t have enough bricks for everyone. Pick a bigger one.', status: 409 };
          s.players.forEach((p) => { p.n = 0; p.ms = 0; p.miss = 0; p.hint = 0; });
        }
        s.started = true; s.turn = 0; s.turnPlaced = 0; s.turnStart = Date.now();
      }
      return {};
    }, pid);
  }

  // Host only: let someone in, or say no
  if (a === 'admit' || a === 'deny') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (i !== s.host) return { error: 'Only the player who made the room can let people in.', status: 403 };
      const w = (s.waiting || []).find((x) => x.k === body.k);
      if (!w) return { error: 'They’re no longer waiting.', status: 404 };
      s.waiting = s.waiting.filter((x) => x !== w);
      if (a === 'deny') { s.denied = [...(s.denied || []), w.id].slice(-20); return {}; }
      if (s.players.length >= MAX_PLAYERS) return { error: 'The room is full (4 players).', status: 409 };
      if (blitz(s) && s.started) return { error: 'Bloppit Blitz has already started, so nobody new can join this game.', status: 409 };
      const used = new Set(s.players.map((p) => p.color));
      s.players.push({ id: w.id, name: w.name, color: COLORS.find((c) => !used.has(c)) || COLORS[0], pen: { hint: 0, auto: 0, miss: 0 }, seen: Date.now(), ms: 0, miss: 0 });
      return {};
    }, pid);
  }

  // Chat and voice are no longer part of Bloppit (switched off October 2026). Old builds get a clear answer.
  if (a === 'voice' || a === 'vc' || a === 'signal' || a === 'chat') {
    return { status: 410, body: { error: 'Chat and voice are no longer part of Bloppit. Rooms are for building together.' } };
  }

  if (a === 'pen') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (!blitz(s)) s.players[i].pen = mergePen(s.players[i].pen, body.pen);  // Blitz has no hints to count
      return {};
    }, pid);
  }

  // Bloppit Blitz: a hint adds 5 seconds to the player whose turn it is (one charge per step, counted by the app)
  if (a === 'hint') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (!blitz(s) || !s.started || s.finished || i !== s.turn) return {};
      s.players[i].hint = Math.min(9999, (s.players[i].hint || 0) + 1);
      return {};
    }, pid);
  }

  // Bloppit Blitz: a wrong drop adds 1 second to the player whose turn it is
  if (a === 'miss') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (!blitz(s) || !s.started || s.finished || i !== s.turn) return {};
      s.players[i].miss = Math.min(9999, (s.players[i].miss || 0) + 1);
      return {};
    }, pid);
  }

  if (a === 'move') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (!s.started) return { error: 'The game hasn’t started yet.', status: 409 };
      if (s.finished) return { error: 'The model is already finished.', status: 409 };
      if (i !== s.turn) return { error: `It’s ${s.players[s.turn].name}’s turn.`, status: 409 };
      const b = Math.floor(Number(body.b));
      if (!(b >= 0 && b < s.nBricks)) return { error: 'Unknown brick.', status: 400 };
      if (s.moves.some((m) => m.b === b)) return { error: 'That brick is already placed.', status: 409 };
      if (blitz(s) && body.auto) return { error: 'There’s no “place one for me” in Bloppit Blitz.', status: 400 };
      if (shareDone(s, i)) return { error: 'You’ve placed all your bricks.', status: 409 };
      s.moves.push({ p: i, b, x: Math.round(Number(body.x) || 0), z: Math.round(Number(body.z) || 0), a: body.auto ? 1 : 0 });
      if (body.pen && !blitz(s)) s.players[i].pen = mergePen(s.players[i].pen, body.pen);
      s.turnPlaced += 1;
      s.players[i].n = (s.players[i].n || 0) + 1;
      if (blitz(s) && s.players.every((_, k) => shareDone(s, k))) {
        // Everyone has placed their share. If the bricks didn't divide evenly, Bloppit puts in the last few.
        stopClock(s);
        const done = new Set(s.moves.map((m) => m.b));
        for (let k = 0; k < s.nBricks; k++) if (!done.has(k)) s.moves.push({ p: -1, b: k, x: 0, z: 0, a: 1 });
        s.finished = true;
      } else if (s.moves.length >= s.nBricks) { stopClock(s); s.finished = true; }
      else if (s.turnPlaced >= s.perTurn || shareDone(s, i)) nextTurn(s);
      return {};
    }, pid);
  }

  if (a === 'pass') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (!s.started || s.finished) return {};
      const cur = s.players[s.turn];
      if (i !== s.turn && Date.now() - cur.seen <= STALE_MS) return { error: `${cur.name} is still playing.`, status: 409 };
      // In Blitz you can't dodge the clock by ending a turn without placing a brick
      if (blitz(s) && i === s.turn && s.turnPlaced < 1) return { error: 'Place at least one brick before you tap Done.', status: 409 };
      nextTurn(s);
      return {};
    }, pid);
  }

  return { status: 400, body: { error: 'Unknown action.' } };
}
