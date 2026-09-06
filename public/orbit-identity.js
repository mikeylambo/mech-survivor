// Orbit identity: the five layers that make an orbit feel like a place rather
// than a difficulty number.
//
// Every layer is data plus one small function, keyed by orbit index, so an
// orbit's character lives in one readable block instead of being smeared across
// the spawner, the renderer and the director.
//
//   1. Atmosphere    — a distinct ambient particle treatment
//   2. World mechanic — one verb only this orbit does
//   3. Event pool    — weighted director events, generalising ELITE_TIMES
//   4. Ecology bias  — which body plans and behaviours this orbit breeds
//   5. Reward language — what its Fallen Stars are called
//
// All randomness goes through the run's seeded stream. An orbit's character is
// a property of the orbit and the seed, never of when it was played.
import {ORBITS} from './canon.js';
import {runRng} from './run-rng.js';

const TAU = Math.PI * 2;

/** Push a hazard into the enemy projectile pool the game already simulates. */
const hazard = (arr, x, y, a, speed, damage, r = 7, life = 4) =>
  arr.push({x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r, life, damage, kind: 'orbit-hazard'});

export const ORBIT_IDENTITY = [
  {
    id: 'dark-edge',
    atmosphere: {motes: 34, hue: 205, drift: 9, size: 1.6, alpha: 0.30, shape: 'dust'},
    mechanic: {
      id: 'cold-snap', name: 'COLD SNAP', interval: 21, warn: 1.4,
      // The outer dark bites: everything slows, including you. Readable, brief,
      // and it rewards having somewhere to already be standing.
      apply(ctx) {
        for (const e of ctx.enemies) if (!e.dead) e._chill = 2.4;
        ctx.player._chill = 1.2;
        ctx.toast?.('COLD SNAP // THE DARK BITES');
      },
      tick(ctx) {
        const decay = ctx.dt;
        for (const e of ctx.enemies) if (e._chill > 0) { e._chill -= decay; e.x -= (e.vx || 0) * decay * 0.35; e.y -= (e.vy || 0) * decay * 0.35; }
        if (ctx.player._chill > 0) ctx.player._chill -= decay;
      },
    },
    events: [{id: 'elite', weight: 3}, {id: 'formation', weight: 4}, {id: 'cache', weight: 3}, {id: 'hunt', weight: 2}],
    eliteTimes: [90, 210, 330],
    ecology: {bodyPlans: {'heavy-biped': 4, quadruped: 3, serpent: 1, insectoid: 1, avian: 1}, behavior: {stalk: 4, swarm: 1, charge: 2}},
    rewards: {prefix: 'COLD', flavour: 'Recovered from the edge of the light.'},
  },
  {
    id: 'comet-field',
    atmosphere: {motes: 52, hue: 188, drift: 46, size: 2.1, alpha: 0.40, shape: 'streak'},
    mechanic: {
      id: 'cometfall', name: 'COMETFALL', interval: 16, warn: 1.1,
      // Debris crosses the whole field on one axis. Positioning problem, not a
      // damage race: the lane is readable and there is always a gap.
      apply(ctx) {
        const rng = runRng();
        const across = rng() * TAU;
        for (let i = 0; i < 9; i++) {
          const spread = (i - 4) * 74;
          const ox = Math.cos(across + Math.PI / 2) * spread;
          const oy = Math.sin(across + Math.PI / 2) * spread;
          hazard(ctx.enemyShots, ctx.player.x - Math.cos(across) * 900 + ox, ctx.player.y - Math.sin(across) * 900 + oy,
            across, 460, 14, 9, 5);
        }
        ctx.toast?.('COMETFALL // CLEAR THE LANE');
      },
      tick() {},
    },
    events: [{id: 'elite', weight: 2}, {id: 'formation', weight: 3}, {id: 'cache', weight: 4}, {id: 'extract', weight: 4}],
    eliteTimes: [100, 205, 315],
    ecology: {bodyPlans: {avian: 5, serpent: 3, insectoid: 2, quadruped: 1, 'heavy-biped': 1}, behavior: {dart: 5, swarm: 3, stalk: 1}},
    rewards: {prefix: 'GLASS', flavour: 'Cut from something that fell burning.'},
  },
  {
    id: 'broken-belt',
    atmosphere: {motes: 40, hue: 26, drift: 15, size: 2.6, alpha: 0.34, shape: 'ember'},
    mechanic: {
      id: 'forge-slag', name: 'FORGE SLAG', interval: 14, warn: 0.9,
      // Standing hazards that stay. The belt slowly takes the arena away from
      // you, so it punishes camping rather than movement.
      apply(ctx) {
        const rng = runRng();
        for (let i = 0; i < 4; i++) {
          const a = rng() * TAU, d = 180 + rng() * 260;
          ctx.enemyShots.push({
            x: ctx.player.x + Math.cos(a) * d, y: ctx.player.y + Math.sin(a) * d,
            vx: 0, vy: 0, r: 26, life: 9, damage: 11, kind: 'orbit-hazard',
          });
        }
        ctx.toast?.('SLAG VENT // GROUND IS CLOSING');
      },
      tick() {},
    },
    events: [{id: 'elite', weight: 4}, {id: 'formation', weight: 2}, {id: 'defend', weight: 5}, {id: 'cache', weight: 2}],
    eliteTimes: [80, 190, 300],
    ecology: {bodyPlans: {'heavy-biped': 5, kaiju: 3, quadruped: 2, insectoid: 1, avian: 1}, behavior: {charge: 5, stalk: 2, swarm: 1}},
    rewards: {prefix: 'FORGE', flavour: 'Still warm from a fire nobody lit.'},
  },
  {
    id: 'shattered-orbit',
    atmosphere: {motes: 46, hue: 292, drift: 22, size: 1.9, alpha: 0.42, shape: 'shard'},
    mechanic: {
      id: 'gravity-pulse', name: 'GRAVITY PULSE', interval: 12, warn: 1.2,
      // The requested verb, reusing the graviton well's own math: a point pulls
      // everything toward it for a beat, player included.
      apply(ctx) {
        const rng = runRng();
        const a = rng() * TAU, d = 220 + rng() * 200;
        ctx.state.well = {x: ctx.player.x + Math.cos(a) * d, y: ctx.player.y + Math.sin(a) * d, life: 2.6, force: 210};
        ctx.toast?.('GRAVITY PULSE // THE ORBIT LEANS');
      },
      tick(ctx) {
        const well = ctx.state.well;
        if (!well) return;
        well.life -= ctx.dt;
        if (well.life <= 0) { ctx.state.well = null; return; }
        const pull = (target, scale) => {
          const dx = well.x - target.x, dy = well.y - target.y, dist = Math.hypot(dx, dy) || 1;
          if (dist > 620) return;
          const force = well.force * scale * (1 - Math.min(1, dist / 620)) * ctx.dt;
          target.x += dx / dist * force;
          target.y += dy / dist * force;
        };
        for (const e of ctx.enemies) if (!e.dead) pull(e, 1);
        pull(ctx.player, 0.55);
      },
    },
    events: [{id: 'elite', weight: 3}, {id: 'formation', weight: 3}, {id: 'hold', weight: 5}, {id: 'escort', weight: 3}],
    eliteTimes: [75, 180, 285],
    ecology: {bodyPlans: {serpent: 4, insectoid: 4, avian: 2, quadruped: 1, kaiju: 1}, behavior: {swarm: 5, dart: 3, stalk: 1}},
    rewards: {prefix: 'GRAVITY', flavour: 'It only holds its shape near something heavy.'},
  },
  {
    id: 'heart-of-the-sun',
    atmosphere: {motes: 60, hue: 44, drift: 30, size: 2.3, alpha: 0.48, shape: 'flare'},
    mechanic: {
      id: 'solar-flare', name: 'SOLAR FLARE', interval: 11, warn: 1.6,
      // An expanding ring from where you were standing. Always survivable, and
      // always a reason to already be moving.
      apply(ctx) {
        const count = 30;
        for (let i = 0; i < count; i++) {
          hazard(ctx.enemyShots, ctx.player.x, ctx.player.y, i * TAU / count, 300, 16, 8, 3.2);
        }
        ctx.toast?.('SOLAR FLARE // MOVE');
      },
      tick() {},
    },
    events: [{id: 'elite', weight: 5}, {id: 'formation', weight: 4}, {id: 'purge', weight: 4}, {id: 'hold', weight: 3}],
    eliteTimes: [70, 165, 260],
    ecology: {bodyPlans: {kaiju: 5, 'heavy-biped': 4, serpent: 2, avian: 2, insectoid: 1}, behavior: {charge: 4, stalk: 3, swarm: 3}},
    rewards: {prefix: 'SOLAR', flavour: 'Taken out of the thing pretending to be the sun.'},
  },
];

