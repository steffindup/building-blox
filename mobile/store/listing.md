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

**1.0 is the full game, Bloppitopia included** (decided 18 Oct 2026). The old plan of a puzzle-only 1.0 followed by 1.1
with the island is dropped: everything below is the one listing to paste.

## Promotional text (170)

Every build you finish grows your own world of islands, and your otter grows with you. A new puzzle every week. Free, no ads, no account.

## Description (4000)

Bloppit is a calm brick puzzle game for families. Snap bricks together on screen, page by page, and finish a model in minutes, scored on how cleanly you build.

Every build you finish grows your own world. A little otter arrives by boat, your first build finishes its home, and five islands wait in the mist.

A new puzzle every week, a library to explore, and Blitz races against the Longtails.

Free, no ads, no tracking, no account needed.

YOUR WORLD: BLOPPITOPIA
• Home Island grows with every build: a cottage, a garden, a workshop, a museum of your best models, then a lively village
• Five islands rise from the mist as you play: Otterwood (Otter Trail), Brainpeak (Brain Trail), Sunrise Shores (Weekly Bloppit), Blitz Bay (Blitz) and Brickworks Island (your own creations)
• Your otter grows with you, Pup, Splash, Legend, and earns outfits; you pick the colours
• Build Stars buy decorations. Nothing is ever for sale, and nothing is ever lost

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
• About 60 models in 10 themes, plus a new one every week, each with a full instruction booklet you can build from for real
• Draw your own brick picture on a stud grid, or turn a photo on your device into one; the photo never leaves the device

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

## Keywords (100)

blocks,building,bricks,construction,puzzle,family,calm,race,island,world,adventure,otter

## Screenshots

In `screenshots/`: seven per device, captioned, ready to upload in this order. `iphone-*` for the 6.9" iPhone display
(1320 × 2868) and `ipad-*` for the 13" iPad display (2064 × 2752); App Store Connect scales them for smaller devices.

| # | File | Caption | Screen |
|---|---|---|---|
| 1 | `*-1-island` | Every build you finish grows Bloppitopia. | Bloppitopia: Home Island with the otter, Bloppit and the islands found so far |
| 2 | `*-2-arrival` | A little otter is coming home. | The arrival film: the boat with the pup, Bloppit waiting on the jetty |
| 3 | `*-3-build` | Snap bricks into place, page by page. | A build in progress with Bloppit |
| 4 | `*-4-finish` | Finish clean. Earn three stars. | The finish card: stars, See Bloppitopia, Play next |
| 5 | `*-5-weekly` | A new puzzle every week. See how many built it clean. | The Weekly page |
| 6 | `*-6-blitz` | Race the Longtails in Blitz. | A race against Squint |
| 7 | `*-7-menu` | Your otter grows with every build. | The menu with the Bloppitopia card |

They are regenerated by the capture script (`tests/store-screens.mjs` against `npm run dev`: headless Chromium at device
scale, then captions composed with Lilita One); retake them after any visual change.

## App previews (optional, up to 3 per device)

`previews/iphone-arrival.mp4` (886 × 1920) and `previews/ipad-arrival.mp4` (1200 × 1600): the first-arrival film, 21.6 s,
30 fps, H.264 with stereo AAC. Apple's limits: 15–30 s, at most 30 fps, footage from the app. Set the poster frame to
the moment the title appears (about 4 s in).

## What's New

Not asked for on a first version. For the first update, write what changed in a line or two.

## App Review notes

