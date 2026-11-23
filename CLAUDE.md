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
- iOS app: App Store "Bloppit: World of Bricks" (id 6821449219, bundle `com.bloppit.app`). Live on the App Store: **1.1.9** (23 Nov 2026, 11:21 am Bermuda; the Back button, a half-built Weekly waits on its page, no cut-off text, island names clear of the buttons); **1.1.10 was sent for review on 23 Nov 2026, evening** (Steff approved the What's New: the Weekly's slim bar on a phone); TestFlight builds are 1.1.11 from then on and Android's `VERSION_NAME` says 1.1.10. Before it **1.1.8** (22 Nov 2026, 1:57 pm Bermuda), **1.1.7** (21 Nov 2026, 7:15 pm Bermuda) and **1.1.6** (approved 20 Nov 2026, evening, released automatically; it carries every game change up to 20 Nov morning; 1.1.5 was build 233, approved 20 Nov 2026, 2:35 am Bermuda; 1.1.4 was build 224, 18 Nov; 1.1.3 was build 222, 15 Nov; 1.1.2 was build 218, 12 Nov; 1.1.1 was withdrawn for the phone overlay bug). 1.1.5 went to review as build 233 (18 Nov 2026, 12:28 pm Bermuda; it replaced build 230, sent that morning, at Steff's request, so that it carries the new-player landing fix #232) through the release file (see "Releasing a version without App Store Connect"): the four new special pieces, Remove player, the new-player start. The release file still says `replace_waiting: true`; set it back to false with the next version unless Steff asks to replace again. TestFlight builds are 1.1.6 from then on, set at build time; the project file still says 1.1.5. **1.1.7 is in TestFlight from 20 Nov 2026** (Steff: "Send to test flight now"): both iOS workflows build with Xcode 27.2 (the iOS 27 SDK, so the app fills the whole open iPhone Duo screen instead of being letterboxed; Apple requires it from April 2027), and the project and Android say 1.1.7. **1.1.7 was sent for review through the release file on 21 Nov 2026, 9:15 am Bermuda** (Steff approved the What's New: the Play with Friends fixes and the full Duo screen) and **went live the same day at 7:15 pm Bermuda**. **1.1.8 was sent for review on 21 Nov 2026, evening** (Steff approved the What's New: crew Pass the Puzzle with picked builders and several at once, the crew bar, Pass the Puzzle with a friend picks steps, no Team Build name box, tap a folded message); TestFlight builds are 1.1.9 from then on, and Android's `VERSION_NAME` says 1.1.8. **The repo was on 1.1.5 until 20 Nov 2026, now 1.1.7** (1.1.5 bumped 16 Nov 2026, with 1.1.4 not yet submitted: Steff said the Remove player change "will be 1.1.5"; its list is `mobile/store/submission-1.1.5.md`). 1.1.4 (bumped 15 Nov 2026) carries everything of 15 Nov (the guides, the Blitz and Pippa changes, the linking fixes, names with a link code, the turn row under the build). On 16 Nov 2026 version 1.1.4 was set up in App Store Connect with build 224 (What's New, review notes, automatic release) through Steff's Chrome, signed in by him; pressing Add for Review is his. The checklist is `mobile/store/submission-1.1.4.md`. He decided to leave the App Privacy answers as they are (a profile name in a use-once code is not contact information). When a version is approved, update the press page's version line and bump the repo to the next one. Build numbers can't be guessed (the first 1.1.3 build was 221): read them in TestFlight. Once a version is approved Apple takes no more builds for it (the TestFlight upload fails), so bump the version straight after a release. A push to `public/game/` or `mobile/` makes a new TestFlight build but never touches a build in review. Launch: 13 Nov (Bloppit and Bloppitopia), 16 Nov (the Weeklies), 21 Nov (before Thanksgiving).
- Android/Google Play: in progress (Wyoming company Bloppit LLC being set up to own the IP and the Play account). **Closed test plan (Steff, 20 Nov 2026):** a personal Play account for now and a paid BetaTesting.com test (20 Android parents, 14 days, a daily task with a screenshot); the brief is the Claude Doc "Bloppit Android closed test: BetaTesting brief". The usage counts send `p:'android'` from the Android app (`evAndroid`), and the stats page shows iPhone app, Android app and Website separately; older apps still send `app`.
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

