// The single copy of every arsenal magnitude formula.
//
// `arsenal-runtime.js` imports these to decide what actually happens, and the
// upgrade cards import them to say what will happen. There is deliberately no
// second hand-typed copy anywhere: a card that disagrees with the runtime is a
// lie, and the only way to guarantee it cannot happen is to make it the same
// function.
//
// Each metric declares a DIRECTION. "Better" is not always "bigger" — cooldown
// falls, spread may narrow on purpose, and a branch may trade charge time for
// damage. The progression test checks tier-over-tier against the declared
// direction rather than a blind N+1 >= N, which would force every number
// upward and quietly forbid honest trade-offs.
import {familyPower} from './arsenal.js';

export const DIRECTION = {
  UP: 'increase',
  DOWN: 'decrease',
  /** Genuinely a trade-off or a branch-flavour choice; progression is not ordered. */
  DESIGN: 'non-monotonic-by-design',
};

/** Effective level, matching the runtime exactly. */
export const lvl = (s) => familyPower(s);
/** Power floor of 1, matching `profile()` in arsenal-runtime.js. */
export const power = (s) => Math.max(1, familyPower(s));
/** Scaling multiplier, matching `profile()` in arsenal-runtime.js. */
export const mult = (s) => 1 + power(s) * 0.13 + (s?.branch ? (s.evo || 0) * 0.18 : 0);

const evo = (s) => s?.evo || 0;
const isA = (s) => s?.branch === 'a';
const isB = (s) => s?.branch === 'b';

const dmg = (base, bonus) => (s) => base * mult(s) * (bonus ? bonus(s) : 1);
const cd = (floor, start, step) => (s) => Math.max(floor, start - lvl(s) * step);

const M = (key, label, direction, value, opts = {}) => ({
  key, label, direction, value,
  unit: opts.unit || '',
  decimals: opts.decimals ?? 0,
});

const DMG = (base, bonus) => M('damage', 'DMG', DIRECTION.UP, dmg(base, bonus), {decimals: 1});
const CD = (floor, start, step) => M('cooldown', 'CD', DIRECTION.DOWN, cd(floor, start, step), {unit: 's', decimals: 2});
const RADIUS = (base, per, evoBonus) => M('radius', 'AREA', DIRECTION.UP, (s) => base + power(s) * per + (evoBonus ? evoBonus(s) : 0), {unit: 'u'});

/**
 * Every family's metrics. The formulas here ARE the runtime's formulas.
 * Configuration bonuses are deliberately excluded: they are situational and are
 * added by the runtime on top of the base value the card promises.
 */
