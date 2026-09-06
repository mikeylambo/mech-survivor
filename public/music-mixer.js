// Adaptive music mixer.
//
// The thing being built here is the MIXER, not the music. The procedural score
// underneath is a speed-build scaffold and is meant to be replaced: every layer
// is a named bus with its own gain, and `attachSource` swaps whatever is
// feeding that bus without touching the state machine, the ramp scheduling or
// the mix table. Dropping in real composed stems later is a source swap, not a
// rewrite.
//
// The contract the tests hold this to:
//
//   * every state transition SCHEDULES a gain ramp of 20-250ms
//   * no transition ever assigns a live layer's gain discontinuously
//   * TOTALITY, ZENITH and the False Sun each resolve to a distinct mix
//
// "No audible pop" is not provable from a Node build, so it is not claimed.
// What is provable is that the ramps are real and nothing is set instantly —
// which is the mechanical cause of pops. Final ears-on judgement is a human
// listening test.

/** Named buses. Order is render order in the debug readout, nothing more. */
export const LAYERS = ['bed', 'pulse', 'motif', 'threat', 'choir', 'glare'];

export const MIN_RAMP = 0.02;
export const MAX_RAMP = 0.25;
export const DEFAULT_RAMP = 0.12;

/**
 * State -> target gain per layer. A state is a mix, not a track: the same six
 * buses are always running, and the music changes by what is audible.
 */
export const MIX = {
  silent: {bed: 0, pulse: 0, motif: 0, threat: 0, choir: 0, glare: 0},
  // Between runs: open, patient, no threat content at all.
  observatory: {bed: 0.55, pulse: 0.06, motif: 0.34, threat: 0, choir: 0.18, glare: 0},
  // First light. The run has not noticed you yet.
  rising: {bed: 0.62, pulse: 0.22, motif: 0.30, threat: 0.04, choir: 0.10, glare: 0.03},
  // Ordinary orbit pressure.
  orbit: {bed: 0.58, pulse: 0.46, motif: 0.26, threat: 0.16, choir: 0.08, glare: 0.10},
  // The field is getting heavy.
  pressure: {bed: 0.48, pulse: 0.66, motif: 0.18, threat: 0.40, choir: 0.06, glare: 0.22},
  elite: {bed: 0.42, pulse: 0.72, motif: 0.14, threat: 0.58, choir: 0.10, glare: 0.30},
  // An orbit commander holds the field.
  commander: {bed: 0.36, pulse: 0.70, motif: 0.10, threat: 0.76, choir: 0.34, glare: 0.42},
  // The False Sun. Choir takes over; the glare is the loudest thing in the mix.
  'false-sun': {bed: 0.28, pulse: 0.62, motif: 0.08, threat: 0.70, choir: 0.88, glare: 0.92},
  // TOTALITY: full corruption. The bed drops out and the sky is all that is left.
  totality: {bed: 0.10, pulse: 0.38, motif: 0.04, threat: 0.52, choir: 0.94, glare: 0.70},
  // ZENITH: mastery. Bright, wide, no threat content.
  zenith: {bed: 0.70, pulse: 0.30, motif: 0.86, threat: 0, choir: 0.62, glare: 0.14},
  victory: {bed: 0.66, pulse: 0.20, motif: 0.72, threat: 0, choir: 0.44, glare: 0.06},
  death: {bed: 0.30, pulse: 0, motif: 0.12, threat: 0, choir: 0.26, glare: 0},
};

export const STATES = Object.keys(MIX);