Bloppit is a brick-building puzzle game for children. No account or login is needed.
To try it quickly: on the menu tap the Start here card. A short film shows the otter arriving by boat (Skip at the top
right ends it). Name the otter or pick a name, then tap Build Our First Home and tap the faded brick to place each piece of
the 12-brick house; the home then appears on the island. Then on the menu tap Blitz → vs the Longtails, type a name and tap
Start the race (works offline).
Challenges: on the Blitz page tap Make a challenge, build the puzzle, and you get a 6-letter code; type that code
into Got a code? on another device (the website bloppit.com/build works too) to race the same puzzle.
Weekly Bloppit: tap the Weekly Bloppit banner on the menu. Only a finish and whether it was clean are counted (two counts per week, no name); the time and misses are sent only to check it's a real finish and aren't kept. Counts are deleted after 8 weeks.
Progress (scores, finished models, stars, outfits, the otter's name as a number from a fixed list) is saved under an anonymous progress code minted by our server. A name the child types for the otter stays on the device and is never sent. Grown-ups corner (behind the parental gate) shows the transfer code and the Family Link QR, and can delete the record.
Usage counts: the app adds one to a daily count for a few events (a build started or finished, the arrival seen) with the country from the request and whether it was the app or the website. There is no identifier for the player or the device, and nothing is shared with anyone.
Rooms (Build together, live Blitz): friends join with a 5-letter code and the host lets them in. Players appear under generated labels ("Brave Otter 214"); typed names never leave the device. Relays: one friend builds half a model, the other finishes it from a code. Crews (Together page): a shared lighthouse goal for an approved group; the maker lets each member in; the board only takes fixed phrases and stickers under generated names; report on every post; parents can remove a player from any crew in the Grown-ups corner.
There is no chat and no voice: players in a room only place bricks.
Links out of the app and sharing an invite are behind a parental gate (type a number written in words as digits).

## Age rating questionnaire

Apple's questionnaire now has three parts; required for every new submission from September 2026.

**In-app controls and capabilities** (all of these sit at 4+; only social media and unrestricted web access raise it):
- Parental controls: **Yes** (the Grown-ups corner, behind the parental gate: delete progress, remove a player from a crew)
- Age assurance: **No**
- Unrestricted web access: **No** (the few links out open fixed pages, behind the parental gate)
- User-generated content: **Yes** (crews exchange fixed phrases and stickers; drawings and photo builds can be shared by code)
- Messaging and chat: **Yes**, to be safe (crew phrases are fixed, from a list; there is no typed chat and no voice)
- Advertising: **No**
- Social media: **No** (no feed or discovery of other people's content; rooms and crews are invite-only)

**Content:** None for everything (violence, mature themes, profanity, horror, medical, alcohol and drugs, sexual content,
gambling, loot boxes, contests).

**Age categories:** Not Applicable (not Made for Kids). The rating should come out at **4+**.

## App Privacy ("privacy label")

Data used to track you: **No**.

Data collected (only through rooms, Blitz challenges, crews, the Weekly Bloppit, the progress save and the usage counts; rooms are
deleted 3 days after their last activity, challenges 30 days after the last player, Weekly counts after 8 weeks):

| Data type | Collected | Linked to the user's identity | Used for tracking | Purpose |
|---|---|---|---|---|
| User Content › Photos or Videos (the photos a shared model is made from) | Yes | No | No | App Functionality |
| User Content › Gameplay Content (bricks placed, scores, Blitz times, Weekly Bloppit finishes, finished models, stars, XP, outfits, island decorations, shared drawings, crew phrases and stickers, progress save) | Yes | No | No | App Functionality |
| Usage Data › Product Interaction (daily counts of a few events, by country and app/website; no identifier) | Yes | No | No | Analytics |

Everything else (contact info, identifiers, location, diagnostics, etc.): **Not collected**.

## Updating the app

Every push to main that changes the app (`public/build/` or `mobile/`) makes a new Codemagic build, which goes to
TestFlight on its own (see `codemagic.yaml`). Testers get it from there. Each App Store release still needs a
new version number (e.g. 1.1) and Apple's review: in App Store Connect, add the version, pick a TestFlight build
and submit it.

## App icon

1024 × 1024, from `mobile/assets/icon-only.png`. It's already inside the app build, so App Store Connect picks it up.
