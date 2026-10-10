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

## Search and sharing

- `public/robots.txt` allows all crawlers (except `/api/`) and points to `public/sitemap.xml`.
- The `<head>` of `index.html` has the title, description, canonical URL (https://bloppit.com/),
  Open Graph and Twitter share tags, and schema.org `WebApplication` data.
- `public/og-image.png` (1200×630) is the share preview image; `public/icon-*.png`,
  `apple-touch-icon.png` and `site.webmanifest` are the app icons.
- Update `<lastmod>` in `sitemap.xml` when the page changes meaningfully, and add any new pages to it.
