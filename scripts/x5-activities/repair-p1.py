"""Apply the two reviewed P1 raster repairs, after prepare.py.

python repair-p1.py --sources <generated_images/01a166f0-...>
Contours come from image-tool artwork; this script draws only blend masks.
"""
from pathlib import Path
import argparse
import json
import sys
import numpy as np
from PIL import Image, ImageFilter
sys.dont_write_bytecode = True
from prepare import SIZE, HERE, OUT, mask, rgba_mask, skirt_support


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, required=True)
    args = parser.parse_args()
    original = Image.open(HERE/'reference.png').convert('RGBA')
    torso = Image.open(args.sources/'exec-b74432a8-bb32-4185-a16d-8735b56c8143.png').convert('RGBA').resize(SIZE, Image.Resampling.LANCZOS)
    arms = Image.open(args.sources/'exec-d4d92554-17d2-4688-b63e-050ea608285b.png').convert('RGBA').resize(SIZE, Image.Resampling.LANCZOS)
    # The image tool enlarged the extracted component. Register the unchanged
    # book spine/cover anchors back into the original sprite coordinates.
    arms = arms.transform(SIZE, Image.Transform.AFFINE,
                          (1/.55, 0, -90/.55, 0, 1/.55, -108/.55),
                          Image.Resampling.BICUBIC)
    # Follow the component's own alpha, feathering only the shoulder root
    # underlap. Never multiply it by a rectangular shirt/book region.
    sleeve_mask = arms.getchannel('A').filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    arms = rgba_mask(arms, sleeve_mask)
    arms.save(OUT/'read-arms.png')
    sleeve_mask.save(HERE/'masks/read-p1-sleeves.png')

    # Preserve the complete original skirt silhouette (including AA), not the
    # hanging sleeve pixels touching its upper sides. Torso edges are AI raster.
    skirt = skirt_support(original)
    # Below the old cuffs there is no arm to remove. Preserve skirt AA and
    # the first skin rows too; dark-only support would cut a gap at the hem.
    skirt[295:] = 255
    lower = rgba_mask(original, Image.fromarray(skirt))
    region = mask([[(170,207),(229,207),(245,227),(244,260),(155,260),(154,227)]], 1.2)
    upper = rgba_mask(torso, region)
    # Only the upper shirt is transferred. The seam falls inside the dark
    # waistband; source skirt and all leg/boot pixels remain exact.
    a = np.asarray(upper).copy()
    a[260:,:,3] = 0
    upper = Image.fromarray(a)
    body = Image.alpha_composite(lower, upper)
    # Original collar/neck stays in its exact position. Blend inside green
    # fabric below it instead of overlaying two differently registered collars.
    collar_mask = np.zeros((400,399), dtype='uint8')
    collar_mask[184:209,169:231] = 255
    for y in range(209,218):
        collar_mask[y,169:231] = round(255*(218-y)/9)
    body = Image.alpha_composite(body, rgba_mask(original, Image.fromarray(collar_mask)))
    body.save(OUT/'stretch-body.png')
    body.save(OUT/'read-body.png')
    region.save(HERE/'masks/torso-p1.png')
    for name in ['read', 'stretch']:
        pose = Image.alpha_composite(body, arms) if name == 'read' else body.copy()
        if name == 'stretch':
            for side in ['left', 'right']:
                pose = Image.alpha_composite(Image.open(OUT/f'stretch-{side}.png').convert('RGBA'), pose)
        pose = Image.alpha_composite(pose, Image.open(OUT/'head.png').convert('RGBA'))
        pose.save(OUT/f'{name}-key.png')
        allowed = np.maximum(np.asarray(Image.open(HERE/f'masks/{name}.png')), np.asarray(region))
        allowed = np.maximum(allowed, collar_mask)
        if name == 'read':
            allowed = np.maximum(allowed, np.asarray(sleeve_mask))
        else:
            for side in ['left', 'right']:
                allowed = np.maximum(allowed, np.asarray(Image.open(OUT/f'stretch-{side}.png'))[:,:,3])
        changed = np.any(np.asarray(pose) != np.asarray(original), axis=2)
        assert not np.any(changed & (allowed == 0)), name
        Image.fromarray(allowed).save(HERE/f'masks/{name}.png')
    report = {'source': 'built-in image_gen; feathered local compositing, no drawn anatomy',
              'feet_equal': bool(np.array_equal(np.asarray(body)[305:], np.asarray(original)[305:]))}
    assert report['feet_equal']
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
