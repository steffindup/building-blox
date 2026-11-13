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
- iOS app: App Store "Bloppit: World of Bricks" (id 6821449219, bundle `com.bloppit.app`). Live on the App Store: 1.1.2 (build 218, 12 Nov 2026; 1.1.1 was withdrawn for the phone overlay bug). **1.1.3 (build 222) was submitted for review on 13 Nov 2026** (automatic release, phased release off): the new How to Play video, the improved photo to build, the Weekly's "how clean it was" message (`mobile/store/submission-1.1.3.md`). Don't touch it while it is in review; when it is approved, update the press page's version line and bump the repo to 1.1.4. Build numbers can't be guessed (the first 1.1.3 build was 221): read them in TestFlight. Once a version is approved Apple takes no more builds for it (the TestFlight upload fails), so bump the version straight after a release. A push to `public/game/` or `mobile/` makes a new TestFlight build but never touches a build in review. Launch: 13 Nov (Bloppit and Bloppitopia), 16 Nov (the Weeklies), 21 Nov (before Thanksgiving).
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
- **"Don't change anything yet" / "brainstorm"** means propose only: no code changes.
- **Website and app stay in step:** every change applies to both unless he says otherwise.
- **One inconsistency means check everywhere:** when he points out one, find and fix every instance (browser and app).
  He wants zero findings. Approved exceptions are listed in the consistency decisions (see the end); don't invent new ones.
- **Never touch a build that's in App Store review.**
- **He does the testing himself**, and the aim is to finish the whole game end to end before showing it widely.

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
- `public/press/`: the press page (bloppit.com/press, made 12 Nov 2026): fact sheet, press images (`images/`, with
  `thumbs/` and `bloppit-press-images.zip`, which must be rebuilt when an image changes) and the launch video. Update
  its "Current version" line with each App Store release. No lufu and no Moonstone Isle beyond the mist (Steff's launch
  rule). `marketing/launch-video/`: the locked 25-second launch videos and how they were made (its README).
  `marketing/carousel-2026-11-13/`: the six final Instagram carousel images for 13 Nov.
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
- **Save progress**, **Your world** (★ stars = the one growing number, **Galaxy Blocks** = the ★ you spend), **Bloppitopia**
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
  week is over. Unplanned weeks fall back to a hash pick from the Library. The top-100 board is on by default (a
  grown-up can switch it off).
- **Every Sunday at 6:13 am Eastern a scheduled task reviews next week's Weekly** and sends Steff a strip (picture,
  step 1, halfway, finished) and the preview link. He approves or asks for changes there.
- **Preview** any week before it's live: `https://bloppit.com/game/?weekly=next` or `?weekly=YYYY-MM-DD` (nothing
  saved, no analytics).
- **After changing `WEEKLY_PLAN` or a Weekly's model, run the export and commit `public/weekly/` with the change**:
  `PLAYWRIGHT_CHROMIUM=<chrome> node tests/weekly-export.mjs`. The app (1.1.1+) fetches live/past weeks from there
  (data only: the drawing as PNG plus settings); without it, app players get the built-in plan.
- **Special pieces**: at most one per model, placed last as the "wow". `special:{kind,cx,cy,r}` (pixels in the drawing)
  leaves a 4-wide, 4-tall recess with a ledge in the front face; the piece is 4×1 at the base and 4 layers tall, prints
  its face and matches only its own spot. It can be turned like any brick (Steff, 9 Nov). Kinds live in `SPECIAL_KINDS`
  (size in studs and layers, own colour, printed or not, what shows behind it): `dial` (4×4, Big Ben, the player's real
  time, a bell "bong"), and from 1.1.2 `brick` (Bloppit's red 2-stud brick, plain red, sparkle) and `fan` (12×5, a
  turkey's printed tail feathers, standing behind the model: `behind` puts it in the back layer and clears the feather
  colours in front of it, so the head stays in front; fanfare). A kind can have its own outline (`shape`, drawn by `shapeGeo`;
  `pieceGeo`/`pieceEdge` replace `brickGeo`/`edgeGeo` wherever a model brick is drawn): the fan is a half-oval with a bump
  per feather. The clock dial is a square block that looks round only because the tower around it is the same colour
  (Steff, 10 Nov: special pieces should be unique shapes). A new kind needs an entry there, artwork in `printCanvas`
  (also its parts-box icon) and a sound in `specialIn`.
