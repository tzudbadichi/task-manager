// Celebration effects: confetti drawn on a canvas, and an optional short chime (Web Audio, so no
// sound file is loaded). Confetti is skipped when the user asked for reduced motion; the chime is not.
// All bursts share one canvas and one animation loop, so quick clicks do not stack full-screen canvases.

const BIG_BURST = Object.freeze({ count: 140, speed: 11, durationMs: 2200 });
const SMALL_BURST = Object.freeze({ count: 18, speed: 5, durationMs: 900 });
const GRAVITY = 0.32;
const DRAG = 0.985;
const FADE_FROM = 0.7; // share of a particle's life after which it fades out
const BASE_COLORS = Object.freeze(['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#a855f7', '#ef4444']);

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let audioContext = null;
let effects = null; // { canvas, context, width, height, particles }

export function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

// A modal dialog sits in the top layer, so the canvas must live inside the top open dialog to be seen.
function effectsHost() {
  const openDialogs = document.querySelectorAll('dialog[open]');
  return openDialogs.length > 0 ? openDialogs[openDialogs.length - 1] : document.body;
}

/** The shared canvas over the visible area (CSS: fixed, inset 0), moved to the current host if needed. */
function ensureEffects() {
  const host = effectsHost();
  if (effects?.canvas.isConnected) {
    if (effects.canvas.parentElement !== host) host.append(effects.canvas);
    return effects;
  }
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = document.documentElement.clientWidth || window.innerWidth;
  const height = document.documentElement.clientHeight || window.innerHeight;
  const canvas = document.createElement('canvas');
  canvas.className = 'effects-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.scale(pixelRatio, pixelRatio);
  host.append(canvas);
  effects = { canvas, context, width, height, particles: [] };
  requestAnimationFrame(drawFrame);
  return effects;
}

function drawFrame(timestamp) {
  if (!effects) return;
  const { canvas, context, width, height } = effects;
  effects.particles = effects.particles.filter(particle => timestamp - particle.bornAt < particle.lifeMs);
  if (effects.particles.length === 0 || !canvas.isConnected) {
    canvas.remove();
    effects = null;
    return;
  }
  context.clearRect(0, 0, width, height);
  for (const particle of effects.particles) {
    const age = (timestamp - particle.bornAt) / particle.lifeMs;
    particle.vx *= DRAG;
    particle.vy = particle.vy * DRAG + GRAVITY;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.rotation += particle.spin;
    context.save();
    context.globalAlpha = age < FADE_FROM ? 1 : Math.max(0, 1 - (age - FADE_FROM) / (1 - FADE_FROM));
    context.translate(particle.x, particle.y);
    context.rotate(particle.rotation);
    context.fillStyle = particle.color;
    if (particle.isCircle) {
      context.beginPath();
      context.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
    }
    context.restore();
  }
  requestAnimationFrame(drawFrame);
}

/**
 * Confetti from a point on the screen. size: 'big' (a whole task done) or 'small' (one subtask).
 * colors: extra colors to mix in (the task's category color, the seasonal accent).
 */
export function burstConfetti({ x = window.innerWidth / 2, y = window.innerHeight / 3, size = 'big', colors = [] } = {}) {
  if (prefersReducedMotion()) return;
  const layer = ensureEffects();
  if (!layer) return;
  const settings = size === 'small' ? SMALL_BURST : BIG_BURST;
  const palette = [...colors.filter(Boolean), ...BASE_COLORS];
  const bornAt = performance.now();
  for (let index = 0; index < settings.count; index += 1) {
    // Mostly upwards, fanning out to both sides.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const speed = settings.speed * (0.45 + Math.random() * 0.75);
    layer.particles.push({
      x, y, bornAt,
      lifeMs: settings.durationMs,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 5,
      color: palette[Math.floor(Math.random() * palette.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.4,
      isCircle: Math.random() < 0.3,
    });
  }
}

/** A short rising chime (C - E - G - C). Must be called from a user gesture (a click), as browsers require. */
export function playChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ??= new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    const start = audioContext.currentTime + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const noteStart = start + index * 0.09;
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, noteStart);
      gain.gain.linearRampToValueAtTime(0.09, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.45);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.5);
    });
  } catch {
    // Sound is a nicety; a browser that refuses it just stays quiet.
  }
}
