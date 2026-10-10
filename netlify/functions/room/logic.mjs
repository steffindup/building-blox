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
const MAX_CHAT = 60;              // messages kept per room
const CHAT_LEN = 140;             // characters per message
const CHAT_GAP_MS = 1000;         // at least this long between one player's messages
const CHAT_BURST = 6;             // and no more than this many…
const CHAT_BURST_MS = 20_000;     // …in this window
const MAX_WAITING = 6;            // people waiting for the host to let them in
const WAIT_STALE_MS = 60_000;     // a waiting person who stops checking in is dropped
const SIG_KEEP_MS = 60_000;       // voice connection messages are dropped after this
const SIG_MAX = 40;               // and at most this many are kept
const SIG_LEN = 16_000;           // characters per voice connection message

// Voice chat: the server only passes on the short connection messages ("offer"/"answer") that let two
// devices find each other. The audio itself goes directly between the devices (encrypted by the browser)
// and never reaches this server; nothing is ever recorded or stored.

// ---------- Chat guardrails ----------
// Bloppit is for families, so chat is for this game only: no links, emails, phone numbers or
// social accounts (which is how strangers try to move children somewhere else), and rude words
// are blanked out. This is a basic filter, not full moderation.
const BLOCK_RULES = [
  /(https?:\/\/|www\.)/i,
  /\b[a-z0-9-]+\s*(\.|\(dot\)|\[dot\])\s*(com|net|org|io|co|me|ly|gg|app|xyz|info|biz|uk|us|tv|link|site|online)\b/i,
  /[^\s@]+\s*@\s*[^\s@]+\.[a-z]{2,}/i,              // emails
  /(^|\s)@[a-z0-9_.]{2,}/i,                          // @handles
  /(?:\d[\s\-().]*){7,}/,                            // phone numbers and other long numbers
  /\b(snap ?chat|insta|instagram|whats ?app|discord|tik ?tok|telegram|kik|facebook|messenger|wechat)\b/i,
];
const BAD = new Set(('ass arse asshole arsehole asswipe bastard bitch bitches bollocks boobs bullshit cock cum cunt dick dickhead '
  + 'dildo fag faggot fck fk fuck fucked fucker fucking fuk motherfucker nigga nigger penis piss porn prick pussy rape '
  + 'retard retarded sex sexy shit shitty slut stfu tits twat vagina wank wanker whore wtf kys').split(' '));
