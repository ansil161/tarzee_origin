"""Static preview of the Terzee Origins Shopify theme.
Renders the same sections/markup as the Liquid theme using the catalog in media-src/catalog.json,
so the design can be reviewed before the theme is pushed to a store.
Run:  python preview/build.py   then open preview/index.html (or serve the folder).
"""
import json, os, shutil, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'preview')
ASSETS = os.path.join(OUT, 'assets')
THEME_ASSETS = os.path.join(ROOT, 'theme', 'assets')
os.makedirs(ASSETS, exist_ok=True)
os.makedirs(os.path.join(OUT, 'products'), exist_ok=True)
for f in os.listdir(THEME_ASSETS):
    src = os.path.join(THEME_ASSETS, f); dst = os.path.join(ASSETS, f)
    if not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst):
        shutil.copy2(src, dst)
cat = json.load(open(os.path.join(ROOT, 'media-src', 'catalog.json'), encoding='utf-8'))
def rupee(n): return '₹' + f'{n:,}'
def img(handle, n): return f'{handle}-{n}.jpg'
def e(s): return html.escape(s)
GALLERY_EXTRA = {'lattice-zip-jacket': 'detail-jaal.jpg', 'jaal-pocket-camp-shirt': 'look-03-camp-shirt-4x5.jpg'}  # extra gallery shots beyond photos/campaign
# Hover image for cards = the product's first on-model photo (the campaign shots). Flat-lay, detail and lookbook
# shots never qualify; a product with no on-model photo gets no hover image.
ALT = {p['handle']: p['campaign'][0] for p in cat if p.get('campaign')}
# Editorial 4:5 'hero' shots (catalog.json): hero[0] is the card/PDP primary image, hero[1] the hover image, the rest join the PDP gallery.
PRI = {p['handle']: p['hero'][0] for p in cat if p.get('hero')}
PRI800 = {h: n[:-4] + '-800.jpg' for h, n in PRI.items()}
for p in cat:
    if len(p.get('hero', [])) > 1: ALT[p['handle']] = p['hero'][1]
    if p.get('hero') and ALT.get(p['handle']) == p['hero'][0]: ALT.pop(p['handle'])  # no distinct 2nd photo = no hover image
def pri(h): return PRI.get(h) or img(h, 1)
def pri800(h): return PRI800.get(h) or f'{h}-1-800.jpg'
TAGS = {'lattice-zip-jacket': 'New drop', 'frayed-street-denim': 'Limited'}

def head(title, base='', body_class=''):
    return f'''<!doctype html>
<html class="no-js" lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0A0A0A">
<title>{e(title)} – Terzee Origins</title>
<link rel="icon" type="image/png" href="{base}assets/ze-monogram-white.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Manrope:wght@300;400;500;600;700;800&family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{base}assets/base.css">
<style>:root{{--logo-w:120px}}</style>
<script>window.TERZEE={{smoothScroll:true,cursor:true,moneyFormat:"₹{{{{amount_no_decimals}}}}",t:{{empty:"Your bag is empty.",remove:"Remove",added:"Added to bag",add:"Add to bag",soldOut:"Sold out"}}}};</script>
</head>
<body class="{body_class}">
<div class="cursor" aria-hidden="true"><span class="cursor__label">View</span></div>
'''

def header(base='', over=True):
    return f'''<header class="header{' header--over' if over else ' is-solid is-light'}" data-header>
  <div class="header__left">
    <button class="header__burger" data-open="menu-drawer" aria-label="Menu"><span></span><span></span><span></span></button>
    <nav class="header__nav" aria-label="Primary"><a href="{base}shop.html">Shop</a><a href="{base}story.html">Story</a></nav>
  </div>
  <a class="header__logo" href="{base}index.html" aria-label="Terzee Origins">
    <img class="logo-light" src="{base}assets/wordmark-terzee-white.png" alt="Terzee Origins" width="220" height="64">
    <img class="logo-dark" src="{base}assets/wordmark-terzee-black.png" alt="Terzee Origins" width="220" height="64">
  </a>
  <div class="header__right">
    <a class="header__icon" href="#" aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.2-4.2"/></svg></a>
    <a class="header__icon header__icon--account" href="#" aria-label="Account"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg></a>
    <button class="header__icon" data-open="cart-drawer" aria-label="Bag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="header__count" data-cart-count>0</span></button>
  </div>
</header>
<main id="MainContent">'''

def footer(base=''):
    links_shop = ''.join(f'<li><a href="{base}collection.html">{t}</a></li>' for t in ['Shop all', 'Jackets', 'Shirts', 'Shackets', 'Archive'])
    links_brand = ''.join(f'<li><a href="{base}story.html">{t}</a></li>' for t in ['Our story', 'Lookbook', 'Size guide', 'Shipping & returns', 'Contact'])
    return f'''</main>
<footer class="footer"><div class="container">
  <div class="footer__top">
    <div class="footer__brand"><img src="{base}assets/wordmark-origins-white.png" alt="Terzee Origins" width="150" height="62"><p>Black on black streetwear. Block print, patchwork and frayed appliqué, cut and sewn by hand in limited runs.</p></div>
    <div><h4>Shop</h4><ul>{links_shop}</ul></div>
    <div><h4>Terzee</h4><ul>{links_brand}</ul></div>
    <div><h4>Follow</h4><ul><li><a href="#">Instagram</a></li><li><a href="#">WhatsApp</a></li><li><a href="mailto:hello@terzeeorigins.com">hello@terzeeorigins.com</a></li></ul></div>
  </div>
  <div class="footer__big" aria-hidden="true">Terzee Origins</div>
  <div class="footer__bottom"><span>&copy; 2026 Terzee Origins · All rights reserved</span><span>Cut and sewn by hand</span></div>
</div></footer>
<div class="drawer" id="menu-drawer" aria-hidden="true"><div class="drawer__scrim"></div><nav class="drawer__panel"><div class="drawer__head"><img src="{base}assets/wordmark-origins-white.png" alt="" width="110" height="46" style="width:110px"><button class="drawer__close" data-close>Close</button></div>
<ul class="menu-list"><li><a href="{base}shop.html">Shop<small>01</small></a></li><li><a href="{base}collection.html">Shirts<small>02</small></a></li><li><a href="{base}collection.html">Jackets<small>03</small></a></li><li><a href="{base}story.html">Our story<small>04</small></a></li></ul>
<div class="drawer__foot"><a href="#">Search</a><a href="#">Account</a><a href="#">Instagram</a><span>Cut and sewn by hand.</span></div></nav></div>
<div class="drawer drawer--right" id="cart-drawer" aria-hidden="true"><div class="drawer__scrim"></div><aside class="drawer__panel"><div class="drawer__head"><span class="t-label">Your bag (<span data-cart-count>0</span>)</span><button class="drawer__close" data-close>Close</button></div>
<div class="cart-lines" data-cart-lines><p class="cart-empty">Your bag is empty.</p></div>
<div class="cart-foot"><div class="cart-foot__row"><span>Subtotal</span><strong data-cart-subtotal>₹0</strong></div><small>Free shipping across India · Taxes and shipping calculated at checkout.</small><a class="btn btn--solid-paper btn--wide" href="#"><span>Checkout</span></a></div></aside></div>
<div class="toast" role="status" aria-live="polite"></div>
<div class="lightbox" aria-hidden="true"><button class="lightbox__close" data-lightbox-close>Close ✕</button><video controls playsinline preload="none" poster="{base}assets/brand-film-poster.jpg"></video></div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>
<script src="{base}assets/theme.js"></script>
<script src="{base}assets/preview-cart.js"></script>
</body></html>'''

