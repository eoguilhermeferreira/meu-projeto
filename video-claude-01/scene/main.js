// Cena do Reel. TODA a imagem é função pura de n: renderFrame(n) com t = n / 60.
// Proibido aqui: Date, performance.now, rAF como relógio, CSS animations/transitions, setTimeout, Math.random.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { resolveLayout, WORLD_PER_U as U } from "./layouts.js";
import { mulberry32, hash01, noise1, prog, clamp01, lerp, Track, bump, easeInOutCubic, easeOutCubic, easeInCubic, easeOutBack, easeOutBackStrong, easeOutElastic, easeOutQuint, linear } from "./util.js";
import { Slab, N, roundedRectPoly, bubblePoly, clipX, polar, circle } from "./shapes.js";
import { cardTexture, logoTexture, glowTexture, dotTexture, TerminalScreen } from "./textures.js";

// ================== CONFIGURAÇÃO EDITÁVEL ==================
export const HANDLE = "@agencynodex"; // <- @ do CTA ("Siga @...")
export const PALETTE = {
  bg0: "#0A0A0B", bg1: "#120709",
  wine0: "#5C0F1F", wine1: "#7A1428", wine2: "#A3213A",
  text: "#F2EDEE", muted: "#8A7F82",
};
const SEED = 2026;
const FPS = 60;
// ===========================================================

const qs = new URLSearchParams(location.search);
const LITE = qs.get("lite") === "1"; // preview leve: sem bloom e sem antialias
const LY = resolveLayout(qs.get("format") || "9x16");
const VW = LY.viewport.width, VH = LY.viewport.height;
const P = PALETTE;

let TL, K, renderer, composer, scene, camera, content, bloom;
const O = {}; // objetos 3D
const D = {}; // elementos DOM

// ---------------------------------------------------------------- tempo (a partir do timeline.json)
function buildKeys() {
  const L = (id) => TL.lines.find((l) => l.id === id);
  const W = (id, w, occ = 0) => {
    const hits = L(id).words.filter((x) => x.w.toLowerCase() === w.toLowerCase());
    if (!hits[occ]) throw new Error(`palavra não achada no timeline: ${id}/${w}`);
    return hits[occ].start;
  };
  const l = Object.fromEntries(TL.lines.map((x) => [x.id, x]));
  K = {
    total: TL.total, L: l, W,
    l1: l.L1.start, l2: l.L2.start, l3: l.L3.start, l4: l.L4.start, l5: l.L5.start,
    s1Words: { voce: W("L1", "Você"), usa: W("L1", "usa"), o: W("L1", "o"), claude: W("L1", "Claude"), so: W("L1", "só"), pra: W("L1", "pra"), conversar: W("L1", "conversar"), entao: W("L1", "Então"), dele: W("L1", "dele") },
    split: W("L1", "metade"),
    claude2: W("L2", "Claude"), ia: W("L2", "inteligência"), artificial: W("L2", "artificial"), anthropic: W("L2", "Anthropic"),
    chat: W("L2", "chat"),
    cards: [W("L2", "escreve"), W("L2", "analisa"), W("L2", "pesquisa"), W("L2", "cria")],
    cc: W("L3", "Claude"), code: W("L3", "Code"), direto: W("L3", "direto"), no3: W("L3", "no"), computador: W("L3", "computador"),
    steps: [W("L3", "lê"), W("L3", "escreve"), W("L3", "roda"), W("L3", "testa")],
    funcionar: W("L3", "funcionar"),
    chat4: W("L4", "Chat"), pensar: W("L4", "pensar"), junto: W("L4", "junto"), cc4: W("L4", "Claude"),
    mao: W("L4", "mão"), na: W("L4", "na"), massa: W("L4", "massa"),
    segue: W("L5", "Segue"), nodex: W("L5", "NODEX"),
    s5sub: ["aprender", "a", "usar", "IA", "no", "seu", "negócio"].map((w, i) => W("L5", w, w === "a" ? 1 : 0)),
  };
  K.termStart = K.l3 + 1.0; // troca cartões -> terminal
  K.swap = K.l3 + 1.0;
}

// ---------------------------------------------------------------- 3D
function mat(opts) {
  return new THREE.MeshPhysicalMaterial({
    color: P.wine1, roughness: 0.2, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.08,
    transmission: 0.45, thickness: 2.2, ior: 1.45, attenuationColor: new THREE.Color(P.wine0), attenuationDistance: 0.6,
    sheen: 0.25, sheenColor: new THREE.Color(P.wine2), sheenRoughness: 0.5,
    emissive: new THREE.Color(P.wine0), emissiveIntensity: 0.3, envMapIntensity: 0.18,
    transparent: true, side: THREE.FrontSide, ...opts,
  });
}

