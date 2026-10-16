"""Terzee Origins v2: a new storefront design, built beside (never inside) the current theme/preview.
Run:  python v2/build.py   then serve the v2 folder:  cd v2 && python -m http.server 8770
Pages: index.html, shop.html, product-<handle>.html. Images are copied from theme/assets on demand.
"""
import json, os, shutil, html, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from tint import tint

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'theme', 'assets')
OUT = os.path.join(HERE, 'assets')
os.makedirs(OUT, exist_ok=True)

cat = [p for p in json.load(open(os.path.join(ROOT, 'media-src', 'catalog.json'), encoding='utf-8')) if not p.get('hidden')]
P = {p['handle']: p for p in cat}
ORDER = ['lattice-zip-jacket', 'diamond-jaal-bomber', 'katran-club', 'archive-patchwork-jacket', 'jaal-pocket-camp-shirt', 'gali-culture']
ORDER = [h for h in ORDER if h in P]
N_J = sum(1 for h in ORDER if P[h]['type'] == 'Jackets'); N_S = sum(1 for h in ORDER if P[h]['type'] == 'Shirts')
e = html.escape
_used = set()

def A(name, small=False):
    """Register an asset for copying and return its v2 path. small=True prefers the -800 variant when it exists."""
    if small and name.endswith('.jpg'):
        s = name[:-4] + '-800.jpg'
        if os.path.exists(os.path.join(SRC, s)): name = s
    _used.add(name)
    return 'assets/' + name

LOOK_NAMES = ['Study', 'Concrete', 'Studio', 'Rooftop', 'Velvet lounge', 'Library', 'Last light', 'Wood room', 'Blue velvet', 'Hallway', 'Billiard room',
              'Stone hall', 'Blue room', 'Gilded room', 'Window seat', 'Roadside dusk', 'Green velvet', 'Portrait room']
def L(i, small=False): return f'assets/looks/look-{i:02d}{"-s" if small else ""}.jpg'
def Lt(i): return tint(os.path.join(HERE, 'assets', 'looks', f'look-{i:02d}-s.jpg'))[0]

def money(n): return '₹' + f'{n:,}'
def hero(p, i=0):
    h = p.get('hero') or []
    return h[min(i, len(h) - 1)]
def href(h): return f'product-{h}.html'

ICON = lambda n, cls='': f'<i class="ph-light ph-{n} {cls}" aria-hidden="true"></i>'
BTN_ARROW = '<span class="btn__dot">' + ICON('arrow-up-right') + '</span>'
def btn(label, url, kind='ink', extra=''):
    return f'<a class="btn btn--{kind}" href="{url}" {extra}><span>{label}</span>{BTN_ARROW}</a>'

# ---------------------------------------------------------------- shell
def head(title, body=''):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#FFFFFF">
<title>{e(title)} | Terzee Origins</title>
<link rel="icon" type="image/png" href="{A('ze-monogram-black.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Manrope:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/light/style.css">
<script>document.documentElement.classList.add("js")</script>
<link rel="stylesheet" href="assets/v2.css">
</head>
<body class="{body}">
<a class="skip" href="#main">Skip to content</a>
'''

NAV = [('Shop', 'shop.html'), ('Lookbook', 'index.html#lookbook'), ('About', 'about.html')]

def header(solid=False):
    links = ''.join(f'<a href="{u}">{t}</a>' for t, u in NAV)
    return f'''<header class="hdr{' is-solid' if solid else ''}" data-hdr>
  <div class="hdr__pill">
    <button class="hdr__burger" data-menu-open aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
    <nav class="hdr__nav" aria-label="Primary">{links}</nav>
    <a class="hdr__logo" href="index.html" aria-label="Terzee Origins"><img src="{A('wordmark-terzee-black.png')}" alt="Terzee Origins" width="220" height="64"></a>
    <div class="hdr__tools">
      <a class="hdr__tool hdr__tool--search" href="shop.html" aria-label="Search the shop">{ICON('magnifying-glass')}</a>
      <button class="hdr__tool hdr__bag" data-cart-open aria-label="Open bag">{ICON('handbag')}<b data-cart-count>0</b></button>
    </div>
  </div>
