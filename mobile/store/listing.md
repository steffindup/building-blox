# Bloppit: App Store listing

Everything to paste into App Store Connect. Character limits are Apple's; counts are checked.
Never mention LEGO or other toy brands anywhere in the listing (Apple rejects other companies' trademarks).

## App information

| Field | Value |
|---|---|
| Name (30) | Bloppit: Brick Puzzle Game |
| Subtitle (30) | Build it. Grow your world. |
| Bundle ID | com.bloppit.app |
| SKU | bloppit-ios-1 |
| Primary category | Games › Puzzle (not in the Kids category, see below) |
| Secondary category | Games › Family |
| Content rights | Does not contain, show or access third-party content |
| Privacy policy URL | https://bloppit.com/privacy/ |
| Support URL | https://bloppit.com/ |
| Marketing URL | https://bloppit.com/ |
| Copyright | 2026 Bloppit |
| Price | Free |

**Kids category:** Bloppit is **not** in the Kids category. Leave "Made for Kids" off; the age rating comes from the questionnaire below.
No child-audience words ("kids", "children") in the listing text itself: the landing page says 8–13, the listing says "for families".
The home-screen name stays **Bloppit** (set by `CFBundleDisplayName` in the iOS project).

Two listings, from the strategy (v5): **1.0** (submitted Fri 13 Nov) is a puzzle game and says so; the subtitle is the one forward
promise it makes. **1.1** (by Mon 7 Dec) adds the island and the pup. Paste the column for the version being submitted.

## Promotional text (170)

**1.0:** A calm brick puzzle game for families. Finish a model in minutes, scored on how cleanly you build. A new puzzle every week. Free, no ads, no account.

**1.1:** Every build you finish grows your own world of islands, and your otter grows with you. A new puzzle every week. Free, no ads, no account.

## Description (4000)

### 1.0

Bloppit is a calm brick puzzle game for families. Snap bricks together on screen, page by page, and finish a model in minutes, scored on how cleanly you build.

A new puzzle every week, a library to explore, and Blitz races against the Longtails.

Free, no ads, no tracking, no account needed.

WEEKLY BLOPPIT
• One new puzzle every Monday, the same for everyone
• Build it clean, with no misses and no hints, and see how many builders did too
• Keep your streak going, one week at a time

FINISH CLEAN, EARN STARS
• Every build earns a star for finishing, one for no hints and one for a clean build
• Your best stars on each model are kept, so you can always come back for the third
• Build from memory, with the booklet hidden, for a bonus star

TRAILS
• Otter Trail: 14 levels, from a tiny heart to a 364-brick otter
• Brain Trail: 14 different levels with math puzzles matched to the player's age
• Separate players on one device, each with their own progress

THE LIBRARY
• More than 70 models in 11 themes, each with a full instruction booklet you can build from for real
• Turn a photo on your device into a brick picture; it never leaves the device

BLOPPIT BLITZ
• Race the Longtails: Scraps, Swoop or Squint, each sharper than the last
• Race a friend live, or send a 6-letter challenge code so they can try to beat your time later
• Build one model together in a room: friends join with a code and the host lets each one in

MADE FOR FAMILIES
• No ads, no in-app purchases, no accounts, no tracking
• No chat and no voice anywhere in Bloppit; players in a room only place bricks
• Progress is saved under an anonymous code, and a grown-up can move it to another device
• Racing the Longtails, the Trails and the library work offline

Bloppit is an independent project and is not affiliated with any toy brick brand.

### 1.1 (adds the island)

Bloppit is a calm brick puzzle game for families. Snap bricks together on screen, page by page, and finish a model in minutes, scored on how cleanly you build.

Every build you finish grows your own world. A little otter arrives by boat, your first build finishes its home, and five islands wait in the mist.

A new puzzle every week, a library to explore, and Blitz races against the Longtails.

Free, no ads, no tracking, no account needed.

YOUR WORLD: BLOPPITOPIA
• Home Island grows with every build: a cottage, a garden, a workshop, a museum of your best models, then a lively village
• Five islands rise from the mist as you play: Otterwood (Otter Trail), Brainpeak (Brain Trail), Sunrise Shores (Weekly Bloppit), Blitz Bay (Blitz) and Brickworks Island (your own creations)
• Your otter grows with you, Pup, Splash, Legend, and earns outfits; you pick the colours
• Build Stars buy decorations. Nothing is ever for sale, and nothing is ever lost

(then the 1.0 sections from WEEKLY BLOPPIT down, unchanged)

## Keywords (100)

**1.0:** blocks,building,bricks,construction,puzzle,family,calm,race,weekly,otter,model,booklet

**1.1:** blocks,building,bricks,construction,puzzle,family,calm,race,island,world,adventure,otter

## Screenshots

In `screenshots/`: six per device in the 1.1 order, captioned, ready to upload. `iphone-*` for the 6.9" iPhone display
(1320 × 2868) and `ipad-*` for the 13" iPad display (2064 × 2752); App Store Connect scales them for smaller devices.

| # | Caption (1.1) | Screen |
|---|---|---|
| 1 | Every build you finish grows Bloppitopia. | Bloppitopia at the Village stage with the pup |
| 2 | Snap bricks into place, page by page. | A build in progress with Bloppit |
| 3 | Finish clean. Earn three stars. | The first-finish card: stars, the pup, Play Next |
| 4 | A new puzzle every week. See how many built it clean. | The Weekly page |
| 5 | Race the Longtails in Blitz. | A race against Squint |
| 6 | Your pup grows with every build. | The menu with the pup card |

For a 1.0 submission without the island, drop #1 and #6 and lead with #2. They are regenerated by the capture script
(`tests/store-screens.mjs` against `npm run dev`: headless Chromium at device scale, then captions composed with Lilita One);
retake them after any visual change. Preview video: capture the snap, a finish and a Longtail race in the simulator, ending on the island.

## What's New

**1.0:** Bloppit's first App Store release.

**1.1:** Bloppitopia! Every build you finish grows your world: Home Island and five islands to discover. Your otter grows with you and earns outfits. Build Stars buy decorations. Plus the From Memory star and four new Weeklies.

## App Review notes

Bloppit is a brick-building puzzle game for children. No account or login is needed.
To try it quickly: on the menu tap the yellow Start here card for a guided six-brick build; tap the faded brick to place each piece. Then on the menu tap Blitz → vs the Longtails, type a name and tap Start the race (works offline).
Challenges: on the Blitz page tap Make a challenge, build the puzzle, and you get a 6-letter code; type that code
into Got a code? on another device (the website bloppit.com/build works too) to race the same puzzle.
Weekly Bloppit: tap the Weekly Bloppit banner on the menu. Only a finish and whether it was clean are sent (two counts per week, no name, no time). Deleted after 8 weeks.
Progress (scores, finished models, stars, the pup's name as a number from a fixed list) is saved under an anonymous pup code minted by our server; nothing typed by a child is sent. Grown-ups corner (behind the parental gate) shows the transfer code and the Family Link QR, and can delete the record.
Rooms (Build together, live Blitz): friends join with a 5-letter code and the host lets them in. Players appear under generated labels ("Brave Otter 214"); typed names never leave the device. Relays: one friend builds half a model, the other finishes it from a code. Crews (Together page): a shared lighthouse goal for an approved group; the maker lets each member in; the board only takes fixed phrases and stickers under generated names; report on every post; parents can remove a player from any crew in the Grown-ups corner.
There is no chat and no voice: players in a room only place bricks.
Links out of the app and sharing an invite are behind a parental gate (type a number written in words as digits).

## Age rating questionnaire

Answer **None / No** to everything (violence, mature themes, gambling, horror, medical, alcohol, profanity, sexual content,
contests, unrestricted web access). For "user-generated content / messaging and chat": **No**. There is no typed chat and no voice anywhere in the app; crews can
only exchange phrases and stickers from a fixed list, under generated names, with a report button on every post. Rooms are invite-only (a code, and
the host lets each player in), and there is no way to find or message strangers. The rating should come out at **4+**.

## App Privacy ("privacy label")

Data used to track you: **No**.

Data collected (only through rooms, Blitz challenges, the Weekly Bloppit and the pup save; rooms are deleted 3 days after their last
activity, challenges 30 days after the last player, daily times after a week):

| Data type | Collected | Linked to the user's identity | Used for tracking | Purpose |
|---|---|---|---|---|
| User Content › Photos or Videos (the photos a shared model is made from) | Yes | No | No | App Functionality |
| User Content › Gameplay Content (bricks placed, scores, Blitz times, Weekly Bloppit finishes, finished models, stars, XP, island decorations, pup save) | Yes | No | No | App Functionality |

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
