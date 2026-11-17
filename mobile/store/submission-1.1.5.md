# 1.1.5 (started 16 Nov 2026)

The repo moved to 1.1.5 on 16 Nov 2026, while 1.1.4 (build 224) waits for Steff to press Add for Review. Builds made
from now on are 1.1.5 builds; build 224 is untouched. If 1.1.4 needs a repair before it is approved, the repair ships
as 1.1.5.

What 1.1.5 carries so far (live on bloppit.com from the day of each change):

- Remove player (16 Nov 2026): the only player on a device can be removed too. The device then starts again as on a
  first visit, with a new "Player 1" who meets their otter. Removing any player now takes everything of theirs off the
  device (before, the island, the otter and its name, and the Weekly record stayed in the device's storage, unseen).
  As before, the saved progress on the server stays (Grown-ups → Delete saved progress removes it), so a linked player
  can come back with a link code.
- A new player who starts with the Weekly, Build Anything, a Trail level or a race (16 and 17 Nov 2026): the finish
  card's red button is "Done" and goes to the menu; the Weekly card then offers "Go to Bloppitopia" and the Weekly
  card. Until the player has sailed, the menu shows "Start here" in Bloppitopia's place and nothing there counts as
  found (before, Brickyard Cove and two films showed as unlocked). "Start here" or "Go to Bloppitopia": the otter card,
  the arrival film, then the hut and Brickyard Cove rise, with Bibi's film. Players who have sailed see no change.

To do when it is submitted: What's New, the build number (read it in TestFlight), a play-test list. Start the review
notes from the ones in App Store Connect, not from `listing.md`.

Play-test for the change above:
1. A device with two players: remove the one who isn't playing. The other plays on, with their island and stars.
2. Remove the last player: the launch screen, then "Start here: meet your otter" as on a first visit; the player is
   called Player 1; sound and music settings are as they were.
3. A linked player removed this way: Link a player with a new code from the other device brings them back.

Play-test for the new-player finish:
4. A fresh device (or after removing the last player): play Bibi's Weekly Bloppit first. The finish card shows Done
   (red), Go to Bloppitopia and Bibi's Weekly Bloppit card. Done opens the menu: "Start here: meet your otter" is
   there, no otter card pops up, and there is no Bloppitopia tile or My films yet.
5. Tap Start here (or Go to Bloppitopia on the card): the otter card, the arrival film, then on Home Island the hut
   appears and Brickyard Cove rises from the mist with Bibi's film. The menu now has the Bloppitopia tile and My films.
6. A player who has already sailed: after the Weekly the red button still says "See Brickyard Cove grow".
