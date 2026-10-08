// Pipeline: página HTML local -> Chrome headless (Puppeteer) -> captura quadro a quadro -> pipe -> ffmpeg -> MP4
// Uso:
//   node render.mjs --test                      (quadros 0, 600, 1200 e o último em test-frames/)
//   node render.mjs --quality preview           (leve: 540x960, 30 fps, sem bloom/antialias — p/ aprovar movimento e tempo)
//   node render.mjs --quality final             (1080x1920, 60 fps, todos os efeitos)
//   Render POR CENA: cada cena vira out/segments/<qualidade>/cena_N.mp4 e depois tudo é emendado com o áudio.
//   Cenas que não mudaram são reaproveitadas. Para refazer só algumas: --scenes 3   ou   --scenes 2,4
//   opções: --force (refaz tudo) --format 9x16|16x9 --stills 0,300 --chrome /caminho/do/chrome
import http from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";
import { resolveLayout } from "./scene/layouts.js";

const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : def; };
const TEST = args.includes("--test");
const QUALITY = opt("quality", "preview");
const FORMAT = opt("format", "9x16");
const SCENES = opt("scenes", null)?.split(",").map(Number);
const FORCE = args.includes("--force");
// Perfis: o viewport é sempre o do layout (1080x1920); muda só a escala de captura -> layout idêntico.
const PROFILES = {
  preview: { dsf: 0.5, fps: 30, lite: true, preset: "medium", crf: 20, level: "4.0", out: "claude-01_preview.mp4" },
  final: { dsf: 1, fps: 60, lite: false, preset: "slow", crf: 18, level: "4.2", out: "claude-01_final.mp4" },
};
const PF = PROFILES[QUALITY];
if (!PF) throw new Error(`--quality deve ser ${Object.keys(PROFILES).join(" ou ")}`);

const LY = resolveLayout(FORMAT);
const DSF = PF.dsf;
const OUT_W = LY.viewport.width * DSF, OUT_H = LY.viewport.height * DSF;
const TL = JSON.parse(readFileSync(join(ROOT, "timeline.json"), "utf8"));
const TOTAL_FRAMES = TL.totalFrames; // = total * 60 (total já alinhado ao quadro)
const MIX = join(ROOT, "audio/mix.wav");

const CHROME_CANDIDATES = [opt("chrome", null), process.env.CHROME_PATH, "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/opt/pw-browsers/chromium/chrome-linux/chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean);
const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!CHROME) throw new Error("Chrome/Chromium não encontrado. Use --chrome /caminho ou CHROME_PATH.");

// ---- servidor estático local -------------------------------------------------
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".wav": "audio/wav", ".mp3": "audio/mpeg" };
const server = http.createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const URL_ = `http://127.0.0.1:${server.address().port}/scene/index.html?format=${FORMAT}${PF.lite ? "&lite=1" : ""}`;

// ---- Chrome com GPU; SwiftShader só como último recurso ---------------------------
const BASE_FLAGS = ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=default", "--hide-scrollbars", "--mute-audio",
  "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--force-color-profile=srgb", "--font-render-hinting=none",
  // Chrome recusa rodar como root com sandbox (containers/CI)
  ...(process.getuid?.() === 0 ? ["--no-sandbox"] : [])];

async function launch(extra) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: [...BASE_FLAGS, ...extra],
    defaultViewport: { width: LY.viewport.width, height: LY.viewport.height, deviceScaleFactor: DSF } });
  const page = await browser.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) console.log(`[página:${m.type()}] ${m.text()}`); });
  page.on("pageerror", (e) => console.log(`[página:erro] ${e.message}`));
  await page.goto(URL_, { waitUntil: "load" });
  await page.waitForFunction(() => typeof window.__init === "function", { timeout: 30000 });
  const info = await page.evaluate(() => window.__init());
  return { browser, page, info };
}