</header>
<div class="menu" data-menu aria-hidden="true">
  <nav class="menu__nav" aria-label="Menu">{''.join(f'<a href="{u}" style="--d:{i * 70 + 120}ms">{t}</a>' for i, (t, u) in enumerate(NAV))}</nav>
  <button class="menu__close" data-menu-close aria-label="Close menu">{ICON('x')}</button>
</div>
<aside class="bag" data-bag aria-hidden="true" aria-label="Bag">
  <div class="bag__scrim" data-cart-close></div>
  <div class="bag__panel">
    <div class="bag__head"><h2>Your bag</h2><button data-cart-close aria-label="Close bag">{ICON('x')}</button></div>
    <div class="bag__lines" data-cart-lines></div>
    <div class="bag__foot"><div class="bag__sub"><span>Subtotal</span><b data-cart-subtotal>{money(0)}</b></div>
      <button class="btn btn--ink btn--full" type="button" data-checkout><span>Checkout</span>{BTN_ARROW}</button></div>
  </div>
</aside>
<main id="main">'''

def footer():
    return f'''</main>
<footer class="ftr">
  <div class="wrap ftr__grid">
    <div class="ftr__about"><p>Black cloth, worked by hand. Block print, patchwork and frayed appliqué, cut and sewn in small runs.</p></div>
    <div><h4>Shop</h4><ul><li><a href="shop.html">All pieces</a></li><li><a href="shop.html?t=Jackets">Jackets</a></li><li><a href="shop.html?t=Shirts">Shirts</a></li></ul></div>
    <div><h4>Terzee</h4><ul><li><a href="about.html">About</a></li><li><a href="index.html#lookbook">Lookbook</a></li><li><a href="index.html#craft">Craft</a></li><li><a href="index.html#join">Newsletter</a></li></ul></div>
    <div><h4>Follow</h4><ul><li><a href="#">Instagram</a></li><li><a href="#">WhatsApp</a></li><li><a href="mailto:hello@terzeeorigins.com">hello@terzeeorigins.com</a></li></ul></div>
  </div>
  <div class="wrap ftr__mark"><img src="assets/wordmark-terzee-white.png" alt="Terzee"></div>
  <div class="wrap ftr__base"><span>© 2026 Terzee Origins</span><span>Shipping, returns and size guide on request</span></div>
</footer>
<script src="../assets/version-toggle.js"></script><script src="assets/data.js"></script><script src="assets/v2.js" defer></script>
</body></html>'''

# ---------------------------------------------------------------- shared cards
def card(h, i=0):
    p = P[h]
    a, b = hero(p, 0), hero(p, 1)
    t = tint(a)[0]
    tag = {'lattice-zip-jacket': 'New drop'}.get(h, '')
    sizes = ''.join(f'<button type="button" data-add data-handle="{h}" data-size="{s}">{s}</button>' for s in ['S', 'M', 'L', 'XL'])
    return f'''<article class="pc" data-type="{e(p['type'])}" style="--t:{t}">
  <div class="pc__m">
    <a class="pc__media" href="{href(h)}" aria-label="{e(p['title'])}">
      <img class="pc__img" src="{A(a, True)}" alt="{e(p['title'])} worn on model" loading="lazy" width="800" height="1000">
      <img class="pc__img pc__img--alt" src="{A(b, True)}" alt="" loading="lazy" width="800" height="1000">
      {f'<span class="tag">{tag}</span>' if tag else ''}
    </a>
    <div class="pc__qa" aria-label="Quick add">{sizes}</div>
  </div>
  <div class="pc__info"><div><h3><a href="{href(h)}">{e(p['title'])}</a></h3><p>{e(p['tag'])}</p></div><span class="pc__price">{money(p['price'])}</span></div>
