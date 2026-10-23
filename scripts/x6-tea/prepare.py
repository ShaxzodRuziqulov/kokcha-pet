"""X6 raster decomposition. Masks/transforms only; no painted anatomy.

python prepare.py --sources <01a166f0 generated_images directory>
"""
from pathlib import Path
import argparse
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
OUT = ROOT/'src/renderer/chibi/x6-tea/keys'
X5 = ROOT/'src/renderer/chibi/x5-tea'
SIZE = (239,400)


def mask(polys, feather=0):
    m = Image.new('L',SIZE)
    d = ImageDraw.Draw(m)
    for poly in polys: d.polygon(poly,fill=255)
    return m.filter(ImageFilter.GaussianBlur(feather)) if feather else m


def layer(im,m):
    a=np.array(im)
    a[:,:,3]=np.round(a[:,:,3].astype(float)*np.asarray(m)/255).astype('uint8')
    return Image.fromarray(a)


def main():
    p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);args=p.parse_args()
    OUT.mkdir(parents=True,exist_ok=True);(HERE/'masks').mkdir(exist_ok=True)
    original=Image.open(X5/'keys/K1.png').convert('RGBA')
    under=Image.open(args.sources/'exec-e6151213-b703-4323-86e6-d2de54198f58.png').convert('RGBA').resize(SIZE,Image.Resampling.LANCZOS)
    # Removing the head made the tool raise the entire sweater by 24px.
    # Register its collar/waist anchors back to the source; never use its legs.
    under=under.transform(SIZE,Image.Transform.AFFINE,(1,0,0,0,1,-24),Image.Resampling.BICUBIC)
    white=Image.open(args.sources/'exec-93ed6d13-941c-4aa9-b3b5-624a4620d090.png').convert('RGBA').resize(SIZE,Image.Resampling.LANCZOS)
    # Preserve the immutable source PNG byte-for-byte, including its palette.
    shutil.copyfile(X5/'keys/K1.png',OUT/'stand.png')
    head_mask=Image.open(X5/'masks/head.png').convert('L')
    shutil.copyfile(X5/'masks/head-alpha.png',OUT/'head-alpha.png')
    h=np.asarray(head_mask)
    # Roots follow diagonal strand boundaries; the back has an 8px hidden
    # overlap inside solid green hair. There is no horizontal head crop.
    tip=mask([[(0,167),(27,166),(48,178),(63,181),(81,196),(81,214),(0,214)],
              [(239,167),(212,166),(191,178),(176,181),(158,196),(158,214),(239,214)]])
    tips=np.asarray(tip)>0
    head_keep=Image.fromarray(np.where(tips,0,h).astype('uint8'))
    back_keep=Image.fromarray(np.minimum(h,np.asarray(tip.filter(ImageFilter.MaxFilter(17)))))
    layer(original,back_keep).save(OUT/'back-hair.png')
    head=layer(original,head_keep)
    # Only eye interiors are transferred from the AI blank-sclera underlayer.
    sclera=mask([[(65,144),(69,133),(78,128),(88,127),(98,133),(103,143),(102,154),(94,163),(82,165),(71,159)],
                  [(131,139),(135,128),(144,123),(152,124),(161,130),(166,141),(164,152),(154,160),(143,160),(134,153)]])
    eye_white=layer(white,sclera)
    head=Image.alpha_composite(head,eye_white)
    head.save(OUT/'head.png')
    # Iris artwork comes entirely from the source, including both highlights.
    iris_mask=Image.new('L',SIZE);d=ImageDraw.Draw(iris_mask)
    d.ellipse((75,128,102,163),fill=255);d.ellipse((135,123,163,159),fill=255)
    layer(original,iris_mask.filter(ImageFilter.GaussianBlur(.35))).save(OUT/'irises.png')
    rgba=Image.new('RGBA',SIZE,'white');rgba.putalpha(sclera);rgba.save(OUT/'sclera-alpha.png')
    # Fixed skirt and fixed lower body are independent layers. Preserve the
    # original skin immediately below the hem, not just dark skirt pixels.
    arr=np.asarray(original);skirt=np.zeros((400,239),dtype='uint8')
    for y in range(245,295):
        dark=(arr[y,:,:3].max(axis=1)<115)&(arr[y,:,3]>0)
        if not dark[120]:continue
        l=r=120
        while l>0 and dark[l-1]:l-=1
        while r<238 and dark[r+1]:r+=1
        if 282<=y<=288:l=max(l,round(70-(y-281)*.5));r=min(r,round(164+(y-281)*5/8))
        skirt[y,l:r+1]=255
    layer(original,Image.fromarray(skirt)).save(OUT/'skirt.png')
    legmask=np.zeros_like(skirt);legmask[295:]=255
    layer(original,Image.fromarray(legmask)).save(OUT/'legs.png')
    lower_mask=np.maximum(skirt,legmask)
    layer(original,Image.fromarray(lower_mask)).save(OUT/'lower.png')
    # Complete AI neck/collar/shoulders behind the original torso pixels.
    torso_region=mask([[(65,208),(174,208),(174,247),(158,268),(80,268),(65,247)]],1)
    under_torso=layer(under,torso_region)
    core=mask([[(96,207),(143,207),(154,241),(143,254),(95,254),(85,241)]],2)
    torso=Image.alpha_composite(under_torso,layer(original,core))
    torso.save(OUT/'torso.png')
    collar_region=mask([[(92,160),(148,160),(174,200),(174,229),(65,229),(65,200)]],1)
    collar=layer(under,collar_region)
    original_collar=mask([[(97,184),(143,184),(146,204),(139,212),(101,212),(93,204)]],.8)
    collar=Image.alpha_composite(collar,layer(original,original_collar))
    collar.save(OUT/'collar.png')
    old=[(87,210),(89,237),(82,264),(80,294),(49,301),(11,301),(9,265),(29,239),(69,211)]
    mirror=lambda poly:[(239-x,y) for x,y in poly]
    left={
      'K2':[(84,199),(110,206),(112,232),(96,256),(81,271),(58,274),(46,263),(48,237),(65,216)],
      'K3':[(77,193),(82,170),(106,169),(115,182),(114,210),(102,235),(97,248),(82,257),(58,256),(44,246),(41,232),(46,207),(62,195)],
      'K5':[(86,214),(110,228),(113,252),(99,274),(73,278),(54,268),(55,246),(68,229)]}
    cups={'K2':[(98,197),(110,195),(132,195),(143,198),(142,216),(135,227),(111,229),(101,220)],
          'K3':[(96,168),(109,165),(133,165),(143,169),(141,182),(136,196),(113,199),(102,191),(98,180)],
          'K5':[(98,225),(111,223),(133,223),(144,227),(141,246),(134,257),(112,258),(102,249)]}
    side=[[(81,208),(105,218),(117,236),(139,239),(161,247),(161,269),(124,275),(96,270),(72,272),(63,257),(69,228)],
          [(151,209),(175,226),(198,237),(205,263),(191,282),(165,282),(155,266),(157,243)],
          [(141,233),(178,232),(185,238),(182,259),(171,268),(149,264)]]
    for name in ['K1','side','K2','K3','K5']:
        src=Image.open(X5/'keys'/('sip-without-steam.png' if name=='K3' else f'{name}.png')).convert('RGBA')
        polys=[old,mirror(old)] if name=='K1' else side if name=='side' else [left[name],mirror(left[name]),cups[name]]
        # Selection ends outside the natural raster contour. Feather only the
        # interior shoulder overlap, never shave an opaque sleeve silhouette.
        selected=mask(polys).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(1.2))
        m=np.asarray(selected).astype(float)
        support=(np.asarray(original)[:,:,3]>0)&(h>0)
        if name=='K3':
            front=mask([cups[name],[(80,173),(108,173),(112,205),(80,206)],[(134,173),(160,173),(160,206),(133,206)]],.5)
            # A separate clean cup/hands raster replaces the occluding front;
            # never carry source cheek/hair pixels with a moving teacup.
            clean=Image.open(args.sources/'exec-abb04abd-b04f-487e-882e-97f573f7d46e.png').convert('RGBA').resize(SIZE,Image.Resampling.LANCZOS)
            clean=clean.transform(SIZE,Image.Transform.AFFINE,(1/.52,0,-57.36/.52,0,1/.52,-87.5/.52),Image.Resampling.BICUBIC)
            clean.save(OUT/'sip-front.png')
            m*=1-np.asarray(mask([[(77,162),(163,162),(163,211),(77,211)]],1))/255
        m[support]=0
        # Keep dark outlines adjacent to actual cloth/skin/cup paint, while
        # removing black skirt fragments contained by broad selection masks.
        rgb=np.asarray(src)[:,:,:3].astype(float)
        paint=((rgb[:,:,1]>rgb[:,:,0]*1.12)&(rgb[:,:,1]>rgb[:,:,2]*1.08))|((rgb[:,:,0]>150)&(rgb[:,:,1]>125)&(rgb[:,:,2]>85))
        paint=Image.fromarray((paint*255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
        m*=np.asarray(paint)/255
        if name=='K1':m[skirt>0]=0
        layer(src,Image.fromarray(np.round(m).astype('uint8'))).save(OUT/f'arms-{name}.png')
    for n in ['face-sleeping','face-happy','K3-steam','K4-steam']:
        shutil.copyfile(X5/f'keys/{n}.png',OUT/f'{n}.png')
    head_keep.save(HERE/'masks/front-head.png');back_keep.save(HERE/'masks/back-hair.png')
    sclera.save(HERE/'masks/sclera.png');torso_region.save(HERE/'masks/torso.png');collar_region.save(HERE/'masks/collar.png')


if __name__=='__main__':main()
