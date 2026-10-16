# Full-game A/B experiment, version 2

Entry: https://bloppit-chatgpt-challenger.netlify.app/experiment/
Report: https://bloppit-chatgpt-challenger.netlify.app/experiment/report.html

Both arms use the same game engine, content, rules, progression and preview backend. A preserves the original presentation; B uses the new character, scenery and interface presentation. This measures the combined redesign, not a causal graphics-only effect. No participant results or superiority claim are available yet.

Use new browser profiles and first-time testers, balanced across device types. The entry page assigns an arm randomly using the browser's crypto generator and saves it as bloppit-experiment-v2. Keep existing experienced users in a separate study. Ask the same enjoyment, mascot appeal, ease-of-building and desire-to-return questions on a 1–5 scale after ten minutes. Collect ratings before showing the other arm; randomize presentation order for any later crossover review.

Shared event collection is optional and off by default. Choose consent at entry before exposure. Local counts remain on the device. Late opt-in does not backfill earlier events, so recruit through the entry page with a consistent consent process. Do not treat local exports as pooled participant results.

## Measures

v2_ab_a_* and v2_ab_b_* contain randomized-arm counts. v2_review_* is excluded. Version 1 prototype data uses different keys and is excluded. No player name, photo, family code or persistent device identifier is sent by the new event adapter. Existing gameplay server functionality is unchanged.

- exposure: once per arm/scope on a browser installation.
- first_completion: first completed build since this experiment was exposed, counted once.
- second_build: at least two build starts in that arm on the browser, counted once. This is a repeat-start proxy, not proof of a deliberate choice after completion.
- ten_minutes: ten foreground minutes in one page lifetime; reloads reset this timer.
- return_visit: any later UTC date after first exposure, counted once. This is not exact D1/D7 retention.
- build_started, build_completed and mascot_pet: total action counts.

Early game events are queued until the adapter initializes. Reviewer links use ?ab=review; randomized entry uses ?ab=random. Production tracking is disabled in both generated experimental arms. Clearing browser storage resets assignment and deduplication. Multiple people on one device share counts; one person using multiple devices can count more than once. Server writes are best effort and not retried or deduplicated by identity.

## Reporting and decision

Set a new EVENTS_KEY on the separate Netlify project. Enter it into the report page; it is sent in the x-admin header and is not stored in local storage. The report also offers a local browser-only view. Server date ranges are capped by the existing API at 120 days.

The report shows raw numerators and denominators, conversion percentages and 95% Wilson intervals for the browser-level measures. It makes no automatic winner declaration. Use the same recruitment period and consent policy; report missing telemetry, device mix and existing progress. Aggregate counts cannot reconstruct individual cohorts, identify exact return intervals or support cohort-adjusted funnels. Conversion rates over a cropped date interval can be distorted when exposure occurred before that interval: use the full experiment window.

Agree the primary measure, baseline rate, minimum useful difference and sample size before recruitment. Do not stop when a favorable result appears. Review crash/performance observations and qualitative ratings alongside completion. The current tests check instrumentation and functional parity, not commercial superiority or child enjoyment.