**Releasing a version without App Store Connect (set up 18 Nov 2026, Steff: he wants the app to follow the website
with fewer manual steps; first used for 1.1.5 on 18 Nov 2026: the workflow built build 230, uploaded it and finished
green in about 10 minutes, and Apple showed 1.1.5 as Waiting for Review with the review notes of 1.1.4 carried over. The notes and the promotional text can still be edited while a version waits: Steff corrected both that day, and `mobile/store/listing.md` holds the same text):** a release is the file `mobile/store/release.json`,
`{"version":"1.1.5","whats_new":"…","replace_waiting":false}`. A push whose last commit changes that file starts
Codemagic's "iOS to App Store review" workflow: it builds that version, submits it for review with the What's New
text, and Apple releases it on approval. To make one when Steff says "release it": (1) check no "iOS to TestFlight"
build is running (two builds at once ask for the same build number); (2) write the What's New and get his yes on the
wording; (3) commit the file alone and push. `replace_waiting:true` lets it take the place of a version still waiting
for review: only when he asks, since it pulls that version out of review. Once a version is in the release file,
TestFlight builds move to the next version by themselves (`mobile/scripts/release.mjs`, tested by
`tests/release.test.mjs`), so the manual bump after a release is no longer needed for iOS (Android's `VERSION_NAME`
in `codemagic.yaml` and `build.gradle` still is). The first real run must be watched: whether the new version keeps
the review notes of the last one, and that the key "Bloppit ASC" has the App Manager role. Promotional text and
screenshots are still changed in App Store Connect.

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
  its "Current version" line with each App Store release. It also carries a press release (added 17 Nov 2026) with
  Steff's approved quote; change its wording only with him. No lufu and no Moonstone Isle beyond the mist (Steff's launch
  rule). `marketing/launch-video/`: the locked 25-second launch videos and how they were made (its README).
  `marketing/carousel-2026-11-13/`: the six final Instagram carousel images for 13 Nov.
  `marketing/weekly-video-2026-11-16/`: the Weekly video (version 2, upright and wide) posted on 16 Nov;
  `marketing/weekly-carousel-2026-11-16/`: its six carousel images.
  `marketing/together-video-2026-11-20/`: the Play with Friends video for 20 Nov (approved 17 Nov; no turkey teaser
  and no "no chat" line, by Steff) with the scripts that made it, including `weekly-strip.mjs` for Weekly review
  strips; `marketing/together-carousel-2026-11-20/`: its six carousel images.