function build3D(logoImg) {
  const canvas = document.getElementById("gl");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !LITE, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(VW, VH, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(P.bg0, 1);

  scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  camera = new THREE.PerspectiveCamera(LY.fov, VW / VH, 0.1, 400);
  // o alvo da câmera aparece no centro da ZONA SEGURA (não no centro da tela)
  camera.setViewOffset(VW, VH, -LY.focus.x * LY.pxPerU, LY.focus.y * LY.pxPerU, VW, VH);
  scene.add(camera);

  // fundo: gradiente radial + brilho vinho, preso à câmera
  const bgH = 2 * 120 * Math.tan((LY.fov * Math.PI) / 360) * 1.05;
  O.bg = new THREE.Mesh(new THREE.PlaneGeometry(bgH * (VW / VH), bgH), new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: { uGlow: { value: new THREE.Vector2(0.5, 0.55) }, uInt: { value: 0.6 }, uAspect: { value: VW / VH },
      c0: { value: new THREE.Color(P.bg0) }, c1: { value: new THREE.Color(P.bg1) }, cw: { value: new THREE.Color(P.wine0) } },
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: `varying vec2 vUv; uniform vec2 uGlow; uniform float uInt, uAspect; uniform vec3 c0, c1, cw;
      void main(){ vec2 d = vUv - uGlow; d.x *= uAspect; float r = length(d);
        vec3 col = mix(c1, c0, smoothstep(0.0, 0.9, length((vUv-0.5)*vec2(uAspect,1.0))));
        col += cw * uInt * exp(-r*r*7.0) * 0.9;
        gl_FragColor = vec4(col, 1.0); }`,
  }));
  O.bg.position.z = -120; O.bg.renderOrder = -10;
  camera.add(O.bg);

  // luzes: principal vinho, rim suave, preenchimento baixo
  const key = new THREE.DirectionalLight(P.wine2, 3.8); key.position.set(-6, 8, 9); scene.add(key);
  const rim = new THREE.DirectionalLight("#ffe3e8", 3.2); rim.position.set(7, 4, -9); scene.add(rim);
  const rim2 = new THREE.DirectionalLight("#ff9fb0", 1.2); rim2.position.set(-8, -3, -6); scene.add(rim2);
  scene.add(new THREE.HemisphereLight("#3a0d18", "#050304", 0.6));
  O.pl = new THREE.PointLight(P.wine2, 18, 30, 1.6); scene.add(O.pl);

  content = new THREE.Group();
  content.position.set(0, 0, 0); // origem do mundo = foco (centro da zona segura)
  scene.add(content);

  const s1 = LY.s1.bubble, s2 = LY.s2, s3 = LY.s3, s4 = LY.s4;

  // --- formas (em unidades de mundo)
  const bub = bubblePoly(s1.w, s1.h, s1.r, s1.tw, s1.th);
  O.cL = [-s1.w / 4, -1.5]; O.cR = [s1.w / 4, 0];
  const SH = {
    bubL: polar(clipX(bub, true), O.cL[0], O.cL[1], N, U),
    bubR: polar(clipX(bub, false), O.cR[0], O.cR[1], N, U),
    disc: circle(s2.disc.R, N, U),
    bub4: polar(bubblePoly(s4.bubble.w, s4.bubble.h, s4.bubble.r, s4.bubble.tw, s4.bubble.th), 0, 0, N, U),
    dot: circle(1.2, N, U),
    card: polar(roundedRectPoly(s2.card.w, s2.card.h, s2.card.r), 0, 0, N, U),
    term: polar(roundedRectPoly(s3.term.w, s3.term.h, s3.term.r), 0, 0, N, U),
  };
  const tw = s3.term.w, th = s3.term.h, tr = s3.term.r, e = 0.15;
  SH.quads = [
    { c: [-tw / 4, th / 4], o: polar(roundedRectPoly(tw / 2, th / 2, [tr, e, e, e]), 0, 0, N, U) },
    { c: [tw / 4, th / 4], o: polar(roundedRectPoly(tw / 2, th / 2, [e, tr, e, e]), 0, 0, N, U) },
    { c: [-tw / 4, -th / 4], o: polar(roundedRectPoly(tw / 2, th / 2, [e, e, e, tr]), 0, 0, N, U) },
    { c: [tw / 4, -th / 4], o: polar(roundedRectPoly(tw / 2, th / 2, [e, e, tr, e]), 0, 0, N, U) },
  ];
  O.SH = SH;

  // --- rig do balão (cena 1)
  O.rig = new THREE.Group(); content.add(O.rig);
  O.A = new Slab(mat()); O.B = new Slab(mat()); O.full = new Slab(mat());
  O.rig.add(O.A, O.B, O.full);
  O.full.setOutline(polar(bub, 0, 0, N, U), s1.depth * U, s1.bevel * U);

  // pontinhos "digitando" no balão
  const dotMat = new THREE.MeshStandardMaterial({ color: P.text, emissive: new THREE.Color(P.text), emissiveIntensity: 0.6, roughness: 0.3, transparent: true });
  const mkDots = (r, gap) => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(r * U, 24, 16), dotMat.clone()); m.position.x = (i - 1) * gap * U; g.add(m); } return g; };
  O.dots1 = mkDots(2.1, 7.5); O.dots1.position.set(0, 1 * U, (s1.depth / 2 + 1.2) * U); O.rig.add(O.dots1);
  O.dots4 = mkDots(1.8, 6.2); O.dots4.position.set(0, 0.5 * U, (s2.disc.depth / 2 + 1) * U); O.A.add(O.dots4);

  // risco de luz do corte
  O.cut = new THREE.Mesh(new THREE.PlaneGeometry(0.5 * U, (s1.h + 16) * U), new THREE.MeshBasicMaterial({ color: "#ffd5dc", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  O.cut.position.set(0, 0, (s1.depth / 2 + 0.5) * U); O.rig.add(O.cut);

  // logo oficial do Claude (arquivo plano, cores originais) + brilho
  const ls = LY.s2.logo.size * U;
  O.logo = new THREE.Mesh(new THREE.PlaneGeometry(ls, ls), new THREE.MeshBasicMaterial({ map: logoTexture(logoImg), transparent: true, toneMapped: false, depthWrite: false }));
  O.logo.position.z = (s2.disc.depth / 2 + 0.25) * U; O.A.add(O.logo);
  O.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,214,222,0.9)", "rgba(163,33,58,0.5)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  O.glow.position.z = -1 * U; O.A.add(O.glow);

  // cartões
  const labels = [["escreve", "pen"], ["analisa arquivos", "files"], ["pesquisa", "search"], ["cria documentos", "newdoc"]];
  O.cards = labels.map(([label, kind]) => {
    const s = new Slab(mat({ color: P.wine1, transmission: 0, emissiveIntensity: 0.25, envMapIntensity: 0.05, clearcoat: 0, roughness: 0.55, sheen: 0, specularIntensity: 0.3 }));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(s2.card.w * 0.92 * U, s2.card.h * 0.92 * U), new THREE.MeshBasicMaterial({ map: cardTexture(label, kind, P), transparent: true, toneMapped: false, depthWrite: false }));
    face.position.z = (s2.card.depth / 2 + 0.12) * U; s.add(face); s.face = face;
    content.add(s); return s;
  });

  // terminal
  O.term = new THREE.Group(); content.add(O.term);
  O.termSlab = new Slab(new THREE.MeshPhysicalMaterial({ color: "#1a0b10", roughness: 0.32, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.12, emissive: new THREE.Color(P.wine0), emissiveIntensity: 0.25, envMapIntensity: 0.6, transparent: true }));
  O.term.add(O.termSlab);
  O.termSlab.setOutline(SH.term, s3.term.depth * U, s3.term.bevel * U);
  O.screen = new TerminalScreen(P, K, (tw - 2.4) / (th - 2.4));
  O.screenMesh = new THREE.Mesh(new THREE.PlaneGeometry((tw - 2.4) * U, (th - 2.4) * U), new THREE.MeshBasicMaterial({ map: O.screen.tex, transparent: true, toneMapped: false }));
  O.screenMesh.position.z = (s3.term.depth / 2 + 0.06) * U; O.term.add(O.screenMesh);

  // ponto de luz (CTA)
  O.light = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,240,242,1)", "rgba(163,33,58,0.75)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  content.add(O.light);

  // partículas (PRNG semente fixa)
  const rnd = mulberry32(SEED);
  const NP = 520;
  O.pBase = new Float32Array(NP * 3); O.pPh = new Float32Array(NP * 3);
  for (let i = 0; i < NP; i++) {
    O.pBase[i * 3] = (rnd() - 0.5) * LY.visW * 1.6 * U; O.pBase[i * 3 + 1] = (rnd() - 0.5) * LY.visH * 1.4 * U; O.pBase[i * 3 + 2] = (-rnd() * 160 + 30) * U;
    O.pPh[i * 3] = rnd() * 6.283; O.pPh[i * 3 + 1] = rnd() * 6.283; O.pPh[i * 3 + 2] = 0.3 + rnd();
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NP * 3), 3));
  O.parts = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.09, map: dotTexture(), color: "#ffc9d3", transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  scene.add(O.parts);

  // pós: bloom leve; vinheta + grão ficam na camada DOM (cobrem também a tipografia)
  const rt = new THREE.WebGLRenderTarget(VW * window.devicePixelRatio, VH * window.devicePixelRatio, { type: THREE.HalfFloatType, samples: LITE ? 0 : 4 });
  composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(window.devicePixelRatio);
  composer.setSize(VW, VH);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(VW, VH), 0.32, 0.55, 0.82);
  if (!LITE) composer.addPass(bloom);
  composer.addPass(new OutputPass());

  buildTracks();
}