export const orbitIdentity = (world) => ORBIT_IDENTITY[Math.max(0, Math.min(ORBIT_IDENTITY.length - 1, world | 0))];

/** Fresh per-orbit mechanic state. Kept out of the identity table so it is pure. */
export const createOrbitState = (world) => ({world, timer: orbitIdentity(world).mechanic.interval, well: null, fired: 0});

/**
 * Advance an orbit's own verb. Returns the mechanic id on the frame it fires,
 * so the caller can react (audio, screen flash) without reaching inside.
 */
export function tickOrbitMechanic(state, ctx) {
  const identity = orbitIdentity(state.world);
  const mechanic = identity.mechanic;
  mechanic.tick({...ctx, state});
  state.timer -= ctx.dt;
  if (state.timer > 0) return null;
  state.timer = mechanic.interval;
  state.fired++;
  mechanic.apply({...ctx, state});
  return mechanic.id;
}

/** Weighted director event for this orbit, from the run's own stream. */
export function rollOrbitEvent(world, rng = runRng()) {
  return rng.weighted(orbitIdentity(world).events).id;
}

/** Body plan this orbit tends to breed. */
export function rollBodyPlan(world, rng = runRng()) {
  const weights = orbitIdentity(world).ecology.bodyPlans;
  const entries = Object.entries(weights).map(([id, weight]) => ({id, weight}));
  return rng.weighted(entries).id;
}

