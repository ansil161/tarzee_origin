/* Terzee Origins — interactive 3D logo (self-contained module)
 *
 * Build:  esbuild logo3d.src.js --bundle --minify --format=iife --outfile=logo3d.js
 *          (plain script with the baked mesh inside: works from file:// as well as on a server)
 * Mount:  any element with  [data-logo3d]
 *         (child <canvas data-logo3d-canvas> and optional <img data-logo3d-fallback>)
 * Loaded lazily by the section's inline loader when the section nears the viewport.
 */
import MESH from './logo-mesh.json';
import WORD from './wordmark-mesh.json';   // the TERZEE wordmark, traced from the brand PNG (only used when the element has data-lockup)
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, MeshPhysicalMaterial, MeshBasicMaterial, Quaternion, Euler, Vector3,
  BufferGeometry, BufferAttribute, PMREMGenerator, BoxGeometry, PlaneGeometry, DirectionalLight,
  ACESFilmicToneMapping, SRGBColorSpace, BackSide, Color, MathUtils, HalfFloatType, DoubleSide
} from 'three';

/* ───────────────────────── tunables ───────────────────────── */
const CFG = {
  RESPECT_REDUCED_MOTION: false, // true = hold a static pose when the OS asks for reduced motion (Windows: Settings > Accessibility > Visual effects > Animation effects off)
  AUTO_SPEED: 0.5,            // rad/s, Y-axis auto-rotation
  TILT_AMOUNT: 0.14,          // rad, sinusoidal X tilt while auto-rotating
  TILT_SPEED: 0.7,            // rad/s of that tilt oscillation
  LEVEL_SPEED: 0.5,           // how fast it drifts back upright after you let go (0 = keeps whatever side you left it on)
  DRAG_SENSITIVITY: 0.0075,   // rad per px
  INERTIA_DAMPING: 3.2,       // higher = inertia dies faster
  IDLE_RESUME_MS: 1500,       // wait after the last interaction before easing back to auto
  RESUME_EASE: 1.4,           // seconds to blend back into auto-rotation
  PARALLAX_DEG: 8,            // max hover tilt (desktop, not dragging)
  DEPTH: 0.34,                // extrusion depth (logo is 2 units wide, so 0.34 = 17% of its width)
  BEVEL: 0.03,                // bevel radius; the rounded edge is what catches the glints
  BEVEL_STEPS: 4,             // segments around the bevel
  CREASE_DEG: 40,             // outline corners sharper than this stay crisp; gentler ones shade smooth
  COLOR: 0x6c6c6c,            // base metal tint = how much the metal reflects (lower = darker chrome)
  METALNESS: 1.0,
  ROUGHNESS: 0.2,
  CLEARCOAT: 1.0,
  CLEARCOAT_ROUGHNESS: 0.05,
  ENV_INTENSITY: 1.15,        // overall strength of the studio reflections
  FILL: 0.55,                 // brightness of the dim fill panels (how readable the dark faces are)
  GLINT_STRENGTH: 1.0,        // multiplies the brightness of the softbox strips (0 = no glints)
  KEY_LIGHT_SPEED: 0.35,      // rad/s, orbit of the independent key light
  KEY_LIGHT_INTENSITY: 1.6,   // direct light on top of the environment (0 = environment only)
  EXPOSURE: 1.0,
  WORD_COLOR: 0xe6e6e6,        // the wordmark is a brighter, satin silver so the name stays readable on black
  WORD_METALNESS: 0.55,
  WORD_ROUGHNESS: 0.3,
  FACE_DWELL: 0.2,            // lockup only: auto-rotation slows to this fraction of its speed while the front/back faces you (1 = constant speed)
  WORD_DEPTH: 0.15,           // extrusion depth of the wordmark (its strokes are thin, so shallower than the mark)
  WORD_BEVEL: 0.016,          // bevel radius of the wordmark
  LOCKUP_GAP: 0.3,            // space between the mark and the wordmark when data-lockup is set
  FIT: 1.12                   // camera margin around the logo (bigger = logo smaller)
};

const reduceMotion = () => CFG.RESPECT_REDUCED_MOTION && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const b64 = s => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };

