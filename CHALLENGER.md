# Bloppit full challenger

The full web challenger is at https://bloppit-chatgpt-challenger.netlify.app/challenger/ on branch chatgpt/bloppit-challenger. This release replaces the four-build landing experience with the complete original game engine and a new presentation. The earlier prototype remains available at /prototype/ for reference.

## What is playable

- Quick Build, the model library, photo-to-brick conversion and instruction booklets.
- Otter Trail and Brain Trail (14 levels each), weekly puzzles, free drawing and shared drawing links.
- Longtail CPU races, friend challenges, live rooms, co-building, relays and crews.
- Home Island and five surrounding islands, unlocks, decorations, draggable buildings, wardrobe, player profiles, family transfers and progress recovery.
- Original articulated 3D mentor and pup otters, expressive brows/eyes/mouth, blinking, idle movement, wave/celebration/mistake poses, and articulated Longtails. The same otter appears in the workshop, building companion, arrival boat, naming preview and wardrobe.
- Rounded tree canopies and clouds, flower/grass accents, animated water highlights, tone-mapped lighting, a new workshop menu and responsive building interface.
- Graphics quality and motion settings, independent challenger saves, locally bundled fonts/libraries, separate app icon and install manifest.
- Version 2 randomized A/B entry and an aggregate comparison report.

## Architecture and production isolation

The inspected source baseline is 765ec30552e8698449cb3d28a9cdaf6e4f894107. Its public/build/index.html contains the complete Three.js r128 game. The existing island already has progression and customization; its characters use raster/vector sprite art. Netlify Functions provide rooms, challenges, progress recovery, crews and events through Netlify Blobs. The original Capacitor app is in mobile/ with bundle ID com.bloppit.app and a main-branch Codemagic publishing workflow.

The full challenger reuses those tested gameplay rules. scripts/full-challenger.mjs applies checked presentation hooks to a generated copy during packaging. If a required hook changes upstream, the build fails for review. public/full/characters.js owns the original procedural rigs; runtime.js integrates them with game events, previews and saved settings; style.css supplies the interface. This is a presentation challenger of the complete game, not an independently rewritten set of gameplay rules.

Production HTML, mobile/ and function logic remain unchanged. Only the generated challenger prefixes storage with bloppit-full-v2:. Generated share links return to the challenger. Both experimental arms use the separate Netlify site's backend, never production data. The control receives only local dependency packaging, preview-origin links and the same experiment instrumentation. The new project's published branch is chatgpt/bloppit-challenger; main and the production domain remain separate.

## Run locally

Install Node 22 and dependencies with npm ci. Run npm run dev:challenger, then open http://localhost:8788/challenger/. The same server exposes /build/ for the control, /experiment/ for randomized entry and /experiment/report.html for results. Local online features use an in-memory test backend; restarting the local server clears that backend.

npm run build:challenger produces challenger-dist/. Do not use the ordinary public/ dev server to review this release: public/challenger/ retains the older prototype; the full game is assembled into challenger-dist/challenger/.

## Verify

Set PLAYWRIGHT_CHROMIUM to an installed Chrome executable, or install Playwright's Chromium. npm run test:full packages the web and native assets and runs the new full-challenger tests. npm run test:parity runs all twelve original gameplay scenarios on the generated challenger. npm test runs the original browser suite, server tests, prototype tests and new full-challenger checks; package assets first with node scripts/build-challenger-mobile.mjs. The screenshot script captures the real generated game, including a seeded advanced world clearly identified as a preview.

## Deploy and roll back

The existing separate Netlify project bloppit-chatgpt-challenger automatically publishes this branch. Its branch-specific command is npm ci && node scripts/build-challenger.mjs and its publish directory is challenger-dist. Functions remain netlify/functions. Push only the challenger branch. Do not change the existing bloppit project's settings or merge to main to test this build.

For a new preview project, connect the same branch with those settings. Set URL to that project's HTTPS origin when packaging manually, so shared links and the control's URLs target the preview. Use a new EVENTS_KEY on the challenger project to read server counts. No production secrets are needed. Static file upload alone does not deploy the social/progress functions.

Rollback uses a previous deploy on the separate Netlify project. Prototype commit b3d78f3 is available if needed. Removing or disabling the challenger project does not affect production.

## Fair comparison

| Area | Original control | Full challenger |
|---|---|---|
| Puzzles and modes | Existing complete engine | Same engine, puzzles and rules |
| Progression and social features | Existing islands, rooms, crews and recovery | Same features with separate saves and preview backend |
| Characters | Existing authored sprite/vector art | New original articulated 3D otters and Longtails |
| World | Existing evolving 3D scenery | Revised canopy/cloud geometry, flora, water and lighting |
| Interface | Existing bright interface | New workshop layout, palette, previews and companion |
| Experiment | Same v2 event definitions | Same v2 event definitions |

No measured winner is claimed. Read EXPERIMENT.md for the protocol. The visual implementation is procedural and has not been established to match Talking Tom's production art quality. A finished commercial character pipeline would still benefit from professional sculpting, facial animation, sound and real-device art/performance review. The playable feature set is substantially broader than the first prototype; polish quality remains an empirical judgment.

## Phone release

mobile-challenger/ packages the complete local game. Solo play and graphics are bundled; rooms, recovery and shared challenges use the isolated preview backend and require internet. Native builds are excluded from the web A/B experiment. See mobile-challenger/README.md for the separate manual signing workflow. An IPA cannot be validated or submitted from this Windows session without the new Apple app record and signing setup.