</article>'''

# ---------------------------------------------------------------- home
HERO_SLIDES = [('diamond-jaal-bomber', 'diamond-jaal-bomber-hero-2.jpg'), ('archive-patchwork-jacket', 'archive-patchwork-jacket-hero-2.jpg'),
               ('jaal-pocket-camp-shirt', 'jaal-pocket-camp-shirt-hero-1.jpg'), ('gali-culture', 'gali-culture-hero-1.jpg'), ('lattice-zip-jacket', 'lattice-zip-jacket-hero-2.jpg')]
ROT = [-5, 3, -2, 4, -4]; LIFT = [10, 0, 14, 2, 8]
WM = '<text x="0" y="215" font-family="Audiowide, sans-serif" font-size="300" font-weight="400">TERZEE</text>'

def home():
    cards, imgs = [], []
    for k, (h, f) in enumerate(HERO_SLIDES):
        p = P[h]; t, d = tint(f)
        imgs.append(f'<image class="wm__img{" is-on" if k == 0 else ""}" href="{A(f)}" x="0" y="-300" width="1100" height="1375" preserveAspectRatio="xMidYMid slice"/>')
        cards.append(f'<button class="deck__card{" is-on" if k == 0 else ""}" type="button" data-slide="{k}" data-tint="{t}" data-name="{e(p["title"])}" data-price="{money(p["price"])}" data-url="{href(h)}" style="--rot:{ROT[k]}deg;--y:{LIFT[k]}px;--t:{t}" aria-label="Show {e(p["title"])}"><img src="{A(f, True)}" alt="" width="170" height="213" {"fetchpriority=high" if k == 0 else "loading=lazy"}></button>')
    t0 = tint(HERO_SLIDES[0][1])[0]; p0 = P[HERO_SLIDES[0][0]]
    s = f"""<section class="hero" data-hero style="--tint:{t0}">
  <div class="wrap hero__in">
    <h1 class="sr">Terzee Origins. Black cloth, worked by hand.</h1>
    <svg class="wm" data-wm viewBox="0 0 1100 260" aria-hidden="true" focusable="false">
      <defs><clipPath id="wm-clip">{WM}</clipPath></defs>
      <g clip-path="url(#wm-clip)">{''.join(imgs)}</g>
      <g class="wm__line" fill="none">{WM}</g>
    </svg>
    <div class="hero__row">
      <div class="hero__copy">
        <p class="hero__sub">Black cloth, worked by hand. Block print, patchwork and frayed appliqu\u00e9, made in small runs.</p>
        <div class="hero__cta">{btn('Shop the drop', 'shop.html')}<a class="link" href="about.html">About Terzee</a></div>
      </div>
      <div class="hero__deckwrap">
        <div class="deck" role="group" aria-label="Choose a look">{''.join(cards)}</div>
        <a class="chip" data-chip href="{href(HERO_SLIDES[0][0])}"><span class="chip__txt"><b data-chip-name>{e(p0['title'])}</b><small data-chip-price>{money(p0['price'])}</small></span><span class="btn__dot">{ICON('arrow-up-right')}</span></a>
      </div>
    </div>
  </div>
</section>"""

    # the drop
    order = ORDER
    s += f'''
<section class="sec drop" id="drop">
  <div class="wrap">
    <div class="sec__head" data-r><h2 class="h2">The AW26 drop</h2>{btn('Shop all', 'shop.html', 'line')}</div>
    <div class="rail" data-r>{''.join(card(h) for h in order)}</div>
  </div>
</section>'''

    # statement with inline images
    def pill(img, cls=''): return f'<span class="inl {cls}"><img src="{A(img, True)}" alt="" loading="lazy" width="320" height="200"></span>'
    words = lambda t: ''.join(f'<span class="w">{w}</span> ' for w in t.split())
    s += f'''
<section class="sec say" aria-label="About Terzee">
  <div class="wrap">
    <p class="say__text" data-say>{words('We cut black cloth,')}{pill('detail-jaal.jpg')} {words('print it by hand,')}{pill('detail-patchwork.jpg', 'inl--b')} {words('and stitch every piece in small runs.')}{pill('detail-frayed.jpg', 'inl--c')} {words('When a run is gone, it is gone.')}</p>
  </div>
