# Fontes dos arquivos

| Arquivo | Origem | Licença / observação |
|---|---|---|
| `claude-logo.svg` | https://claude.com/favicon.svg (servido pelo site oficial claude.com) — baixado em 2026-10-08, sem edição (sha256 `b150888b…6697350`) | Marca registrada da Anthropic. Não é arquivo de licença livre: uso nominativo/editorial, sem alterar cores ou proporções. O kit oficial de imprensa (`anthropic.com/press-kit` → `www-cdn.anthropic.com/…zip`) foi encontrado, mas o domínio de download está bloqueado pela rede deste ambiente. |
| `nodex-logo-original.png` | Fornecido pelo cliente (NODEX) | Arquivo original, sem alteração. |
| `nodex-logo.png` | Versão branca (para fundo escuro) fornecida pelo cliente (NODEX) | Arquivo original, sem alteração — usada no CTA. |
| `mascote.png` | **Não baixado** | Nenhum arquivo oficial acessível: `assets.claude.com` e `www-cdn.anthropic.com` bloqueados pela rede deste ambiente. Mascote omitido (nada foi desenhado/recriado). |
| `musica.mp3` | **Gerado localmente** com ffmpeg (`aevalsrc`, pad em Ré menor + pulso sub, passa-baixa) por `scripts/gen-audio.mjs` | Original, sem restrição. Pixabay, Mixkit, FreePD, Chosic, Uppbeat e OpenGameArt bloqueados pela rede deste ambiente. **Vale trocar por uma faixa melhor.** |

## Áudio de narração (`audio/L1..L5.mp3`)
- edge-tts (`pt-BR-AntonioNeural`) falhou: `speech.platform.bing.com` bloqueado pela rede.
- Usado **Piper** 2023.11.14-2 — https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz (MIT)
- Voz `pt-br-edresson-low` — https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-pt-br-edresson-low.tar.gz
  - Dataset: TTS-Portuguese-Corpus (Edresson Casanova), **CC BY 4.0** → por cautela, credite: "Voz sintética: Piper / TTS-Portuguese-Corpus (CC BY 4.0)".

## Fontes tipográficas e bibliotecas (npm, servidas localmente)
- `@fontsource/inter-tight`, `@fontsource/jetbrains-mono` — SIL Open Font License 1.1
- `three` (MIT), `puppeteer-core` (Apache-2.0)