def card(p, base=''):
    alt = ALT.get(p['handle']); tag = TAGS.get(p['handle'])
    return f'''<a class="card" href="{base}products/{p['handle']}.html" data-cursor="view">
  <div class="card__media">{f'<span class="card__tag">{tag}</span>' if tag else ''}{f'<img class="alt" src="{base}assets/{alt}" alt="" loading="lazy" width="900" height="1125">' if alt else ''}<img class="main" src="{base}assets/{img(p['handle'],1)}" alt="{e(p['title'])}" loading="lazy" width="900" height="1125">
    <div class="card__quick"><form data-preview-cart data-title="{e(p['title'])}" data-price="{p['price']}" data-img="{base}assets/{pri800(p['handle'])}"><button class="btn" type="submit"><span>Add to bag</span></button></form></div></div>
  <div class="card__info"><div><h3 class="card__title">{e(p['title'])}</h3><div class="card__meta">{p['type']} · {p['tag']}</div></div><div class="card__price">{rupee(p['price'])}</div></div></a>'''

def pmarquee(base=''):
    lists = ''
    for i in range(2):
        items = ''.join(f'<li class="pmarquee__item"><a class="pmarquee__link" href="{base}products/{p["handle"]}.html"{" tabindex=\"-1\"" if i else ""}><img class="pmarquee__image" src="{base}assets/{pri800(p["handle"])}" alt="" width="600" height="731" loading="lazy"><span class="visually-hidden">{e(p["title"])}</span></a></li>' for p in cat)
        lists += f'<ul class="pmarquee__list"{" aria-hidden=\"true\"" if i else ""}>{items}</ul>'
    return f'''<section class="pmarquee section--light" data-header-light>
  <h2 class="pmarquee__heading pmarquee__heading--left" id="pmarquee-home">See our products:</h2>
  <div class="pmarquee__viewport pmarquee__viewport--pausable" data-pmarquee data-speed="45" data-direction="left" role="region" aria-labelledby="pmarquee-home"><div class="pmarquee__track">{lists}</div></div>
</section>'''

import re as _re
SIZES = ['S', 'M', 'L', 'XL', 'XXL']
CHEV = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>'
NEW_ARRIVALS = {'lattice-zip-jacket', 'diamond-jaal-bomber', 'frayed-street-denim', 'archive-patchwork-jacket'}
def cats_of(p):  # preview-only category keys used by the split panels
    c = [{'Shirts': 'shirts', 'Jackets': 'jackets', 'Shackets': 'jackets'}[p['type']]]
    if 'denim' in p['handle']: c.append('denim')
    if p['handle'] in NEW_ARRIVALS: c.append('new')
    return ' '.join(c)
def shop_card(p, i, base=''):
    tag = TAGS.get(p['handle']); alt = ALT.get(p['handle'])
    badge = f'<span class="shop-badge">{"New" if tag == "New drop" else tag}</span>' if tag else ''
    return f"""<div class="shop-card" data-shop-card data-product-id="{p['handle']}" data-cats="{cats_of(p)}">
  <div class="shop-card__image-wrapper">
    <button type="button" class="shop-wishlist" data-wishlist="{p['handle']}" aria-label="Add to wishlist" aria-pressed="false"><svg class="shop-heart" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg></button>{badge}
    <a class="shop-card__image-link" href="{base}products/{p['handle']}.html" draggable="false" tabindex="-1" aria-hidden="true"><img class="shop-card__img" src="{base}assets/{pri(p['handle'])}" alt="{e(p['title'])}" width="800" height="1000" loading="lazy" draggable="false">{f'<img class="shop-card__img shop-card__img--alt" src="{base}assets/{alt}" alt="" width="800" height="1000" loading="lazy" draggable="false">' if alt else ''}</a>
  </div>
  <div class="shop-card__info"><h3 class="shop-card__title"><a href="{base}products/{p['handle']}.html">{e(p['title'])}</a></h3><span class="shop-card__category">{p['type']}</span><span class="shop-card__color" data-shop-color>{p['tag']}</span><span class="shop-card__price">{rupee(p['price'])}</span></div>
</div>"""

# ---------------- HOME ----------------

SD = [('lattice-zip-jacket', '₹7,990', '-19%'), ('diamond-jaal-bomber', '', 'New'), ('frayed-street-denim', '₹10,990', '-18%'), ('archive-patchwork-jacket', '', 'Limited')]
HEART = '<svg class="shop-heart" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5.5 6.3 5.2c1.9-.2 3.6.8 4.7 2.3 1.1-1.5 2.8-2.5 4.7-2.3 3.3.3 5.1 3.4 3.8 6.6C19.5 16.4 12 21 12 21z"/></svg>'
def sd_card(handle, compare, tag):
    p = next(x for x in cat if x['handle'] == handle)
    alt = ALT.get(handle)
    url = f'products/{handle}.html'
    return (f'<article class="sd-card"><div class="sd-card__media">'
            + (f'<span class="sd-card__badge">{tag}</span>' if tag else '')
            + f'<button type="button" class="shop-wishlist" data-wishlist="{handle}" aria-label="Add to wishlist" aria-pressed="false">{HEART}</button>'
            + f'<a class="sd-card__link" href="{url}" aria-label="{e(p["title"])}">'
            + (f'<img class="alt" src="assets/{alt}" alt="" loading="lazy" width="900" height="1125">' if alt else '')
            + f'<img class="main" src="assets/{pri(handle)}" alt="{e(p["title"])}" loading="lazy" width="900" height="1125"></a></div>'
            + f'<div class="sd-card__info"><a class="sd-card__title" href="{url}">{e(p["title"])}</a><div class="sd-card__price">{rupee(p["price"])}'
            + (f' <s>{compare}</s>' if compare else '') + '</div><span class="sd-card__swatch" aria-hidden="true" title="Black"></span></div></article>')

