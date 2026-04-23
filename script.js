/*
  Página de cumpleaños premium
  - Intro → Transición vórtice → Escena principal
  - Animaciones: cinematográficas (fade/scale/blur), floating, glow, parallax
  - Interacción final: flash suave + confetti elegante

  Notas:
  - Coloca fotos en assets/img/ con nombres:
    foto1.(png|jpg|jpeg)
    foto2.(png|jpg|jpeg)
*/

// -----------------------------
// Config (personalizable)
// -----------------------------

const NAME = 'Hellen';

const customPhrase = '"Que esta noche te abrace bonito y te recuerde lo mucho que vales."';

// Mensaje corto y emocional (sin bloques largos)
const messageLines = [
  `Feliz cumpleaños, ${NAME}.`,
  'Hoy quise dejarte un momento bonito.',
  'Que lo dulce te encuentre sin prisa…',
  'y que te sientas muy querida.',
];

const PHOTO_FALLBACKS = [
  {
    id: 'photo1',
    candidates: [
      'assets/img/foto1.jpg',
      'assets/img/foto1.png',
      'assets/img/foto1.jpeg',
      // Intento ruta local (a veces bloqueado por el navegador)
      'file:///C:/Users/Jereny%20Vera/Pictures/Screenshots/fotos/foto1.jpg',
      'file:///C:/Users/Jereny%20Vera/Pictures/Screenshots/fotos/foto1.png',
    ],
  },
  {
    id: 'photo2',
    candidates: [
      'assets/img/foto2.jpg',
      'assets/img/foto2.png',
      'assets/img/foto2.jpeg',
      'file:///C:/Users/Jereny%20Vera/Pictures/Screenshots/fotos/foto2.jpg',
      'file:///C:/Users/Jereny%20Vera/Pictures/Screenshots/fotos/foto2.png',
    ],
  },
];

// -----------------------------
// Helpers DOM
// -----------------------------

const $ = (sel) => document.querySelector(sel);

const intro = $('#intro');
const btnOpen = $('#btnOpen');
const scene = $('#scene');
const panel = $('#panel');
const headline = $('#headline');
const subline = $('#sub');
const phraseEl = $('#phrase');
const typed = $('#typed');
const btnCelebrate = $('#btnCelebrate');
const btnReplay = $('#btnReplay');
const btnBack = $('#btnBack');
const btnMusic = $('#btnMusic');
const hint = $('#hint');
const footerLine = $('#footerLine');
const secretNote = $('#secretNote');
const tapHint = $('#tapHint');
const celebrateOverlay = $('#celebrateOverlay');
const flash = $('#flash');
const shootingLayer = $('#shooting');
const magicLayer = $('#magic');

const musicLabel = btnMusic ? btnMusic.querySelector('[data-music-label]') : null;
const musicIcon = btnMusic ? btnMusic.querySelector('.icon') : null;

// -----------------------------
// Performance: ajustes para móvil
// -----------------------------

const mediaCoarse = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
const mediaFine = window.matchMedia ? window.matchMedia('(pointer: fine)') : null;
const mediaSmall = window.matchMedia ? window.matchMedia('(max-width: 600px)') : null;

function isMobileLike(){
  return Boolean((mediaCoarse && mediaCoarse.matches) || (mediaSmall && mediaSmall.matches));
}

function canvasDprCap(){
  return isMobileLike() ? 1 : 2;
}

let typingTimer = null;
let typingIndex = 0;
let typingText = '';
let hasOpened = false;
let typingLines = [];
let typingLineIndex = 0;
let typingLineTimer = null;
let sceneTimers = [];
let musicContext = null;
let musicMasterGain = null;
let musicFilter = null;
let musicTimer = null;
let musicStep = 0;
let musicNextTime = 0;
let musicPlaying = false;

const musicPattern = [
  [293.66, 369.99, 440.00],
  [246.94, 293.66, 369.99],
  [196.00, 246.94, 293.66],
  [220.00, 277.18, 329.63],
  [246.94, 329.63, 392.00],
  [293.66, 392.00, 466.16],
  [261.63, 329.63, 392.00],
  [220.00, 293.66, 349.23],
];

function clearSceneTimers(){
  for (const timer of sceneTimers) window.clearTimeout(timer);
  sceneTimers = [];
}

function queueSceneTimer(callback, delay){
  const timer = window.setTimeout(callback, delay);
  sceneTimers.push(timer);
  return timer;
}

function updateMusicButton(isPlaying){
  if (!btnMusic) return;
  musicPlaying = isPlaying;
  btnMusic.classList.toggle('is-playing', isPlaying);
  btnMusic.setAttribute('aria-pressed', String(isPlaying));
  btnMusic.setAttribute('aria-label', isPlaying ? 'Pausar música' : 'Activar música');
  if (musicLabel) musicLabel.textContent = isPlaying ? 'Pausar' : 'Música';
  if (musicIcon) musicIcon.textContent = isPlaying ? '❚❚' : '♪';
}