export const FAMILY_METRICS = {
  // --- Kinetic
  rail: [
    DMG(18, (s) => (isA(s) ? 1.8 : 1)),
    CD(0.38, 1.15, 0.08),
    M('shots', 'SHOTS', DIRECTION.UP, (s) => (isB(s) ? 2 + evo(s) : 1)),
    M('pierce', 'PIERCE', DIRECTION.UP, (s) => Math.floor(power(s) / 2)),
  ],
  repeater: [
    DMG(7, (s) => (isB(s) ? 1.6 : 1)),
    CD(0.07, 0.34, 0.022),
    M('shots', 'SHOTS', DIRECTION.UP, (s) => (isA(s) ? 2 + Math.floor(evo(s) / 2) : 1)),
  ],
  scatter: [
    DMG(8),
    CD(0.45, 1.2, 0.07),
    M('pellets', 'PELLETS', DIRECTION.UP, (s) => 4 + Math.floor(power(s)) + (isA(s) ? evo(s) * 3 : 0)),
    // Storm branch tightens the cone on purpose: fewer stray pellets, more focus.
    M('spread', 'SPREAD', DIRECTION.DESIGN, (s) => (isB(s) ? 0.45 : 1.05), {unit: 'rad', decimals: 2}),
  ],
  ricochet: [
    DMG(14),
    CD(0.55, 1.5, 0.08),
    M('bounces', 'BOUNCE', DIRECTION.UP, (s) => 1 + Math.floor(power(s) / 2) + (isA(s) ? evo(s) : 0)),
  ],
  hunter: [
    DMG(12, (s) => (isB(s) ? 1.7 : 1)),
    CD(0.4, 1.35, 0.06),
    M('shots', 'ROUNDS', DIRECTION.UP, (s) => 1 + Math.floor(power(s) / 2) + (isA(s) ? evo(s) * 2 : 0)),
  ],
  // --- Energy
  beam: [
    DMG(15, (s) => (isA(s) ? 1.5 : 1)),
    CD(0.28, 0.9, 0.045),
  ],
  sweep: [
    DMG(14),
    CD(0.8, 2.4, 0.1),
    RADIUS(160, 18),
  ],
  prism: [
    DMG(9),
    CD(0.55, 1.5, 0.07),
    M('targets', 'TARGETS', DIRECTION.UP, (s) => 2 + Math.floor(power(s) / 2) + (isA(s) ? evo(s) * 2 : 0)),
  ],
  nova: [
    DMG(18, (s) => (isA(s) ? 1.4 : 1)),
    CD(0.65, 3, 0.14),
    RADIUS(100, 18, (s) => (isA(s) ? evo(s) * 55 : 0)),
  ],
  arc: [
    DMG(10),
    CD(0.45, 1.7, 0.075),
    M('targets', 'CHAIN', DIRECTION.UP, (s) => 2 + Math.floor(power(s)) + (isA(s) ? evo(s) * 2 : 0)),
  ],
  // --- Melee
  orbit: [
    // Orbitals damage continuously; the honest scalar is damage per second.
    M('dps', 'DPS', DIRECTION.UP, (s) => (7 + power(s) * 1.5) * 5, {decimals: 1}),
    RADIUS(55, 5),
    M('blades', 'BLADES', DIRECTION.UP, (s) => 3 + Math.floor(power(s)) + (isA(s) ? evo(s) * 3 : 0)),
  ],
  launchblade: [
    DMG(16),
    CD(0.65, 1.8, 0.08),
    M('pierce', 'PIERCE', DIRECTION.UP, (s) => 2 + (isB(s) ? 4 : 0)),
  ],
  slash: [
    DMG(20),
    CD(0.45, 1.4, 0.07),
    M('range', 'RANGE', DIRECTION.UP, (s) => 125 + power(s) * 15, {unit: 'u'}),
    // Wide branch trades precision for coverage; narrow branch does the reverse.
    M('arc', 'ARC', DIRECTION.DESIGN, (s) => (isA(s) ? 1.0 : 0.65), {unit: 'rad', decimals: 2}),
  ],
  drill: [
    DMG(24, (s) => (isA(s) ? 1.7 : 1)),
    CD(0.5, 1.5, 0.07),
  ],
  ram: [
    // Only lands while dashing, so there is no cooldown of its own.
    DMG(24),
  ],
  // --- Explosive
  missile: [
    DMG(15, (s) => (isB(s) ? 1.6 : 1)),
    CD(0.45, 1.8, 0.08),
    M('shots', 'SALVO', DIRECTION.UP, (s) => 2 + Math.floor(power(s) / 2) + (isA(s) ? evo(s) * 3 : 0)),
  ],
  mortar: [
    DMG(22),
    CD(0.7, 2.7, 0.11),
    RADIUS(55, 5, (s) => (isB(s) ? evo(s) * 28 : 0)),
  ],
  cluster: [
    DMG(8),
    CD(0.65, 2.1, 0.09),
    M('bomblets', 'BOMBLETS', DIRECTION.UP, (s) => 5 + Math.floor(power(s)) + (isA(s) ? evo(s) * 4 : 0)),
  ],
  mine: [
    DMG(20),
    CD(0.75, 2.6, 0.11),
    M('mines', 'MINES', DIRECTION.UP, (s) => 1 + Math.floor(power(s) / 3) + (isA(s) ? evo(s) : 0)),
  ],
  plasma: [
    DMG(8),
    CD(0.65, 2.2, 0.1),
    RADIUS(50, 6, (s) => (isA(s) ? evo(s) * 25 : 0)),
    // Lingering branch trades burst for uptime.
    M('duration', 'LINGER', DIRECTION.DESIGN, (s) => (isA(s) ? 1.3 : 0.6), {unit: 's', decimals: 2}),
  ],
  // --- Autonomous
  drone: [
    DMG(7),
    CD(0.22, 0.75, 0.03),
    M('units', 'DRONES', DIRECTION.UP, (s) => 1 + Math.floor(power(s) / 2) + (isA(s) ? evo(s) * 2 : 0)),
  ],
  funnels: [
    DMG(6),
    CD(0.25, 0.85, 0.03),
    M('units', 'FUNNELS', DIRECTION.UP, (s) => 2 + Math.floor(power(s) / 2) + (isA(s) ? evo(s) * 2 : 0)),
  ],
  sentry: [
    DMG(8, (s) => (isB(s) ? 1.8 : 1)),
    CD(0.3, 0.95, 0.035),
    // The heavy branch fires one big shot instead of many: fewer is the point.
    M('units', 'BARRELS', DIRECTION.DESIGN, (s) => (isB(s) ? 1 : 1 + Math.floor(power(s) / 3))),
  ],
  interceptor: [
    DMG(9),
    RADIUS(90, 8),
  ],
  // --- Defence / control / conditional / exotic
  barrier: [
    M('dps', 'DPS', DIRECTION.UP, (s) => 5 * mult(s) * 5, {decimals: 1}),
    RADIUS(60, 6),
  ],
  graviton: [
    M('dps', 'DPS', DIRECTION.UP, (s) => 5 * mult(s) * 4, {decimals: 1}),
    RADIUS(130, 12),
    M('force', 'PULL', DIRECTION.UP, (s) => (isA(s) ? 120 : 55) + power(s) * 8),
  ],
  repulsor: [
    DMG(7),
    CD(0.7, 2.2, 0.08),
    RADIUS(125, 10),
    // The heavy branch pushes less far but hits harder on the way out.
    M('force', 'PUSH', DIRECTION.DESIGN, (s) => (isB(s) ? 55 : 90) + power(s) * 5),
  ],
  mark: [
    CD(1.5, 5, 0.18),
    M('markMult', 'EXECUTE', DIRECTION.UP, (s) => 1.18 + power(s) * 0.04 + (isA(s) ? 0.35 : 0), {unit: 'x', decimals: 2}),
    // The single-target branch concentrates the mark rather than spreading it.
    M('targets', 'MARKS', DIRECTION.DESIGN, (s) => (isB(s) ? 1 : 1 + Math.floor(power(s) / 4))),
  ],
  death: [
    DMG(10),
    RADIUS(55, 3),
  ],
  temporal: [
    DMG(9),
    CD(0.7, 2.5, 0.08),
    M('targets', 'TARGETS', DIRECTION.UP, (s) => 1 + evo(s)),
  ],
};

