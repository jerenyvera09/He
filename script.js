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
const linesText = typed ? typed.parentElement : null;
const btnCelebrate = $('#btnCelebrate');
const btnReplay = $('#btnReplay');
const btnBack = $('#btnBack');
const btnMusic = $('#btnMusic');
const bgMusic = $('#bgMusic');
const hint = $('#hint');
const footerLine = $('#footerLine');
const secretNote = $('#secretNote');
const tapHint = $('#tapHint');
const celebrateOverlay = $('#celebrateOverlay');
const celebrateTitle = celebrateOverlay ? celebrateOverlay.querySelector('.celebrateTitle') : null;
const celebrateText = celebrateOverlay ? celebrateOverlay.querySelector('.celebrateText') : null;
const flash = $('#flash');
const shootingLayer = $('#shooting');
const magicLayer = $('#magic');

const musicLabel = btnMusic ? btnMusic.querySelector('[data-music-label]') : null;
const musicIcon = btnMusic ? btnMusic.querySelector('.icon') : null;

const MUSIC_SRC = 'assets/music/neztor.mp3';
const MUSIC_VOLUME = 0.3;
const MUSIC_FADE_IN_MS = 900;
const MUSIC_FADE_OUT_MS = 320;
const SECRET_NOTE_VISIBLE_MS = 5800;
const SECRET_NOTE_HIDE_MS = 760;
const CELEBRATE_OVERLAY_MS = 5200;
const CELEBRATE_CLEAR_MS = 5400;
const SECRET_NOTE_MESSAGE = `Si llegaste hasta aquí… es porque esto era para ti 💌
No es algo grande… pero está hecho con todo mi cariño 💖
Ojalá esta pequeña sorpresa te saque una sonrisa…
porque verte feliz… vale todo ✨🌸`;

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
let musicPlaying = false;
let musicFadeRAF = null;
let secretNoteTimer = null;
let secretNoteHideTimer = null;

function clearSceneTimers(){
  for (const timer of sceneTimers) window.clearTimeout(timer);
  sceneTimers = [];
  clearSecretNoteTimer();
  clearSecretNoteHideTimer();
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

function ensureMusicElement(){
  if (!bgMusic) return null;
  bgMusic.loop = true;
  bgMusic.preload = 'metadata';
  if (!bgMusic.getAttribute('src') && !bgMusic.currentSrc){
    bgMusic.src = MUSIC_SRC;
  }
  return bgMusic;
}

function cancelMusicFade(){
  if (!musicFadeRAF) return;
  window.cancelAnimationFrame(musicFadeRAF);
  musicFadeRAF = null;
}

function fadeMusicVolume(audio, target, duration, onComplete){
  cancelMusicFade();
  const start = performance.now();
  const from = Number.isFinite(audio.volume) ? audio.volume : 0;
  const delta = target - from;

  const tick = (now) => {
    const progress = duration <= 0 ? 1 : Math.min(1, (now - start) / duration);
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    audio.volume = Math.max(0, Math.min(1, from + delta * eased));

    if (progress < 1){
      musicFadeRAF = window.requestAnimationFrame(tick);
      return;
    }

    musicFadeRAF = null;
    if (onComplete) onComplete();
  };

  musicFadeRAF = window.requestAnimationFrame(tick);
}

function markMusicUnavailable(error){
  if (btnMusic) btnMusic.classList.add('is-unavailable');
  updateMusicButton(false);
  if (bgMusic){
    cancelMusicFade();
    bgMusic.pause();
    bgMusic.volume = MUSIC_VOLUME;
  }
  if (error) console.warn(`No se pudo reproducir ${MUSIC_SRC}.`, error);
}

async function startMusic(){
  const audio = ensureMusicElement();
  if (!audio) return;

  cancelMusicFade();
  if (btnMusic) btnMusic.classList.remove('is-unavailable');

  try{
    if (audio.readyState === 0) audio.load();
    audio.volume = 0.001;

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function'){
      await playPromise;
    }

    updateMusicButton(true);
    fadeMusicVolume(audio, MUSIC_VOLUME, MUSIC_FADE_IN_MS);
  } catch (error){
    markMusicUnavailable(error);
  }
}

async function pauseMusic(options = {}){
  const { immediate = false } = options;
  const audio = ensureMusicElement();
  if (!audio){
    updateMusicButton(false);
    return;
  }

  cancelMusicFade();

  if (immediate || audio.paused){
    audio.pause();
    audio.volume = MUSIC_VOLUME;
    updateMusicButton(false);
    return;
  }

  updateMusicButton(false);
  fadeMusicVolume(audio, 0.001, MUSIC_FADE_OUT_MS, () => {
    audio.pause();
    audio.volume = MUSIC_VOLUME;
  });
}

