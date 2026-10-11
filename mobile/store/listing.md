# Bloppit: App Store listing

Everything to paste into App Store Connect. Character limits are Apple's; counts are checked.
Never mention LEGO or other toy brands anywhere in the listing (Apple rejects other companies' trademarks).

## App information

| Field | Value |
|---|---|
| Name (30) | Bloppit: Photo to Bricks |
| Subtitle (30) | Snap it. Bloppit. Build it. |
| Bundle ID | com.bloppit.app |
| SKU | bloppit-ios-1 |
| Primary category | Games, with Kids category (see below) |
| Secondary category | Education |
| Content rights | Does not contain, show or access third-party content |
| Privacy policy URL | https://bloppit.com/privacy/ |
| Support URL | https://bloppit.com/ |
| Marketing URL | https://bloppit.com/ |
| Copyright | 2026 Bloppit |
| Price | Free |

**Kids category:** turn on "Made for Kids" and choose the age band **Ages 6–8** (or 9–11 if you'd rather aim older).
Kids apps must not have third-party ads or analytics (Bloppit has none) and links out need a parental gate (done).

## Promotional text (170)

Turn any photo into a brick model with its own step-by-step instruction booklet, then build it yourself on screen. New: Bloppit Blitz, a race against the clock!

## Description (4000)

Snap it. Bloppit. Build it.

Take a photo of anything: your cat, a toy, a sailboat, your own drawing. Bloppit turns it into a 3D brick model and makes a step-by-step instruction booklet, just like the ones in a real brick set. Then you build it yourself, brick by brick.

BUILD IT YOURSELF
• Open the parts box, pick up the right bricks and snap them into place
• Bloppit the otter cheers you on and shows what you need for each step
• Stuck? Ask for a hint, or let Bloppit place one for you
• Turn and zoom the model with your fingers

YOUR OWN INSTRUCTION BOOKLET
• Every model comes with a full booklet: numbered steps, bricks for each step and a parts list
• Choose how tall the model is and how many colours it uses
• Picture mode turns a photo into a flat tile mosaic, like a brick-art portrait

PLAY THE GAME
• 14 levels, from a tiny heart to a 364-brick otter
• Earn points and stars for building without help
• Math challenge: booklet pages unlock with math puzzles that match the player's age
• Separate profiles, so brothers and sisters each keep their own scores

PLAY TOGETHER
• Build one model together on different iPhones, iPads and computers
• Take turns placing a few bricks each and watch the model grow
• Bloppit Blitz: race the clock against Bloppit the otter (Easy, Medium or Hard) or your friends! Everyone places the same number of bricks, 1 to 3 a turn, and the quickest builder wins
• Chat with friendly quick messages

MADE FOR KIDS AND FAMILIES
• No ads, no in-app purchases, no accounts
• No tracking and no analytics
• Photos stay on your device (Play together shares the model only with players in your room)
• Works offline, apart from Play together

Bloppit is an independent project and is not affiliated with any toy brick brand.

## Keywords (100)

bricks,build,building,blocks,kids,photo,model,instructions,3D,mosaic,math,family,creative,otter,toy

## What's New (version 1.0)

Bloppit's first App Store release.

## App Review notes

Bloppit turns a photo into a brick model and instruction booklet that children build on screen.
No account or login is needed. To try it quickly: tap Photos & model, pick Cat from the library, then tap Build.
Play together: tap Play together, type a name, Create room; a second device can join with the room code
(the website bloppit.com/build works as the second player). Chat in the app is preset quick messages only.
Links out of the app and sharing an invite are behind a parental gate (type a number written in words as digits).

## Age rating questionnaire

Answer **None / No** to everything (violence, mature themes, gambling, horror, medical, alcohol, profanity, sexual content,
contests, unrestricted web access). For "user-generated content / communication between users": there is
communication between users only through preset quick messages and player nicknames in Play together rooms;
answer the questions that way. Expected rating: **4+**.

## App Privacy ("privacy label")

Data used to track you: **No**.

Data collected (only through Play together, kept on the server until 3 days after the room's last activity):

| Data type | Collected | Linked to the user's identity | Used for tracking | Purpose |
|---|---|---|---|---|
| User Content › Photos or Videos (the photos a shared model is made from) | Yes | No | No | App Functionality |
| User Content › Gameplay Content (bricks placed, scores, Blitz times) | Yes | No | No | App Functionality |
| User Content › Other User Content (player nickname, quick messages) | Yes | No | No | App Functionality |

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