</section>'''

    # the rail: garments on hangers, slides side to side on its own and by hand; tap one for a small preview (photos, price, sizes)
    RAIL = [(h, True, '') for h in ['lattice-zip-jacket', 'jaal-pocket-camp-shirt', 'diamond-jaal-bomber', 'katran-club', 'archive-patchwork-jacket', 'gali-culture']]
    from PIL import Image as _I
    ritems = []
    for h, live, label in RAIL:
        im = _I.open(os.path.join(HERE, 'assets', 'rail', f'{h}.webp')); w6 = im.width / 700
        name = P[h]['title'] if live else label
        price = money(P[h]['price']) if live else ''
        url = href(h) if live else ''
        if live:
            files = [f for f in (P[h].get('hero') or []) if os.path.exists(os.path.join(SRC, f))][:4]
            photos = [A(f, True) for f in files]
        else:
            photos = [f'assets/rail/{h}.webp']
        ritems.append(f'<button class="rl__item" type="button" data-rl-item data-handle="{h if live else ""}" data-name="{e(name)}" data-price="{price}" data-url="{url}" data-photos="{e(json.dumps(photos))}" aria-label="{e(name)}" style="--w:{w6:.3f}"><span class="rl__sway"><img src="assets/rail/{h}.webp" alt="" width="{im.width}" height="{im.height}" loading="lazy" draggable="false"></span></button>')
    s += f"""
<section class="sec rl" data-rl>
  <div class="wrap">
    <div class="sec__head" data-r><h2 class="h2">On the rail</h2><div class="rl__nav"><button class="rl__arrow" type="button" data-rl-prev aria-label="Slide the rail back">{ICON('arrow-left')}</button><button class="rl__arrow" type="button" data-rl-next aria-label="Slide the rail forward">{ICON('arrow-right')}</button></div></div>
    <div class="rl__stage" data-rl-stage data-r>
      <div class="rl__bar" aria-hidden="true"></div>
      <div class="rl__track" data-rl-track>{''.join(ritems)}</div>
      <span class="rl__hint" data-rl-hint>Drag the rail or let it slide. Tap a piece to preview it.</span>
      <div class="rl__pop" data-rl-pop hidden role="dialog" aria-label="Piece preview">
        <button class="rl__x" type="button" data-rl-x aria-label="Close preview">{ICON('x')}</button>
        <div class="rl__shots" data-rl-shots></div>
        <div class="rl__dots" data-rl-dots></div>
        <div class="rl__meta"><b data-rl-name></b><span data-rl-price></span></div>
        <div class="rl__sizes" data-rl-sizes role="group" aria-label="Size">{''.join(f'<button type="button" data-size="{z}"{" class=is-on" if z == "M" else ""}>{z}</button>' for z in ['S', 'M', 'L', 'XL', 'XXL'])}</div>
        <div class="rl__acts"><button class="btn btn--ink" type="button" data-rl-add><span>Add to bag</span>{BTN_ARROW}</button><a class="btn btn--line" data-rl-view href="#"><span>View product page</span>{BTN_ARROW}</a></div>
        <p class="rl__soon" data-rl-soon hidden>Coming next</p>
      </div>
    </div>
  </div>
</section>"""

    # black in every light (look switcher, section colour follows the photo)
    LIGHTS = [('Warm wood', 'diamond-jaal-bomber', 'diamond-jaal-bomber-hero-2.jpg'), ('Stone hall', 'diamond-jaal-bomber', 'diamond-jaal-bomber-hero-1.jpg'),
              ('Blue velvet', 'archive-patchwork-jacket', 'archive-patchwork-jacket-hero-2.jpg'), ('Glasshouse', 'lattice-zip-jacket', 'lattice-zip-jacket-hero-3.jpg'),
              ('Dusk', 'lattice-zip-jacket', 'lattice-zip-jacket-hero-4.jpg'), ('Studio', 'jaal-pocket-camp-shirt', 'jaal-pocket-camp-shirt-hero-3.jpg'),
              ('Red room', 'lattice-zip-jacket', 'lattice-zip-jacket-hero-6.jpg'), ('Street colour', 'gali-culture', 'gali-culture-hero-1.jpg')]
    LIGHTS = [x for x in LIGHTS if os.path.exists(os.path.join(SRC, x[2]))]
    lb, li = [], []
    for k, (n, h, f) in enumerate(LIGHTS):
        t = tint(f)[0]
        lb.append(f'<button class="lt__btn{" is-on" if k == 0 else ""}" type="button" data-lt="{k}" data-tint="{t}" data-name="{e(P[h]["title"])}" data-price="{money(P[h]["price"])}" data-url="{href(h)}"><i style="background:{t}"></i>{n}</button>')
        li.append(f'<img class="lt__img{" is-on" if k == 0 else ""}" src="{A(f)}" alt="{e(P[h]["title"])} in {n.lower()} light" loading="lazy" width="1200" height="1500">')
    p1 = P[LIGHTS[0][1]]
    s += f"""
<section class="sec lights" data-lights style="--tint:{tint(LIGHTS[0][2])[0]}">
  <div class="wrap lt">
    <div class="lt__copy">
      <h2 class="h2" data-r>Black in every light</h2>
      <p class="lt__p" data-r>The cloth stays black. The room changes everything around it.</p>
      <div class="lt__list" data-r role="group" aria-label="Choose a light">{''.join(lb)}</div>
    </div>
    <div class="lt__frame">{''.join(li)}
      <a class="chip lt__chip" data-lt-chip href="{href(LIGHTS[0][1])}"><span class="chip__txt"><b data-lt-name>{e(p1['title'])}</b><small data-lt-price>{money(p1['price'])}</small></span><span class="btn__dot">{ICON('arrow-up-right')}</span></a>
    </div>
  </div>
</section>"""

    # bento categories (3 items, 3 cells)
    tiles = [
        ('Jackets', f'{N_J} pieces', 'shop.html?t=Jackets', hero(P['diamond-jaal-bomber'], 1), 'a', '50% 18%'),
        ('Shirts', f'{N_S} pieces', 'shop.html?t=Shirts', hero(P['jaal-pocket-camp-shirt'], 0), 'b', '50% 22%'),
        ('Archive', 'Patchwork', href('archive-patchwork-jacket'), 'archive-patchwork-jacket-campaign-1.jpg', 'c', '50% 25%'),
    ]
    bento = ''.join(f'''<a class="bt bt--{k}" href="{u}" data-r style="--t:{tint(img)[0]}"><img src="{A(img)}" alt="" loading="lazy" width="1200" height="1500" style="object-position:{pos}"><span class="bt__cap"><span class="bt__cap-in"><b>{n}</b><small>{c}</small><span class="btn__dot">{ICON('arrow-up-right')}</span></span></span></a>''' for n, c, u, img, k, pos in tiles)
    s += f'''
