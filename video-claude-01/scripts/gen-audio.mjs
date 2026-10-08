// Gera narração (L1..L5), timeline.json, trilha (fallback determinística) e mix final.
// Uso: node scripts/gen-audio.mjs [--force]   (--force regera as falas)
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO = join(ROOT, "audio");
const ASSETS = join(ROOT, "assets");
mkdirSync(AUDIO, { recursive: true });

// ---- Roteiro (texto exato) -------------------------------------------------
export const LINES = [
  { id: "L1", text: "Você usa o Claude só pra conversar? Então tá usando metade dele." },
  { id: "L2", text: "O Claude é a inteligência artificial da Anthropic. No chat, ele escreve, analisa arquivos, pesquisa e cria documentos com você." },
  { id: "L3", text: "Já o Claude Code é o Claude trabalhando direto no computador: ele lê o seu projeto, escreve o código, roda os comandos e testa até funcionar." },
  { id: "L4", text: "Chat pra pensar junto. Claude Code pra colocar a mão na massa." },
  { id: "L5", text: "Segue a NODEX pra aprender a usar IA no seu negócio." },
];

const VOICE = "pt-BR-AntonioNeural";
const RATE = "+8%";
const LEAD_IN = 0.4, GAP = 0.25, TAIL = 1.2;
const SR = 48000;

const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: ["pipe", "pipe", "pipe"], ...opts }).toString();
const ffprobeDur = (f) => parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));

// ---- 1. Voz ------------------------------------------------------------------
function ttsEdge(text, out) {
  const r = spawnSync("edge-tts", ["--voice", VOICE, `--rate=${RATE}`, "--text", text, "--write-media", out], { stdio: "pipe", timeout: 60000 });
  return r.status === 0 && existsSync(out) && readFileSync(out).length > 1000;
}
function ttsPiper(text, out) {
  const bin = join(ROOT, "tools/piper/piper");
  const model = join(ROOT, "tools/piper-voice/pt-br-edresson-low.onnx");
  if (!existsSync(bin) || !existsSync(model)) throw new Error("Piper não encontrado em tools/ (veja README).");
  const wav = out.replace(/\.mp3$/, ".raw.wav");
  // rate +8%  ->  length_scale = 1/1.08 ; noise fixo p/ reduzir variação
  sh(bin, ["--model", model, "--length_scale", String(1 / 1.08), "--noise_scale", "0.5", "--noise_w", "0.6",
    "--sentence_silence", "0.12", "--output_file", wav], { input: text });
  // limpa silêncio das pontas, leve EQ de presença, resample 48k, mp3
  sh("ffmpeg", ["-y", "-v", "error", "-i", wav, "-af",
    "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse," +
    "highpass=f=70,equalizer=f=3000:t=q:w=1:g=2,aresample=48000:resampler=soxr",
    "-ar", String(SR), "-ac", "1", "-c:a", "libmp3lame", "-b:a", "192k", out]);
  return true;
}

let engine = null;
const FORCE = process.argv.includes("--force");
for (const l of LINES) {
  const out = join(AUDIO, `${l.id}.mp3`);
  // TTS neural não é bit-a-bit reprodutível: reaproveita o take existente (use --force p/ regerar)
  if (!FORCE && existsSync(out)) { console.log(`[audio] ${l.id} existente (reaproveitado)`); continue; }
  if (engine !== "piper" && ttsEdge(l.text, out)) { engine = "edge-tts"; }
  else { if (engine !== "piper") console.warn(`[audio] edge-tts falhou em ${l.id} -> usando Piper (pt_BR)`); ttsPiper(l.text, out); engine = "piper"; }
  console.log(`[audio] ${l.id} gerado (${engine})`);
}

