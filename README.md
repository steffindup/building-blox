# Building Blox

Upload photos, turn them into a brick model, and build it yourself with a step-by-step instruction booklet.
Includes **Play the Game** (levels and points) and **Play together** (take turns on different devices).

Live at https://building-blox.netlify.app. Every push to `main` deploys through Netlify.

- `public/index.html` is the whole app (no build step).
- `netlify/functions/room/` is the Play together room server: a Netlify Function at `/api/room`
  that keeps each room in Netlify Blobs (store `building-blox-rooms`). Game rules are in `logic.mjs`.
