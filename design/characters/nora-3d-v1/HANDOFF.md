# Nora — Bloppitopia character

Use `nora.glb` for the game, `REVIEW-NORA.html` for the self-contained review,
and `nora-editable.blend` for future editing. The accompanying `manifest.json`
lists all clip durations and loop settings. Consult `QC-STATUS.md` for the
final checked status and the exact delivery hash.

Nora retains her grey-blue feathers, pale-yellow crown, one long white plume,
warm red-orange eyes, cream face and neck, pointed charcoal beak and golden
legs. Her blue two-stud brick is a separate object. Jointed feather fans keep
the reach compact; the generated rear coverts and tail remain in place.

## Game events

| Clip | Duration | Suggested use |
| --- | --- | --- |
| idle | 3.2 s, loop | Waiting at Brain Trail |
| focused | 2.4 s, loop | Presenting a puzzle / listening |
| thinking | 3.2 s, loop | Considering a pattern |
| aha | 1.8 s, once | First-try answer or pattern discovered |
| hint | 2.4 s, once | Gentle encouragement after a miss |
| hop | 1.2 s, once | Small success reaction |
| cheer | 2.4 s, once | Level or Great Telescope celebration |
| offer | 1.8 s, once | Presenting the blue brick |
| release | 2.2 s, once, hold | Releasing the brick |

## Integration

- GLB uses Y up and faces +Z. The neutral character is approximately 3 model
  units tall; set the scene scale to suit the island. Feet rest near Y = 0.
- Root node: `Nora_Root`. Prop node: `Nora_Brick`.
- This is a scene-graph animation rig with jointed wing/jaw transforms and
  head, body and eyelid morphs. It is not a standard humanoid retargeting rig.
- Play clips by name. Stop/reset the previous action before selecting the
  next one. All 81 ordered clip changes are tested with Three.js AnimationMixer.
- Release occurs at **0.666667 seconds**, frame 21 at 30 fps. At this event,
  capture the brick's world transform and transfer ownership to the game.
  Stop the animation from driving the gameplay-owned prop. The supplied
  fallback fall and landing are animated, not a physics simulation.
- Release holds its last pose. Returning to idle restores the held brick;
  if gameplay has consumed the brick, keep the character's prop hidden until
  the next intended grant.
- Treat the supplied clips as complete performances. Do not combine facial
  controls additively at arbitrary strengths without checking the result.

## Validation boundary

Local format, topology, motion, contact, clearance and rendered-pose checks
are separate from actual island testing. The game camera, environment
lighting, event wiring, load time and target-device frame rate still need
verification after integration. No production website was changed.

## Rebuilding

The downloaded Meshy source and the polished reference remain in the parent
folder. The build sequence is prepare_nora_mesh.py, build_nora_wings.py,
animate_nora.py, then clean-export.cjs and build-review.cjs. The export cleanup
removes unused tangents on materials without normal maps and leaves geometry
and animation payloads unchanged. Revalidate after any rebuild; do not assume
a raw Blender export is byte-identical to the delivered GLB.

Meshy generation cost: **35 existing credits**, verified from the balance
change of 1,020 to 985. No additional Meshy generations or paid rigging were
used for this character.
