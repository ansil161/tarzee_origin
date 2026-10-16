/* Terzee Origins v2. No scroll listeners: IntersectionObserver for reveals, timers only for the hero. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function (n) { return '₹' + Number(n).toLocaleString('en-IN'); };

  /* reveals */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
    en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  $$('[data-r]').forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });

  /* statement: words light up as they pass the lower third */
  var wio = io ? new IntersectionObserver(function (en) {
    en.forEach(function (x) { x.target.classList.toggle('on', x.isIntersecting || x.boundingClientRect.top < 0); });
  }, { rootMargin: '0px 0px -30% 0px', threshold: 0 }) : null;
  $$('[data-say] .w').forEach(function (w) { wio ? wio.observe(w) : w.classList.add('on'); });

  /* craft video plays only while visible */
  var vids = $$('video[data-autoplay]');
  if (vids.length && io) {
    var vio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { var v = x.target; if (x.isIntersecting && !reduce) { v.play().catch(function () {}); } else { v.pause(); } });
    }, { threshold: 0.35 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* menu */
  var menu = $('[data-menu]'), burger = $('[data-menu-open]');
  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger) burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  $$('[data-menu-close], .menu__nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* hero: photos fill the TERZEE letters, page colour follows the photo */
  var hero = $('[data-hero]');
  if (hero) {
    var cards = $$('.deck__card', hero), wimgs = $$('.wm__img', hero), svg = $('[data-wm]', hero), chip = $('[data-chip]', hero);
    var hn = $('[data-chip-name]', hero), hp = $('[data-chip-price]', hero), cur = 0, timer;
    var fit = function () {
      var t = $('.wm__line text', svg); if (!t) return;
      var b = t.getBBox(); if (!b.width) return;
      svg.setAttribute('viewBox', b.x + ' ' + b.y + ' ' + b.width + ' ' + b.height);
      var h = b.width * 1.25;
      wimgs.forEach(function (i) { i.setAttribute('x', b.x); i.setAttribute('width', b.width); i.setAttribute('height', h); i.setAttribute('y', b.y - (h - b.height) * 0.4); });
    };
    fit();
    if (document.fonts && document.fonts.load) document.fonts.load('300px Audiowide', 'TERZEE').then(fit, function () {});
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    var go = function (i) {
      cur = (i + cards.length) % cards.length;
      cards.forEach(function (c, k) { c.classList.toggle('is-on', k === cur); });
      wimgs.forEach(function (m, k) { m.classList.toggle('is-on', k === cur); });
      var c = cards[cur];
      hn.textContent = c.dataset.name; hp.textContent = c.dataset.price; chip.setAttribute('href', c.dataset.url);
    };
    var play = function () { if (reduce) return; clearInterval(timer); timer = setInterval(function () { go(cur + 1); }, 4800); };
    cards.forEach(function (c, k) { c.addEventListener('click', function () { go(k); play(); }); });
    hero.addEventListener('mouseenter', function () { clearInterval(timer); });
    hero.addEventListener('mouseleave', play);
    play();
  }

  /* black in every light: section colour and photo follow the chosen light */
  var lights = $('[data-lights]');
  if (lights) {
    var lb = $$('.lt__btn', lights), li = $$('.lt__img', lights), lc = $('[data-lt-chip]', lights);
    lb.forEach(function (b, k) {
      b.addEventListener('click', function () {
        lb.forEach(function (x, j) { x.classList.toggle('is-on', j === k); });
        li.forEach(function (x, j) { x.classList.toggle('is-on', j === k); });
        lights.style.setProperty('--tint', b.dataset.tint);
        $('[data-lt-name]', lights).textContent = b.dataset.name; $('[data-lt-price]', lights).textContent = b.dataset.price;
        lc.setAttribute('href', b.dataset.url);
      });
    });
  }

  /* look closer: zoom follows the pointer; a tap toggles on touch screens */
  $$('[data-zoom]').forEach(function (z) {
    z.addEventListener('pointermove', function (e) {
      var r = z.getBoundingClientRect();
      z.style.setProperty('--zx', ((e.clientX - r.left) / r.width * 100) + '%'); z.style.setProperty('--zy', ((e.clientY - r.top) / r.height * 100) + '%');
    });
    z.addEventListener('click', function () { z.classList.toggle('is-zoom'); });
  });

  /* about: the process image follows the step in view */
  var proc = $('[data-proc]');
  if (proc && io) {
    var steps = $$('.proc__step', proc), pimgs = $$('.proc__img', proc);
    steps[0].classList.add('is-on');
    var sio = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var k = +x.target.dataset.step;
        steps.forEach(function (s, j) { s.classList.toggle('is-on', j === k); });
        pimgs.forEach(function (m, j) { m.classList.toggle('is-on', j === k); });
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { sio.observe(s); });
  } else if (proc) { $$('.proc__step', proc).forEach(function (s) { s.classList.add('is-on'); }); }

  /* about: principles, a photo follows the pointer over the list */
  var pr = $('[data-pr]');
  if (pr) {
    var fl = $('[data-pr-float]', pr), fimg = $('img', fl), list = $('.pr__list', pr);
    var show = function (row) { fimg.src = row.dataset.img; fl.classList.add('is-on'); };
    $$('.pr__row', pr).forEach(function (row) {
      row.addEventListener('pointerenter', function () { show(row); });
      row.addEventListener('focus', function () { show(row); });
      row.addEventListener('blur', function () { fl.classList.remove('is-on'); });
    });
    list.addEventListener('pointerleave', function () { fl.classList.remove('is-on'); });
    list.addEventListener('pointermove', function (e) { fl.style.transform = 'translate(' + (e.clientX + 28) + 'px,' + (e.clientY - 120) + 'px) rotate(-3deg)'; });
  }

  /* expanding strips: hover or focus opens one */
  var xsw = $('[data-xs-wrap]');
  if (xsw) {
    var xi = $$('[data-xs]', xsw);
    var openXs = function (el) { xi.forEach(function (x) { x.classList.toggle('is-on', x === el); }); };
    xi.forEach(function (el) {
      el.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') openXs(el); });
      el.addEventListener('focus', function () { openXs(el); });
      el.addEventListener('click', function () { openXs(el); });
    });
  }

  /* draggable photo table */
  var pt = $('[data-pt]');
  if (pt) {
    var stage = $('[data-pt-stage]', pt), cards = $$('[data-card]', pt), zTop = cards.length, seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    var scatter = function (animate) {
      var w = stage.clientWidth, cols = w > 820 ? 6 : 3, rows = Math.ceil(cards.length / cols), cw = cards[0].offsetWidth;
      var cellH = Math.max(cw * 1.05, w > 820 ? stage.clientHeight / rows : cw * 1.0);
      if (w <= 820) stage.style.height = Math.round(rows * cw * 1.02 + cw * 0.5) + 'px'; else stage.style.height = '';
      var h = stage.clientHeight;
      stage.classList.toggle('is-shuffling', !!animate);
      var order = cards.slice().sort(function () { return rnd() - 0.5; });
      order.forEach(function (c, k) {
        var col = k % cols, row = Math.floor(k / cols);
        var x = (col + 0.5) / cols * w + (rnd() - 0.5) * cw * 0.5, y = (row + 0.5) / rows * h + (rnd() - 0.5) * cw * 0.35;
        c.style.left = Math.max(cw / 2, Math.min(w - cw / 2, x)) + 'px'; c.style.top = Math.max(cw * 0.6, Math.min(h - cw * 0.6, y)) + 'px';
        c.style.setProperty('--r', ((rnd() - 0.5) * 18).toFixed(1) + 'deg'); c.style.zIndex = k + 1;
      });
      if (animate) setTimeout(function () { stage.classList.remove('is-shuffling'); }, 950);
    };
    var ready = function () { scatter(false); };
    if (stage.clientWidth) ready(); else window.addEventListener('load', ready);
    var lastW = stage.clientWidth;
    new ResizeObserver(function () { if (Math.abs(stage.clientWidth - lastW) > 40) { lastW = stage.clientWidth; scatter(false); } }).observe(stage);
    cards.forEach(function (c) {
      var ox = 0, oy = 0, sx = 0, sy = 0;
      var clamp = function () {
        var cw = c.offsetWidth, ch = c.offsetHeight;
        c.style.left = Math.max(cw * 0.3, Math.min(stage.clientWidth - cw * 0.3, parseFloat(c.style.left))) + 'px';
        c.style.top = Math.max(ch * 0.3, Math.min(stage.clientHeight - ch * 0.3, parseFloat(c.style.top))) + 'px';
      };
      c.addEventListener('pointerdown', function (e) {
        c.setPointerCapture(e.pointerId); c.classList.add('is-drag'); c.style.zIndex = ++zTop;
        sx = e.clientX; sy = e.clientY; ox = parseFloat(c.style.left); oy = parseFloat(c.style.top);
      });
      c.addEventListener('pointermove', function (e) {
        if (!c.classList.contains('is-drag')) return;
        c.style.left = (ox + e.clientX - sx) + 'px'; c.style.top = (oy + e.clientY - sy) + 'px'; clamp();
      });
      var end = function () { c.classList.remove('is-drag'); };
      c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
      c.addEventListener('keydown', function (e) {
        var d = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[e.key];
        if (!d) return; e.preventDefault(); c.style.zIndex = ++zTop;
        c.style.left = (parseFloat(c.style.left) + d[0]) + 'px'; c.style.top = (parseFloat(c.style.top) + d[1]) + 'px'; clamp();
      });
    });
    $('[data-pt-shuffle]', pt).addEventListener('click', function () { scatter(!reduce); });
  }


  /* the rail: slides side to side by itself and by hand, garments swing; tap one for a small preview */
  var rl = $('[data-rl]');
  if (rl) {
    var rst = $('[data-rl-stage]', rl), rtr = $('[data-rl-track]', rl), ritems = $$('[data-rl-item]', rl);
    var hint = $('[data-rl-hint]', rl), pop = $('[data-rl-pop]', rl), shots = $('[data-rl-shots]', rl), dots = $('[data-rl-dots]', rl);
    var psizes = $('[data-rl-sizes]', rl), padd = $('[data-rl-add]', rl), pview = $('[data-rl-view]', rl), psoon = $('[data-rl-soon]', rl);
    var S = { x: 0, v: 0, dir: -1, drag: false, lx: 0, lt: 0, moved: 0, down: null, run: false, prev: 0, sel: -1, vis: false, hover: false, pause: 0, size: 'M' };
    var AUTO = 38;                                           // px/s the rail drifts when left alone
    ritems.forEach(function (it, k) { it._a = 0; it._w = 0; it._k = 0.75 + 0.5 * Math.abs(Math.sin(k * 2.3)); });
    var mobile = window.matchMedia('(max-width:620px)');
    var minX = function () { return Math.min(0, rst.clientWidth - rtr.scrollWidth); };
    var touchIdle = function (ms) { S.pause = performance.now() + (ms || 3500); };
    var placePop = function (it) {
      if (mobile.matches) { pop.style.left = ''; return; }
      var sr = rst.getBoundingClientRect(), ir = it.getBoundingClientRect(), pw = pop.offsetWidth || 290;
      var x = sr.right - ir.right >= pw + 20 ? ir.right - sr.left + 10 : (ir.left - sr.left >= pw + 20 ? ir.left - sr.left - pw - 10 : sr.width - pw - 12);
      pop.style.left = Math.max(10, x) + 'px';
    };
    var fillPop = function (it) {
      var photos = JSON.parse(it.dataset.photos || '[]'), live = !!it.dataset.handle;
      shots.innerHTML = photos.map(function (p) { return '<img src="' + p + '" alt="" draggable="false"' + (live ? '' : ' class="is-cut"') + '>'; }).join('');
      shots.scrollLeft = 0;
      dots.innerHTML = photos.length > 1 ? photos.map(function (p, i) { return '<button type="button" aria-label="Photo ' + (i + 1) + '"' + (i === 0 ? ' class="is-on"' : '') + '></button>'; }).join('') : '';
      $('[data-rl-name]', rl).textContent = it.dataset.name; $('[data-rl-price]', rl).textContent = it.dataset.price;
      psizes.hidden = padd.parentNode.hidden = !live; psoon.hidden = live;
      if (live) { pview.setAttribute('href', it.dataset.url); padd.dataset.handle = it.dataset.handle; }
    };
    var select = function (i) {
      S.sel = i;
      ritems.forEach(function (it, k) { it.classList.toggle('is-out', k === i); it.style.setProperty('--sx', (i < 0 || k === i ? 0 : (k < i ? -1 : 1) * 70) + 'px'); });
      hint.hidden = i >= 0; pop.hidden = i < 0;
      if (i >= 0) { fillPop(ritems[i]); setTimeout(function () { placePop(ritems[i]); }, 60); touchIdle(60000); }
      else touchIdle(1500);
      wake();
    };
    shots.addEventListener('scroll', function () {
      var i = Math.round(shots.scrollLeft / Math.max(1, shots.clientWidth));
      $$('button', dots).forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    }, { passive: true });
    dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; shots.scrollTo({ left: $$('button', dots).indexOf(b) * shots.clientWidth, behavior: 'smooth' }); });
    psizes.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; S.size = b.dataset.size; $$('button', psizes).forEach(function (x) { x.classList.toggle('is-on', x === b); }); });
    padd.addEventListener('click', function () { add(padd.dataset.handle, S.size); });
    $('[data-rl-x]', rl).addEventListener('click', function () { select(-1); });
    pop.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    var wake = function () { if (!S.run) { S.run = true; S.prev = 0; requestAnimationFrame(tick); } };
    var tick = function (ts) {
      var dt = Math.min(0.1, (ts - (S.prev || ts)) / 1000); S.prev = ts;
      var lo = minX(), auto = 0;
      if (!S.drag) {
        S.x += S.v * dt; S.v *= Math.exp(-3.4 * dt);
        if (!reduce && S.sel < 0 && S.vis && performance.now() > S.pause && Math.abs(S.v) < 40) {   // idle: drift to one end, then back
          auto = S.dir * AUTO; S.x += auto * dt;
          if (S.x <= lo) { S.x = lo; S.dir = 1; } else if (S.x >= 0) { S.x = 0; S.dir = -1; }
        }
        if (S.x > 0) { S.x = 0; S.v = 0; } if (S.x < lo) { S.x = lo; S.v = 0; }
      }
      rtr.style.transform = 'translate3d(' + S.x.toFixed(1) + 'px,0,0)';
      var busy = S.drag || Math.abs(S.v) > 3 || (S.vis && !reduce);
      ritems.forEach(function (it) {
        if (reduce) return;
        var F = -(S.v + auto) * 0.2 * it._k;              // the rail moving swings the hangers the other way
        it._w += (F - 24 * it._a - 2.6 * it._w) * dt;     // spring back to hanging straight
        it._a += it._w * dt; it._a = Math.max(-30, Math.min(30, it._a));
        it.firstChild.style.setProperty('--a', it._a.toFixed(2) + 'deg');
      });
      if (busy) requestAnimationFrame(tick); else S.run = false;
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { S.vis = es[0].isIntersecting; if (S.vis) wake(); }, { threshold: 0.15 }).observe(rst);
    else S.vis = true;
    rst.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') S.hover = true; });
    rst.addEventListener('pointerleave', function () { S.hover = false; });
    rst.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.rl__pop')) return;
      rst.setPointerCapture(e.pointerId); S.drag = true; S.v = 0; S.moved = 0; S.lx = e.clientX; S.lt = performance.now();
      S.down = e.target.closest('[data-rl-item]'); rst.classList.add('is-drag'); touchIdle(); wake();
    });
    rst.addEventListener('pointermove', function (e) {
      if (S.drag) {
        var now = performance.now(), dt = Math.max(1, now - S.lt) / 1000, dx = e.clientX - S.lx;
        S.moved += Math.abs(dx); S.x += dx; S.v = S.v * 0.6 + (dx / dt) * 0.4; S.lx = e.clientX; S.lt = now;
        if (S.moved > 8 && S.sel >= 0) select(-1);
        var lo = minX(); S.x = Math.max(lo - 80, Math.min(80, S.x)); wake();
      } else if (e.pointerType !== 'touch') {              // brushing through the hangers
        var it = e.target.closest('[data-rl-item]');
        if (it && !reduce) { it._w += Math.max(-260, Math.min(260, e.movementX * 9)); wake(); }
      }
    });
    var up = function () {
      if (!S.drag) return;
      S.drag = false; rst.classList.remove('is-drag'); touchIdle();
      if (performance.now() - S.lt > 90) S.v = 0;
      if (S.moved < 6 && S.down) { var i = ritems.indexOf(S.down); select(S.sel === i ? -1 : i); }
      else if (S.moved < 6) select(-1);
      S.down = null; wake();
    };
    rst.addEventListener('pointerup', up); rst.addEventListener('pointercancel', up);
    ritems.forEach(function (it, k) { it.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(S.sel === k ? -1 : k); } }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.sel >= 0) select(-1); });
    $('[data-rl-next]', rl).addEventListener('click', function () { S.v = -1500; touchIdle(); wake(); });
    $('[data-rl-prev]', rl).addEventListener('click', function () { S.v = 1500; touchIdle(); wake(); });
    pview.addEventListener('click', function (e) { if (pview.getAttribute('href') === '#') e.preventDefault(); });
    wake();
  }

  /* the jacket collection: stage pins, one wheel step slides the next piece across the model; touch screens swipe */
  var jk = $('[data-jk]');
  if (jk) (function () {
    var view = $('[data-jk-view]', jk), track = $('[data-jk-track]', jk), slots = $$('[data-jk-slot]', jk);
    var cur = $('[data-jk-cur]', jk), bar = $('[data-jk-bar]', jk), lab = $('[data-jk-lab]', jk);
    var N = slots.length, idx = 0;
    var touchMode = window.matchMedia('(max-width:900px),(pointer:coarse) and (hover:none)');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var ui = function (i) {
      cur.textContent = pad(i + 1); lab.textContent = 'Jacket ' + pad(i + 1);
      bar.style.transform = 'scaleX(' + (i / Math.max(1, N - 1)) + ')';
    };
    var states = function (i) {
      slots.forEach(function (s, k) {
        var d = Math.abs(k - i);
        s.classList.toggle('is-on', d === 0); s.classList.toggle('is-near', d === 1);
      });
    };
    var place = function (i, animate) {
      idx = i; ui(i); states(i);
      if (touchMode.matches) return;
      if (!animate) { track.style.transition = 'none'; }
      track.style.transform = 'translate3d(' + (-slots[0].getBoundingClientRect().width * i) + 'px,0,0)';
      if (!animate) { track.getBoundingClientRect(); track.style.transition = ''; }
    };
    place(0, false);
    window.addEventListener('resize', function () { place(idx, false); });

    /* one 100vh step per piece sits under the pinned stage; the step crossing mid-screen picks the piece */
    var steps = $$('[data-jk-step]', jk);
    if ('IntersectionObserver' in window) {
      var sio = new IntersectionObserver(function (en) {
        if (touchMode.matches) return;
        en.forEach(function (x) { if (x.isIntersecting) place(steps.indexOf(x.target), true); });
      }, { rootMargin: '-50% 0px -50% 0px' });
      steps.forEach(function (st) { sio.observe(st); });
    }

    /* touch screens: the pieces sit in a snapping row, size and opacity follow the swipe */
    var imgs = $$('.jk__img', jk);
    view.addEventListener('scroll', function () {
      if (!touchMode.matches) return;
      var w = view.clientWidth, x = view.scrollLeft, i = Math.max(0, Math.min(N - 1, Math.round(x / w)));
      if (i !== idx) { idx = i; ui(i); }
      imgs.forEach(function (im, k) {
        var d = Math.abs(x - k * w) / w;
        im.style.transform = 'scale(' + Math.max(.92, 1 - d * .08) + ')';
        im.style.opacity = Math.max(.2, 1 - d * .75);
      });
    }, { passive: true });
  })();

  /* shop filter */
  var grid = $('[data-grid]');
  if (grid) {
    var apply = function (t) {
      var shown = 0;
      $$('.pc', grid).forEach(function (c) { var ok = t === 'All' || c.dataset.type === t; c.hidden = !ok; if (ok) shown++; });
      $$('.chip').forEach(function (c) { c.classList.toggle('is-on', c.dataset.filter === t); });
      $('[data-count]').textContent = shown; $('[data-empty]').hidden = shown > 0;
    };
    $$('.chip').forEach(function (c) { c.addEventListener('click', function () { apply(c.dataset.filter); }); });
    var q = new URLSearchParams(location.search).get('t'); if (q) apply(q);
  }

  /* bag */
  var bag = $('[data-bag]'), lines = $('[data-cart-lines]'), items = [];
  try { items = JSON.parse(localStorage.getItem('tz2-bag') || '[]'); } catch (e) { items = []; }
  var save = function () { try { localStorage.setItem('tz2-bag', JSON.stringify(items)); } catch (e) {} };
  function render() {
    var count = items.reduce(function (a, b) { return a + b.qty; }, 0);
    $$('[data-cart-count]').forEach(function (b) { b.textContent = count; b.classList.toggle('has', count > 0); });
    $('[data-cart-subtotal]').textContent = money(items.reduce(function (a, b) { return a + b.price * b.qty; }, 0));
    lines.innerHTML = items.length ? items.map(function (it, i) {
      return '<div class="bl" data-i="' + i + '"><img src="' + it.img + '" alt=""><div><b>' + it.title + '</b><small>Size ' + it.size + '</small><div class="bl__qty"><button type="button" data-q="-1" aria-label="Fewer">-</button><span>' + it.qty + '</span><button type="button" data-q="1" aria-label="More">+</button></div></div><span class="bl__price">' + money(it.price * it.qty) + '</span></div>';
    }).join('') : '<p class="bag__empty">Your bag is empty.</p>';
  }
  function setBag(open) { bag.classList.toggle('is-open', open); bag.setAttribute('aria-hidden', String(!open)); }
  function toast(t) {
    var el = $('.toast') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'toast', role: 'status' }));
    el.textContent = t; el.classList.add('is-on'); clearTimeout(el._t); el._t = setTimeout(function () { el.classList.remove('is-on'); }, 2200);
  }
  function add(handle, size) {
    var p = window.TZ_PRODUCTS && window.TZ_PRODUCTS[handle]; if (!p) return;
    var ex = items.filter(function (x) { return x.handle === handle && x.size === size; })[0];
    if (ex) ex.qty++; else items.push({ handle: handle, size: size, qty: 1, title: p.title, price: p.price, img: p.img });
    save(); render(); toast('Added to bag'); setBag(true);
  }
  $$('[data-cart-open]').forEach(function (b) { b.addEventListener('click', function () { setBag(true); }); });
  $$('[data-cart-close]').forEach(function (b) { b.addEventListener('click', function () { setBag(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setBag(false); setMenu(false); } });
  lines.addEventListener('click', function (e) {
    var b = e.target.closest('[data-q]'); if (!b) return;
    var i = +b.closest('.bl').dataset.i; items[i].qty += +b.dataset.q;
    if (items[i].qty <= 0) items.splice(i, 1); save(); render();
  });
  $$('[data-add]').forEach(function (b) { b.addEventListener('click', function () { add(b.dataset.handle, b.dataset.size); }); });
  var pdp = $('[data-pdp]');
  if (pdp) $('[data-pdp-add]').addEventListener('click', function () { add(pdp.dataset.handle, ($('input[name=size]:checked') || {}).value || 'M'); });
  var co = $('[data-checkout]'); if (co) co.addEventListener('click', function () { toast(items.length ? 'Checkout connects when the Shopify theme is live' : 'Your bag is empty'); });
  render();

  /* newsletter (preview: validates only) */
  var jf = $('[data-join]');
  if (jf) jf.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = jf.email.value.trim(), msg = $('[data-join-msg]', jf), ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
    msg.classList.toggle('is-err', !ok);
    msg.textContent = ok ? 'You are on the list. We will email you before the next drop.' : 'Enter a valid email address.';
  });
})();
