Approved and locked by the user on 29 October 2026. See APPROVAL.json. Any pending art-approval references below describe the earlier QC stage; actual island testing remains pending.

# Bibi — local QC passed

29 October 2026. Formerly named Lemmie. Ready for user review and island integration testing.

- Nine clips; 603 sampled animation frames.
- Six delivered mesh components are closed and manifold after welding export seams, with no degenerate rest faces. The imported Blender bone widget is excluded because it is an editor helper, not delivered geometry.
- No floor penetration; exact idle loop; stable released brick.
- Distal paws are separate from the torso mesh. The new chest-motion regression passes all 603 frames. Fixed bone lengths with no stretch scaling or unreachable IK targets. Held-paw contact stays within 0.03 units; intentional surface compression is below 0.035 units.
- 603 frames checked for arm/head and distal-tail/head surface intersections; no collisions in the tested regions. Blended shoulder/neck attachments are excluded from that separate-part test.
- All 81 ordered reset/play transitions pass using Three.js GLTFLoader and AnimationMixer.
- Expanded playback: 1,215 interrupted transition/seek cases, 135 frame-rate/speed cases, all nine pause/resume and replay cases, ten idle cycles and three whole-scene placement/scale cases.
- 1,197 surface samples at 60 Hz: joint continuity, free-paw excursion and clearance, normalized weights, surface strain, triangle collapse and abrupt displacement. Intended mouth deformation has its own explicitly bounded anatomical region.
- 189 motion-sequence renders visually inspected from the front and both sides, supplementing the high-resolution key poses and small previews.
- A single connected skin surface now runs from each upper arm through the elbow to its rounded paw. Greeting close-ups at three times and three angles are reviewed separately. The arm-continuity regression rejects revision 3.
- Negative controls reject revision 1's chest weighting defect and revision 2's unintended expression distortion. Expression morphs now apply only their intended displacement to the final surface.
- Delivery gate checks report freshness, model hashes, visual-sequence hashes, and negative-control results before packaging.
- GLB validation: zero errors and zero warnings. Preview embeds the exact delivered model.
- Front, quarter, side, back and key poses visually reviewed, with six 64-pixel previews. A very small character still benefits from game UI cues for subtle expressions.

Model: 11,674,280 bytes; 97,294 triangles.
SHA-256: ebe2a439933c8ebf0ae5fd662b89d77c879fbd345996fea24cc9484ffdd236f9

User art approval, actual island camera/lighting/event wiring and device performance remain pending. Browser script and embedded assets were checked; local HTML controls were not driven through automated browser interaction. Read HANDOFF.md for release timing and scene placement.
