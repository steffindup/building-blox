# Bloppitopia character sheets

Approved 24 Oct 2026. Drawn in Bloppit's signature style (soft brown outlines, warm flat shading,
big glossy eyes); each character holds a two-stud brick in their island colour. These are the
reference for the 2D art and the 3D models in the character update (1.0.1). Kept outside `public/`
so they are not published on bloppit.com before the update ships.

| Sheet | Character | Island | Brick |
| --- | --- | --- | --- |
| tiny-sheet.jpg | Tiny the Tree Frog | Frog Forest | lime |
| nora-sheet.jpg | Nora the Night Heron | Brainpeak | dark blue |
| pippa-sheet.jpg | Pippa the Penguin | Flipper Beach | yellow |
| swoop-sheet.jpg | Swoop the Longtail | Blitz Bay | blue |
| bibi-sheet.jpg | Bibi the Lion Cub | Brickyard Cove | orange |
| lufu-sheet.jpg | lufu (always lowercase) | Moonstone Isle | moonstone (white, lavender glow) |

lufu is drawn from the four I am lufu master references (curiosity, awe, reverence, sorrow); the wisp and pendant always match the eye colour.
Bloppit himself is `public/art/bloppit-front.svg`.

## Compressed game copies (30 Oct 2026)

The files the game ships in `public/3d/*.glb` are compressed copies of the approved masters: textures resized
to 1024×1024 and saved as WebP (quality 85), positions and normals quantized, geometry meshopt-compressed
(gltf-transform 4.1: `resize → webp → quantize → meshopt`). 79 MB became 9.5 MB. Each approved, uncompressed
master is kept unchanged in its character's folder here (`tiny-3d-v16/tiny.glb`, `bloppit-3d-v2/bloppit.glb`,
`pup-3d-v2/pup*.glb`, …). Rendered side by side in the game, the copies match the masters to within an average
of 0.6/255 per pixel in every clip checked.

The game loads them with three's GLTFLoader plus `public/3d/meshopt_decoder.js` (meshoptimizer 0.22, MIT).
A compressed model's URL version in `MODEL3` ends in `c` (`v:'2c'`); bump it whenever a file changes, because
`netlify.toml` tells browsers to keep `/3d/*` for a year.
