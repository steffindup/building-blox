// "Play together" room server for Building Blox.
// Rooms live in Netlify Blobs; the game rules are in ./logic.mjs.
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
  };
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams);
  let body: any = null;
  if (req.method === "POST") {
    try { body = await req.json(); } catch { return Response.json({ error: "Bad request" }, { status: 400 }); }
  }
  try {
    const { status, body: out } = await handle(req.method, query, body, adapter());
    return Response.json(out, { status, headers: { "cache-control": "no-store" } });
  } catch (e) {
    console.error("room error", e);
    return Response.json({ error: "Something went wrong on the server. Please try again." }, { status: 500 });
  }
};

export const config: Config = { path: "/api/room" };
