# The red brick film (posted 18 Nov 2026, 4:30 pm Bermuda)

- `bloppit-red-brick-wide-25s.mp4`: Steff's own 25-second film (the red brick, Bloppit, the friends, the lighthouse in
  the mist). Checked against the launch rules on 13 Nov. Posted on YouTube (video) and X.
- `bloppit-red-brick-upright-25s.mp4`: the upright version made 18 Nov and approved by Steff: the film uncut across the
  middle of brand blue, the logo above (the word "Bloppit" white, since red on blue was hard to read), "It starts with
  one red brick." below, and the film's own end card filling the screen for the last 3.75 s. Posted on TikTok, the
  YouTube Short, and as a Reel on Instagram and Facebook (Facebook now turns every video into a reel).
- End card kept as "Build it. Grow your world." (Steff, 18 Nov).
- Caption: "It starts with one red brick. Build with Bloppit the otter, meet a friend on every island, and watch your
  world grow. Bloppit: World of Bricks is free on iPhone and iPad, and at bloppit.com. Let's bloppit! #Bloppit
  #WorldOfBricks #BrickBuilding #IndieGame #FamilyGames"

## How it was made

`how-it-was-made/make.py` draws the blue bands and the upright end card (needs the film's end-card frame as `end.png`,
taken at 23 s). Then ffmpeg puts the film at y=656 for the first 510 frames (the film cuts to its card at frame 510)
and the card for 90 frames; both inputs must run at 24 fps (`-framerate 24 -loop 1`), or the film plays short.

## Scheduling from Claude's sandbox

The posts were scheduled in Steff's Chrome. The browser tool uploads at most 3.8 MB a call, so the uploads were 1 Mbps
copies (two-pass x264, AAC 96k, about 3.5 MB each), slightly softer than these files. Meta Business Suite has no file
input on the page until Add video is clicked, and that opens the system picker: patching
`HTMLInputElement.prototype.click` to keep the input in the page instead let the upload go in. X's Schedule failed
twice with "Something went wrong" and worked the third time.