function buildTracks() {
  const s1 = LY.s1.bubble, s2 = LY.s2, s3 = LY.s3, s4 = LY.s4, s5 = LY.s5;
  const SH = O.SH;
  const bx = s1.x, by = s1.y;
  const rel = (x, y) => [x - bx, y - by]; // posição relativa ao rig
  const { l1, l2, l3, l4, l5, split } = K;
  const enterEnd = l1 + 1.25;
  O.T = {
    rigPos: new Track([[0, [bx, by, -300]], [enterEnd, [bx, by, 0], easeOutQuint]]),
    rigRot: new Track([[0, [0.5, -6.2, 0.6]], [enterEnd + 0.2, [0, 0, 0], easeOutCubic]]),
    aPos: new Track([
      [split, [...O.cL, 0]], [split + 0.45, [O.cL[0] - 2.2, O.cL[1], 0], easeOutCubic],
      [l2 - 0.35, [O.cL[0] - 2.2, O.cL[1], 0]], [l2 + 0.7, [...rel(s2.disc.x, s2.disc.y), 0]],
      [l3 - 0.3, [...rel(s2.disc.x, s2.disc.y), 0]], [l3 + 0.9, [...rel(s2.disc.x, s2.disc.y + 8), -140]],
      [l4 - 0.4, [...rel(s2.disc.x, s2.disc.y + 8), -140]], [l4 + 0.6, [...rel(s4.bubble.x, s4.bubble.y), 0]],
      [l5 - 0.45, [...rel(s4.bubble.x, s4.bubble.y), 0]], [l5 + 0.35, [...rel(s5.light.x, s5.light.y), 0], easeInCubic],
    ]),
    aRot: new Track([
      [split, [0, 0, 0]], [split + 0.45, [0, -0.28, 0.05], easeOutCubic],
      [l2 - 0.35, [0, -0.28, 0.05]], [l2 + 0.7, [0, 0, 0]],
      [l4 - 0.4, [0, 0, 0]], [l4 + 0.6, [0.08, -0.22, 0.03]], [l5 - 0.45, [0.04, -0.12, 0]], [l5 + 0.35, [0.5, 2.0, 0.4], easeInCubic],
    ]),
    aScale: new Track([[l5 - 0.45, 1], [l5 + 0.35, 0.001, easeInCubic]]),
    aOutline: new Track([
      [l2 - 0.35, SH.bubL], [l2 + 0.65, SH.disc],
      [l4 - 0.35, SH.disc], [l4 + 0.6, SH.bub4],
      [l5 - 0.45, SH.bub4], [l5 + 0.2, SH.dot],
    ]),
    aDepth: new Track([[l2 - 0.35, s1.depth], [l2 + 0.65, s2.disc.depth]]),
    aOpacity: new Track([[l3 - 0.3, 1], [l3 + 0.7, 0], [l4 - 0.4, 0], [l4 + 0.3, 1]]),
    bPos: new Track([[split, [...O.cR, 0]], [split + 0.9, [O.cR[0] + 16, O.cR[1] - 7, -30], easeOutCubic]]),
    bRot: new Track([[split, [0, 0, 0]], [split + 0.9, [0.2, 0.9, -0.35], easeOutCubic]]),
    bOpacity: new Track([[split + 0.08, 1], [split + 0.75, 0, easeInOutCubic]]),
    logoOp: new Track([[K.claude2 - 0.2, 0], [K.claude2 + 0.35, 1], [l3 - 0.2, 1], [l3 + 0.6, 0]]),
    logoScale: new Track([[K.claude2 - 0.2, 0.55], [K.claude2 + 0.55, 1, easeOutBackStrong]]),
    termPos: new Track([
      [l4 - 0.35, [s3.term.x, s3.term.y, 0]], [l4 + 0.6, [s4.term.x, s4.term.y, 0]],
      [l5 - 0.45, [s4.term.x, s4.term.y, 0]], [l5 + 0.35, [s5.light.x, s5.light.y, 0], easeInCubic],
    ]),
    termRot: new Track([
      [K.swap, [-0.34, 0.62, 0.06]], [K.steps[0] + 0.25, [-0.03, 0.04, 0]],
      [l4 - 0.35, [-0.02, -0.03, 0]], [l4 + 0.6, [0.1, 0.24, -0.02]],
      [l5 - 0.45, [0.06, 0.12, 0]], [l5 + 0.35, [0.4, -1.4, -0.5], easeInCubic],
    ]),
    termScale: new Track([[l4 - 0.35, 1], [l4 + 0.6, s4.term.scale], [l5 - 0.45, s4.term.scale], [l5 + 0.35, 0.001, easeInCubic]]),
    screenOp: new Track([[K.swap, 0], [K.swap + 0.35, 1]]),
    orbitPhase: new Track([
      [K.chat, 0.9], [K.cards[0] - 0.15, 0.9], [K.cards[0] + 0.45, 0, easeOutBack],
      [K.cards[1] - 0.15, 0], [K.cards[1] + 0.45, -Math.PI / 2, easeOutBack],
      [K.cards[2] - 0.15, -Math.PI / 2], [K.cards[2] + 0.45, -Math.PI, easeOutBack],
      [K.cards[3] - 0.15, -Math.PI], [K.cards[3] + 0.45, -1.5 * Math.PI, easeOutBack],
    ]),
    // câmera: azimute, elevação, distância (x camDist), alvo (u)
    cam: new Track([
      [0, [0.0, 0.06, 1.3, 0, 4]],
      [enterEnd, [0.06, 0.04, 1.08, 0, 2], easeOutCubic],
      [split, [0.0, 0.02, 0.97, 0, 1]], // push-in
      [l2 + 0.6, [-0.24, 0.1, 1.0, 0, 0]],
      [l3 - 0.2, [0.26, 0.05, 1.0, 0, 0], linear], // órbita lenta
      [K.swap, [0.46, 0.18, 0.95, 3, 0]],
      [K.steps[0] + 0.25, [0.0, 0.02, 0.93, 0, 0]], // dolly até ficar de frente
      [l4 - 0.3, [-0.03, 0.0, 0.91, 0, 0], linear],
      [l4 + 0.8, [0.0, 0.04, 1.0, 0, 0]],
      [l5 - 0.3, [0.03, 0.02, 0.97, 0, 0], linear],
      [l5 + 1.0, [0.0, 0.0, 0.55, s5.light.x, s5.light.y]], // push-in na luz
      [K.total, [0.0, 0.0, 0.5, s5.light.x, s5.light.y], linear],
    ]),
  };
}

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

