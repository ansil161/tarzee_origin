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
    if (thumbs[cur]) thumbs[cur].scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
  var lbSlides = slides;
  var lbImg = lb.querySelector('img'), lbC = lb.querySelector('.pdp-lb__c'), lastFocus = null;
  function lbShow(i) { lbI = (i + lbSlides.length) % lbSlides.length; lbImg.src = lbSlides[lbI].full || lbSlides[lbI].src; lbImg.alt = lbSlides[lbI].alt; lbC.textContent = (lbI + 1) + ' / ' + lbSlides.length; }
  var lbI = 0;
  function lbOpen(set, i) { lbSlides = set || slides; lastFocus = document.activeElement; lbShow(i === undefined ? cur : i); lb.classList.add('is-open'); document.documentElement.style.overflow = 'hidden'; lb.querySelector('.pdp-lb__x').focus(); }
  function lbClose() { lb.classList.remove('is-open'); document.documentElement.style.overflow = ''; if (lbSlides === slides) { cur = lbI; show(cur, true); } lastFocus && lastFocus.focus(); }
  stage.addEventListener('click', function () { if (!stage._swiped) lbOpen(); });
  $('[data-expand]').addEventListener('click', function (e) { e.stopPropagation(); lbOpen(); });
  lb.querySelector('.pdp-lb__x').addEventListener('click', lbClose);
  lb.querySelector('.pdp-lb__p').addEventListener('click', function () { lbShow(lbI - 1); });
  lb.querySelector('.pdp-lb__n').addEventListener('click', function () { lbShow(lbI + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowLeft') lbShow(lbI - 1);
    else if (e.key === 'ArrowRight') lbShow(lbI + 1);
    else if (e.key === 'Tab') { var f = lb.querySelectorAll('button'), a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  var lx = null;
  lb.addEventListener('touchstart', function (e) { lx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (lx === null) return; var dx = e.changedTouches[0].clientX - lx; lx = null; if (Math.abs(dx) > 40) lbShow(lbI + (dx < 0 ? 1 : -1)); });

  var lookData = []; try { lookData = JSON.parse((document.querySelector('[data-look-slides]') || {}).textContent || '[]'); } catch (e) {}
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-look]'); if (b && lookData.length) lbOpen(lookData, +b.dataset.look); });

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
  var MODES = { A: { n: 1, label: 'Buy one item' }, B: { n: 2, label: 'Two-item outfit' }, C: { n: 3, label: 'Three-item collection' } };
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

  /* ---------- Offer card (hero) ---------- */
  var offersEl = $('[data-offer-card]');
  var ICON_OK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function potential() { return calc({ items: [Object.assign(mainItem(1), { compare: D.main.compare || 0 })], mode: 'A', coupon: !!C, prepaid: +P.prepaid_pct > 0 }); }
  function renderOffers() {
    if (!offersEl) return;
    var hasPre = +P.prepaid_pct > 0;
    if (!C && !hasPre) { offersEl.hidden = true; return; }
    offersEl.hidden = false;
    var pot = potential(), minShip = +P.free_ship_min || 0, h = '<p class="pdp-ofc__k">Exclusive shopping benefits</p>';
    if (pot.saved > 0) h += '<div class="pdp-ofc__save"><span>You save</span><b>' + fmt(pot.saved) + '</b><em>' + [C && pot.coupon ? 'with code ' + esc(C.code) : '', pot.prepaid ? 'prepaid payment' : ''].filter(Boolean).join(' + ') + '</em></div>';
    if (C) {
      h += '<p class="pdp-ofc__l">Extra savings with a valid coupon</p><div class="pdp-ofc__code"><div class="pdp-ofc__c"><small>Code</small><b>' + esc(C.code) + '</b></div>' +
        '<button type="button" class="pdp-ofc__copy" data-copy="' + esc(C.code) + '"><span data-copy-label>Copy code</span></button>' +
        '<button type="button" class="pdp-ofc__apply' + (state.coupon ? ' is-on' : '') + '" data-apply="coupon" aria-pressed="' + state.coupon + '">' + (state.coupon ? ICON_OK + ' Offer selected' : 'Apply offer') + '</button></div>' +
        '<p class="pdp-ofc__n">' + (state.coupon ? esc(C.code) + ' is carried to checkout and validated there. ' : '') + ((+C.min) ? 'Minimum order ' + fmt(C.min) + '. ' : '') + (C.stacks ? '' : 'Does not combine with set savings.') + '</p>';
    }
    if (hasPre) h += '<div class="pdp-ofc__row"><div><b>Prepaid benefit</b><span>Extra ' + P.prepaid_pct + '% off when you pay online</span></div><button type="button" class="pdp-ofc__tog' + (state.prepaid ? ' is-on' : '') + '" data-apply="prepaid" aria-pressed="' + state.prepaid + '">' + (state.prepaid ? ICON_OK + ' Selected' : 'Select') + '</button></div>';
    h += '<div class="pdp-ofc__row is-ship"><div><b>' + (minShip ? 'Free shipping above ' + fmt(minShip) : 'Free shipping') + '</b><span>' + (minShip ? 'Add more to unlock' : 'On every order across India') + '</span></div><span class="pdp-ofc__ok">' + ICON_OK + '</span></div>';
    offersEl.innerHTML = h;
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
      '<button class="btn btn--red" type="button" data-add-set><span>Add selected items to bag</span></button>' +
      '<p class="pdp-calc__f">' + (state.coupon && C ? 'Code ' + esc(C.code) + ' is carried to checkout, where it is validated. ' : '') + (state.prepaid ? 'Prepaid benefit is applied at checkout when you pay online. ' : '') + 'Final amount is confirmed at checkout.</p>';
    var s = el.querySelector('[data-calc-save]'), t = el.querySelector('[data-calc-total]');
    s._v = el._ps; t._v = el._pt; setNum(s, c.saved); setNum(t, c.total); el._ps = c.saved; el._pt = c.total;
  }

  function tagEl(b) { return b ? '<span class="pdp-tag">' + esc(b) + '</span>' : ''; }
  /* ---------- Cross-sell carousel ---------- */
  var colEl = document.querySelector('[data-pdp-collection] [data-mount]');
  function renderCollection() {
    if (!colEl) return;
    if (!pairs.length) { colEl.closest('section').hidden = true; return; }
    colEl.innerHTML = '<div class="pdp-rail" data-rail tabindex="0" aria-label="You may also like">' + pairs.map(function (p, i) {
      var fs = firstSize(p), sold = !p.sizes.some(function (s) { return s.available; }), hasSizes = p.sizes.length > 1 || (p.sizes[0] && p.sizes[0].title !== 'Default Title');
      var chips = hasSizes ? '<div class="pdp-chips" role="group" aria-label="Sizes for ' + esc(p.title) + '">' + p.sizes.map(function (s) { return '<button type="button" class="pdp-chip' + (s.id === fs.id && !sold ? ' is-on' : '') + '" data-chip="' + i + '" data-sid="' + esc(s.id) + '" data-st="' + esc(s.title) + '"' + (s.available ? '' : ' disabled') + '>' + esc(s.title) + '</button>'; }).join('') + '</div>' : '';
      var off = p.compare > p.price ? '<span class="pdp-pc__off">−' + Math.round((p.compare - p.price) / p.compare * 100) + '%</span>' : '';
      return '<article class="pdp-pc' + (sold ? ' is-sold' : '') + '"><a class="pdp-pc__img" href="' + esc(p.url) + '">' + tagEl(p.badge) + '<img src="' + esc(p.img) + '" alt="' + esc(p.title) + '" loading="lazy" width="600" height="750"></a><div class="pdp-pc__b"><span class="pdp-pc__k">' + esc(p.type) + '</span><h3><a href="' + esc(p.url) + '">' + esc(p.title) + '</a></h3><div class="pdp-pc__p"><b>' + fmt(p.price) + '</b>' + (p.compare > p.price ? '<s>' + fmt(p.compare) + '</s>' + off + '<span class="pdp-save">Save ' + fmt(p.compare - p.price) + '</span>' : '') + '</div>' + chips +
        '<button type="button" class="pdp-qa" data-qa="' + i + '"' + (sold ? ' disabled' : '') + '>' + (sold ? 'Sold out' : 'Quick add') + '</button></div></article>';
    }).join('') + '</div>';
  }
  function quickItem(i) {
    var p = pairs[i], chip = colEl.querySelector('.pdp-chip.is-on[data-chip="' + i + '"]'), s = firstSize(p);
    return { id: chip ? chip.dataset.sid : s.id, qty: 1, title: p.title, price: p.price, compare: p.compare, img: p.img, size: chip ? chip.dataset.st : s.title };
  }

  /* ---------- Comparison ---------- */
  var cmpEl = document.querySelector('[data-pdp-compare] [data-mount]');
  function renderCompare() {
    if (!cmpEl) return;
    var rows = [Object.assign({}, D.main, { here: true })].concat(pairs.slice(0, 3));
    if (rows.length < 2) { cmpEl.closest('section').hidden = true; return; }
    cmpEl.innerHTML = rows.map(function (p) {
      var sizes = (p.sizes || []).map(function (s) { return s.title; }).filter(function (t) { return t !== 'Default Title'; }).join(' · ');
      return '<article class="pdp-cmp' + (p.here ? ' is-here' : '') + '"><div class="pdp-cmp__img">' + tagEl(p.badge) + '<img src="' + esc(p.img) + '" alt="' + esc(p.title) + '" loading="lazy" width="600" height="750"></div><h3>' + esc(p.title) + '</h3><dl><div><dt>Type</dt><dd>' + esc(p.type || '—') + '</dd></div><div><dt>Technique</dt><dd>' + esc(p.tag || '—') + '</dd></div><div><dt>Cloth</dt><dd>' + esc(p.fabric || '—') + '</dd></div><div><dt>Sizes</dt><dd>' + esc(sizes || '—') + '</dd></div></dl><div class="pdp-cmp__p"><b>' + fmt(p.price) + '</b>' + (p.compare > p.price ? '<s>' + fmt(p.compare) + '</s>' : '') + '</div>' + (p.here ? '<span class="pdp-cmp__here">You are here</span>' : '<a class="btn btn--ink" href="' + esc(p.url) + '"><span>View piece</span></a>') + '</article>';
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
    var was = $('[data-was]'), off = $('[data-off]'), sl = $('[data-saveline]');
    var pot = potential();
    var amt = 0, note = '', badge = '';
    if (cmp > p) { amt = (cmp - p) * q; note = 'Regular price ' + fmt(cmp) + ' · instant discount'; badge = '−' + Math.round((cmp - p) / cmp * 100) + '%'; was.hidden = false; was.textContent = fmt(cmp); }
    else {
      was.hidden = true;
      if (pot.saved > 0 && C) badge = 'Extra ' + C.pct + '% with code'; /* the rupee saving itself is shown once, in the offer card */
    }
    off.hidden = !badge; off.textContent = badge;
    sl.hidden = !(amt > 0);
    if (amt > 0) { sl.querySelector('[data-save-amt]').textContent = fmt(amt); sl.querySelector('[data-save-note]').textContent = note; }
    var cta = $('[data-cta-price]'); if (cta) cta.textContent = ' — ' + fmt(p * q);
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
      var fail = function () { toast('Couldn’t copy — select the code and copy it'); };
      var ok = false, ta = document.createElement('textarea'); ta.value = code; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (er) {} ta.remove();
      if (ok) done(); else if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, fail); else fail();
      return;
    }
    var sc = e.target.closest('[data-scroll]');
    if (sc) { var tg = document.querySelector(sc.getAttribute('href')); if (tg) { e.preventDefault(); tg.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); } return; }
    var un = e.target.closest('[data-unlock]');
    if (un) { if (C) { state.coupon = true; store.set('terzee_coupon', '1'); } if (+P.prepaid_pct > 0) { state.prepaid = true; store.set('terzee_prepaid', '1'); } update(); drawerExtras(); var s = document.getElementById('sets'); s && s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); toast('Best deal selected'); return; }
    var as = e.target.closest('[data-add-set]');
    if (as) { run(as, modeItems(state.mode).map(function (i, n) { if (n === 0 && state.mode === 'A') i.qty = parseInt(qty.value, 10) || 1; return i; })); return; }
    var chip = e.target.closest('[data-chip]');
    if (chip && !chip.disabled) { $$('[data-chip="' + chip.dataset.chip + '"]', document).forEach(function (c) { c.classList.toggle('is-on', c === chip); }); return; }
    var qa = e.target.closest('[data-qa]');
    if (qa) { run(qa, [quickItem(+qa.dataset.qa)]); return; }
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
})();