home = head('Black on black streetwear', body_class='template-index') + header()
home += '''
<section class="hero hero--brand" id="hero">
  <div class="hero__media hero__media--desktop"><video autoplay muted loop playsinline preload="metadata" poster="assets/hero-user-poster.jpg"><source src="assets/hero-user-1920.mp4" type="video/mp4"></video></div>
  <div class="hero__media hero__media--mobile"><video autoplay muted loop playsinline preload="metadata" poster="assets/hero-user-mobile-poster.jpg"><source src="assets/hero-user-mobile-720x1280.mp4" type="video/mp4"></video></div>
  <a class="hero__brand" href="index.html" aria-label="Terzee Origins"><img src="assets/wordmark-terzee-white.png" alt="" width="919" height="266"></a>
</section>
'''  + '''
'''
home += '''
<section class="section section--light" data-header-light><div class="container">
  <div class="section-head"><div><div class="eyebrow t-label"><span class="dia"></span>Drop 01</div><h2 class="t-display" data-split>New arrivals</h2></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:14px"><a class="link" href="collection.html">Shop all</a></div></div>
  <div class="shop-grid shop-grid--home" data-stagger>''' + ''.join(shop_card(p, i) for i, p in enumerate(cat[:8])) + '''</div>
</div></section>
<section class="craft"><div class="craft__inner"><div class="craft__copy"><p class="craft__eyebrow">Craft</p><h2 class="craft__title" data-split>Every piece carries the hand that made it.</h2><p class="craft__text">Blanket stitch, block print, patchwork with exposed edges. Slow work, kept patient and precise — the hand is always visible.</p><a class="craft__cta" href="story.html">Our story<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div><div class="craft__stage"><div class="craft__frame"><img src="assets/craft-model.jpg" alt="" width="1400" height="1750" loading="lazy"></div><ol class="craft__cards"><li class="craft__card"><span class="craft__n">01</span><span class="craft__name">Blanket stitch</span><span class="craft__detail">collars, hems, appliqué</span></li><li class="craft__card"><span class="craft__n">02</span><span class="craft__name">Block print</span><span class="craft__detail">lattice and diamond repeats</span></li><li class="craft__card"><span class="craft__n">03</span><span class="craft__name">Patchwork</span><span class="craft__detail">raw squares, four greys</span></li><li class="craft__card"><span class="craft__n">04</span><span class="craft__name">Frayed appliqué</span><span class="craft__detail">built from strips of denim</span></li></ol></div></div></section>
<section class="sd" data-header-light>
  <div class="sd__panel"><img class="sd__bg" src="assets/seasonal-panel.jpg" alt="" loading="lazy" width="1400" height="2100">
    <div class="sd__content"><h2 class="sd__title">Seasonal Drop</h2><a class="pill pill--paper" href="collection.html">Shop Now</a></div></div>
  <div class="sd__grid">''' + ''.join(sd_card(p, c, t) for p, c, t in SD) + '''</div>
</section>
<section class="why" data-header-light><header class="why__head"><p class="why__eyebrow">The Terzee promise</p><h2 class="why__title" data-split>Why Terzee?</h2><p class="why__intro">Cut and sewn by hand, delivered with care. Four things we never compromise on.</p></header><div class="why__bento"><article class="why__tile why__tile--1"><div class="why__top"><span class="why__icon"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h16v13H3zM19 13h5l4 4v5h-9M8 25.5a2.5 2.5 0 1 0 0-.01M23 25.5a2.5 2.5 0 1 0 0-.01"/></svg></span><span class="why__pill">Business days</span></div><div class="why__bottom"><p class="why__figure">3–5<small>days</small></p><h3 class="why__name">Fast shipping</h3><p class="why__text">Get your order delivered quickly, straight to your door.</p></div></article><article class="why__tile why__tile--2"><div class="why__top"><span class="why__icon"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h15a6 6 0 0 1 0 12H10M11 7 6 12l5 5"/></svg></span><span class="why__pill">From delivery</span></div><div class="why__bottom"><p class="why__figure">7<small>days</small></p><h3 class="why__name">Easy returns</h3><p class="why__text">Return your items hassle-free. Our flexible policy makes it simple.</p></div></article><article class="why__tile why__tile--3"><div class="why__top"><span class="why__icon"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3 5 7v8c0 7 4.6 11.5 11 14 6.4-2.5 11-7 11-14V7zM11 16l3.5 3.5L21.5 12"/></svg></span><span class="why__pill">Bank-grade protection</span></div><div class="why__bottom"><p class="why__figure">SSL<small></small></p><h3 class="why__name">Secure payments</h3><p class="why__text">Pay for your order with confidence. Your details are always protected.</p></div></article><article class="why__tile why__tile--4"><div class="why__top"><span class="why__icon"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 6h22v15H15l-6 5v-5H5zM11 12h10M11 16h6"/></svg></span><span class="why__pill">hello@terzeeorigins.com</span></div><div class="why__bottom"><p class="why__figure">Help<small></small></p><h3 class="why__name">Customer support</h3><p class="why__text">Get the help you need, fast. Our dedicated team is here for you.</p></div></article></div></section>
<section class="cats" data-header-light>
  <h2 class="cats__title" data-split>Shop by Categories</h2>
  <div class="cats__grid">
    <a class="cat cat--tall cat--photo" href="collection.html" style="--img-x:30%;--img-y:7%;--img-h:112%"><div class="cat__text"><div class="cat__head"><p class="cat__eyebrow">FOR JACKETS</p><h3 class="cat__title">Built For Daily Confidence</h3></div><span class="pill pill--ink">Shop Now</span></div><img class="cat__img" src="assets/cat-jackets-photo.jpg" alt="" loading="lazy" width="1600" height="900" style="object-position:47% 40%"></a>
    <a class="cat cat--wide cat--photo" href="collection.html" style="--img-x:36%;--img-y:-6%;--img-h:200%"><div class="cat__text"><div class="cat__head"><p class="cat__eyebrow">FOR SHIRTS</p><h3 class="cat__title">Designed For Modern Living</h3></div><span class="pill pill--ink">Shop Now</span></div><img class="cat__img" src="assets/cat-shirts-photo.jpg" alt="" loading="lazy" width="1100" height="1375" style="object-position:50% 28%"></a>
  </div>
</section>
'''
home += '''
<section class="sw" data-header-light><div class="sw__head"><div><p class="sw__eyebrow">Social</p><h2 class="sw__title" data-split>Worn in the wild</h2></div><a class="sw__follow" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener">Follow @theterzeeorigins<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg></a></div><div class="sw__wall"><figure class="sw__card sw__card--ink"><span class="sw__mark" aria-hidden="true">“</span><blockquote>The materials feel premium and the craftsmanship is excellent. I've worn my shirt countless times and it still looks brand new.</blockquote><figcaption><span class="sw__stars">★★★★★</span><span>@customer_one</span><a href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener">View on Instagram</a></figcaption></figure><a class="sw__photo" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener"><img src="assets/look-02-back-4x5.jpg" alt="" loading="lazy" width="600" height="750"><span class="sw__tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>@theterzeeorigins</span></a><figure class="sw__card sw__card--light"><span class="sw__mark" aria-hidden="true">“</span><blockquote>I've been searching for everyday essentials that don't compromise on quality, and I finally found them here.</blockquote><figcaption><span class="sw__stars">★★★★★</span><span>@customer_two</span><a href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener">View on Instagram</a></figcaption></figure><a class="sw__photo" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener"><img src="assets/diamond-jaal-bomber-campaign-2.jpg" alt="" loading="lazy" width="600" height="750"><span class="sw__tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>@theterzeeorigins</span></a><a class="sw__photo" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener"><img src="assets/look-03-camp-shirt-4x5.jpg" alt="" loading="lazy" width="600" height="750"><span class="sw__tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>@theterzeeorigins</span></a><figure class="sw__card sw__card--light"><span class="sw__mark" aria-hidden="true">“</span><blockquote>Every order I've received has been consistent in quality. The attention to detail is what makes these clothes stand out.</blockquote><figcaption><span class="sw__stars">★★★★★</span><span>@customer_three</span><a href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener">View on Instagram</a></figcaption></figure><a class="sw__photo" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener"><img src="assets/archive-patchwork-jacket-campaign-1.jpg" alt="" loading="lazy" width="600" height="750"><span class="sw__tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>@theterzeeorigins</span></a><figure class="sw__card sw__card--ink"><span class="sw__mark" aria-hidden="true">“</span><blockquote>From the moment I unpacked my order, I could tell the craftsmanship was on another level. It feels built to last.</blockquote><figcaption><span class="sw__stars">★★★★★</span><span>@customer_four</span><a href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener">View on Instagram</a></figcaption></figure><a class="sw__photo" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener"><img src="assets/look-01-bomber-4x5.jpg" alt="" loading="lazy" width="600" height="750"><span class="sw__tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>@theterzeeorigins</span></a><figure class="sw__card sw__card--ink"><span class="sw__mark" aria-hidden="true">“</span><blockquote>The fit is spot on and the stitching is clean. It's the piece I reach for first every time.</blockquote><figcaption><span class="sw__stars">★★★★★</span><span>@customer_five</span><a href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener">View on Instagram</a></figcaption></figure><a class="sw__photo" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener"><img src="assets/frayed-street-denim-3.jpg" alt="" loading="lazy" width="600" height="750"><span class="sw__tag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>@theterzeeorigins</span></a><figure class="sw__card sw__card--light"><span class="sw__mark" aria-hidden="true">“</span><blockquote>Heavy cloth, sharp details and it only gets better with wear. Worth every rupee.</blockquote><figcaption><span class="sw__stars">★★★★★</span><span>@customer_six</span><a href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener">View on Instagram</a></figcaption></figure></div></section>
'''
home += '''
<section class="ig" data-header-light>
  <div class="ig__head"><div><h2 class="ig__title"><a href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener">@theterzeeorigins</a></h2><p class="ig__sub">Follow the latest looks, moments and stories.</p></div></div>
  <div class="ig__carousel" style="--ig-speed:40s"><div class="ig__track"><div class="ig__group"><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/look-01-bomber-4x5.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/diamond-jaal-bomber-campaign-2.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/look-03-camp-shirt-4x5.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/archive-patchwork-jacket-campaign-1.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/look-02-back-4x5.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/diamond-jaal-bomber-campaign-3.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/frayed-street-denim-3.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/archive-patchwork-jacket-campaign-2.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/diamond-jaal-bomber-campaign-4.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/paisley-tonal-shirt-2.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a></div><div class="ig__group" aria-hidden="true"><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/look-01-bomber-4x5.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/diamond-jaal-bomber-campaign-2.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/look-03-camp-shirt-4x5.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/archive-patchwork-jacket-campaign-1.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/look-02-back-4x5.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/diamond-jaal-bomber-campaign-3.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/frayed-street-denim-3.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/archive-patchwork-jacket-campaign-2.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/diamond-jaal-bomber-campaign-4.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a><a tabindex="-1" class="ig__post" href="https://www.instagram.com/theterzeeorigins/" target="_blank" rel="noopener" aria-label="Instagram @theterzeeorigins"><img src="assets/paisley-tonal-shirt-2.jpg" alt="" loading="lazy" width="492" height="614" draggable="false"><span class="ig__meta"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg></span></a></div></div></div>
</section>
'''
home += '''
<section class="jreveal" data-jreveal aria-label="Terzee Origins"><div class="jreveal__pin"><div class="jreveal__stage">
  <div class="jreveal__title" aria-hidden="true"><div class="jreveal__title-1">TERZEE</div><div class="jreveal__title-2">ORIGINS</div></div>
  <div class="jreveal__inside"><img src="assets/jacket-reveal-inside.jpg" alt="" loading="lazy" width="2048" height="1152"></div>
  <div class="jreveal__about"><span class="jreveal__about-sub">about us</span><p class="jreveal__about-text" data-chars>Cut and sewn by hand from one black cloth. Built to be worn hard and kept for years.</p></div>
  <div class="jreveal__seam" aria-hidden="true"></div>
  <div class="jreveal__half jreveal__half--left" aria-hidden="true"><img src="assets/jacket-reveal-left.png" alt="" loading="lazy" width="1024" height="1152"></div>
  <div class="jreveal__half jreveal__half--right" aria-hidden="true"><img src="assets/jacket-reveal-right.png" alt="" loading="lazy" width="1024" height="1152"></div>
</div></div></section>

<section class="section section--stone" data-header-light><div class="container"><div class="newsletter">
  <div><div class="eyebrow t-label" data-reveal><span class="dia"></span>Newsletter</div><h2 class="t-display" data-split>Sign up</h2></div>
  <div data-reveal><p class="t-body" style="opacity:.85">Early access to drops, restocks and once-a-season offers. No noise.</p><form class="newsletter__form" onsubmit="event.preventDefault();window.terzeeToast('Thank you. You are on the list.')"><input type="email" placeholder="Email address" required><button type="submit">Sign up</button></form><p class="newsletter__note">One letter a month, at most. Unsubscribe any time.</p></div>
</div></div></section>'''
home += footer()
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(home)

