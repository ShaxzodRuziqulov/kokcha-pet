"""Bake a deterministic gait from the original artwork (requires Pillow).

Original upper-body pixels plus a small articulated, code-drawn lower-body rig.
No runtime pixel scans or generated character replacements.
Run from any directory: python scripts/build-chibi-walk.py
"""
from pathlib import Path
import json
import math
from PIL import Image, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parents[1]
CHIBI = ROOT / 'src/renderer/chibi'
SOURCE = Image.open(CHIBI / 'frames/walk-a.png').convert('RGBA')
SIZE = (300, 400)
COUNT = 12
FPS = 20
BASELINE = 398
BOB = [2, 1, 0, -1, 0, 1] * 2


def masked(points):
    mask = Image.new('L', SOURCE.size)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    layer = SOURCE.copy()
    layer.putalpha(ImageChops.multiply(SOURCE.getchannel('A'), mask))
    return layer


def transform(layer, source_pivot, target_pivot, angle, scale=1):
    c, s = math.cos(angle)/scale, math.sin(angle)/scale
    dx,dy = target_pivot
    sx,sy = source_pivot
    return layer.transform(SIZE, Image.Transform.AFFINE,
        (c,s,sx-c*dx-s*dy,-s,c,sy+s*dx-c*dy), Image.Resampling.BICUBIC)


UPPER = masked([(0,0),(271,0),(271,302),(197,302),(189,308),
    (172,313),(153,311),(149,313),(129,310),(119,305),(112,307),
    (100,303),(83,297),(0,297)])

# Leg ownership never changes: the near leg is always painted over the far leg.
SPECS = [
    dict(name='far',target_x=132,phase=.5),
    dict(name='near',target_x=158,phase=0),
]


def render_leg(spec, phase, bob):
    p=(phase+spec['phase']) % 1
    planted=p<.5
    if planted:
        progress=p*2
        x=36-72*progress
        lift=0
        pitch=0
    else:
        progress=(p-.5)*2
        # The swing starts/ends with zero horizontal velocity: no snap at contact.
        smooth=progress*progress*(3-2*progress)
        x=-36+72*smooth
        lift=24*math.sin(math.pi*progress)
        pitch=-18*math.sin(math.pi*progress)
    hip=(14+spec['target_x'],2+310+bob)
    ankle_x=14+spec['target_x']+x
    foot_angle=math.radians(pitch)
    far=spec['name']=='far'
    foot_scale=.9 if far else 1
    foot_points=[(-13,-9),(11,-9),(12,8),(20,10),(29,8),(38,12),
                 (42,19),(41,25),(35,29),(10,32),(-12,32),(-16,29),(-17,19),(-15,8)]
    def foot_xy(point):
        x,y=point
        return ((x*math.cos(foot_angle)-y*math.sin(foot_angle))*foot_scale,
                (x*math.sin(foot_angle)+y*math.cos(foot_angle))*foot_scale)
    ankle_y=BASELINE-max(foot_xy(p)[1] for p in foot_points)-1-lift
    ankle=(ankle_x,ankle_y)
    dx,dy=ankle[0]-hip[0],ankle[1]-hip[1]
    distance=math.hypot(dx,dy)
    # Fixed bone lengths, with a tiny safety extension for antialiasing at contact.
    l1,l2=36,32
    if distance>l1+l2-.2:
        extension=distance/(l1+l2-.2)
        l1*=extension; l2*=extension
    along=(l1*l1-l2*l2+distance*distance)/(2*distance)
    perpendicular=math.sqrt(max(0,l1*l1-along*along))
    knee=(hip[0]+dx/distance*along+dy/distance*perpendicular,
          hip[1]+dy/distance*along-dx/distance*perpendicular)
    # Supersampled rounded joints avoid clipped raster knees and changing leg ownership.
    aa=3
    out=Image.new('RGBA',(SIZE[0]*aa,SIZE[1]*aa))
    draw=ImageDraw.Draw(out)
    def coords(points): return [(round(x*aa),round(y*aa)) for x,y in points]
    def stroke(points,fill,width):
        draw.line(coords(points),fill=fill,width=round(width*aa),joint='curve')
    def circle(point,r,fill):
        x,y=point
        draw.ellipse(((x-r)*aa,(y-r)*aa,(x+r)*aa,(y+r)*aa),fill=fill)
    line='#171b14'
    skin='#edcbbb' if far else '#fbe2d4'
    green='#6eaa4c' if far else '#91c867'
    radius=11.5 if far else 12
    stroke([hip,knee,ankle],line,radius*2+5)
    circle(knee,radius+2.5,line)
    stroke([hip,knee,ankle],skin,radius*2)
    circle(knee,radius,skin)
    sock_top=(ankle[0]+(knee[0]-ankle[0])*.8,ankle[1]+(knee[1]-ankle[1])*.8)
    stroke([sock_top,ankle],green,radius*2)
    shin_dx,shin_dy=ankle[0]-knee[0],ankle[1]-knee[1]
    shin_len=math.hypot(shin_dx,shin_dy)
    normal=(-shin_dy/shin_len,shin_dx/shin_len)
    stroke([(sock_top[0]-normal[0]*radius,sock_top[1]-normal[1]*radius),
            (sock_top[0]+normal[0]*radius,sock_top[1]+normal[1]*radius)],line,1.4)
    for offset in [-6,0,6]:
        stroke([(sock_top[0]+normal[0]*offset,sock_top[1]+normal[1]*offset),
                (ankle[0]+normal[0]*offset,ankle[1]+normal[1]*offset)],'#558841',.65)
    # Round the leather outline at each corner rather than changing the boot shape per frame.
    rounded=[]
    for i,current in enumerate(foot_points):
        previous=foot_points[i-1]; following=foot_points[(i+1)%len(foot_points)]
        start=(current[0]*.8+previous[0]*.2,current[1]*.8+previous[1]*.2)
        end=(current[0]*.8+following[0]*.2,current[1]*.8+following[1]*.2)
        for j in range(5):
            t=j/4
            rounded.append(((1-t)**2*start[0]+2*(1-t)*t*current[0]+t*t*end[0],
                            (1-t)**2*start[1]+2*(1-t)*t*current[1]+t*t*end[1]))
    boot=[(ankle[0]+foot_xy(p)[0],ankle[1]+foot_xy(p)[1]) for p in rounded]
    draw.polygon(coords(boot),fill='#292929' if far else '#303030')
    stroke(boot+[boot[0]],line,2.5)
    def boot_line(points,color,width):
        stroke([(ankle[0]+foot_xy(p)[0],ankle[1]+foot_xy(p)[1]) for p in points],color,width)
    boot_line([(-14,24),(-8,28),(10,28),(34,25),(40,22)],'#12160f',1.5)
    boot_line([(-11,-5),(9,-5),(10,12)],'#131710',1.3)
    boot_line([(-6,1),(4,3),(-5,7),(5,9)],'#161a13',1.2)
    out=out.resize(SIZE,Image.Resampling.LANCZOS)
    return out,dict(name=spec['name'],planted=planted,hip=list(hip),knee=list(knee),ankle=list(ankle))


