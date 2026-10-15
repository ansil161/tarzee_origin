/* Terzee PDP 2.0 — gallery, offer stack, live savings calculator, sets, collection carousel,
   comparison, sticky bar and cart-drawer extras.
   All promotions come from the JSON in [data-pdp-data] (Shopify: section settings; preview: dev config).
   Cart actions go through window.terzeeAddItems(items, {checkout, discount}) — theme.js (Shopify) / preview-cart.js (preview).
   item = {id, qty, title, price, img, size}. Prices are rupees. */
(function () {
  var root = document.querySelector('[data-pdp]');
  if (!root) return;
  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
  var fmt = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
  var toast = function (m) { window.terzeeToast && window.terzeeToast(m); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { v === null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Data ---------- */
  var D = { promos: {}, main: {}, pairs: [] };
  try { D = JSON.parse($('[data-pdp-data]').textContent); } catch (e) {}
  var P = D.promos || {};
  var C = P.coupon && P.coupon.code ? P.coupon : null;
  var pairs = (D.pairs || []);
  var avail = pairs.filter(function (p) { return p.sizes && p.sizes.some(function (s) { return s.available; }); });
  function firstSize(p) { return (p.sizes || []).filter(function (s) { return s.available; })[0] || (p.sizes || [])[0] || {}; }

  /* ---------- Gallery ---------- */
  var slides = [];
  try { slides = JSON.parse($('[data-slides]').textContent); } catch (e) {}
  var stage = $('[data-stage]'), main = $('[data-main]');
  var thumbs = $$('.pdp-thumb'), cur = 0;
  function show(i, instant) {
    if (!slides.length) return;
    cur = (i + slides.length) % slides.length;
    var s = slides[cur];
    thumbs.forEach(function (t, n) { t.classList.toggle('is-active', n === cur); t.setAttribute('aria-current', n === cur); });
    if (instant || reduce) { main.src = s.src; main.alt = s.alt; return; }
    stage.classList.add('is-swap');
    setTimeout(function () {
      main.src = s.src; main.alt = s.alt;
      main.onload = function () { stage.classList.remove('is-swap'); };
      setTimeout(function () { stage.classList.remove('is-swap'); }, 400);
    }, 160);
  }
  thumbs.forEach(function (t, n) { t.addEventListener('click', function () { show(n); }); });
  if (window.matchMedia('(hover: hover)').matches) {
    stage.addEventListener('mouseenter', function () { if (!reduce) stage.classList.add('is-zoom'); });
    stage.addEventListener('mouseleave', function () { stage.classList.remove('is-zoom'); });
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      stage.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%');
      stage.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  }
  var sx = null;
  stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); stage._swiped = true; setTimeout(function () { stage._swiped = false; }, 50); }
  });

  /* ---------- Lightbox ---------- */
  var lb = document.createElement('div');
  lb.className = 'pdp-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Product images');
  lb.innerHTML = '<button class="pdp-lb__x" aria-label="Close">✕</button><button class="pdp-lb__p" aria-label="Previous image">←</button><img alt=""><button class="pdp-lb__n" aria-label="Next image">→</button><div class="pdp-lb__c"></div>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img'), lbC = lb.querySelector('.pdp-lb__c'), lastFocus = null;
  function lbShow(i) { cur = (i + slides.length) % slides.length; lbImg.src = slides[cur].full || slides[cur].src; lbImg.alt = slides[cur].alt; lbC.textContent = (cur + 1) + ' / ' + slides.length; }
  function lbOpen() { lastFocus = document.activeElement; lbShow(cur); lb.classList.add('is-open'); document.documentElement.style.overflow = 'hidden'; lb.querySelector('.pdp-lb__x').focus(); }
  function lbClose() { lb.classList.remove('is-open'); document.documentElement.style.overflow = ''; show(cur, true); lastFocus && lastFocus.focus(); }
  stage.addEventListener('click', function (e) { if (e.target.closest('.pdp-heart')) return; if (!stage._swiped) lbOpen(); });
  $('[data-expand]').addEventListener('click', function (e) { e.stopPropagation(); lbOpen(); });
  lb.querySelector('.pdp-lb__x').addEventListener('click', lbClose);
  lb.querySelector('.pdp-lb__p').addEventListener('click', function () { lbShow(cur - 1); });
  lb.querySelector('.pdp-lb__n').addEventListener('click', function () { lbShow(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowLeft') lbShow(cur - 1);
    else if (e.key === 'ArrowRight') lbShow(cur + 1);
    else if (e.key === 'Tab') { var f = lb.querySelectorAll('button'), a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  var lx = null;
  lb.addEventListener('touchstart', function (e) { lx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (lx === null) return; var dx = e.changedTouches[0].clientX - lx; lx = null; if (Math.abs(dx) > 40) lbShow(cur + (dx < 0 ? 1 : -1)); });

  /* ---------- Hero basics: qty, dispatch ---------- */
  var form = $('[data-pdp-form]'), qty = $('[data-qty-input]');
  $$('[data-qty-step]').forEach(function (b) {
    b.addEventListener('click', function () { qty.value = Math.min(10, Math.max(1, (parseInt(qty.value, 10) || 1) + parseInt(b.dataset.qtyStep, 10))); update(); });
  });
  qty.addEventListener('change', function () { qty.value = Math.min(10, Math.max(1, parseInt(qty.value, 10) || 1)); update(); });
  var ds = $('[data-dispatch]');
  if (ds) {
    var f = function (d) { return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); };
    var a = new Date(), b = new Date(); a.setDate(a.getDate() + 2); b.setDate(b.getDate() + 4);
    ds.textContent = f(a) + ' – ' + f(b);
  }
  function selectedSize() { var c = form.querySelector('input[type=radio]:checked'); return c ? c.value : ''; }
  function mainItem(q) {
    return { id: (form.querySelector('[name=id]') || {}).value || D.main.id, qty: q || parseInt(qty.value, 10) || 1, title: form.dataset.title, price: +form.dataset.price, img: form.dataset.img, size: selectedSize() };
  }

  /* ---------- Promo state ---------- */
  var state = { mode: 'A', coupon: store.get('terzee_coupon') === '1', prepaid: store.get('terzee_prepaid') === '1', picks: {} };
  var MODES = { A: { n: 1, label: 'Just your piece' }, B: { n: 2, label: 'The Duo Edit' }, C: { n: 3, label: 'The Signature Collection' } };
  function bundlePct(m) { var b = P.bundle || {}; return m === 'B' ? (+b.duo_pct || 0) : m === 'C' ? (+b.trio_pct || 0) : 0; }
  function modeItems(m) {
    var items = [mainItem(m === 'A' ? null : 1)];
    for (var i = 0; i < MODES[m].n - 1; i++) { var p = avail[i]; if (p) { var s = firstSize(p); items.push({ id: s.id, qty: 1, title: p.title, price: p.price, compare: p.compare, img: p.img, size: s.title, image: p.img }); } }
    items[0].compare = D.main.compare || 0;
    return items;
  }
  function modeOK(m) { return modeItems(m).length === MODES[m].n; }

  /* calc: single source of truth for every number shown */
  function calc(o) {
    var items = o.items, couponOn = o.coupon && C, prepaidOn = o.prepaid && +P.prepaid_pct > 0;
    var sub = 0, regular = 0;
    items.forEach(function (i) { sub += i.price * i.qty; regular += Math.max(i.compare || 0, i.price) * i.qty; });
    var productDisc = regular - sub;
    var bPct = bundlePct(o.mode), bDisc = Math.round(sub * bPct / 100);
    var cDisc = (couponOn && sub >= (+C.min || 0)) ? Math.round(sub * (+C.pct || 0) / 100) : 0;
    var usedB = bDisc, usedC = cDisc, note = '';
    if (!(C && C.stacks)) {
      if (bDisc && cDisc) {
        if (bDisc >= cDisc) { usedC = 0; note = 'Set savings (' + bPct + '%) beat ' + C.code + ' (' + C.pct + '%) — best eligible offer applied. Offers do not combine.'; }
        else { usedB = 0; note = C.code + ' (' + C.pct + '%) beats the set savings (' + bPct + '%) — best eligible offer applied. Offers do not combine.'; }
      }
    }
    if (couponOn && !cDisc && (+C.min || 0) > sub) note = C.code + ' needs a minimum of ' + fmt(C.min) + '.';
    var net = sub - usedB - usedC;
    var pre = prepaidOn ? Math.round(net * (+P.prepaid_pct) / 100) : 0;
    var minShip = +P.free_ship_min || 0;
    var ship = (!minShip || net >= minShip) ? 0 : (+P.ship_flat || 0);
    var total = net - pre + ship;
    return { items: items, regular: regular, sub: sub, productDisc: productDisc, bundle: usedB, bundlePct: bPct, coupon: usedC, prepaid: pre, shipping: ship, total: total, saved: productDisc + usedB + usedC + pre, note: note };
  }
  function cur_(m, q) { return calc({ items: m === 'A' ? [Object.assign(mainItem(1), { compare: D.main.compare || 0, qty: q })] : modeItems(m), mode: m, coupon: state.coupon, prepaid: state.prepaid }); }
  function current() { return cur_(state.mode, parseInt(qty.value, 10) || 1); }

  /* ---------- Animated numbers ---------- */
  function setNum(el, v, prefix) {
    if (!el) return; prefix = prefix || '';
    var from = el._v === undefined ? v : +el._v; el._v = v;
    if (reduce || from === v || !el.isConnected) { el.textContent = prefix + fmt(v); return; }
    var t0 = performance.now(), d = 450;
    cancelAnimationFrame(el._raf);
    (function tick(t) { var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = prefix + fmt(from + (v - from) * e); if (k < 1) el._raf = requestAnimationFrame(tick); })(t0);
  }

  /* ---------- Offer stack ---------- */
  var offersEl = document.querySelector('[data-pdp-offers] [data-mount]');
  function renderOffers() {
    if (!offersEl) return;
    var t = [], n = 0, num = function () { n++; return '0' + n; };
    var c1 = current();
    if (D.main.compare > D.main.price) t.push(tile(num(), 'Instant savings', 'Save ' + fmt(D.main.compare - D.main.price) + ' (' + Math.round((D.main.compare - D.main.price) / D.main.compare * 100) + '% off)', 'Already included in your price.', '', '<span class="pdp-st is-on">Applied</span>'));
    if (C) t.push(tile(num(), 'Extra coupon savings', C.pct + '% off your order', (+C.min ? 'Min. order ' + fmt(C.min) + '. ' : '') + 'Does not combine with set savings — the better offer applies.', '<div class="pdp-code"><b>' + esc(C.code) + '</b><button type="button" data-copy="' + esc(C.code) + '"><span data-copy-label>Copy code</span></button></div>', '<button type="button" class="pdp-apply' + (state.coupon ? ' is-on' : '') + '" data-apply="coupon" aria-pressed="' + state.coupon + '">' + (state.coupon ? 'Applied ✓' : 'Apply') + '</button>'));
    if (+P.prepaid_pct > 0) t.push(tile(num(), 'Prepaid benefit', 'Extra ' + P.prepaid_pct + '% off online payment', 'Taken at checkout when you pay online. Stacks with the other offers.', '', '<button type="button" class="pdp-apply' + (state.prepaid ? ' is-on' : '') + '" data-apply="prepaid" aria-pressed="' + state.prepaid + '">' + (state.prepaid ? 'Selected ✓' : 'I’ll pay online') + '</button>'));
    var minShip = +P.free_ship_min || 0;
    t.push(tile(num(), 'Complimentary shipping', minShip ? 'Free above ' + fmt(minShip) : 'Free on every order', minShip ? (c1.sub - c1.bundle - c1.coupon >= minShip ? 'Unlocked on this order.' : 'Add ' + fmt(minShip - (c1.sub - c1.bundle - c1.coupon)) + ' more to unlock.') : 'Across India — nothing to unlock.', '', '<span class="pdp-st is-on">' + (minShip && c1.shipping ? 'Locked' : 'Unlocked') + '</span>'));
    offersEl.innerHTML = t.join('');
  }
  function tile(n, title, benefit, cond, extra, action) {
    return '<article class="pdp-tile"><span class="pdp-tile__n">' + n + '</span><h3>' + title + '</h3><p class="pdp-tile__b">' + benefit + '</p><p class="pdp-tile__c">' + cond + '</p>' + extra + '<div class="pdp-tile__a">' + action + '</div></article>';
  }

  /* ---------- Sets + calculator ---------- */
  var setsEl = document.querySelector('[data-pdp-sets] [data-mount]');
  function stackImgs(items) { return '<span class="pdp-stackimg">' + items.map(function (i, n) { return '<img src="' + esc(i.img) + '" alt="" loading="lazy" style="--n:' + n + '">'; }).join('') + '</span>'; }
  function renderSets() {
    if (!setsEl) return;
    var cs = { A: cur_('A', parseInt(qty.value, 10) || 1), B: modeOK('B') ? cur_('B') : null, C: modeOK('C') ? cur_('C') : null };
    var per = {}, best = null;
    Object.keys(cs).forEach(function (m) { if (cs[m]) { per[m] = cs[m].total / cs[m].items.reduce(function (a, i) { return a + i.qty; }, 0); if (m !== 'A' && (best === null || per[m] < per[best])) best = m; } });
    if (best && per[best] >= per.A) best = null;
    var opts = Object.keys(MODES).map(function (m) {
      var c = cs[m], dis = !c;
      var sum = dis ? '' : '<div class="pdp-opt__p"><b data-opt-total="' + m + '">' + fmt(c.total) + '</b>' + (c.saved > 0 ? '<s>' + fmt(c.regular) + '</s><span class="pdp-save">Save ' + fmt(c.saved) + '</span>' : '') + '</div>';
      var list = dis ? '<p class="pdp-opt__l">Not enough available pieces to build this set.</p>' : '<ul class="pdp-opt__l">' + c.items.map(function (i) { return '<li>' + esc(i.title) + (i.size ? ' <i>' + esc(i.size) + '</i>' : '') + (i.qty > 1 ? ' × ' + i.qty : '') + '</li>'; }).join('') + '</ul>';
      return '<label class="pdp-opt' + (state.mode === m ? ' is-on' : '') + (dis ? ' is-off' : '') + '"><input type="radio" name="pdp-mode" value="' + m + '"' + (state.mode === m ? ' checked' : '') + (dis ? ' disabled' : '') + '>' +
        (dis ? '' : stackImgs(c.items)) + '<div class="pdp-opt__t"><span class="pdp-opt__k">Option ' + m + '</span><h3>' + MODES[m].label + '</h3>' +
        '<p class="pdp-opt__s">' + (m === 'A' ? 'One piece at its current price.' : (bundlePct(m) ? 'Set savings: ' + bundlePct(m) + '% off.' : 'Pieces from Drop 01 together.')) + '</p>' + list +
        (m === best ? '<span class="pdp-opt__tag">Lowest price per piece</span>' : '') + '</div>' + sum + '</label>';
    }).join('');
    setsEl.innerHTML = '<div class="pdp-opts" role="radiogroup" aria-label="Choose your set">' + opts + '</div><aside class="pdp-calc" aria-live="polite" data-calc></aside>';
    renderCalc();
  }
  function row(label, val, cls, key) { return '<div class="pdp-calc__r ' + (cls || '') + '"><dt>' + label + '</dt><dd' + (key ? ' data-calc-' + key : '') + '>' + val + '</dd></div>'; }
  function renderCalc() {
    var el = $('[data-calc]', document); if (!el) return;
    var c = current(), n = c.items.reduce(function (a, i) { return a + i.qty; }, 0);
    var rows = row('Regular merchandise total', fmt(c.regular));
    if (c.productDisc > 0) rows += row('Product discount', '− ' + fmt(c.productDisc), 'is-g');
    if (c.bundle > 0) rows += row('Set savings (' + c.bundlePct + '%)', '− ' + fmt(c.bundle), 'is-g');
    if (c.coupon > 0) rows += row('Coupon ' + esc(C.code), '− ' + fmt(c.coupon), 'is-g');
    if (c.prepaid > 0) rows += row('Prepaid benefit', '− ' + fmt(c.prepaid), 'is-g');
    rows += row('Shipping', c.shipping ? fmt(c.shipping) : 'Free', c.shipping ? '' : 'is-g');
    el.innerHTML = '<h3>Your deal</h3><p class="pdp-calc__m">' + MODES[state.mode].label + ' · ' + n + (n > 1 ? ' pieces' : ' piece') + '</p><dl>' + rows + '</dl>' +
      '<div class="pdp-calc__save' + (c.saved > 0 ? '' : ' is-zero') + '"><span>You save</span><b data-calc-save>' + fmt(c.saved) + '</b></div>' +
      '<div class="pdp-calc__tot"><span>Your total</span><b data-calc-total>' + fmt(c.total) + '</b></div>' +
      (c.note ? '<p class="pdp-calc__n">' + c.note + '</p>' : '') +
      '<button class="btn btn--red" type="button" data-add-set><span>Add this set to bag</span></button>' +
      '<p class="pdp-calc__f">' + (state.coupon && C ? 'Code ' + esc(C.code) + ' is carried to checkout, where it is validated. ' : '') + (state.prepaid ? 'Prepaid benefit is applied at checkout when you pay online. ' : '') + 'Final amount is confirmed at checkout.</p>';
    var s = el.querySelector('[data-calc-save]'), t = el.querySelector('[data-calc-total]');
    s._v = el._ps; t._v = el._pt; setNum(s, c.saved); setNum(t, c.total); el._ps = c.saved; el._pt = c.total;
  }

  /* ---------- Collection carousel ---------- */
  var colEl = document.querySelector('[data-pdp-collection] [data-mount]');
  function renderCollection() {
    if (!colEl) return;
    if (!pairs.length) { colEl.closest('section').hidden = true; return; }
    colEl.innerHTML = '<div class="pdp-rail" data-rail tabindex="0" aria-label="Complementary pieces">' + pairs.map(function (p, i) {
      var fs = firstSize(p), sold = !p.sizes.some(function (s) { return s.available; });
      var opts = p.sizes.length > 1 || (p.sizes[0] && p.sizes[0].title !== 'Default Title') ? '<select data-pick-size="' + i + '" aria-label="Size for ' + esc(p.title) + '">' + p.sizes.map(function (s) { return '<option value="' + esc(s.id) + '" data-t="' + esc(s.title) + '"' + (s.id === fs.id ? ' selected' : '') + (s.available ? '' : ' disabled') + '>' + esc(s.title) + (s.available ? '' : ' — sold out') + '</option>'; }).join('') + '</select>' : '';
      return '<article class="pdp-pc' + (sold ? ' is-sold' : '') + '"><a class="pdp-pc__img" href="' + esc(p.url) + '"><img src="' + esc(p.img) + '" alt="' + esc(p.title) + '" loading="lazy" width="600" height="750"></a><div class="pdp-pc__b"><span class="pdp-pc__k">' + esc(p.type) + '</span><h3><a href="' + esc(p.url) + '">' + esc(p.title) + '</a></h3><div class="pdp-pc__p"><b>' + fmt(p.price) + '</b>' + (p.compare > p.price ? '<s>' + fmt(p.compare) + '</s><span class="pdp-save">Save ' + fmt(p.compare - p.price) + '</span>' : '') + '</div>' + opts +
        '<label class="pdp-pc__add"><input type="checkbox" data-pick="' + i + '"' + (sold ? ' disabled' : '') + '><span>' + (sold ? 'Sold out' : 'Add to selection') + '</span></label></div></article>';
    }).join('') + '</div><div class="pdp-pick" data-pick-sum></div>';
    renderPick();
  }
  function picked() {
    var out = [];
    $$('[data-pick]', colEl).forEach(function (c) {
      if (!c.checked) return; var i = +c.dataset.pick, p = pairs[i], sel = colEl.querySelector('[data-pick-size="' + i + '"]'), s = firstSize(p), size = s.title, id = s.id;
      if (sel) { id = sel.value; size = sel.options[sel.selectedIndex].dataset.t; }
      out.push({ id: id, qty: 1, title: p.title, price: p.price, compare: p.compare, img: p.img, size: size });
    });
    return out;
  }
  function renderPick() {
    var el = colEl && colEl.querySelector('[data-pick-sum]'); if (!el) return;
    var it = picked(), c = calc({ items: it, mode: 'A', coupon: false, prepaid: false });
    el.innerHTML = '<div><span>Selected items</span><b>' + it.length + '</b></div><div><span>Original total</span><b>' + fmt(c.regular) + '</b></div><div><span>Your total</span><b>' + fmt(c.total) + '</b></div>' + (c.saved > 0 ? '<div class="is-g"><span>You save</span><b>' + fmt(c.saved) + '</b></div>' : '') +
      '<button class="btn btn--red" type="button" data-add-picked' + (it.length ? '' : ' disabled') + '><span>Add selected products</span></button>' + (it.length && bundlePct('B') ? '<a class="pdp-pick__h" href="#sets" data-scroll>Build a set above to save up to ' + Math.max(bundlePct('B'), bundlePct('C')) + '%</a>' : '');
  }

  /* ---------- Comparison ---------- */
  var cmpEl = document.querySelector('[data-pdp-compare] [data-mount]');
  function renderCompare() {
    if (!cmpEl) return;
    var rows = [Object.assign({}, D.main, { here: true })].concat(pairs.slice(0, 3));
    if (rows.length < 2) { cmpEl.closest('section').hidden = true; return; }
    cmpEl.innerHTML = rows.map(function (p) {
      var sizes = (p.sizes || []).map(function (s) { return s.title; }).filter(function (t) { return t !== 'Default Title'; }).join(' · ');
      return '<article class="pdp-cmp' + (p.here ? ' is-here' : '') + '"><img src="' + esc(p.img) + '" alt="' + esc(p.title) + '" loading="lazy" width="600" height="750"><h3>' + esc(p.title) + '</h3><dl><div><dt>Type</dt><dd>' + esc(p.type || '—') + '</dd></div><div><dt>Technique</dt><dd>' + esc(p.tag || '—') + '</dd></div><div><dt>Cloth</dt><dd>' + esc(p.fabric || '—') + '</dd></div><div><dt>Sizes</dt><dd>' + esc(sizes || '—') + '</dd></div></dl><div class="pdp-cmp__p"><b>' + fmt(p.price) + '</b>' + (p.compare > p.price ? '<s>' + fmt(p.compare) + '</s>' : '') + '</div>' + (p.here ? '<span class="pdp-cmp__here">You are here</span>' : '<a class="btn btn--ink" href="' + esc(p.url) + '"><span>View piece</span></a>') + '</article>';
    }).join('');
  }

  /* ---------- Hero price composition + sticky bar ---------- */
  var variants = [];
  try { variants = JSON.parse(($('[data-variants]') || {}).textContent || '[]'); } catch (e) {}
  var bar = document.querySelector('[data-bar]');
  function currentVariant() {
    var sel = $$('[data-option]').map(function (g) { var c = g.querySelector('input:checked'); return c && c.value; });
    return variants.find(function (v) { return sel.every(function (o, i) { return !o || v.options[i] === o; }); });
  }
  function syncVariant() {
    var v = currentVariant();
    if (v) {
      form.dataset.price = v.price / 100; D.main.price = v.price / 100; D.main.compare = (v.compare_at_price || 0) / 100;
      var idEl = form.querySelector('[name=id]'); if (idEl) idEl.value = v.id;
      if (v.featured_media && v.featured_media.id) {
        var idx = slides.findIndex(function (s) { return String(s.id) === String(v.featured_media.id); });
        if (idx > -1 && idx !== cur) show(idx);
      }
    }
  }
  function heroPrice() {
    var q = parseInt(qty.value, 10) || 1, p = D.main.price, cmp = D.main.compare || 0;
    var yp = $('[data-your-price]'); if (yp) setNum(yp, p);
    var was = $('[data-was]'), sv = $('[data-save]'), wr = $('[data-was-row]');
    if (cmp > p) { if (wr) wr.hidden = false; was.textContent = fmt(cmp); sv.hidden = false; sv.textContent = 'You save ' + fmt((cmp - p) * q) + ' (' + Math.round((cmp - p) / cmp * 100) + '%)'; }
    else { if (wr) wr.hidden = true; sv.hidden = true; }
    var cta = $('[data-cta-price]'); if (cta) cta.textContent = ' — ' + fmt(p * q);
    var bd = $('[data-bestdeal]');
    if (bd) {
      var best = calc({ items: [Object.assign(mainItem(1), { compare: cmp })], mode: 'A', coupon: !!C, prepaid: +P.prepaid_pct > 0 }), base = p;
      var ok = best.total < base;
      bd.hidden = !ok;
      if (ok) { bd.querySelector('[data-bd-price]').textContent = fmt(best.total); bd.querySelector('[data-bd-how]').textContent = [C && best.coupon ? 'code ' + C.code : '', best.prepaid ? 'prepaid' : ''].filter(Boolean).join(' + '); }
    }
  }
  function barSync() {
    if (!bar) return;
    var c = current(), n = c.items.reduce(function (a, i) { return a + i.qty; }, 0), size = selectedSize();
    bar.querySelector('[data-bar-price]').textContent = fmt(c.total);
    bar.querySelector('[data-bar-size]').textContent = state.mode === 'A' ? (size ? 'Size ' + size : '') : MODES[state.mode].label;
    var sv = bar.querySelector('[data-bar-save]'); sv.hidden = !(c.saved > 0); sv.textContent = 'Save ' + fmt(c.saved);
  }
  function update() { heroPrice(); renderOffers(); renderCalcAndOpts(); barSync(); }
  function renderCalcAndOpts() {
    if (!setsEl) return;
    var focus = document.activeElement && document.activeElement.name === 'pdp-mode' ? document.activeElement.value : null;
    // update option prices in place (no re-render → keeps animation + focus), re-render calculator
    ['A', 'B', 'C'].forEach(function (m) {
      var el = setsEl.querySelector('[data-opt-total="' + m + '"]'); if (!el) return;
      var c = cur_(m, parseInt(qty.value, 10) || 1); setNum(el, c.total);
      var box = el.parentNode; var s = box.querySelector('.pdp-save'), w = box.querySelector('s');
      if (s) { s.hidden = !(c.saved > 0); s.textContent = 'Save ' + fmt(c.saved); } if (w) { w.hidden = !(c.saved > 0); w.textContent = fmt(c.regular); }
    });
    renderCalc();
  }

  /* ---------- Events ---------- */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'pdp-mode') { state.mode = t.value; $$('.pdp-opt', document).forEach(function (o) { o.classList.toggle('is-on', o.contains(t)); }); update(); }
    else if (t.matches && t.matches('[data-pick],[data-pick-size]')) renderPick();
  });
  form.addEventListener('change', function () { setTimeout(function () { syncVariant(); update(); renderSets(); }, 0); });
  document.addEventListener('click', function (e) {
    var ap = e.target.closest('[data-apply]');
    if (ap) {
      var k = ap.dataset.apply; state[k] = !state[k]; store.set(k === 'coupon' ? 'terzee_coupon' : 'terzee_prepaid', state[k] ? '1' : null);
      if (k === 'coupon') toast(state.coupon ? 'Code ' + C.code + ' selected — validated at checkout' : 'Code removed');
      update(); drawerExtras(); return;
    }
    var cp = e.target.closest('[data-copy]');
    if (cp) {
      var code = cp.dataset.copy, l = cp.querySelector('[data-copy-label]'), old = l.textContent;
      var done = function () { cp.classList.add('is-done'); l.textContent = 'Copied'; toast('Code ' + code + ' copied'); setTimeout(function () { cp.classList.remove('is-done'); l.textContent = old; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, done);
      else { var ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (er) {} ta.remove(); done(); }
      return;
    }
    var sc = e.target.closest('[data-scroll]');
    if (sc) { var tg = document.querySelector(sc.getAttribute('href')); if (tg) { e.preventDefault(); tg.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } return; }
    var un = e.target.closest('[data-unlock]');
    if (un) { if (C) { state.coupon = true; store.set('terzee_coupon', '1'); } if (+P.prepaid_pct > 0) { state.prepaid = true; store.set('terzee_prepaid', '1'); } update(); drawerExtras(); var s = document.getElementById('sets'); s && s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); toast('Best deal selected'); return; }
    var as = e.target.closest('[data-add-set]');
    if (as) { run(as, modeItems(state.mode).map(function (i, n) { if (n === 0 && state.mode === 'A') i.qty = parseInt(qty.value, 10) || 1; return i; })); return; }
    var apk = e.target.closest('[data-add-picked]');
    if (apk) { run(apk, picked()); return; }
    var ba = e.target.closest('[data-bar-add]');
    if (ba) { run(ba, modeItems(state.mode).map(function (i, n) { if (n === 0 && state.mode === 'A') i.qty = parseInt(qty.value, 10) || 1; return i; })); return; }
    var bn = e.target.closest('[data-buy-now]');
    if (bn) { if (form.querySelector('[type=submit]').disabled) return; run(bn, [mainItem()], { checkout: true }); return; }
  });
  function run(btn, items, opts) {
    if (!items.length) return;
    if (!window.terzeeAddItems) { toast('Cart unavailable'); return; }
    opts = opts || {}; if (state.coupon && C) opts.discount = C.code;
    btn.classList.add('is-loading'); btn.disabled = true;
    Promise.resolve(window.terzeeAddItems(items, opts)).catch(function () { toast('Something went wrong — please try again'); }).then(function () { btn.classList.remove('is-loading'); btn.disabled = false; });
  }

  /* ---------- Cart drawer extras: coupon, free-ship progress, one complementary piece ---------- */
  function drawerExtras() {
    var lines = document.querySelector('[data-cart-lines]'); if (!lines) return;
    var ex = document.querySelector('[data-cart-extras]');
    if (!ex) { ex = document.createElement('div'); ex.className = 'cart-extras'; ex.setAttribute('data-cart-extras', ''); lines.insertAdjacentElement('afterend', ex); }
    var h = '', minShip = +P.free_ship_min || 0;
    h += minShip ? '<div class="cx-ship"><span>Free shipping above ' + fmt(minShip) + '</span><i><b style="width:0%" data-cx-bar></b></i></div>' : '<div class="cx-ship"><span>Free shipping on every order</span></div>';
    if (C) h += '<form class="cx-code" data-cx-code><label class="t-label-sm" for="cx-c">Coupon</label><div><input id="cx-c" name="code" autocomplete="off" placeholder="Enter code" value="' + (state.coupon ? esc(C.code) : '') + '"><button type="submit">Apply</button></div><p data-cx-msg>' + (state.coupon ? '<em>' + esc(C.code) + ' selected — validated at checkout.</em>' : '') + '</p></form>';
    var up = avail[0];
    if (up) { var s = firstSize(up); h += '<div class="cx-up"><img src="' + esc(up.img) + '" alt=""><div><span class="t-label-sm">Pairs well</span><b>' + esc(up.title) + '</b><span>' + fmt(up.price) + (s.title && s.title !== 'Default Title' ? ' · ' + esc(s.title) : '') + '</span></div><button type="button" data-cx-up>Add</button></div>'; }
    ex.innerHTML = h;
  }
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-cx-code]'); if (!f) return; e.preventDefault();
    var v = (f.code.value || '').trim().toUpperCase(), m = f.querySelector('[data-cx-msg]');
    if (C && v === String(C.code).toUpperCase()) { state.coupon = true; store.set('terzee_coupon', '1'); m.innerHTML = '<em>' + esc(C.code) + ' selected — final validation happens at checkout.</em>'; update(); }
    else m.innerHTML = '<strong>That code isn’t valid for this order.</strong>';
  });
  document.addEventListener('click', function (e) {
    var u = e.target.closest('[data-cx-up]'); if (!u) return; var p = avail[0], s = firstSize(p);
    run(u, [{ id: s.id, qty: 1, title: p.title, price: p.price, img: p.img, size: s.title }]);
  });
  var cartSub = document.querySelector('[data-cart-subtotal]');
  if (cartSub && (+P.free_ship_min || 0)) new MutationObserver(function () {
    var n = parseInt((cartSub.textContent || '').replace(/[^\d]/g, ''), 10) || 0, b = document.querySelector('[data-cx-bar]');
    if (b) b.style.width = Math.min(100, n / P.free_ship_min * 100) + '%';
  }).observe(cartSub, { childList: true, characterData: true, subtree: true });

  /* ---------- Sticky bar ---------- */
  if (bar) {
    var cta = $('.pdp-buy');
    new IntersectionObserver(function (en) {
      var out = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
      bar.classList.toggle('is-on', out); document.body.classList.toggle('has-pdp-bar', out);
    }, { threshold: 0 }).observe(cta);
  }

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } }); }, { threshold: .12 });
    $$('[data-pdp-rise]', document).forEach(function (el) { el.classList.add('pdp-rise'); io.observe(el); });
  }

  syncVariant(); renderOffers(); renderSets(); renderCollection(); renderCompare(); heroPrice(); barSync(); drawerExtras();

  /* ---- Horizontal carousels (Similar items / More / Recently viewed) ---- */
  function bindHS(sec) {
    var tr = sec.querySelector('[data-hs]'); if (!tr) return;
    var go = function (d) { tr.scrollBy({ left: d * Math.max(240, tr.clientWidth * 0.8), behavior: reduce ? 'auto' : 'smooth' }); };
    var pv = sec.querySelector('[data-hs-prev]'), nx = sec.querySelector('[data-hs-next]');
    pv && pv.addEventListener('click', function () { go(-1); });
    nx && nx.addEventListener('click', function () { go(1); });
    var sync = function () { if (pv) pv.hidden = tr.scrollLeft < 8; if (nx) nx.hidden = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 8; };
    tr.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync); sync();
    setTimeout(sync, 400);
  }

  /* ---- Recently viewed (remembered per browser) with Edit mode ---- */
  (function recent() {
    var KEY = 'terzee_rv', sec = document.querySelector('[data-pdp-recent]'), list = [], editing = false;
    try { list = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
    var me = D.main || {};
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} };
    function draw() {
      if (!sec) return;
      var others = list.filter(function (x) { return x.handle !== me.handle; }).slice(0, 10);
      sec.hidden = !others.length;
      sec.classList.toggle('is-editing', editing);
      sec.querySelector('[data-recent-mount]').innerHTML = others.map(function (x) {
        return '<div class="pdp-hs__i"><div class="shop-card"><div class="shop-card__image-wrapper"><a class="shop-card__image-link" href="' + esc(x.url) + '" tabindex="-1" aria-hidden="true"><img class="shop-card__img" src="' + esc(x.img) + '" alt="' + esc(x.title) + '" width="800" height="1000" loading="lazy"></a>' + (editing ? '<button type="button" class="pdp-rm" data-rm="' + esc(x.handle) + '" aria-label="Remove ' + esc(x.title) + '">×</button>' : '') + '</div><div class="shop-card__info"><h3 class="shop-card__title"><a href="' + esc(x.url) + '">' + esc(x.title) + '</a></h3>' + (x.type ? '<span class="shop-card__category">' + esc(x.type) + '</span>' : '') + (x.tag ? '<span class="shop-card__color">' + esc(x.tag) + '</span>' : '') + '<span class="shop-card__price">' + fmt(x.price) + '</span></div></div></div>';
      }).join('');
      var eb = sec.querySelector('[data-recent-edit]'); if (eb) eb.textContent = editing ? 'Done' : 'Edit';
    }
    if (sec) {
      sec.addEventListener('click', function (e) {
        if (e.target.closest('[data-recent-edit]')) { editing = !editing; draw(); return; }
        var rm = e.target.closest('[data-rm]');
        if (rm) { list = list.filter(function (x) { return x.handle !== rm.dataset.rm; }); save(); if (!list.filter(function (x) { return x.handle !== me.handle; }).length) editing = false; draw(); }
      });
    }
    draw();
    if (me.handle) {
      list = [{ handle: me.handle, title: me.title, type: me.type, tag: me.tag, price: me.price, img: me.img, url: me.url }].concat(list.filter(function (x) { return x.handle !== me.handle; })).slice(0, 12);
      save();
    }
  })();
  $$('[data-pdp-hs]', document).forEach(bindHS);

  /* ---- Option label ("Size: M") ---- */
  $$('[data-option]').forEach(function (o) {
    var out = o.querySelector('[data-opt-val]'); if (!out) return;
    o.addEventListener('change', function (e) { if (e.target && e.target.type === 'radio') out.textContent = e.target.value; });
  });

  /* ---- Special-price label ---- */
  (function promo() {
    var el = $('[data-promo]'); if (!el) return;
    el.hidden = !((D.main.compare || 0) > D.main.price);
  })();

  /* ---- Ratings & Reviews ---- */
  (function reviews() {
    var sec = document.querySelector('[data-rv]'); if (!sec) return;
    var raw = [];
    try { raw = JSON.parse(sec.querySelector('[data-rv-data]').textContent) || []; } catch (e) {}
    if (!Array.isArray(raw)) raw = [];
    var pid = sec.getAttribute('data-pid') || 'p', UKEY = 'terzee_review_mine_' + pid, HKEY = 'terzee_review_votes';
    var mine = [], votes = {};
    try { mine = JSON.parse(localStorage.getItem(UKEY) || '[]'); } catch (e) {}
    try { votes = JSON.parse(localStorage.getItem(HKEY) || '{}'); } catch (e) {}
    var dev = sec.hasAttribute('data-dev'), writeUrl = sec.getAttribute('data-write-url');
    var st = { sort: 'recent', filter: 'all', tag: '', shown: 5 };
    var q = function (s) { return sec.querySelector(s); };
    var all = function () {
      return mine.concat(raw).map(function (r, i) {
        return { id: r.id || ('r' + i), rating: Math.max(0, Math.min(5, +r.rating || 0)), title: r.title || '', body: r.body || '', author: r.author || 'Customer', date: r.date || '', verified: !!r.verified, size: r.size || '', tags: r.tags || [], up: +r.helpful || 0, down: +r.down || 0, fit: +r.fit || 0, length: +r.length || 0, mine: !!r.mine, loc: r.location || '' };
      }).filter(function (r) { return r.rating; });
    };
    var when = function (d) { var t = Date.parse(d); return isNaN(t) ? 0 : t; };
    var fdate = function (d) { var t = when(d); return t ? new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; };
    var stars = function (n) { return '<span class="pdp-stars" style="--r:' + (n / 5 * 100) + '%" aria-hidden="true">★★★★★</span>'; };
    var thumb = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 11v9H4v-9zM7 11l4-8c1.4 0 2.5 1.1 2.5 2.5V9H19a2 2 0 0 1 2 2.3l-1 7A2 2 0 0 1 18 20H7"/></svg>';
    var mine_ = function (r) { return votes[r.id]; };

    function scale(list, key, lo, hi) {
      var v = list.filter(function (r) { return r[key]; });
      if (!v.length) return '';
      var avg = v.reduce(function (a, r) { return a + r[key]; }, 0) / v.length;
      return '<div class="rv__scale"><i><u style="width:' + ((avg - 1) / 4 * 100) + '%"></u></i><span>' + lo + '</span><span>' + hi + '</span></div>';
    }

    function render() {
      var list = all(), total = list.length;
      var sum = list.reduce(function (a, r) { return a + r.rating; }, 0), avg = total ? sum / total : 0;
      var counts = [0, 0, 0, 0, 0, 0]; list.forEach(function (r) { counts[r.rating]++; });

      q('[data-rv-total]').textContent = total ? total + (total === 1 ? ' Star Rating' : ' Star Ratings') : 'No ratings yet';
      q('[data-rv-stars]').style.setProperty('--r', (avg / 5 * 100) + '%');
      var hero = document.querySelector('[data-rating]');
      if (hero) {
        hero.hidden = !total;
        if (total) hero.innerHTML = stars(avg) + '<span>' + avg.toFixed(1) + '</span><a href="#reviews">(' + total + ')</a>';
      }
      q('[data-rv-bars]').innerHTML = [5, 4, 3, 2, 1].map(function (n) {
        var pct = total ? counts[n] / total * 100 : 0, on = st.filter === String(n);
        return '<button type="button" class="rv__bar' + (on ? ' is-on' : '') + '" data-star="' + n + '" aria-pressed="' + on + '" aria-label="' + n + ' stars, ' + counts[n] + ' reviews"><span>' + n + (n === 1 ? ' Star' : ' Stars') + '</span><i><u style="width:' + pct + '%"></u></i><em>' + counts[n] + '</em></button>';
      }).join('');

      var sc = scale(list, 'length', 'Too Short', 'Too Long') + scale(list, 'fit', 'Runs Small', 'Runs Large');
      q('[data-rv-scales]').hidden = !sc; q('[data-rv-scales]').innerHTML = sc;

      var tagCount = {}; list.forEach(function (r) { r.tags.forEach(function (t) { tagCount[t] = (tagCount[t] || 0) + 1; }); });
      var tags = Object.keys(tagCount).sort(function (a, b) { return tagCount[b] - tagCount[a]; }).slice(0, 10);
      q('[data-rv-attrs]').hidden = !tags.length;
      q('[data-rv-chips]').innerHTML = tags.map(function (t) { return '<button type="button" class="' + (st.tag === t ? 'is-on' : '') + '" data-tag="' + esc(t) + '" aria-pressed="' + (st.tag === t) + '">' + esc(t) + '</button>'; }).join('');

      var shown = list.filter(function (r) {
        if (st.filter === 'verified' && !r.verified) return false;
        if (/^[1-5]$/.test(st.filter) && r.rating !== +st.filter) return false;
        if (st.tag && r.tags.indexOf(st.tag) < 0) return false;
        return true;
      });
      shown.sort(function (a, b) {
        if (st.sort === 'high') return b.rating - a.rating || when(b.date) - when(a.date);
        if (st.sort === 'low') return a.rating - b.rating || when(b.date) - when(a.date);
        if (st.sort === 'helpful') return (b.up + (votes[b.id] === 'up' ? 1 : 0)) - (a.up + (votes[a.id] === 'up' ? 1 : 0)) || when(b.date) - when(a.date);
        return when(b.date) - when(a.date);
      });
      q('[data-rv-list]').innerHTML = shown.slice(0, st.shown).map(function (r) {
        var long = r.body.length > 220, up = r.up + (votes[r.id] === 'up' ? 1 : 0), down = r.down + (votes[r.id] === 'down' ? 1 : 0);
        return '<article class="rv__item" data-id="' + esc(r.id) + '"><div class="rv__who">' + stars(r.rating) + '<b>' + esc(r.author) + '</b>' + (fdate(r.date) ? '<span>' + fdate(r.date) + '</span>' : '') + (r.loc ? '<span class="rv__loc">from ' + esc(r.loc) + '</span>' : '') + (r.verified ? '<span class="rv__ok">Verified buyer</span>' : '') + (r.mine ? '<span class="rv__ok">Your review · saved on this device</span>' : '') + '</div>' +
          '<div class="rv__text"><h4>' + esc(r.title) + '</h4><p class="rv__body' + (long ? ' is-clamp' : '') + '">' + esc(r.body) + '</p>' + (long ? '<button type="button" class="rv__readmore" data-readmore>Read more</button>' : '') + (r.size ? '<small>Size purchased: ' + esc(r.size) + '</small>' : '') + '</div>' +
          '<div class="rv__helpful"><span>Was this helpful?</span><div><button type="button" class="' + (votes[r.id] === 'up' ? 'is-on' : '') + '" data-vote="up" data-id="' + esc(r.id) + '" aria-label="Helpful" aria-pressed="' + (votes[r.id] === 'up') + '">' + thumb + '<b>' + up + '</b></button><button type="button" class="rv__down' + (votes[r.id] === 'down' ? ' is-on' : '') + '" data-vote="down" data-id="' + esc(r.id) + '" aria-label="Not helpful" aria-pressed="' + (votes[r.id] === 'down') + '">' + thumb + '<b>' + down + '</b></button></div></div></article>';
      }).join('');
      q('[data-rv-count]').textContent = total ? shown.length + (shown.length === 1 ? ' Review' : ' Reviews') : '';
      q('[data-rv-more]').hidden = shown.length <= st.shown;
      q('[data-rv-tools]').hidden = !total;
      q('[data-rv-empty]').hidden = !!total;
      q('[data-rv-list]').hidden = !total;
      if (total && !shown.length) { q('[data-rv-list]').hidden = false; q('[data-rv-list]').innerHTML = '<p class="rv__none">No reviews match this filter.</p>'; }
      q('[data-rv-filter]').value = st.filter;
    }

    sec.addEventListener('click', function (e) {
      var bar = e.target.closest('[data-star]');
      if (bar) { var n = bar.dataset.star; st.filter = st.filter === n ? 'all' : n; st.shown = 5; render(); return; }
      var tg = e.target.closest('[data-tag]');
      if (tg) { st.tag = st.tag === tg.dataset.tag ? '' : tg.dataset.tag; st.shown = 5; render(); return; }
      if (e.target.closest('[data-rv-more]')) { st.shown += 5; render(); return; }
      var rm = e.target.closest('[data-readmore]');
      if (rm) { var body = rm.previousElementSibling; var open = body.classList.toggle('is-clamp'); rm.textContent = open ? 'Read more' : 'Show less'; return; }
      var v = e.target.closest('[data-vote]');
      if (v) { var id = v.dataset.id, k = v.dataset.vote; if (votes[id] === k) delete votes[id]; else votes[id] = k; try { localStorage.setItem(HKEY, JSON.stringify(votes)); } catch (er) {} render(); return; }
    });
    q('[data-rv-sort]').addEventListener('change', function (e) { st.sort = e.target.value; render(); });
    q('[data-rv-filter]').addEventListener('change', function (e) { st.filter = e.target.value; st.shown = 5; render(); });

    var w = q('[data-rv-write]'), form = q('[data-rv-form]');
    if (writeUrl) { w.hidden = false; w.addEventListener('click', function () { window.open(writeUrl, '_blank', 'noopener'); }); }
    else if (dev) {
      w.hidden = false;
      w.addEventListener('click', function () { form.hidden = false; form.querySelector('select').focus(); });
      q('[data-rv-cancel]').addEventListener('click', function () { form.hidden = true; });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var f = new FormData(form);
        mine.unshift({ id: 'mine-' + Date.now(), rating: +f.get('rating'), title: String(f.get('title')), body: String(f.get('body')), author: String(f.get('name')), date: new Date().toISOString().slice(0, 10), mine: true, tags: [] });
        try { localStorage.setItem(UKEY, JSON.stringify(mine)); } catch (er) {}
        form.reset(); form.hidden = true; st.shown = Math.max(st.shown, 5); render(); toast('Thanks — review saved on this device');
      });
    }
    if (dev) q('[data-rv-dev]').hidden = false;
    render();
  })();
})();