// ---- 2. Timeline ---------------------------------------------------------------
let cursor = LEAD_IN;
const lines = LINES.map((l) => {
  const dur = ffprobeDur(join(AUDIO, `${l.id}.mp3`));
  const seg = { id: l.id, text: l.text, start: +cursor.toFixed(3), end: +(cursor + dur).toFixed(3), duration: +dur.toFixed(3) };
  cursor = seg.end + GAP;
  return seg;
});
// tempo por palavra: modelo proporcional por caractere, com cada pontuação interna
// encaixada na pausa real mais próxima (silencedetect). Usado p/ destacar palavras-chave.
function silences(file) {
  const err = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "silencedetect=n=-38dB:d=0.05", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const s = [...err.matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  const e = [...err.matchAll(/silence_end: ([\d.]+)/g)].map((m) => +m[1]);
  const out = [];
  s.forEach((a, i) => { const b = e[i] ?? a; const last = out.at(-1); if (last && a - last[1] < 0.08) last[1] = b; else out.push([a, b]); });
  return out.filter(([a, b]) => b - a >= 0.12);
}
function wordTimes(text, dur, sil) {
  const toks = [...text.matchAll(/\S+/g)].map((m) => ({ w: m[0], i: m.index }));
  const PAUSE = { ",": 7, ":": 9, ".": 10, "?": 10 };
  let acc = 0; const units = [];
  toks.forEach((t, k) => { units.push(acc); acc += t.w.length + 1; const p = PAUSE[t.w.at(-1)]; if (p && k < toks.length - 1) acc += p; });
  const scale = dur / acc;
  const est = units.map((u) => u * scale);
  // âncoras: [índice do token, tempo real de início]
  const anchors = [[0, 0]]; const used = new Set();
  toks.forEach((t, k) => {
    if (!PAUSE[t.w.at(-1)] || k === toks.length - 1) return;
    let best = -1, bd = 0.8;
    sil.forEach(([a, b], j) => { const d = Math.abs((a + b) / 2 - est[k + 1]); if (!used.has(j) && d < bd) { bd = d; best = j; } });
    if (best >= 0 && sil[best][1] > anchors.at(-1)[1]) { used.add(best); anchors.push([k + 1, sil[best][1]]); }
  });
  anchors.push([toks.length, dur]);
  const starts = [];
  for (let a = 0; a < anchors.length - 1; a++) {
    const [k0, t0] = anchors[a], [k1, t1] = anchors[a + 1];
    const u0 = units[k0], u1 = k1 < toks.length ? units[k1] : acc;
    for (let k = k0; k < k1; k++) starts[k] = t0 + ((units[k] - u0) / (u1 - u0 || 1)) * (t1 - t0);
  }
  return toks.map((t, k) => ({ w: t.w.replace(/[.,:?!]+$/, ""), start: +starts[k].toFixed(3), end: +(k + 1 < toks.length ? starts[k + 1] : dur).toFixed(3) }));
}
lines.forEach((l) => {
  const words = wordTimes(l.text, l.duration, silences(join(AUDIO, `${l.id}.mp3`)));
  l.words = words.map((w) => ({ ...w, start: +(w.start + l.start).toFixed(3), end: +(w.end + l.start).toFixed(3) }));
});
// total alinhado ao quadro (60 fps): vídeo e áudio com exatamente a mesma duração
const total = +(Math.ceil((lines.at(-1).end + TAIL) * 60) / 60).toFixed(6);
const timeline = { fps: 60, leadIn: LEAD_IN, gap: GAP, tail: TAIL, total, totalFrames: Math.round(total * 60), engine: engine ?? "cache", lines };
writeFileSync(join(ROOT, "timeline.json"), JSON.stringify(timeline, null, 2));
console.log(`[audio] timeline.json -> total ${total}s (${timeline.totalFrames} quadros)`);

// ---- 3. Trilha: usa assets/musica.mp3 se existir; senão gera pad determinístico --
const musicFile = join(ASSETS, "musica.mp3");
let musicGenerated = false;
if (!existsSync(musicFile)) {
  musicGenerated = true;
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // progressão escura em Ré menor: Dm - Bb - Gm - A(sus) (vozes graves)
  const chords = [[38, 50, 53, 57, 62], [34, 46, 50, 53, 58], [31, 43, 46, 50, 55], [33, 45, 50, 52, 57]];
  const seg = 8; // s por acorde (loop)
  const L = seg * chords.length;
  // janela raised-cosine com crossfade de 2s entre acordes, em loop
  const win = (i) => {
    const a = i * seg;
    return `(0.5-0.5*cos(2*PI*min(1,max(0,(mod(t,${L})-${a}+1)/2))))*(0.5+0.5*cos(PI*min(1,max(0,(mod(t,${L})-${a + seg - 1})/2))))`;
  };
  const voice = (f, k) => `(sin(2*PI*${f.toFixed(4)}*t)+0.35*sin(2*PI*${(f * 2.003).toFixed(4)}*t)+0.12*sin(2*PI*${(f * 3.01).toFixed(4)}*t))*(0.8+0.2*sin(2*PI*${(0.07 + k * 0.031).toFixed(3)}*t))`;
  const parts = chords.map((c, i) => `${win(i)}*(${c.map((m, k) => voice(midi(m), k)).join("+")})`);
  // primeiro acorde também precisa existir no fim do loop (wrap): janela extra deslocada
  const wrap = `(0.5-0.5*cos(2*PI*min(1,max(0,(mod(t,${L})-${L - 1})/2))))*(${chords[0].map((m, k) => voice(midi(m), k)).join("+")})`;
  // pulso sub (eletrônico) em 92 BPM, sidechain-like
  const pulse = `0.9*sin(2*PI*${midi(26).toFixed(4)}*t)*pow(1-mod(t*92/60,1),3)`;
  const expr = `0.045*(${parts.join("+")}+${wrap})+0.12*${pulse}`;
  const exprFile = join(AUDIO, "pad.expr");
  writeFileSync(exprFile, expr);
  const dur = Math.ceil(total + 2);
  sh("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `aevalsrc=exprs='${expr}|${expr.replace(/\*t\)/g, "*(t+0.013))")}':s=${SR}:d=${dur}`,
    "-af", "lowpass=f=900,lowpass=f=1400,aecho=0.8:0.6:180|310:0.25|0.18,volume=2.0,alimiter=limit=0.9",
    "-c:a", "libmp3lame", "-b:a", "192k", musicFile]);
  console.warn("[audio] ⚠ assets/musica.mp3 não encontrada para download -> pad ambiente gerado com ffmpeg (vale trocar por uma faixa melhor)");
}