function clearOverlayState(){
  if (!celebrateOverlay) return;
  celebrateOverlay.classList.remove('show');
}

function ensureMusicEngine(){
  if (musicContext) return musicContext;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;

  musicContext = new AudioCtor();
  musicFilter = musicContext.createBiquadFilter();
  musicFilter.type = 'lowpass';
  musicFilter.frequency.value = 1400;
  musicFilter.Q.value = 0.7;

  const delay = musicContext.createDelay(0.35);
  delay.delayTime.value = 0.18;
  const feedback = musicContext.createGain();
  feedback.gain.value = 0.14;
  const delayOutput = musicContext.createGain();
  delayOutput.gain.value = 0.28;

  musicMasterGain = musicContext.createGain();
  musicMasterGain.gain.value = 0.0001;

  musicFilter.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayOutput);
  musicFilter.connect(delayOutput);
  delayOutput.connect(musicMasterGain);
  musicMasterGain.connect(musicContext.destination);

  return musicContext;
}

function scheduleMusicStep(){
  if (!musicContext || !musicMasterGain || !musicFilter) return;

  const now = musicContext.currentTime;
  const startTime = Math.max(now + 0.04, musicNextTime);
  const chord = musicPattern[musicStep % musicPattern.length];

  chord.forEach((frequency, index) => {
    const oscillator = musicContext.createOscillator();
    const gain = musicContext.createGain();
    oscillator.type = index === 1 ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.detune.setValueAtTime(index === 0 ? -5 : index === 2 ? 6 : 0, startTime);

    const peak = index === 1 ? 0.018 : 0.014;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.9);

    oscillator.connect(gain).connect(musicFilter);
    oscillator.start(startTime);
    oscillator.stop(startTime + 1.05);
  });

  musicStep += 1;
  musicNextTime = startTime + 0.82;
}

async function startMusic(){
  const context = ensureMusicEngine();
  if (!context) return;
  if (context.state === 'suspended') await context.resume();

  if (!musicTimer){
    musicStep = 0;
    musicNextTime = context.currentTime + 0.18;
    scheduleMusicStep();
    musicTimer = window.setInterval(() => {
      if (!musicContext || musicContext.state !== 'running') return;
      const lookAhead = musicContext.currentTime + 0.6;
      while (musicNextTime < lookAhead){
        scheduleMusicStep();
      }
    }, 120);
  }

  if (musicMasterGain) musicMasterGain.gain.setTargetAtTime(0.3, context.currentTime, 0.14);
  updateMusicButton(true);
}

async function pauseMusic(){
  if (!musicContext) return;
  if (musicMasterGain) musicMasterGain.gain.setTargetAtTime(0.0001, musicContext.currentTime, 0.08);
  if (musicTimer){
    window.clearInterval(musicTimer);
    musicTimer = null;
  }
  if (musicContext.state === 'running') await musicContext.suspend();
  updateMusicButton(false);
}

async function toggleMusic(){
  if (musicPlaying) await pauseMusic();
  else await startMusic();
}

function revealSecretNote(){
  if (!secretNote || !secretNote.hidden) return;
  secretNote.hidden = false;
  secretNote.classList.add('reveal');
}

