// Layouts por formato. Tudo em "u" = 1% do menor lado da tela.
// Coordenadas: x para a direita, y para CIMA, relativas ao "foco" (centro da zona segura).
// O mesmo arquivo é importado pela página (navegador) e pelo render.mjs (Node).

export const WORLD_PER_U = 0.1; // 1u = 0.1 unidade de mundo no plano z=0

const BASE_9x16 = {
  s1: {
    bubble: { x: 0, y: 18, w: 48, h: 32, r: 8, tw: 10, th: 8, depth: 7, bevel: 2.2 },
    small: { y: 50, size: 5.2 },
    big1: { y: -17, size: 12 },
    big2: { y: -31, size: 12 },
    half: { y: -24, size: 13 },
  },
  s2: {
    disc: { x: 0, y: 2, R: 11, depth: 5, bevel: 2 },
    logo: { size: 14 },
    title: { y: 47, size: 11 },
    sub: { y: 36.5, size: 4.8 },
    sub2: { y: 31, size: 3.6 },
    card: { w: 22, h: 14, r: 2.8, depth: 2.2, bevel: 0.8 },
    orbit: { rx: 27, ry: 13, rz: 15 },
    chip: { y: -30, size: 3.2 },
    word: { y: -41, size: 8.5 },
  },
  s3: {
    term: { x: 0, y: 2, w: 64, h: 44, r: 4, depth: 3.4, bevel: 1.1 },
    title: { y: 47, size: 10 },
    sub: { y: 37, size: 4.8 },
    steps: { x: -42, y: -27, dy: 8.4, size: 5.8 },
    check: { x: 37, y: -52.2, size: 9 },
  },
  s4: {
    bubble: { x: 0, y: 34, w: 40, h: 22, r: 7, tw: 8, th: 6 },
    chatLabel: { y: 52, size: 3 },
    top: { y: 10, size: 8.5 },
    term: { x: 0, y: -20, scale: 0.62 },
    codeLabel: { y: 0.5, size: 3 },
    bottom: { y: -44, size: 8.5 },
  },
  s5: {
    light: { x: 0, y: 4 },
    logo: { y: 18, size: 29 },
    sub: { y: -2, size: 4.4 },
    handle: { y: -16, size: 5.6 },
  },
};

// 16x9: estruturado e funcional (derivado do 9x16), sem refinamento.
function derive(obj, f) {
  if (Array.isArray(obj) || typeof obj !== "object") return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "object") out[k] = derive(v, f);
    else if (k === "y" || k === "dy") out[k] = v * f.sy;
    else if (k === "size") out[k] = v * f.ss;
    else if (["w", "h", "r", "R", "tw", "th", "depth", "bevel", "rx", "ry", "rz"].includes(k)) out[k] = v * f.so;
    else out[k] = v;
  }
  return out;
}

export const LAYOUTS = {
  "9x16": {
    viewport: { width: 1080, height: 1920 },
    // zona segura do Reels (px em 1080x1920): nada importante aqui
    safe: { top: 250, bottom: 420, right: 130, left: 0 },
    fov: 40,
    ...BASE_9x16,
  },
  "16x9": {
    viewport: { width: 1920, height: 1080 },
    safe: { top: 60, bottom: 60, right: 90, left: 90 },
    fov: 40,
    ...derive(BASE_9x16, { sy: 0.72, ss: 0.78, so: 0.8 }),
  },
};

export function resolveLayout(format) {
  const L = LAYOUTS[format];
  if (!L) throw new Error(`Formato desconhecido: ${format} (use ${Object.keys(LAYOUTS).join(" | ")})`);
  const { width, height } = L.viewport;
  const minSide = Math.min(width, height);
  const pxPerU = minSide / 100;
  const focus = { x: (L.safe.left - L.safe.right) / 2 / pxPerU, y: (L.safe.bottom - L.safe.top) / 2 / pxPerU };
  const visH = height / pxPerU;
  const camDist = (visH * WORLD_PER_U) / 2 / Math.tan((L.fov * Math.PI) / 360);
  return { ...L, format, minSide, pxPerU, focus, camDist, visW: width / pxPerU, visH };
}