function update3D(t, n) {
  const T = O.T, s1 = LY.s1.bubble, s2 = LY.s2, s3 = LY.s3, s5 = LY.s5;
  const { l2, l3, l4, l5, split } = K;

  // câmera
  const [az, el, rr, tx, ty] = T.cam.at(t);
  const wob = 0.012;
  const target = new THREE.Vector3(tx * U + noise1(t * 0.35, 1) * wob, ty * U + noise1(t * 0.3, 2) * wob, 0);
  const R = LY.camDist * rr;
  camera.position.set(target.x + R * Math.sin(az) * Math.cos(el), target.y + R * Math.sin(el), R * Math.cos(az) * Math.cos(el));
  camera.lookAt(target);
  camera.updateMatrixWorld();

  // rig + balão (A = metade esquerda / disco / balão final, B = metade direita)
  O.rig.position.copy(v3(T.rigPos.at(t)).multiplyScalar(U));
  O.rig.rotation.set(...T.rigRot.at(t));
  const aP = t < split ? [...O.cL, 0] : T.aPos.at(t);
  O.A.position.copy(v3(aP).multiplyScalar(U));
  const aR = T.aRot.at(t);
  const sw = t > l2 && t < l3 ? 0.06 : 0; // leve balanço do disco
  O.A.rotation.set(aR[0] + Math.sin(t * 0.9) * sw, aR[1] + Math.sin(t * 0.7 + 1) * sw, aR[2]);
  const pu = 1 + 0.07 * (bump(t, K.pensar - 0.02, K.pensar + 0.08, K.pensar + 0.45) + bump(t, K.junto - 0.02, K.junto + 0.08, K.junto + 0.45));
  O.A.scale.setScalar(T.aScale.at(t) * pu);
  const aDepth = t < l4 ? T.aDepth.at(t) : lerp(s2.disc.depth, s1.depth * 0.8, prog(t, l4 - 0.35, l4 + 0.6));
  O.A.setOutline(t < l2 - 0.35 ? O.SH.bubL : T.aOutline.at(t), aDepth * U, (t < l2 ? s1.bevel : s2.disc.bevel) * U);
  O.A.material.opacity = T.aOpacity.at(t);
  if (O.A.material.opacity < 0.002) O.A.visible = false;
  O.A.visible = t >= split && t < l5 + 0.36;
  O.full.visible = t < split;

  O.B.visible = t >= split && t < split + 0.8;
  if (O.B.visible) {
    O.B.position.copy(v3(t < split ? [...O.cR, 0] : T.bPos.at(t)).multiplyScalar(U));
    O.B.rotation.set(...(t < split ? [0, 0, 0] : T.bRot.at(t)));
    if (!O.B.done) { O.B.setOutline(O.SH.bubR, s1.depth * U, s1.bevel * U); O.B.done = true; }
    O.B.material.opacity = T.bOpacity.at(t);
  }

  // pontinhos "digitando"
  const dotsAnim = (g, op) => { g.visible = op > 0.001; g.children.forEach((m, i) => { m.material.opacity = op; m.position.y = Math.max(0, Math.sin(t * 7 - i * 0.9)) * 1.1 * U; }); };
  dotsAnim(O.dots1, prog(t, 0.5, 1.1) * (1 - prog(t, split - 0.25, split - 0.02)));
  dotsAnim(O.dots4, prog(t, l4 + 0.35, l4 + 0.7) * (1 - prog(t, l5 - 0.45, l5 - 0.1)));
  O.dots4.position.x = -2 * U;

  // risco do corte
  const cutK = bump(t, split - 0.06, split + 0.02, split + 0.4);
  O.cut.visible = cutK > 0.001; O.cut.material.opacity = cutK; O.cut.scale.set(1 + cutK * 2, 0.3 + 0.7 * easeOutCubic(prog(t, split - 0.06, split + 0.08)), 1);

  // logo + brilho
  const lo = T.logoOp.at(t);
  O.logo.visible = lo > 0.001; O.logo.material.opacity = lo; O.logo.scale.setScalar(T.logoScale.at(t));
  O.glow.visible = lo > 0.001; O.glow.material.opacity = lo * 0.4; O.glow.scale.setScalar((s2.disc.R * 2.8 + Math.sin(t * 1.3) * 0.8) * U);

  // terminal
  O.term.position.copy(v3(T.termPos.at(t)).multiplyScalar(U));
  O.term.rotation.set(...T.termRot.at(t));
  const mu = 1 + 0.06 * (bump(t, K.mao - 0.02, K.mao + 0.08, K.mao + 0.45) + bump(t, K.massa - 0.02, K.massa + 0.08, K.massa + 0.45));
  O.term.scale.setScalar(T.termScale.at(t) * mu);
  O.term.visible = t >= K.swap && t < l5 + 0.36;
  O.term.updateMatrix();
  const so = T.screenOp.at(t);
  O.screenMesh.material.opacity = so;
  if (O.term.visible) O.screen.draw(t);

  // cartões: surgem do disco, orbitam, e fazem morph em 4 quadrantes do terminal
  const showCards = t >= K.chat - 0.3 && t < K.swap;
  const camQ = camera.quaternion.clone();
  const termQ = O.term.quaternion.clone();
  const phase = T.orbitPhase.at(t) + (t - K.chat) * 0.03;
  const discC = new THREE.Vector3(s2.disc.x * U, s2.disc.y * U, 0);
  O.cards.forEach((c, k) => {
    c.visible = showCards;
    if (!showCards) return;
    const a = phase + (k * Math.PI) / 2;
    const orb = new THREE.Vector3(s2.orbit.rx * Math.sin(a) * U, (s2.disc.y - s2.orbit.ry * Math.cos(a)) * U, s2.orbit.rz * Math.cos(a) * U);
    const em = easeOutBack(prog(t, K.chat - 0.25 + k * 0.1, K.chat + 0.45 + k * 0.1));
    const p = discC.clone().lerp(orb, em);
    // destaque no momento em que a palavra é falada
    const next = K.cards[k + 1] ?? K.l3;
    const h = prog(t, K.cards[k] - 0.1, K.cards[k] + 0.2) * (1 - prog(t, next - 0.1, next + 0.2));
    // morph para quadrante do terminal
    const mk = easeInOutCubic(prog(t, l3 - 0.3 + k * 0.06, l3 + 0.8 + k * 0.06));
    const q = O.SH.quads[k];
    const qp = new THREE.Vector3(q.c[0] * U, q.c[1] * U, 0).applyMatrix4(new THREE.Matrix4().compose(O.term.position, termQ, new THREE.Vector3(1, 1, 1)));
    // posição do terminal no início (antes de ficar visível) já é a da cena 3
    c.position.copy(p.lerp(qp, mk));
    c.quaternion.copy(camQ.clone().slerp(termQ, mk));
    c.scale.setScalar(lerp(Math.max(0.001, em) * (1 + 0.16 * h), 1, mk));
    c.setOutline(mk <= 0 ? O.SH.card : mixO(O.SH.card, q.o, mk), lerp(s2.card.depth, s3.term.depth, mk) * U, lerp(s2.card.bevel, s3.term.bevel, mk) * U);
    c.material.emissiveIntensity = 0.2 + 1.1 * h;
    c.material.color.set(h > 0.5 ? P.wine1 : P.wine0).lerp(new THREE.Color("#1a0b10"), mk);
    c.face.material.opacity = (0.5 + 0.5 * h) * (1 - prog(mk, 0, 0.35)) * clamp01(em);
  });

  // luz do CTA
  const lk = bump(t, l5 - 0.4, l5 + 0.35, l5 + 1.4);
  O.light.visible = lk > 0.001;
  O.light.position.set(s5.light.x * U, s5.light.y * U, 2 * U);
  O.light.material.opacity = lk;
  O.light.scale.setScalar((4 + 60 * easeInCubic(prog(t, l5 + 0.1, l5 + 1.2))) * U * (0.6 + 0.4 * lk));
  bloom.strength = 0.32 + 0.6 * lk;

  // luz pontual que passeia (reflexos vivos)
  O.pl.position.set(content.position.x + Math.sin(t * 0.6) * 2.2, content.position.y + 1.2 + Math.cos(t * 0.45) * 1.4, 3.2);

  // fundo
  const gy = t < l4 ? 0.56 : 0.5;
  O.bg.material.uniforms.uGlow.value.set(0.5 + noise1(t * 0.2, 4) * 0.08, gy + noise1(t * 0.2, 5) * 0.06);
  O.bg.material.uniforms.uInt.value = 0.55 + 0.25 * Math.sin(t * 0.5) * 0.5 + 0.25 * bump(t, split - 0.1, split + 0.1, split + 0.8) + 0.5 * lk;

  // partículas (deriva determinística)
  const pa = O.parts.geometry.attributes.position.array, b = O.pBase, ph = O.pPh;
  const H = LY.visH * 1.4 * U;
  for (let i = 0; i < b.length / 3; i++) {
    const sp = ph[i * 3 + 2];
    pa[i * 3] = b[i * 3] + Math.sin(t * 0.3 * sp + ph[i * 3]) * 0.25;
    let y = b[i * 3 + 1] + t * 0.05 * sp + Math.sin(t * 0.25 * sp + ph[i * 3 + 1]) * 0.2;
    y = ((((y + H / 2) % H) + H) % H) - H / 2;
    pa[i * 3 + 1] = y;
    pa[i * 3 + 2] = b[i * 3 + 2];
  }
  O.parts.geometry.attributes.position.needsUpdate = true;
  O.parts.material.opacity = 0.5 * (1 - prog(t, l5 + 0.4, l5 + 1.2) * 0.6);
}
function mixO(a, b, k) { const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] + (b[i] - a[i]) * k; return o; }

