# Submitting 1.1 (the version to market, Nov 2026)

1.0 went live on 6 Nov 2026 (a quiet soft launch, all 175 countries). 1.1 brings everything since the 1.0 build to the
app: the films and My films, the friends on every island, the Moonstone story, Pippa's mirror puzzles, the 20-race Blitz
Bay, Galaxy Blocks, the new menu and Quick play. Everything to paste is in `listing.md`.

## Before submitting

- [x] App version is 1.1 (`MARKETING_VERSION`, since #89); every push to main that changes the app builds 1.1 (N) to TestFlight.
- [ ] The build to submit: the newest 1.1 build **after** #197 (all five Midway films). Check Codemagic for it; the last
      email on 6 Nov was 1.1 (175) at 01:29, before the Midway films (#196, #197).
- [ ] Play that build on an iPhone and an iPad from TestFlight: first visit (name → arrival film → first home), a Trail
      level, a race against Swoop, My films.
- [ ] Offline check (aeroplane mode): the first session, a library build, a race against Swoop; the films play offline
      (built into the app) except the full Moonstone Story.
- [x] Screenshots in `screenshots/`, retaken from the 1.1 game (seven per device, order in `listing.md`).
- [x] App previews in `previews/`: the arrival film, iPhone 886 × 1920 and iPad 1200 × 1600.

## App Store Connect

- [ ] **+ Version** (iOS) → 1.1.
- [ ] What's New: from `listing.md`.
- [ ] Promotional text, description, keywords: from `listing.md` (promotional text can also change any time without review).
- [ ] Screenshots: replace all seven on both devices (6.9" iPhone, 13" iPad).
- [ ] App previews: upload both; poster frame about 7 s in (Bloppit with his red brick on the jetty).
- [ ] App Review notes: from `listing.md` (the 1.1 first visit: name first, then the film).
- [ ] Age rating and App Privacy: unchanged from 1.0 (nothing new is collected). Check they still read as in `listing.md`.
- [ ] Build: the 1.1 build chosen above. Export compliance as before (`ITSAppUsesNonExemptEncryption` = NO).
- [ ] Release: **manually**, so the launch posts and the landing page go out on the same day.
- [ ] Submit for review.

## On release

- [ ] Release 1.1 in App Store Connect.
- [ ] Landing page: "Get the app" for iOS visitors, with "or play in your browser" beneath (`public/index.html`, hero actions).
- [ ] `mobile/README.md` and `listing.md`: note the live version and date.
- [ ] Launch posts with bloppit.com/go/… links.
