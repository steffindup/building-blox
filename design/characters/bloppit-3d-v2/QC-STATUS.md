# Bloppit — local QC passed

Approved v2, 29 October 2026. **User-approved and locked; actual island acceptance remains pending.**

Model SHA-256: `037264ceee98a8bafea47d984f7c9390cd7498520aa790da516934889df1a21b`. All delivered reports and render indexes refer to these bytes.

- GLB validation: zero errors and zero warnings; 98,996 triangles; 10.72 MB; all 20 clips and original clip durations present. Review embeds the identical model.
- Exported skin: 2,640 samples at 60 Hz. Normalized weights, closed geometry, stable bone lengths, loop seams, floor contact, brick release and prop visibility pass. Head/prop and grip tests run at 15 Hz.
- Joint limits: rigid edge change ≤25%; mixed joint edge change ≤50% and absolute change ≤0.03 authoring units; mouth region ≤100%; no triangle below 5% of its rest area. Arm length stays fixed. No tolerance was relaxed to accept a visible defect.
- Independent limbs: three closed components (body and two continuous arms), 260 shoulder attachment samples, 56 free-paw clearance samples, zero paw penetration. Oops moves no vertices outside its defined mouth region.
- Eyelids: both fully cover the sampled eye regions when shut and uncover them when open. Layered controller blinks also close fully.
- Runtime: 6,000 interruption/seek cases, 400 reset transitions, 300 speed/frame-rate cases, pause/resume, replay, repeated idle and scene placement tests. Controller: 1,083 interrupted blends, legacy inputs, reaction queues, aliases, prop selection and blinks.
- Visual review: 420 motion frames across all 20 clips and three views, 30 key views, 27 repaired-joint close-ups, 20 small previews and a portrait. Image indexes and checksums are included.
- Revision: Garden, Fish and Read keep the brick visibly stowed behind his back, with body clearance and transition checks. Focused uses his normal face with a clear gold monocle attached to the head.
- Negative controls: tests reject a stuck paw, stretched arm, exposed closed eye, submerged released brick, hidden held brick and the preserved faulty shoulder model.

The Blender visuals inspect a fresh import of the delivered GLB. Headless Three.js checks do not exercise image decoding, WebGL drawing or actual island performance. Test loading, controls, lighting, camera distance, paired pup/dock contact, prop handoff and target devices inside Bloppitopia.

One Meshy generation used **35 existing credits**. No additional paid generation was used. The previous Bloppit prototype and approved cast masters are preserved.
