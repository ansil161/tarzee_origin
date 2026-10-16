# Terzee Origins v2

A separate redesign shown beside the current site (toggle bottom-left: V1 Current / V2 New). The Shopify `theme/` is untouched.

    python preview/v2/build.py            # regenerates v2 pages, copies the images it uses from theme/assets
    cd preview && python -m http.server 8770   # v1: http://localhost:8770/   v2: http://localhost:8770/v2/

Pages: index, shop, about, one product page per visible catalog item.
Fonts match v1 (Audiowide + Manrope).
Hero, lights and lookbook colours are sampled from each photograph (`tint.py`).
