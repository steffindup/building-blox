# Bloppit: Brick Puzzle Game

A brick-building puzzle game for kids 8–13. Any photo (or a library model) becomes a brick puzzle with a step-by-step
instruction booklet, and you build it on screen. The menu is game-first:

- **Daily Bloppit**: one library puzzle a day, picked from the date so everyone gets the same one. You build it against
  the clock; your first time each day goes to the server (no name) and you see your rank. Streaks are kept on the device.
- **Solo**: **Quick Build** (pick Library or Your photo, build at your own pace), **Otter Trail** (the 14 levels) and
  **Brain Trail** (the same levels, with math puzzles locking booklet pages). Each trail keeps its own scores
  (`best` and `bbest` in the game save).
- **Blitz**: **vs Bloppit** (Pup, Splash or Legend Bloppit; take turns, 1 to 3 bricks a turn) and **vs Friend**:
  *Make a challenge* builds the whole puzzle against the clock and gives a 6-character code; friends type it into
  *Got a code?* (or open the share link `bloppit.com/join/CODE`) and race the same puzzle later. Live Blitz rooms (5-character codes) are still there.
- **Build together** (Play together): take turns building one model in a room.
- Every finish screen offers **Build it for real**, which opens the printable booklet.

- Racing Bloppit, challenges and the Daily Bloppit all run on the device: `cpuApi()` in `public/build/index.html`
  stands in for the room server and follows the same Blitz rules as `logic.mjs`. A challenge or daily run is the same
  engine with one player (`s.solo`); `trialEnd()` sends the time. Bloppit's speed and miss rate per level are in `CPU_LEVELS`.

Live at https://bloppit.com (bloppit.netlify.app redirects there). Every push to `main` deploys through Netlify.
Formerly called Building Blox; the browser save keys still use the old `building-blox-*` names so existing saves keep working.

- `public/index.html` is the landing page at bloppit.com (static HTML, no build step).
- The front page is: hero ("The brick puzzle game."), Meet Bloppit, Four ways to play. **How it works**, **FAQ** and
  **About us** are separate pages (`public/how-it-works/`, `public/faq/`, `public/about/`), linked only from the top
  ribbon; they share `public/site.css`. Keep their facts in step with the game (levels, limits, privacy promises).
- `public/build/index.html` is the whole app, at bloppit.com/build/ (no build step).
  Old invite links (`/?room=CODE`) redirect into the app via `netlify.toml`.
- **Flow.** The website and the App Store app share one flow from the menu on. Differences: the website starts at the
  front page (bloppit.com: launch screen → front page → *Play now* → menu); the app opens with the launch screen,
  then the menu. The launch screen shows once per visit (both pages share the `bloppit-splash` sessionStorage flag,
  so whichever page you land on shows it and the other doesn't) and is skipped for links into a section, page, room
  or challenge. On screens 1000px and wider the menu becomes two columns (hello and Daily on the left, tiles on the right). On the website each page has its own address (`/build/` is the menu, then `#blitz`, `#daily`, `#trails`,
  `#together`, `#photos`, `#build`, `#booklet`) so the browser's Back button steps back through Bloppit (`navNote()`).
- **Share links** are `bloppit.com/join/CODE`: `netlify.toml` sends them to `/build/?code=CODE`, which opens the room
  (5 characters) or challenge (6 characters) straight away. The older `/build/?room=CODE` and `?ch=CODE` still work.
- The brand (Bloppit the otter, catchphrase "Snap it. Bloppit. Build it.", colours) is on the
  "Bloppit brand & landing page" design canvas in Claude.
- `netlify/functions/room/` is the Play together room server: a Netlify Function at `/api/room`
  that keeps each room in Netlify Blobs (store `building-blox-rooms`). Game rules are in `logic.mjs`.
- **Room chat**: anyone in a room can type messages (up to 140 characters, last 60 kept).
  Guardrails live in `cleanChat()` in `logic.mjs`: links, emails, phone numbers, @handles and social app
  names are refused, rude words are blanked out, and each player can send at most one message a second and
  six per 20 seconds. Chat is only sent to players in the room, and works the same on the website and in the App Store app.
  The word filter is basic, not full moderation.
- `netlify/functions/challenge/` is the challenge and Daily Bloppit server at `/api/challenge`, in the same Blobs store
  (`ch/CODE`, `chmodel/CODE`, `daily/YYYY-MM-DD`). Rules and limits are in its `logic.mjs` (12 players per challenge,
  a minimum time per brick, daily days accepted a day either side of the server's).

- `netlify/functions/room-cleanup/` runs daily: it deletes rooms (and their shared photos) 3 days after their last
  activity, challenges 30 days after their last run, and daily times after a week. The privacy policy promises this.
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