# ---------------- COLLECTION (layout mirrors sections/main-collection.liquid) ----------------

def shop_group(label, items):
    checks = ''.join(f'<li><label class="shop-check"><input type="checkbox" name="{label.lower()}" value="{e(v)}"><span class="shop-check__box"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg></span><span class="shop-check__label">{e(v)}</span></label></li>' for v in items)
    return f'<details class="shop-group" open><summary class="shop-group__summary"><span>{label}</span>{CHEV}</summary><div class="shop-group__body"><ul class="shop-checks">{checks}</ul></div></details>'

price_group = f'<details class="shop-group" open><summary class="shop-group__summary"><span>Price</span>{CHEV}</summary><div class="shop-group__body"><div class="shop-price"><label class="shop-price__field"><span class="shop-price__symbol">₹</span><input type="number" name="price_min" min="0" placeholder="0" aria-label="From"></label><span class="shop-price__sep">to</span><label class="shop-price__field"><span class="shop-price__symbol">₹</span><input type="number" name="price_max" min="0" placeholder="{max(p["price"] for p in cat)}" aria-label="To"></label></div></div></details>'
types = sorted({p['type'] for p in cat}); techs = sorted({p['tag'] for p in cat})
shop_js = _re.search(r'<script>([\s\S]*?)</script>', open(os.path.join(ROOT, 'theme', 'sections', 'main-collection.liquid'), encoding='utf-8').read()).group(1)
SORTS = [('manual', 'Featured'), ('best-selling', 'Best selling'), ('title-ascending', 'Alphabetically, A-Z'), ('title-descending', 'Alphabetically, Z-A'), ('price-ascending', 'Price, low to high'), ('price-descending', 'Price, high to low'), ('created-descending', 'Date, new to old')]
sort_opts = ''.join(f'<option value="{v}">{t}</option>' for v, t in SORTS)
SPLIT = [('Shirts', 'col-shirts.jpg', 'shirts', 50, 30), ('Jackets', 'col-jackets.jpg', 'jackets', 47, 40), ('New arrivals', 'col-new.jpg', 'new', 50, 30), ('Shop all', 'col-all.jpg', 'all', 50, 40)]
ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
split_html = '<section class="csplit" data-header-light aria-label="Shop by category"><ul class="csplit__list">' + ''.join(
    f'<li class="csplit__item"><a class="csplit__link" href="collection.html?c={k}" data-split-link="{k}"><img class="csplit__img" src="assets/{a}" alt="" loading="{"eager" if i == 0 else "lazy"}" width="1122" height="1402" style="object-position:{x}% {y}%"><span class="csplit__text"><span class="csplit__title">{t}</span><span class="csplit__cta">Shop now{ARROW}</span></span></a></li>'
    for i, (t, a, k, x, y) in enumerate(SPLIT)) + '</ul></section>'
