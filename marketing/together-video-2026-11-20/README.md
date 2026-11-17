# Play with Friends video (Friday 20 November 2026)

Approved by Steff on 17 Nov 2026 (draft 3). 19 seconds, 30 pictures a second, music only (the launch video's track).

- `bloppit-together-upright.mp4` (1080×1920): TikTok, Instagram Reel, YouTube Short, Facebook Reel
- `bloppit-together-wide.mp4` (1920×1080): X and Facebook

## What it shows

1. Two shots from the island films (Bloppit and Swoop with the photo, Bloppit and Tiny on the lily pads): "Build it
   together this Thanksgiving." In the upright version each shot pans from one friend to the other.
2. Two phones: one opens a Team Build room and shows its code, the other types the code and knocks: "Open a room. Share
   the code."
3. Two phones building the Toadstool (18 bricks, 3 a turn) in turns, one picture per brick, ending on "Toadstool: built
   together!": "Take turns on the same puzzle."
4. The end card: Bloppit, the logo, "Build it. Grow your world.", "Free on iPhone and iPad", bloppit.com.

## Steff's decisions (17 Nov 2026)

- The toadstool, not the duck (the duck is all yellow).
- **No turkey teaser**: the video is about playing together only. The turkey gets its own short clip on Monday 23 Nov.
- The captions must not mention the turkey either, and leave out "no chat" (he doesn't see it as a selling point).

## How it was made (`how-it-was-made/`)

The scripts ran from the repo's top folder with files in `/home/claude/pwf`; the paths inside them need changing to run
again.

- `cap.mjs`: opens the game on a phone-sized screen (393×851, the site's real fonts) against the test server.
- `flow.mjs`: plays a whole Team Build on two phones and takes a picture of both after every brick. The room screen says
  `localhost`; the script swaps in `bloppit.com`, which is what the real site shows.
- `compose.py upright|wide out.mp4`: puts the scenes together (film frames cut with ffmpeg, the phone pictures in white
  frames on brand blue, lettering in Lilita One) and adds the music.
- `carousel.py`: the six carousel images, plain and with their lines.
- `weekly-strip.mjs`: not part of the video. It builds a Weekly in preview and captures the picture, step 1, halfway,
  before the last piece and finished, for the review strips (`WEEKS=2026-12-14,2026-12-21`). `turkey.mjs` is the same
  for the turkey with and without its tail.
