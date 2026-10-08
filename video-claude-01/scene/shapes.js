// Formas 2D amostradas em coordenadas polares (mesmo nº de pontos, mesmo ângulo) -> morph
// real entre quaisquer formas "estreladas" (balão, meio balão, círculo, cartão, terminal).
import * as THREE from "three";

export const N = 240;

function arc(pts, cx, cy, r, a0, a1, seg) {
  if (r <= 1e-6) { pts.push([cx, cy]); return; }
  for (let i = 0; i <= seg; i++) {
    const a = ((a0 + ((a1 - a0) * i) / seg) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
}

// radii: [tl, tr, br, bl] ou número
export function roundedRectPoly(w, h, radii, seg = 12) {
  const [tl, tr, br, bl] = Array.isArray(radii) ? radii : [radii, radii, radii, radii];
  const p = [];
  arc(p, w / 2 - tr, h / 2 - tr, tr, 0, 90, seg);
  arc(p, -w / 2 + tl, h / 2 - tl, tl, 90, 180, seg);
  arc(p, -w / 2 + bl, -h / 2 + bl, bl, 180, 270, seg);
  arc(p, w / 2 - br, -h / 2 + br, br, 270, 360, seg);
  return p;
}

// balão de chat: retângulo arredondado + rabinho embaixo à esquerda
export function bubblePoly(w, h, r, tw, th, seg = 12) {
  const p = [];
  arc(p, w / 2 - r, h / 2 - r, r, 0, 90, seg);
  arc(p, -w / 2 + r, h / 2 - r, r, 90, 180, seg);
  arc(p, -w / 2 + r, -h / 2 + r, r, 180, 270, seg);
  const x0 = -w / 2 + r + tw * 0.15;
  p.push([x0, -h / 2], [x0 - tw * 0.55, -h / 2 - th], [x0 + tw, -h / 2]);
  arc(p, w / 2 - r, -h / 2 + r, r, 270, 360, seg);
  return p;
}

// Sutherland–Hodgman contra a reta x = 0
export function clipX(poly, keepLeft) {
  const inside = (q) => (keepLeft ? q[0] <= 1e-9 : q[0] >= -1e-9);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ia = inside(a), ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) { const k = a[0] / (a[0] - b[0]); out.push([0, a[1] + (b[1] - a[1]) * k]); }
  }
  return out;
}

// amostra o contorno por raios a partir de (cx,cy); retorna Float32Array [x0,y0,x1,y1,...] relativo ao centro
export function polar(poly, cx = 0, cy = 0, n = N, scale = 1) {
  const out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n, dx = Math.cos(a), dy = Math.sin(a);
    let best = 0;
    for (let j = 0; j < poly.length; j++) {
      const p = poly[j], q = poly[(j + 1) % poly.length];
      const ex = q[0] - p[0], ey = q[1] - p[1];
      const det = -dx * ey + ex * dy;
      if (Math.abs(det) < 1e-12) continue;
      const wx = p[0] - cx, wy = p[1] - cy;
      const s = (-wx * ey + ex * wy) / det;
      const u = (dx * wy - dy * wx) / det;
      if (s > 0 && u >= -1e-9 && u <= 1 + 1e-9 && s > best) best = s;
    }
    out[i * 2] = best * dx * scale; out[i * 2 + 1] = best * dy * scale;
  }
  return out;
}

export function circle(R, n = N, scale = 1) {
  const out = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const a = (2 * Math.PI * i) / n; out[i * 2] = R * Math.cos(a) * scale; out[i * 2 + 1] = R * Math.sin(a) * scale; }
  return out;
}

// Placa extrudada com chanfro arredondado, cuja silhueta pode mudar a cada quadro.
export class Slab extends THREE.Mesh {
  constructor(material, n = N, rings = 4) {
    const R = 2 * (rings + 1);
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array((2 + R * n) * 3);
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    const v = (r, i) => 2 + r * n + (i % n);
    for (let i = 0; i < n; i++) idx.push(0, v(0, i), v(0, i + 1));
    for (let r = 0; r < R - 1; r++)
      for (let i = 0; i < n; i++) idx.push(v(r, i), v(r + 1, i), v(r, i + 1), v(r, i + 1), v(r + 1, i), v(r + 1, i + 1));
    for (let i = 0; i < n; i++) idx.push(1, v(R - 1, i + 1), v(R - 1, i));
    g.setIndex(idx);
    super(g, material);
    this.n = n; this.K = rings; this.R = R;
  }
  setOutline(o, depth, bevel) {
    const { n, K } = this;
    const pos = this.geometry.attributes.position.array;
    let minR = Infinity;
    for (let i = 0; i < n; i++) minR = Math.min(minR, Math.hypot(o[i * 2], o[i * 2 + 1]));
    const b = Math.max(0, Math.min(bevel, depth * 0.48, minR * 0.45));
    pos[0] = 0; pos[1] = 0; pos[2] = depth / 2;
    pos[3] = 0; pos[4] = 0; pos[5] = -depth / 2;
    const ringDef = [];
    for (let j = 0; j <= K; j++) { const th = (j / K) * Math.PI / 2; ringDef.push([b * (1 - Math.sin(th)), depth / 2 - b * (1 - Math.cos(th))]); }
    for (let j = K; j >= 0; j--) { const [ins, z] = ringDef[j]; ringDef.push([ins, -z]); }
    for (let i = 0; i < n; i++) {
      const ip = (i - 1 + n) % n, inx = (i + 1) % n;
      let tx = o[inx * 2] - o[ip * 2], ty = o[inx * 2 + 1] - o[ip * 2 + 1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const nx = ty, ny = -tx; // normal externa (contorno anti-horário)
      for (let r = 0; r < ringDef.length; r++) {
        const [ins, z] = ringDef[r];
        const k = (2 + r * n + i) * 3;
        pos[k] = o[i * 2] - nx * ins; pos[k + 1] = o[i * 2 + 1] - ny * ins; pos[k + 2] = z;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
  }
}
