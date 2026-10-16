// rings.json (outer + holes, logo units) -> wordmark-mesh.json {q,xy,tri,w,h} in the same format as logo-mesh.json
import * as THREE from 'three';
import fs from 'fs';
const [,, src, out] = process.argv;
const d = JSON.parse(fs.readFileSync(src, 'utf8'));
const Q = 12000;
const V = [], TRI = [];
const v2 = p => new THREE.Vector2(p[0], p[1]);
for (const r of d.rings) {
  const outer = r.outer.map(v2), holes = r.holes.map(h => h.map(v2));
  const all = outer.concat(...holes);
  const faces = THREE.ShapeUtils.triangulateShape(outer, holes);
  const base = V.length / 2;
  for (const p of all) V.push(Math.round(p.x * Q), Math.round(p.y * Q));
  for (const [a, b, c] of faces) {
    const [ax, ay, bx, by, cx, cy] = [all[a].x, all[a].y, all[b].x, all[b].y, all[c].x, all[c].y];
    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    TRI.push(base + a, ...(cross >= 0 ? [base + b, base + c] : [base + c, base + b]));
  }
}
const b64 = a => Buffer.from(a.buffer).toString('base64');
fs.writeFileSync(out, JSON.stringify({ q: Q, xy: b64(new Int16Array(V)), tri: b64(new Uint16Array(TRI)), w: d.w, h: d.h }));
console.log('verts', V.length / 2, 'tris', TRI.length / 3);
