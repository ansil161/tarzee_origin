# AI image / video prompts (ready for Higgsfield)

Update 2026-10-14: the Higgsfield account now has credits (Max plan). The jacket-reveal images in `media-src/campaign/` were generated with `gpt_image_2_5` (16:9, 2K, quality high). Everything below is still unrun. The site currently uses your real product photos (cut out and graded) and your three concept
renders. When credits are added, run these prompts and drop the results into `theme/assets/` with the same
filenames, then re-run `python preview/build.py`.

Style for every prompt: black and white, high contrast, soft grain, raw concrete and shadow, low raking light,
oversized black streetwear on a calm unposed model, editorial fashion photography, no text, no logos.

## Images (model: soul_2 or nano_banana_pro, 2K)

| File | Prompt |
|---|---|
| look-04-denim.jpg (3:4) | Man in an oversized black denim jacket covered in frayed hand-laid denim strips, standing in a concrete corridor, hard side light, black and white editorial |
| look-05-patchwork.jpg (3:4) | Man in a black patchwork jacket pieced from raw squares in four greys with exposed edges, walking past a concrete wall, long shadow, black and white |
| look-06-popover.jpg (3:4) | Man in a black half-placket popover shirt with an all-over small diamond block print, wide black trousers, white sneakers, concrete plaza, black and white |
| look-07-pintuck.jpg (3:4) | Man in a black shirt with vertical pintuck panels, tonal black on black, arms relaxed, concrete wall with a slash of light, black and white |
| campaign-wide.jpg (21:9) | Three men in oversized black jackets and shirts walking through a brutalist concrete arcade, long shadows, black and white, cinematic |
| product-flat-*.jpg (4:5) | Product-only: black jacket laid flat on a pale concrete floor, top-down, soft shadow, black and white |

## Videos (model: kling3_0 or seedance_2_0, 5–8 s, no audio)

| File | Prompt |
|---|---|
| hero-triptych-1920.mp4 (16:9) | Slow dolly across three men standing still in a concrete corridor wearing black block-printed jackets, dust in a shaft of light, black and white, 24fps, cinematic |
| hero-mobile-1080x1920.mp4 (9:16) | Man in a black diamond-print bomber turns slowly toward camera in a concrete doorway, shadow moves across the wall, black and white |
| craft-1080x1350.mp4 (4:5) | Extreme close-up of hands blanket-stitching the edge of black cotton, then frayed denim strips moving in a breeze, macro, black and white |
| lookbook-loop.mp4 (16:9) | Handheld tracking shot following a man in a black patchwork jacket walking through a brutalist plaza, black and white, grain |
