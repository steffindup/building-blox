# Swoop — island integration

Use `swoop.glb` as the complete imported scene. The matching self-contained review is `REVIEW-SWOOP.html`. Revision 1 was approved and locked by the user on 29 October 2026. Use the master in approved-v1; preserve it and version future changes.

Swoop lives permanently at Blitz Bay, with story appearances elsewhere allowed. Preserve the blue goggles, black eye crescents/wing bars, blue two-stud brick, straight orange beak and exactly two white tail streamers.

## Playback

Ten named clips are embedded: `idle`, `greeting`, `focused`, `challenge`, `wink`, `surprised`, `hop`, `cheer`, `offer`, `release`. Durations are in `manifest.json`. Loop `idle` and `focused`; play the others once and clamp. For deterministic changes, stop previous actions, reset the destination action, set weight 1, play, then update the mixer. This reset/play policy is tested. Arbitrary crossfades are not covered.

The complete imported scene must be positioned/scaled together. Do not extract only the head or wing meshes. Articulation uses ordinary animated nodes and lid morphs, not a humanoid skeleton. Wing segments keep their lengths; tail streamers have independent controls. The facial design retains Swoop's open smile, with blink/wink/lid expressions and head poses.

## Brick and events

The prop is `Swoop_Brick`, under `Swoop_Root`. `offer` presents it and returns to the rest pose. `release` lets go at 0.666667 seconds, drops it to the ground and holds the final position. If the island transfers the brick to another character/inventory at that event, hide or stop animating this internal prop and manage the received prop separately. Choose `idle` to restore the held brick.

## What remains in the actual island

Check loading, the chosen world scale and spawn position, island lighting, camera distance, controls/event wiring, release integration and frame rate on target devices. Local Blender renders and Three.js mixer tests do not establish those results. No automatic LOD or collision physics is included. The model has 110,958 triangles and a 9,084,500-byte (approximately 9.1 MB) embedded-texture GLB; check the intended simultaneous character count on mobile before release.

Source generation used one approved Meshy 7.1 textured generation, 35 credits (915 → 880). Local repair, articulation, animation and QC used no further Meshy credits. Keep the original source and rejected test fixtures in the working folder; do not ship the negative-control GLBs to the game.
