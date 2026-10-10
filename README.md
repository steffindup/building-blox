# Bloppit

Upload photos, turn them into a brick model, and build it yourself with a step-by-step instruction booklet.
Includes **Play the Game** (levels and points) and **Play together** (take turns on different devices).

Live at https://bloppit.com (bloppit.netlify.app redirects there). Every push to `main` deploys through Netlify.
Formerly called Building Blox; the browser save keys still use the old `building-blox-*` names so existing saves keep working.

- `public/index.html` is the landing page at bloppit.com (static HTML, no build step).
- `public/build/index.html` is the whole app, at bloppit.com/build/ (no build step).
  Old invite links (`/?room=CODE`) redirect into the app via `netlify.toml`.
- The brand (Bloppit the otter, catchphrase "Snap it. Bloppit. Build it.", colours) is on the
  "Bloppit brand & landing page" design canvas in Claude.
- `netlify/functions/room/` is the Play together room server: a Netlify Function at `/api/room`
  that keeps each room in Netlify Blobs (store `building-blox-rooms`). Game rules are in `logic.mjs`.
- **Room chat** (Play together): anyone in a room can type messages (up to 140 characters, last 60 kept).
  Guardrails live in `cleanChat()` in `logic.mjs`: links, emails, phone numbers, @handles and social app
  names are refused, rude words are blanked out, and each player can send at most one message a second and
  six per 20 seconds. Chat is only sent to players in the room (the app sends its player id in an
  `x-player` header), never to someone who only knows the room code. The word filter is basic, not full moderation.

- `netlify/functions/room-cleanup/` deletes rooms (and their shared photos) 3 days after their last activity, daily.
  When someone joins from the App Store app, the room becomes **quick messages only** (see `QUICK_CHAT` in `logic.mjs`).
- `public/privacy/` is the privacy policy (bloppit.com/privacy), also used for the App Store listing.
  Update it if Bloppit starts handling information differently.

## iPhone and iPad app

`mobile/` wraps the app with Capacitor for the App Store; `codemagic.yaml` builds it in the cloud. See `mobile/README.md`.

## Search and sharing

- `public/robots.txt` allows all crawlers (except `/api/`) and points to `public/sitemap.xml`.
- The `<head>` of `index.html` has the title, description, canonical URL (https://bloppit.com/),
  Open Graph and Twitter share tags, and schema.org `WebApplication` data.
- `public/og-image.png` (1200×630) is the share preview image; `public/icon-*.png`,
  `apple-touch-icon.png` and `site.webmanifest` are the app icons.
- Update `<lastmod>` in `sitemap.xml` when the page changes meaningfully, and add any new pages to it.