async function toggleMusic(){
  if (musicPlaying) await pauseMusic();
  else await startMusic();
}

function clearSecretNoteTimer(){
  if (!secretNoteTimer) return;
  window.clearTimeout(secretNoteTimer);
  secretNoteTimer = null;
}

function clearSecretNoteHideTimer(){
  if (!secretNoteHideTimer) return;
  window.clearTimeout(secretNoteHideTimer);
  secretNoteHideTimer = null;
}

function hideSecretNote(options = {}){
  const { immediate = false } = options;
  if (!secretNote) return;

  clearSecretNoteTimer();
  clearSecretNoteHideTimer();
  secretNote.classList.remove('reveal');

  const finish = () => {
    if (secretNote.classList.contains('reveal')) return;
    secretNote.hidden = true;
    if (tapHint) tapHint.classList.remove('is-revealed');
  };

  if (immediate){
    finish();
    return;
  }

  secretNoteHideTimer = window.setTimeout(() => {
    secretNoteHideTimer = null;
    finish();
  }, SECRET_NOTE_HIDE_MS);
}

function revealSecretNote(){
  if (!secretNote) return;

  clearSecretNoteTimer();
  clearSecretNoteHideTimer();
  secretNote.hidden = false;
  secretNote.classList.remove('reveal');
  if (tapHint) tapHint.classList.add('is-revealed');

  // Reinicia la transición si la mini tarjeta ya estaba visible.
  // eslint-disable-next-line no-unused-expressions
  secretNote.offsetWidth;

  window.requestAnimationFrame(() => {
    secretNote.classList.add('reveal');
  });

  if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
    secretNote.animate(
      [
        { opacity: 0, transform: 'translateY(12px) scale(.94)', filter: 'blur(12px)' },
        { opacity: 1, transform: 'translateY(0) scale(1.02)', filter: 'blur(0px)', offset: 0.42 },
        { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0px)' },
      ],
      { duration: 880, easing: 'cubic-bezier(.2,.85,.2,1)' }
    );

    if (tapHint){
      tapHint.animate(
        [
          { transform: 'translateY(0) scale(1)', filter: 'brightness(1)' },
          { transform: 'translateY(-1px) scale(1.04)', filter: 'brightness(1.06)' },
          { transform: 'translateY(0) scale(1)', filter: 'brightness(1)' },
        ],
        { duration: 620, easing: 'cubic-bezier(.2,.85,.2,1)' }
      );
    }
  }

  secretNoteTimer = window.setTimeout(() => {
    hideSecretNote();
  }, SECRET_NOTE_VISIBLE_MS);
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
  const cap = isMobileLike() ? 16 : 27;
  const count = Math.max(10, Math.min(cap, Math.floor(base * (isMobileLike() ? 0.6 : 0.72))));

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
    let size = (isMobileLike() ? 8.2 : 10.2) + rnd() * (isMobileLike() ? 7 : 10);
    let dur = (isMobileLike() ? 15.2 : 17.8) + rnd() * (isMobileLike() ? 11.5 : 14.5);
    const delay = -rnd() * dur;
    const sway = (rnd() * 2 - 1) * (isMobileLike() ? 14 : 22);
    const rot = (rnd() * 2 - 1) * 35;
    const spin = (rnd() < 0.5 ? -1 : 1) * (110 + rnd() * 160);
    const sc = 0.78 + rnd() * 0.55;
    let o = 0.08 + rnd() * 0.22;

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
  if (linesText) linesText.classList.remove('is-typing', 'is-done');
}

function startTyping(){
  stopTyping();
  typingIndex = 0;
  typingText = '';
  typingLineIndex = 0;
  typingLines = messageLines.map((line) => line.trimEnd()).filter(Boolean);
  typed.textContent = '';
  if (linesText) linesText.classList.add('is-typing');
  typeNextLine();
}

