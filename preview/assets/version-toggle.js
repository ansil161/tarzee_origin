/* Preview-only switch between the current design (v1) and the redesign (v2). Not part of the Shopify theme. */
(function () {
  var p = location.pathname, inV2 = /\/v2\//.test(p);
  var file = p.split('/').pop().replace(/\.html$/, '') || 'index';
  var V2 = ['lattice-zip-jacket', 'diamond-jaal-bomber', 'katran-club', 'archive-patchwork-jacket', 'jaal-pocket-camp-shirt', 'gali-culture'];
  var inProducts = /\/products\//.test(p);
  var v1, v2;
  if (inV2) {
    var h = file.indexOf('product-') === 0 ? file.slice(8) : '';
    v2 = location.href;
    v1 = h ? '../products/' + h + '.html' : file === 'shop' ? '../shop.html' : file === 'about' ? '../story.html' : '../index.html';
  } else {
    var base = inProducts ? '../' : '';
    v1 = location.href;
    v2 = base + 'v2/' + (inProducts && V2.indexOf(file) > -1 ? 'product-' + file + '.html' : file === 'shop' || file === 'collection' ? 'shop.html' : file === 'story' ? 'about.html' : 'index.html');
  }
  var css = '.vt{position:fixed;left:16px;bottom:16px;z-index:9999;display:flex;padding:4px;border-radius:999px;background:rgba(12,12,13,.88);box-shadow:0 10px 30px -10px rgba(0,0,0,.5);font:700 13px/1 system-ui,sans-serif}' +
    '.vt a{padding:10px 16px;border-radius:999px;color:#f2f2ef;text-decoration:none;opacity:.7;transition:background-color .4s cubic-bezier(.32,.72,0,1),color .4s,opacity .4s}' +
    '.vt a:hover{opacity:1}.vt a[aria-current=true]{background:#f2f2ef;color:#0c0c0d;opacity:1}.vt a:focus-visible{outline:2px solid #fff;outline-offset:2px}';
  var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  var n = document.createElement('nav'); n.className = 'vt'; n.setAttribute('aria-label', 'Design version');
  n.innerHTML = '<a href="' + v1 + '"' + (inV2 ? '' : ' aria-current="true"') + '>V1 Current</a><a href="' + v2 + '"' + (inV2 ? ' aria-current="true"' : '') + '>V2 New</a>';
  document.body.appendChild(n);
})();