let ctx;
try { ctx = await launch([]); }
catch (e) {
  console.warn(`\n[gpu] WebGL indisponível com GPU (${e.message.split("\n")[0]}).\n[gpu] Último recurso: relançando com --enable-unsafe-swiftshader\n`);
  ctx = await launch(["--enable-unsafe-swiftshader"]);
}
const { browser, page, info } = ctx;
console.log(`[gpu] renderer: ${info.renderer}`);
console.log(`[gpu] vendor:   ${info.vendor}  | WebGL2: ${info.webgl2}`);
console.log(`[fontes] ${info.fonts.join(", ")}`);
if (/swiftshader|llvmpipe|software|softpipe/i.test(info.renderer)) {
  const bar = "!".repeat(78);
  console.warn(`\n${bar}\n!!  ATENÇÃO: renderização por SOFTWARE (${info.renderer}).\n!!  Vai funcionar, mas é LENTA. Use o --quality preview para aprovar e rode o\n!!  --quality final de preferência num computador com GPU.\n${bar}\n`);
}
if (!info.nodexLogo) console.warn("[assets] assets/nodex-logo.svg|png não encontrada -> CTA usa \"NODEX\" em tipografia.");
console.log(`[render] ${QUALITY} | formato ${FORMAT} | ${OUT_W}x${OUT_H} @${PF.fps}fps | ${TL.total}s`);

const client = await page.createCDPSession();
async function grab(n) {
  await page.evaluate((k) => window.renderFrame(k), n);
  const { data } = await client.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, captureBeyondViewport: false, fromSurface: true });
  return Buffer.from(data, "base64");
}

// ---- modo teste ------------------------------------------------------------------
if (TEST) {
  const dir = join(ROOT, "test-frames"); mkdirSync(dir, { recursive: true });
  const last = TOTAL_FRAMES - 1;
  const list = [0, 600, 1200, last];
  for (const n of list) {
    const png = await grab(n);
    const f = join(dir, `frame_${String(n).padStart(4, "0")}.png`);
    writeFileSync(f, png);
    console.log(`[test] ${f} (t=${(n / 60).toFixed(3)}s)`);
  }
  // determinismo: o mesmo quadro duas vezes precisa sair idêntico
  const a = await grab(600), b = await grab(600);
  console.log(`[test] determinismo quadro 600: ${a.equals(b) ? "IDÊNTICO" : "DIFERENTE (!)"}`);
  await browser.close(); server.close();
  process.exit(0);
}

// ---- quadros avulsos (revisão): --stills 0,300,900 -> test-frames/stills/
const STILLS = opt("stills", null);
if (STILLS) {
  const dir = join(ROOT, "test-frames", "stills"); mkdirSync(dir, { recursive: true });
  for (const n of STILLS.split(",").map(Number)) {
    writeFileSync(join(dir, `s_${String(n).padStart(4, "0")}.png`), await grab(n));
  }
  console.log(`[stills] ${STILLS.split(",").length} quadros em ${dir}`);
  await browser.close(); server.close();
  process.exit(0);
}

// ---- render por cena -> ffmpeg via pipe (um MP4 sem áudio por cena) ------------------------
const STEP = 60 / PF.fps; // índices de quadro sempre na base 60 (t = n/60)
const align = (n) => Math.round(n / STEP) * STEP;
// cortes: um pouco antes de cada fala (L2..L5) — dentro das transições, que são contínuas
// o último corte arredonda PARA CIMA: o vídeo nunca fica mais curto que o áudio (o -t final apara o excesso)
const cuts = [0, ...TL.lines.slice(1).map((l) => align((l.start - 0.5) * 60)), Math.ceil(TOTAL_FRAMES / STEP) * STEP];
const segs = cuts.slice(0, -1).map((a, i) => ({ id: i + 1, f0: a, f1: cuts[i + 1] - STEP })); // inclusivo

