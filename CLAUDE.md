# Bloppit: notes for Claude

Read this first. Every session starts with no memory of earlier ones; this file is the project's memory. Keep it
current: when you learn something a future session would need (a decision, a gotcha, a new workflow), add it here in
the same commit as the work. README.md is the detailed reference; this file is how to work on the project.

## What Bloppit is

**Bloppit: World of Bricks** is Steff's online brick-building game (website and iOS/Android app). Players build brick
models step by step from a booklet; every finished build grows **Bloppitopia**, a world of islands, each with a
character friend. Bloppit the otter (always holding the red 2-stud brick) is the hero; the player raises an otter pup.
Target: kids 8–13 and their families, US-weighted, online-only. Steff is a solo founder (an actuary by day, in
Bermuda), so time is short and decisions are his.

- Website and game: https://bloppit.com (game at `/game/`). Hosted on Netlify (site `bloppit`), deployed from `main`.
- iOS app: App Store "Bloppit: World of Bricks" (id 6821449219, bundle `com.bloppit.app`). Live on the App Store: 1.1 (6 Nov 2026); the repo is at 1.1.1, the next release.
- Android/Google Play: in progress (Wyoming company Bloppit LLC being set up to own the IP and the Play account).
- Contact: hello@bloppit.com. Socials: @playbloppit (TikTok, Instagram, X), @bloppit (YouTube), facebook.com/playbloppit.

## Working with Steff

- **Write to him in plain words.** Outcome first, then what he needs to know or decide. No jargon or internal names
  (file paths, function names) unless he asks. Short answers; lists only when it helps scanning.
- **Pushing:** a push to `main` is live on bloppit.com within a minute (and may start a TestFlight build). Test
  first, then ask Steff before pushing unless he has said to go ahead in the current conversation. Tell him what went
  live and whether it reaches the app.
- **Don't hold work back.** If a request looks big, say what it would take (a rough estimate, and a smaller version if
  there is one), then try it and show him before it goes live. Don't declare "it won't be ready" (feedback, 9 Nov 2026).
  He often simplifies a design when he sees the trade-off; offer the simpler option.
- **Show, don't describe.** For anything visual, render it in the headless browser and send him the picture (a phone-
  sized screenshot; note that the test browser lacks the game fonts).
- **Website vs app:** always say whether a change reaches the app. The app carries its own copy of the game (see below).

## How changes reach players

| Push to `main` changes… | What happens |
|---|---|
| anything | Netlify deploys bloppit.com in about a minute (check with the Netlify connector: project `bloppit`). |
| `public/game/` or `mobile/` | Codemagic also builds the iOS app and uploads it to **TestFlight** automatically (`codemagic.yaml`). |
| | The **App Store** only gets it when Steff submits a new version himself (manual release). |

So a game fix is live on the website at once but reaches App Store players only with the next app release. Exception:
the **Weekly** (see below) is fetched from the site by app 1.1.1 and later (not 1.1), so a new Weekly needs no app release.

## Repo map

- `public/game/index.html`: **the whole game**, one ~12,700-line file (HTML, CSS, JS). See the map below.
- `public/index.html`, `public/{about,faq,how-it-works,privacy}/`: the website. `public/site.css` styles them.
- `public/art/`, `public/3d/`, `public/sound/`, `public/video/`: drawings, GLB character models, sounds, island films.
- `public/weekly/`: the Weekly plan as data for the app (generated, see "Weekly"). `public/stats/`: usage stats page.
- `netlify/functions/`: the server, Netlify Functions + Blobs. `challenge` (Blitz challenges and the Weekly counts and
  top-100 board), `pup` (the Player Unique ID and saved progress), `group` (Crews), `room` (live rooms), `event`
  (anonymous usage counts), `room-cleanup` (daily). Each has a `logic.mjs` (pure, unit-tested) and a `.mts` handler.
- `mobile/`: the Capacitor wrapper (iOS + Android). `mobile/scripts/build-www.mjs` packages `public/game` into
  `mobile/www` and sets `window.BLOPPIT_APP=true`. `mobile/store/`: listing text, privacy answers, screenshots.
