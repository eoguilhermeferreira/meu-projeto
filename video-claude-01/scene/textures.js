// Texturas desenhadas em canvas (determinísticas): ícones genéricos dos cartões, logo, brilho e terminal.
import * as THREE from "three";
import { prog } from "./util.js";

const FONT_T = '"Inter Tight", sans-serif';
const FONT_M = '"JetBrains Mono", monospace';

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return { canvas: c, ctx, tex };
}

// ---- ícones simples, desenhados por nós (traço off-white) ----------------------------------
function icon(ctx, kind, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100);
  ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const doc = () => { ctx.beginPath(); ctx.moveTo(18, 6); ctx.lineTo(62, 6); ctx.lineTo(82, 26); ctx.lineTo(82, 94); ctx.lineTo(18, 94); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(62, 6); ctx.lineTo(62, 26); ctx.lineTo(82, 26); ctx.stroke(); };
  if (kind === "pen") {
    ctx.beginPath(); ctx.moveTo(22, 78); ctx.lineTo(70, 30); ctx.lineTo(84, 44); ctx.lineTo(36, 92); ctx.lineTo(16, 98); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(62, 38); ctx.lineTo(76, 52); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, 12); ctx.lineTo(40, 12); ctx.stroke();
  } else if (kind === "files") {
    doc(); ctx.beginPath(); ctx.moveTo(34, 78); ctx.lineTo(34, 62); ctx.moveTo(50, 78); ctx.lineTo(50, 48); ctx.moveTo(66, 78); ctx.lineTo(66, 56); ctx.stroke();
  } else if (kind === "search") {
    ctx.beginPath(); ctx.arc(42, 42, 28, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(63, 63); ctx.lineTo(90, 90); ctx.stroke();
  } else if (kind === "newdoc") {
    doc(); ctx.beginPath(); ctx.moveTo(50, 46); ctx.lineTo(50, 78); ctx.moveTo(34, 62); ctx.lineTo(66, 62); ctx.stroke();
  }
  ctx.restore();
}

export function cardTexture(label, kind, P) {
  return canvasTex(640, 400, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    icon(ctx, kind, 44, 40, 118, P.text);
    ctx.fillStyle = P.text; ctx.textBaseline = "alphabetic";
    ctx.font = `800 66px ${FONT_T}`;
    const parts = label.split(" ");
    if (parts.length === 1) ctx.fillText(label, 44, 352);
    else { ctx.fillText(parts[0], 44, 290); ctx.fillText(parts.slice(1).join(" "), 44, 360); }
  }).tex;
}

// logo: o arquivo original rasterizado em alta resolução, sem alterar cores/proporções
export function logoTexture(img, size = 1024) {
  return canvasTex(size, size, (ctx, w, h) => {
    const k = Math.min(w / img.width, h / img.height);
    const dw = img.width * k, dh = img.height * k;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }).tex;
}

export function glowTexture(inner = "rgba(255,235,238,1)", mid = "rgba(163,33,58,0.55)") {
  return canvasTex(512, 512, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, inner); g.addColorStop(0.18, mid); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
  }).tex;
}

export function dotTexture() {
  return canvasTex(64, 64, (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.4, "rgba(255,255,255,0.5)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
  }).tex;
}

