# Bloppit: App Store listing

Everything to paste into App Store Connect. Character limits are Apple's; counts are checked.
Never mention LEGO or other toy brands anywhere in the listing (Apple rejects other companies' trademarks).

## App information

| Field | Value |
|---|---|
| Name (30) | Bloppit: Brick Puzzle Game |
| Subtitle (30) | Snap it. Bloppit. Build it. |
| Bundle ID | com.bloppit.app |
| SKU | bloppit-ios-1 |
| Primary category | Games (not in the Kids category, see below) |
| Secondary category | Education |
| Content rights | Does not contain, show or access third-party content |
| Privacy policy URL | https://bloppit.com/privacy/ |
| Support URL | https://bloppit.com/ |
| Marketing URL | https://bloppit.com/ |
| Copyright | 2026 Bloppit |
| Price | Free |

**Kids category:** Bloppit is **not** in the Kids category. Leave "Made for Kids" off; the age rating comes from the questionnaire below.
The home-screen name stays **Bloppit** (set by `CFBundleDisplayName` in the iOS project).

## Promotional text (170)

The brick-building puzzle game! Race Bloppit the otter, challenge a friend with a code, and play a new Daily Bloppit puzzle every day.

## Description (4000)

Snap it. Bloppit. Build it.

Bloppit is a brick-building puzzle game. Turn any photo into a puzzle (your cat, a toy, your own drawing) or pick one from the library, then build it brick by brick against the clock, up the levels, or with friends.

BLOPPIT BLITZ
• Race Bloppit the otter: Pup, Splash or Legend Bloppit, each one faster and sharper than the last
• Challenge a friend: build a puzzle as fast as you can, get a 6-letter code, and see if they can beat your time whenever they like
• Or race live, taking turns on your own devices
• Need help? A hint adds 5 seconds, and every brick in the wrong spot adds 1 second

DAILY BLOPPIT
• One new puzzle every day, the same for everyone
• See how your time compares and keep your streak going

TRAILS
• Otter Trail: 14 levels, from a tiny heart to a 364-brick otter
• Brain Trail: 14 different levels, with math puzzles that unlock booklet pages, matched to the player's age
• Earn points and stars for building without help
• Separate profiles, so brothers and sisters each keep their own scores

QUICK BUILD
• Turn your own photos into 3D brick models or flat tile mosaics
• 64 ready-made puzzles in 11 themes
• Every puzzle comes with a full instruction booklet, so you can build it for real too

MADE FOR KIDS AND FAMILIES
• No ads, no in-app purchases, no accounts
• No tracking and no analytics
• Friends join with a code, and the host lets each one in. Chat blocks links, contact details and rude words
• Photos stay on your device unless you share a challenge or room with friends
• Racing Bloppit and the Trails work offline

Bloppit is an independent project and is not affiliated with any toy brick brand.

## Keywords (100)

bricks,build,puzzle,blocks,kids,race,daily,challenge,photo,3D,math,family,otter,brain,game

## What's New (version 1.0)

Bloppit's first App Store release.

(Next version:) Bloppit is now a game first! Race Pup, Splash or Legend Bloppit, send challenge codes to friends, play the new Daily Bloppit, and climb the Otter Trail or the Brain Trail.

## App Review notes

Bloppit is a brick-building puzzle game for children. No account or login is needed.
To try it quickly: on the menu tap vs Bloppit, type a name and tap Start the race (works offline).
Challenges: on the Blitz page tap Make a challenge, build the puzzle, and you get a 6-letter code; type that code
into Got a code? on another device (the website bloppit.com/build works too) to race the same puzzle.
Daily Bloppit: tap the Daily Bloppit banner on the menu. Only the finishing time is sent, with no name.
Rooms (Build together, live Blitz): friends join with a 5-letter code and the host lets them in.
Room chat is typed and filtered (no links, emails, phone numbers or social accounts; rude words hidden). The host can turn on voice chat; each player chooses whether to join it, and audio is never recorded.
Links out of the app and sharing an invite are behind a parental gate (type a number written in words as digits).

## Age rating questionnaire

Answer **None / No** to everything (violence, mature themes, gambling, horror, medical, alcohol, profanity, sexual content,
contests, unrestricted web access). For "user-generated content / messaging and chat": **Yes**. Players can type
filtered messages and voice chat with people in the same room. Rooms are invite-only (a code, and the host lets each
player in), and there is no way to find or message strangers. Answer the questions that way and check the rating
App Store Connect gives: with chat turned on it may come out higher than **4+**.

## App Privacy ("privacy label")

Data used to track you: **No**.

Data collected (only through rooms, Blitz challenges and the Daily Bloppit; rooms are deleted 3 days after their last
activity, challenges 30 days after the last player, daily times after a week):

| Data type | Collected | Linked to the user's identity | Used for tracking | Purpose |
|---|---|---|---|---|
| User Content › Photos or Videos (the photos a shared model is made from) | Yes | No | No | App Functionality |
| User Content › Gameplay Content (bricks placed, scores, Blitz and Daily Bloppit times) | Yes | No | No | App Functionality |
| User Content › Other User Content (player nickname, chat messages) | Yes | No | No | App Functionality |

Everything else (contact info, identifiers, location, usage data, diagnostics, etc.): **Not collected**.

## Screenshots

In `screenshots/`. Upload the `iphone-*` set as the 6.9" iPhone display (1320 × 2868) and the `ipad-*` set as the
13" iPad display (2064 × 2752). App Store Connect scales them down for smaller devices.
`iphone-5-blitz` and `ipad-6-blitz` show Bloppit Blitz; drag them earlier in the order if you want Blitz featured.

## Updating the app

Every push to main that changes the app (`public/build/` or `mobile/`) makes a new Codemagic build, which goes to
TestFlight on its own (see `codemagic.yaml`). Testers get it from there. Each App Store release still needs a
new version number (e.g. 1.1) and Apple's review: in App Store Connect, add the version, pick a TestFlight build
and submit it.

## App icon

1024 × 1024, from `mobile/assets/icon-only.png`. It's already inside the app build, so App Store Connect picks it up.
