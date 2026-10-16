/* =====================================================================
   TERZEE ORIGINS — motion & interaction
   GSAP 3 + ScrollTrigger + Lenis. Everything degrades without them.
   ===================================================================== */
(function () {
  'use strict';
  const doc = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  const settings = window.TERZEE || {};
  doc.classList.remove('no-js');
  if (reduced) doc.classList.add('reduced-motion');
  if (hasGSAP && hasST) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduced && settings.smoothScroll !== false && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    if (hasST) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  window.terzeeScrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -60 });
    else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: 'smooth' });
  };

  /* ---------- Split text into words ---------- */
  document.querySelectorAll('[data-split]').forEach((el) => {
    if (el.dataset.splitDone) return;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="word"><span>${w}</span></span>`).join(' ');
    el.dataset.splitDone = '1';
  });

  /* ---------- Preloader ---------- */
  const pre = document.querySelector('.preloader');
  const heroLines = document.querySelectorAll('.hero__title .line span');
  const heroRest = document.querySelectorAll('.hero [data-hero]');
  const playHero = () => {
    if (!hasGSAP || reduced) {
      heroLines.forEach((l) => (l.style.transform = 'none'));
      heroRest.forEach((e) => { e.style.opacity = 1; e.style.transform = 'none'; });
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(heroLines, { y: 0, duration: 1.3, stagger: 0.09 }, 0)
      .fromTo(heroRest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 0.35)
      .fromTo('.hero__media', { scale: 1.12 }, { scale: 1, duration: 2.2, ease: 'power2.out' }, 0)
      .fromTo('.hero__brand img', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.4, ease: 'expo.out' }, 0.2)
      .fromTo('.hero__play', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1, ease: 'expo.out', clearProps: 'scale' }, 0.6);
  };
  if (pre && !reduced && hasGSAP && !sessionStorage.getItem('terzee_seen')) {
    const count = pre.querySelector('.preloader__count');
    const bar = pre.querySelector('.preloader__bar');
    const n = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => { pre.classList.add('is-done'); sessionStorage.setItem('terzee_seen', '1'); playHero(); }
    });
    tl.to(pre.querySelector('img'), { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 0)
      .to(n, { v: 100, duration: 1.5, ease: 'power2.inOut', onUpdate: () => { if (count) count.textContent = String(Math.round(n.v)).padStart(3, '0'); } }, 0.1)
      .to(bar, { width: '100%', duration: 1.5, ease: 'power2.inOut' }, 0.1)
      .to(pre.querySelector('img'), { opacity: 0, y: -10, duration: 0.5, ease: 'power2.in' }, 1.5)
      .to(count, { opacity: 0, duration: 0.4 }, 1.5)
      .to(pre, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, 1.75);
  } else {
    if (pre) pre.remove();
    window.addEventListener('load', playHero, { once: true });
    if (document.readyState === 'complete') playHero();
  }

  /* ---------- Header: solid on scroll, hide on scroll down ---------- */
  const header = document.querySelector('.header');
  if (header) {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (!header.classList.contains('header--over')) header.classList.add('is-solid'); else if (!header.classList.contains('header--dock')) header.classList.toggle('is-solid', y > 40);
      if (!document.body.classList.contains('drawer-open')) {
        header.classList.remove('is-hidden');
      }
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (hasST) {
      document.querySelectorAll('[data-header-light]').forEach((sec) => {
        ScrollTrigger.create({
          trigger: sec, start: () => 'top ' + (Math.round(header.getBoundingClientRect().bottom) + 1) + 'px', end: () => 'bottom ' + (Math.round(header.getBoundingClientRect().bottom) + 1) + 'px',
          onToggle: (s) => { header.classList.toggle('is-light', s.isActive); document.body.classList.toggle('header-light', s.isActive); }
        });
      });
    }
  }

  /* ---------- Drawers ---------- */
  const openDrawer = (id) => {
    const d = document.getElementById(id); if (!d) return;
    d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open'); if (lenis) lenis.stop();
  };
  const closeDrawers = () => {
    document.querySelectorAll('.drawer.is-open').forEach((d) => { d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true'); });
    document.body.classList.remove('drawer-open'); if (lenis) lenis.start();
  };
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); openDrawer(o.dataset.open); return; }
    if (e.target.closest('[data-close]') || e.target.classList.contains('drawer__scrim')) closeDrawers();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawers(); });
  window.terzeeOpenDrawer = openDrawer;

  /* ---------- Cursor ---------- */
  const cursor = document.querySelector('.cursor');
  if (cursor && settings.cursor !== false && window.matchMedia('(hover:hover) and (pointer:fine)').matches && hasGSAP) {
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); cursor.classList.remove('is-hidden'); });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseover', (e) => {
      const view = e.target.closest('[data-cursor="view"]');
      const link = e.target.closest('a,button,label,summary,[data-cursor]');
      cursor.classList.toggle('is-view', !!view);
      cursor.classList.toggle('is-link', !!link && !view);
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (hasGSAP && !reduced && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.btn').forEach((b) => {
      const xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' });
      const yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      b.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Scroll reveals ---------- */
  if (hasST && !reduced) {
    document.querySelectorAll('[data-reveal]').forEach((el, i) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.1, ease: 'expo.out',
        delay: parseFloat(el.dataset.delay || 0),
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });
    document.querySelectorAll('[data-split]').forEach((el) => {
      gsap.to(el.querySelectorAll('.word > span'), {
        y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.035,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
    document.querySelectorAll('[data-stagger]').forEach((wrap) => {
      const items = wrap.children;
      gsap.fromTo(items, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: wrap, start: 'top 85%', once: true }
      });
    });
    /* hero parallax */
    const heroMedia = document.querySelector('.hero__media');
    if (heroMedia) {
      gsap.to(heroMedia, { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__content', { yPercent: 30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
    }
    /* parallax images */
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax || 12);
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    /* story background zoom */
    document.querySelectorAll('.story__bg img').forEach((img) => {
      gsap.fromTo(img, { scale: 1.25 }, { scale: 1.02, ease: 'none', scrollTrigger: { trigger: img.closest('.story'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    /* lookbook horizontal pin */
    const lb = document.querySelector('.lookbook');
    if (lb && window.matchMedia('(min-width: 901px)').matches) {
      const track = lb.querySelector('.lookbook__track');
      const getDist = () => track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: () => -getDist(), ease: 'none',
        scrollTrigger: { trigger: lb, start: 'top top', end: () => '+=' + getDist(), pin: lb.querySelector('.lookbook__pin'), scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 }
      });
    }
    /* big marquee: scroll-speed driven */
    document.querySelectorAll('.marquee__track').forEach((track) => {
      const w = () => track.scrollWidth / 2;
      const tween = gsap.to(track, { x: () => -w(), ease: 'none', duration: 28, repeat: -1 });
      ScrollTrigger.create({
        onUpdate: (self) => { gsap.to(tween, { timeScale: 1 + Math.min(Math.abs(self.getVelocity()) / 500, 3) * (self.direction || 1), duration: 0.6 }); }
      });
    });
  } else {
    document.querySelectorAll('.marquee__track').forEach((track) => { track.style.animation = 'ticker 30s linear infinite'; });
  }

  /* ---------- Product marquee: fill the track, size the duration from px/s ---------- */
  document.querySelectorAll('[data-pmarquee]').forEach((vp) => {
    const track = vp.querySelector('.pmarquee__track');
    const originals = Array.from(track.children);
    if (originals.length < 2) return;
    const [a, b] = originals;
    const speed = parseFloat(vp.dataset.speed) || 45;
    const makeClone = (src) => {
      const c = src.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.dataset.clone = '1';
      c.querySelectorAll('a').forEach((l) => l.setAttribute('tabindex', '-1'));
      return c;
    };
    let lastW = 0;
    const fill = () => {
      const vw = vp.clientWidth;
      if (!vw || vw === lastW) return;
      lastW = vw;
      track.querySelectorAll('[data-clone]').forEach((n) => n.remove());
      const w = a.getBoundingClientRect().width;
      if (!w) return;
      const copies = Math.max(1, Math.ceil(vw / w));
      for (let i = 1; i < copies; i++) { a.after(makeClone(a)); }
      for (let i = 1; i < copies; i++) { track.appendChild(makeClone(b)); }
      vp.style.setProperty('--marquee-duration', ((copies * w) / speed).toFixed(2) + 's');
    };
    fill();
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fill, 150); });
    vp.querySelectorAll('img').forEach((img) => { if (!img.complete) img.addEventListener('load', () => { lastW = 0; fill(); }, { once: true }); });
  });

  /* ---------- Jacket reveal: halves slide open, inside image + sentence ---------- */
  document.querySelectorAll('[data-jreveal]').forEach((sec) => {
    const textEl = sec.querySelector('[data-chars]');
    if (textEl && !textEl.dataset.charsDone) {
      const words = textEl.textContent.trim().split(/\s+/);
      textEl.innerHTML = words
        .map((w) => '<span class="w">' + Array.from(w).map((c) => '<span class="ch">' + c + '</span>').join('') + '</span>')
        .join('<span class="ch ch--sp"> </span>');
      textEl.dataset.charsDone = '1';
    }
    if (!hasST || reduced) { sec.classList.add('is-static'); return; }
    const left = sec.querySelector('.jreveal__half--left');
    const right = sec.querySelector('.jreveal__half--right');
    const inside = sec.querySelector('.jreveal__inside');
    const about = sec.querySelector('.jreveal__about');
    const title = sec.querySelector('.jreveal__title');
    const seam = sec.querySelector('.jreveal__seam');
    const chars = sec.querySelectorAll('.ch:not(.ch--sp)');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true }
    });
    tl.to(left, { xPercent: -104, rotation: -1.6, ease: 'power1.inOut', duration: 0.55 }, 0)
      .to(right, { xPercent: 104, rotation: 1.6, ease: 'power1.inOut', duration: 0.55 }, 0)
      .to(seam, { opacity: 0.3, duration: 0.2 }, 0.05)
      .to(seam, { opacity: 0, duration: 0.25 }, 0.3)
      .to(inside, { opacity: 1, scale: 1, ease: 'power1.out', duration: 0.4 }, 0.15)
      .to(title, { yPercent: -120, opacity: 0, ease: 'power1.in', duration: 0.3 }, 0.22)
      .to(about, { opacity: 1, duration: 0.15 }, 0.45)
      .to(chars, { opacity: 1, duration: 0.42, stagger: { each: 0.42 / Math.max(chars.length, 1) } }, 0.5);
  });

  /* ---------- Hero video: ensure autoplay ---------- */
  document.querySelectorAll('video[autoplay]').forEach((v) => { v.muted = true; v.play && v.play().catch(() => {}); });

  /* ---------- Giant wordmark -> nav logo (scroll-scrubbed shrink) ---------- */
  const brand = document.querySelector('.hero__brand');
  const slot = document.querySelector('.header__logo img.logo-light') || document.querySelector('.header__logo img');
  const heroEl = document.querySelector('.hero');
  if (brand && slot && header && heroEl) {
    header.classList.add('header--dock');
    const img = brand.querySelector('img');
    let target = { x: 0, y: 0, s: 1 }, startY = 0;
    const measure = () => {
      brand.style.setProperty('--ls', '1');
      const natural = img.getBoundingClientRect().width;
      const r = slot.getBoundingClientRect();
      const hr = header.getBoundingClientRect();
      target = { x: r.left + r.width / 2, y: hr.top + (r.top - hr.top) + r.height / 2, s: r.width / natural };
      startY = Math.round(heroEl.offsetHeight / 2);
      update();
    };
    const update = () => {
      const range = window.innerHeight * 0.6;
      const p = Math.min(Math.max(window.scrollY / range, 0), 1);
      const e = p * p * (3 - 2 * p);
      brand.style.setProperty('--lx', (window.innerWidth / 2 + (target.x - window.innerWidth / 2) * e) + 'px');
      brand.style.setProperty('--ly', (startY + (target.y - startY) * e) + 'px');
      brand.style.setProperty('--ls', (1 + (target.s - 1) * e).toFixed(4));
      const docked = p >= 1;
      header.classList.toggle('is-docked', docked);
      header.classList.toggle('is-solid', docked);
      brand.classList.toggle('is-docked', docked);
      brand.classList.toggle('is-dark', docked);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();
  }

  /* ---------- Film lightbox ---------- */
  const lb = document.querySelector('.lightbox');
  if (lb) {
    const vid = lb.querySelector('video');
    const open = (src) => { if (src && vid.getAttribute('src') !== src) vid.setAttribute('src', src); lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); if (lenis) lenis.stop(); vid.currentTime = 0; vid.muted = false; vid.play().catch(() => {}); };
    const close = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); vid.pause(); if (lenis) lenis.start(); };
    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-film]'); if (t) { e.preventDefault(); open(t.dataset.film); return; }
      if (e.target.closest('[data-lightbox-close]') || e.target === lb) close();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('is-open')) close(); });
  }

  /* ---------- Toast ---------- */
  const toast = document.querySelector('.toast');
  window.terzeeToast = (msg) => {
    if (!toast) return; toast.textContent = msg; toast.classList.add('is-on');
    clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('is-on'), 2400);
  };

  /* ---------- Cart (Shopify AJAX) ---------- */
  const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  const money = (cents) => {
    const fmt = settings.moneyFormat || '₹{{amount_no_decimals}}';
    const n = cents / 100;
    return fmt.replace(/\{\{\s*amount_no_decimals\s*\}\}/, Math.round(n).toLocaleString('en-IN'))
      .replace(/\{\{\s*amount\s*\}\}/, n.toLocaleString('en-IN', { minimumFractionDigits: 2 }));
  };
  const renderCart = (cart) => {
    document.querySelectorAll('[data-cart-count]').forEach((el) => (el.textContent = cart.item_count));
    const list = document.querySelector('[data-cart-lines]'); if (!list) return;
    if (!cart.items.length) { list.innerHTML = `<p class="cart-empty">${settings.t?.empty || 'Your bag is empty.'}</p>`; }
    else list.innerHTML = cart.items.map((it) => `
      <div class="cart-line" data-key="${it.key}">
        <img src="${it.image ? it.image.replace(/(\.[a-z]+)(\?.*)?$/, '_300x$1') : ''}" alt="">
        <div>
          <div class="cart-line__title">${it.product_title}</div>
          <div class="cart-line__meta">${it.variant_title && it.variant_title !== 'Default Title' ? it.variant_title : ''}</div>
          <div class="cart-line__qty"><button data-qty="-1" aria-label="Decrease">−</button><span>${it.quantity}</span><button data-qty="1" aria-label="Increase">+</button></div>
          <button class="cart-line__remove" data-qty="0">${settings.t?.remove || 'Remove'}</button>
        </div>
        <div>${money(it.final_line_price)}</div>
      </div>`).join('');
    document.querySelectorAll('[data-cart-subtotal]').forEach((el) => (el.textContent = money(cart.total_price)));
  };
  const fetchCart = () => fetch(root + 'cart.js').then((r) => r.json()).then(renderCart).catch(() => {});
  if (document.querySelector('[data-cart-lines]')) fetchCart();
  document.addEventListener('click', (e) => {
    const q = e.target.closest('[data-qty]'); if (!q) return;
    const line = q.closest('.cart-line'); const key = line.dataset.key;
    const cur = parseInt(line.querySelector('.cart-line__qty span').textContent, 10);
    const delta = parseInt(q.dataset.qty, 10); const qty = delta === 0 ? 0 : cur + delta;
    fetch(root + 'cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: key, quantity: qty }) })
      .then((r) => r.json()).then(renderCart);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-ajax-cart]'); if (!f) return;
    e.preventDefault();
    const btn = f.querySelector('[type=submit]'); if (btn) btn.setAttribute('disabled', '');
    fetch(root + 'cart/add.js', { method: 'POST', body: new FormData(f), headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then((r) => r.json())
      .then((res) => {
        if (res.status) { window.terzeeToast(res.description || res.message); return; }
        window.terzeeToast(settings.t?.added || 'Added to bag');
        fetchCart().then(() => openDrawer('cart-drawer'));
      })
      .finally(() => btn && btn.removeAttribute('disabled'));
  });

  /* Used by pdp.js: add several lines at once, optionally go straight to checkout */
  window.terzeeAddItems = (items, opts = {}) =>
    (opts.discount ? fetch(root + 'discount/' + encodeURIComponent(opts.discount)).catch(() => {}) : Promise.resolve())
    .then(() => fetch(root + 'cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify({ items: items.map((i) => ({ id: i.id, quantity: i.qty || 1 })) }) }))
      .then((r) => r.json())
      .then((res) => {
        if (res.status) { window.terzeeToast(res.description || res.message); return; }
        if (opts.checkout) { window.location.href = root + 'checkout' + (opts.discount ? '?discount=' + encodeURIComponent(opts.discount) : ''); return; }
        window.terzeeToast(items.length > 1 ? 'Set added to bag' : (settings.t?.added || 'Added to bag'));
        return fetchCart().then(() => openDrawer('cart-drawer'));
      })
      .catch(() => window.terzeeToast('Something went wrong — please try again'));

  /* ---------- Shop cards (home + collection): swatches, wishlist ---------- */
  document.addEventListener('click', (e) => {
    const sw = e.target.closest('.shop-swatch'); if (!sw) return;
    const card = sw.closest('.shop-card'); if (!card) return;
    card.querySelectorAll('.shop-swatch').forEach((b) => b.classList.toggle('active', b === sw));
    const img = card.querySelector('.shop-card__img');
    if (img && sw.dataset.image) { img.src = sw.dataset.image; img.removeAttribute('srcset'); }
    const colorEl = card.querySelector('[data-shop-color]'); if (colorEl) colorEl.textContent = sw.dataset.swatch;
  });
  const WL_KEY = 'terzee_wishlist';
  const getWl = () => { try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]'); } catch (_) { return []; } };
  const shopPaint = (scope) => {
    const wl = getWl();
    scope.querySelectorAll('[data-wishlist]').forEach((b) => { const on = wl.includes(b.dataset.wishlist); b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
  };
  window.terzeeShopPaint = shopPaint;
  shopPaint(document);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-wishlist]'); if (!b) return;
    e.preventDefault();
    let wl = getWl(); const id = b.dataset.wishlist;
    wl = wl.includes(id) ? wl.filter((x) => x !== id) : wl.concat(id);
    try { localStorage.setItem(WL_KEY, JSON.stringify(wl)); } catch (_) {}
    shopPaint(document);
  });

  /* ---------- Product: variant → price/availability ---------- */
  document.querySelectorAll('[data-product-form]').forEach((form) => {
    const variants = JSON.parse(form.querySelector('[data-variants]')?.textContent || '[]');
    const idInput = form.querySelector('[name=id]');
    const priceEl = form.closest('.product__info')?.querySelector('[data-price]');
    const btn = form.querySelector('[type=submit] span');
    const update = () => {
      const opts = [...form.querySelectorAll('[data-option]')].map((g) => g.querySelector('input:checked')?.value);
      const v = variants.find((x) => opts.every((o, i) => !o || x.options[i] === o));
      if (!v) return;
      idInput.value = v.id;
      if (priceEl) priceEl.textContent = money(v.price);
      if (btn) btn.textContent = v.available ? (settings.t?.add || 'Add to bag') : (settings.t?.soldOut || 'Sold out');
      form.querySelector('[type=submit]')?.toggleAttribute('disabled', !v.available);
    };
    form.addEventListener('change', update); update();
  });

  if (hasST) window.addEventListener('load', () => ScrollTrigger.refresh());
})();

/* 3D logo modules (footer + craft): load logo3d.js once an instance nears the viewport; the module skips elements it already mounted */
(function () {
  var els = document.querySelectorAll('[data-logo3d]');
  if (!els.length) return;
  var loaded = false;
  function load(src) { if (loaded) return; loaded = true; var s = document.createElement('script'); s.src = src; s.async = true; document.head.appendChild(s); }
  Array.prototype.forEach.call(els, function (el) {
    if (!('IntersectionObserver' in window)) return load(el.dataset.module);
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(el.dataset.module); } }, { rootMargin: '600px 0px' });
    io.observe(el);
  });
})();
