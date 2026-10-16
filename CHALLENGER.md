# Bloppit challenger · first playable art and gameplay slice

Baseline: `765ec30552e8698449cb3d28a9cdaf6e4f894107`, inspected 16 October 2026. Branch: `chatgpt/bloppit-challenger`.

## What is implemented

An original, volumetric otter with separate body, head, eyes, pupils, brows, mouth, ears, whiskers, arms, feet, tail and bandana. Procedural idle, blink, gaze, wave, joy and mistake reactions. A sunlit miniature island with terrain, trees, flowers, water rings and clouds. Four authored, supported brick models—cottage, boat, garden and beacon—appear in the world on completion. Colour/rotation validation, hints, undo, completion rewards, repeat builds, saved unfinished builds, sound toggle, reduced-motion support, local save export, and desktop/mobile layouts are implemented.

This is **not full feature parity or a claim of Talking Tom production quality**. Geometry and animation are procedural; there is no sculpted fur, facial blend-shape rig, voice acting, professional motion capture, or finished cinematic art pipeline. The code makes the proposed direction playable and reviewable. User testing and device profiling, followed by specialist character modeling/rigging and animation passes, are needed to establish that the art is better.

## Architecture found in the original

`public/build/index.html` contains the app, its Three.js r128 renderers, gameplay, UI, photo-to-brick conversion, trails and island. Existing island characters are sprites; `pupTex3()` composites raster body/paws/accessories to a texture. The world already evolves with builds and has progression and customization. The existing version is more than a basic block game.

`netlify/functions/{room,challenge,pup,group,event}` separate pure rules (`logic.mjs`) from hosting adapters. Netlify Blobs provides rooms, challenge data, progress recovery and aggregate event counts; cleanup is scheduled. `netlify.toml` publishes `public/` without a build. Production is deployed from `main`. `mobile/` is Capacitor 8, bundle ID `com.bloppit.app`. Its packaging bundles fonts and Three.js; `codemagic.yaml` signs and uploads to App Store Connect. The YAML has a main-branch push trigger despite an older comment claiming manual-only builds. Never push this work to main to preview it.

## Challenger architecture

- `public/challenger/game.mjs`: pure rules, model definitions, save validation; no rendering or DOM dependencies.
- `scene.mjs`: Three.js world, procedural articulated character, lighting, picking and animation. Device pixel ratio capped at 1.65. Rendering pauses while the document is hidden. Reduced motion disables ambient/character loops.
- `app.mjs` and `style.css`: UI and interaction, accessible buttons, dialogs, responsive composition and audio.
- `analytics.mjs`, `public/experiment/`: isolated event counts, reviewer separation and randomized entry.
- `scripts/build-challenger.mjs`: produces `challenger-dist/`. Copies the untouched original as the control and instruments only the generated control copy. It bundles Three.js/fonts and licenses; it never modifies production HTML.
- `mobile-challenger/`: separate app identity and offline build.

## Run and validate

```
npm ci
npm run build:challenger
npm run dev
```

Open `http://localhost:8788/challenger/`. For the instrumented A/B control, set `PREVIEW_DIST=1` before running `npm run dev`; open `/experiment/`. On PowerShell: `$env:PREVIEW_DIST='1'; npm run dev`. On macOS/Linux: `PREVIEW_DIST=1 npm run dev`.

```
node --test tests/challenger.test.mjs tests/server.test.mjs
npm run test:challenger
```

Browser tests require Chromium. Set `PLAYWRIGHT_CHROMIUM` to an installed Chrome path, or run `npx playwright install chromium`. `npm test` also runs the original browser regression suite. Desktop screenshots can be produced by `scripts/capture-challenger.mjs` with a local preview on port 8789. The dev server's dynamic imports were corrected to file URLs so tests work on Windows.

## Deploy without changing production

Use a **new Netlify project**, connected to this repository with production branch `chatgpt/bloppit-challenger`. Do not alter the existing `bloppit` project, its domain, secrets or production branch. The root `netlify.toml` now has a branch-specific context for this exact branch: build command `npm ci && node scripts/build-challenger.mjs`, publish `challenger-dist`. Its default `main` build remains unchanged. Functions stay in `netlify/functions`. Confirm these effective settings in the new site's build log. `challenger-netlify.toml` also supplies a standalone configuration for CLI workflows that select an alternate config.

Alternatively, from a separately linked CLI checkout:

```
npm ci
npm run build:challenger
npx netlify deploy --dir challenger-dist --functions netlify/functions --no-build
```

Select/create a new site. Omit `--prod` for an initial draft. Never link the production site. For an automatic branch build, use the checked-in branch-specific context described below. Use a new `EVENTS_KEY` on the challenger site for aggregate reporting; do not reuse production secrets. Blobs are scoped to the new site, isolating all copied control APIs. Manual static ZIP upload alone does not deploy functions; it supports the challenger but is insufficient for a fair control test of multiplayer/cloud features.

Rollback: stop distributing the challenger URL and disable its builds. Production has no dependency on it. Remove the separate app from testing independently. The original source files and save keys are preserved.

## Fair comparison and measurement

Read `EXPERIMENT.md`. The experiment tests a changed complete experience, not graphics in isolation. No uplift, winner or statistical significance is claimed without measured results. The control retains far more content and mature functionality. The challenger currently targets a narrower, calmer first-build experience.

| Area | Existing version at baseline | Challenger slice |
|---|---|---|
| Character | Authored raster/vector art, sprites within 3D world | Procedural 3D articulation, gaze/blink/reactions |
| World | Existing evolving island, customization, progression | Four visible landmark rewards, coherent miniature art direction |
| Building | Library, photos, trails, booklet, broader placement mechanics | Four guided models, colour/rotation matching, snap/hint/undo |
| Social | Weekly, asynchronous/live races, co-building, recovery | Not ported; control remains separately playable |
| Persistence | Local profiles and anonymous server recovery | Separate local save; no cloud sync or import UI |
| Analytics | Production aggregate usage counts | Preview-only randomized/reviewer prefixes, export, opt-in aggregate sends |
| Native | Existing Capacitor/TestFlight pipeline | Separate offline wrapper and manual workflow; IPA unverified |

## Remaining limits

No photo conversion, freeform construction, multiplayer, inventory economy, advanced progression, cloud recovery, native haptics or native A/B comparison in this slice. The keyboard-accessible Snap button provides an alternative to 3D picking, but the entire spatial game is not a screen-reader experience. Storage-denied browsers can play but cannot retain progress. WebGL is required. Browser automation on software rendering is not a substitute for real-device performance measurements. Counts are best effort, can be lost offline, and are not abuse-resistant.

References checked: [Netlify deployment methods](https://docs.netlify.com/deploy/create-deploys/), [Capacitor configuration](https://capacitorjs.com/docs/config), [Codemagic App Store Connect publishing](https://docs.codemagic.io/yaml-publishing/app-store-connect/).
