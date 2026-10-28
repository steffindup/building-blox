# Pippa — local QC passed

28 October 2026. User approved and locked v2. Ready for game integration testing.

- Nine animation clips; 603 sampled frames.
- All 11 component meshes closed and manifold after welding export seams;
  no degenerate faces in the checked rest geometry. Components overlap at
  intentional joins; the whole character is not one union mesh.
- No floor penetration; idle loop closes exactly; released brick holds still.
- Flippers retain rigid length; held-brick contact passes throughout.
- 603 frames of actual flipper/head clearance checked; no confirmed
  penetration. Glasses move with the head.
- All 81 ordered animation transitions pass using Three.js AnimationMixer.
- GLB validation: zero errors and zero warnings. Embedded preview model
  matches the delivered GLB bytes.
- Front, quarter, side, back and animation poses inspected, plus six
  64-pixel previews. A wink alone is not an essential small-size game cue.

Model: 8,031,528 bytes; 53,554 triangles.
SHA-256: 1fc592a5b7655f054a63aa3ea0a20f43438da203a39986c18e37336d897670c8

User art approval is complete. Actual island camera/lighting/event wiring and device
performance are pending. Browser script and embedded assets were checked;
local HTML controls were not driven through automated browser interaction.
Read HANDOFF.md before integrating the release event.