def main():
    target=CHIBI/'pilot/walk'
    target.mkdir(exist_ok=True)
    audits=[]
    for i in range(COUNT):
        canvas=Image.new('RGBA',SIZE)
        legs=[]
        for spec in SPECS:
            layer,info=render_leg(spec,i/COUNT,BOB[i])
            canvas.alpha_composite(layer); legs.append(info)
        canvas.alpha_composite(transform(UPPER,(0,0),(14,2+BOB[i]),0))
        canvas.save(target/f'{i:02}.webp',lossless=True,method=6)
        alpha=canvas.getchannel('A').point(lambda v:255 if v>24 else 0)
        audits.append(dict(frame=i,baseline=alpha.getbbox()[3]-1,legs=legs))
    metadata=dict(status='runtime',fps=FPS,loop=True,width=300,height=400,
        baseline=BASELINE,neutralOnly=True,
        frames=[f'walk/{i:02}.webp' for i in range(COUNT)],
        canonicalHead='Original walk-a upper body at x14,y2 + headBobPx; no head replacement',
        source='Original walk-a.png upper body; code-drawn articulated legs, socks and boots; generated atlas rejected',
        headBobPx=BOB,cycleSeconds=COUNT/FPS,strideSourcePx=72,
        builder='scripts/build-chibi-walk.py',
        rig=dict(thighPx=36,shinPx=32,nearHipX=158,farHipX=132,hipY=310,
                 swingLiftPx=24,swingPitchDegrees=-18,
                 layering=['far','near','original-upper-body']))
    (CHIBI/'pilot/walk.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
    manifest_path=CHIBI/'frames/manifest.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8-sig'))
    for key in list(manifest['frames']):
        if key.startswith('walk-seq-'): del manifest['frames'][key]
    for i in range(COUNT):
        manifest['frames'][f'walk-seq-{i:02}']=dict(src=f'pilot/walk/{i:02}.webp',
            width=300,height=400,head=265.53465346534654,sequenceOnly=True,
            blink=dict(source='walk-a',x=14,y=2+BOB[i]))
    manifest['slots']['walk'].update(frames=[f'walk-seq-{i:02}' for i in range(COUNT)],fps=FPS)
    manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps(dict(frames=COUNT,fps=FPS,baselines=[a['baseline'] for a in audits],
        bytes=sum((target/f'{i:02}.webp').stat().st_size for i in range(COUNT)))))


if __name__=='__main__': main()
