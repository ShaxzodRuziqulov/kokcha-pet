"""X5 image-tool edits -> locally masked sprite keys; never paints anatomy.

Usage: python build-assets.py --sources <image_gen output directory>
Pillow/numpy are asset-preparation dependencies, not app dependencies.
"""
from pathlib import Path
import argparse
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
FRAMES = HERE.parent / 'frames'
SIZE = (239, 400)
RAW = {
    'K2': 'exec-65308343-7f59-48c9-9312-37044eedca20.png',
    'K3': 'exec-388897aa-cefa-4efc-9ed1-876e044afc77.png',
    'K4': 'exec-5fb0532e-a830-418c-a92a-e84c19b7f8be.png',
    'K5': 'exec-a0a9a2e7-d0f1-42f3-9ebc-372ac787c85b.png',
    'side': 'exec-74ca2016-90ee-4ed8-b2b9-926c9080ca08.png',
}
OLD_LEFT = [(87,210),(89,237),(82,264),(80,294),(49,301),(11,301),(9,265),(29,239),(69,211)]
HEAD = [(0,0),(239,0),(239,212),(157,212),(150,190),(143,184),(96,184),(89,190),(81,212),(0,212)]
LEFT = {
    'K2': [(84,199),(110,206),(112,232),(96,256),(81,271),(58,274),(46,263),(48,237),(65,216)],
    'K3': [(77,193),(82,170),(106,169),(115,182),(114,210),(102,235),(97,248),(82,257),(58,256),(44,246),(41,232),(46,207),(62,195)],
    'K5': [(86,214),(110,228),(113,252),(99,274),(73,278),(54,268),(55,246),(68,229)],
}
CUPS = {
    'K2': [(98,197),(110,195),(132,195),(143,198),(142,216),(135,227),(111,229),(101,220)],
    'K3': [(96,168),(109,165),(133,165),(143,169),(141,182),(136,196),(113,199),(102,191),(98,180)],
    'K5': [(98,225),(111,223),(133,223),(144,227),(141,246),(134,257),(112,258),(102,249)],
}
SIDE = [
    [(81,208),(105,218),(117,236),(139,239),(161,247),(161,269),(124,275),(96,270),(72,272),(63,257),(69,228)],
    [(151,209),(175,226),(198,237),(205,263),(191,282),(165,282),(155,266),(157,243)],
    [(141,233),(178,232),(185,238),(182,259),(171,268),(149,264)],
]


def mirror(poly):
    return [(239-x, y) for x, y in poly]


def mask(polys, feather=.7):
    image = Image.new('L', SIZE)
    draw = ImageDraw.Draw(image)
    for poly in polys:
        draw.polygon(poly, fill=255)
    if feather:
        image = image.filter(ImageFilter.GaussianBlur(feather))
    return image


def steam(raw, double=False):
    """Extract only the AI-painted neutral white curls, not underlying green hair."""
    arr = np.asarray(raw).copy()
    rgb = arr[:, :, :3].astype(float)
    yy, xx = np.indices(arr.shape[:2])
    region = (xx > np.where(yy < 160, 174, 154)) & (xx < (211 if double else 196)) & (yy > 118) & (yy < 180)
    # Existing AI steam is white over green; skin is warmer and is excluded.
    neutral = (np.abs(rgb[:,:,0]-rgb[:,:,1]) < 9) & (rgb[:,:,1]-rgb[:,:,2] < 21)
    opacity = np.clip((rgb.min(axis=2)-167)/70, 0, 1) * region * neutral * (arr[:,:,3]/255)
    result = np.full_like(arr, 255)
    result[:,:,3] = np.round(opacity*205).astype(np.uint8)
    # Re-anchor the existing AI-painted curl at the cup's right rim. Stretch
    # its outward drift so it clears the eye rather than starting on the hair.
    ys, xs = np.where(result[:,:,3] > 32)
    if not len(ys):
        raise RuntimeError('Steam extraction is empty')
    bottom = ys.max()
    anchor_x = float(xs[ys >= bottom-2].mean())
    sx, sy = 1.7, .55
    return Image.fromarray(result).transform(
        SIZE, Image.Transform.AFFINE,
        (1/sx, 0, anchor_x-136/sx, 0, 1/sy, bottom-168/sy),
        resample=Image.Resampling.BICUBIC, fillcolor=(0,0,0,0))