- `tests/`: `server.test.mjs`, `math.test.mjs`, `films.test.mjs` (fast, no browser); `browser.test.mjs` (~90 end-to-end
  tests in headless Chromium); `devserver.mjs` (local server with in-memory Blobs); `weekly-export.mjs` (see Weekly).
- `design/characters/`: character reference art.
- `netlify.toml`: redirects (`/build` → `/game/`, `/join/CODE`, `/p/CODE` share links, `/go/CHANNEL`), headers.

## Map of `public/game/index.html`

Find sections by their heading comments (`/* ---------- Name ---------- */`); line numbers drift. In file order:

- **Top (HTML + CSS)**: launch screen, menu, every page (`<section class="view" id="view-…">`) and dialog. A
  "Consistency pass (7 Nov 2026)" CSS block holds the colour/shape rules.
- **App Store app**: `APP` (`window.BLOPPIT_APP`), `API_BASE` (`https://bloppit.com` in the app, `''` on the web).
- **Players**: profiles on this device (`bloppit-players-v1`). **Brick colours**: `PALETTE`, `nearest(r,g,b)`.
- **Image handling / Picture / Model**: drawing → mask → `buildModel()`, which returns `{bricks, steps, W, H, …}`.
  A brick is `{x,y,z,sx,sz,c,step}`, optional `h` (layers tall) and `sp`/`print` (special pieces). `S` holds the
  current build settings (`size`, `shape`: puffed/flat/relief, `thick`, `maxColors`, …).
- **Three.js scene**: `brickGeo(sx,sz,h)`, `edgeGeo`, `mat`, `rebuild()` (instanced model), `showStep(k)`.
- **Tabs**: `setTab(name)`; `homeRoute()` runs URL routing at start.
- **Build it yourself**: placing bricks: `fitBrick`, `tryPlace`, `wrongBrickMsg` (the "this step needs…" messages),
  `placedGroup`, `cur` (current step), `sel` (brick in hand), `usedSet()`.
- **Sound**: `sfx.*` (synthesised, no files except the "Bloppit" voice), `tone()`, `noise()`, `haptic()`.
- **Bloppit, the building buddy**; **Parts box** (`pieces`, `renderBox`, `pieceName`, `pieceIcon`); **Booklet**
  (`partsHTML`, `calloutHTML`, step pages `#pg-N`).
- **Sample models**: `SAMPLES`, the library. Each is `{name, theme, make(){ draw on sheet(w,h,bg) → [['front',canvas]] },
  ws:{size,shape,…}, weekly:'YYYY-MM-DD', beat:'story line', special:{kind,cx,cy,r}, hidden}`. `released()` decides
  Library visibility.
- **Play the Game / Math challenge**: trails (`trail`: `otter` = Tiny's Frog Trail, `brain` = Nora's Brain Trail, `sea`/`flip` = Pippa's).
- **The pup**: Player Unique ID (`pup`), `pupSync()`/`pupPush()` to `/api/pup`.
- **Play together / Blitz / Timed builds**: rooms, races vs Swoop (`cpuApi()` runs Blitz on the device), `trialStart`,
  `trialEnd`.
- **Weekly Bloppit**: `weekOf()`, `WEEKLY_PLAN`, `weeklyPuzzle(week)`, `weeklyLoad`, `renderDaily`, `weeklySync`
  (app fetch), `weeklyPreview` (`?weekly=next`), special pieces (`addSpecial`, `SPECIAL_NAME`, `dialHands`).
- **Save progress**, **Your world** (XP, ★ stars = build rating, **Galaxy Blocks** = spendable currency), **Bloppitopia**
  2D and 3D, **characters** (drawn "living" characters; 3D GLBs for some), **lufu's world** (Chapter 2), **The end**,
  **My Bloppit** (otter level and outfit), **Share links / Weekly card / Family Link**, **Draw your own**, **Family
  key**, **Weekly top-100 board**, **Pass the Puzzle / Crews / Relay**, **Play Next**, **First session**, **Menu**.

Internal island ids differ from their names: `otterwood` = Frog Forest (Tiny), `brainpeak` = Brainpeak (Nora),
`sunrise` = Flipper Beach (Pippa), `brickworks` = Brickyard Cove (Bibi), `blitzbay` = Blitz Bay (Swoop),
`moonstone` = Moonstone Isle (lufu); home is Bloppitopia/Home Island; Friendship Harbour = Together.

## The Weekly ("Bibi's Weekly Bloppit")

- One puzzle a week, the same for everyone. It switches at **midnight US Eastern on Sunday night** (`weekOf()` in the
  game and in `netlify/functions/challenge/logic.mjs`, kept in step). Scored on clean building, never time.
- `WEEKLY_PLAN` maps a week (its Monday, `YYYY-MM-DD`) to a library model; the model carries `weekly:'that date'` and a
  `beat` story line. A Weekly should be 24–48 bricks (`WEEKLY_MAX` = 48). A Weekly joins the Library only after its
  week is over. Unplanned weeks fall back to a hash pick from the Library.
- **Every Sunday at 6:13 am Eastern a scheduled task reviews next week's Weekly** and sends Steff a strip (picture,
  step 1, halfway, finished) and the preview link. He approves or asks for changes there.
