// Commander doctrine: how a sector commander reads the frame it is about to
// fight, and what it does about it.
//
// The rule the whole system is built to obey is that a commander RESPONDS to
// broad build pressure and never hard-counters it. Every response opens a real
// window the player can take, every control tool keeps working (just not to the
// point of total lockdown), and anti-build pressure is occasional rather than
// constant. `DOCTRINE_LIMITS` below states those guarantees as numbers, and
// commander.test.mjs enforces them against every profile and every blend.
//
// Resolution happens ONCE, when the commander spawns. Re-reading the build
// mid-fight would make the boss feel like it was cheating rather than reacting.
import {ARSENAL_BY_ID, familyPower} from './arsenal.js';

export const ARCHETYPES = ['SIEGE', 'MOBILE', 'CLOSE', 'CONTROL', 'SUMMON', 'PRECISION', 'AOE_SWARM', 'TEMPORAL'];

// Shipping order: the eight archetypes collapse into three super-buckets first,
// so fairness and feel can be validated on three response sets before the split
// into eight multiplies the surface area.
export const SUPER_BUCKETS = {
  RANGED: ['PRECISION', 'SIEGE', 'TEMPORAL'],
  CLOSE: ['CLOSE', 'MOBILE'],
  CONTROL: ['CONTROL', 'SUMMON', 'AOE_SWARM'],
};

export const SECONDARY_WEIGHT = 0.5;

// One primary tag per family, from how the family actually behaves in
// arsenal-runtime.js rather than from its catalogue group. A few carry a
// secondary at half weight where the behaviour genuinely straddles two.
export const FAMILY_ARCHETYPES = {
  // Kinetic
  rail: {primary: 'SIEGE', secondary: 'PRECISION'},
  repeater: {primary: 'PRECISION', secondary: 'MOBILE'},
  scatter: {primary: 'CLOSE', secondary: 'AOE_SWARM'},
  ricochet: {primary: 'AOE_SWARM', secondary: 'MOBILE'},
  hunter: {primary: 'PRECISION'},
  // Energy
  beam: {primary: 'PRECISION', secondary: 'SIEGE'},
  sweep: {primary: 'AOE_SWARM', secondary: 'CLOSE'},
  prism: {primary: 'PRECISION', secondary: 'AOE_SWARM'},
  nova: {primary: 'AOE_SWARM', secondary: 'CLOSE'},
  arc: {primary: 'CONTROL', secondary: 'PRECISION'},
  // Melee
  orbit: {primary: 'CLOSE', secondary: 'AOE_SWARM'},
  launchblade: {primary: 'CLOSE', secondary: 'PRECISION'},
  slash: {primary: 'CLOSE', secondary: 'AOE_SWARM'},
  drill: {primary: 'CLOSE', secondary: 'PRECISION'},
  ram: {primary: 'MOBILE', secondary: 'CLOSE'},
  // Explosive
  missile: {primary: 'SIEGE', secondary: 'PRECISION'},
  mortar: {primary: 'SIEGE', secondary: 'AOE_SWARM'},
  cluster: {primary: 'AOE_SWARM', secondary: 'SIEGE'},
  mine: {primary: 'CONTROL', secondary: 'AOE_SWARM'},
  plasma: {primary: 'CONTROL', secondary: 'AOE_SWARM'},
  // Autonomous
  drone: {primary: 'SUMMON'},
  funnels: {primary: 'SUMMON', secondary: 'PRECISION'},
  sentry: {primary: 'SUMMON', secondary: 'SIEGE'},
  interceptor: {primary: 'SUMMON', secondary: 'CONTROL'},
  // Defence / control / conditional / exotic
  barrier: {primary: 'CLOSE', secondary: 'CONTROL'},
  graviton: {primary: 'CONTROL', secondary: 'AOE_SWARM'},
  repulsor: {primary: 'CONTROL', secondary: 'CLOSE'},
  mark: {primary: 'PRECISION'},
  death: {primary: 'AOE_SWARM', secondary: 'SUMMON'},
  temporal: {primary: 'TEMPORAL', secondary: 'CONTROL'},
};

