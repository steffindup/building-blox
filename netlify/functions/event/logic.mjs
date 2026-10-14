// First-party usage counts. The app sends a handful of named events ("first_build_completed", "weekly_completed")
// and the server adds one to that day's count, split by country. Nothing else: no identifier for the player or the
// device, no pup code, no user agent, no timestamps finer than the day. That is what lets the privacy policy say
// "simple counts with nothing in them about any one child" and keeps the counts inside COPPA's internal-operations
// exception. One blob per UTC day: ev/YYYY-MM-DD -> { day, n: { event: count }, c: { event: { CC: count } } }.
//
// Store adapter: get(key) -> { data, etag } | null; set(key, data, { onlyIfMatch?, onlyIfNew? }) -> { modified }.

const NAME = /^[a-z][a-z0-9_]{1,30}(:[a-z0-9_-]{1,20})?$/;   // e.g. build_completed, build_completed:trail, visit:hs
const MAX_PER_REQUEST = 5;
const MAX_NAMES_PER_DAY = 300;      // keeps a day's blob small even if a stale build sends odd names
export const EVENT_KEEP_DAYS = 400;  // a little over a year of daily counts
const dayOf = (t) => new Date(t).toISOString().slice(0, 10);
const evKey = (d) => `ev/${d}`;
const cleanCountry = (c) => (/^[A-Z]{2}$/.test(String(c || '')) ? String(c) : 'ZZ');

export function cleanEvents(list) {
  const out = [];
  for (const e of Array.isArray(list) ? list : []) {
    const n = String(e || '').trim();
    if (NAME.test(n) && !out.includes(n)) out.push(n);
    if (out.length >= MAX_PER_REQUEST) break;
  }
  return out;
}

export async function handle(method, query, body, store, opts = {}) {
  const now = Date.now();
  if (method === 'GET') {
    if (query.ping) return { status: 200, body: { ok: true } };
    // Reading the counts needs the admin key (set EVENTS_KEY in Netlify); the app only ever writes.
    if (!opts.adminKey || !opts.key || opts.key !== opts.adminKey) return { status: 403, body: { error: 'Not allowed.' } };
    const from = /^\d{4}-\d{2}-\d{2}$/.test(query.from || '') ? query.from : dayOf(now - 6 * 86400_000);
    const to = /^\d{4}-\d{2}-\d{2}$/.test(query.to || '') ? query.to : dayOf(now);
    const days = [];
    for (let d = new Date(from + 'T00:00:00Z'); d.toISOString().slice(0, 10) <= to && days.length < 120; d.setUTCDate(d.getUTCDate() + 1)) {
      const day = d.toISOString().slice(0, 10);
      const r = await store.get(evKey(day));
      days.push(r ? r.data : { day, n: {}, c: {} });
    }
    const totals = {};
    for (const d of days) for (const [k, v] of Object.entries(d.n || {})) totals[k] = (totals[k] || 0) + v;
    return { status: 200, body: { from, to, totals, days } };
  }
  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
  const events = cleanEvents(body && (body.events || [body.e]));
  if (!events.length) return { status: 400, body: { error: 'No events.' } };
  const country = cleanCountry(opts.country);
  const day = dayOf(now);
  for (let i = 0; i < 8; i++) {
    const r = await store.get(evKey(day));
    const d = r ? r.data : { day, n: {}, c: {} };
    for (const e of events) {
      if (!(e in d.n) && Object.keys(d.n).length >= MAX_NAMES_PER_DAY) continue;
      d.n[e] = (d.n[e] || 0) + 1;
      const byC = d.c[e] || (d.c[e] = {});
      byC[country] = (byC[country] || 0) + 1;
    }
    const { modified } = await store.set(evKey(day), d, r ? { onlyIfMatch: r.etag } : { onlyIfNew: true });
    if (modified) return { status: 200, body: { ok: true } };
    await new Promise((res) => setTimeout(res, 30 + Math.random() * 120));
  }
  // Counting is best-effort: a lost count under heavy load is better than a failed game.
  return { status: 200, body: { ok: false } };
}