<section class="sec cats">
  <div class="wrap">
    <div class="sec__head" data-r><h2 class="h2">Shop by category</h2></div>
    <div class="bento">{bento}</div>
  </div>
</section>'''

    # lookbook sticky stack
    stack = []
    for k, h in enumerate(['lattice-zip-jacket', 'diamond-jaal-bomber', 'archive-patchwork-jacket', 'jaal-pocket-camp-shirt']):
        p = P[h]; f = P[h]['campaign'][0] if p.get('campaign') else hero(p, 0)
        if h == 'lattice-zip-jacket': f = hero(p, 2)
        t, d = tint(f)
        stack.append(f'''<article class="lk" style="--i:{k};--t:{t};--d:{d}">
  <div class="lk__copy"><h3 class="lk__name">{e(p['title'])}</h3><p>{e(p['desc'])}</p><div class="lk__row"><span class="lk__price">{money(p['price'])}</span>{btn('View piece', href(h), 'ink')}</div></div>
  <div class="lk__img"><img src="{A(f)}" alt="{e(p['title'])} lookbook photograph" loading="lazy" width="1200" height="1500"></div>
</article>''')
    s += f'''
<section class="sec look" id="lookbook">
  <div class="wrap"><div class="sec__head" data-r><h2 class="h2">The lookbook</h2></div><div class="stack">{''.join(stack)}</div></div>