/** Read one metric's live value. This is what the runtime calls. */
export function mv(familyId, key, state) {
  const metric = (FAMILY_METRICS[familyId] || []).find((m) => m.key === key);
  if (!metric) throw new Error(`arsenal-metrics: ${familyId} has no metric "${key}"`);
  return metric.value(state);
}

export function formatMetric(metric, value) {
  const n = metric.decimals > 0 ? value.toFixed(metric.decimals) : String(Math.round(value));
  return `${metric.label} ${n}${metric.unit}`;
}

/**
 * Every metric a family exposes, resolved at `state`.
 * `previous` (optional) adds the delta a card is offering.
 */
export function metricsFor(familyId, state, previous = null) {
  const metrics = FAMILY_METRICS[familyId] || [];
  return metrics.map((m) => {
    const value = m.value(state);
    const before = previous ? m.value(previous) : null;
    return {
      key: m.key,
      label: m.label,
      unit: m.unit,
      decimals: m.decimals,
      direction: m.direction,
      value,
      display: formatMetric(m, value),
      delta: before === null ? null : value - before,
    };
  });
}

/** The metric line shown on an upgrade card, built from the formulas themselves. */
export function metricLine(list) {
  return list.filter((m) => m.delta === null || Math.abs(m.delta) > 1e-9)
    .map((m) => m.display)
    .join(' · ');
}

/**
 * Structured metrics for a card offering `next` over `current`.
 * A pick that moves no declared scalar is behaviour-only and says so rather
 * than inventing a number to satisfy a test.
 */
export function cardMetrics(familyId, current, next) {
  const list = metricsFor(familyId, next, current);
  const changed = list.filter((m) => m.delta !== null && Math.abs(m.delta) > 1e-9);
  const behaviorOnly = changed.length === 0;
  return {
    behaviorOnly,
    list,
    changed,
    values: Object.fromEntries(list.map((m) => [m.key, m.value])),
    line: behaviorOnly ? '' : metricLine(list),
  };
}
