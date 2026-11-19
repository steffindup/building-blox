# Crew Mega Builds

The six added on 19 Nov 2026 (Steff picked all six): Castle on the Hill, Pirate Ship, Coral Reef, Steam Train,
Treehouse, Volcano Island. `mega.py` draws them stud by stud (28 x 22, the crew palette `CREW_PAL`) into `mega.json`;
`render.py` makes the review sheet. They live in `CREW_PUZZLES` in the game; the server's `PUZZLE_COUNT` must match.
Append only: crews store the puzzle's index.