/* ───────── custom studio environment: dark room + narrow bright strips ───────── */
function buildEnvironment(renderer) {
  const scene = new Scene();
  const room = new Mesh(new BoxGeometry(30, 20, 30), new MeshBasicMaterial({ color: 0x030303, side: BackSide }));
  scene.add(room);
  const strip = (w, h, x, y, z, power, tint = 0xffffff) => {
    const m = new MeshBasicMaterial({ side: DoubleSide });
    m.color = new Color(tint).multiplyScalar(power * CFG.GLINT_STRENGTH);
    const p = new Mesh(new PlaneGeometry(w, h), m);
    p.position.set(x, y, z); p.lookAt(0, 0, 0); scene.add(p);
  };
  strip(0.35, 11, -7.5, 0.5, 5, 14);            // tall narrow strip, left-front
  strip(0.22, 10, 8.5, 0.5, 2, 16);             // very thin strip, right
  strip(11, 0.3, 0, 8.5, 4.5, 12);              // thin horizontal strip overhead
  strip(0.5, 6, 2.5, -1.5, -9, 9, 0xfff1dc);    // warm rim strip behind
  strip(3, 0.18, -4, -7, 3, 7);                 // low floor glint
  // very dim, wide panels: give the flat faces a soft gradient so the shape reads, without flattening the glints
  const fill = (w, h, x, y, z, power) => { const m = new MeshBasicMaterial({ side: DoubleSide }); m.color = new Color(1, 1, 1).multiplyScalar(power); const p = new Mesh(new PlaneGeometry(w, h), m); p.position.set(x, y, z); p.lookAt(0, 0, 0); scene.add(p); };
  fill(16, 9, 0, 1, 12, CFG.FILL);
  fill(9, 14, -11, 0, -3, CFG.FILL * 0.6);
  const pm = new PMREMGenerator(renderer);
  const rt = pm.fromScene(scene, 0.015);        // low blur = sharp, thin highlights
  pm.dispose();
  scene.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return rt;
}

/* ───── extrude + bevel the baked 2D outline (front cap triangulation) ─────
 * cap -> rounded bevel rings -> side wall, mirrored for the back. Boundary edges are the triangle
 * edges that have no reverse twin; the logo's interior is always to their left (CCW cap).
 * Normals are analytic: the cap stays dead flat, the bevel is a true quarter-round, and corners sharper
 * than CREASE_DEG get their own vertices so they stay crisp instead of shading like a pillow. */