split_js = """<script>(function(){var c=new URLSearchParams(location.search).get('c');if(!c)return;var names={shirts:'Shirts',jackets:'Jackets',denim:'Denim',new:'New arrivals',all:'Shop all'};var n=0,cards=document.querySelectorAll('[data-shop-card]');cards.forEach(function(el){var ok=c==='all'||(el.dataset.cats||'').split(' ').indexOf(c)>-1;el.style.display=ok?'':'none';if(ok)n++});var t=document.querySelector('.shop__title');if(t&&names[c])t.textContent=names[c];var ct=document.querySelector('[data-shop-count]');if(ct)ct.textContent=n+' of '+cards.length+' products';if(location.hash==='#shop'){var s=document.getElementById('shop');if(s)setTimeout(function(){window.scrollTo({top:s.getBoundingClientRect().top+scrollY-56,behavior:'smooth'})},60)}})();</script>"""
col = f"""<section id="shop" class="shop section--light" data-header-light data-shop data-shop-url="collection.html"><div class="shop__inner">
  <header class="shop__header"><h1 class="shop__title">Shop all</h1></header>
  <div class="shop__toolbar"><p class="shop__count"><span class="shop__count-label">Showing</span> <span data-shop-count>{len(cat)} of {len(cat)} products</span></p>
    <div class="shop__toolbar-actions"><button type="button" class="shop__filter-btn" data-shop-open-filters><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg> Filter <span data-shop-active-count></span></button>
      <div class="shop-sort"><label class="visually-hidden" for="shop-sort">Sort by</label><select id="shop-sort" class="shop-sort__select" name="sort_by" data-shop-sort>{sort_opts}</select><svg class="shop-sort__chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></div></div></div>
  <div class="shop__layout">
    <aside class="shop__sidebar" data-shop-sidebar><form class="shop__form" action="collection.html" data-shop-form><input type="hidden" name="sort_by" value="manual">
      <div class="shop__sidebar-head"><h2 class="shop__sidebar-title">Filter by</h2><button type="button" class="shop__close" data-shop-close-filters aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true" width="16" height="16" style="stroke:currentColor;fill:none;stroke-width:1.4"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>
      <div data-shop-filters>{shop_group('Availability', ['In stock', 'Out of stock'])}{price_group}{shop_group('Size', SIZES)}{shop_group('Category', types)}{shop_group('Technique', techs)}</div></form>
      <div class="shop__drawer-foot"><button type="button" class="shop__apply" data-shop-close-filters>Show <span data-shop-apply-count>{len(cat)}</span> products</button></div></aside>
    <div class="shop__main" data-shop-main><div class="shop-active" data-shop-active></div><span hidden data-shop-active-total>0</span>
      <div class="shop-grid">{''.join(shop_card(p, i) for i, p in enumerate(cat))}</div>
      <nav class="shop-pagination" aria-label="Pagination"></nav></div></div></div>
  <div class="shop__overlay" data-shop-close-filters></div></section><script>{shop_js}</script>""" + split_js