// ---- 4. Mix: voz posicionada + música com ducking + fades + loudnorm -14 LUFS -----
const inputs = [];
lines.forEach((l) => inputs.push("-i", join(AUDIO, `${l.id}.mp3`)));
inputs.push("-stream_loop", "-1", "-i", musicFile);
const n = lines.length;
const fc = [
  ...lines.map((l, i) => `[${i}:a]aresample=${SR},pan=stereo|c0=c0|c1=c0,adelay=${Math.round(l.start * 1000)}|${Math.round(l.start * 1000)}[v${i}]`),
  `${lines.map((_, i) => `[v${i}]`).join("")}amix=inputs=${n}:normalize=0,apad,atrim=0:${total},asplit=2[voice][sc]`,
  `[${n}:a]aresample=${SR},aformat=channel_layouts=stereo,atrim=0:${total},volume=0.55[mus]`,
  `[mus][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350:makeup=1[duck]`,
  `[voice][duck]amix=inputs=2:normalize=0,afade=t=in:st=0:d=0.5,afade=t=out:st=${(total - 1).toFixed(3)}:d=1,atrim=0:${total}[pre]`,
];
const premix = join(AUDIO, "premix.wav");
sh("ffmpeg", ["-y", "-v", "error", ...inputs, "-filter_complex", fc.join(";"), "-map", "[pre]", "-ar", String(SR), "-c:a", "pcm_s16le", premix]);

// loudnorm em 2 passadas (mais preciso)
const meas = spawnSync("ffmpeg", ["-hide_banner", "-i", premix, "-af", "loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const m = JSON.parse(meas.slice(meas.lastIndexOf("{"), meas.lastIndexOf("}") + 1));
const ln = `loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const mix = join(AUDIO, "mix.wav");
sh("ffmpeg", ["-y", "-v", "error", "-i", premix, "-af", `${ln},aresample=${SR},asetpts=N/SR/TB,apad,atrim=end_sample=${Math.round(total * SR)}`, "-ar", String(SR), "-c:a", "pcm_s16le", mix]);
const chk = spawnSync("ffmpeg", ["-hide_banner", "-i", mix, "-af", "loudnorm=I=-14:print_format=json", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const c = JSON.parse(chk.slice(chk.lastIndexOf("{"), chk.lastIndexOf("}") + 1));
console.log(`[audio] mix.wav -> ${ffprobeDur(mix).toFixed(3)}s, ${c.input_i} LUFS, TP ${c.input_tp} dBTP`);
console.log(`[audio] engine=${engine ?? "cache"} musicaGerada=${musicGenerated}`);