function buildLogoGeometry(xyq, tri, q, depth = CFG.DEPTH, bevel = CFG.BEVEL) {
  const n = xyq.length / 2, X = new Float32Array(n), Y = new Float32Array(n);
  for (let i = 0; i < n; i++) { X[i] = xyq[i * 2] / q; Y[i] = xyq[i * 2 + 1] / q; }
  const H = depth / 2, r = bevel, STEPS = CFG.BEVEL_STEPS, cosCrease = Math.cos(MathUtils.degToRad(CFG.CREASE_DEG));
  const dir = new Map(), key = (a, b) => a * 65536 + b;
  for (let t = 0; t < tri.length; t += 3) for (let e = 0; e < 3; e++) { const a = tri[t + e], b = tri[t + (e + 1) % 3]; dir.set(key(a, b), [a, b]); }
  const bedges = [...dir.values()].filter(([a, b]) => !dir.has(key(b, a)));
  const eN = bedges.map(([a, b]) => { const dx = X[b] - X[a], dy = Y[b] - Y[a], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
  const vEdges = new Map();
  bedges.forEach(([a, b], e) => { for (const v of [a, b]) { const o = vEdges.get(v); o ? o.push(e) : vEdges.set(v, [e]); } });
  const miter = new Map(), uAvg = new Map(), smooth = new Map();
  vEdges.forEach((es, v) => {
    const ns = es.map(e => eN[e]), sx = ns.reduce((s, m) => s + m[0], 0), sy = ns.reduce((s, m) => s + m[1], 0), l = Math.hypot(sx, sy) || 1;
    const ux = sx / l, uy = sy / l, c = Math.min(...ns.map(m => ux * m[0] + uy * m[1]));
    miter.set(v, [ux / Math.max(0.45, c), uy / Math.max(0.45, c)]); uAvg.set(v, [ux, uy]);
    smooth.set(v, ns.every(m => ns.every(o => m[0] * o[0] + m[1] * o[1] >= cosCrease)));
  });
  const pos = [], nrm = [], idx = [];
  const add = (x, y, z, nx, ny, nz) => (pos.push(x, y, z), nrm.push(nx, ny, nz), pos.length / 3 - 1);
  const T = (a, b, c, f) => idx.push(a, f ? c : b, f ? b : c);
  const th = Array.from({ length: STEPS + 1 }, (_, i) => (i / STEPS) * Math.PI / 2);
  const ring = new Map();
  const rv = (v, i, side, e) => {
    const sm = smooth.get(v), k = ((v * 16 + (sm ? 0 : e % 8 + 1)) * 16 + i) * 2 + (side > 0 ? 1 : 0);
    let id = ring.get(k);
    if (id === undefined) {
      const m = miter.get(v), o = r * (1 - Math.cos(th[i])), u = sm ? uAvg.get(v) : eN[e], c = Math.cos(th[i]), s = Math.sin(th[i]);
      id = add(X[v] + m[0] * o, Y[v] + m[1] * o, (H - r + r * s) * side, -u[0] * c, -u[1] * c, s * side);
      ring.set(k, id);
    }
    return id;
  };
  const capId = new Map();
  const cv = (v, side) => {
    const k = v * 2 + (side > 0 ? 1 : 0); let id = capId.get(k);
    if (id === undefined) {
      const m = miter.get(v), o = m ? r : 0;
      id = add(X[v] + (m ? m[0] * o : 0), Y[v] + (m ? m[1] * o : 0), H * side, 0, 0, side); capId.set(k, id);
    }
    return id;
  };
  for (const side of [1, -1]) {
    const f = side < 0;
    for (let t = 0; t < tri.length; t += 3) T(cv(tri[t], side), cv(tri[t + 1], side), cv(tri[t + 2], side), f);
    bedges.forEach(([a, b], e) => {
      for (let i = 0; i < STEPS; i++) {
        const A0 = rv(a, i, side, e), B0 = rv(b, i, side, e), A1 = rv(a, i + 1, side, e), B1 = rv(b, i + 1, side, e);
        T(A0, B0, B1, f); T(A0, B1, A1, f);
      }
    });
  }
  bedges.forEach(([a, b], e) => {
    const At = rv(a, 0, 1, e), Ab = rv(a, 0, -1, e), Bt = rv(b, 0, 1, e), Bb = rv(b, 0, -1, e);
    T(At, Ab, Bt, false); T(Bt, Ab, Bb, false);
  });
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('normal', new BufferAttribute(new Float32Array(nrm), 3));
  g.setIndex(new BufferAttribute(pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
  return g;
}

/* ───────────────────────── the logo controller ───────────────────────── */
function mount(root) {
  const canvas = root.querySelector('[data-logo3d-canvas]');
  const fallback = root.querySelector('[data-logo3d-fallback]');
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }                  // no WebGL: fallback image stays
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = CFG.EXPOSURE;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 0.1, 50);
  const envRT = buildEnvironment(renderer);
  scene.environment = envRT.texture;
  scene.environmentIntensity = CFG.ENV_INTENSITY;

  const key = new DirectionalLight(0xffffff, CFG.KEY_LIGHT_INTENSITY);
  scene.add(key);

  const material = new MeshPhysicalMaterial({
    color: CFG.COLOR, metalness: CFG.METALNESS, roughness: CFG.ROUGHNESS,
    clearcoat: CFG.CLEARCOAT, clearcoatRoughness: CFG.CLEARCOAT_ROUGHNESS,
    envMapIntensity: CFG.ENV_INTENSITY
  });
  const pivot = new Group();   // user + auto rotation
  const tilt = new Group();    // hover parallax + sinusoidal tilt
  tilt.add(pivot); scene.add(tilt);
  const lockup = root.hasAttribute('data-lockup');
  const LW = lockup ? Math.max(2, WORD.w) : 2, LH = lockup ? 2 + CFG.LOCKUP_GAP + WORD.h : 2;   // lockup bounds in logo units
  let geometry = null, mesh = null, geometry2 = null, material2 = null;

  /* state */
  const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0.5), qd = new Quaternion(), AX = new Vector3(1, 0, 0), AY = new Vector3(0, 1, 0), eu = new Euler(), upright = new Quaternion();
  const st = { vYaw: 0, vPitch: 0, drag: false, lastX: 0, lastY: 0, lastT: 0,
    lastInteract: -1e9, auto: 1, px: 0, py: 0, ptx: 0, pty: 0, t: 0, running: false, visible: false, raf: 0, ready: false };
  const reduced = reduceMotion();
  // free rotation: drags are applied about the screen's own axes, so any side can be turned to face you
  const spin = (yaw, pitch) => { q.premultiply(qd.setFromAxisAngle(AY, yaw)); q.premultiply(qd.setFromAxisAngle(AX, pitch)); q.normalize(); };

  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = MathUtils.degToRad(camera.fov) / 2;         // mark alone ≈ 2 x 2 units; the lockup is taller and a little wider
    const dist = Math.max((LH / 2) * CFG.FIT / Math.tan(vFov), (LW / 2) * CFG.FIT / (Math.tan(vFov) * camera.aspect));
    camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(() => { resize(); if (st.ready && !st.running) draw(); });
  ro.observe(canvas);
  resize();

  /* geometry */
  try {
    const d = MESH, xy = new Int16Array(b64(d.xy)), tri = new Uint16Array(b64(d.tri));
    const g = buildLogoGeometry(xy, tri, d.q);
    g.computeBoundingSphere();
    geometry = g;
    mesh = new Mesh(g, material);
    if (lockup) {
      mesh.position.y = LH / 2 - 1;                           // mark on top
      const w = new Int16Array(b64(WORD.xy)), wt = new Uint16Array(b64(WORD.tri));
      geometry2 = buildLogoGeometry(w, wt, WORD.q, CFG.WORD_DEPTH, CFG.WORD_BEVEL);
      material2 = new MeshPhysicalMaterial({ color: CFG.WORD_COLOR, metalness: CFG.WORD_METALNESS, roughness: CFG.WORD_ROUGHNESS, clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: CFG.ENV_INTENSITY * 1.1 });
      const m2 = new Mesh(geometry2, material2);
      m2.position.y = -LH / 2 + WORD.h / 2;                   // TERZEE underneath, same metal, rotates with the mark
      pivot.add(m2);
    }
    pivot.add(mesh);
    st.ready = true;
    draw();
    root.classList.add('is-3d');                              // fades the fallback image out
    if (fallback) setTimeout(() => { fallback.hidden = true; }, 900);
    if (st.visible) start();
  } catch (e) { console.warn("logo3d: falling back to the still image", e); }

  /* drag / touch */
  canvas.addEventListener('pointerdown', e => {
    st.drag = true; st.lastX = e.clientX; st.lastY = e.clientY; st.lastT = performance.now();
    st.vYaw = 0; st.vPitch = 0; st.lastInteract = performance.now(); st.auto = 0;
    canvas.setPointerCapture(e.pointerId); root.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    st.ptx = ((e.clientX - r.left) / r.width - 0.5) * 2; st.pty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!st.drag) return;
    const now = performance.now(), dt = Math.max(1, now - st.lastT) / 1000;
    const dx = e.clientX - st.lastX, dy = e.clientY - st.lastY;
    spin(dx * CFG.DRAG_SENSITIVITY, dy * CFG.DRAG_SENSITIVITY);
    st.vYaw = (dx * CFG.DRAG_SENSITIVITY) / dt; st.vPitch = (dy * CFG.DRAG_SENSITIVITY) / dt;
    st.lastX = e.clientX; st.lastY = e.clientY; st.lastT = now; st.lastInteract = now;
    if (!st.running) draw();
  });
  const release = e => {
    if (!st.drag) return;
    st.drag = false; st.lastInteract = performance.now(); root.classList.remove('is-dragging');
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    if (performance.now() - st.lastT > 90) { st.vYaw = 0; st.vPitch = 0; }   // paused before release: no fling
    if (!st.running) start();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { if (!st.drag) { st.ptx = 0; st.pty = 0; } });

  /* frame */
  const ease = x => x * x * (3 - 2 * x);
  let prev = 0;
  function update(dt) {
    st.t += dt;
    const now = performance.now();
    const idle = !st.drag && now - st.lastInteract > CFG.IDLE_RESUME_MS;
    if (!reduced) {
      st.auto = idle ? Math.min(1, st.auto + dt / CFG.RESUME_EASE) : (st.drag ? 0 : st.auto);
      let sp = CFG.AUTO_SPEED * ease(st.auto);
      if (lockup) { eu.setFromQuaternion(q, 'YXZ'); sp *= CFG.FACE_DWELL + (1 - CFG.FACE_DWELL) * Math.pow(Math.sin(eu.y), 2); }   // linger while the name faces you, sweep through the sides
      spin(sp * dt, 0);
    }
    if (!st.drag) {                                    // inertia
      const damp = Math.exp(-CFG.INERTIA_DAMPING * dt);
      spin(st.vYaw * dt, st.vPitch * dt); st.vYaw *= damp; st.vPitch *= damp;
      if (idle && !reduced && CFG.LEVEL_SPEED > 0) {      // drift back upright, keeping the current heading
        eu.setFromQuaternion(q, 'YXZ'); upright.setFromEuler(eu.set(0, eu.y, 0));
        q.slerp(upright, 1 - Math.exp(-CFG.LEVEL_SPEED * dt));
      }
    }
    // hover parallax (mouse only)
    const par = MathUtils.degToRad(CFG.PARALLAX_DEG);
    const k = 1 - Math.exp(-5 * dt);
    st.px += ((st.drag ? 0 : st.ptx) * par - st.px) * k; st.py += ((st.drag ? 0 : st.pty) * par - st.py) * k;
    pivot.quaternion.copy(q);
    tilt.rotation.x = st.py + (reduced ? 0 : Math.sin(st.t * CFG.TILT_SPEED) * CFG.TILT_AMOUNT * ease(Math.max(st.auto, 0.15)));
    tilt.rotation.y = st.px;
    // independent orbiting key light: highlights move over time even when the logo is still
    const a = st.t * CFG.KEY_LIGHT_SPEED + 1.2;
    key.position.set(Math.sin(a) * 5, 1.5 + Math.sin(a * 0.7) * 2.2, Math.cos(a) * 5);
    key.target.position.set(0, 0, 0);
  }
  function draw() { renderer.render(scene, camera); }
  function loop(ts) {
    if (!st.running) return;
    const dt = Math.min(0.05, (ts - (prev || ts)) / 1000); prev = ts;
    update(dt); draw();
    // sleep when fully settled and motion is off (reduced-motion + no inertia)
    if (reduced && !st.drag && Math.abs(st.vYaw) < 0.005 && Math.abs(st.vPitch) < 0.005 && Math.abs(st.px) + Math.abs(st.py) < 1e-3 && !st.ptx && !st.pty) { st.running = false; return; }
    st.raf = requestAnimationFrame(loop);
  }
  function start() { if (!st.ready || st.running || !st.visible || document.hidden) return; st.running = true; prev = 0; st.raf = requestAnimationFrame(loop); }
  function stop() { st.running = false; cancelAnimationFrame(st.raf); }

  const io = new IntersectionObserver(es => { st.visible = es[0].isIntersecting; st.visible ? start() : stop(); }, { rootMargin: '80px' });
  io.observe(root);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  if (reduced) update(0.016);

  return function destroy() {
    stop(); io.disconnect(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis);
    geometry && geometry.dispose(); geometry2 && geometry2.dispose(); material2 && material2.dispose(); material.dispose(); envRT.dispose(); renderer.dispose();
  };
}

document.querySelectorAll('[data-logo3d]').forEach(el => {
  if (el.__logo3d) return;
  el.__logo3d = mount(el) || true;
});