/** How long each transition takes. All inside the 20-250ms contract. */
export const RAMPS = {
  'false-sun': 0.24,
  totality: 0.24,
  zenith: 0.22,
  commander: 0.18,
  death: 0.20,
  victory: 0.20,
  silent: 0.16,
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * Build the mixer graph.
 *
 * master -> music -> [layer buses] and master -> sfx, so the settings split is
 * a property of the graph rather than a number multiplied in by hand at every
 * call site.
 */
export function createMusicMixer(ctx, destination = ctx.destination) {
  const master = ctx.createGain();
  const music = ctx.createGain();
  const sfx = ctx.createGain();
  master.gain.value = 1;
  music.gain.value = 0.6;
  sfx.gain.value = 0.9;
  master.connect(destination);
  music.connect(master);
  sfx.connect(master);

  const layers = {};
  for (const name of LAYERS) {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(music);
    layers[name] = {name, gain, source: null};
  }

  return {ctx, master, music, sfx, layers, state: null, pending: null, transitions: []};
}

/** Plug a source — scaffold oscillator now, composed stem later — into a bus. */
export function attachSource(mixer, layerName, node) {
  const layer = mixer.layers[layerName];
  if (!layer) throw new Error(`music-mixer: no layer "${layerName}"`);
  if (layer.source && layer.source.disconnect) {
    try { layer.source.disconnect(); } catch { /* already detached */ }
  }
  layer.source = node;
  if (node && node.connect) node.connect(layer.gain);
  return layer;
}

/**
 * Move to a music state. Every layer is RAMPED, never assigned: an instant gain
 * change on a running oscillator is the mechanical cause of a click, so the
 * mixer has no code path that does it.
 */
export function setMusicState(mixer, state, {ramp} = {}) {
  const target = MIX[state];
  if (!target) throw new Error(`music-mixer: unknown state "${state}"`);
  if (mixer.state === state) return null;

  const seconds = Math.max(MIN_RAMP, Math.min(MAX_RAMP, ramp ?? RAMPS[state] ?? DEFAULT_RAMP));
  const now = mixer.ctx.currentTime;
  const from = mixer.state;
  mixer.state = state;

  for (const name of LAYERS) {
    const param = mixer.layers[name].gain.gain;
    const value = clamp01(target[name] ?? 0);
    // Anchor at the current value first, or the ramp would start from whatever
    // was last scheduled rather than from what is actually being heard.
    if (param.cancelScheduledValues) param.cancelScheduledValues(now);
    if (param.setValueAtTime) param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + seconds);
  }

  const transition = {from, to: state, ramp: seconds, at: now};
  mixer.transitions.push(transition);
  return transition;
}

/**
 * The state a live run resolves to. One function so the mapping is inspectable
 * and testable rather than scattered through the game loop.
 */
export function musicStateFor({
  screen = 'run', corruption = 0, commander = null, finalCommander = false,
  elapsed = 0, enemies = 0, elite = false, cleared = false, dead = false, zenith = false,
} = {}) {
  if (screen === 'menu') return 'observatory';
  if (dead) return 'death';
  if (zenith) return 'zenith';
  if (cleared) return 'victory';
  if (corruption >= 1) return 'totality';
  if (commander) return finalCommander ? 'false-sun' : 'commander';
  if (elite) return 'elite';
  if (elapsed < 45) return 'rising';
  return enemies >= 60 ? 'pressure' : 'orbit';
}

/** Master / music / SFX split, ramped like everything else. */
export function setBusVolume(mixer, bus, value, ramp = 0.05) {
  const node = {master: mixer.master, music: mixer.music, sfx: mixer.sfx}[bus];
  if (!node) throw new Error(`music-mixer: no bus "${bus}"`);
  const param = node.gain;
  const now = mixer.ctx.currentTime;
  const target = clamp01(value);
  if (param.cancelScheduledValues) param.cancelScheduledValues(now);
  if (param.setValueAtTime) param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(target, now + Math.max(MIN_RAMP, ramp));
  return target;
}

/**
 * The scaffold score: one detuned voice per bus. Deliberately plain. Replacing
 * it means calling attachSource with a real buffer source and deleting this.
 */
export function startScaffoldScore(mixer, {root = 55} = {}) {
  const {ctx} = mixer;
  const voices = [];
  const spec = {
    bed: {type: 'sine', mult: 1, detune: 0},
    pulse: {type: 'triangle', mult: 2, detune: 4},
    motif: {type: 'sine', mult: 3, detune: -6},
    threat: {type: 'sawtooth', mult: 1.5, detune: 11},
    choir: {type: 'sine', mult: 4, detune: -14},
    glare: {type: 'sawtooth', mult: 6, detune: 17},
  };
  for (const name of LAYERS) {
    const s = spec[name];
    const osc = ctx.createOscillator();
    osc.type = s.type;
    if (osc.frequency && 'value' in osc.frequency) osc.frequency.value = root * s.mult;
    if (osc.detune && 'value' in osc.detune) osc.detune.value = s.detune;
    attachSource(mixer, name, osc);
    if (osc.start) osc.start();
    voices.push(osc);
  }
  return voices;
}