</section>'''

    # single marquee
    seq = ''.join(f'<span>{t}</span><img src="{A("ze-monogram-black.png")}" alt="" width="28" height="28">' for t in ['Black cloth', 'Small runs', 'Hand finished', 'Cut and sewn'])
    s += f'<div class="mq" aria-hidden="true"><div class="mq__track">{seq * 2}</div></div>'

    # film band
    s += f"""
<section class="film" aria-label="Film">
  <div class="film__box" data-film>
    <video class="film__video" src="{A('hero-triptych-1920.mp4')}" poster="{A('hero-triptych-poster.jpg')}" muted loop playsinline preload="none" data-autoplay width="1920" height="1080"></video>
    <div class="film__cap"><h2 class="h2">Black cloth in motion</h2>{btn('Shop the drop', 'shop.html', 'paper')}</div>
  </div>
</section>"""

    # look closer (hover zoom)
    DET = [('Block print', 'detail-jaal.jpg', 'a'), ('Patchwork', 'detail-patchwork.jpg', 'b'), ('Fray', 'detail-frayed.jpg', 'c'), ('Hand stitch', 'detail-denim-back.jpg', 'd')]
    zm = ''.join(f'<figure class="zm zm--{k}" data-zoom data-r><img src="{A(i)}" alt="{n} close up" loading="lazy" width="1200" height="1200"><figcaption>{n}</figcaption></figure>' for n, i, k in DET)
    s += f"""
<section class="sec closer">
  <div class="wrap">
    <div class="sec__head" data-r><h2 class="h2">Look closer</h2><p class="hint">Hover or tap a detail to zoom</p></div>
    <div class="zgrid">{zm}</div>
  </div>
</section>"""

    # expanding strips (hover opens a photo)
    STRIPS = [8, 3, 6, 2, 12, 15]
    strips = ''.join(f'<li class="xs__item{" is-on" if k == 0 else ""}" tabindex="0" data-xs style="--t:{Lt(i)}"><img src="{L(i)}" alt="Model in a black jacket, {LOOK_NAMES[i].lower()}" loading="lazy" width="1100" height="{"619" if i == 6 else "1375"}"><span class="xs__name">{LOOK_NAMES[i]}</span></li>' for k, i in enumerate(STRIPS))
    s += f"""
<section class="sec xs" data-xs-wrap>
  <div class="wrap">
    <div class="sec__head" data-r><h2 class="h2">Same cloth, different rooms</h2><p class="hint">Hover a strip to open it</p></div>
    <ul class="xs__row" data-r>{strips}</ul>
  </div>
</section>"""

    # draggable photo table
    cards = ''.join(f'<figure class="pt__card" tabindex="0" data-card style="--t:{Lt(i)}"><img src="{L(i, True)}" alt="Model in a black jacket, {LOOK_NAMES[i].lower()}" loading="lazy" width="520" height="{"293" if i == 6 else "650"}" draggable="false"></figure>' for i in range(18))
    s += f"""
<section class="sec pt" data-pt>
  <div class="wrap">
    <div class="sec__head" data-r><h2 class="h2">Move the looks around</h2><button class="btn btn--line" type="button" data-pt-shuffle><span>Shuffle</span><span class="btn__dot">{ICON('shuffle')}</span></button></div>
    <div class="pt__stage" data-pt-stage>{cards}</div>
    <p class="hint pt__hint">Drag any photo. Use the arrow keys when one is selected.</p>
  </div>
</section>"""

    # craft (sticky video + steps)
    steps = [('Block print', 'Every pattern is stamped by hand, one panel at a time.', 'detail-jaal.jpg'),
             ('Patchwork', 'Squares are pieced in four greys with the seams left showing.', 'detail-patchwork.jpg'),
             ('Fray', 'Denim strips are laid by hand and left to fall as they like.', 'detail-frayed.jpg')]
    st = ''.join(f'<li class="cr__step" data-r><h3>{n}</h3><p>{d}</p></li>' for n, d, i in steps)
    s += f'''
<section class="sec craft" id="craft">
  <div class="wrap cr">
    <div class="cr__media" data-r><video class="cr__video" src="{A('craft-1080x1350.mp4')}" poster="{A('craft-poster.jpg', True)}" muted loop playsinline preload="none" data-autoplay width="1080" height="1350"></video></div>
    <div class="cr__body"><h2 class="h2" data-r>Made by hand, piece by piece</h2><ul class="cr__steps">{st}</ul></div>
  </div>
</section>'''

    # newsletter
    s += f'''
<section class="sec join" id="join">
  <div class="wrap join__in" data-r>
    <h2 class="h2">First access to every drop</h2>
    <form class="join__form" data-join novalidate>
      <label for="jn-email">Email address</label>
      <div class="join__row"><input id="jn-email" type="email" name="email" autocomplete="email" required placeholder="name@example.com"><button class="btn btn--ink" type="submit"><span>Join the list</span>{BTN_ARROW}</button></div>
      <p class="join__msg" data-join-msg role="status" aria-live="polite"></p>
    </form>
  </div>
</section>'''
    return head('Black cloth, worked by hand', 'home') + header() + s + footer()

# ---------------------------------------------------------------- shop
def shop():
    cards = ''.join(card(h) for h in ORDER)
    chips = ''.join(f'<button type="button" class="chip{" is-on" if t == "All" else ""}" data-filter="{t}">{t}</button>' for t in ['All', 'Jackets', 'Shirts'])
    s = f'''<section class="shop">
  <div class="wrap">
    <div class="shop__head"><h1 class="h1">All pieces</h1><p class="shop__count"><span data-count>{len(ORDER)}</span> pieces</p></div>
    <div class="shop__bar"><div class="chips" role="group" aria-label="Filter by type">{chips}</div></div>
    <div class="grid" data-grid>{cards}</div>
    <p class="empty" data-empty hidden>Nothing in this category yet. Check back after the next drop.</p>
  </div>
