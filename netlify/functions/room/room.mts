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
  const query: Record<string, string> = Object.fromEntries(url.searchParams);
  // The player id comes in a header (not the URL) so it never lands in logs or history.
  const pid = req.headers.get("x-player");
  if (pid) query.pid = pid; else delete query.pid;
  // Voice chat: which servers help two devices find each other. STUN only tells a device its own public
  // address. A TURN relay (optional: set TURN_URLS, TURN_USERNAME and TURN_CREDENTIAL in Netlify) passes
  // encrypted audio along when a network blocks direct connections; it can't listen in or record.
  if (req.method === "GET" && query.ice) {
    const iceServers: any[] = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
    const turn = process.env.TURN_URLS;
    if (turn) iceServers.push({ urls: turn.split(",").map((u) => u.trim()), username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
    return Response.json({ iceServers }, { headers: { "cache-control": "no-store" } });
  }
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
