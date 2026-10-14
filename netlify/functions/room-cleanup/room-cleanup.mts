// Deletes Build together and Blitz rooms (and their shared models and photos) 3 days after their last activity,
// Blitz challenges 30 days after their last run, Weekly Bloppit counts after 8 weeks, pups not played for a year,
// and expired transfer codes.
// Runs once a day as a Netlify scheduled function. The privacy policy (public/privacy/) promises this.
import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const ROOM_TTL_MS = 3 * 86400_000; // keep in step with ROOM_TTL_MS in ../room/logic.mjs
import { CHALLENGE_TTL_MS, WEEKLY_KEEP_WEEKS, weekOf } from "../challenge/logic.mjs";
import { PUP_TTL_MS } from "../pup/logic.mjs";

export default async () => {
  const store = getStore({ name: "building-blox-rooms", consistency: "strong" });
  const now = Date.now();
  const { blobs: rooms } = await store.list({ prefix: "room/" });
  const live = new Set<string>();
  let deleted = 0;
  for (const { key } of rooms) {
    const code = key.slice("room/".length);
    const room = (await store.get(key, { type: "json" })) as { updated?: number } | null;
    if (room && typeof room.updated === "number" && now - room.updated <= ROOM_TTL_MS) { live.add(code); continue; }
    await store.delete(key);
    deleted++;
  }
  // Shared models whose room is gone (or was never written).
  const { blobs: models } = await store.list({ prefix: "model/" });
  for (const { key } of models) {
    const code = key.slice("model/".length);
    if (live.has(code)) continue;
    // Look again in case the room was created after the list above.
    const room = (await store.get(`room/${code}`, { type: "json" })) as { updated?: number } | null;
    if (room && typeof room.updated === "number" && now - room.updated <= ROOM_TTL_MS) continue;
    await store.delete(key); deleted++;
  }
  // Blitz challenges, and their puzzles
  const { blobs: chs } = await store.list({ prefix: "ch/" });
  const liveCh = new Set<string>();
  for (const { key } of chs) {
    const c = (await store.get(key, { type: "json" })) as { updated?: number } | null;
    if (c && typeof c.updated === "number" && now - c.updated <= CHALLENGE_TTL_MS) { liveCh.add(key.slice(3)); continue; }
    await store.delete(key); deleted++;
  }
  const { blobs: chModels } = await store.list({ prefix: "chmodel/" });
  for (const { key } of chModels) {
    const code = key.slice("chmodel/".length);
    if (liveCh.has(code)) continue;
    const c = (await store.get(`ch/${code}`, { type: "json" })) as { updated?: number } | null;
    if (c && typeof c.updated === "number" && now - c.updated <= CHALLENGE_TTL_MS) continue;
    await store.delete(key); deleted++;
  }
  // Weekly Bloppit counts older than 8 weeks, and any leftover Daily Bloppit times (the Daily ended in October 2026)
  const oldestWeek = weekOf(now - WEEKLY_KEEP_WEEKS * 7 * 86400_000);
  const { blobs: weeks } = await store.list({ prefix: "weekly/" });
  for (const { key } of weeks) if (key.slice("weekly/".length) < oldestWeek) { await store.delete(key); deleted++; }
  const { blobs: days } = await store.list({ prefix: "daily/" });
  for (const { key } of days) { await store.delete(key); deleted++; }
  // Pups not played for a year, and transfer codes past their 72 hours
  const { blobs: pups } = await store.list({ prefix: "pup/" });
  let livePups = 0;
  for (const { key } of pups) {
    const p = (await store.get(key, { type: "json" })) as { updated?: number } | null;
    if (p && typeof p.updated === "number" && now - p.updated <= PUP_TTL_MS) { livePups++; continue; }
    await store.delete(key); deleted++;
  }
  const { blobs: xfers } = await store.list({ prefix: "xfer/" });
  for (const { key } of xfers) {
    const x = (await store.get(key, { type: "json" })) as { exp?: number } | null;
    if (x && typeof x.exp === "number" && now <= x.exp) continue;
    await store.delete(key); deleted++;
  }
  console.log(`room-cleanup: ${livePups} pups kept`);
  console.log(`room-cleanup: ${live.size} rooms and ${liveCh.size} challenges kept, ${deleted} blobs deleted`);
};

export const config: Config = { schedule: "@daily" };
