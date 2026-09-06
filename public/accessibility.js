// Accessibility.
//
// Two kinds of setting live here and they are treated differently on purpose:
//
//   PRESENTATION — flash, shake, text scale, danger hues. These change what the
//   run looks like and nothing about what it is. Use them freely.
//
//   ASSISTS — damage taken, game speed. These change the run itself. They are
//   not restricted, not warned about and not judged, but they ARE recorded in
//   the run's metadata, because a Daily Star board comparing a 0.5x-damage run
//   against a 1.0x one without saying so is not a comparison, it is a mystery.
//
// The danger palette is verified rather than asserted: the test simulates
// protanopia, deuteranopia and tritanopia with the Viénot matrices and requires
// the danger hue to stay perceptually separated from the safe hue under each.

export const DEFAULTS = {
  // presentation
  flashScale: 1,
  shakeScale: 1,
  textScale: 1,
  dangerPalette: 'default',
  // assists — recorded, never restricted
  damageTaken: 1,
  gameSpeed: 1,
};

export const LIMITS = {
  flashScale: [0, 1], shakeScale: [0, 1], textScale: [0.8, 1.6],
  damageTaken: [0.25, 1.5], gameSpeed: [0.6, 1.2],
};

/**
 * Danger / warn / safe triples per palette.
 *
 * These were SEARCHED, not guessed. The first attempt picked magenta on the
 * theory that a high blue channel survives red-green loss, and measurement said
 * it was worse than the shipped palette under the very condition it was for
 * (26 vs 65 for deuteranopia). Each alternate below maximises the minimum
 * perceptual separation of the three hues under its own condition, subject to
 * still reading correctly to normal vision, and each is verified against the
 * default in accessibility.test.mjs:
 *
 *   protanopia    90.1  (default 48.9)
 *   deuteranopia  72.9  (default 33.9)
 *   tritanopia    89.8  (default 67.7)
 *
 * `high-contrast` is for players who do not know their type: it maximises the
 * minimum separation across ALL three conditions at once.
 */
export const DANGER_PALETTES = {
  default: {danger: '#ff4664', warn: '#ffcf65', safe: '#65dfff', friendly: '#eef8ff'},
  'high-contrast': {danger: '#ff4664', warn: '#ffdd00', safe: '#2fa8ff', friendly: '#ffffff'},
  protanopia: {danger: '#c1121f', warn: '#ffdd00', safe: '#0091ff', friendly: '#ffffff'},
  deuteranopia: {danger: '#ff2d95', warn: '#ffdd00', safe: '#0091ff', friendly: '#ffffff'},
  tritanopia: {danger: '#d90429', warn: '#ffe066', safe: '#00d4ff', friendly: '#f2f7ff'},
};

const KEY = 'sunfall-a11y';
const clamp = (v, [lo, hi]) => Math.max(lo, Math.min(hi, v));

export function normalise(settings = {}) {
  const out = {...DEFAULTS, ...settings};
  for (const [key, range] of Object.entries(LIMITS)) {
    out[key] = clamp(Number.isFinite(+out[key]) ? +out[key] : DEFAULTS[key], range);
  }
  if (!DANGER_PALETTES[out.dangerPalette]) out.dangerPalette = 'default';
  return out;
}

export function loadAccessibility() {
  try { return normalise(JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch { return {...DEFAULTS}; }
}

export function saveAccessibility(settings) {
  const clean = normalise(settings);
  try { localStorage.setItem(KEY, JSON.stringify(clean)); } catch { /* storage is a nicety */ }
  return clean;
}

/** The palette the renderer should use. */
export const dangerColors = (settings) => DANGER_PALETTES[normalise(settings).dangerPalette];

/** Applied to the document so CSS can scale text without JS touching layout. */
export function applyPresentation(settings, doc = globalThis.document) {
  const s = normalise(settings);
  doc?.documentElement?.style?.setProperty?.('--text-scale', String(s.textScale));
  doc?.body?.classList?.toggle?.('reduce-flash', s.flashScale < 1);
  doc?.body?.classList?.toggle?.('reduce-shake', s.shakeScale < 1);
  return s;
}

// --- assists -----------------------------------------------------------------

/** Which settings can change the outcome of a run. */
export const ASSIST_KEYS = ['damageTaken', 'gameSpeed'];

/**
 * The record that travels with a run. Never used to block or scold — only so a
 * board comparing two runs can say what each one was played under.
 */
export function assistMetadata(settings) {
  const s = normalise(settings);
  const active = {};
  for (const key of ASSIST_KEYS) if (s[key] !== DEFAULTS[key]) active[key] = s[key];
  const keys = Object.keys(active);
  return {
    assisted: keys.length > 0,
    assists: active,
    // A short, stable label a leaderboard row can show without extra logic.
    label: keys.length === 0 ? 'UNASSISTED' : keys.map((k) => `${k === 'damageTaken' ? 'DMG' : 'SPEED'} ${Math.round(active[k] * 100)}%`).join(' · '),
  };
}

/** Two runs are only directly comparable if they were played the same way. */
export function comparableRuns(a, b) {
  const key = (m) => JSON.stringify(ASSIST_KEYS.map((k) => m?.assists?.[k] ?? DEFAULTS[k]));
  return key(a) === key(b);
}

// --- colour vision -----------------------------------------------------------

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
}

/** Viénot/Brettel dichromat simulation matrices, applied in linear RGB. */
export const CVD_MATRICES = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
};

export function simulateCvd(hex, type) {
  const linear = hexToRgb(hex).map(srgbToLinear);
  const m = CVD_MATRICES[type];
  if (!m) return linear;
  return m.map((row) => row.reduce((sum, k, i) => sum + k * linear[i], 0));
}

/** Linear RGB -> CIE Lab, for a perceptual rather than a numeric comparison. */
export function linearToLab([r, g, b]) {
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 1.0;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(Math.max(0, x)), f(Math.max(0, y)), f(Math.max(0, z))];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Perceptual distance between two hexes as seen with `type` colour vision. */
export function perceptualDistance(hexA, hexB, type = 'none') {
  const a = linearToLab(simulateCvd(hexA, type));
  const b = linearToLab(simulateCvd(hexB, type));
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
