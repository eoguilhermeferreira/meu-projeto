// Utilitários determinísticos: PRNG, ruído, easings e trilhas de keyframes. Nada aqui lê relógio.

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// hash inteiro -> [0,1)
export function hash01(n, seed = 2026) {
  let h = Math.imul((n | 0) ^ seed, 0x27d4eb2d);
  h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// value noise 1D suave e determinístico
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const a = hash01(i, 2026 + seed * 131), b = hash01(i + 1, 2026 + seed * 131);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u - 0.5;
}

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, k) => a + (b - a) * k;
export const prog = (t, a, b) => (b <= a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a)));
export const linear = (x) => x;
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
export const easeInCubic = (x) => x * x * x;
export const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
export const easeOutBack = (x, s = 1.70158) => { const c = s + 1; return 1 + c * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };
export const easeOutBackStrong = (x) => easeOutBack(x, 2.4);
// elástico suave: ~20% de overshoot, assenta em 1
export const easeOutElastic = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(2, -10 * x) * Math.cos(x * Math.PI * 4.5));
// pulso 0->1->0
export const bump = (t, a, peak, b) => (t <= a || t >= b ? 0 : t < peak ? easeOutCubic((t - a) / (peak - a)) : 1 - easeInOutCubic((t - peak) / (b - peak)));

export function mix(a, b, k) {
  if (typeof a === "number") return a + (b - a) * k;
  const out = new (a.constructor === Float32Array ? Float32Array : Array)(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] + (b[i] - a[i]) * k;
  return out;
}

// Trilha de keyframes: [[tempo, valor, easing_de_chegada?], ...] (tempos crescentes)
export class Track {
  constructor(keys) { this.keys = keys.filter(Boolean); }
  at(t) {
    const k = this.keys;
    if (t <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) {
      if (t <= k[i][0]) {
        const [t0, v0] = k[i - 1];
        const [t1, v1, e = easeInOutCubic] = k[i];
        return mix(v0, v1, t1 > t0 ? e((t - t0) / (t1 - t0)) : 1);
      }
    }
    return k[k.length - 1][1];
  }
}