open(os.path.join(OUT, 'shop.html'), 'w', encoding='utf-8').write(head('Shop', body_class='template-collection') + header(over=False) + split_html + col + footer())
open(os.path.join(OUT, 'collection.html'), 'w', encoding='utf-8').write(head('Shop all', body_class='template-collection') + header(over=False) + col + footer())

# ---------------- PRODUCTS ----------------
# DEV promotion config for the static preview only. In the Shopify theme these come from the
# "Product" section settings (all off / 0 by default). Nothing here is a real, live offer — create the
# matching discount codes / automatic discounts in Shopify before enabling them on the store.
PROMOS = {
    'coupon': {'code': 'WELCOME10', 'pct': 10, 'min': 0, 'stacks': False},   # needs a real Shopify discount code
    'prepaid_pct': 5,                                                          # needs a payment-method discount
    'bundle': {'duo_pct': 10, 'trio_pct': 15},                                 # needs an automatic bundle discount
    'free_ship_min': 0, 'ship_flat': 0,                                        # 0 = free shipping on every order
}
IC = {
 'truck': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-.01M17 19a1.5 1.5 0 1 0 0-.01"/></svg>',
 'return': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/></svg>',
 'needle': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20 18 6a2.5 2.5 0 1 1 2 2L6 22zM9 15l2 2"/></svg>',
 'check': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 4.5 3.3 8 8 9 4.7-1 8-4.5 8-9V6zM8.5 12l2.5 2.5 4.5-5"/></svg>',
 'lock': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
 'expand': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
}
FAQ = [
 ('How does the fit run?', 'Boxy and true to size. If you sit between sizes or want a roomier drape, size up.'),
 ('How long does delivery take?', 'Orders are dispatched in 2–4 days and shipped free across India.'),
 ('Can I return or exchange?', 'Yes — returns within 10 days, unworn with tags on.'),
 ('How do I care for it?', 'Cold wash inside out, line dry in shade, do not tumble. Frayed and patchwork pieces soften with wear — that is the point.'),
 ('Why might two pieces look slightly different?', 'Every piece is finished by hand in limited runs, so small differences are part of the cloth.'),
]
# DEV placeholder merchandising badges — in Shopify they come from product tags (best-seller / new / limited).
BADGES = {'lattice-zip-jacket': 'New', 'diamond-jaal-bomber': 'Best seller', 'frayed-street-denim': 'Limited', 'archive-patchwork-jacket': 'Limited'}
SIZES_ALL = ["S", "M", "L", "XL", "XXL"]
def slides_for(p):
    hero = p.get('hero', [])
    out = [(f'../assets/{c}', f'../assets/{c}', f'../assets/{c[:-4]}-800.jpg') for c in hero]
    out += [(f'../assets/{img(p["handle"],n+1)}', f'../assets/{img(p["handle"],n+1)}', f'../assets/{p["handle"]}-{n+1}-800.jpg') for n in range(len(p['photos']))]
    extra = list(p.get('campaign', []))
    if p['handle'] in GALLERY_EXTRA: extra.append(GALLERY_EXTRA[p['handle']])
    seen = set(hero)
    for c in extra:
        if c in seen: continue
        out.append((f'../assets/{c}', f'../assets/{c}', f'../assets/{c}'))
    return out
def pdp_item(q, idx=0):
    return {'id': q['handle'], 'handle': q['handle'], 'title': q['title'], 'type': q['type'], 'tag': q['tag'], 'fabric': q['fabric'],
            'badge': BADGES.get(q['handle'], ''), 'price': q['price'], 'compare': 0, 'img': f'../assets/{pri800(q["handle"])}', 'url': f'{q["handle"]}.html',
            'sizes': [{'id': f'{q["handle"]}-{s}', 'title': s, 'available': not (s == 'XXL' and idx % 3 == 0)} for s in SIZES_ALL]}
