# Swoop — local QC passed

Date: 2026-10-29. Revision 1 is user-approved and locked. Actual island acceptance remains pending.

Model SHA-256: `57c088541cf7415e33c36474eb0bfba342338f87de53831b4d5e0cb3ba3d3cb5`.
GLB: 9,084,500 bytes; 110,958 triangles; ten animations.

## Completed checks

- GLB validation: zero errors and zero warnings; correct clip names/durations; review embeds the identical model.
- Geometry and motion: 1,276 samples at 60 Hz, with triangle clearance and grip checks at 15 Hz. Closed surfaces; no degenerate geometry, failed grips, head/wing contacts or floor penetration in the sampled clips. Fixed wing lengths; two distinct tail streamers; stable landed brick. Maximum grip gap 0.002311 model units, minimum streamer separation 0.081999, maximum edge strain ratio 1.006001.
- Runtime playback: 100 clip-pair transition checks, 1,500 interruption/reset/seek cases, 150 playback speed/frame-rate cases, ten pause/resume checks, ten replay checks, ten idle cycles and three whole-scene placement cases. Passed using the exported GLB and Three.js AnimationMixer.
- Visual review: 210 sequence frames across ten clips and three views, 17 detailed key poses including rear/quarter views, 18 wing-joint close-ups, ten 64-pixel previews and a studio portrait. Wing roots and elbows stay connected, feather undersides are finished, no obvious stretch or sudden roll appears, the blue brick stays readable, and the two streamers remain distinct. The model retains the happy open beak; expressions use eyelids and head/body gestures.
- Six faulty fixtures were correctly rejected: eyelid/floor faults, a stuck wing, a stretched wing, a missing streamer, cheek contact and abrupt forewing roll. Faulty GLBs remain outside the delivery.
- Delivery gate binds the reports, rendered evidence and embedded review model to this exact GLB with checksums.

## Repairs made before the pass

Rebuilt the fused torso, articulated feather wings, feet and separate tail streamers; tapered the neck; separated the blue brick; repaired eyelid coverage and release height; lowered wing roots to clear the cheeks; corrected forewing rotation continuity; finished both sides of the wing feather fans. Earlier numerical passes did not override visual defects: the blank undersides and edge-on feather pose were revised before this delivery.

## Scope and remaining acceptance

This is a local asset and animation QC pass. Actual island loading, controls, lighting, camera distance, event wiring, prop transfer and target-device frame rate have not been tested. Browser drawing/image decoding is not established by the non-rendering mixer tests; embedded textures were inspected in fresh Blender imports. Use the reset/play policy in HANDOFF.md; arbitrary crossfades are not covered.

Swoop uses node articulation and eyelid morphs, not a humanoid skin rig. Rigid-surface strain tests exclude eyelid/lash unfolding; closed-eye coverage has its own regression check and visual review. Layered feathers intentionally overlap at joints; head/wing contacts are not exempted. No LOD, collision physics, lip sync or flight cycle is included.

One approved Meshy generation used 35 credits (915 to 880). Repairs and QC used no additional Meshy credits.
