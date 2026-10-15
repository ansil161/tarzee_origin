// Bakes logoR.fbx into a tiny JSON: the logo's FRONT outline + triangulation (2D, longest side = 2 units).
// logo3d.js extrudes and bevels it at load, so depth / bevel stay tunable in the browser.
// Run from a folder where `three` is installed:  node bake.mjs <logo.fbx> <out.json> [flip]
// (the FBX is a flat prism lying in XZ; `flip` mirrors it if it ever comes out back-to-front)
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import fs from 'fs';
const [,, src, out, flip] = process.argv;
const b = fs.readFileSync(src);
const root = new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), '');
root.updateMatrixWorld(true);
let geo;
root.traverse(c => { if (c.isMesh && !geo) { geo = c.geometry.clone(); geo.applyMatrix4(c.matrixWorld); } });
geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
geo.applyMatrix4(new THREE.Matrix4().makeRotationX(flip ? -Math.PI / 2 : Math.PI / 2));
geo.computeBoundingBox();
const c0 = geo.boundingBox.getCenter(new THREE.Vector3()), s0 = geo.boundingBox.getSize(new THREE.Vector3());
const k = 2 / Math.max(s0.x, s0.y);
geo.translate(-c0.x, -c0.y, -c0.z);
const g = mergeVertices(geo, 1e-4);
const P = g.attributes.position.array, I = g.index.array, n = P.length / 3;
let zmax = -Infinity; for (let i = 0; i < n; i++) zmax = Math.max(zmax, P[i * 3 + 2]);
const front = [];
for (let t = 0; t < I.length; t += 3) {
  const [a, b2, c] = [I[t], I[t + 1], I[t + 2]];
  if (![a, b2, c].every(v => P[v * 3 + 2] > zmax - 1e-3)) continue;
  const cross = (P[b2 * 3] - P[a * 3]) * (P[c * 3 + 1] - P[a * 3 + 1]) - (P[b2 * 3 + 1] - P[a * 3 + 1]) * (P[c * 3] - P[a * 3]);
  front.push(cross >= 0 ? [a, b2, c] : [a, c, b2]);        // CCW seen from +z
}
const used = new Map(); const xy = [];
const vid = v => { if (!used.has(v)) { used.set(v, xy.length / 2); xy.push(P[v * 3] * k, P[v * 3 + 1] * k); } return used.get(v); };
const tri = front.flat().map(vid);
const Q = 16000, q16 = new Int16Array(xy.length).map((_, i) => Math.round(xy[i] / 1.2 * Q));
const t16 = new Uint16Array(tri);
const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
fs.writeFileSync(out, JSON.stringify({ q: Q / 1.2, xy: b64(q16), tri: b64(t16) }));
console.log('points', xy.length / 2, 'tris', tri.length / 3, 'bytes', fs.statSync(out).size);
