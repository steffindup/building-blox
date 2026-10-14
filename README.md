# Bloppit: Brick Puzzle Game

A brick-building puzzle game for kids 8–13. Any photo (or a library model) becomes a brick puzzle with a step-by-step
instruction booklet, and you build it on screen. The menu is game-first:

- **Weekly Bloppit**: one puzzle a week, the same for everyone, changing Monday 8 am US Eastern (`weekOf()` in the app
  and in `netlify/functions/challenge/logic.mjs` compute the same week key, a Monday date). It is scored on cleanness
  (no misses, no hints), never on time: the clock is hidden (`calm` trial). The first finish of the week sends only
  "finished" and "clean" to the server, which keeps two counts per week and answers "you and N% of this week's builders
  finished clean". No names, no times, no ranks. The streak counts weeks, with one missed week in 13 forgiven.
  `WEEKLY_PLAN` maps a week key to an authored puzzle; weeks without one get a library pick from the hash.
- **Solo**: **Quick Build** (pick Library or Your photo, build at your own pace), **Otter Trail** (the 14 levels) and
  **Brain Trail** (the same levels, with math puzzles locking booklet pages). Each trail keeps its own scores
  (`best` and `bbest` in the game save).
- **Blitz** races are kept short: a puzzle picked for Blitz is shrunk to at most 30 bricks (`BLITZ_MAX`), opening Blitz
  without a small puzzle starts on the Toadstool Trail level, each wrong brick adds 1 second (`MISS_MS`) and each hint 5 seconds (`HINT_MS`, charged once per step).
- **Blitz**: **vs the Gulls** (Scraps, Swoop or Squint, the comic brick thieves; take turns, 1 to 3 bricks a turn;
  Bloppit himself is never the opponent) and **vs Friend**:
  *Make a challenge* builds the whole puzzle against the clock and gives a 6-character code; friends type it into
  *Got a code?* (or open the share link `bloppit.com/join/CODE`) and race the same puzzle later. Live Blitz rooms (5-character codes) are still there.
- **Build together**: take turns building one model in a room. Rooms are code-only: **no chat and no voice**
  (switched off October 2026; the server answers 410 to the old actions). Nothing typed or spoken passes between players.
- Every finish screen offers **Build it for real**, which opens the printable booklet.

- Racing the Gulls, challenges and the Weekly Bloppit all run on the device: `cpuApi()` in `public/build/index.html`
  stands in for the room server and follows the same Blitz rules as `logic.mjs`. A challenge or Weekly run is the same
  engine with one player (`s.solo`); `trialEnd()` sends the result. Each Gull's speed and miss rate is in `CPU_LEVELS`.
- **The pup** (`netlify/functions/pup/`, `/api/pup`): each player profile gets an anonymous pup id, minted by the server
  at the first finish, and its progress (trail scores, Weekly record) is saved under it and merged on every finish
  (`pupPush()`), so an island survives a lost iPad or cleared site data. The id is the credential and travels in the
  `x-pup` header. Names and ages never leave the device. The **Grown-ups corner** (Who's playing → Grown-ups, behind
  the grown-ups gate in the app) makes a one-time 72-hour transfer code, brings a player here with one, or deletes
  the server copy. Pups unused for a year are deleted by the cleanup job.
- **Usage counts** (`netlify/functions/event/`, `/api/event`): the app sends named events (`first_build_completed`,
  `second_build_started_by_choice`, `weekly_completed_clean`, `activation:<channel>`, …) and the server adds one to
  that day's count by country. No identifier for the player or device, never joined to a pup. Read them with the
  `EVENTS_KEY` env var in an `x-admin` header. `bloppit.com/go/CHANNEL` redirects into the app, records `visit:CHANNEL`
  and remembers the channel on the device so the first finished build is credited to it.

Live at https://bloppit.com (bloppit.netlify.app redirects there). Every push to `main` deploys through Netlify.
Formerly called Building Blox; the browser save keys still use the old `building-blox-*` names so existing saves keep working.

- `public/index.html` is the landing page at bloppit.com (static HTML, no build step).
- The front page is: hero ("The brick puzzle game."), Meet Bloppit, Four ways to play. **How it works**, **FAQ** and
  **About us** are separate pages (`public/how-it-works/`, `public/faq/`, `public/about/`), linked only from the top
  ribbon; they share `public/site.css`. Keep their facts in step with the game (levels, limits, privacy promises).
- `public/build/index.html` is the whole app, at bloppit.com/build/ (no build step).
  Old invite links (`/?room=CODE`) and channel links (`/go/CHANNEL`) redirect into the app via `netlify.toml`.
- **Flow.** The website and the App Store app share one flow from the menu on. Differences: the website starts at the
  front page (bloppit.com: launch screen → front page → *Play now* → menu); the app opens with the launch screen,
  then the menu. The launch screen shows once per visit (both pages share the `bloppit-splash` sessionStorage flag,
  so whichever page you land on shows it and the other doesn't) and is skipped for links into a section, page, room
  or challenge. On screens 1000px and wider the menu becomes two columns (hello and the Weekly on the left, tiles on the right). On the website each page has its own address (`/build/` is the menu, then `#blitz`, `#daily`, `#trails`,
  `#together`, `#photos`, `#build`, `#booklet`) so the browser's Back button steps back through Bloppit (`navNote()`).
- **Share links** are `bloppit.com/join/CODE`: `netlify.toml` sends them to `/build/?code=CODE`, which opens the room
  (5 characters) or challenge (6 characters) straight away. The older `/build/?room=CODE` and `?ch=CODE` still work.
- The brand (Bloppit the otter, catchphrase "Snap it. Bloppit. Build it.", colours) is on the
  "Bloppit brand & landing page" design canvas in Claude.
- `netlify/functions/room/` is the Play together room server: a Netlify Function at `/api/room`
  that keeps each room in Netlify Blobs (store `building-blox-rooms`). Game rules are in `logic.mjs`.
- The word filter in `logic.mjs` (`isBad`, `cleanName`) now only guards the player name shown in a room.
- `netlify/functions/challenge/` is the challenge and Weekly Bloppit server at `/api/challenge`, in the same Blobs store
  (`ch/CODE`, `chmodel/CODE`, `weekly/YYYY-MM-DD`). Rules and limits are in its `logic.mjs` (12 players per challenge,
  a minimum time per brick, this week and last week accepted).

- `netlify/functions/room-cleanup/` runs daily: it deletes rooms (and their shared photos) 3 days after their last
  activity, challenges 30 days after their last run, weekly counts after 8 weeks, pups unused for a year, expired
  transfer codes and usage counts after 400 days. The privacy policy promises this.
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
