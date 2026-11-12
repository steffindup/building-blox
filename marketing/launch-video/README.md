# Launch video (locked 12 Nov 2026)

`bloppit-launch-upright-25s.mp4` (1080x1920: TikTok, Reels, Shorts) and `bloppit-launch-wide-25s.mp4`
(1920x1080: X, Facebook, YouTube). 24.6 s, 30 fps. Steff approved both on 12 Nov 2026.

Scenes: the arrival film with "Meet Bloppit." (5 s); the heart build, "Snap bricks together." (4 s); the first
garden, "Every build grows your world." (6.6 s); a pull-back over the finished Bloppitopia, "A whole world to
grow." (5 s); the end card with "Out now on iPhone and iPad" and bloppit.com (4 s).

Steff's decisions for the pull-back: Moonstone Isle stays in the mist with a pulsing lavender glow and no label;
no mention of lufu anywhere (no "Sail to lufu's world", no "Mystery Island" line); every model on the islands is a
real brick model (the game keeps only the newest 40 shapes, so `world.mjs` keeps them all and seeds builds the
game can rebuild: trail levels and Weeklies). Sound: the game music only, from the first second; no brick sounds
(Steff: they did not work). The music is the How to Play soundtrack with the brick sounds cut out at the pauses
between phrases (0–11.7 s, 13.15–23.45 s, 41.87 s to the end).

How it was made (scripts as they ran in a scratch folder, kept for reference; paths need adjusting):
`world.mjs` records the pull-back frame by frame (uses `reclib.mjs` and `base.mjs`, as `tests/howto/`);
`launchcards.mjs` / `launchcards-wide.mjs` draw the caption backgrounds and end cards; `launch.py` /
`launch-wide.py` assemble the frames (the build and garden footage are frames 762–881 and 990–1187 of the How to
Play recording).
