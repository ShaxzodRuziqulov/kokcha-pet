"""Reuse reviewed X5 activity artwork and X6 tea's AI hidden underlayers.

No new anatomy/contour is drawn. python -B scripts/x6-activities/prepare.py
"""
from pathlib import Path
import shutil
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
X5=ROOT/'src/renderer/chibi/x5-activities/keys'
TEA=ROOT/'src/renderer/chibi/x6-tea/keys'
OUT=ROOT/'src/renderer/chibi/x6-activities/keys'


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(X5/'stand.png',OUT/'stand.png')
    for name in ['head','head-alpha','back-hair','collar','torso','lower','irises','sclera-alpha','face-happy','face-sleeping','arms-K1']:
        original=Image.open(TEA/f'{name}.png').convert('RGBA')
        expanded=Image.new('RGBA',(399,400));expanded.alpha_composite(original,(80,0))
        expanded.save(OUT/f'{name}.png')
    neutral=Image.open(OUT/'arms-K1.png').convert('RGBA')
    for side in ['left','right']:
        a=np.array(neutral)
        if side=='left':a[:,200:,3]=0
        else:a[:,:200,3]=0
        Image.fromarray(a).save(OUT/f'neutral-{side}.png')
    for name in ['wave-arms','read-arms','read-page','water-arms','water-stream','water-drops','water-pot','water-flower','stretch-left','stretch-right']:
        shutil.copyfile(X5/f'{name}.png',OUT/f'{name}.png')


if __name__=='__main__':main()
