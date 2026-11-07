# Bloppit on Google Play

The Android app is the same game as the iPhone app (Capacitor, `mobile/android`), package **com.bloppit.app**.
Codemagic builds it ("Android for Google Play" in `codemagic.yaml`); Steff does the Play Console steps.

## The order of things

1. **Developer account** (Steff): [play.google.com/console](https://play.google.com/console), one-off US$25, identity
   check. A **personal** account is quickest. (An organisation account skips the tester rule below but needs a D-U-N-S
   number, so it waits for the Bermuda company.)
2. **Signing key into Codemagic** (Steff): Codemagic > Team settings > codemagic.yaml settings > Code signing identities >
   Android keystores > upload `bloppit-upload.jks`; keystore password and key password are the same (kept in your
   password manager), key alias `upload`, reference name **bloppit_upload**. Keep the .jks file and the password safe:
   Google signs the app with its own key (Play App Signing), this one only proves an upload is yours. If it's ever lost,
   Google can reset it.
3. **First build** (Steff): Codemagic > Bloppit > Start new build > "Android for Google Play". The success email has the
   `.aab` (link valid 24 h).
4. **Create the app in Play Console** (Steff): name "Bloppit: World of Bricks", Game, Free. Fill in the forms below.
   Turn on Play App Signing (the default).
5. **Closed test, 12 testers for 14 days** (Steff): Testing > Closed testing > create a track, add testers (an email list or
   a Google Group), upload the `.aab` by hand (Google wants the first upload by hand), roll out. Each tester opens the
   opt-in link, installs Bloppit from Google Play and keeps it installed. After **at least 12 testers have been opted in for
   14 days in a row**, Play Console lets you apply for production (Dashboard > "Apply for production"), then review.
6. **Automatic uploads** (later, Claude can do it): a Google Cloud service account with access to the app, its JSON key in a
   Codemagic environment group `google_play`, then switch on the commented `triggering` and `google_play` blocks in
   `codemagic.yaml`, so every app change goes to the closed test track like TestFlight.

## Store listing

**App name (30):**
```
Bloppit: World of Bricks
```

**Short description (80):** 80 characters
```
Build with Bloppit the otter, raise your pup and grow your own world of islands.
```

**Full description (4000):** the App Store description in `listing.md`, as is (nothing in it is iPhone-only).

**Category:** Game › Puzzle. **Tags:** Puzzle, Building, Family, Casual (pick from Play's list).
**Contact:** hello@bloppit.com. **Website:** https://bloppit.com. **Privacy policy:** https://bloppit.com/privacy/

**Images** (`mobile/store/google-play/`, made by `python3 mobile/scripts/play-assets.py`):

| Slot | Files | Size |
|---|---|---|
| App icon | `icon-512.png` | 512 × 512 |
| Feature graphic | `feature-graphic.png` | 1024 × 500 |
| Phone screenshots | `phone-1-island.png` … `phone-7-menu.png` | 1434 × 2868 (2:1, Play's limit) |
| 7-inch and 10-inch tablet screenshots | `tablet-1-island.png` … `tablet-7-menu.png` | 2064 × 2752 |

The phone screenshots are the iPhone ones with a little more brand blue at the sides, so they stay within Play's 2:1.

## App content (Policy › App content)

- **Privacy policy:** https://bloppit.com/privacy/ (covers the Android app since 6 Nov 2026).
- **Ads:** No, the app has no ads.
- **App access:** All functionality is available without special access (no login).
- **Target audience and content:** Bloppit is made for 8–13 and for anyone who loves bricks. Choosing any age group under 13
  puts the app under Google Play's **Families policy**, which fits how Bloppit is built (no ads, no accounts, no tracking,
  no chat, parental gate on links out). Suggested: 9–12, 13–15, 16–17, 18 and over (Steff to choose). The app doesn't
  unintentionally appeal to children; it's meant to.
- **Content rating (IARC questionnaire):** Category: Game. No violence, fear, sexuality, language, drugs, gambling or
  crude humour. Users interact: **Yes**, players in rooms place bricks together, and crews post fixed phrases and stickers
  only (no free text, no voice). Shares location: No. Digital purchases: No. Expected rating: Everyone / PEGI 3.
- **Data safety** (same facts as the App Store privacy label in `listing.md`):
  - Does the app collect or share user data? **Yes, collects; no sharing.**
  - Encrypted in transit: **Yes** (HTTPS). Users can ask for deletion: **Yes** (Grown-ups corner > delete the record, or
    hello@bloppit.com).
  - **Photos and videos › Photos:** collected, optional (only when a model made from photos is shared), not shared,
    purpose App functionality.
  - **App activity › Other user-generated content:** collected (bricks placed, scores, Blitz times, Weekly finishes,
    finished models, stars, outfits, decorations, shared drawings, crew phrases and stickers, the progress save under an
    anonymous code), not shared, purpose App functionality.
  - **App activity › App interactions:** collected (daily counts of a few events by country and app/website; no
    identifier), not shared, purpose Analytics.
  - Everything else (location, personal info, contacts, device or other IDs, diagnostics): **not collected**.
- **Government app / financial / health / news:** No to all.

## Android-specific notes

- The back button: skips a playing film, then closes the top card, then goes to the menu; on the menu it puts the app in
  the background (`appBack()` in `public/game/index.html`).
- Films and the launch sound play without a tap (`MainActivity` turns off the WebView's user-gesture rule, as the iOS
  app does).
- Launcher icon: the bust on brand blue as an adaptive icon (`mobile/scripts/android-icons.py`); Android 12+ shows it on
  blue at launch, older phones show the whole otter (`drawable/splash`). Regenerate with `npm run icons:android` in `mobile/`.
- Size: the app carries about 150 MB (mostly films). Google Play's limit for the base download is 200 MB; more films
  (Chapter 2) will need Play Asset Delivery or streaming, as the full Moonstone film already streams.
- Version: `versionName` is 1.1 (set in `codemagic.yaml`, keep in step with iOS); `versionCode` is Codemagic's build number.