// ---------------------------------------------------------------- DOM (tipografia cinética)
function px(u) { return u * LY.pxPerU; }
function place(el, x, y) { el.style.left = `${VW / 2 + px(LY.focus.x + x)}px`; el.style.top = `${VH / 2 - px(LY.focus.y + y)}px`; }

function phrase(words, { x = 0, y = 0, size = 8, cls = "", anchor = "center" } = {}) {
  const el = document.createElement("div");
  el.className = `ph ${cls}`; el.style.fontSize = `${px(size)}px`;
  el.dataset.anchor = anchor;
  const spans = words.map((w) => {
    const s = document.createElement("span"); s.className = "w";
    if (typeof w === "string") s.textContent = w; else { s.textContent = w.t; if (w.c) s.classList.add(w.c); }
    el.appendChild(s); return s;
  });
  place(el, x, y);
  document.getElementById("type").appendChild(el);
  return { el, spans, x, y };
}

function setPhrase(ph, { o = 1, dx = 0, dy = 0, s = 1 } = {}) {
  ph.el.style.opacity = o.toFixed(4);
  const tr = ph.el.dataset.anchor === "left" ? "translate(0,-50%)" : "translate(-50%,-50%)";
  ph.el.style.transform = `${tr} translate(${px(dx).toFixed(2)}px, ${px(-dy).toFixed(2)}px) scale(${s.toFixed(4)})`;
}