export function rollBehavior(world, rng = runRng()) {
  const weights = orbitIdentity(world).ecology.behavior;
  const entries = Object.entries(weights).map(([id, weight]) => ({id, weight}));
  return rng.weighted(entries).id;
}

/** Orbit-flavoured name for a recovered Fallen Star. */
export function orbitRewardName(world, baseName) {
  return `${orbitIdentity(world).rewards.prefix} ${baseName}`;
}

/**
 * Ambient particle treatment. Drawn in screen space with a parallax offset so
 * it reads as depth without entering the simulation.
 */
export function drawOrbitAtmosphere(ctx, world, {w, h, camX = 0, camY = 0, time = 0, quality = 1}) {
  const spec = orbitIdentity(world).atmosphere;
  const count = Math.max(6, Math.round(spec.motes * quality));
  const hue = spec.hue;
  ctx.save();
  ctx.globalAlpha = spec.alpha;
  for (let i = 0; i < count; i++) {
    const seed = i * 0.6180339887;
    const px = ((seed * 9871 + camX * 0.12 + time * spec.drift) % (w + 80)) - 40;
    const py = ((seed * 6577 + camY * 0.12 + time * spec.drift * 0.42) % (h + 80)) - 40;
    const twinkle = 0.55 + 0.45 * Math.sin(time * 1.7 + i);
    ctx.fillStyle = `hsl(${hue} 90% ${58 + twinkle * 18}%)`;
    ctx.strokeStyle = ctx.fillStyle;
    if (spec.shape === 'streak') {
      ctx.lineWidth = spec.size * 0.6;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - spec.size * 7, py - spec.size * 2);
      ctx.stroke();
    } else if (spec.shape === 'shard') {
      ctx.beginPath();
      ctx.moveTo(px, py - spec.size * 2);
      ctx.lineTo(px + spec.size, py);
      ctx.lineTo(px, py + spec.size * 2);
      ctx.lineTo(px - spec.size, py);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(px, py, spec.size * (spec.shape === 'flare' ? twinkle * 1.5 : 1), 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Sanity check used by the tests and by anyone adding a sixth orbit. */
export function orbitIdentityCoverage() {
  return ORBIT_IDENTITY.map((o, i) => ({
    orbit: ORBITS[i]?.name,
    id: o.id,
    mechanic: o.mechanic.id,
    events: o.events.length,
    bodyPlans: Object.keys(o.ecology.bodyPlans).length,
    reward: o.rewards.prefix,
  }));
}