const sha = (...parts) => { const h = createHash("sha256"); for (const p of parts) h.update(p); return h.digest("hex").slice(0, 16); };
const filesIn = (dir) => readdirSync(join(ROOT, dir)).filter((f) => !f.startsWith(".")).sort().map((f) => readFileSync(join(ROOT, dir, f)));
const codeHash = sha(...filesIn("scene"), ...filesIn("assets"));
const tlHash = sha(readFileSync(join(ROOT, "timeline.json")));

const segDir = join(ROOT, "out", "segments", `${QUALITY}_${FORMAT}`);
mkdirSync(segDir, { recursive: true });
const t0 = process.hrtime.bigint(); // só para ETA no terminal; não afeta a animação
let doneFrames = 0;
const todo = [];
for (const sg of segs) {
  const file = join(segDir, `cena_${sg.id}.mp4`), meta = join(segDir, `cena_${sg.id}.json`);
  const rangeKey = sha(JSON.stringify([sg, PF, tlHash]));
  const fullKey = sha(rangeKey, codeHash);
  const prev = existsSync(meta) && existsSync(file) ? JSON.parse(readFileSync(meta, "utf8")) : null;
  let redo;
  if (FORCE || !prev || prev.rangeKey !== rangeKey) redo = true;
  else if (SCENES) redo = SCENES.includes(sg.id);
  else redo = prev.fullKey !== fullKey;
  if (!redo && prev.fullKey !== fullKey) console.log(`[cena ${sg.id}] mantida (código mudou, mas não está em --scenes)`);
  else if (!redo) console.log(`[cena ${sg.id}] sem mudanças — reaproveitada`);
  if (redo) todo.push({ ...sg, file, meta, rangeKey, fullKey, frames: (sg.f1 - sg.f0) / STEP + 1 });
}
const totalTodo = todo.reduce((a, s) => a + s.frames, 0);
for (const sg of todo) {
  console.log(`[cena ${sg.id}] renderizando quadros ${sg.f0}–${sg.f1} (${sg.frames} quadros @${PF.fps}fps)`);
  const ff = spawn("ffmpeg", ["-y", "-v", "error",
    "-framerate", String(PF.fps), "-f", "image2pipe", "-c:v", "png", "-i", "-",
    "-c:v", "libx264", "-preset", PF.preset, "-crf", String(PF.crf), "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", PF.level,
    "-r", String(PF.fps), "-an", sg.file], { stdio: ["pipe", "inherit", "inherit"] });
  const ffDone = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg saiu com código " + c)))));
  const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));
  for (let n = sg.f0; n <= sg.f1; n += STEP) {
    await write(await grab(n));
    doneFrames++;
    if (doneFrames % 30 === 0 || n === sg.f1) {
      const el = Number(process.hrtime.bigint() - t0) / 1e9;
      process.stdout.write(`\r[render] ${doneFrames}/${totalTodo} quadros | ${(doneFrames / el).toFixed(2)} q/s | faltam ~${Math.round(((totalTodo - doneFrames) * el) / doneFrames / 60)} min   `);
    }
  }
  ff.stdin.end();
  await ffDone;
  writeFileSync(sg.meta, JSON.stringify({ rangeKey: sg.rangeKey, fullKey: sg.fullKey, f0: sg.f0, f1: sg.f1 }));
  process.stdout.write("\n");
}
await browser.close(); server.close();

// ---- emenda as cenas (sem recodificar o vídeo) + áudio -----------------------------------
const list = join(segDir, "lista.txt");
writeFileSync(list, segs.map((sg) => `file '${join(segDir, `cena_${sg.id}.mp4`)}'`).join("\n") + "\n");
const out = join(ROOT, "out", FORMAT === "9x16" ? PF.out : PF.out.replace(".mp4", `_${FORMAT}.mp4`));
const dur = (TOTAL_FRAMES / 60).toFixed(6);
await new Promise((res, rej) => spawn("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-i", MIX,
  "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", dur, "-movflags", "+faststart", out],
  { stdio: "inherit" }).on("close", (c) => (c === 0 ? res() : rej(new Error("concat falhou: " + c)))));
console.log(`[render] pronto: ${out}`);
