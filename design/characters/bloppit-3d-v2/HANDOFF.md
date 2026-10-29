# Bloppit — game integration

Revision 2 was approved and locked by the user on 29 October 2026. Use the master in approved-v2 and version future changes. Local QC passed; actual island acceptance remains pending.

## Files

- `bloppit.glb`: self-contained textured model, skeleton, face shapes and 20 animation clips.
- `controller.js`: Three.js controller, retaining the old six mode inputs and five reaction inputs. Requires the game's installed Three.js module.
- `manifest.json`: clip timings, loop flags, aliases, node names and release event time.
- `REVIEW-BLOPPIT.html`: self-contained visual review; open locally, choose a pose, rotate, pause, scrub or change speed. This review uses reset/play controls; the separate controller uses blends.
- `bloppit-editable.blend`: editable production scene with actions, textures and props.
- `QC-STATUS.md`, QC reports and image folders: checks on the exact delivered model.

## Coordinate and loading contract

The GLB uses standard glTF Y-up coordinates. Bloppit faces +Z and is approximately three authoring units tall. Position, rotate and scale the entire imported scene through a parent group. Do not separately scale the body mesh, skeleton or props. The tested Three.js loader/mixer uses the same bundled version as the review; no humanoid auto-retargeting guarantee is made.

The textured head, feet and broad otter tail come from the authorized Meshy generation. The torso and arms were repaired for animation. Each rounded arm is a separate closed continuous surface, with a fixed-length upper/forearm rig and an intermediate elbow control. Intentional shoulder overlap attaches the arm to the torso. Bone lengths remain fixed; targets are constrained to avoid excessive elbow bends.

## Animation interface

```js
import { BloppitController } from './controller.js';
const bloppit = new BloppitController(gltf);
bloppit.setInput('mode', 0);
bloppit.setInput('wave', true);
// In the render loop, pass elapsed seconds:
bloppit.update(deltaSeconds);
// On removal:
bloppit.dispose();
```

Modes 0–5 remain `logo_idle`, `garden`, `fish`, `read`, `campfire`, `doze`. Reaction indices 0–4 remain `happy_hop`, `giggle_wiggle`, `surprised_jump`, `show_brick`, `look_at_you`. `poke` queues the selected reaction after looking at the player; when asleep it wakes Bloppit. `wake`, `wave` and `cheer` remain accepted inputs. `play(name)` also supports every embedded clip and the aliases below.

The original 16 clip names and durations are retained. Additional embedded clips are `focused`, `reach`, `hug` and `release`. Aliases are `greeting → wave`, `hop → happy_hop`, `oops → surprised_jump`, and `offer → show_brick`; these aliases are controller/manifest mappings, not duplicate embedded clips.

The short `blink` clip contains only face channels. The supplied controller overlays eyelids after the mixer so a base action cannot dilute a full blink. It suppresses automatic blinks during doze and wake.

## Props and interaction

`Bloppit_Brick` is a separate red two-stud prop. The left paw retains it while the right paw waves, cheers or reaches. Garden, fish and read visibly stow it behind his back. Hug alone hides it using a tiny scale. The controller switches between the hand and back positions discretely while blending body poses, so the brick never travels through the torso.

Watering can, rod and book groups are `Bloppit_WateringCan`, `Bloppit_FishingRod` and `Bloppit_Book`. Focused keeps his normal open-eyed face and adds the gold `Bloppit_Monocle`, attached to the head bone with a clear lens. It appears only during Focused. These props belong to this model. Hide any older game-supplied equivalents to avoid duplicates.

The release event is at **0.666667 seconds**. The embedded brick falls to a stable endpoint. The manifest supplies this timing; no game inventory or external brick is spawned by this package. If the game takes ownership at that event, hide the internal brick and coordinate the external prop explicitly. The review holds the endpoint until another clip is selected; the controller returns to the selected base activity when the clip finishes.

Reach and hug are solo-character motions. Contact with the player's pup, dock placement, inventory handoff and paired animation timing require testing inside Bloppitopia.

## Local checks versus game acceptance

Local checks include exported geometry, skin deformation between keys, limb independence, shoulder continuity, head/torso/prop clearance, eyelids, grip, floor contact, animation interruption and controller behaviour. Deliberately faulty models must fail their regression checks. Image decoding and WebGL drawing are not exercised by the headless Three.js tests; visual review uses fresh imports of the final GLB in Blender.

Actual island loading, lighting, controls, event wiring, camera-distance readability and target-device performance remain pending until tested in the game. The package uses one authorized Meshy generation: **35 existing credits**, with no further paid generations.