def retain_original_skirt(edited, original):
    """Keep the complete original skirt contour, not a polygon cut through it.

    The folded sipping sleeves end above this band. Below them, remove the
    old hanging sleeves but copy original skirt runs with their antialiasing.
    This mask contains only existing pixels; it paints no new contour.
    """
    source = np.asarray(original)
    restored = np.zeros_like(source)
    for y in range(245, 305):
        dark = (source[y, :, :3].max(axis=1) < 115) & (source[y, :, 3] > 0)
        if not dark[120]:
            continue
        left = right = 120
        while left > 0 and dark[left-1]:
            left -= 1
        while right < SIZE[0]-1 and dark[right+1]:
            right += 1
        # In the standing reference, hanging cuff outlines touch the skirt
        # in these rows. Keep only the skirt between its adjacent contours.
        if 282 <= y <= 288:
            left = max(left, round(70 - (y-281)*.5))
            right = min(right, round(164 + (y-281)*5/8))
        restored[y, left:right+1] = source[y, left:right+1]
    restored[305:] = source[305:]
    yy = np.indices(source.shape[:2])[0]
    weight = np.clip((yy-252)/8, 0, 1)
    weight = weight*weight*(3-2*weight)
    return Image.composite(Image.fromarray(restored), edited,
                           Image.fromarray(np.round(weight*255).astype('uint8')))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, required=True)
    args = parser.parse_args()
    original = Image.open(FRAMES/'stand.png').convert('RGBA')
    source = {k: Image.open(args.sources/v).convert('RGBA').resize(SIZE, Image.Resampling.LANCZOS)
              for k,v in RAW.items()}
    source['K3'] = retain_original_skirt(source['K3'], original)
    head_mask = mask([HEAD], 0)
    head_support = Image.fromarray(np.where(
        (np.asarray(head_mask) > 0) & (np.asarray(original)[:,:,3] > 0), 255, 0).astype('uint8'))
    keys = {'K1': original}
    report = {}
    for name in ['side', 'K2', 'K3', 'K5']:
        regions = [OLD_LEFT, mirror(OLD_LEFT)]
        regions += SIDE if name == 'side' else [LEFT[name], mirror(LEFT[name]), CUPS[name]]
        allowed = mask(regions, 1.5 if name == 'K3' else .7)
        # Sip uses the original raster contour above, with a soft interior band.
        # Do not clip its sleeve outlines with a hard skirt polygon.
        if name != 'K3':
            skirt = mask([[(92,249),(145,249),(157,270),(171,294),(150,305),(85,305),(66,294),(79,268)]], 0)
            occlusion = mask(SIDE if name == 'side' else [CUPS[name]], 0)
            keep_skirt = (np.asarray(skirt)/255)*(1-np.asarray(occlusion)/255)
            allowed = Image.fromarray(np.round(np.asarray(allowed)*(1-keep_skirt)).astype('uint8'))
        # Restore every head/hair pixel except actual cup/hand occlusion of chin.
        if name == 'K3':
            front = mask([CUPS[name], [(80,173),(108,173),(112,204),(80,205)],
                          [(134,173),(160,173),(160,205),(133,205)]])
        else:
            front = Image.new('L', SIZE)
        protected = np.asarray(head_support if name == 'K3' else head_mask).astype(float)/255
        exposed = np.asarray(front).astype(float)/255
        allowed = Image.fromarray(np.round(np.asarray(allowed)*(1-protected*(1-exposed))).astype('uint8'))
        # Feather occurs only at the shoulder seam within each single pose.
        # Animation never blends one pose with another.
        key = Image.composite(source[name], original, allowed)
        if name == 'K3':
            key_no_steam = key.copy()
            for target, double in [('K3', False), ('K4', True)]:
                vapor = steam(source[target], double)
                vapor.save(HERE/'keys'/f'{target}-steam.png')
                full_mask = Image.fromarray(np.maximum(np.asarray(allowed), np.asarray(vapor)[:,:,3]))
                full_mask.save(HERE/'masks'/f'{target}.png')
                keys[target] = Image.alpha_composite(key_no_steam, vapor)
            key_no_steam.save(HERE/'keys'/'sip-without-steam.png')
            continue
        allowed.save(HERE/'masks'/f'{name}.png')
        keys[name] = key
    Image.new('L', SIZE).save(HERE/'masks'/'K1.png')
    for name, key in keys.items():
        key.save(HERE/'keys'/f'{name}.png')
        allowed = np.asarray(Image.open(HERE/'masks'/f'{name}.png'))
        changed = np.any(np.asarray(key) != np.asarray(original), axis=2)
        outside = int(np.count_nonzero(changed & (allowed == 0)))
        if outside:
            raise RuntimeError(f'{name}: {outside} pixels changed outside mask')
        report[name] = {'outside_mask_changed_pixels': outside,
                        'mask_pixels': int(np.count_nonzero(allowed)),
                        'changed_pixels': int(changed.sum())}
    # Facial expressions are exclusively existing overlays, stored separately.
    eye_regions = [[(56,128),(66,121),(103,121),(108,134),(108,161),(100,168),(62,166),(55,151)],
                   [(127,121),(139,115),(174,116),(179,131),(178,158),(168,165),(129,163),(124,147)]]
    for expression in ['sleeping','happy']:
        face = Image.open(FRAMES/f'face-{expression}.png').convert('RGBA').resize((224,222), Image.Resampling.LANCZOS)
        face_layer = Image.new('RGBA', SIZE)
        face_layer.paste(face, (8,0))
        regions = eye_regions + ([[(102,162),(135,162),(139,180),(99,180)]] if expression == 'happy' else [])
        opacity = mask(regions, 1)
        face_layer.putalpha(Image.fromarray((np.asarray(face_layer)[:,:,3].astype(float)*np.asarray(opacity)/255).astype('uint8')))
        face_layer.save(HERE/'keys'/f'face-{expression}.png')
    # Foreground cup/hands must occlude the original head when it nods.
    front = mask([CUPS['K3'], [(80,173),(108,173),(112,205),(80,206)],
                  [(134,173),(160,173),(160,206),(133,206)]], .5)
    front.save(HERE/'masks'/'sip-front.png')
    mask([HEAD], 0).save(HERE/'masks'/'head.png')
    head_support.save(HERE/'masks'/'head-support.png')
    support_rgba = Image.new('RGBA', SIZE, (255,255,255,0))
    support_rgba.putalpha(head_support)
    support_rgba.save(HERE/'masks'/'head-support-alpha.png')
    for name in ['head','sip-front']:
        alpha=Image.open(HERE/'masks'/f'{name}.png').convert('L')
        rgba=Image.new('RGBA',SIZE,(255,255,255,0));rgba.putalpha(alpha)
        rgba.save(HERE/'masks'/f'{name}-alpha.png')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
