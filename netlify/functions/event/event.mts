// First-party usage counts at /api/event (see ./logic.mjs). The country comes from Netlify's edge geolocation of
// the request; the IP address itself is never stored. Reading the counts needs the EVENTS_KEY environment variable
// in the x-admin header: curl -H "x-admin: $EVENTS_KEY" "https://bloppit.com/api/event?from=2026-10-19&to=2026-11-13"
import type { Config, Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { handle } from "./logic.mjs";

function adapter() {
  const store = getStore({ name: "building-blox-rooms", consistency: "strong" });
  return {
    async get(key: string) {
      const r = await store.getWithMetadata(key, { type: "json", consistency: "strong" });
      return r ? { data: r.data, etag: r.etag } : null;
    },
    async set(key: string, data: unknown, opts: { onlyIfMatch?: string; onlyIfNew?: boolean } = {}) {
      const r = await store.setJSON(key, data, opts as any);
      return { modified: r.modified };
    },
  };
}

const APP_ORIGINS = new Set(["capacitor://localhost", "ionic://localhost", "https://localhost"]);
function cors(req: Request): Record<string, string> {
  const o = req.headers.get("origin") || "";
  if (!APP_ORIGINS.has(o)) return {};
  return {
    "access-control-allow-origin": o,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

export default async (req: Request, context: Context) => {
  const h = cors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const url = new URL(req.url);
  const query: Record<string, string> = Object.fromEntries(url.searchParams);
  let body: any = null;
  if (req.method === "POST") {
    try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400, headers: h }); }
  }
  try {
    const country = context.geo?.country?.code;
    const { status, body: out } = await handle(req.method, query, body, adapter(), {
      country, key: req.headers.get("x-admin") || "", adminKey: process.env.EVENTS_KEY || "",
    });
    return Response.json(out, { status, headers: { "cache-control": "no-store", ...h } });
  } catch (e) {
    console.error("event error", e);
    return Response.json({ ok: false }, { status: 200, headers: h });
  }
};

export const config: Config = { path: "/api/event" };
