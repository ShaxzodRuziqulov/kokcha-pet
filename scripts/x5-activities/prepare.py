"""Prepare X5 raster layers. No anatomy or prop is painted by this script.

python prepare.py --sources <Codex generated_images directory>
Only the image-tool edits inside feathered local masks are transferred.
Preparation masks/provenance stay outside src and the packaged application.
"""
from pathlib import Path
import argparse
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = ROOT/'src/renderer/chibi/x5-activities/keys'
W, H = 399, 400
SIZE = (W, H)


def mask(polys, feather=1.5):
    result = Image.new('L', SIZE)
    d = ImageDraw.Draw(result)
    for poly in polys:
        d.polygon(poly, fill=255)
    return result.filter(ImageFilter.GaussianBlur(feather)) if feather else result


def rgba_mask(image, opacity):
    a = np.asarray(image).copy()
    a[:, :, 3] = np.round(a[:, :, 3].astype(float)*np.asarray(opacity)/255).astype('uint8')
    return Image.fromarray(a)


def save_layer(image, opacity, name):
    layer = rgba_mask(image, opacity)
    layer.save(OUT/f'{name}.png')
    return layer


def skirt_support(original):
    """The original raster contour, including antialiasing, not a polygon hem."""
    a = np.asarray(original)
    support = np.zeros((H, W), dtype='uint8')
    for y in range(249, 305):
        dark = (a[y, :, :3].max(axis=1) < 115) & (a[y, :, 3] > 0)
        left = right = 200
        while left > 0 and dark[left-1]: left -= 1
        while right < W-1 and dark[right+1]: right += 1
        if 282 <= y <= 288:
            left = max(left, 80+round(70-(y-281)*.5))
            right = min(right, 80+round(164+(y-281)*5/8))
        support[y, left:right+1] = 255
    support[305:, 80:319] = 255
    return support


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, required=True)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    (HERE/'masks').mkdir(exist_ok=True)
    original = Image.open(HERE/'reference.png').convert('RGBA')
    files = json.loads((HERE/'prompts.json').read_text(encoding='utf-8'))['outputs']
    raw = {k: Image.open(args.sources/v).convert('RGBA').resize(SIZE, Image.Resampling.LANCZOS)
           for k, v in files.items()}
    # Isolated image-tool components include the sleeve hidden under the hair.
    # Restore the head AFTER moving these complete arms, never trim them first.
    raw['wave'] = raw['waveArm'].transform(SIZE,Image.Transform.AFFINE,
        (1/.65,0,226-169/.65,0,1/.65,244-215/.65),Image.Resampling.BICUBIC
        ).rotate(20,resample=Image.Resampling.BICUBIC,center=(169,215))
    stretch = Image.new('RGBA',SIZE)
    for x0,x1,dx in [(0,200,22),(200,W,-22)]:
        part=Image.new('RGBA',SIZE);part.paste(raw['stretchArms'].crop((x0,0,x1,H)),(x0,0))
        stretch.alpha_composite(part,(dx,0))
    raw['stretch'] = stretch
    head_shape = mask([[(80,0),(319,0),(319,212),(237,212),(230,190),(223,184),
                        (176,184),(169,190),(161,212),(80,212)]], 0)
    head_support = np.where((np.asarray(head_shape)>0) & (np.asarray(original)[:,:,3]>0),255,0).astype('uint8')
    save_layer(original, head_shape, 'head')
    original.save(OUT/'stand.png')
    skirt = skirt_support(original)
    # An overlap band lies inside the original shirt, hidden by the body layer.
    left = [(167,202),(177,220),(166,246),(161,274),(163,301),(92,306),(84,263),(112,232),(149,206)]
    right = [(W-x,y) for x,y in left]
    old_masks = {'wave':[left], 'read':[left,right], 'water':[right], 'stretch':[left,right]}
    regions = {
      'wave': [[(35,130),(119,130),(170,185),(180,242),(110,245),(52,210),(35,180)]],
      'read': [[(115,204),(169,201),(201,211),(229,201),(280,211),(286,287),(237,289),(227,271),(165,271),(151,288),(115,288)]],
      'water': [[(231,202),(280,205),(307,225),(316,253),(345,252),(347,279),(294,286),(251,265),(231,244)]],
      'stretch': [[(36,43),(91,42),(144,99),(178,191),(177,236),(142,232),(112,187),(79,147),(48,115)],
                  [(363,43),(308,42),(255,99),(221,191),(222,236),(257,232),(287,187),(320,147),(351,115)]]
    }
    report = {}
    for name in ['wave','read','water','stretch']:
        old = np.asarray(mask(old_masks[name])).astype(float)/255
        # The original torso and skirt remain opaque. Only hanging arms vanish.
        body_keep = mask([[(174,200),(225,200),(239,242),(238,251),(159,251),(159,242)]], 1.5)
        protected = np.maximum(head_support, np.maximum(skirt, np.asarray(body_keep))) / 255
        erase = old*(1-protected)
        clean = np.asarray(original).copy()
        clean[:,:,3] = np.round(clean[:,:,3]*(1-erase)*(1-head_support/255)).astype('uint8')
        Image.fromarray(clean).save(OUT/f'{name}-body.png')
        arm = np.asarray(mask(regions[name])).astype(float)
        if name in ['wave','stretch']:
            arm = np.asarray(raw[name].getchannel('A').filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(1.5))).astype(float)
        # Generated head pixels are never used. Reading book may cover the shirt/skirt.
        prop = np.asarray(mask([[(144,200),(254,200),(255,269),(144,269)]],1)) if name=='read' else np.zeros((H,W))
        arm *= (1-head_support/255)*(1-protected*(1-prop/255))
        arm_mask = Image.fromarray(np.round(arm).astype('uint8'))
        if name=='stretch':
            for side, x0, x1 in [('left',0,200),('right',200,W)]:
                m = np.full((H,W),255,dtype='uint8');m[:,:x0]=0;m[:,x1:]=0
                save_layer(raw[name], Image.fromarray(m), f'{name}-{side}')
        elif name=='wave':
            raw[name].save(OUT/'wave-arms.png')
        else:
            save_layer(raw[name], arm_mask, f'{name}-arms')
        # Static keys are audited separately from the animated layer transforms.
        allowed = np.maximum(np.asarray(arm_mask), np.round(erase*255).astype('uint8'))
        if name=='water':
            # The complete audited key also includes the separate runtime props.
            props = mask([[(298,274),(365,274),(365,399),(298,399)]], .7)
            allowed = np.maximum(allowed,np.asarray(props))
        pose = Image.composite(raw[name], original, Image.fromarray(allowed))
        pose.save(OUT/f'{name}-key.png')
        Image.fromarray(allowed).save(HERE/'masks'/f'{name}.png')
        changed = np.any(np.asarray(pose)!=np.asarray(original),axis=2)
        outside = int(np.count_nonzero(changed & (allowed==0)))
        assert outside==0
        feet = np.zeros((H,W),dtype=bool)
        feet[305:]=(np.asarray(original)[305:,:,3]>0)
        report[name] = {'outside_mask_changed_pixels':outside,
                        'feather_values':int(len(np.unique(allowed[(allowed>0)&(allowed<255)]))),
                        'original_feet_equal':bool(np.array_equal(np.asarray(pose)[feet],np.asarray(original)[feet]))}
    # Page turn is a local patch, the exact same hands/book covers are retained.
    page_mask = mask([[(173,184),(186,186),(204,207),(208,226),(195,228),(182,211)]],1)
    save_layer(raw['page'], page_mask, 'read-page')
    # Extract painted water separately. The stream begins at the can nozzle.
    flow_mask = mask([[(330,272),(341,271),(360,306),(360,353),(342,353),(342,311)]],0)
    rgb = np.asarray(raw['water'])[:,:,:3].astype(float)
    blue = (rgb[:,:,2]>rgb[:,:,0]+12) & (rgb[:,:,2]>rgb[:,:,1])
    flow = np.asarray(flow_mask)*blue
    save_layer(raw['water'],Image.fromarray(flow.astype('uint8')),'water-stream')
    # The AI-painted white droplets are also stored separately. The player
    # scrolls these existing raster glints inside the stream's alpha support.
    bright = np.clip((rgb[:,:,0]-195)/45,0,1)*np.clip((rgb[:,:,1]-220)/25,0,1)
    save_layer(raw['water'],Image.fromarray(np.round(flow*bright).astype('uint8')),'water-drops')
    # Pot stays fixed; only its raster flower/stem layer sways around soil level.
    pot_mask = mask([[(299,349),(364,349),(364,399),(299,399)]],0)
    flower_mask = mask([[(297,291),(343,291),(349,329),(340,350),(299,350)]],0)
    save_layer(raw['water'],pot_mask,'water-pot')
    flower_mask = Image.fromarray(np.where(blue,0,np.asarray(flower_mask)).astype('uint8'))
    save_layer(raw['water'],flower_mask,'water-flower')
    # Reuse existing expression artwork; never redraw a face.
    happy = Image.open(ROOT/'src/renderer/chibi/x5-tea/keys/face-happy.png').convert('RGBA')
    sleeping = Image.open(ROOT/'src/renderer/chibi/x5-tea/keys/face-sleeping.png').convert('RGBA')
    for name,face in [('happy',happy),('sleeping',sleeping)]:
        expanded=Image.new('RGBA',SIZE);expanded.alpha_composite(face,(80,0));expanded.save(OUT/f'face-{name}.png')
    # Source eye crops include the surrounding skin so moving them never leaves
    # a second iris behind. Eyebrows stay fixed; no new eye artwork is painted.
    eye_mask=mask([[(134,130),(149,122),(175,121),(190,130),(193,147),
                    (187,164),(171,169),(147,166),(135,153)],
                   [(205,126),(219,118),(243,119),(255,129),(256,148),
                    (245,164),(220,167),(207,155)]],2)
    save_layer(original,eye_mask,'eyes')
    print(json.dumps(report,indent=2))


if __name__=='__main__': main()
