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

const rand = (n, chars) => { let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); for (const v of a) s += chars[v % chars.length]; return s; };
const newCode = () => rand(5, ALPHABET);
const newId = () => rand(20, 'abcdefghijklmnopqrstuvwxyz0123456789');
const cleanName = (s) => String(s || '').replace(/[<>&"]/g, '').trim().slice(0, 16) || 'Player';
const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
const roomKey = (c) => `room/${c}`;
const modelKey = (c) => `model/${c}`;

// What everyone may see: never send player ids (they act as passwords)
function publicState(s) {
  const now = Date.now();
  return {
    code: s.code, ver: s.ver, started: s.started, finished: s.finished, perTurn: s.perTurn,
    nBricks: s.nBricks, title: s.title, level: s.level, host: s.host, turn: s.turn,
    turnPlaced: s.turnPlaced, turnStart: s.turnStart, moves: s.moves, now,
    players: s.players.map((p) => ({ name: p.name, color: p.color, pen: p.pen, stale: now - p.seen > STALE_MS })),
  };
}

function nextTurn(s) {
  s.turn = (s.turn + 1) % s.players.length;
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
async function update(store, code, fn) {
  for (let i = 0; i < 8; i++) {
    const r = await readRoom(store, code);
    if (!r) return { status: 404, body: { error: 'That room code wasn’t found. Check it, or start a new game.' } };
    const s = r.data;
    const out = fn(s);
    if (out && out.error) return { status: out.status || 400, body: { error: out.error } };
    s.ver += 1; s.updated = Date.now();
    const { modified } = await store.set(roomKey(code), s, { onlyIfMatch: r.etag });
    if (modified) return { status: 200, body: { ...(out || {}), state: publicState(s) } };
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
    return { status: 200, body: { state: publicState(r.data) } };
  }

  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
  const a = body && body.action;

  if (a === 'create') {
    const model = body.model;
    const nBricks = Math.floor(Number(body.nBricks));
    if (!model || !Array.isArray(model.photos) || !model.photos.length) return { status: 400, body: { error: 'No model to build.' } };
    if (JSON.stringify(model).length > MAX_MODEL_CHARS) return { status: 413, body: { error: 'Those photos are too big to share. Try a smaller model.' } };
    if (!(nBricks > 0 && nBricks < 5000)) return { status: 400, body: { error: 'Bad model size.' } };
    const perTurn = Math.max(1, Math.min(20, Math.floor(Number(body.perTurn) || 5)));
    const now = Date.now();
    const player = { id: newId(), name: cleanName(body.name), color: COLORS[0], pen: { hint: 0, auto: 0, miss: 0 }, seen: now };
    for (let i = 0; i < 10; i++) {
      const code = newCode();
      const s = {
        code, ver: 1, created: now, updated: now, started: false, finished: false, perTurn, nBricks,
        title: cleanName(body.title).slice(0, 24), level: Number.isInteger(body.level) ? body.level : null,
        host: 0, turn: 0, turnPlaced: 0, turnStart: now, moves: [], players: [player],
      };
      const { modified } = await store.set(roomKey(code), s, { onlyIfNew: true });
      if (!modified) continue;
      await store.set(modelKey(code), model, {});
      return { status: 200, body: { code, playerId: player.id, me: 0, state: publicState(s) } };
    }
    return { status: 500, body: { error: 'Couldn’t make a room code. Please try again.' } };
  }

  const code = cleanCode(body && body.code);
  if (!code) return { status: 400, body: { error: 'Missing room code.' } };

  if (a === 'join') {
    let me = -1, pid = null;
    const res = await update(store, code, (s) => {
      const idx = body.playerId ? findPlayer(s, body.playerId) : -1;
      if (idx >= 0) { s.players[idx].seen = Date.now(); me = idx; pid = body.playerId; return {}; }
      if (s.finished) return { error: 'That game has already finished.' };
      if (s.players.length >= MAX_PLAYERS) return { error: 'That room is full (4 players).' };
      const used = new Set(s.players.map((p) => p.color));
      const p = { id: newId(), name: cleanName(body.name), color: COLORS.find((c) => !used.has(c)) || COLORS[0], pen: { hint: 0, auto: 0, miss: 0 }, seen: Date.now() };
      s.players.push(p); me = s.players.length - 1; pid = p.id;
      return {};
    });
    if (res.status === 200) Object.assign(res.body, { code, playerId: pid, me });
    return res;
  }

  const pid = body.playerId;
  const mine = (s) => { const i = findPlayer(s, pid); if (i < 0) return -1; s.players[i].seen = Date.now(); return i; };

  if (a === 'ping') return update(store, code, (s) => (mine(s) < 0 ? { error: 'You’re not in this room.', status: 403 } : {}));

  if (a === 'start') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (i !== s.host) return { error: 'Only the player who made the room can start it.', status: 403 };
      if (!s.started) { s.started = true; s.turn = 0; s.turnPlaced = 0; s.turnStart = Date.now(); }
      return {};
    });
  }

  if (a === 'pen') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      s.players[i].pen = mergePen(s.players[i].pen, body.pen);
      return {};
    });
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
      s.moves.push({ p: i, b, x: Math.round(Number(body.x) || 0), z: Math.round(Number(body.z) || 0), a: body.auto ? 1 : 0 });
      if (body.pen) s.players[i].pen = mergePen(s.players[i].pen, body.pen);
      s.turnPlaced += 1;
      if (s.moves.length >= s.nBricks) s.finished = true;
      else if (s.turnPlaced >= s.perTurn) nextTurn(s);
      return {};
    });
  }

  if (a === 'pass') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (!s.started || s.finished) return {};
      const cur = s.players[s.turn];
      if (i !== s.turn && Date.now() - cur.seen <= STALE_MS) return { error: `${cur.name} is still playing.`, status: 409 };
      nextTurn(s);
      return {};
    });
  }

  return { status: 400, body: { error: 'Unknown action.' } };
}