function mulberry32(seed){
  let t = seed >>> 0;
  return function(){
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function buildPetals(){
  const layer = $('#petals');
  if (!layer) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    layer.innerHTML = '';
    return;
  }

  const rnd = mulberry32(20260422);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const base = Math.floor((w * h) / 32000);
  const cap = isMobileLike() ? 22 : 38;
  const count = Math.max(14, Math.min(cap, Math.floor(base * (isMobileLike() ? 0.82 : 1))));

  layer.innerHTML = '';

  const pickVariant = () => {
    const r = rnd();
    // 70% rosa suave, 20% champagne, 10% dorado rosado
    if (r < 0.28) return 'p1';
    if (r < 0.52) return 'p2';
    if (r < 0.70) return 'p3';
    if (r < 0.90) return 'p4';
    return 'p5';
  };

  for (let i = 0; i < count; i++){
    const p = document.createElement('i');
    const variant = pickVariant();
    p.className = `petal ${variant}`;

    // Más orgánico: mayoría cerca del centro + pocos libres en los bordes
    let x = rnd() * 100;
    if (rnd() < 0.46){
      x = 50 + (rnd() * 2 - 1) * 22;
    }
    x = Math.max(4, Math.min(96, x));
    let size = (isMobileLike() ? 8.5 : 10.5) + rnd() * (isMobileLike() ? 8 : 11);
    let dur = (isMobileLike() ? 12 : 14) + rnd() * (isMobileLike() ? 10 : 12);
    const delay = -rnd() * dur;
    const sway = (rnd() * 2 - 1) * (isMobileLike() ? 14 : 22);
    const rot = (rnd() * 2 - 1) * 35;
    const spin = (rnd() < 0.5 ? -1 : 1) * (110 + rnd() * 160);
    const sc = 0.78 + rnd() * 0.55;
    let o = 0.12 + rnd() * 0.34;

    const depthBlur = rnd();
    const blur = depthBlur < 0.20 ? (0.95 + rnd() * 1.5)
      : depthBlur < 0.45 ? (0.35 + rnd() * 0.7)
        : (0 + rnd() * 0.35);

    // Profundidad: los más borrosos (cerca) caen un poco más lento
    if (blur > 0.9) dur *= 1.08;
    if (blur < 0.2) dur *= 0.96;

    // Variación sutil por tipo (premium): champagne/gold un poco más "etéreo"
    if (variant === 'p4'){
      o *= 0.92;
      size *= 0.98;
    } else if (variant === 'p5'){
      o *= 0.84;
      size *= 0.95;
      dur *= 1.06;
    }

    p.style.setProperty('--x', x.toFixed(2) + '%');
    p.style.setProperty('--w', size.toFixed(2) + 'px');
    p.style.setProperty('--dur', dur.toFixed(2) + 's');
    p.style.setProperty('--delay', delay.toFixed(2) + 's');
    p.style.setProperty('--sway', sway.toFixed(2) + 'px');
    p.style.setProperty('--r', rot.toFixed(1) + 'deg');
    p.style.setProperty('--spin', spin.toFixed(1) + 'deg');
    p.style.setProperty('--sc', sc.toFixed(2));
    p.style.setProperty('--o', o.toFixed(2));
    p.style.setProperty('--blur', blur.toFixed(2) + 'px');

    layer.appendChild(p);
  }
}

// -----------------------------
// Estrellas fugaces (pocas, aleatorias, elegantes)
// -----------------------------

let shootingTimer = null;
let activeShoots = 0;

function startShootingStars(){
  if (!shootingLayer) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (shootingTimer) return;

  const rnd = mulberry32(20260422 ^ 0xA53);

  const schedule = () => {
    // Intervalos amplios para no saturar
    const delay = (isMobileLike() ? 3600 : 2400) + rnd() * (isMobileLike() ? 7400 : 5200);
    shootingTimer = window.setTimeout(() => {
      spawnShootingStar(rnd);
      schedule();
    }, delay);
  };

  schedule();
}

function stopShootingStars(){
  if (shootingTimer) window.clearTimeout(shootingTimer);
  shootingTimer = null;
}

function spawnShootingStar(rnd){
  if (!shootingLayer) return;
  // Mantener pocas al mismo tiempo
  if (activeShoots >= 2) return;
  activeShoots++;

  const el = document.createElement('i');
  el.className = 'shoot';

  // Posición: parte superior (y un poco lateral) para cruzar el cielo
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const sx = (rnd ? rnd() : Math.random()) * (vw * 0.85);
  const sy = (rnd ? rnd() : Math.random()) * (vh * 0.35);

  // Vector de desplazamiento (diagonal elegante)
  const dx = 260 + (rnd ? rnd() : Math.random()) * 520;
  const dy = 140 + (rnd ? rnd() : Math.random()) * 360;

  // Duración corta y limpia
  const dur = 760 + (rnd ? rnd() : Math.random()) * 520;
  const ang = -18 - (rnd ? rnd() : Math.random()) * 16;

  el.style.setProperty('--sx', sx.toFixed(1) + 'px');
  el.style.setProperty('--sy', sy.toFixed(1) + 'px');
  el.style.setProperty('--dx', dx.toFixed(1) + 'px');
  el.style.setProperty('--dy', dy.toFixed(1) + 'px');
  el.style.setProperty('--dur', dur.toFixed(0) + 'ms');
  el.style.setProperty('--ang', ang.toFixed(1) + 'deg');

  el.addEventListener('animationend', () => {
    el.remove();
    activeShoots = Math.max(0, activeShoots - 1);
  }, { once: true });

  shootingLayer.appendChild(el);
}

async function setFirstWorkingSrc(imgEl, candidates){
  for (const src of candidates){
    const ok = await probeImage(src);
    if (ok){
      imgEl.src = src;
      imgEl.decoding = 'async';
      imgEl.loading = 'eager';

      const apply = () => applySmartPhotoFit(imgEl);
      if (imgEl.complete) apply();
      else imgEl.addEventListener('load', apply, { once: true });
      return true;
    }
  }
  return false;
}

function applySmartPhotoFit(imgEl){
  const frame = imgEl.closest('.frame');
  if (!frame) return;
  const src = imgEl.currentSrc || imgEl.src;
  if (src) frame.style.setProperty('--bg', `url("${src}")`);

  const w = imgEl.naturalWidth || 0;
  const h = imgEl.naturalHeight || 0;
  if (!w || !h) return;

  const ratio = w / h;
  const portrait = ratio < 0.92;
  frame.classList.toggle('portrait', portrait);

  // Posición por defecto más "cara-friendly".
  // Retrato: subimos un poco el enfoque para evitar cortar frente/ojos.
  const op = portrait ? '50% 22%' : '50% 35%';
  frame.style.setProperty('--op', op);
}

function probeImage(src){
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function loadPhotos(){
  for (const spec of PHOTO_FALLBACKS){
    const el = document.getElementById(spec.id);
    if (!el) continue;

    const ok = await setFirstWorkingSrc(el, spec.candidates);
    if (!ok){
      // Placeholder elegante si no encuentra la imagen
      el.alt = 'No se encontró la imagen (colócala en assets/img/)';
      el.src = makePlaceholderSvgDataUri('Coloca tu foto en\nassets/img/' + (spec.id === 'photo1' ? 'foto1.jpg' : 'foto2.jpg'));
    }
  }
}

function makePlaceholderSvgDataUri(text){
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a1b2f"/>
      <stop offset="1" stop-color="#0b1024"/>
    </linearGradient>
    <radialGradient id="r" cx="30%" cy="25%" r="65%">
      <stop offset="0" stop-color="#ff5db1" stop-opacity=".35"/>
      <stop offset="1" stop-color="#ff5db1" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="360" cy="220" r="420" fill="url(#r)"/>
  <rect x="70" y="70" width="1060" height="660" rx="38" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.16)"/>
  <text x="600" y="360" text-anchor="middle" font-family="Segoe UI, Arial" font-size="44" fill="rgba(233,231,255,.92)">${escapeXml(text).replace(/\n/g, '</text><text x="600" y="420" text-anchor="middle" font-family="Segoe UI, Arial" font-size="44" fill="rgba(233,231,255,.92)">')}</text>
  <text x="600" y="520" text-anchor="middle" font-family="Segoe UI, Arial" font-size="20" fill="rgba(233,231,255,.65)">Si quieres, renómbralas a foto1.jpg y foto2.jpg</text>
</svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function escapeXml(s){
  return s.replace(/[<>&\"']/g, (ch) => ({
    '<':'&lt;',
    '>':'&gt;',
    '&':'&amp;',
    '"':'&quot;',
    "'":'&apos;',
  }[ch]));
}

function stopTyping(){
  if (typingTimer) window.clearTimeout(typingTimer);
  typingTimer = null;
  if (typingLineTimer) window.clearTimeout(typingLineTimer);
  typingLineTimer = null;
}

function startTyping(){
  stopTyping();
  typingIndex = 0;
  typingText = '';
  typingLineIndex = 0;
  typingLines = messageLines.map((line) => line.trimEnd()).filter(Boolean);
  typed.textContent = '';
  typeNextLine();
}

function typeNextLine(){
  const line = typingLines[typingLineIndex];
  if (line == null){
    typingLineTimer = null;
    return;
  }

  const lineEl = document.createElement('span');
  lineEl.className = 'typedLine';
  typed.appendChild(lineEl);

  window.requestAnimationFrame(() => {
    lineEl.classList.add('show');
    typeTick(lineEl, line);
  });
}

function typeTick(lineEl, line){
  const baseDelay = 18;
  const ch = line[typingIndex];
  if (ch == null){
    lineEl.classList.add('done');
    typingIndex = 0;
    typingLineIndex++;
    typingLineTimer = window.setTimeout(typeNextLine, 180);
    return;
  }

  lineEl.textContent += ch;
  typingIndex++;

  let delay = baseDelay;
  if (ch === '.' || ch === '…') delay = 180;
  if (ch === ',') delay = 90;

  typingTimer = window.setTimeout(() => typeTick(lineEl, line), delay);
}

// -----------------------------
// Confetti (elegante)
// -----------------------------

const confettiCanvas = document.getElementById('confetti');
const confettiCtx = confettiCanvas.getContext('2d');
let pieces = [];
let confettiRAF = null;

function resizeCanvas(){
  const dpr = Math.min(canvasDprCap(), window.devicePixelRatio || 1);
  confettiCanvas.width = Math.floor(window.innerWidth * dpr);
  confettiCanvas.height = Math.floor(window.innerHeight * dpr);
  confettiCanvas.style.width = window.innerWidth + 'px';
  confettiCanvas.style.height = window.innerHeight + 'px';
  confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function launchConfetti(intensity = 140){
  if (isMobileLike()) intensity = Math.max(60, Math.floor(intensity * 0.62));
  const colors = ['#fff4f7', '#ffdfe8', '#f8d7df', '#f6c1cf', '#f4a9be', '#ee8fad', '#ead2b0', '#d9a46d'];
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let i = 0; i < intensity; i++){
    // Confetti fino (cintas pequeñas + algunos corazones)
    const ribbon = Math.random() < 0.86;
    pieces.push({
      x: w * (0.12 + Math.random() * 0.76),
      y: -30 - Math.random() * 160,
      vx: (Math.random() - 0.5) * 1.7,
      vy: 2.2 + Math.random() * 3.0,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.10,
      size: ribbon ? (4 + Math.random() * 7) : (8 + Math.random() * 10),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      ttl: 430 + Math.random() * 160,
      shape: ribbon ? 'ribbon' : 'heart',
    });
  }

  if (!confettiRAF) confettiRAF = requestAnimationFrame(tickConfetti);
}

function tickConfetti(){
  confettiRAF = requestAnimationFrame(tickConfetti);

  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const gravity = 0.032;
  const wind = Math.sin(Date.now() / 1200) * 0.022;

  pieces = pieces.filter((p) => {
    p.vx += wind;
    p.vy += gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life += 1;

    const fade = Math.max(0, 1 - (p.life / p.ttl));
    const alpha = Math.min(1, fade * 1.05);

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rot);
    confettiCtx.globalAlpha = alpha;
    confettiCtx.fillStyle = p.color;

    if (p.shape === 'ribbon'){
      // Cinta: más fina y elegante
      confettiCtx.fillRect(-p.size * 0.35, -p.size * 0.85, p.size * 0.7, p.size * 1.7);
    } else {
      drawHeart(confettiCtx, 0, 0, p.size * 0.88);
      confettiCtx.fill();
    }

    confettiCtx.restore();

    return p.life < p.ttl && p.y < window.innerHeight + 80;
  });

  if (pieces.length === 0){
    cancelAnimationFrame(confettiRAF);
    confettiRAF = null;
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

function drawHeart(context, x, y, size){
  const s = size;
  context.beginPath();
  context.moveTo(x, y + s*0.28);
  context.bezierCurveTo(x, y, x - s*0.5, y, x - s*0.5, y + s*0.28);
  context.bezierCurveTo(x - s*0.5, y + s*0.58, x - s*0.18, y + s*0.78, x, y + s);
  context.bezierCurveTo(x + s*0.18, y + s*0.78, x + s*0.5, y + s*0.58, x + s*0.5, y + s*0.28);
  context.bezierCurveTo(x + s*0.5, y, x, y, x, y + s*0.28);
  context.closePath();
}
// -----------------------------
// Vórtice de transición (cinematográfico)
// -----------------------------

const vortexCanvas = document.getElementById('vortex');
const vortexCtx = vortexCanvas.getContext('2d');
let vortexRAF = null;
let vortexParticles = [];

function resizeVortex(){
  const dpr = Math.min(canvasDprCap(), window.devicePixelRatio || 1);
  vortexCanvas.width = Math.floor(window.innerWidth * dpr);
  vortexCanvas.height = Math.floor(window.innerHeight * dpr);
  vortexCanvas.style.width = window.innerWidth + 'px';
  vortexCanvas.style.height = window.innerHeight + 'px';
  vortexCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function startVortex(durationMs = 1200){
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cx = w / 2;
  const cy = h / 2;

  vortexParticles = [];
  const baseCount = Math.min(210, Math.max(130, Math.floor((w * h) / 9000)));
  const count = isMobileLike() ? Math.max(90, Math.floor(baseCount * 0.62)) : baseCount;
  const palette = ['#fff4f7', '#ffdfe8', '#f8d7df', '#f6c1cf', '#f4a9be', '#ee8fad', '#ead2b0', '#d9a46d'];

  for (let i = 0; i < count; i++){
    const angle = Math.random() * Math.PI * 2;
    const radius = (Math.random() ** 0.55) * Math.max(w, h) * 0.55;
    vortexParticles.push({
      a: angle,
      r: radius,
      s: 0.6 + Math.random() * 1.4,
      c: palette[Math.floor(Math.random() * palette.length)],
      o: 0.15 + Math.random() * 0.65,
      spin: (Math.random() < 0.5 ? -1 : 1) * (0.012 + Math.random() * 0.02),
    });
  }

  const start = performance.now();
  document.body.classList.add('is-transition');
  vortexCanvas.style.opacity = '1';

  if (vortexRAF) cancelAnimationFrame(vortexRAF);

  const tick = (now) => {
    const t = Math.min(1, (now - start) / durationMs);
    vortexCtx.clearRect(0, 0, w, h);

    // Ease: acelera hacia el centro
    const ease = 1 - Math.pow(1 - t, 3);
    const pull = 0.92 + ease * 0.18;
    const fade = 1 - t;

    for (const p of vortexParticles){
      p.a += p.spin;
      p.r *= (0.985 - ease * 0.012);

      const x = cx + Math.cos(p.a) * p.r;
      const y = cy + Math.sin(p.a) * p.r;

      vortexCtx.save();
      vortexCtx.globalAlpha = Math.max(0, p.o * fade);
      vortexCtx.fillStyle = p.c;
      vortexCtx.beginPath();
      vortexCtx.arc(x, y, p.s * pull, 0, Math.PI * 2);
      vortexCtx.fill();
      vortexCtx.restore();
    }

    // Destello suave al final
    if (t > 0.74){
      const k = (t - 0.74) / 0.26;
      const a = Math.sin(Math.min(1, k) * Math.PI);
      vortexCtx.save();
      vortexCtx.globalAlpha = a * 0.22;
      vortexCtx.fillStyle = '#ffffff';
      vortexCtx.beginPath();
      vortexCtx.arc(cx, cy, 220 * a + 40, 0, Math.PI * 2);
      vortexCtx.fill();
      vortexCtx.restore();
    }

    if (t < 1){
      vortexRAF = requestAnimationFrame(tick);
      return;
    }

    vortexCanvas.style.opacity = '0';
    document.body.classList.remove('is-transition');
  };

  vortexRAF = requestAnimationFrame(tick);
}

// -----------------------------
// Interacción final: flash + confetti
// -----------------------------

function flashThenConfetti(){
  if (!flash) return;
  flash.animate(
    [
      { opacity: 0 },
      { opacity: 1, offset: 0.22 },
      { opacity: 0 },
    ],
    { duration: 520, easing: 'cubic-bezier(.2,.85,.2,1)' }
  );

  window.setTimeout(() => {
    launchConfetti(150);
  }, 170);
}

function celebrateWithImpact(){
  if (btnCelebrate){
    btnCelebrate.animate(
      [
        { transform: 'translateY(0) scale(1)', filter: 'brightness(1)' },
        { transform: 'translateY(-2px) scale(1.04)', filter: 'brightness(1.08)' },
        { transform: 'translateY(0) scale(1.01)', filter: 'brightness(1.02)' },
      ],
      { duration: 620, easing: 'cubic-bezier(.2,.85,.2,1)' }
    );
    burstSparklesFromElement(btnCelebrate);
  }

  boostPetals();
  queueSceneTimer(() => boostPetals(), 140);
  emitMagicBubbles();
  if (celebrateOverlay){
    celebrateOverlay.classList.remove('show');
    celebrateOverlay.animate(
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.12 },
        { opacity: 1, offset: 0.76 },
        { opacity: 0 },
      ],
      { duration: 2300, easing: 'cubic-bezier(.2,.85,.2,1)', fill: 'both' }
    );
    window.requestAnimationFrame(() => celebrateOverlay.classList.add('show'));
  }
  flashThenConfetti();
  queueSceneTimer(() => clearOverlayState(), 2400);
}

function burstSparklesFromElement(el){
  if (!el) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  const count = 10;

  for (let i = 0; i < count; i++){
    const p = document.createElement('i');
    p.className = 'sparkParticle';
    const a = (Math.PI * 2 * i) / count;
    const mag = 18 + Math.random() * 22;
    const dx = Math.cos(a) * mag;
    const dy = Math.sin(a) * mag;
    p.style.setProperty('--x', x.toFixed(1) + 'px');
    p.style.setProperty('--y', y.toFixed(1) + 'px');
    p.style.setProperty('--dx', dx.toFixed(1) + 'px');
    p.style.setProperty('--dy', dy.toFixed(1) + 'px');

    document.body.appendChild(p);
    // Forzar layout para arrancar animación
    // eslint-disable-next-line no-unused-expressions
    p.offsetWidth;
    p.classList.add('run');
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

// -----------------------------
// Efecto final: burbujas mágicas (premium)
// -----------------------------

function emitMagicBubbles(){
  if (!magicLayer) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Origen: abajo a la izquierda (elegante, no caricaturesco)
  const originX = Math.max(24, Math.min(vw * 0.18, vw - 40));
  const originY = vh - Math.max(28, Math.min(vh * 0.12, 120));

  const count = isMobileLike() ? 8 : 12;
  for (let i = 0; i < count; i++){
    const b = document.createElement('i');
    b.className = 'magicBubble bubble';

    const size = (isMobileLike() ? 10 : 12) + Math.random() * (isMobileLike() ? 18 : 24);
    const sx = originX + (Math.random() - 0.5) * 46;
    const sy = originY + (Math.random() - 0.5) * 28;
    const dx = (Math.random() - 0.15) * 140;
    const dy = -(220 + Math.random() * (isMobileLike() ? 220 : 360));
    const dur = 1100 + Math.random() * (isMobileLike() ? 650 : 850);
    const sc = 0.72 + Math.random() * 0.6;
    const a = 0.42 + Math.random() * 0.36;

    b.style.setProperty('--sz', size.toFixed(1) + 'px');
    b.style.setProperty('--sx', sx.toFixed(1) + 'px');
    b.style.setProperty('--sy', sy.toFixed(1) + 'px');
    b.style.setProperty('--dx', dx.toFixed(1) + 'px');
    b.style.setProperty('--dy', dy.toFixed(1) + 'px');
    b.style.setProperty('--dur', dur.toFixed(0) + 'ms');
    b.style.setProperty('--sc', sc.toFixed(2));
    b.style.setProperty('--a', a.toFixed(2));

    magicLayer.appendChild(b);
    b.addEventListener('animationend', () => b.remove(), { once: true });
  }

  // Burbuja principal centrada con texto
  window.setTimeout(() => {
    const main = document.createElement('div');
    main.className = 'magicBubble main';

    const text = document.createElement('div');
    text.className = 'magicText';
    text.textContent = 'Feliz cumpleaños 🎂';

    main.appendChild(text);
    magicLayer.appendChild(main);

    main.addEventListener('animationend', () => main.remove(), { once: true });
  }, 520);
}

if (btnReplay){
  btnReplay.addEventListener('click', (e) => {
    e.stopPropagation();
    startTyping();
  });
}

window.addEventListener('resize', () => {
  buildPetals();
  resizeCanvas();
  resizeVortex();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopShootingStars();
  else startShootingStars();
});


// -----------------------------
// Parallax suave (ligero)
// -----------------------------

function setParallaxFromEvent(ev){
  if (!scene || !panel) return;
  lastParallaxEvent = ev;
  if (!parallaxRAF) parallaxRAF = requestAnimationFrame(applyParallax);
}

let parallaxRAF = null;
let lastParallaxEvent = null;

function applyParallax(){
  parallaxRAF = null;
  const ev = lastParallaxEvent;
  if (!ev || !scene || !panel) return;

  const rect = panel.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const ex = (ev.touches && ev.touches[0] ? ev.touches[0].clientX : ev.clientX);
  const ey = (ev.touches && ev.touches[0] ? ev.touches[0].clientY : ev.clientY);
  if (typeof ex !== 'number' || typeof ey !== 'number') return;

  const nx = Math.max(-1, Math.min(1, (ex - cx) / (rect.width / 2)));
  const ny = Math.max(-1, Math.min(1, (ey - cy) / (rect.height / 2)));

  const scale = isMobileLike() ? 0.55 : 1;
  const px = (nx * 10 * scale).toFixed(2) + 'px';
  const py = (ny * 8 * scale).toFixed(2) + 'px';
  scene.style.setProperty('--px', px);
  scene.style.setProperty('--py', py);
}

function resetParallax(){
  if (!scene) return;
  scene.style.setProperty('--px', '0px');
  scene.style.setProperty('--py', '0px');
}

// -----------------------------
// Estado: Intro → Main
// -----------------------------

function showScene(){
  if (!scene) return;
  scene.hidden = false;
  scene.classList.remove('ready');
  clearSceneTimers();
  if (secretNote){
    secretNote.hidden = true;
    secretNote.classList.remove('reveal');
  }
  // Asegura que las imágenes tengan src (algunos navegadores difieren el render si estaba hidden)
  loadPhotos();

  // Secuencia de aparición (no todo al mismo tiempo)
  window.requestAnimationFrame(() => {
    queueSceneTimer(() => {
      scene.classList.add('ready');
    }, 80);
  });
}

function hideSceneToIntro(){
  if (!scene || !intro) return;

  clearSceneTimers();
  stopTyping();
  pauseMusic();

  scene.animate(
    [
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateY(10px) scale(.985)', filter: 'blur(10px)' },
    ],
    { duration: 420, easing: 'cubic-bezier(.2,.85,.2,1)', fill: 'forwards' }
  );

  intro.style.display = '';
  document.body.classList.add('intro-mode');
  intro.animate(
    [
      { opacity: 0, transform: 'translateY(8px) scale(.985)', filter: 'blur(10px)' },
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
    ],
    { duration: 500, easing: 'cubic-bezier(.2,.85,.2,1)', fill: 'both' }
  );

  queueSceneTimer(() => {
    scene.hidden = true;
    scene.classList.remove('ready');
    typed.textContent = '';
  }, 380);
}

function hideIntro(){
  if (!intro) return;
  intro.animate(
    [
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
      { opacity: 0, transform: 'translateY(-8px) scale(.985)', filter: 'blur(10px)' },
    ],
    { duration: 520, easing: 'cubic-bezier(.2,.85,.2,1)', fill: 'forwards' }
  );
}

function boostPetals(){
  const layer = $('#petals');
  if (!layer) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rnd = mulberry32((Date.now() ^ 0xBADA55) >>> 0);
  const extra = isMobileLike() ? 5 : 8;

  for (let i = 0; i < extra; i++){
    const p = document.createElement('i');
    const r = rnd();
    const variant = r < 0.70 ? (rnd() < 0.5 ? 'p1' : 'p2') : (r < 0.90 ? 'p4' : 'p5');
    p.className = `petal ${variant}`;

    const x = 50 + (rnd() * 2 - 1) * 14;
    const size = (isMobileLike() ? 9.5 : 11.5) + rnd() * (isMobileLike() ? 8 : 11);
    const dur = (isMobileLike() ? 7.2 : 6.6) + rnd() * (isMobileLike() ? 2.6 : 3.0);
    const delay = -rnd() * 0.3;
    const sway = (rnd() * 2 - 1) * (isMobileLike() ? 12 : 18);
    const rot = (rnd() * 2 - 1) * 30;
    const spin = (rnd() < 0.5 ? -1 : 1) * (120 + rnd() * 180);
    const sc = 0.9 + rnd() * 0.55;
    const o = 0.36 + rnd() * 0.22;
    const blur = (rnd() < 0.35) ? (0.8 + rnd() * 1.2) : (0.2 + rnd() * 0.6);

    p.style.setProperty('--x', Math.max(6, Math.min(94, x)).toFixed(2) + '%');
    p.style.setProperty('--w', size.toFixed(2) + 'px');
    p.style.setProperty('--dur', dur.toFixed(2) + 's');
    p.style.setProperty('--delay', delay.toFixed(2) + 's');
    p.style.setProperty('--sway', sway.toFixed(2) + 'px');
    p.style.setProperty('--r', rot.toFixed(1) + 'deg');
    p.style.setProperty('--spin', spin.toFixed(1) + 'deg');
    p.style.setProperty('--sc', sc.toFixed(2));
    p.style.setProperty('--o', o.toFixed(2));
    p.style.setProperty('--blur', blur.toFixed(2) + 'px');

    layer.appendChild(p);

    // Limpieza: no acumular nodos
    window.setTimeout(() => p.remove(), Math.round(dur * 1000) + 400);
  }
}

function openExperience(){
  if (hasOpened) return;
  hasOpened = true;

  // Momento wow: micro-pop + destello suave (premium, no invasivo)
  if (btnOpen){
    btnOpen.classList.add('pop');
    window.setTimeout(() => btnOpen.classList.remove('pop'), 560);
  }
  if (flash){
    flash.animate(
      [
        { opacity: 0, transform: 'translateZ(0)' },
        { opacity: 1, transform: 'translateZ(0)' },
        { opacity: 0, transform: 'translateZ(0)' },
      ],
      { duration: 520, easing: 'cubic-bezier(.2,.85,.2,1)', fill: 'both' }
    );
  }

  document.body.classList.add('opening');
  window.setTimeout(() => document.body.classList.remove('opening'), 720);

  // Aumenta brevemente la sensación de "inicio" con más pétalos cerca del centro
  boostPetals();

  // Bloom sutil de la card antes de que se desvanezca (cinematográfico)
  const introInner = document.querySelector('.introInner');
  if (introInner){
    introInner.animate(
      [
        { transform: 'translateY(0) scale(1)', filter: 'brightness(1) blur(0px)' },
        { transform: 'translateY(-1px) scale(1.012)', filter: 'brightness(1.04) blur(0px)' },
        { transform: 'translateY(-2px) scale(1.006)', filter: 'brightness(1.02) blur(1px)' },
      ],
      { duration: 520, easing: 'cubic-bezier(.2,.85,.2,1)', fill: 'both' }
    );
  }

  document.body.classList.remove('intro-mode');

  if (hint) hint.textContent = 'Respira…';
  hideIntro();
  startVortex(1250);

  // Espera a que termine la transición para mostrar escena
  window.setTimeout(() => {
    if (intro) intro.style.display = 'none';
    showScene();
    // Arranca el texto con delay suave
    window.setTimeout(() => startTyping(), 980);
    if (hint) hint.textContent = 'Toca “Celebrar” cuando quieras ✨';
  }, 980);
}

// -----------------------------
// Init
// -----------------------------

document.body.classList.add('intro-mode');

buildPetals();
resizeCanvas();
resizeVortex();
loadPhotos();
startShootingStars();

if (headline) headline.textContent = NAME;
if (phraseEl) phraseEl.textContent = customPhrase;
if (subline) subline.textContent = 'Un momento pequeño para celebrar todo lo hermoso que eres.';

if (btnOpen) btnOpen.addEventListener('click', openExperience);

if (btnBack){
  btnBack.addEventListener('click', (e) => {
    e.stopPropagation();
    hasOpened = false;
    hideSceneToIntro();
  });
}

if (btnMusic){
  btnMusic.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
  });
}

if (footerLine){
  footerLine.setAttribute('role', 'button');
  footerLine.setAttribute('tabindex', '0');
  footerLine.addEventListener('click', revealSecretNote);
  footerLine.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      revealSecretNote();
    }
  });
}

if (tapHint){
  tapHint.addEventListener('click', (e) => {
    e.stopPropagation();
    revealSecretNote();
    if (secretNote && !secretNote.hidden){
      secretNote.animate(
        [
          { transform: 'translateY(0) scale(.98)', opacity: .4 },
          { transform: 'translateY(-2px) scale(1.02)', opacity: 1 },
          { transform: 'translateY(0) scale(1)', opacity: 1 },
        ],
        { duration: 620, easing: 'cubic-bezier(.2,.85,.2,1)' }
      );
    }
    burstSparklesFromElement(tapHint);
  });
}

if (scene){
  // En móvil (touch), el parallax suele causar lag.
  if (!mediaFine || mediaFine.matches){
    scene.addEventListener('pointermove', setParallaxFromEvent);
    scene.addEventListener('pointerleave', resetParallax);
  }
}

if (btnCelebrate){
  btnCelebrate.addEventListener('click', (e) => {
    e.stopPropagation();
    celebrateWithImpact();
  });
}

updateMusicButton(false);
