# Pippa — Bloppitopia character

Use pippa.glb in the game, REVIEW-PIPPA.html for the offline review, and
pippa-editable.blend for future editing. The manifest lists clip durations.
QC-STATUS.md records the final local checks and their limits.

Pippa keeps her round black-and-ivory silhouette, blue eyes, rosy cheeks,
orange beak and webbed feet, yellow sunglasses and yellow two-stud brick.
The glasses stay on her head. The brick is an independent movable prop.
Revision 2 uses matte feather/body materials, reduced baked pale highlights,
and shorter rounded flippers with a gentle curve. The belly boundary is
clean. Flippers rotate without changing length; brick placement was adjusted
to fit them. The user rejected the gloss and fin shape of delivery-v1.

## Clips

| Clip | Duration | Use |
| --- | --- | --- |
| idle | 3.2 s, loop | Waiting, breathing and blink |
| greeting | 2.4 s, once | Monday arrival / friendly wave |
| excited | 2.4 s, once | New puzzle or happy discovery |
| wink | 1.8 s, once | Friendly one-eye reaction |
| wobble | 2.4 s, once | Small off-balance recovery |
| hop | 1.2 s, once | Small success |
| cheer | 2.4 s, once | Weekly completion / seaside festival |
| offer | 1.8 s, once | Present the yellow brick |
| release | 2.2 s, once, hold | Separate prop handoff |

Pippa has no boss encounter. Cheer supports her seaside festival role.

## Integration

- GLB is Y up, faces +Z and is approximately 3 model units tall. Scale her
  to the island scene. Neutral feet rest about 0.002 units above Y = 0.
- Root: Pippa_Root. Prop: Pippa_Brick.
- Play by clip name. Stop/reset the old action before playing the next.
  All 81 ordered clip changes are checked using Three.js AnimationMixer.
- Release event: **0.666667 seconds**, frame 21 at 30 fps. Capture the prop's
  world transform and transfer it to game ownership. Stop the clip driving
  the gameplay-owned prop. The supplied fall/landing is an animated fallback,
  not a physics simulation.
- Release holds its final pose. Idle restores the held prop. If the brick
  has been consumed, keep that prop hidden until the next intended grant.
- This is a scene-graph rig: rigid flippers and head controls, plus eyelid,
  small beak and breathing morphs. It is not a humanoid retargeting skeleton.
- No swimming or locomotion cycle is included. These nine clips cover the
  current on-island character presentation; ferry travel is game staging.
- Do not layer the facial morphs arbitrarily without checking the result.
- At very small sizes, use the full gesture and game text as cues; a wink
  alone should not communicate essential gameplay information.

## Validation boundary

Local file, closed-surface, motion, contact, clearance, transition and render
checks do not establish actual island lighting, camera framing, event wiring,
load time or target-device frame rate. Test those after integration.
The HTML script and embedded bytes were checked; its local browser controls
were not driven through automated browser interaction. No live game changed.
User approved and locked v2: "okay, happy to lock." Actual island testing remains pending.

## Source and rebuilding

The source reference and Meshy download are preserved in the parent artwork
folder. Build order: prepare_pippa_mesh.py, build_pippa.py, animate_pippa.py,
clean-export.cjs, build-review.cjs. Revalidate after any rebuild.
The export cleanup omits unused tangents and repairs a zero tangent at a UV
pole using a unit vector perpendicular to its normal. It does not change
positions, normals, morph positions or animation data.

Generation used **35 existing Meshy credits**, balance 985 to 950. No further
paid generations or rigging were used. See generation-record.json.