// entrada de palavra com escala elástica
function popWord(span, t, t0, { dur = 0.55, from = 0.3, elastic = true, rise = 2 } = {}) {
  const k = prog(t, t0 - 0.04, t0 - 0.04 + dur);
  const e = elastic ? easeOutElastic(k) : easeOutBackStrong(k);
  const s = from + (1 - from) * e;
  span.style.opacity = prog(t, t0 - 0.04, t0 + 0.08).toFixed(4);
  span.style.transform = `translateY(${px(rise * (1 - easeOutCubic(k))).toFixed(2)}px) scale(${s.toFixed(4)})`;
}

function buildDOM(nodexLogoUrl) {
  const s1 = LY.s1, s2 = LY.s2, s3 = LY.s3, s4 = LY.s4, s5 = LY.s5;
  D.s1small = phrase(["Você", "usa", "o", { t: "Claude", c: "hi" }], { y: s1.small.y, size: s1.small.size, cls: "light" });
  D.s1big1 = phrase(["só", "pra"], { y: s1.big1.y, size: s1.big1.size });
  D.s1big2 = phrase([{ t: "conversar?", c: "hi" }], { y: s1.big2.y, size: s1.big2.size });
  D.s1half = phrase([{ t: "metade", c: "accent" }, "dele."], { y: s1.half.y, size: s1.half.size });
  D.s1entao = phrase(["então", "tá", "usando"], { y: s1.half.y + s1.half.size * 0.95, size: s1.small.size, cls: "light" });

  D.s2title = phrase(["Claude"], { y: s2.title.y, size: s2.title.size });
  D.s2sub = phrase(["inteligência", "artificial"], { y: s2.sub.y, size: s2.sub.size, cls: "semi" });
  D.s2sub2 = phrase(["da", "Anthropic"], { y: s2.sub2.y, size: s2.sub2.size, cls: "light" });
  D.s2chip = phrase(["NO CHAT, ELE"], { y: s2.chip.y, size: s2.chip.size, cls: "mono chip" });
  D.s2words = ["escreve", "analisa arquivos", "pesquisa", "cria documentos"].map((w) => phrase(w.split(" "), { y: s2.word.y, size: s2.word.size }));

  D.s3title = phrase(["Claude", { t: "Code", c: "accent" }], { y: s3.title.y, size: s3.title.size });
  D.s3sub = phrase(["direto", "no", "computador"], { y: s3.sub.y, size: s3.sub.size, cls: "semi" });
  D.s3steps = ["lê o projeto", "escreve o código", "roda os comandos", "testa até funcionar"].map((w, i) => {
    const ph = phrase([{ t: `0${i + 1}`, c: "num" }, ...w.split(" ")], { x: s3.steps.x, y: s3.steps.y - i * s3.steps.dy, size: s3.steps.size, anchor: "left", cls: "step" });
    return ph;
  });
  // check (SVG, traço desenhado em função de t)
  const ck = document.createElement("div"); ck.className = "check";
  ck.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" /><path d="M29 52 L44 66 L72 36" /></svg>`;
  ck.style.width = ck.style.height = `${px(s3.check.size)}px`;
  place(ck, s3.check.x, s3.check.y); document.getElementById("type").appendChild(ck); D.check = ck;

  D.s4chat = phrase(["CHAT"], { y: s4.chatLabel.y, size: s4.chatLabel.size, cls: "mono label" });
  D.s4top = phrase(["Pensar", { t: "junto", c: "accent" }], { y: s4.top.y, size: s4.top.size });
  D.s4code = phrase(["CLAUDE CODE"], { y: s4.codeLabel.y, size: s4.codeLabel.size, cls: "mono label" });
  D.s4bottom = phrase(["Mão", "na", { t: "massa", c: "accent" }], { y: s4.bottom.y, size: s4.bottom.size });

  // CTA: painel revelado pela luz
  const cta = document.getElementById("cta");
  const lx = VW / 2 + px(LY.focus.x + s5.light.x), lyy = VH / 2 - px(LY.focus.y + s5.light.y);
  D.cta = { el: cta, cx: lx, cy: lyy };
  cta.style.background = `radial-gradient(circle at ${lx}px ${lyy}px, #3a0b17 0%, ${P.bg1} 38%, ${P.bg0} 75%)`;
  D.ring = document.getElementById("ring");
  if (nodexLogoUrl) {
    const img = document.createElement("img"); img.src = nodexLogoUrl; img.className = "nodex-img";
    img.style.height = `${px(s5.logo.size)}px`; place(img, 0, s5.logo.y); cta.appendChild(img);
    D.nodex = { el: img, spans: [img], img: true };
  } else {
    D.nodex = phrase("NODEX".split(""), { y: s5.logo.y, size: s5.logo.size, cls: "nodex" });
    cta.appendChild(D.nodex.el);
  }
  D.s5sub = phrase(["aprenda", "a", "usar", { t: "IA", c: "accent" }, "no", "seu", "negócio"], { y: s5.sub.y, size: s5.sub.size, cls: "semi" });
  cta.appendChild(D.s5sub.el);
  D.s5handle = phrase([{ t: "Siga", c: "light" }, HANDLE], { y: s5.handle.y, size: s5.handle.size, cls: "handle" });
  cta.appendChild(D.s5handle.el);
}

