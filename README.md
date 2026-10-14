# Terzee Origins — Shopify theme (black & white)

A custom Online Store 2.0 theme for Terzee Origins, plus a static preview you can open without a Shopify store.

```
theme/        Shopify theme (push this to your store)
preview/      Static HTML preview of the same design  →  open preview/index.html
media-src/    Master images, videos, logos, product catalog, AI prompts
shopify/      Product import CSV + generator script
```

## 1. See it now (no store needed)

```
cd preview
python -m http.server 8765
```
Open http://127.0.0.1:8765/ — homepage, collection, every product page, story page, bag drawer.
(Opening index.html directly from disk also works, but video autoplay and fonts behave better over http.)

## 2. Put it on Shopify

**Option A — upload the zip**
Shopify admin → Online Store → Themes → Add theme → Upload zip file → `terzee-theme.zip`.

**Option B — Shopify CLI (already installed, v4.9.3)**
```
cd theme
shopify theme push --unpublished --store YOUR-STORE.myshopify.com
```
It will open a browser login the first time. Then *Customize* the theme in the admin and publish.

## 3. Add the products

1. In the admin, create collections: **Jackets**, **Shirts**, **Shackets** (handles `jackets`, `shirts`, `shackets`) and set the automated condition *Product type equals ...*.
2. Make the images public. Easiest: after the theme is uploaded, every product image is already on the Shopify CDN as a theme asset. In Online Store → Themes → Edit code → Assets, open `lattice-zip-jacket-1.jpg` and copy the URL up to `/assets/`.
3. Generate the CSV with that base URL and import it (Products → Import):
   ```
   python shopify/make_products_csv.py --base-url "https://cdn.shopify.com/s/files/1/XXXX/XXXX/XXXX/t/1/assets/"
   ```
   The CSV creates 9 products with sizes S–XXL, prices, tags (`new`, `limited` drive the card badges), SEO text and images.
4. Theme editor → Homepage → *Featured collection* → pick the **All** collection. Until a collection is chosen, the section shows the built-in demo cards so the design is never empty.
5. Navigation → Main menu: Shop (`/collections/all`), Jackets, Shirts, Story (`/pages/story`). Create the **Story** page and assign the `page.story` template.

## 4. What is in the theme

Homepage sections (all editable in the theme editor): fixed frosted header with the Terzee wordmark · full-screen video hero (your two model clips cut into one monochrome 19 s loop, 9:16 crop on mobile) with the giant TERZEE wordmark centred over it; on scroll it snaps (0.55 s) into the header and becomes the nav logo, turning dark over light sections, exactly like the Valois reference. No announcement bar, marquee or play button, per request · 4-up product grid with hover image swap and quick add · text + craft video split · *Seasonal drop* (image panel + 2×2 product grid with badges, wishlist hearts, strike-through prices, copied from the Framer ECOM template) · *Shop by category* (one tall + two wide rounded grey cards with cut-out models, same template) · pinned horizontal lookbook · *jacket reveal* (two halves of a hands-holding-the-jacket photo slide apart on scroll to show the TERZEE wordmark, then the campaign shot and a one-line about sentence that lights up letter by letter) · full-bleed story block · newsletter · dark footer.
Templates: product (sticky info, size selector, accordions, AJAX add-to-bag, related products), collection (filters, sort, pagination), cart page + cart drawer, search, pages, 404, password gate with video, customer account pages.
Motion: GSAP + ScrollTrigger + Lenis smooth scroll — preloader, word-by-word headline reveals, hero parallax, scroll-speed marquee, magnetic buttons, custom cursor, horizontal lookbook. All of it respects `prefers-reduced-motion`.

Theme settings: logo upload, colours (ink / paper / stone / ash), motion toggles, socials, shipping note.

## 5. Media

* `media-src/products/` — 13 product photos cut out with BiRefNet, graded monochrome, composed on a studio ground (1200×1500 + 800×1000).
* `media-src/lookbook/` — your three concept renders graded black & white + detail crops.
* `media-src/video/` — Veo 3.1 hero clips generated via Higgsfield from the campaign stills (`hero-veo-1920.mp4` 16:9, `hero-veo-mobile-720x1280.mp4` 9:16, raw originals in `raw-veo-*.mp4`), the 33 s brand film (`brand-film-1920.mp4`: Veo takes → craft close-ups → end card, silent), plus the earlier ffmpeg-only triptych/craft loops kept as fallbacks. `integrate_veo.py` re-grades and installs new clips.
* `media-src/campaign/` — AI-generated (Higgsfield, GPT Image 2.5) black & white campaign masters for the jacket reveal: hands holding the jacket open (+ the cut-out with a transparent chest), the diamond-print model shot used on the site and a patchwork alternative.
* `media-src/logos/` — wordmark, monogram and rosette in pure white and pure black.
* `media-src/GENERATION-PROMPTS.md` — ready-to-run Higgsfield prompts for more campaign images/video once the account has credits.

Rebuild the preview after changing anything in `theme/assets` or `media-src/catalog.json`: `python preview/build.py`.