// ---- Terminal: conteúdo fictício e genérico, digitado em função de t -----------------------
export class TerminalScreen {
  constructor(P, K, aspect) {
    this.P = P; this.K = K;
    this.W = 1600; this.H = Math.round(1600 / aspect);
    const o = canvasTex(this.W, this.H, () => {});
    Object.assign(this, o);
    const code = [
      [["+ ", "k"], ["export function ", "k"], ["total", "f"], ["(pedido) {", "t"]],
      [["+ ", "k"], ["  return ", "k"], ["pedido.itens", "t"]],
      [["+ ", "k"], ["    .", "t"], ["reduce", "f"], ["((s, i) => s + i.preco, 0)", "t"]],
      [["+ ", "k"], ["}", "t"]],
    ];
    this.code = code;
    this.codeLen = code.reduce((a, l) => a + l.reduce((b, s) => b + s[0].length, 0), 0);
  }
  draw(t) {
    const { ctx, W, H, P, K } = this;
    const S = K.steps; // [lê, escreve, roda, testa]
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1a0d11"); g.addColorStop(1, "#0e0809");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // barra de título
    ctx.fillStyle = "#1c0e12"; ctx.fillRect(0, 0, W, 96);
    [P.wine2, P.wine1, P.wine0].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(54 + i * 46, 48, 15, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = P.muted; ctx.font = `500 34px ${FONT_M}`; ctx.textAlign = "center"; ctx.fillText("~/meu-projeto", W / 2, 58); ctx.textAlign = "left";
    const FS = 50, lh = 74, x0 = 56, top = 96 + 70, bottomPad = 40;
    const col = { k: "#E07A8C", f: P.text, t: "#CFC6C8", m: P.muted, p: P.wine2 };
    const typed = (s, t0, cps) => s.slice(0, Math.max(0, Math.floor((t - t0) * cps)));
    const L = []; // linhas: { segs, bold, gap, pill }
    const spin = ["|", "/", "-", "\\"][Math.floor(t * 12) % 4];
    const t0 = K.termStart;
    if (t >= t0) L.push({ segs: [["$ ", "p"], [typed("claude", t0 + 0.15, 16), "f"]] });
    if (t >= S[0]) {
      L.push({ segs: [[t < S[1] ? spin + " " : "• ", "p"], ["Lendo o projeto...", "f"]] });
      L.push({ segs: [[typed("  src/ app.js rotas.js +12", S[0] + 0.15, 60), "m"]] });
    }
    if (t >= S[1]) {
      L.push({ segs: [[t < S[2] ? spin + " " : "• ", "p"], ["Escrevendo pedidos.js", "f"]] });
      const span = Math.max(0.6, S[2] - S[1] - 0.45);
      let left = Math.floor(prog(t, S[1] + 0.25, S[1] + 0.25 + span) * this.codeLen);
      for (const l of this.code) {
        if (left <= 0) break;
        const segs = [];
        for (const [txt, c] of l) { const k = Math.min(txt.length, left); segs.push([txt.slice(0, k), c]); left -= k; if (left <= 0) break; }
        L.push({ segs });
      }
    }
    if (t >= S[2]) {
      L.push({ gap: 14, segs: [["$ ", "p"], [typed("npm test", S[2] + 0.05, 20), "f"]] });
      if (t >= S[2] + 0.55 && t < S[3] + 0.15) L.push({ segs: [[spin + " ", "p"], ["rodando testes...", "m"]] });
    }
    ["soma os itens", "aplica desconto"].forEach((s, i) => { if (t >= S[3] + 0.15 + i * 0.3) L.push({ segs: [["  ✓ ", "#E07A8C"], [s, "t"]] }); });
    if (t >= K.funcionar + 0.1) L.push({ gap: 18, bold: true, pill: true, segs: [["✓ 8 testes passaram", "f"]] });
    // rolagem: mantém a última linha visível (como um terminal real)
    const contentH = L.reduce((a, l) => a + lh + (l.gap || 0), 0);
    const avail = H - top - bottomPad + lh;
    const scrollTarget = Math.max(0, contentH - avail);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 96, W, H - 96); ctx.clip();
    let y = top - scrollTarget, cursor = null;
    for (const l of L) {
      y += l.gap || 0;
      ctx.font = `${l.bold ? 700 : 500} ${FS}px ${FONT_M}`;
      if (l.pill) { let w = 0; for (const [txt] of l.segs) w += ctx.measureText(txt).width; ctx.fillStyle = P.wine1; ctx.beginPath(); ctx.roundRect(x0 - 16, y - FS * 0.95, w + 32, FS * 1.35, 14); ctx.fill(); }
      let x = x0;
      for (const [txt, c] of l.segs) { if (!txt) continue; ctx.fillStyle = col[c] || c; ctx.fillText(txt, x, y); x += ctx.measureText(txt).width; }
      cursor = [x, y]; y += lh;
    }
    if (cursor && Math.floor(t * 2.4) % 2 === 0) { ctx.fillStyle = P.text; ctx.fillRect(cursor[0] + 6, cursor[1] - FS * 0.85, FS * 0.52, FS * 1.08); }
    ctx.restore();
    this.tex.needsUpdate = true;
  }
}