function updateDOM(t, n) {
  const { l2, l3, l4, l5, split } = K, w = K.s1Words;

  // ---- Cena 1
  const out1 = 1 - prog(t, split - 0.2, split + 0.05);
  setPhrase(D.s1small, { o: out1, dy: 3 * prog(t, split - 0.2, split + 0.05) });
  [w.voce, w.usa, w.o, w.claude].forEach((tt, i) => popWord(D.s1small.spans[i], t, tt, { elastic: false, from: 0.6 }));
  setPhrase(D.s1big1, { o: out1, dy: 4 * prog(t, split - 0.2, split + 0.05) });
  setPhrase(D.s1big2, { o: out1, dy: 4 * prog(t, split - 0.2, split + 0.05) });
  popWord(D.s1big1.spans[0], t, w.so); popWord(D.s1big1.spans[1], t, w.pra); popWord(D.s1big2.spans[0], t, w.conversar);
  const out1b = 1 - prog(t, l2 - 0.4, l2 + 0.05);
  setPhrase(D.s1entao, { o: out1b * prog(t, split - 0.1, split + 0.15) });
  D.s1entao.spans.forEach((s, i) => popWord(s, t, split - 0.12 + i * 0.05, { elastic: false, from: 0.7 }));
  setPhrase(D.s1half, { o: out1b, dy: -3 * prog(t, l2 - 0.4, l2 + 0.05) });
  popWord(D.s1half.spans[0], t, split, { from: 0.2 }); popWord(D.s1half.spans[1], t, w.dele);

  // ---- Cena 2
  const out2 = 1 - prog(t, l3 - 0.4, l3 + 0.05);
  setPhrase(D.s2title, { o: out2, s: 1 + 0.04 * prog(t, K.claude2, l3) });
  popWord(D.s2title.spans[0], t, K.claude2, { from: 0.4 });
  setPhrase(D.s2sub, { o: out2 }); popWord(D.s2sub.spans[0], t, K.ia, { elastic: false, from: 0.6 }); popWord(D.s2sub.spans[1], t, K.artificial, { elastic: false, from: 0.6 });
  setPhrase(D.s2sub2, { o: out2 }); D.s2sub2.spans.forEach((s) => popWord(s, t, K.anthropic - 0.1, { elastic: false, from: 0.7 }));
  setPhrase(D.s2chip, { o: out2 * prog(t, K.chat - 0.1, K.chat + 0.15) }); popWord(D.s2chip.spans[0], t, K.chat - 0.05, { elastic: false, from: 0.6 });
  D.s2words.forEach((ph, k) => {
    const t0 = K.cards[k], t1 = k < 3 ? K.cards[k + 1] : l3;
    const o = prog(t, t0 - 0.06, t0 + 0.06) * (1 - prog(t, t1 - 0.12, t1 + 0.02));
    setPhrase(ph, { o, dy: k < 3 ? 2.5 * prog(t, t1 - 0.12, t1 + 0.02) : 0 });
    ph.spans.forEach((s, i) => popWord(s, t, t0 + i * 0.12));
  });

  // ---- Cena 3
  const out3 = 1 - prog(t, l4 - 0.4, l4 + 0.05);
  setPhrase(D.s3title, { o: out3 });
  popWord(D.s3title.spans[0], t, K.cc, { from: 0.4 }); popWord(D.s3title.spans[1], t, K.code, { from: 0.2 });
  setPhrase(D.s3sub, { o: out3 });
  [K.direto, K.no3, K.computador].forEach((tt, i) => popWord(D.s3sub.spans[i], t, tt, { elastic: false, from: 0.6 }));
  D.s3steps.forEach((ph, i) => {
    const t0 = K.steps[i], t1 = i < 3 ? K.steps[i + 1] : 1e9;
    const kin = easeOutBackStrong(prog(t, t0 - 0.05, t0 + 0.45));
    const act = 1 - 0.55 * prog(t, t1 - 0.05, t1 + 0.25);
    setPhrase(ph, { o: out3 * prog(t, t0 - 0.05, t0 + 0.1) * act, dx: -10 * (1 - kin), s: 0.92 + 0.08 * act });
    ph.spans.forEach((s, j) => popWord(s, t, t0 + j * 0.06, { elastic: false, from: 0.8, rise: 0 }));
    ph.el.classList.toggle("done", t >= t1);
  });
  const ckk = prog(t, K.funcionar - 0.05, K.funcionar + 0.45);
  D.check.style.opacity = (out3 * prog(t, K.funcionar - 0.05, K.funcionar + 0.05)).toFixed(4);
  D.check.style.transform = `translate(-50%,-50%) scale(${(0.5 + 0.5 * easeOutElastic(prog(t, K.funcionar - 0.05, K.funcionar + 0.6))).toFixed(4)})`;
  D.check.querySelector("path").style.strokeDashoffset = (70 * (1 - easeOutCubic(ckk))).toFixed(3);
  D.check.querySelector("circle").style.strokeDashoffset = (280 * (1 - easeInOutCubic(ckk))).toFixed(3);

  // ---- Cena 4 (tipografia batendo no ritmo da fala)
  const out4 = 1 - prog(t, l5 - 0.45, l5 - 0.05);
  setPhrase(D.s4chat, { o: out4 * prog(t, K.chat4 - 0.1, K.chat4 + 0.1) });
  setPhrase(D.s4code, { o: out4 * prog(t, K.cc4 - 0.1, K.cc4 + 0.1) });
  const beatT = (ts) => ts.reduce((a, x) => a + bump(t, x - 0.02, x + 0.06, x + 0.32), 0);
  setPhrase(D.s4top, { o: out4, s: 1 + 0.06 * beatT([K.pensar, K.junto]) });
  popWord(D.s4top.spans[0], t, K.pensar, { from: 0.2 }); popWord(D.s4top.spans[1], t, K.junto, { from: 0.2 });
  setPhrase(D.s4bottom, { o: out4, s: 1 + 0.06 * beatT([K.mao, K.na, K.massa]) });
  [K.mao, K.na, K.massa].forEach((tt, i) => popWord(D.s4bottom.spans[i], t, tt, { from: 0.2 }));

  // ---- Cena 5 (CTA): a luz se expande e revela
  const rk = easeInOutCubic(prog(t, l5 + 0.1, l5 + 1.0));
  const maxR = Math.hypot(VW, VH);
  const r = rk * maxR;
  D.cta.el.style.display = rk > 0 ? "block" : "none";
  D.cta.el.style.clipPath = `circle(${r.toFixed(2)}px at ${D.cta.cx}px ${D.cta.cy}px)`;
  D.ring.style.display = rk > 0 && rk < 1 ? "block" : "none";
  D.ring.style.width = D.ring.style.height = `${(2 * r).toFixed(2)}px`;
  D.ring.style.left = `${D.cta.cx}px`; D.ring.style.top = `${D.cta.cy}px`;
  D.ring.style.opacity = (Math.sin(rk * Math.PI) * 0.9).toFixed(4);
  const tn = K.nodex - 0.25;
  if (D.nodex.img) { const k = prog(t, tn, tn + 0.6); D.nodex.el.style.opacity = k.toFixed(4); D.nodex.el.style.transform = `translate(-50%,-50%) scale(${(0.7 + 0.3 * easeOutElastic(k)).toFixed(4)})`; }
  else { setPhrase(D.nodex, { s: 1 + 0.03 * prog(t, tn, K.total) }); D.nodex.spans.forEach((s, i) => popWord(s, t, tn + i * 0.06, { from: 0.2, rise: 3 })); }
  setPhrase(D.s5sub, {}); K.s5sub.forEach((tt, i) => popWord(D.s5sub.spans[i], t, tt, { elastic: false, from: 0.7 }));
  const th0 = K.nodex + 0.3;
  setPhrase(D.s5handle, { o: prog(t, th0 - 0.05, th0 + 0.15), s: 0.85 + 0.15 * easeOutBackStrong(prog(t, th0, th0 + 0.5)) });

  // fade final (segura ~1.2s após a fala e fecha)
  document.getElementById("fade").style.opacity = prog(t, K.total - 0.55, K.total - 1 / FPS).toFixed(4);

  // grão de filme determinístico (tiles gerados com PRNG semente fixa)
  const g = document.getElementById("grain");
  g.style.backgroundImage = `url(${D.grain[n % D.grain.length]})`;
  g.style.backgroundPosition = `${Math.floor(hash01(n, SEED) * 256)}px ${Math.floor(hash01(n + 7919, SEED) * 256)}px`;
}

