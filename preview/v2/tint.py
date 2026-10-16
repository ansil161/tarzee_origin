"""Dominant-colour tints for v2. tint(file) -> (#light, #deep). Cached in v2/tints.json."""
import json, os, colorsys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'theme', 'assets')
CACHE = os.path.join(HERE, 'tints.json')
_c = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
def _hex(r, g, b): return '#%02x%02x%02x' % (int(r), int(g), int(b))
def tint(name):
    if name in _c: return _c[name]
    im = Image.open(os.path.join(SRC, name)).convert('RGB'); im.thumbnail((96, 96))
    q = im.quantize(8, method=Image.Quantize.MEDIANCUT).convert('RGB')
    counts = sorted(q.getcolors(), reverse=True)
    best, score = None, -1
    for n, (r, g, b) in counts:
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        sc = n * (s ** 1.6 + 0.02) * (1.0 if 0.22 < v < 0.95 else 0.2)   # prefer frequent, coloured, not black/white
        if sc > score: best, score = (r, g, b), sc
    h, sat, v = colorsys.rgb_to_hsv(*[c / 255 for c in best])
    light = _hex(*[x * 255 for x in colorsys.hsv_to_rgb(h, min(max(sat, .25) * .62, .55), .93)])
    deep = _hex(*[x * 255 for x in colorsys.hsv_to_rgb(h, min(sat + .1, .9), .30)])
    _c[name] = [light, deep]
    json.dump(_c, open(CACHE, 'w'))
    return _c[name]
if __name__ == '__main__':
    import sys
    for n in sys.argv[1:]: print(n, tint(n))
