"""Build shopify/products.csv for Shopify's product importer from media-src/catalog.json.

Shopify needs public image URLs. Two options:
  1. Push the theme first (shopify theme push), then open any product image in the theme editor
     and copy the CDN base, e.g. https://cdn.shopify.com/s/files/1/0123/4567/8901/t/1/assets/
  2. Upload media-src/products/*.jpg in Shopify admin > Content > Files and use that base URL.
Run:  python shopify/make_products_csv.py --base-url "https://cdn.shopify.com/s/files/1/.../assets/"
"""
import csv, json, os, sys, argparse
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument('--base-url', default='https://YOUR-CDN-BASE/'); a = ap.parse_args()
base = a.base_url if a.base_url.endswith('/') else a.base_url + '/'
cat = json.load(open(os.path.join(ROOT, 'media-src', 'catalog.json'), encoding='utf-8'))
SIZES = ['S', 'M', 'L', 'XL', 'XXL']
cols = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
        'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
        'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 'Variant Requires Shipping', 'Variant Taxable',
        'Image Src', 'Image Position', 'Image Alt Text', 'SEO Title', 'SEO Description', 'Status']
out = os.path.join(ROOT, 'shopify', 'products.csv')
with open(out, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=cols); w.writeheader()
    for p in cat:
        imgs = [f"{p['handle']}-{i+1}.jpg" for i in range(len(p['photos']))]
        body = f"<p>{p['desc']}</p><p><em>{p['fabric']}</em></p>"
        tags = ','.join(['drop-01', p['type'].lower(), p['tag'].lower().replace(' ', '-')] + (['new'] if p['handle'] == 'lattice-zip-jacket' else []) + (['limited'] if p['handle'] == 'frayed-street-denim' else []))
        rows = max(len(SIZES), len(imgs))
        for i in range(rows):
            row = {c: '' for c in cols}
            row['Handle'] = p['handle']
            if i == 0:
                row.update({'Title': p['title'], 'Body (HTML)': body, 'Vendor': 'Terzee Origins',
                            'Product Category': 'Apparel & Accessories > Clothing', 'Type': p['type'], 'Tags': tags,
                            'Published': 'TRUE', 'SEO Title': f"{p['title']} – Terzee Origins", 'SEO Description': p['desc'][:155], 'Status': 'active'})
            if i < len(SIZES):
                row.update({'Option1 Name': 'Size', 'Option1 Value': SIZES[i], 'Variant SKU': f"TZ-{p['handle'][:12].upper()}-{SIZES[i]}",
                            'Variant Grams': '650', 'Variant Inventory Tracker': 'shopify', 'Variant Inventory Qty': '5',
                            'Variant Inventory Policy': 'deny', 'Variant Fulfillment Service': 'manual', 'Variant Price': str(p['price']),
                            'Variant Requires Shipping': 'TRUE', 'Variant Taxable': 'TRUE'})
            if i < len(imgs):
                row.update({'Image Src': base + imgs[i], 'Image Position': str(i + 1), 'Image Alt Text': p['title']})
            w.writerow(row)
print('wrote', out)