- **Preview** any week before it's live: `https://bloppit.com/game/?weekly=next` or `?weekly=YYYY-MM-DD` (nothing
  saved, no analytics).
- **After changing `WEEKLY_PLAN` or a Weekly's model, run the export and commit `public/weekly/` with the change**:
  `PLAYWRIGHT_CHROMIUM=<chrome> node tests/weekly-export.mjs`. The app (1.1.1+) fetches live/past weeks from there
  (data only: the drawing as PNG plus settings); without it, app players get the built-in plan.
- **Special pieces**: at most one per model, placed last as the "wow". `special:{kind,cx,cy,r}` (pixels in the drawing)
  leaves a 4-wide, 4-tall recess with a ledge in the front face; the piece is 4×1 at the base and 4 layers tall, prints
  its face, matches only its own spot and can't be turned. Only kind so far: `dial` (Big Ben, the player's real time,
  a bell "bong"). New kinds need an entry in `SPECIAL_NAME`, artwork in `printCanvas`, and optionally `specialIn`.
  Prints/special pieces show in solo builds; rooms, Blitz and Pass the Puzzle not yet tested with them.

## Testing

- Fast tests: `node --test tests/math.test.mjs tests/server.test.mjs` (59 tests, seconds). Run them always.
- Browser tests: `PLAYWRIGHT_CHROMIUM=<chrome> PLAYWRIGHT_ARGS="--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader --ignore-gpu-blocklist" node --test --test-concurrency=1 tests/browser.test.mjs`.
  - In the Claude cloud sandbox Chromium is at `/opt/pw-browsers/chromium-1243/real/chrome-linux64/chrome` (older
    sessions: `/usr/bin/google-chrome`). Don't run `playwright install`.
  - **The full suite (~90 tests) overloads the sandbox** (it left 90 Chrome processes and a load average of 35). Run
    only the relevant tests with `--test-name-pattern="Weekly|Library|Blitz|…"`. GitHub Actions runs everything on
    every push and pull request (`.github/workflows/tests.yml`): the fast tests, the full browser suite, and a check
    that `public/weekly` matches `WEEKLY_PLAN` (`tests/weekly-check.mjs`). Results show as a ✓/✗ next to each commit
    on GitHub (the sandbox's proxy blocks the Actions API; the commit's check-runs may still be readable).
  - The tests use port 8799. Stop any dev server you started on 8799 first, or use another port for your own server.
  - Known flaky: "the Weekly: a brick of the wrong colour…" sometimes gets "Wait for Go!" (it places during the 3-2-1
    countdown on a slow machine). Rerun it alone before treating it as a failure.
- Your own checks: start `PORT=8799 node tests/devserver.mjs` and drive it with Playwright. The sandbox can't reach the
  CDNs: route `three.min.js`, `OrbitControls.js`, `BufferGeometryUtils.js` to `node_modules/three/…` and stub Google
  Fonts (see `tests/browser.test.mjs` `open()`, or `tests/weekly-export.mjs`). Install a fake clock with
  `page.clock.install({time})` to test a given week.
- URL switches: `nosplash=1` (skip launch screen), `welcome=0` (skip the first-visit welcome), `films=0` (skip films),
  `lite3d=1` (light 3D for machines without a GPU), `island3d=0`, `weekly=next|YYYY-MM-DD` (Weekly preview).
