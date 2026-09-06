// One seeded random stream per run.
//
// Built here rather than in the determinism workstream because everything added
// after this point would otherwise reach for Math.random and have to be
// rewritten. A run's randomness is a property of its seed, not of when it
// happened to be played.
//
// splitmix64-style mixing over 32-bit state: small, fast, no dependencies, and
// good enough that weighted picks do not visibly clump.

/** Deterministic 32-bit hash of a string, so a seed can be a word. */
export function hashSeed(seed) {
  let h = 2166136261 >>> 0;
  const text = String(seed ?? '');
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function createRng(seed = 1) {
  let state = (typeof seed === 'number' ? seed : hashSeed(seed)) >>> 0;
  if (state === 0) state = 0x9e3779b9;
  const next = () => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
    return ((z ^ (z >>> 15)) >>> 0) / 4294967296;
  };
  next.int = (max) => Math.floor(next() * max);
  next.range = (a, b) => a + next() * (b - a);
  next.pick = (list) => list[Math.floor(next() * list.length)];
  next.chance = (p) => next() < p;
  /** Weighted pick over [{weight}] entries. */
  next.weighted = (entries, weightOf = (e) => e.weight ?? 1) => {
    let total = 0;
    for (const e of entries) total += Math.max(0, weightOf(e));
    if (total <= 0) return entries[0];
    let roll = next() * total;
    for (const e of entries) {
      roll -= Math.max(0, weightOf(e));
      if (roll <= 0) return e;
    }
    return entries[entries.length - 1];
  };
  /** A named child stream, so one subsystem's draws cannot shift another's. */
  next.fork = (label) => createRng(hashSeed(`${state}:${label}`));
  next.state = () => state >>> 0;
  return next;
}

/** The stream a run uses. Replaced on every reset(); never global Math.random. */
let current = createRng(1);
export function setRunSeed(seed) {
  current = createRng(seed);
  return current;
}
export function runRng() { return current; }
/** Convenience: the run's own float, for call sites that just want a number. */
export const rand01 = () => current();
