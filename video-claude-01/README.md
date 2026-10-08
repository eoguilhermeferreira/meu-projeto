# video-claude-01 — Reel NODEX: Claude vs Claude Code

Vídeo vertical 9:16, 60 fps, renderizado de forma **determinística**: a cena inteira é `renderFrame(n)` com `t = n/60`
(Three.js + tipografia DOM), capturada pelo Chrome headless (Puppeteer) e enviada por pipe ao ffmpeg.

## Requisitos
Node 18+, ffmpeg/ffprobe, Chrome/Chromium (detectado automaticamente ou `--chrome /caminho` / `CHROME_PATH`).
```bash
npm install
```

## Comandos
```bash
npm run audio                        # gera audio/L1..L5.mp3, timeline.json, música (se faltar) e audio/mix.wav
node scripts/gen-audio.mjs --force   # regera as falas (o TTS varia entre execuções, por isso há cache)
node render.mjs --test               # quadros 0, 600, 1200 e o último -> test-frames/
node render.mjs --quality preview    # out/claude-01_preview.mp4   (1080x1920)
node render.mjs --quality final      # out/claude-01_final_4k.mp4  (2160x3840, deviceScaleFactor 2)
# extras: --format 16x9 | --frames 0-600 (trecho) | --stills 0,300,900 (quadros avulsos p/ revisão)
```

## Trocar a narração
1. Edite o texto em `LINES` no topo de `scripts/gen-audio.mjs`.
2. `node scripts/gen-audio.mjs --force` → recalcula `timeline.json` (durações via ffprobe, 0,4 s de respiro, 0,25 s entre linhas, +1,2 s no fim).
3. As cenas leem os tempos do `timeline.json` (inclusive palavra a palavra). Se trocar palavras-chave
   (ex.: "escreve", "metade"), ajuste `buildKeys()` em `scene/main.js`, que procura essas palavras.
Para usar suas próprias gravações: salve `audio/L1.mp3 … L5.mp3` e rode `npm run audio` (sem `--force`).

## Trocar cores e o @ do CTA
No topo de `scene/main.js`:
```js
export const HANDLE = "@ARROBA_DA_NODEX";
export const PALETTE = { bg0, bg1, wine0, wine1, wine2, text, muted };
```
## Logo da NODEX / música
- Coloque `assets/nodex-logo.svg` (ou `.png`) — o CTA passa a usar o arquivo no lugar do texto.
- Coloque `assets/musica.mp3` e rode `npm run audio` — o mix (ducking + -14 LUFS) é refeito.

## Layout
`scene/layouts.js` → `LAYOUTS["9x16"]` (completo) e `LAYOUTS["16x9"]` (derivado, sem refinamento).
Unidade `u` = 1% do menor lado da tela; posições relativas ao centro da zona segura do Reels.

## GPU
O script tenta GPU (`--enable-gpu --ignore-gpu-blocklist --use-angle=default`) e só cai para SwiftShader
(`--enable-unsafe-swiftshader`) se não houver WebGL. Em software, o render é lento — prefira rodar o final numa máquina com GPU.
