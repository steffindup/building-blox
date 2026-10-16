# Bloppit preview experiment v1

## Assignment and isolation

Recruit fresh browser profiles through `/experiment/` on the **new preview site**. A cryptographically random bit assigns A (existing experience) or B (challenger), stored locally as `bloppit-experiment-v1`. Returning profiles keep their arm. Neither participant identifiers nor the random bit are sent separately to a server. The arm is included in an event name. The assignment unit is a browser profile, not a person; shared devices and cleared storage can bias results.

The entry sends players to `?ab=random`. Reviewer links use `?ab=review`; direct visits also count as reviewer traffic. Randomized event names start `ab_a_` or `ab_b_`; reviewer names start `review_a_` or `review_b_`. Never combine them. Assignment entry clicks are diagnostic, not unique participants. Exposure, first completion and second build are deduplicated in localStorage per arm/scope/experiment version. Clearing storage resets deduplication. Do not switch reviewers to randomized testing in the same browser profile: existing progress would bias first-completion eligibility.

Only local counts are stored by default. An adult tester may enable aggregate sharing before entry. Shared payload is `{events:[eventName],p:'web'}` to the preview site's `/api/event`. It carries no names, photos, arbitrary strings, precise timestamps, session IDs or device IDs. The existing server groups counts by day/country/platform. It has an admin key for reads. It is best effort with no offline retry queue; old local events are not backfilled after consent. Opting in late can produce incomplete funnels. Recruit with one consistent consent procedure and analyze only cohorts enrolled with sharing already enabled. Native previews do not send analytics.

## Primary and secondary outcomes

Pre-register before recruiting:

- Primary: `ab_ARM_first_completion / ab_ARM_exposure` for newly enrolled browser profiles over a fixed study window.
- Secondary: `ab_ARM_second_build / ab_ARM_first_completion`, interpreted as return to another build in the available observation window, not retention.
- Run diagnostics: `build_completed / build_started` is a ratio of event counts, **not** a per-player conversion rate. Multiple attempts and exits cross sessions.
- Challenger-only diagnostics: `wrong_piece`, `hint`, `undo`, `mascot_pet`, `world_reveal`, `render_error`. Do not compare these to nonexistent control events.
- Collect enjoyment, mascot appeal, clarity and desire to return with the same questions and scale (1–5), fixed play duration and equivalent device mix. Record who rates first and whether they have seen the other version. Do not infer happiness from pet clicks.

Do not call this a graphics-only test. Models, instruction density, starting flow, mechanics and content breadth differ. To isolate graphics in a later experiment, apply both art systems to the same models, controls, onboarding and rewards before randomization. This iteration tests the first ten minutes of the overall experience. Experienced existing users require a separate cohort; do not mix them with new users.

## Report

On the preview's `/stats/`, use the new site's `EVENTS_KEY`; the existing aggregate report includes the prefixed events. Never paste the production key into the challenger. Download counts or use the authenticated `/api/event?from=YYYY-MM-DD&to=YYYY-MM-DD` response for a fixed date interval. Local event export is available from Playtest notes or the entry page. Local exports are diagnostics, not an automatically merged participant database.

Report raw numerators/denominators, completion and second-build rates, missing telemetry, device/browser split, recruitment channel, study dates, and confidence intervals. Do a sample-size calculation from an agreed baseline rate and minimum meaningful difference before running; do not stop when results happen to look favourable. There are **no real participant results yet**. Browser tests verify instrumentation but are excluded from the hosted dataset.

Retention at D1/D7, cohort-adjusted funnels, latency percentiles and robust duplicate protection are not implemented. They cannot be inferred from these aggregate counts. A future telemetry design must preserve the product's privacy commitments and be reviewed separately before deployment.
