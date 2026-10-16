# Delivery verification · 16 October 2026

Live challenger: https://bloppit-chatgpt-challenger.netlify.app/challenger/

Randomized entry: https://bloppit-chatgpt-challenger.netlify.app/experiment/

Control preview: https://bloppit-chatgpt-challenger.netlify.app/build/?ab=review

Branch: https://github.com/steffindup/building-blox/tree/chatgpt/bloppit-challenger

The new Netlify project is **bloppit-chatgpt-challenger**, deployed from **chatgpt/bloppit-challenger**. Netlify's build log confirmed the branch-specific build command, `challenger-dist` publish directory, successful secret scanning and deployment of six functions. The original `bloppit` project was not modified. No production domain was reassigned. Original game HTML, original `mobile/` and original function code are unchanged relative to the inspected baseline.

## Automated results

All **34 tests passed** on Windows with Node 22 and installed Chrome:

- Four challenger rule tests: all models finish, repeat rewards stay unique, colour/orientation validation, valid resume and undo, corrupt-save recovery, nonoverlapping/supported authored bricks.
- Four challenger browser tests: complete every model and reload the finished island; wrong brick and undo; phone layout and persistent settings; reviewer/randomized count separation and opt-in requests; generated control adapter and bundled Three.js.
- Fourteen existing server tests: progress merges, transfer, weekly boundaries, groups, family keys and aggregate events.
- Twelve existing browser tests: first visit/home build, touch placement, trail completion, Longtail race, share links, weekly bank, island stages/fallback, relay, crew, island interactions, family transfer and drawing.

Live browser smoke test: the new site's root opened the challenger, the 3D world rendered, and Snap advanced the first build from 0/13 to 1/13. Desktop and 390px phone layouts were captured and visually inspected. Visual checks found and corrected washed-out materials, an oversized mouth animation and overlapping phone controls.

Hosted endpoint checks: `/challenger/` returned HTTP 200 with `X-Robots-Tag: noindex, nofollow`; a reviewer-only smoke event returned `{ok:true}` from the isolated `/api/event`; unauthenticated reporting returned HTTP 403. Final challenger browser tests were rerun successfully after correcting next-build copy for out-of-order completion and keeping generated control share URLs on the preview origin.

## Limits and next actions

This is a **four-build playable prototype**, not a complete replacement of all existing modes, and not verified to meet Talking Tom's production art quality. No real-player A/B results or superiority claim exists. Art appeal needs blinded human evaluation. Read `CHALLENGER.md` and `EXPERIMENT.md` for the feature comparison and study constraints.

Local metrics/export work immediately. To read hosted aggregate counts at `/stats/`, the site owner must set a **new `EVENTS_KEY`** on the challenger Netlify project. No production key was copied. Shared counts are best effort and exclude reviewer traffic from the randomized prefixes; no backfill is performed after late opt-in.

The offline native package builds, and a separate manual Codemagic workflow is supplied. An IPA was not built or submitted from Windows. Register `com.bloppit.challenger`, provide its own App Store Connect record/signing profile and `CHALLENGER_APPLE_ID`, add final icons, review the native CLI dependency audit, and run iPhone/iPad acceptance tests before TestFlight distribution. The production native workflow and identity remain separate.

Software-rendered browser testing does not establish frame-rate, thermal, battery or memory performance on physical iPhones. No device benchmark or long-term retention claim is made.