</section>'''
    return head('Shop all', 'shop') + header(True) + s + footer()

# ---------------------------------------------------------------- product
def product(h):
    p = P[h]
    imgs = [x for x in (p.get('hero') or []) if os.path.exists(os.path.join(SRC, x))][:6]
    gal = ''.join(f'<figure class="pg__fig{" pg__fig--lead" if i == 0 else ""}" style="--t:{tint(f)[0]}"><img src="{A(f)}" alt="{e(p["title"])} view {i + 1}" {"fetchpriority=high" if i == 0 else "loading=lazy"} width="1200" height="1500"></figure>' for i, f in enumerate(imgs))
    sizes = ''.join(f'<label class="sz"><input type="radio" name="size" value="{s}" {"checked" if s == "M" else ""}><span>{s}</span></label>' for s in ['S', 'M', 'L', 'XL', 'XXL'])
    others = [x for x in ORDER if x != h]
    s = f'''<section class="pdp">
  <div class="wrap pdp__grid">
    <div class="pg">{gal}</div>
    <div class="pdp__info" data-pdp data-handle="{h}">
      <nav class="crumb" aria-label="Breadcrumb"><a href="shop.html">Shop</a><span>/</span><a href="shop.html?t={e(p['type'])}">{e(p['type'])}</a></nav>
      <h1 class="h1 pdp__name">{e(p['title'])}</h1>
      <p class="pdp__price">{money(p['price'])}</p>
      <p class="pdp__desc">{e(p['desc'])}</p>
      <fieldset class="sizes"><legend>Size</legend><div class="sizes__row">{sizes}</div></fieldset>
      <button class="btn btn--ink btn--full" type="button" data-pdp-add><span>Add to bag</span>{BTN_ARROW}</button>
      <div class="acc">
        <details open><summary>Details<i class="ph-light ph-plus" aria-hidden="true"></i></summary><p>{e(p['desc'])}</p></details>
        <details><summary>Fabric and make<i class="ph-light ph-plus" aria-hidden="true"></i></summary><p>{e(p['fabric'].replace(chr(0xb7), ',').replace(' � ', ', '))}</p></details>
      </div>
    </div>
  </div>