// Every response profile carries the same keys so two of them can be blended by
// weighted average. Zero means "this commander does not do that at all".
export const NEUTRAL_PROFILE = {
  // SIEGE — displacement telegraph, then a long exposed punish window.
  displaceInterval: 0,
  displaceTelegraph: 0,
  // MOBILE — predictive intercept lanes, vulnerable during its own reposition.
  interceptLead: 0,
  repositionInterval: 0,
  // CLOSE — dangerous outer ring, then clear close-range punish windows.
  outerRingInterval: 0,
  outerRingRadius: 0,
  // CONTROL — core resists full lockdown but rewards break pressure.
  lockdownResist: 0,
  breakPressureGain: 0,
  // SUMMON — multi-point mechanic, occasional anti-summon pressure.
  pylons: 0,
  antiSummonInterval: 0,
  // PRECISION — weakpoints / break plates / execution windows.
  weakpoints: 0,
  // AOE_SWARM — split/merge add formations, clustered opportunities.
  formationSize: 0,
  formationInterval: 0,
  // TEMPORAL — safe/unsafe cadence windows: timing advantage, not immunity.
  cadencePeriod: 0,
  cadenceSafeShare: 0,
  // Shared: how long the commander stays open, and how much it takes while open.
  exposedWindow: 1.4,
  vulnerability: 1.4,
};

// The fairness contract. A response may make a build work harder; it may never
// switch one off. Enforced over every profile and every pairwise blend.
export const DOCTRINE_LIMITS = {
  // Control tools always move the core somewhat — no commander is immovable.
  maxLockdownResist: 0.6,
  // Anti-summon pressure is a punctuation mark, not a standing condition.
  minAntiSummonInterval: 8,
  maxAntiSummonClearShare: 0.4,
  // Pylons gate damage, they never stop it.
  minPylonDamageShare: 0.55,
  // There is always a readable window, and taking it always pays.
  minExposedWindow: 1,
  minVulnerability: 1.2,
};

/** Damage the core still takes while its pylons stand. Never below the limit. */
export const PYLON_DAMAGE_SHARE = 0.6;
/** Share of the player's autonomous projectiles an anti-summon pulse clears. */
export const ANTI_SUMMON_CLEAR_SHARE = 0.35;

export const RESPONSES = {
  SIEGE: {
    // Long-range siege builds get answered by a commander that refuses to be a
    // stationary target — but every displacement is announced, and landing is
    // the longest opening in the game.
    displaceInterval: 7.4,
    displaceTelegraph: 0.95,
    exposedWindow: 2.8,
    vulnerability: 1.75,
  },
  MOBILE: {
    // Leads its shots where a dashing frame is going, and pays for its own
    // repositioning with an opening.
    interceptLead: 0.42,
    repositionInterval: 5.2,
    exposedWindow: 1.6,
    vulnerability: 1.5,
  },
  CLOSE: {
    // Makes the approach cost something rather than making contact impossible:
    // the danger is the ring on the way in, and the reward is standing there.
    outerRingInterval: 4.1,
    outerRingRadius: 250,
    exposedWindow: 2.1,
    vulnerability: 1.6,
  },
  CONTROL: {
    // Adds and objects stay fully manipulable. Only the core resists, and even
    // that converts sustained pressure into a break.
    lockdownResist: 0.55,
    breakPressureGain: 1.35,
    exposedWindow: 2.4,
    vulnerability: 1.7,
  },
  SUMMON: {
    // A multi-point problem autonomous units solve well because they engage on
    // their own, plus an occasional pulse that thins them without erasing them.
    pylons: 3,
    antiSummonInterval: 11,
    exposedWindow: 1.9,
    vulnerability: 1.55,
  },
  PRECISION: {
    // Break plates: aimed damage is spent on structure, and structure spent
    // opens an execution window.
    weakpoints: 4,
    exposedWindow: 2.2,
    vulnerability: 1.9,
  },
  AOE_SWARM: {
    // Formations that split and re-merge, so clearing is always possible but
    // the shape of the cluster keeps changing.
    formationSize: 5,
    formationInterval: 6.3,
    exposedWindow: 1.5,
    vulnerability: 1.45,
  },
  TEMPORAL: {
    // Alternating cadence rather than immunity: the commander is readable on a
    // clock, which is exactly the advantage a temporal build wants to exploit.
    cadencePeriod: 6,
    cadenceSafeShare: 0.38,
    exposedWindow: 1.8,
    vulnerability: 1.5,
  },
};

function profileOf(archetype) {
  return {...NEUTRAL_PROFILE, ...(RESPONSES[archetype] || {})};
}

// "Every N seconds" keys. Averaging them is wrong in a way that breaks the
// fairness contract: 0 means "never does this", not "does this every 0
// seconds", so averaging SIEGE (never pressures summons) with SUMMON (every
// 11s) would produce a commander that pressures summons every 5.5s — twice as
// hard as the pure response. Blending the rate instead gives 22s: half the
// commander, half as often.
const RATE_KEYS = new Set([
  'displaceInterval',
  'repositionInterval',
  'outerRingInterval',
  'antiSummonInterval',
  'formationInterval',
  'cadencePeriod',
]);

