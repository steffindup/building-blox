# Submitting 1.0 (Fri 13 Nov 2026)

The order of work, so nothing is discovered on the day. Each line is done when it is ticked in the PR that closes it.

## The week before (by Mon 9 Nov)

- [ ] `main` is what ships: the Lite PRs (#3 world, #4 island, #5 share links, #6 Weeklies) merged and live on bloppit.com for a week.
- [ ] Version: `MARKETING_VERSION = 1.0`, `CURRENT_PROJECT_VERSION` bumped to the TestFlight build being submitted (`mobile/ios/App/App.xcodeproj`).
- [ ] Codemagic build from `main` is in TestFlight and has been played on an iPad and an iPhone: first session, a Weekly, a Longtail race, the island, Grown-ups corner (gate, transfer code, Family Link QR).
- [ ] Offline check on the iPad (aeroplane mode): the first session, a library build and a Longtail race work; the Weekly says it can't be counted and still saves.
- [ ] Screenshots captured on the simulator at 1320 × 2868 (6.9" iPhone) and 2064 × 2752 (13" iPad), in the 1.0 order from `listing.md`, into `mobile/store/screenshots/`.
- [ ] Preview video (optional for 1.0): 15–30 s of the snap, a finish and a Longtail race, portrait, no sound required.

## App Store Connect (Tue 10 – Thu 12 Nov)

- [ ] App information: name, subtitle, categories, URLs, copyright from `listing.md`. Not in the Kids category; "Made for Kids" off.
- [ ] Age rating questionnaire answered as in `listing.md` (all None/No; no user-generated content or messaging). Expect 4+.
- [ ] App Privacy label: three User Content rows, nothing linked to identity, no tracking. Matches `/privacy/`.
- [ ] 1.0 promotional text, description, keywords, What's New pasted from `listing.md` (the 1.0 column).
- [ ] App Review notes pasted; a reviewer can reach everything without an account. Mention the parental gate (a number in words, typed as digits).
- [ ] Export compliance: uses standard HTTPS only, no custom encryption.
- [ ] Content rights: no third-party content.
- [ ] Build selected (the TestFlight build above). Release: manually after approval (so the landing page and the Nov posts can switch on the same day).

## Submit (Fri 13 Nov)

- [ ] Submit for review before noon Bermuda time.
- [ ] If rejected: the usual asks are the privacy label, a login the reviewer couldn't find (there is none; say so), or Guideline 1.3 (kids). Reply with the review notes; nothing in 1.0 needs a code change for these.

## On release

- [ ] Landing page: add "Get the app" for iOS visitors with "or play in your browser" beneath (`public/index.html`, hero actions).
- [ ] `mobile/README.md` and `listing.md`: note the live version and date.
- [ ] Nov plan W1 posts go out with bloppit.com/go/… links (the app link comes second; strangers always get bloppit.com).

## Then 1.1 (by Mon 7 Dec)

- [ ] Paste the 1.1 column from `listing.md`; the island screenshot first.
- [ ] Refile the featuring nomination with the island as the story.
