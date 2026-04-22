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

const customPhrase = '"Que este año te devuelva en sonrisas todo lo bonito que das."';

// Mensaje corto y emocional (sin bloques largos)
const messageLines = [
  `Feliz cumpleaños, ${NAME}.\n`,
  'Hoy no quería dejar pasar tu día.\n',
  'Que todo lo bonito te encuentre sin prisa…\n',
  'y que sonrías mucho, de verdad.\n',
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
const hint = $('#hint');
const flash = $('#flash');
const shootingLayer = $('#shooting');

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

function mulberry32(seed){
  let t = seed >>> 0;
  return function(){
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function buildStars(){
  const stars = $('#stars');
  if (!stars) return;
  const rnd = mulberry32(20260422);
  const base = Math.floor((window.innerWidth * window.innerHeight) / 14000);
  const cap = isMobileLike() ? 80 : 140;
  const count = Math.max(26, Math.min(cap, Math.floor(base * (isMobileLike() ? 0.62 : 1))));
  stars.innerHTML = '';

  for (let i = 0; i < count; i++){
    const s = document.createElement('i');
    s.className = 'star';
    const x = rnd() * 100;
    const y = rnd() * 100;
    const tw = 2.0 + rnd() * 3.8;
    const td = -rnd() * 4.5;
    const sd = 14 + rnd() * 22;
    const dd = -rnd() * sd;
    const size = 1 + rnd() * 2.2;
    const dx = (rnd() * 2 - 1) * (8 + rnd() * 12);
    const dy = (rnd() * 2 - 1) * (6 + rnd() * 10);

    s.style.left = x + '%';
    s.style.top = y + '%';
    s.style.width = size + 'px';
    s.style.height = size + 'px';

    s.style.setProperty('--tw', tw + 's');
    s.style.setProperty('--td', td + 's');
    s.style.setProperty('--sd', sd + 's');
    s.style.setProperty('--dd', dd + 's');
    s.style.setProperty('--dx', dx.toFixed(2) + 'px');
    s.style.setProperty('--dy', dy.toFixed(2) + 'px');
    stars.appendChild(s);
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
      return true;
    }
  }
  return false;
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
}

function startTyping(){
  stopTyping();
  typingIndex = 0;
  typingText = messageLines.join('');
  typed.textContent = '';
  typeTick();
}

function typeTick(){
  const baseDelay = 18;
  const ch = typingText[typingIndex];
  if (ch == null){
    typingTimer = null;
    return;
  }

  typed.textContent += ch;
  typingIndex++;

  let delay = baseDelay;
  if (ch === '\n') delay = 120;
  if (ch === '.' || ch === '…') delay = 180;
  if (ch === ',') delay = 90;

  typingTimer = window.setTimeout(typeTick, delay);
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
  const colors = ['#a855f7', '#22d3ee', '#1d4ed8', '#fb7185', '#ffffff'];
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
  const palette = ['#a855f7', '#22d3ee', '#1d4ed8', '#ffffff'];

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
    launchConfetti(120);
  }, 170);
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

if (btnReplay){
  btnReplay.addEventListener('click', (e) => {
    e.stopPropagation();
    startTyping();
  });
}

window.addEventListener('resize', () => {
  buildStars();
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
  // Asegura que las imágenes tengan src (algunos navegadores difieren el render si estaba hidden)
  loadPhotos();

  // Secuencia de aparición (no todo al mismo tiempo)
  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      scene.classList.add('ready');
    }, 80);
  });
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

function openExperience(){
  if (hasOpened) return;
  hasOpened = true;

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

buildStars();
resizeCanvas();
resizeVortex();
loadPhotos();
startShootingStars();

if (headline) headline.textContent = NAME;
if (phraseEl) phraseEl.textContent = customPhrase;
if (subline) subline.textContent = 'Que esta noche te recuerde lo valiosa que eres.';

if (btnOpen) btnOpen.addEventListener('click', openExperience);

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
    burstSparklesFromElement(btnCelebrate);
    flashThenConfetti();
  });
}
