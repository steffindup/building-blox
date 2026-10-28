# Tiny — approved v16

Appearance and all eight animations approved by the user on 28 October 2026.
This folder is a fixed handoff copy. Make future changes in a new version;
do not overwrite these files. The original development files remain outside
this folder.

## Use these files

- tiny.glb: authoritative approved game model, 9,483,400 bytes, 67,896 triangles.
- REVIEW-TINY.html: self-contained preview with all eight clips.
- tiny-editable.blend: editable source for later changes.
- manifest.json: clip lengths, loop settings, controls and the release event.
- APPROVAL.json: approval scope and SHA-256 hashes of the copied files.

The model passed local format, surface, motion and grip checks. Actual game
integration and device performance have not yet been tested. GLB hash:
5e8b41f604cfda89c74fc4f043324ea1a3369ca1856212a8ed22a41151a70bac

## Next: Frog Forest integration

1. Place Tiny at his intended island scale and test the normal gameplay
   camera, daylight/night lighting, and the smallest supported screen size.
2. Connect idle, focused, whistle, hop, cheer, oops, offer and release to
   the intended game events. The Character Bible specifies whistling on
   level completion; use hop/cheer for celebrations and the Lily-pad Palace
   finale, and oops for a missed brick.
3. Check animation transitions and brick ownership. Release is at 0.666667
   seconds. Preserve the brick's world transform and stop animation driving
   it before gameplay physics takes control. The supplied fall is animated.
4. Check loading time, frame rate and memory on the target devices. If a
   lighter game version is necessary, derive it from this approved master
   and compare its appearance and animation before adopting it.

## Editing notes

This character uses morph targets, not a general-purpose bone skeleton.
Release includes opening the fingers; do not add GripOpen on top at full
strength. The editable scene is upstream of the final index-only cleanup
recorded in export-cleanup.json. For an exact rebuild, use
shorten_tiny_cheer_v16.py and the existing export/validation scripts in the
parent development folder. Do not replace tiny.glb with an unchecked raw
export from Blender.