function buildGrain() {
  const rnd = mulberry32(SEED);
  D.grain = [];
  for (let k = 0; k < 6; k++) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const ctx = c.getContext("2d"); const im = ctx.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) { const v = Math.floor(rnd() * 255); im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; }
    ctx.putImageData(im, 0, 0); D.grain.push(c.toDataURL("image/png"));
  }
}

// ---------------------------------------------------------------- API para o Puppeteer
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("falha ao carregar " + src)); i.src = src; }); }
async function exists(url) { try { const r = await fetch(url, { method: "HEAD" }); return r.ok; } catch { return false; } }

window.__init = async function () {
  const root = document.documentElement;
  root.style.setProperty("--u", `${LY.pxPerU}px`);
  for (const [k, v] of Object.entries(P)) root.style.setProperty(`--${k}`, v);
  document.body.style.width = `${VW}px`; document.body.style.height = `${VH}px`;
  TL = await (await fetch("../timeline.json")).json();
  await Promise.all(["800 40px 'Inter Tight'", "700 40px 'Inter Tight'", "600 40px 'Inter Tight'", "500 40px 'JetBrains Mono'", "700 40px 'JetBrains Mono'"].map((f) => document.fonts.load(f, "AÇãõé✓")));
  await document.fonts.ready;
  buildKeys();
  const logoImg = await loadImage("../assets/claude-logo.svg");
  let nodex = null;
  for (const f of ["../assets/nodex-logo.svg", "../assets/nodex-logo.png"]) if (await exists(f)) { nodex = f; break; }
  build3D(logoImg);
  buildGrain();
  buildDOM(nodex);
  if (D.nodex.img) await D.nodex.el.decode();
  const gl = renderer.getContext();
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  return {
    renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    webgl2: renderer.capabilities.isWebGL2, totalFrames: TL.totalFrames, total: TL.total, nodexLogo: nodex,
    fonts: [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`).filter((v, i, a) => a.indexOf(v) === i),
  };
};

// depuração: posição na tela (px) de objetos-chave
window.__debug = function (n) {
  update3D(n / FPS, n);
  const pr = (o) => { const v = new THREE.Vector3(); o.getWorldPosition(v); v.project(camera); return [Math.round((v.x + 1) / 2 * VW), Math.round((1 - v.y) / 2 * VH)]; };
  return { A: pr(O.A), term: pr(O.term), rig: pr(O.rig), cam: camera.position.toArray(), focus: LY.focus };
};

window.renderFrame = async function (n) {
  const t = n / FPS;
  update3D(t, n);
  updateDOM(t, n);
  composer.render();
  await document.fonts.ready;
  // 2 rAF só para sincronizar a composição antes da captura (não é relógio)
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return n;
};
