Approved and locked by the user on 29 October 2026. See APPROVAL.json. Any pending art-approval references below describe the earlier QC stage; actual island testing remains pending.

# Bibi — integration notes

Bibi is the new canonical name for Lemmie, the lion cub on Brickworks Island. Keep any existing Lemmie game identifiers as aliases if save compatibility requires them; display Bibi to players.

## Model and clips

Load `bibi.glb` as one scene. It contains its textures, custom skin rig, face morphs and separate orange two-stud brick. The character is approximately 3 units tall; scale the imported scene uniformly for the island. glTF uses Y-up. Match the island camera and light before adjusting materials further.

Nine clips: `idle`, `greeting`, `idea`, `proud`, `roar`, `hop`, `cheer`, `offer`, `release`. Loop `idle`; play the others once. Stop and reset the prior action, restore full weight, reset the new action and play it. `release` must clamp at its final frame. Select `idle` to reset and return the prop to the hands.

Revision 2 uses explicit skin weights and fixed-length arm bones, with distal paws separated from the torso mesh. The torso and upper limbs were repaired to remove a generated paw-to-chest bridge. Bibi has a compact chest-level cheer, a one-paw greeting/idea/tiny-roar gesture while the other paw holds the brick, head and tail movement, blinking and mouth/breath morphs. This is a custom game rig, not a standardized humanoid retargeting skeleton.

## Brick handoff

The prop node is `Bibi_Brick`; the character root is `Bibi_Root`. The release event is at **0.666667 seconds** (frame 21 at 30 fps). Obtain the prop's world transform at that instant, spawn the game's separate brick at that transform, then hide the embedded prop for the remainder of the clip. Let game physics control the spawned brick. The embedded clip includes a stable fallback landing for previews; do not run both copies visibly.

Restore the embedded prop when resetting to a clip that holds it. Keep the model scene together when placing it so the skin meshes and skeleton share the same overall game transform. Do not move only a skinned mesh node.

## Acceptance boundary

Revision 4 replaces the overlapping arm/paw pieces with continuous sculpted arms and rounded painted paws. Upper and forearm rotations share a bend plane; the greeting has a more open elbow. Both grips were recalibrated. The review opens paused on the greeting. Nine close-up greeting views supplement the sequence sheets. This changes paw geometry and paint placement while preserving the character's face, body and palette. The model is 97,294 triangles and approximately 11.7 MB; target-device performance remains an in-game acceptance item.

Revision 3 corrects expression deformation on the final smoothed surface and reduces upper-lip folding during the roar. The animation names, durations and release event remain unchanged. Expanded local checks cover 60 Hz surface samples, interrupted playback, variable frame rates/speeds, pause/replay and whole-scene placement. See `QC-STATUS.md` and `QC-MOTION.html`; actual island tests below are still separate.

Local QC reports accompany the delivery. Actual island loading, camera distance, event wiring, device performance and user art approval are separate checks. No claim of an in-game test is made until that test has actually happened.

Original source, generation record, reference and build scripts remain in the parent artwork folders. Meshy generation used the approved 35 existing credits; local refinements require no further Meshy credits.