/**
 * Weighted average of two profiles. `weight` is the share given to `a`.
 * Interval keys blend as frequencies; everything else blends linearly.
 */
export function blendProfiles(a, b, weight = 0.5) {
  const w = Math.max(0, Math.min(1, weight));
  const out = {};
  for (const key of Object.keys(NEUTRAL_PROFILE)) {
    const av = a[key] || 0, bv = b[key] || 0;
    if (RATE_KEYS.has(key)) {
      const rate = (av > 0 ? w / av : 0) + (bv > 0 ? (1 - w) / bv : 0);
      out[key] = rate > 0 ? 1 / rate : 0;
    } else {
      out[key] = av * w + bv * (1 - w);
    }
  }
  return out;
}

/**
 * `archetype_score[A] = Σ (family_tier_level × weight)` over owned families,
 * weight 1.0 for a primary tag and 0.5 for a secondary.
 */
export function archetypeScores(player) {
  const scores = Object.fromEntries(ARCHETYPES.map((a) => [a, 0]));
  const arsenal = player?.arsenal || {};
  for (const [id, state] of Object.entries(arsenal)) {
    if (!ARSENAL_BY_ID[id]) continue;
    const level = familyPower(state);
    if (!(level > 0)) continue;
    const tags = FAMILY_ARCHETYPES[id];
    if (!tags) continue;
    scores[tags.primary] += level;
    if (tags.secondary) scores[tags.secondary] += level * SECONDARY_WEIGHT;
  }
  return scores;
}

/** Collapse the eight archetype scores into the three shipping super-buckets. */
export function bucketScores(scores) {
  const out = {};
  for (const [bucket, members] of Object.entries(SUPER_BUCKETS)) {
    out[bucket] = members.reduce((sum, a) => sum + (scores[a] || 0), 0);
  }
  return out;
}

/** A bucket answers with its members' responses, weighted by what the build owns. */
function bucketProfile(bucket, scores) {
  const members = SUPER_BUCKETS[bucket] || [];
  const total = members.reduce((sum, a) => sum + (scores[a] || 0), 0);
  const out = Object.fromEntries(Object.keys(NEUTRAL_PROFILE).map((k) => [k, 0]));
  const rates = Object.fromEntries([...RATE_KEYS].map((k) => [k, 0]));
  for (const member of members) {
    const share = total > 0 ? (scores[member] || 0) / total : 1 / members.length;
    const profile = profileOf(member);
    for (const key of Object.keys(out)) {
      if (RATE_KEYS.has(key)) rates[key] += profile[key] > 0 ? share / profile[key] : 0;
      else out[key] += profile[key] * share;
    }
  }
  for (const key of RATE_KEYS) out[key] = rates[key] > 0 ? 1 / rates[key] : 0;
  return out;
}

function profileFor(key, mode, scores) {
  return mode === 'buckets' ? bucketProfile(key, scores) : profileOf(key);
}

/**
 * Read the build once and decide how this commander fights.
 *
 * @param player            the frame at the moment the commander spawns
 * @param mode              'buckets' (shipping) or 'archetypes' (full eight)
 * @param margin            relative lead the leader needs to answer alone
 */
export function resolveCommanderDoctrine(player, {mode = 'buckets', margin = 0.4} = {}) {
  const archetypes = archetypeScores(player);
  const scores = mode === 'buckets' ? bucketScores(archetypes) : archetypes;
  const ranked = Object.entries(scores).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  if (!ranked.length) {
    // No build to read yet: a neutral commander, still with a real window.
    return {mode, margin, archetypes, scores, primary: null, secondary: null, blended: false, lead: 0, profile: {...NEUTRAL_PROFILE}};
  }

  const [primary, top] = ranked[0];
  const [second, next] = ranked[1] || [null, 0];
  // Relative lead: how far ahead of the runner-up the leader is. A build with a
  // single archetype leads by definition and answers with that set alone.
  const lead = next > 0 ? (top - next) / next : Infinity;
  const blended = second !== null && lead < margin;

  const profile = blended
    ? blendProfiles(profileFor(primary, mode, archetypes), profileFor(second, mode, archetypes), top / (top + next))
    : profileFor(primary, mode, archetypes);

  return {mode, margin, archetypes, scores, primary, secondary: blended ? second : null, blended, lead, profile};
}

/** Human-readable line for the intro card and the codex. */
export function doctrineLabel(doctrine) {
  if (!doctrine?.primary) return 'ADAPTIVE DOCTRINE';
  const name = (key) => String(key).replace('_', '/');
  return doctrine.blended
    ? `${name(doctrine.primary)} + ${name(doctrine.secondary)} DOCTRINE`
    : `${name(doctrine.primary)} DOCTRINE`;
}