for i, p in enumerate(cat):
    sl = slides_for(p)
    slides_json = json.dumps([{'src': a, 'full': b, 'alt': f'{p["title"]} — view {n+1}'} for n, (a, b, c) in enumerate(sl)])
    thumbs = ''.join(f'<button class="pdp-thumb{" is-active" if n==0 else ""}" type="button" aria-label="Show image {n+1}"><img src="{c}" alt="" loading="lazy" width="168" height="210"></button>' for n, (a, b, c) in enumerate(sl))
    same = [q for q in cat if q['handle'] != p['handle'] and q['type'] == p['type']]
    others = [q for q in cat if q['handle'] != p['handle'] and q not in same]
    pairs = [pdp_item(q, k) for k, q in enumerate((others + same)[:6])]   # complementary first: different category
    main_item = pdp_item(p, i); main_item['id'] = p['handle']
    data = json.dumps({'promos': PROMOS, 'main': main_item, 'pairs': pairs})
    story_img = sl[-1][0]
    looks = p.get('looks', [])
    look_html = ''
    if looks:
        look_json = json.dumps([{'src': f'../assets/{n}', 'full': f'../assets/{n}', 'alt': f'{p["title"]} — look {k+1}'} for k, n in enumerate(looks)])
        look_html = '<section class="pdp-sec pdp-look" id="look" data-pdp-look><div class="container"><p class="pdp-kick" data-pdp-rise>The look</p><h2 class="pdp-h2" data-pdp-rise>More of this piece</h2><p class="pdp-lead" data-pdp-rise>See how it moves, layers and sits — styled across the Drop 01 campaign.</p><div class="pdp-look__grid">' + ''.join(f'<button type="button" class="pdp-look__i" data-look="{k}" aria-label="Open image {k+1} of {len(looks)}"><img src="../assets/{n}" alt="{e(p["title"])} — look {k+1}" loading="lazy" width="1000" height="1250"></button>' for k, n in enumerate(looks)) + f'</div><script type="application/json" data-look-slides>{look_json}</script></div></section>'
    page = head(p['title'], base='../', body_class='template-product') + header(base='../', over=False)
    page += f'''<section class="pdp-hero" data-pdp><div class="container"><div class="product product--pdp">
  <div class="pdp-gallery{' no-thumbs' if len(sl)<2 else ''}" data-gallery>
    <div class="pdp-thumbs" role="group" aria-label="Product images">{thumbs if len(sl)>1 else ''}</div>
    <div class="pdp-stage" data-stage><span class="pdp-badge">{e(TAGS.get(p['handle'],'Drop 01'))}</span><img data-main src="{sl[0][0]}" alt="{e(p['title'])} — view 1" width="1200" height="1500"><button class="pdp-expand" type="button" data-expand aria-label="Open full-screen gallery">{IC['expand']}</button></div>
    <script type="application/json" data-slides>{slides_json}</script>
    <script type="application/json" data-pdp-data>{data}</script>
  </div>
  <div class="product__info">
    <div class="product__crumb"><a href="../index.html">Home</a> · <a href="../collection.html">Drop 01</a> · <a href="../collection.html">{p['type']}</a></div>
    <div class="pdp-brand">Terzee Origins — Drop 01</div>
    <h1 class="product__title" data-split>{e(p['title'])}</h1>
    <div class="pdp-sub">{p['type']} · {p['tag']}</div>
    <div class="product__desc t-body">{e(p['desc'])}</div>
    <div class="pdp-pricebox">
      <div class="pdp-pricebox__was" data-was-row hidden>Regular price <s data-was></s></div>
      <div class="pdp-pricebox__your"><span class="pdp-pricebox__lab">Your price</span><div class="product__price" data-price data-your-price>{rupee(p['price'])}</div><span class="pdp-save" data-save hidden></span></div>
      <div class="pdp-tax">Inclusive of all taxes · Free shipping across India</div>
    </div>
    <div class="pdp-best" data-bestdeal hidden><div class="pdp-best__t"><small>Best deal today</small>As low as<b data-bd-price></b><span data-bd-how></span></div><button type="button" data-unlock>Unlock my deal</button></div>
    <form data-preview-cart data-pdp-form data-title="{e(p['title'])}" data-price="{p['price']}" data-img="../assets/{pri800(p['handle'])}">
      <div class="sizes" data-option><div class="sizes__head"><span class="t-label">Size</span><a class="link" href="#details">Fit &amp; details</a></div>
        <div class="sizes__grid">{''.join(f'<label><input type="radio" name="size" value="{s}"{" checked" if s=="M" else ""}{" disabled" if s=="XXL" and i%3==0 else ""}><span>{s}</span></label>' for s in SIZES_ALL)}</div></div>
      <div class="pdp-buy">
        <div class="pdp-qty"><button type="button" data-qty-step="-1" aria-label="Decrease quantity">−</button><input name="quantity" type="number" min="1" max="10" value="1" data-qty-input aria-label="Quantity" inputmode="numeric"><button type="button" data-qty-step="1" aria-label="Increase quantity">+</button></div>
        <button class="btn btn--red" type="submit"><span>Add to bag<span data-cta-price> — {rupee(p['price'])}</span></span></button>
        <button class="btn btn--ghost" type="button" data-buy-now><span>Buy it now</span></button>
      </div>
    </form>
    <div class="pdp-assure">
      <div>{IC['lock']}<span><b>Secure checkout.</b> Encrypted payment at checkout.</span></div>
      <div>{IC['truck']}<span><b>Free shipping.</b> Ships by <span data-dispatch>in 2–4 days</span></span></div>
      <div>{IC['return']}<span><b>10-day returns.</b> Unworn, tags on.</span></div>
      <div>{IC['needle']}<span><b>Cut &amp; sewn by hand.</b> Limited runs, Drop 01.</span></div>
    </div>
    <div class="acc" id="details">
      <details open><summary>Details<i></i></summary><div class="acc__body">Boxy fit, true to size. Men and unisex. Each piece is finished by hand, so small differences are part of the cloth.</div></details>
      <details><summary>Fabric &amp; care<i></i></summary><div class="acc__body">{e(p['fabric'])}. Cold wash inside out, line dry in shade, do not tumble.</div></details>
      <details><summary>Shipping &amp; returns<i></i></summary><div class="acc__body">Free shipping across India. Dispatched in 2–4 days. Returns within 10 days, unworn, tags on.</div></details>
    </div>
  </div></div></div></section>
<section class="pdp-sec pdp-sec--ivory" id="offers" data-pdp-offers data-header-light><div class="container"><p class="pdp-kick" data-pdp-rise>Offers</p><h2 class="pdp-h2" data-pdp-rise>Unlock your Terzee privileges</h2><p class="pdp-lead" data-pdp-rise>Every offer that applies to this piece, in one place. Offers marked as codes are confirmed at checkout.</p><div class="pdp-tiles" data-mount></div></div></section>
<section class="pdp-sec pdp-sec--dark" id="sets" data-pdp-sets><div class="container"><p class="pdp-kick" data-pdp-rise>Sets</p><h2 class="pdp-h2" data-pdp-rise>The more you discover, the more you save</h2><p class="pdp-lead" data-pdp-rise>Pick one piece or pair it. Your total updates as you choose.</p><div class="pdp-sets" data-mount></div></div></section>
<section class="pdp-sec pdp-sec--ivory" id="collection" data-pdp-collection data-header-light><div class="container"><p class="pdp-kick" data-pdp-rise>Complete the wardrobe</p><h2 class="pdp-h2" data-pdp-rise>Add more from Drop 01</h2><div data-mount></div></div></section>
<section class="pdp-story"><div class="pdp-story__media"><img src="{story_img}" alt="{e(p['title'])} styled" loading="lazy" width="1200" height="1500"></div>
  <div class="pdp-story__text"><p class="pdp-kick" data-pdp-rise>The piece</p><h2 data-pdp-rise>{e(p['tag'])}, made by hand.</h2><p class="t-body-lg" data-pdp-rise>{e(p['desc'])}</p>
    <div class="pdp-story__facts" data-pdp-rise><div><b>Cloth</b><span>{e(p['fabric'].split(' · ')[0])}</span></div><div><b>Fit</b><span>Boxy, true to size</span></div><div><b>Finish</b><span>Hand finished in limited runs</span></div></div></div></section>
<section class="pdp-sec pdp-sec--ivory" id="compare" data-pdp-compare data-header-light><div class="container"><p class="pdp-kick" data-pdp-rise>Compare</p><h2 class="pdp-h2" data-pdp-rise>Find your piece</h2><div class="pdp-cmps" data-mount></div></div></section>
<section class="pdp-sec pdp-sec--black" id="reviews"><div class="container"><p class="pdp-kick" data-pdp-rise>Reviews</p><h2 class="pdp-h2" data-pdp-rise>Worn by you</h2>
  <div class="pdp-rev"><div><div class="pdp-rev__score">—</div><div style="opacity:.6">No ratings yet</div><div class="pdp-rev__bars" aria-hidden="true">{''.join(f'<div><span>{n}★</span><i></i><span>0</span></div>' for n in (5,4,3,2,1))}</div></div>
  <div class="pdp-rev__empty"><h3>Be the first to review</h3><p>Reviews appear here once customers have worn the piece. Connect your reviews app to show ratings, photos and verified-purchase labels.</p></div></div></div></section>
<section class="pdp-sec pdp-sec--ivory" data-header-light><div class="container"><p class="pdp-kick">FAQ</p><h2 class="pdp-h2">Good to know</h2>
  <div class="acc pdp-faq">{''.join(f'<details><summary>{q}<i></i></summary><div class="acc__body">{a}</div></details>' for q, a in FAQ)}</div></div></section>
<div class="pdp-bar" data-bar aria-label="Quick purchase"><img src="../assets/{pri800(p['handle'])}" alt="" width="88" height="110"><div class="pdp-bar__i"><b data-bar-price>{rupee(p['price'])}</b><span class="pdp-save" data-bar-save hidden></span><span><span data-bar-name>{e(p['title'])}</span> <span data-bar-size></span></span></div><button class="btn btn--red" type="button" data-bar-add><span>Add to bag</span></button></div>'''
    page += footer(base='../') + '<script src="../assets/pdp.js"></script>'
    open(os.path.join(OUT, 'products', p['handle'] + '.html'), 'w', encoding='utf-8').write(page)