- `public/videos/`: the Videos page (bloppit.com/videos, made 18 Nov 2026, linked from every footer and the press page):
  every posted video, newest first, wide to watch and wide/upright to download (`files/`). Add a video only after it
  has been posted (nothing early), with a poster `.jpg`; the launch and How to Play videos are reused from `press/video/`
  and `video/`. Never a lufu film or anything beyond Moonstone's mist (launch rule).
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
- **Two more kinds (17 Nov 2026; Steff approved both Weeklies and they went live on the website the same day; they
  reach the app with 1.1.5, and an older app builds the same pictures from ordinary bricks):** `flame` (3×3, the
  Moon rocket's printed teardrop, stands on the launch pad between the fins; a rumble) and `ring` (13×1, the Ringed
  planet's lens-shaped ring, as wide as the model: `wide` lets it span the full width and `ledge:false` adds no bricks
  under its overhanging ends; a ping and a chime). Both use `clear` so the drawn piece comes away and the spot is empty
  until the piece goes in, and `back:'keep'` so what is behind keeps its colours. `studSheet(rows, colours, bg)` takes a
  background colour: white is the default and is never built, so a model with white bricks needs another one (the
  rocket's white body vanished on white; both use a night sky).
- **Weekly order from 30 Nov (Steff, 17 Nov 2026: 30 Nov felt too early for Christmas):** Moon rocket (30 Nov), Ringed
  planet (7 Dec), Snowman and his hat (14 Dec), Christmas tree and its star (21 Dec), Curled-up pup, Hot-air balloon,
  Striped lighthouse (11 Jan), Gingerbread house (18 Jan). The two Christmas ones were redrawn stud by stud the same
  day, with new kinds `hat` (7×3, a brim and crown printed with a red band) and `star` (3×3, five points), both
  `ledge:false` because they sit on top of something narrower. They have new names because an app that has "Snowman"
  or "Christmas tree" built in would use its own old model; the old two stay in `SAMPLES` as `hidden` for saved builds.
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

- Fast tests: `node --test tests/math.test.mjs tests/server.test.mjs tests/release.test.mjs` (seconds). Run them always.
- Browser tests: `PLAYWRIGHT_CHROMIUM=<chrome> PLAYWRIGHT_ARGS="--use-gl=angle --use-angle=swiftshader
  --enable-unsafe-swiftshader --ignore-gpu-blocklist" node --test --test-concurrency=1 tests/browser.test.mjs`.
  - In the Claude cloud sandbox Chromium is at `/opt/pw-browsers/chromium-1243/real/chrome-linux64/chrome` (older
    sessions: `/usr/bin/google-chrome`). Don't run `playwright install`.
  - **The full suite (~90 tests) overloads the sandbox** (it left 90 Chrome processes and a load average of 35). Run
    only the relevant tests with `--test-name-pattern="Weekly|Library|Blitz|…"`. GitHub Actions runs everything on
    every push and pull request (`.github/workflows/tests.yml`): the fast tests, the full browser suite, and a check
    that `public/weekly` matches `WEEKLY_PLAN` (`tests/weekly-check.mjs`). CI uses the runner's Google Chrome: Playwright's own Chromium can't
    play the .mp4 films, and with it nearly every browser test failed. Results show as a ✓/✗ next to each commit
    on GitHub (the sandbox's proxy blocks the Actions API; the commit's check-runs are readable with `gh api`).
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
- **QC: no text is cut off** (Steff, 21 Nov 2026: "add a QC check for incomplete text boxes"). Three browser tests (a
  phone 390, a small phone 360, a computer 1280) walk the main screens and dialogs (`clipWalk` in `browser.test.mjs`) and
  run `tests/clipscan.js` on each: it fails on text shortened with "…", cut by a box that hides overflow (tight line
  heights clip the tails of g, p, y: give one-line labels `line-height` 1.25 or more), clamped to fewer lines, running
  off the side of the screen, or hidden behind something solid stacked on top (it briefly makes everything respond to
  taps so hit-testing follows what's painted). Text in a box that scrolls doesn't count, nor the arrows at the ends of a row that scrolls sideways (the parts box's
  sort buttons, `overOk`). Approved exceptions: the top tab row (it scrolls, with arrows) and a phone's folded build
  message (a tap opens it). The full local run takes about an hour here; the story-beats test once timed out late in it
  (98 s) and passed alone and on GitHub: a slow sandbox, not the game. **When a new screen
  or dialog is added, add a step for it to `clipWalk`.** Prefer letting text wrap over "…" or line clamps; island
  labels keep clear of the map's buttons and cards and hide rather than sit half under one.
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
- **Website text runs the full width of its box** (Steff, 17 Nov 2026: the 76-character reading width of 9 Nov left the
  right side of the cards looking empty). Don't add a `max-width` to text inside a card.
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
  voice, no strangers talking to kids**; rooms are code-only; Crews need approval. Anonymous: names stay on the device
  (one exception, approved 15 Nov 2026: a link code carries them for its 72 hours, see Gotchas); the server only knows the Player Unique ID. Cosmetics are earned, never sold. No marketing aimed at Bermuda and no school tie-ins; Bermuda as part of the
  creation story (About us, the website) is welcome (Steff, 9 Nov).
- **Not in the App Store Kids category** (4+). Links out of the app go through the grown-ups gate (our choice).
- **Music** only in Bloppitopia; gameplay is silent apart from sound effects. The launch screen plays the "Bloppit"
  voice (Steff's two boys).
- **Chapter 2 character note (Steff, 21 Nov 2026):** Bugsy the Ladybug, whose unique puzzle is spot the difference. Not
  yet placed against the earlier "one new character" plan (the Boston lobster, mend builds); see the Project doc
  `claude/chapter-2-draft-vision-2026-11-12.md`, section 4. Story design only, nothing in the game yet.
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
- **A new player who starts somewhere other than "Start here"** (Steff, 16 and 17 Nov 2026, for 1.1.5): the order is
  always otter, arrival film, Home Island, then what was earned. Until a player has sailed (`preSail()`: never arrived,
  on a device with the 3D island) nothing in Bloppitopia counts as found: the menu shows "Start here" in Bloppitopia's
  place (no tile, no island count, no My films), and no otter card pops up on the menu. A finish card for such a player
  (`finishNew()`) has "Done" as its main button, which goes to the menu; the Weekly and Build Anything card then offers
  "Go to Bloppitopia" and the Weekly card, with no second Done. "Start here" or "Go to Bloppitopia" gives the otter card
  of the trip, the arrival film, and a landing exactly as on any first visit: "This is your home", Build our first home.
  **A build finished before sailing never counts on the island** (Steff, 18 Nov 2026, after the 17 Nov version showed
  the hut as built, played Bibi's film and opened Brickyard Cove on landing): it is marked `pre:1` in `worldFinish` and
  keeps its stars and its Weekly record, but `onIsle`/`isleLog` leave it out of every island count (`worldCount`, the
  home stages, `isleCount`, the models on stands, story beats, the credits roll). Built again after sailing, it counts
  from then. The mark survives saving and linking; when two copies of a build disagree, the one without it wins (the
  game's `worldMerge` and the server's `pup/logic.mjs`). Brickyard Cove rises with the next Weekly or Build Anything
  build. Players who have sailed keep the island as the main action. Tried and dropped: "Back to the menu" as the label
  and meeting the otter on the menu after Done (17 Nov), and letting what was built before sailing rise after the
  landing (17 Nov; dropped 18 Nov). Reaches the app with 1.1.6 (1.1.5, in review, still has the 17 Nov version).
- **Who's building? and one age list** (Steff, 18 Nov 2026, for 1.1.6): on the first trip, before the otter card, a
  card asks the player's own name and age, with Skip (`whoBuildAsk`, once per player: `whoAsked`; not shown to a player
  who already has a name of their own and an age; `?who=0` switches it off and the browser tests add it). The otter card
  no longer asks the age. Every age list is 5 to 13+ (`AGES`, `ageLabel`, `ageButtons`: the player form had 4 to 15+,
  the otter card and Nora 5 to 13+); age only sets Nora's maths and 13+ is the top grade all year (`gradeFor`). An
  older stored 4, 14 or 15 shows as 5 or 13+. Names stay on the device.
- **"How it works" guides (Steff, 15 Nov 2026)**: four pictures with a line each (`INTROS`, `introShow`). "How Blitz
  works" opens once per player before their first race against Swoop (then the race starts); "How mirror puzzles work"
  opens before Pippa's first brick of their first mirror puzzle. A player who has raced or mirrored before is not
  shown it. They stay reachable: a button on the Blitz page's Race Swoop card, on the Blitz Bay race card, and on
  Pippa's page. `?intros=0` switches them off (the browser tests add it; a test about a guide passes `intros=1`).
  No recorded video: Steff said the picture guide is fine (15 Nov 2026).
- **Pippa's words** (`PIPPA_SAYS`): short, in her voice, the thing to do first: "Watch me!", "Copy me! Do what I just
  did, on your side of the mirror line." The mirror line is a solid blue strip with posts and a rail, the table says
  PIPPA on her side and YOU on yours, and her bricks still to copy glow yellow on the table (`mirrorGlowSync`), not
  only in the booklet.
- **Never block the build screen** (Steff, 15 Nov 2026, said twice: "don't ever block the build screen"). The turn row
  ("Your turn!" / "Swoop's turn", the clock and Done) is a row of its own between the build and the hand, not a banner
  over the bricks; on a phone no message shows over the build during Swoop's turn (he stood on top of it, and it only
  repeated the turn row); no Skip button over the build while Swoop finishes (the scoreboard keeps its "Skip to the
  end" once you have won). Still over the bottom edge of the build on a phone: the message and Bloppit on your own
  turn (the camera frames the model above them) and the tool buttons along the top. Put nothing new over the build.
- **Races against Swoop: an even number of bricks, and longer first races** (Steff, 15 Nov 2026: a first race of 7
  bricks was one turn each and over). Against Swoop the counts are 10 10 10 12 14 14 16 · 12 16 18 18 18 20 22 · 16 18
  26 28 30 · 40 (the Grand Prix). The seven Warm-up races were made bigger (`sizeWas` keeps the old size, so a race won
  before stands on the island as it was built) and the Cactus moved ahead of the Trophy. An odd puzzle is evened up by
  cutting one brick in two (`S.even` in `buildModel`), **only for a race against Swoop on this device**: a puzzle
  shared with a friend (room, challenge, Pass the Puzzle) is built as before, because an older app would otherwise
  build one brick fewer and the race would break. `mpUseModel` clears `S.even`; keep it that way.
- **Phones (build area 760px wide or less)**: the camera frames the build above the message and Bloppit (`bottomCover`
  in `playFit`); Bloppit's words are hidden (his reactions stay; a "Play next" bubble still
  shows); a long message (over 60 characters) folds to one line after 4.5 s, and a tap on the folded line opens it in full again (21 Nov 2026). So put the thing to do first and keep start messages short: a Trail level starts "🐸 Open the parts box to build the Heart!" (the level and name are in the bar above). Mirror puzzles frame both halves. Home Island's label on the island map looks like the other labels: same size, same dark colour (Steff, 21 Nov 2026; it used to be bigger and red).
- **iPhone Duo** (Apple's foldable, Oct 2026; checked 19 Nov 2026): an app built with Xcode 26 shows letterboxed on the open screen (Apple's compatibility modes); only an Xcode 27.1+ build fills it, hence 1.1.7. Ideas for later (Steff saw them 19 Nov): the fold as Pippa's mirror line, and a laptop pose with the build on the upright half; both need a small native plugin, since the web fold APIs are experimental. folded 466 x 678 points (outer 1398 x 2034 px),
  open 890 x 626 (inner 2670 x 1878 px, wider than tall), both at 3x. The same app runs on it. Open, the build page puts
  the booklet beside the build (the "phones held sideways" rule now also covers 700 to 900 wide screens at 4:3 or wider);
  folded and open upright it stacks as on a phone. Folding mid-build keeps the brick in hand. A browser test covers all
  three sizes.
- **Back (Steff, 22 Nov 2026: "a full back button test")**: one rule on the website (browser Back) and in the app
  (Android's back button, `appBack`): an open card closes first (on the website each card gets a history step of its
  own, by wrapping `showModal`; a card closed by its own button takes its step back, or hands it to the page it opens,
  `cardBackT`; a card opened again while already open gets no second step, and a close only steps back over a card's own step, or it once went back twice, off the page); a finish card takes its way out (a Trail level's → Level map, the others → Done); otherwise Back goes to
  the page you came from (`navGo`; the app keeps the same steps in `appNav`), skipping a finished build; a crew's own
  page is a step (`#crew`), so a crew → Your Crews → the page before; in a room with friends the first Back says "Press
  Back again to leave the room" and the second leaves. Before this, Back from Your Crews, a crew or an open card left
  Bloppit on the website, and in the app every page went straight to the menu. Two browser tests ("Back on the
  website…", "Back in the app…") walk the journeys; the in-game ‹ buttons go to the page above.
- **My films**: an island's arrival film is listed once the island is found, even if it played on setting off.
- **Blitz**: a "Let's go" before the clock starts; a wrong brick adds 1 second; the race-o-meter. In Bloppitopia, a clear
  next race that gets harder; the Grand Prix counts in the counter (race x of 20). Targets for a child: Warm-up won almost
  always, Steady about 75%, Full throttle 50%, Grand Prix 40%. In Pippa's boss level the Pup still mirrors Pippa.
- **The Weekly has no 3-2-1** (Steff, 19 Nov 2026): it has no clock, so building starts at once with "Take your time…". The
  countdown stays for races against Swoop and timed builds.
  **The Weekly's bar above the build is one slim row** (Steff, 22 Nov 2026: the tile was too big on a phone): Bibi and
  the name on the left, "Build it clean / 3 of 26 placed" on the right, no player chip (`.mpbar.solo-calm`). It saves
  about 75px of build on a phone.
  **A half-built Weekly stays a Weekly (21 Nov 2026):** tapping a Trail tab mid-Weekly used to open the Blitz page and
  call it a race ("Back to the race", a running clock). Now it goes back to the Weekly page (`mpHomeTab`, `weeklyOn()`),
  which offers "Back to the build" and "Start again" and says how many bricks are placed; the bar shows Bibi, not ⏱,
  and no clock beside the player; if the race page ever shows it, it says "No clock" and "Stop building".
- **Crews (19 Nov 2026)**: "Tribe" was added to the third name list (append only, in the game and in `group/logic.mjs`; the
  server sends the name as words, so older apps show it). Share sends the crew's name and `bloppit.com/join/CODE`, which
  opens the crew's join page (a 6-character `?code=` goes through `joinSixCode`: a challenge or a crew). Make the crew is
  disabled while it runs, and the server gives back the same crew when an identical one was made by the same player in
  the last 10 minutes (Steff had two after one tap on a slow connection). `pupSync` called while a sync is running now
  waits for it (it used to return at once, with no Player Unique ID yet).
  Ten Mega Builds from 19 Nov 2026 (six added: Castle, Pirate Ship, Coral Reef, Steam Train, Treehouse, Volcano
  Island; drawn in `design/mega-builds/`); `PUZZLE_COUNT` in `group/logic.mjs` matches. An older app shows a crew on a
  new one with the Harbour picture.
  A player can leave a crew on its own page ("Leave this crew", tap twice; Steff, 19 Nov 2026); the Grown-ups corner's
  "Take out" stays. The last builder out ends the crew.
  **Pass the Puzzle in a crew (Steff, 19 Nov 2026):** the starter picks the steps in each turn (2 to 10, or "Share it
  evenly"; `chunk` in `pass-start`, older apps send none and get the even share); the message line counts the steps
  left ("3 steps to go, then it passes on"); Done on "Passed on!" goes back to the crew (`trialDialog({crew})`,
  `crewBackTo`), not the Blitz page; anyone in the crew can open it read-only with "See it so far" (`pass.role='look'`:
  `tryPlace` and `autoPlace` refuse). Both versions of Pass the Puzzle say "steps", as the build screen does.
  **Pass the Puzzle: picked builders, several at once (Steff, 21 Nov 2026):** the starter ticks who takes part (every
  other builder ticked by default; `players`, their labels, in `pass-start`; older apps send none and everyone takes
  part). Up to five go round a crew at once (`MAX_OPEN_PASSES`); the server keeps `g.passes` (a crew's one `g.pass` from
  before is read as the first), each with its own model key (`p.mk`; an old one uses `gpass/CODE`), and the last six
  finished. `passes` is the list for the game; `pass` is the one an older app shows (your turn first). Turns go round
  the picked builders in join order; someone who left is skipped. "Your turn in Pass the Puzzle" stays crew news (the
  dot) until you've built.
  **Pass the Puzzle with one friend (Race a Friend): the first player picks how many steps they build (Steff, 21 Nov
  2026):** "You build half" (the default) or 2 to 10 steps (`#bzRelayPer`, `relayStart(choice, per)`); the code's `half`
  carries the split, which the server and older apps already took, so an older app finishes from the right step.
  The wording says "Your part is done!" and "built steps 1 to N", not "half".
  **No name box on Team Build (Steff, 21 Nov 2026):** the server gives every player a made-up name and ignored a typed
  one, and your own screen shows the made-up name too, so the box did nothing; it's gone from Make a room and Join, and
  no name is sent to the room server any more. The race name ("Racing as …", Race a Friend) stays: it shows in races
  against Swoop on the device.
  **A bar above a crew build (21 Nov 2026):** Pass the Puzzle and the Mega Build show `#crewBar` (crew pink, above the
  build like the Trail bar, never over it): what it is, whose turn ("Your turn · steps 3 to 6" or "Just looking. It's
  X's turn"), and "‹ Back to the crew" ("‹ Back" on phones), which asks once if steps of this turn aren't passed on.
  Just looking (`body.pass-look`) has no hand, parts box, Hint or Place one.
  **The Crew Mega Build is a real build (Steff, 19 Nov 2026):** the crew's picture (`CREW_PUZZLES`, 28 x 22) becomes a
  brick picture of tiles on a baseplate (`megaPicture`, `megaSettings`: kind `picture`, about 210 to 260 tiles, row by
  row from the top). Anyone in the crew taps Start building / Carry on building (`megaOpen`), carries on where the crew
  left off and builds as long as they like; each tile goes to the server about 2 seconds after it's placed
  (`megaQueue`/`megaSave`, action `mega-add`, and on leaving the build or the page), and the answer brings the other
  builders' tiles in (`megaMerge`; the same tile from two builders counts once). Bricks from other games no longer
  count (the server still takes `contribute` from older apps and ignores it for the Mega Build); a builder's `bricks`
  is now their tiles in this Mega Build. The server keeps `g.mega = {puzzle, n, steps, moves, done, last}` and refuses
  a model of another size (another app version). The last tile finishes it: everyone who helped gets it on their
  island (`p:CODE:mN`, `megaCredit`/`megaCreditFor`), and the maker picks the next one. Existing crews started again
  from zero. The crew picture fills from the top row, as it's built.
- **Play with Friends check and fixes (Steff, 21 Nov 2026, "fix all and go with your proposals"):** the lobby says
  friends tap Together, then Join a Game; the room code fits its badge on a phone; the turn line keeps clear of the
  corner buttons (`--btnw`, measured in `updateMpBar`); a chime and a buzz when it becomes your turn in a game with
  friends; a live race with friends starts with 3-2-1 Go! (the server parks the first `turnStart` 3 s ahead,
  `COUNTDOWN_MS` in `room/logic.mjs`, and refuses a brick before Go; `roomCountdown`, `mpCountingDown`; older apps
  just get "wait for Go!" if they place early); games with friends (rooms, challenges, Pass the Puzzle, crews) keep the
  Together tab during the build (`sectionOf`); **Team Build has no points and no medals** (bricks each, ★ as in every
  build; hint and Place one cost ★ like anywhere); no name to type for Team Build (the otter's name, as in races); the
  name boxes say friends see "a made-up name" (the names are any animal, not otters); codes say "Join a Game in
  Together", not "the Blitz page"; Race a Friend's card puts Race live now first, then Send a challenge, then Pass the
  Puzzle (marked "Not a race"); everyone reads the same finish line; the header says "Get ready…" during a countdown;
  a received challenge scrolls into view; a dot on Play with Friends and Race a Friend when someone raced your
  challenge or finished your passed puzzle (`chNewsCheck`, per player `bloppit-ch-seen-v1`, cleared by the Race page).
- **Steff's name in public text is "Steffin du Preez"** (19 Nov 2026), e.g. the press page.
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
- A link code works once. "It says expired" right after making one usually means it already worked and Link was tapped
  again (15 Nov 2026: the server log showed a 200, then a 404 nine seconds later). The form now empties the box after a
  link and answers the same code with "it worked". To check a report, read the `pup` function's requests with the
  Netlify connector: the app's requests have no "Safari" in the user agent and no referrer.
- **Remove player only takes the player off that device** (Steff's decision, 15 Nov 2026). Until then it deleted the
  server copy too, for every linked device: he removed a linked player in Safari and the app answered "That pup wasn't
  found" to Make a link code. The server copy now goes only with Grown-ups → Delete saved progress (or a family key), or
  after a year unplayed, as the privacy policy says. Make a link code saves the player again from the device if the
  server copy is gone; the server's messages say "player", never "pup". Apps up to 1.1.3 still delete on Remove player.
- **Remove player takes everything of theirs off the device, and the only player can be removed** (Steff, 16 Nov 2026,
  for 1.1.5). The button used to be hidden for the last player only because the code needed someone to switch to.
  Removing the last player starts the device again as on a first visit: a new `p1` "Player 1" with `fresh:1` (so the
  welcome shows), ids counted from 1 again, and everything earlier players left behind cleared. `playerWipe(id)` lists
  every per-player key; **a new key used with `pkey(…)` must be added to it** (a browser test fails otherwise): the
  first player's keys carry no id, so they can only be cleared by name. Until this fix Remove player cleared only the
  scores, the build in progress and the old Daily record, so devices have leftovers (`bloppit-world-v1:p2` and so on)
  from players removed earlier; they are never read (ids are not reused) and go when the last player is removed.
  Kept on purpose: sound and music, the family key, the anonymous usage counters.
- **A linked player used to arrive mixed with whoever was playing** (fixed 15 Nov 2026): `pupApply` joined the incoming
  world with the current player's, so the new player got the current player's builds, stars and otter name (and would
  have saved the mix to the server once played). It now joins only with that player's own world on the device. Same
  fix for the three ways a player arrives (link code, Family Link, family key). A linked player's default name is the
  first unused "Player N". An otter name picked from the list carries with the progress (it is a number).
- **Names travel with a link code** (Steff's idea, approved and live on the website 15 Nov 2026). Making a code sends the player's name and a typed otter name; the server
  keeps them in the code's own record only (`xfer/CODE`, never in the player's record) until the code is used, and
  deletes an unused one with the expired code (daily cleanup, or the first try after 72 hours). The other device uses
  them for the linked player (`linkedAdd`). It changes a promise ("names never leave the device"): the privacy policy
  and the Grown-ups corner say so in the same commit, `mobile/store/listing.md`'s review notes say it from 1.1.4, and a proposed "Name" row for the App
  Store privacy label and Google Play's Data safety is written there; Steff decided against it (16 Nov 2026), the answers stay as they are. A family key carries no names.
- The "living characters: on the island…" browser test failed now and then in a long run (15 Nov 2026, the one failure
  in the full run of 105): Bloppit's word shows for 2 seconds after a tap, and the test took three separate looks,
  which on a busy machine could take longer. It now waits once, inside the page, for the reaction and the word together.
  The same day a real cause of now-and-then failures in the game was fixed: a second 3D character asked for while the
  loader's two files were still arriving found the loader but not its decoder (`ch3Model` now waits for both).
- GitHub's full browser run of the 1.1.4 push failed on one test, "a decided race against Swoop fast-forwards" (15 Nov
  2026): the fast-forward lasts a second or two and the test looked for it from outside every quarter second, so on a
  slow machine it was over before the test looked. The page now notes the moment itself. The next run failed the same
  test differently ("his clock runs about 4 s a second (2.1 s)"): the repair read his clock "one second later", and he
  had finished inside that second. The test now times his clock only over readings taken while he is still building,
  and says so when the fast-forward was too short to time. The game was right both times. `gh run view --repo
  steffindup/building-blox --job <check-run id> --log-failed` reads a failed run's log from the sandbox.
- **A TestFlight upload that fails at "Publishing"** ("Failed to publish App.ipa to App Store Connect") while the .ipa
  built means Apple has approved that version and takes no more builds for it: every build of 15 Nov 2026 failed that
  way until the repo moved from 1.1.3 to 1.1.4. Read a commit's check-runs with
  `gh api repos/steffindup/building-blox/commits/<sha>/check-runs` (that works from the sandbox).
- **The app bundles About us, How it works, FAQ and Privacy** (`mobile/scripts/build-www.mjs`) and stops the build if one
  still points at a website file. On 18 Nov 2026 the new footer link to the Videos page (`/videos/`) matched its
  `/video` test and every app build failed at "Install and package the web app" until the test was made exact
  (`art/`, `video/`). A new website link in those pages can trip it: run `node scripts/build-www.mjs` in `mobile/`.
- **A push to `main` cancels a running TestFlight build, even a push that builds nothing** (19 Nov 2026: a notes-only
  commit pushed two minutes after the iPhone Duo fix cancelled its TestFlight build; `cancel_previous_builds`). Push
  notes with the work, or wait until the build has finished (`gh api …/commits/<sha>/check-runs`).
- **Xcode 27 builds work, but can wait a long time for a machine** (19 Nov 2026). The first check (from the push to
  `xcode-27`) waited about 18 minutes, and because builds run one at a time, the TestFlight build of `main` waited
  behind it until it was cancelled. The second, started by hand at 4:31 pm Bermuda, got a machine after about 40 minutes
  and passed: the app builds on Xcode 27.2 on `mac_mini_m2`. Builds started by hand or on a branch may not show on
  GitHub (this one did, as a check-run on its commit). Never leave one queued ahead of a release.
- **Xcode 27 by April 2027.** Apple's notice on build 230 (ITMS-90725, 18 Nov 2026): from April 2027 uploads must be
  built with the iOS 27 SDK. Done 20 Nov 2026: both iOS workflows pin `xcode: 27.2` ("latest" was landing on overloaded machines).
- Island cards (`islandTip`) are kept inside the screen and scroll inside themselves if taller than it (15 Nov 2026: on a
  phone Mystery Island's card opened below the bottom edge).
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