function typeNextLine(){
  const line = typingLines[typingLineIndex];
  if (line == null){
    typingLineTimer = null;
    if (linesText){
      linesText.classList.remove('is-typing');
      linesText.classList.add('is-done');
    }
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
  const baseDelay = 22;
  const ch = line[typingIndex];
  if (ch == null){
    lineEl.classList.add('done');
    typingIndex = 0;
    typingLineIndex++;
    typingLineTimer = window.setTimeout(typeNextLine, 260);
    return;
  }

  lineEl.textContent += ch;
  typingIndex++;

  let delay = baseDelay;
  if (ch === '.' || ch === '!' || ch === '?' || ch === '…') delay = 210;
  if (ch === ',') delay = 105;

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

function launchConfetti(intensity = 98){
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
      vx: (Math.random() - 0.5) * 1.2,
      vy: 1.55 + Math.random() * 2.15,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.07,
      size: ribbon ? (4 + Math.random() * 7) : (8 + Math.random() * 10),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      ttl: 540 + Math.random() * 220,
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
    const alpha = Math.min(1, fade * 0.82);

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
    launchConfetti(96);
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
  queueSceneTimer(() => boostPetals(), 360);
  queueSceneTimer(() => boostPetals(), 760);
  emitMagicBubbles();
  if (celebrateOverlay){
    for (const animation of celebrateOverlay.getAnimations()){
      animation.cancel();
    }
    celebrateOverlay.classList.remove('show');
    celebrateOverlay.animate(
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.10 },
        { opacity: 1, offset: 0.84 },
        { opacity: 0 },
      ],
      { duration: CELEBRATE_OVERLAY_MS, easing: 'cubic-bezier(.2,.85,.2,1)', fill: 'both' }
    );
    window.requestAnimationFrame(() => celebrateOverlay.classList.add('show'));
  }
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight * (isMobileLike() ? 0.42 : 0.44);
  queueSceneTimer(() => burstSparklesAt(centerX, centerY, isMobileLike() ? 12 : 18, 24, 70), 140);
  queueSceneTimer(() => burstSparklesAt(centerX, centerY - 10, isMobileLike() ? 10 : 14, 16, 54), 420);
  queueSceneTimer(() => burstSparklesAt(centerX, centerY - 14, isMobileLike() ? 8 : 12, 14, 40), 980);
  flashThenConfetti();
  queueSceneTimer(() => clearOverlayState(), CELEBRATE_CLEAR_MS);
}

function burstSparklesFromElement(el){
  if (!el) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  burstSparklesAt(x, y, 10, 18, 40);
}

function burstSparklesAt(x, y, count = 10, minMag = 18, maxMag = 40){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < count; i++){
    const p = document.createElement('i');
    p.className = 'sparkParticle';
    const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.18;
    const mag = minMag + Math.random() * (maxMag - minMag);
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

  // Origen: parte baja y centrada, para acompaÃ±ar el overlay sin verse suelto
  const originX = vw * 0.5;
  const originY = vh - Math.max(44, Math.min(vh * 0.16, 150));

  const count = isMobileLike() ? 10 : 14;
  for (let i = 0; i < count; i++){
    const b = document.createElement('i');
    b.className = 'magicBubble bubble';

    const size = (isMobileLike() ? 9 : 11) + Math.random() * (isMobileLike() ? 14 : 20);
    const sx = originX + (Math.random() - 0.5) * 80;
    const sy = originY + (Math.random() - 0.5) * 30;
    const dx = (Math.random() - 0.5) * 180;
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
  hideSecretNote({ immediate: true });
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
  hideSecretNote({ immediate: true });
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
  const extra = isMobileLike() ? 3 : 6;

  for (let i = 0; i < extra; i++){
    const p = document.createElement('i');
    const r = rnd();
    const variant = r < 0.70 ? (rnd() < 0.5 ? 'p1' : 'p2') : (r < 0.90 ? 'p4' : 'p5');
    p.className = `petal ${variant}`;

    const x = 50 + (rnd() * 2 - 1) * 14;
    const size = (isMobileLike() ? 8.8 : 10.8) + rnd() * (isMobileLike() ? 7.2 : 9.2);
    const dur = (isMobileLike() ? 8.6 : 8.0) + rnd() * (isMobileLike() ? 3.4 : 3.8);
    const delay = -rnd() * 0.3;
    const sway = (rnd() * 2 - 1) * (isMobileLike() ? 12 : 18);
    const rot = (rnd() * 2 - 1) * 30;
    const spin = (rnd() < 0.5 ? -1 : 1) * (120 + rnd() * 180);
    const sc = 0.9 + rnd() * 0.55;
    const o = 0.22 + rnd() * 0.16;
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
if (bgMusic){
  bgMusic.src = MUSIC_SRC;
  bgMusic.volume = MUSIC_VOLUME;
  bgMusic.loop = true;
  bgMusic.preload = 'metadata';
  bgMusic.addEventListener('error', () => {
    if (!musicPlaying) return;
    markMusicUnavailable(bgMusic.error || new Error(`No se pudo cargar ${MUSIC_SRC}.`));
  });
}

if (headline) headline.textContent = NAME;
if (phraseEl) phraseEl.textContent = customPhrase;
if (subline) subline.textContent = 'Un momento pequeño para celebrar todo lo hermoso que eres.';
if (secretNote) secretNote.textContent = SECRET_NOTE_MESSAGE;
if (celebrateTitle) celebrateTitle.textContent = `Feliz cumpleaños, ${NAME} 💖`;
if (celebrateText) celebrateText.textContent = 'Eres muy especial';

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
