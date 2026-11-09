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
  its face and matches only its own spot. It can be turned like any brick (Steff, 9 Nov). Only kind so far: `dial` (Big Ben, the player's real time,
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
    that `public/weekly` matches `WEEKLY_PLAN` (`tests/weekly-check.mjs`). CI uses the runner's Google Chrome: Playwright's own Chromium can't
    play the .mp4 films, and with it nearly every browser test failed. Results show as a ✓/✗ next to each commit
    on GitHub (the sandbox's proxy blocks the Actions API; the commit's check-runs may still be readable).
  - The tests use port 8799. Stop any dev server you started on 8799 first, or use another port for your own server.
  - A test that "sometimes fails" is worth a real look before rerunning it. "the Weekly: a brick of the wrong colour…"
    looked flaky for two days; it was a real bug (the game said Go! three seconds before you could place). Fixed 9 Nov.
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
  the island option isn't available.
- **Blitz**: a "Let's go" before the clock starts; a wrong brick adds 1 second; the race-o-meter. In Bloppitopia, a clear
  next race that gets harder; the Grand Prix counts in the counter (race x of 20). Targets for a child: Warm-up won almost
  always, Steady about 75%, Full throttle 50%, Grand Prix 40%. In Pippa's boss level the Pup still mirrors Pippa.
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