</section>
<section class="sec more"><div class="wrap"><div class="sec__head"><h2 class="h2">More from the drop</h2>{btn('Shop all', 'shop.html', 'line')}</div><div class="rail">{''.join(card(x) for x in others)}</div></div></section>'''
    return head(p['title'], 'pdp') + header(True) + s + footer()

# ---------------------------------------------------------------- about
def about():
    stack = ''.join(f'<figure class="ab__fig ab__fig--{k}" style="--t:{tint(f)[0]}"><img src="{A(f, True)}" alt="" {"fetchpriority=high" if k == 1 else "loading=lazy"} width="800" height="1000"></figure>'
                    for k, f in [(1, 'craft-model.jpg'), (2, 'katran-club-hero-2.jpg'), (3, 'gali-culture-hero-2.jpg')])
    s = f"""<section class="ab">
  <div class="wrap ab__in">
    <div class="ab__copy">
      <h1 class="h1 ab__title">One cloth.<br>Black.<br>Worked by hand.</h1>
      <p class="ab__lead">Terzee Origins makes block printed, patchwork and frayed pieces in small runs. Every garment starts black and takes its character from the hand.</p>
      {btn('Shop the pieces', 'shop.html')}
    </div>
    <div class="ab__stack">{stack}</div>
  </div>
</section>"""

    steps = [('Cloth', 'Heavy cotton twill, poplin and denim, cut boxy and loose with room to move.', 'detail-paisley.jpg'),
             ('Print', 'Patterns are block printed by hand, one panel at a time.', 'detail-jaal.jpg'),
             ('Patch', 'Squares of cloth are pieced together in four greys, with the seams left showing.', 'detail-patchwork.jpg'),
             ('Fray', 'Strips of denim are laid by hand and left to fray along the edge.', 'detail-frayed.jpg'),
             ('Stitch', 'Black blanket stitch traces the edge by hand, so the work stays visible.', 'detail-denim-back.jpg')]
    imgs = ''.join(f'<img class="proc__img{" is-on" if k == 0 else ""}" src="{A(f)}" alt="{n} detail" loading="lazy" width="1200" height="1200">' for k, (n, d, f) in enumerate(steps))
    lis = ''.join(f'<li class="proc__step" data-step="{k}"><h2 class="h2">{n}</h2><p>{d}</p></li>' for k, (n, d, f) in enumerate(steps))
    s += f"""
<section class="proc" data-proc aria-label="How a piece is made">
  <div class="wrap proc__in">
    <div class="proc__stage"><div class="proc__frame">{imgs}</div></div>
    <ol class="proc__steps">{lis}</ol>
  </div>
</section>"""

    prin = [('Black first.', 'Every piece starts as black cloth. Colour comes from the world around it.', 'katran-club-hero-2.jpg'),
            ('Made by hand.', 'The print, the patchwork and the finishing stitch are all done by hand.', 'gali-culture-hero-2.jpg'),
            ('Small runs.', 'Each drop is made in a limited run, then it moves on.', 'lattice-zip-jacket-hero-5.jpg'),
            ('Built to wear.', 'Heavy cloth and honest seams, made to be worn hard.', 'jaal-pocket-camp-shirt-hero-4.jpg')]
    rows = ''.join(f'<li class="pr__row" tabindex="0" data-img="{A(f, True)}"><span class="pr__t">{n}</span><span class="pr__d">{d}</span></li>' for n, d, f in prin)
    s += f"""
<section class="sec pr" data-pr>
  <div class="wrap">
    <h2 class="h2 pr__h" data-r>What we hold to</h2>
    <ul class="pr__list">{rows}</ul>
  </div>
  <div class="pr__float" data-pr-float aria-hidden="true"><img alt="" width="320" height="400"></div>
</section>"""

    FAB = [('Cotton twill', 'Heavy and structured. The base for our jackets.', 'Jaal Theory and Jaal Project', 'lattice-zip-jacket', 'lattice-zip-jacket-campaign-1.jpg', 'a', '50% 22%'),
           ('Cotton poplin', 'Light and crisp, cut loose for the heat.', 'Jharokha', 'jaal-pocket-camp-shirt', 'jaal-pocket-camp-shirt-campaign-1.jpg', 'b', '50% 25%'),
           ('Patchwork cotton', 'Raw squares pieced with exposed seams.', 'Gulaabo Archive Jacket', 'archive-patchwork-jacket', 'archive-patchwork-jacket-campaign-2.jpg', 'c', '50% 25%')]
    tiles = ''.join(f'<a class="bt bt--{k}" href="{href(h)}" data-r style="--t:{tint(f)[0]}"><img src="{A(f)}" alt="" loading="lazy" width="1200" height="1500" style="object-position:{pos}"><span class="bt__cap"><span class="bt__cap-in"><span class="bt__txt"><b>{n}</b><small>{d}</small></span><span class="btn__dot">{ICON("arrow-up-right")}</span></span></span></a>' for n, d, used, h, f, k, pos in FAB)
    s += f"""
<section class="sec cats">
  <div class="wrap">
    <div class="sec__head" data-r><h2 class="h2">The cloth we use</h2></div>
    <div class="bento">{tiles}</div>
  </div>
</section>
<section class="sec more"><div class="wrap"><div class="sec__head" data-r><h2 class="h2">Wear it</h2>{btn('Shop all', 'shop.html', 'line')}</div><div class="rail" data-r>{''.join(card(h) for h in ORDER)}</div></div></section>"""
    return head('About', 'about') + header(True) + s + footer()

# ---------------------------------------------------------------- write
def w(name, text): open(os.path.join(HERE, name), 'w', encoding='utf-8').write(text)
w('index.html', home())
w('shop.html', shop())
w('about.html', about())
for h in P: w(f'product-{h}.html', product(h))
# product data for the bag
w('assets/data.js', 'window.TZ_PRODUCTS=' + json.dumps({h: {'title': p['title'], 'price': p['price'], 'img': A(hero(p, 0), True)} for h, p in P.items()}) + ';')
for n in _used:
    d = os.path.join(OUT, n)
    if not os.path.exists(d): shutil.copy2(os.path.join(SRC, n), d)
print('v2 built:', len(P) + 2, 'pages,', len(_used), 'assets')
