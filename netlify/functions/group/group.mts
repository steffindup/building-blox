// The crew server at /api/group: shared goals for approved groups, under the pup id (see ./logic.mjs).
// Kept in the same Netlify Blobs store as rooms and challenges, under group/CODE and gmember/PUPID.
import type { Config } from "@netlify/functions";
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
    async del(key: string) { await store.delete(key); },
  };
}

const APP_ORIGINS = new Set(["capacitor://localhost", "ionic://localhost", "https://localhost"]);
function cors(req: Request): Record<string, string> {
  const o = req.headers.get("origin") || "";
  if (!APP_ORIGINS.has(o)) return {};
  return {
    "access-control-allow-origin": o,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-pup",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

export default async (req: Request) => {
  const h = cors(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const url = new URL(req.url);
  const query: Record<string, string> = Object.fromEntries(url.searchParams);
  // The pup id is the credential: it comes in a header so it never lands in logs or browser history.
  const pid = req.headers.get("x-pup");
  if (pid) query.pid = pid; else delete query.pid;
  let body: any = null;
  if (req.method === "POST") {
    try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400, headers: h }); }
  }
  try {
    const { status, body: out } = await handle(req.method, query, body, adapter());
    return Response.json(out, { status, headers: { "cache-control": "no-store", ...h } });
  } catch (e) {
    console.error("group error", e);
    return Response.json({ error: "Something went wrong on the server. Please try again." }, { status: 500, headers: h });
  }
};

export const config: Config = { path: "/api/group" };
