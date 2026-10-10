// Deletes Play together rooms (and their shared models and photos) 3 days after their last activity.
// Runs once a day as a Netlify scheduled function. The privacy policy (public/privacy/) promises this.
import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const ROOM_TTL_MS = 3 * 86400_000; // keep in step with ROOM_TTL_MS in ../room/logic.mjs

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
  console.log(`room-cleanup: ${live.size} rooms kept, ${deleted} blobs deleted`);
};

export const config: Config = { schedule: "@daily" };