# ---------------- STORY ----------------
story = head('Our story', body_class='template-page') + header(over=False)
story += '''<section class="section section--flush section--light" data-header-light><div class="page-narrow">
  <div class="eyebrow t-label"><span class="dia"></span>Our story</div><h1 data-split>Terzee means tailor.</h1>
  <div class="rte t-body-lg"><p>Terzee Origins is a study in one black cloth. Every piece starts the same way — heavy cotton, cut boxy — and leaves the table different: block-printed with lattice and diamond repeats, pieced from raw squares in four greys, or laid with strips of denim and left to fray.</p><p>Nothing is hidden. Blanket stitch traces every collar and hem. Patches keep their exposed edges. The hand is always visible, and no two pieces fall the same way.</p><p>We make in limited runs and ship across India for free. Drop 01 — AW26 is live now.</p></div>
</div></section>
<section class="section section--flush section--dark"><div class="split split--flip">
  <div class="split__text"><div class="eyebrow t-label" data-reveal><span class="dia"></span>Craft</div><h2 class="t-display" data-split>Every piece carries the hand that made it.</h2><p class="t-body-lg u-mt-4" data-reveal style="max-width:46ch">Blanket stitch, block print, patchwork with exposed edges. Slow work, kept patient and precise.</p><div class="u-mt-6" data-reveal><a class="btn btn--paper" href="collection.html"><span>Shop the drop</span></a></div></div>
  <div class="split__media"><video autoplay muted loop playsinline preload="metadata" poster="assets/craft-poster.jpg"><source src="assets/craft-1080x1350.mp4" type="video/mp4"></video></div>
</div></section>''' + footer()
open(os.path.join(OUT, 'story.html'), 'w', encoding='utf-8').write(story)

# preview-only cart script
open(os.path.join(ASSETS, 'preview-cart.js'), 'w', encoding='utf-8').write('''/* Preview-only bag (no Shopify backend). */
(function(){
  var items=[];
  function money(n){return '₹'+n.toLocaleString('en-IN');}
  function render(){
    document.querySelectorAll('[data-cart-count]').forEach(function(el){el.textContent=items.reduce(function(a,b){return a+b.qty},0)});
    var list=document.querySelector('[data-cart-lines]'); if(!list) return;
    list.innerHTML=items.length?items.map(function(it,i){return '<div class="cart-line" data-i="'+i+'"><img src="'+it.img+'" alt=""><div><div class="cart-line__title">'+it.title+'</div><div class="cart-line__meta">'+(it.size||'')+'</div><div class="cart-line__qty"><button data-d="-1">−</button><span>'+it.qty+'</span><button data-d="1">+</button></div><button class="cart-line__remove" data-d="0">Remove</button></div><div>'+money(it.price*it.qty)+'</div></div>'}).join(''):'<p class="cart-empty">Your bag is empty.</p>';
    var sub=document.querySelector('[data-cart-subtotal]'); if(sub) sub.textContent=money(items.reduce(function(a,b){return a+b.price*b.qty},0));
  }
  function addItems(list,opts){
    list.forEach(function(n){
      var ex=items.find(function(x){return x.title===n.title&&x.size===(n.size||'')});
      if(ex) ex.qty+=n.qty||1; else items.push({title:n.title,price:+n.price,img:n.img,size:n.size||'',qty:n.qty||1});
    });
    render(); window.terzeeToast&&window.terzeeToast(list.length>1?'Set added to bag':'Added to bag'); window.terzeeOpenDrawer&&window.terzeeOpenDrawer('cart-drawer');
    return Promise.resolve();
  }
  window.terzeeAddItems=addItems;
  document.addEventListener('submit',function(e){
    var f=e.target.closest('form[data-preview-cart]'); if(!f) return; e.preventDefault();
    var size=(f.querySelector('input[name=size]:checked')||f.querySelector('input[name=size][type=hidden]')||{}).value||'';
    var q=f.querySelector('input[name=quantity]');
    addItems([{title:f.dataset.title,price:+f.dataset.price,img:f.dataset.img,size:size,qty:q?(parseInt(q.value,10)||1):1}]);
  });
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-d]'); if(!b) return; var i=+b.closest('.cart-line').dataset.i; var d=+b.dataset.d;
    if(d===0) items.splice(i,1); else { items[i].qty+=d; if(items[i].qty<=0) items.splice(i,1); } render();
  });
  render();
})();''')
print('built preview:', os.listdir(OUT))