const BAD_PREFIX = ['fuck', 'fuk', 'shit', 'bitch', 'cunt', 'wank', 'twat', 'slut', 'whore', 'nigg', 'fagg', 'retard', 'motherf'];
const LEET = { '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b' };
const squash = (w) => w.replace(/(.)\1+/g, '$1');
const BAD_SQUASHED = new Set([...BAD].filter((w) => w.length >= 4).map(squash));
function isBad(token) {
  const w = token.toLowerCase().replace(/[01!34@5$78]/g, (c) => LEET[c]).replace(/[^a-z]/g, '');
  if (!w) return false;
  if (BAD.has(w) || BAD_PREFIX.some((p) => w.startsWith(p))) return true;
  const sq = squash(w);
  return sq.length >= 4 && BAD_SQUASHED.has(sq);
}
export function cleanChat(raw) {
  let t = String(raw || '').normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '')
    .replace(/\s+/g, ' ').trim();
  if (!t) return { error: 'Type a message first.' };
  if (t.length > CHAT_LEN) return { error: `Messages can be up to ${CHAT_LEN} characters.` };
  const flat = t.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (BLOCK_RULES.some((re) => re.test(t)) || /killyourself/.test(flat)) {
    return { error: 'Chat is just for this game, so links, emails, phone numbers and social accounts can’t be sent.' };
  }
  t = t.replace(/[^\s.,;:?"'()\-]+/g, (tok) => (isBad(tok) ? '•'.repeat([...tok].length) : tok));
  return { text: t };
}

const rand = (n, chars) => { let s = ''; const a = new Uint32Array(n); crypto.getRandomValues(a); for (const v of a) s += chars[v % chars.length]; return s; };
const newCode = () => rand(5, ALPHABET);
const newId = () => rand(20, 'abcdefghijklmnopqrstuvwxyz0123456789');
const cleanName = (s) => {
  const n = String(s || '').replace(/[<>&"]/g, '').trim().slice(0, 16);
  // Names are shown to everyone in the room, so a rude one becomes plain "Player".
  return !n || n.split(/[\s.,_\-]+/).some(isBad) || isBad(n) ? 'Player' : n;
};

// Quick messages: the only chat allowed in a room once someone joins from the App Store app
// (Apple's Kids category rules don't allow children to type free messages to each other).
export const QUICK_CHAT = ['Hi!', 'Nice!', 'Your turn!', 'Great build!', 'Thanks!', 'Oops!', 'Good luck!', 'Almost done!', 'Well played!', 'Ready?', '👍', '🎉'];
// Turn a room quick-only. Free-typed messages already sent are cleared, so the app never shows them.
// Voice chat is also switched off for good in these rooms (children talking live isn't allowed in the Kids category).
const makeQuick = (s) => {
  if (!s.quick) { s.quick = true; s.chat = []; }
  if (s.voice) { s.voice = false; s.players.forEach((p) => { p.vc = 0; }); s.sig = []; }
};
const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
const roomKey = (c) => `room/${c}`;
const modelKey = (c) => `model/${c}`;

// What everyone may see: never send player ids (they act as passwords).
// Chat, who is waiting to join and voice messages are only sent to players in the room
// (`viewer` is the asking player's index, or -1), not to anyone who just knows the code.
function publicState(s, viewer = -1) {
  const now = Date.now();
  const out = {
    code: s.code, ver: s.ver, started: s.started, finished: s.finished, perTurn: s.perTurn,
    nBricks: s.nBricks, title: s.title, level: s.level, host: s.host, turn: s.turn,
    turnPlaced: s.turnPlaced, turnStart: s.turnStart, moves: s.moves, now, voice: !!s.voice,
    players: s.players.map((p) => ({ name: p.name, color: p.color, pen: p.pen, stale: now - p.seen > STALE_MS, vc: s.voice ? (p.vc || 0) : 0 })),
    quick: !!s.quick,
  };
  if (viewer >= 0) {
    out.me = viewer;
    out.chat = (s.chat || []).map((m) => ({ n: m.n, p: m.p, t: m.t, at: m.at }));
    out.waiting = (s.waiting || []).filter((w) => now - w.seen <= WAIT_STALE_MS).map((w) => ({ k: w.k, name: w.name }));
    out.sig = (s.sig || []).filter((m) => m.to === viewer).map((m) => ({ n: m.n, f: m.f, d: m.d }));
  }
  return out;
}
function prune(s) {
  const now = Date.now();
  if (s.waiting) s.waiting = s.waiting.filter((w) => now - w.seen <= WAIT_STALE_MS);
  if (s.sig) s.sig = s.sig.filter((m) => now - m.at <= SIG_KEEP_MS).slice(-SIG_MAX);
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
      if (body.app) makeQuick(s);
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
      if (body.app) makeQuick(s);
      if (idx >= 0) { s.players[idx].seen = now; me = idx; pid = body.playerId; return {}; }
      if (s.finished) return { error: 'That game has already finished.' };
      if (s.players.length >= MAX_PLAYERS) return { error: 'That room is full (4 players).' };
      s.waiting = (s.waiting || []).filter((w) => now - w.seen <= WAIT_STALE_MS);
      const w0 = body.playerId ? s.waiting.find((w) => w.id === body.playerId) : null;
      if (w0) { w0.seen = now; pid = w0.id; waiting = true; return {}; }
      if (s.waiting.length >= MAX_WAITING) return { error: 'Lots of people are already waiting to join. Try again in a minute.' };
      const w = { id: newId(), k: rand(8, ALPHABET), name: cleanName(body.name), seen: now };
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
      if (!s.started) { s.started = true; s.turn = 0; s.turnPlaced = 0; s.turnStart = Date.now(); }
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
      const used = new Set(s.players.map((p) => p.color));
      s.players.push({ id: w.id, name: w.name, color: COLORS.find((c) => !used.has(c)) || COLORS[0], pen: { hint: 0, auto: 0, miss: 0 }, seen: Date.now() });
      return {};
    }, pid);
  }

  // Voice chat. The host turns it on or off for the room; each player joins and mutes themselves.
  if (a === 'voice') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (i !== s.host) return { error: 'Only the player who made the room can turn voice chat on or off.', status: 403 };
      if (body.on && s.quick) return { error: 'Voice chat isn’t available in this room, because someone is playing on the Bloppit app.', status: 409 };
      s.voice = !!body.on;
      if (!s.voice) { s.players.forEach((p) => { p.vc = 0; }); s.sig = []; }
      return {};
    }, pid);
  }
  if (a === 'vc') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      const v = Math.max(0, Math.min(2, Math.floor(Number(body.state) || 0)));  // 0 out, 1 in but muted, 2 mic on
      if (v && !s.voice) return { error: 'Voice chat is off for this room.', status: 409 };
      s.players[i].vc = v;
      if (!v) s.sig = (s.sig || []).filter((m) => m.f !== i && m.to !== i);
      return {};
    }, pid);
  }
  if (a === 'signal') {
    const d = String(body.d || '');
    if (!d || d.length > SIG_LEN) return { status: 400, body: { error: 'Bad voice message.' } };
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      const to = Math.floor(Number(body.to));
      if (!s.voice || !(to >= 0 && to < s.players.length) || to === i) return { error: 'Voice chat isn’t available.', status: 409 };
      s.sigN = (s.sigN || 0) + 1;
      s.sig = [...(s.sig || []), { n: s.sigN, f: i, to, d, at: Date.now() }];
      return {};
    }, pid);
  }

  if (a === 'pen') {
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      s.players[i].pen = mergePen(s.players[i].pen, body.pen);
      return {};
    }, pid);
  }

  if (a === 'chat') {
    const c = cleanChat(body.text);
    if (c.error) return { status: 400, body: { error: c.error } };
    return update(store, code, (s) => {
      const i = mine(s);
      if (i < 0) return { error: 'You’re not in this room.', status: 403 };
      if (s.quick && !QUICK_CHAT.includes(c.text)) return { error: 'This room uses quick messages only, because someone is playing on the Bloppit app.', status: 400 };
      const p = s.players[i], now = Date.now();
      const recent = (p.chatAt || []).filter((t) => now - t < CHAT_BURST_MS);
      if ((recent.length && now - recent[recent.length - 1] < CHAT_GAP_MS) || recent.length >= CHAT_BURST) {
        return { error: 'Slow down a little before sending another message.', status: 429 };
      }
      p.chatAt = [...recent, now];
      s.chatN = (s.chatN || 0) + 1;
      s.chat = [...(s.chat || []), { n: s.chatN, p: i, t: c.text, at: now }].slice(-MAX_CHAT);
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
      s.moves.push({ p: i, b, x: Math.round(Number(body.x) || 0), z: Math.round(Number(body.z) || 0), a: body.auto ? 1 : 0 });
      if (body.pen) s.players[i].pen = mergePen(s.players[i].pen, body.pen);
      s.turnPlaced += 1;
      if (s.moves.length >= s.nBricks) s.finished = true;
      else if (s.turnPlaced >= s.perTurn) nextTurn(s);
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
      nextTurn(s);
      return {};
    }, pid);
  }

  return { status: 400, body: { error: 'Unknown action.' } };
}
