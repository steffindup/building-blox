# Submitting 1.0 (the full game, week of 19 Oct 2026)

Decided 18 Oct 2026: 1.0 is the full game with Bloppitopia, submitted now. The old plan (a puzzle-only 1.0 on 13 Nov,
then 1.1 with the island) is dropped. Everything to paste is in `listing.md`.

## Before submitting

- [x] `main` is what ships, live on bloppit.com.
- [x] Codemagic → TestFlight works (every build since Codemagic #89). Build **1.0 (86)** has the 20 s arrival film.
- [x] Played on an iPhone and an iPad from TestFlight (18 Oct).
- [ ] Offline check on the iPad (aeroplane mode): the first session, a library build and a Longtail race work; the Weekly says it can't be counted and still saves.
- [x] Screenshots in `screenshots/` (seven per device, in the order in `listing.md`).
- [x] App previews in `previews/` (optional): the arrival film at 886 × 1920 and 1200 × 1600 (replaced 27 Oct by the new 30 s arrival film, which the app plays from 1.1).

## App Store Connect

- [ ] App information: name, subtitle, categories, URLs, copyright from `listing.md`. "Made for Kids" off.
- [ ] Age rating: the new questionnaire as in `listing.md` (capabilities, content, age category). Expect 4+.
- [ ] App Privacy label: the three rows in `listing.md` (two User Content, one Usage Data), nothing linked to identity, no tracking. Matches `/privacy/`.
- [ ] Promotional text, description, keywords from `listing.md`.
- [ ] Screenshots (both devices) and, if wanted, the app previews; poster frame about 4 s in.
- [ ] App Review notes pasted. A reviewer reaches everything without an account; the parental gate is a number in words, typed as digits.
- [ ] Export compliance: standard HTTPS only (already declared in the build: `ITSAppUsesNonExemptEncryption` = NO).
- [ ] Content rights: no third-party content.
- [ ] Build: 1.0 (86) or newer. Release: **manually** after approval, so the landing page and the first posts go out on the same day.
- [ ] Submit for review.

If rejected, the usual asks are the privacy label, a login the reviewer couldn't find (there is none; say so), or
Guideline 1.3 (apps for children). Reply with the review notes; most need no code change.

## On release

- [ ] Release the version in App Store Connect.
- [ ] Landing page: add "Get the app" for iOS visitors with "or play in your browser" beneath (`public/index.html`, hero actions).
- [ ] `mobile/README.md` and `listing.md`: note the live version and date.
- [ ] November posts go out with bloppit.com/go/… links (the app link comes second; strangers always get bloppit.com).
