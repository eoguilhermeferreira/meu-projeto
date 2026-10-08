// Pipeline: página HTML local -> Chrome headless (Puppeteer) -> captura quadro a quadro -> pipe -> ffmpeg -> MP4
// Uso:
//   node render.mjs --test                      (quadros 0, 600, 1200 e o último em test-frames/)
//   node render.mjs --quality preview           (1080x1920)
//   node render.mjs --quality final             (2160x3840: mesmo viewport, deviceScaleFactor 2)
//   opções: --format 9x16|16x9   --frames 0-300 (trecho, p/ depuração)   --chrome /caminho/do/chrome
import http from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
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
const FRAMES = opt("frames", null);
if (!["preview", "final"].includes(QUALITY)) throw new Error("--quality deve ser preview ou final");

const LY = resolveLayout(FORMAT);
const DSF = QUALITY === "final" ? 2 : 1;
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
const URL_ = `http://127.0.0.1:${server.address().port}/scene/index.html?format=${FORMAT}`;

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
  console.warn(`\n${bar}\n!!  ATENÇÃO: renderização por SOFTWARE (${info.renderer}).\n!!  Vai funcionar, mas é LENTA. Recomendo usar só --quality preview nesta máquina\n!!  e rodar o --quality final num computador com GPU.\n${bar}\n`);
}
if (!info.nodexLogo) console.warn("[assets] assets/nodex-logo.svg|png não encontrada -> CTA usa \"NODEX\" em tipografia.");
console.log(`[render] formato ${FORMAT} | ${OUT_W}x${OUT_H} | ${TOTAL_FRAMES} quadros @60fps (${TL.total}s)`);

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
    const f = join(dir, `frame_${String(n).padStart(4, "0")}${QUALITY === "final" ? "_4k" : ""}.png`);
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

// ---- render completo -> ffmpeg via pipe ---------------------------------------------
let [f0, f1] = [0, TOTAL_FRAMES - 1];
if (FRAMES) [f0, f1] = FRAMES.split("-").map(Number);
mkdirSync(join(ROOT, "out"), { recursive: true });
const out = join(ROOT, "out", FRAMES ? `claude-01_${QUALITY}_${f0}-${f1}.mp4` : QUALITY === "final" ? "claude-01_final_4k.mp4" : "claude-01_preview.mp4");
const frames = f1 - f0 + 1;
const dur = (frames / 60).toFixed(6);
const ff = spawn("ffmpeg", ["-y", "-v", "error", "-stats",
  "-framerate", "60", "-f", "image2pipe", "-c:v", "png", "-i", "-",
  "-ss", (f0 / 60).toFixed(6), "-t", dur, "-i", MIX,
  "-map", "0:v", "-map", "1:a",
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", QUALITY === "final" ? "5.2" : "4.2",
  "-r", "60", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-t", dur, "-movflags", "+faststart", out], { stdio: ["pipe", "inherit", "inherit"] });
const ffDone = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error("ffmpeg saiu com código " + c)))));
const write = (buf) => new Promise((res) => (ff.stdin.write(buf) ? res() : ff.stdin.once("drain", res)));

const t0 = process.hrtime.bigint(); // só para ETA no terminal; não afeta a animação
for (let n = f0; n <= f1; n++) {
  await write(await grab(n));
  if ((n - f0) % 60 === 0 || n === f1) {
    const el = Number(process.hrtime.bigint() - t0) / 1e9, done = n - f0 + 1;
    process.stdout.write(`\r[render] ${done}/${frames} quadros | ${(done / el).toFixed(2)} q/s | ETA ${Math.round(((frames - done) * el) / done)}s   `);
  }
}
ff.stdin.end();
await ffDone;
await browser.close(); server.close();
console.log(`\n[render] pronto: ${out}`);
