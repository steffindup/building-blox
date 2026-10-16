# Full challenger verification · 16 October 2026

Target: https://bloppit-chatgpt-challenger.netlify.app/challenger/
Branch: chatgpt/bloppit-challenger
Control baseline: 765ec30552e8698449cb3d28a9cdaf6e4f894107

## Automated verification

39 tests passed across the current release checks on Windows, Node 22 and Chrome:

- 12 original gameplay regression scenarios run against the full challenger: first arrival and naming, first home completion, touch dragging, Trail completion, Longtail races, share links, weekly puzzles, world stages and fallback, relay, crew, island interactions, family transfer and drawings (some scenarios cover several features).
- 5 new full-challenger tests: checked build hooks, full menu/mobile/settings, articulated world and independent saves, version 2 analytics and reporting, bundled native webview shell with isolated API origin.
- 4 prototype browser tests, including the updated control adapter; the old four-build prototype remains at /prototype/.
- 4 prototype rules tests and 14 existing server tests.

The five new tests were repeated after the final analytics initialization and packaging updates and passed. Server and rules tests were repeated successfully. Desktop and phone screenshots were visually inspected; the capture script additionally follows the real arrival/naming/first-build flow. The advanced-world image uses ten seeded sample completions for visual inspection and does not represent actual tester activity.

No production game HTML, original mobile/ files or original server function code changed relative to the baseline. The root Netlify context publishes only the challenger branch to its separate site. The manual iOS workflow installs the original challenger icon into mobile-challenger/ios and retains the separate bundle identity.

## Scope of the evidence

This verifies a complete-game presentation challenger, including the existing rules and content. It does not establish equivalence of every possible user interaction, superior enjoyment, commercial art quality, frame-rate/thermal behavior on physical phones, or actual participant conversion improvement. The new procedural character rig is original; it is not a Talking Tom asset or a claim to that studio's production quality.

Local A/B counts and the report are implemented. Hosted count reads need a new EVENTS_KEY on the separate Netlify project. No production key was copied. The report distinguishes randomized and reviewer counts and excludes version 1 prototype data.

The full native web package is built and its local shell was checked in a browser with external requests blocked. Signing, native rendering, VoiceOver, background/resume, heat/battery, App Store validation and TestFlight install require the separate Apple app record and real iPhone/iPad tests. No IPA has been uploaded from this Windows session. Deployment and signing instructions are in CHALLENGER.md and mobile-challenger/README.md.