- **Parallel Weeklies (Steff, 10 Nov):** one model per week carries the special piece. An app that doesn't know the kind
  (1.1.1) drops it and builds the same picture from ordinary bricks, so 1.1.1 players get a plain version automatically
  (checked in build 213's code). Draw the piece in the picture so the plain build still shows it. From 30 Nov every
  Weekly has a special piece; each needs its kind designed and approved by Steff.
  Prints/special pieces show in solo builds; rooms, Blitz and Pass the Puzzle not yet tested with them.
- **What a Weekly can change in the app without a release** (checked against build 213): the picture as PNG, `ws`
  settings, name, theme and `beat`, and a `special` only of a kind the app knows (just `dial` in 1.1.1). Ordinary bricks
  go up to 2×4, one layer tall. A new special kind waits for an app release (Steff: redesign the Weeklies in 1.1.2). A
  name the app already has built in uses its built-in model, so a reworked Weekly needs a new name to reach the app.
- **Steps go bottom-up by layer**, so whatever is alone at the top of the picture goes on last: a "wow" finish without a
  special piece. `studSheet(rows, colours)` draws a picture stud by stud; with `ws.size` = the number of rows the model
  comes out exactly as drawn ("Bloppit and the red brick", 16 Nov).

## Testing

- Fast tests: `node --test tests/math.test.mjs tests/server.test.mjs` (62 tests, seconds). Run them always.
- Browser tests: `PLAYWRIGHT_CHROMIUM=<chrome> PLAYWRIGHT_ARGS="--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader --ignore-gpu-blocklist" node --test --test-concurrency=1 tests/browser.test.mjs`.
  - In the Claude cloud sandbox Chromium is at `/opt/pw-browsers/chromium-1243/real/chrome-linux64/chrome` (older
    sessions: `/usr/bin/google-chrome`). Don't run `playwright install`.
  - **The full suite (~90 tests) overloads the sandbox** (it left 90 Chrome processes and a load average of 35). Run
    only the relevant tests with `--test-name-pattern="Weekly|Library|Blitz|…"`. GitHub Actions runs everything on
    every push and pull request (`.github/workflows/tests.yml`): the fast tests, the full browser suite, and a check
    that `public/weekly` matches `WEEKLY_PLAN` (`tests/weekly-check.mjs`). CI uses the runner's Google Chrome: Playwright's own Chromium can't
    play the .mp4 films, and with it nearly every browser test failed. Results show as a ✓/✗ next to each commit
    on GitHub (the sandbox's proxy blocks the Actions API; the commit's check-runs may still be readable).
  - The workflow runs on `ubuntu-24.04`, pinned: on `ubuntu-latest` (26.04 from 10 Nov 2026) Playwright can't install
    its Chromium, so the Weekly data check failed.
  - Each browser test starts its own browser (`beforeEach`). With one shared browser, a browser that stopped answering
    on GitHub's machine made every later test time out, so no run had passed (fixed 10 Nov).
  - The tests use port 8799. Stop any dev server you started on 8799 first, or use another port for your own server.
  - A test that "sometimes fails" is worth a real look before rerunning it. "the Weekly: a brick of the wrong colour…"
    looked flaky for two days; it was a real bug (the game said Go! three seconds before you could place). Fixed 9 Nov.
- **Four tests that passed and failed on the same code (fixed 11 Nov)**; none was a bug in the game, all were the test
  guessing a time or reading something stale. The patterns to avoid: (1) a fixed sleep before checking that something
  has gone or arrived: the film's layer is removed by a timer that ran up to 5 s late on a busy machine, and the Weekly
  board comes from the server, so wait with `waitForFunction`; (2) reading a value that is still on the page from
  before: a second room in one test read the last room's (hidden) code, so the guest knocked on the old room:
  `tMakeRoom` now waits for a new code; (3) checking a random animation at one instant: Bloppit's blink takes 1/6 s
  every 3 to 6 s, so "eyes open after 30 s" failed about one run in eight: `bloppitLids` now lets a blink finish first.
  They hid a real failure on 11 Nov (shared drawings), so a red run on GitHub must be read, not waved through.
- **"Real hands" test** builds Big Ben with clicks only (parts box, Take, Rotate, click the spot), like a child. It found
  that the last bricks sat under the tool buttons; `playFit()` now shifts the camera so the model stays clear of them.
  Hooks that place bricks for you prove less: prefer real clicks for anything about the build controls.
- After a build, the "Ta-da! The real …" picture shows for about 4.5 s before the finish card (a tap skips ahead);
  tests must wait for the card (`waitForFunction`), not sleep a fixed time.
- Your own checks: start `PORT=8799 node tests/devserver.mjs` and drive it with Playwright. The sandbox can't reach the
  CDNs: route `three.min.js`, `OrbitControls.js`, `BufferGeometryUtils.js` to `node_modules/three/…` and stub Google
  Fonts (see `tests/browser.test.mjs` `open()`, or `tests/weekly-export.mjs`). Install a fake clock with
  `page.clock.install({time})` to test a given week.
- URL switches: `nosplash=1` (skip launch screen), `welcome=0` (skip the first-visit welcome), `films=0` (skip films),
  `lite3d=1` (light 3D for machines without a GPU), `island3d=0`, `weekly=next|YYYY-MM-DD` (Weekly preview).
- Test hooks on `window`: `bloppitPlaceRight()` (place the next brick correctly, like a tap; Weekly builds hide the
  "Place one for me" button), `bloppitHold(k)` / `bloppitSel()` (put a brick of the step in hand / read it), `bloppitSpot()` (screen x,y of where
  the brick in hand goes, for real clicks), `bloppitLevels.lib()` (Library list), `bloppitWeeklyPlan()`, `bloppitWeeklyExport(w)`,
  `bloppitWorld`, `bloppitPup`, and more (`grep -o "window\.bloppit[A-Za-z]*"`). The game's functions are otherwise
  not global.
- Seed a returning player: `localStorage['bloppit-world-v1'] = {"arrived":1,"pupAsked":true,"pupName":2,"builds":{},
  "log":[],"decor":[]}`.

## Product decisions to respect

- **Names and spelling**: "Bloppit: World of Bricks" everywhere (from 1.1); "Bloppit" alone under the app icon.
  Subtitle "Build it. Grow your world."; sign-off "Brick. Build. Bloppit." (end cards, videos). "Maths", never "Math"
  (the 7 Nov 2026 consistency sweep; Steff confirmed 9 Nov). lufu is always lowercase. Species are lowercase ("Swoop
  the longtail", "Nora the night heron"); names keep capitals. "Nora's Brain Trail", never "The Nora's". Growing counts
  are "60+" (library models), never an exact count. Galaxy Blocks are a 2-stud stackable block in galaxy colours, never
  "gold bricks". Title Case for chapters, characters and tile names ("Moonstone Isle,
  Chapter 5: The Moon Gate"). "Crew" (not Tribe). "Player Unique ID" for the anonymous server identity; bringing a
  player to another device is a **link** (both devices play as the same player), not a transfer or copy.
- **Brand look**: the three bricks are World = yellow #F4BC22 with dark text #142022, of = white with blue #0369BD text,
  Bricks = red #D62F2A. Brand blue #0369BD; wordmark and headings in Lilita One. "World of Bricks" shows only on the
  website's front page and the game's home page, not deeper pages. Bloppit always holds the red 2-stud brick; outside
  gameplay use the signature Bloppit picture. Audience wording: "enthusiastic brick builders", not "for kids"; Steff's "for kids and grown-ups who love
  bricks" (front page) is fine.
- **Launch screen**: winking Bloppit plus the "Bloppit" voice (Steff's two boys, mixed 50:50), on the website and the app.
- **About us** is Steff's own text: light edits only.
- **Contractions** (it's, don't, can't): the game and website use them for a friendly tone with kids, which Steff
  accepts though he doesn't like them himself (9 Nov). The privacy policy and the classroom activity page stay more formal.
- **Characters**: Bloppit the otter (Home Island, the main character; "Let's bloppit!"), the Pup (the player's otter, named
  and coloured before sailing to Bloppitopia), Tiny the tree frog (Frog Forest, Frog Trail), Nora the night heron
  (Brainpeak, Brain Trail; Maths by US grade, from the age the player gives), Pippa the penguin (Flipper Beach, mirror
  puzzles, message in a bottle; once Sunshine/Sunrise Shores), Swoop the longtail (Blitz Bay; the only longtail), Bibi
  the lion cub (Brickyard Cove, the Weekly and Build Anything; once Lemmie), lufu (Moonstone Isle, silent until the
  finale; bigger, in a separate mythical place, central to Chapter 2 but never a playable character). Characters are drawn "living" 2D puppets in game.
  Steff draws/approves all character art; don't invent new characters or redraw existing ones.
- **Colour discipline** (7 Nov 2026): each character has one colour everywhere. Red = main action + Bloppitopia;
  yellow = Pippa + stars only; one purple for Together; teal = Quick Play only; pink = Crews. Drawn icons, not emoji, in the game UI. Brick-shaped
  menu cards, pill buttons. A card's studs are its own colour.
- **Online-only** (no kits, physical products or "build it for real"). Child-directed under COPPA: **no chat, no
  voice, no strangers talking to kids**; rooms are code-only; Crews need approval. Anonymous: names stay on the device;
  the server only knows the Player Unique ID. Cosmetics are earned, never sold. No marketing aimed at Bermuda and no school tie-ins; Bermuda as part of the
  creation story (About us, the website) is welcome (Steff, 9 Nov).
- **Not in the App Store Kids category** (4+). Links out of the app go through the grown-ups gate (our choice).
- **Music** only in Bloppitopia; gameplay is silent apart from sound effects. The launch screen plays the "Bloppit"
  voice (Steff's two boys).
- Story: Bloppitopia is Chapter 1 and ends with the pup and lufu finding each other (films 12–22, all eight sail to
  lufu's world). Chapter 2 is "Bloppit builds lufu's world"; lufu stays mythical, never more than Bloppit. A closed
  story: Chapter 1 ends after Moonstone Isle's 10 chapters, then lufu's world (enchanted, the galaxy ship beached, torch
  coral, free builds, Chapter 2 "coming soon").
- **Menus**: Bloppitopia is the hero. The game's home page has two clear actions, Quick Play and Bloppitopia, plus Bibi's Weekly Bloppit; "Play
  Bloppit" on the website goes to /game/. The top tabs follow the home page's order, Quick Play first. After a build or
  race the main button goes back to Bloppitopia (or the island). On an island, Play = that island's next play; a
  finished island offers "Play anyway" or going back. The build page outside Bloppitopia keeps every option and a
  difficulty slider; each Solo tile (Pippa's too) offers "Play on <island> in Bloppitopia" or "Just Play", and says when
  the island option isn't available. Quick Play on a Solo tile plays that island's own puzzles in any order and keeps
  nothing; Pippa's too (her Flipper Beach puzzles, all open; the tide only applies on the island). The separate
  "any-time" mirror set (`FLIP_LEVELS`, trail `flip`) is no longer offered (Steff, 10 Nov 2026: same rules as the others).
- **Phones (build area 760px wide or less)**: the camera frames the build above the message and Bloppit (`bottomCover`
  in `playFit`) and below the race banner; Bloppit's words are hidden (his reactions stay; a "Play next" bubble still
  shows); a long message folds to one line after 4.5 s. Mirror puzzles frame both halves.
- **My films**: an island's arrival film is listed once the island is found, even if it played on setting off.
- **Blitz**: a "Let's go" before the clock starts; a wrong brick adds 1 second; the race-o-meter. In Bloppitopia, a clear
  next race that gets harder; the Grand Prix counts in the counter (race x of 20). Targets for a child: Warm-up won almost
  always, Steady about 75%, Full throttle 50%, Grand Prix 40%. In Pippa's boss level the Pup still mirrors Pippa.
- **Photo to build** (Build Anything, "Add a photo"; redone 11 Nov 2026 after a 50-photo test): a photo becomes a flat tile
  picture in three sizes, Small (about 135 tiles, the default), Medium (about 250), Big (about 490): the size is a number
  of tiles, so a tall photo and a wide one are the same build. At most 8 flat colours, no speckle (`photoPicture`); a
  "Zoom in" slider and dragging on the photo choose the part to build (`picCrop`); a new photo replaces the last one.
  Before, a default photo was about 1,160 tiles and fewer than half were recognisable. It works for one clear thing on a
  plain background; faces and busy scenes don't come out at a size a child can build, so it's a "try it" extra, not a
  headline feature.
  - **How it travels (don't break this):** rooms, links, Crews and saved builds carry a puzzle as its picture (PNG) plus
    `S`, and every device rebuilds from those. So the photo is first turned into a small flat picture, one square per
    tile (`photoGrid`), and that picture replaces the photo as the puzzle's image, with `S.pw` = its width and `S.psec`
    = tiles per step; the old exact code in `buildPicture` then builds it, as it does a drawing. The photo itself stays
    in `p.orig`, on this device only, for Size and Zoom. The first version (live from 11 Nov, 8:35 am Eastern)
    converted anything that wasn't flagged as a drawing, and the flag isn't sent, so shared and saved drawings were
    rebuilt wrongly. An app from before this (1.1.2 and older) rebuilds a shared photo picture at 24 tiles wide or
    more, so it gets a slightly different picture until the next app release.
- **Launch marketing (Steff, 12 Nov 2026)**: nothing shown to the public mentions lufu; Moonstone Isle appears only in
  its mist (no "Mystery Island" label, a lavender glow is fine). The launch video has music only (no brick sounds).
- **Link previews** (13 Nov 2026): every website page carries the full set (title, description, `og:*`, `twitter:*`); the
  share image is `public/og-bloppit-world-of-bricks.png` (the game page still uses the same picture as `og-image.png`).
  X and others cache a page's card for days: after changing a card, rename the image so it is fetched again, and expect
  an already-posted address to show the old card for a while (a new address, such as `/go/x`, gets a fresh card).
- **How to Play video** (`public/video/how-to-play*.mp4`: website, app, app upright; the app has them built in, so a new
  video reaches app players with the next release). Re-recorded 11 Nov 2026: the first one was filmed in real time in the
  slow test browser, so its game footage showed only about 6 new pictures a second. `tests/howto/` records it frame by
  frame instead (run from that folder): `rec.mjs` plays a first visit on a fake clock, one 1/30 s step and one
  screenshot per video frame (`DSF=1.7 EVERY=1 OUT=x/final node rec.mjs`, about 45 minutes; `FROM=762` fast-forwards to
  a later scene for drafts); `cards.mjs` draws the opening and ending cards with the current logo; `compose.py x/final
  x/out` puts the footage into the phone in the existing video and keeps its captions, Bloppit drawings, fades and
  sound, so the scene timing in `rec.mjs` (video frame numbers) must stay. CSS animations don't follow the fake clock:
  the recorder freezes them and steps them by hand. Copy `x/out/*.mp4` to `public/video/` and remake the `.jpg` posters.
- **Parts box**: each tap adds a brick to your hand, up to what the current booklet page needs; put back one or all (in
  the build and in the box). The first brick gets a suggested spot but can go anywhere.
- **Films** ship inside the app, except the Moonstone feature film, which streams from bloppit.com. Mid-island films use a
  "next film ready" slot; the halfway lines run on their own cadence. Films always play with sound.
- **Together** has two parts, each with its own page: Play with Friends and Your Crews. Crews pick their own puzzle (with
  a suggestion) and name their crew.
- **Business**: iOS 1.0 was a quiet soft launch; 1.1 is the version to market. US launch, no direct marketing in Bermuda. Android through Bloppit LLC (Wyoming), which owns all the Bloppit IP.

## Stars and Galaxy Blocks (redone 9 Nov 2026, Steff): the only two reward numbers

- **Stars are the one thing that grows; XP is gone from the screens.** A build starts with ★ by size: Easy (≤30 bricks)
  5, Medium (31–100) 8, Hard (100+) 10 (`starCap`, `tierOf`). Each brick that needed a hint, a "Place one for me" or
  another try costs one ★, never more than one per brick, never below 2 (`STAR_FLOOR`; `run.trouble`, `troubleAdd`,
  `runLost`). The Trail and Weekly finish cards count the ★ down row by row (`starRows`).
- **Bonus ★** (`STAR_BONUS`): Weekly +3, From Memory +2, Blitz win +1, Pippa's bottle +1 a day, finished island +10,
  whole world +20. All ★ earned = `worldStarsEarned`. A fixed-content perfect run is about 820 ★; it keeps growing after.
- **Otter Level from ★**: Level n at 6·n·(n−1) (L2 12, L5 120, L8 336, L11 660). No otter goes down: builds from before
  `STAR_SWITCH` keep the level their old XP gave (`oldLevel`). Outfits and Pup/Splash/Legend follow the level.
- **Galaxy Blocks = every ★ earned, minus the shop.** Shop prices went ×2.5 (flag 8 … top piece 125). Decorations
  bought before cost the old price (`o.paid` records the price from now on; `OLD_COST` for older ones).
- Records keep `l` (fewest ★ lost; the rating is worked out from `l` and the size, `rateOf`), plus `r` and `s` (out of
  3, for app 1.1). Older records: `r` out of 10 → lost 10−r; only `s` → lost 0/2/4; old Blitz wins lost 0. Merges
  (game `worldMerge` and `pup/logic.mjs`) keep the lowest `l` and the lowest price paid.
- The Weekly board takes `scale:10` and answers `rating` and `stars` (out of 3, for app 1.1). "Clean" is unchanged.

## Gotchas

- The app bundles its own copy of `public/game`; a fix pushed to `main` reaches App Store players only after the next
  app release. Say so whenever it matters.
- Old links point at `/build/`; it redirects to `/game/`. Some comments and old chats still say `/build`.
- When appending a comment to an existing line, check the code after it didn't end up inside the comment (a
  `// …` swallowed the Rotate button's swap on 8 Nov; nothing noticed until Steff did). Test names aren't proof either:
  the "Rotate turns it" test never pressed Rotate.
- Brick heights: most code assumes 1 layer; tall pieces pass `h` to `brickGeo`/`edgeGeo`. Search all `brickGeo(` calls
  when adding geometry.
- `weeklyPuzzle(week)` is cached (`weeklyCache`); clear it after changing the plan at runtime.
- Model shapes on the island (`bloppit-shapes-v1`) are kept per device, newest 40. A world opened elsewhere rebuilds the
  game's own models in idle moments (`shapeRecipes`, `isl3ShapesLater`); the player's photos/drawings stay picture cards.
- Comments reference `claude/consistency-decisions-2026-11-07.md`: it lives in the claude.ai Project "Bloppit", not the
  repo (see below).
- Commits: end with the `Co-Authored-By` / `Claude-Session` lines the session gives you; commit as
  `Claude <noreply@anthropic.com>` (a hook flags other committer emails as Unverified).

## Where else knowledge lives

- The claude.ai Project **"Bloppit"** holds `claude/consistency-decisions-2026-11-07.md` (colours, names, shapes and the
  approved exceptions, in detail), the dated `claude/build-status-*.md` notes and `claude/film-series-bible.md`. A
  session attached to the Project reads them with the Projects tool.

- Steff's Claude project "Bloxie" holds the long history (strategy rounds, character work). Its notes are summarised
  in Claude's memory under the project; chats inside that project can only be read from a session in that project.
- Claude Docs: "Bloppit Strategy v5: Decisions applied" (current strategy), "Bloppit Master Strategy", "Bloppit
  Character Bible", "Bloppit Q4 Working Drafts".
- `README.md` (game systems in detail), `mobile/README.md` (app build), `mobile/store/` (listing, Google Play).