- Test hooks on `window`: `bloppitPlaceRight()` (place the next brick correctly, like a tap; Weekly builds hide the
  "Place one for me" button), `bloppitLevels.lib()` (Library list), `bloppitWeeklyPlan()`, `bloppitWeeklyExport(w)`,
  `bloppitWorld`, `bloppitPup`, and more (`grep -o "window\.bloppit[A-Za-z]*"`). The game's functions are otherwise
  not global.
- Seed a returning player: `localStorage['bloppit-world-v1'] = {"arrived":1,"pupAsked":true,"pupName":2,"builds":{},
  "log":[],"decor":[]}`.

## Product decisions to respect

- **Names and spelling**: "Bloppit: World of Bricks" everywhere (from 1.1). Tagline "Brick. Build. Bloppit." "Math",
  never "Maths". lufu is always lowercase. Title Case for chapters, characters and tile names ("Moonstone Isle,
  Chapter 5: The Moon Gate"). "Crew" (not Tribe). "Player Unique ID" for the anonymous server identity; bringing a
  player to another device is a **link** (both devices play as the same player), not a transfer or copy.
- **Characters**: Bloppit the Otter ("Let's bloppit!"), Tiny the Tree Frog (Frog Forest, Frog Trail), Nora the Night
  Heron (Brainpeak, Brain Trail, math by US grade from the player's age), Pippa the Penguin (Flipper Beach, mirror
  puzzles, message in a bottle), Swoop the Longtail (Blitz Bay), Bibi the Lion Cub (Brickyard Cove, the Weekly and
  Build Anything), lufu (Moonstone Isle, silent until the finale). Characters are drawn "living" 2D puppets in game.
  Steff draws/approves all character art; don't invent new characters or redraw existing ones.
- **Colour discipline** (7 Nov 2026): each character has one colour everywhere. Red = main action + Bloppitopia;
  yellow = Pippa + stars only; one purple for Together; no teal. Drawn icons, not emoji, in the game UI. Brick-shaped
  menu cards, pill buttons. A card's studs are its own colour.
- **Online-only** (no kits, physical products or "build it for real"). Child-directed under COPPA: **no chat, no
  voice, no strangers talking to kids**; rooms are code-only; Crews need approval. Anonymous: names stay on the device;
  the server only knows the Player Unique ID. Cosmetics are earned, never sold. No Bermuda publicity or school tie-ins.
- **Not in the App Store Kids category** (4+). Links out of the app go through the grown-ups gate (our choice).
- **Music** only in Bloppitopia; gameplay is silent apart from sound effects. The launch screen plays the "Bloppit"
  voice (Steff's two boys).
- Story: Bloppitopia is Chapter 1 and ends with the pup and lufu finding each other (films 12–22, all eight sail to
  lufu's world). Chapter 2 is "Bloppit builds lufu's world"; lufu stays mythical, never more than Bloppit.

## Gotchas

- The app bundles its own copy of `public/game`; a fix pushed to `main` reaches App Store players only after the next
  app release. Say so whenever it matters.
- Old links point at `/build/`; it redirects to `/game/`. Some comments and old chats still say `/build`.
- Brick heights: most code assumes 1 layer; tall pieces pass `h` to `brickGeo`/`edgeGeo`. Search all `brickGeo(` calls
  when adding geometry.
- `weeklyPuzzle(week)` is cached (`weeklyCache`); clear it after changing the plan at runtime.
- Comments reference `claude/consistency-decisions-2026-11-07.md`; that file isn't in the repo (it lived in a Claude
  project). The rules are summarised above.
- Commits: end with the `Co-Authored-By` / `Claude-Session` lines the session gives you; commit as
  `Claude <noreply@anthropic.com>` (a hook flags other committer emails as Unverified).

## Where else knowledge lives

- Steff's Claude project "Bloxie" holds the long history (strategy rounds, character work). Its notes are summarised
  in Claude's memory under the project; chats inside that project can only be read from a session in that project.
- Claude Docs: "Bloppit Strategy v5: Decisions applied" (current strategy), "Bloppit Master Strategy", "Bloppit
  Character Bible", "Bloppit Q4 Working Drafts".
- `README.md` (game systems in detail), `mobile/README.md` (app build), `mobile/store/` (listing, Google Play).
