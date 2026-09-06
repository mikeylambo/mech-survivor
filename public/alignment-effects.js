// Alignments and Eclipses: what they actually do.
//
// The audit that produced this file found 9 of 60 with a real mechanical
// branch, 0 partial and 51 doing nothing at all — the card showed, the pick
// registered, the toast fired, and none of what it described happened.
//
// The fix is a table rather than 51 more branches. Everything routes through
// three consumption points that already exist or are wired alongside this file,
// so an entry cannot be added without being read:
//
//   stats     -> fields the player object already carries (damage, rate, ...)
//   family /
//   category /
//   all       -> arsenal metric modifiers, read through arsenal-metrics.mvFor,
//                which is the single choke point every weapon magnitude and
//                every card number already goes through
//   rules     -> per-frame and on-kill hooks ticked by the run loop
//
// Effect text is GENERATED from the same numbers the effect applies, so a card
// cannot drift from its mechanic. Where the original copy promised something
// with no runtime hook at all, the copy was rewritten to describe what really
// happens rather than leaving a second lie in place of the first. Those are
// listed in REWRITTEN_COPY.

/** Entries whose original wording promised a mechanic the runtime has no hook for. */
export const REWRITTEN_COPY = [
  'storm_vow', 'artillery_creed', 'funnel_geometry', 'blade_covenant', 'kinetic_mass',
  'death_harvest', 'vector_patience', 'moving_target', 'overlap_theorem',
  'black_sun', 'crooked_orbit', 'gravity_sickness', 'mirror_hunger', 'crowned_storm', 'broken_targeting',
];

/** Entries merged into another because they did near-identical work. */
export const MERGED = {};
/** Entries cut during certification. Nothing is currently cut. */
export const CUT = [];

const pct = (v) => `${v > 0 ? '+' : ''}${Math.round(v * 100)}%`;
const mulPct = (v) => pct(v - 1);
/** A cooldown multiplier below 1 is a rate increase; say it the way it feels. */
const ratePct = (v) => `${v < 1 ? '+' : ''}${Math.round((1 / v - 1) * 100)}% Rate`;

const STAT_LABEL = {
  damage: 'Damage', rate: 'Fire Rate', speed: 'Move Speed', maxHp: 'Max Integrity',
  armor: 'Resist', crit: 'Critical', magnet: 'Pickup Range', regen: 'Repair/s',
  xpBoost: 'XP', coinBoost: 'Stardust', areaBoost: 'Area', hp: 'Integrity',
};
const METRIC_LABEL = {
  damage: 'Damage', cooldown: 'Cooldown', radius: 'Area', force: 'Force', duration: 'Duration',
  dps: 'DPS', targets: 'Targets', shots: 'Shots', units: 'Units', mines: 'Mines',
  blades: 'Blades', pierce: 'Pierce', markMult: 'Execute', pellets: 'Pellets', bomblets: 'Bomblets',
};
const FAMILY_LABEL = {
  rail: 'Rail', arc: 'Arc', drone: 'Drone', orbit: 'Orbit', missile: 'Missile', nova: 'Nova',
  graviton: 'Well', barrier: 'Barrier', temporal: 'Echo', death: 'Death Reactor', mortar: 'Mortar',
  mark: 'Mark', repulsor: 'Repulsor', plasma: 'Plasma', mine: 'Mine', sentry: 'Sentry',
  funnels: 'Funnel', interceptor: 'Intercept', beam: 'Beam', slash: 'Slash',
};

/** Human line built from the numbers the effect actually applies. */
export function effectTextFor(entry) {
  const parts = [];
  for (const [key, value] of Object.entries(entry.stats || {})) {
    const flat = key.startsWith('+');
    const name = STAT_LABEL[flat ? key.slice(1) : key] || (flat ? key.slice(1) : key);
    if (flat) parts.push(`${value > 0 ? '+' : ''}${key.slice(1) === 'armor' || key.slice(1) === 'crit' || key.slice(1) === 'xpBoost' || key.slice(1) === 'coinBoost' ? pct(value) : value} ${name}`);
    else if (key === 'rate') parts.push(ratePct(value));
    else parts.push(`${mulPct(value)} ${name}`);
  }
  for (const [family, mods] of Object.entries(entry.family || {})) {
    const label = FAMILY_LABEL[family] || family;
    for (const [key, value] of Object.entries(mods)) {
      const flat = key.startsWith('+');
      const metric = METRIC_LABEL[flat ? key.slice(1) : key] || key;
      if (flat) parts.push(`${label} +${value} ${metric}`);
      else if (key === 'cooldown') parts.push(`${label} ${ratePct(value)}`);
      else parts.push(`${label} ${mulPct(value)} ${metric}`);
    }
  }
  for (const [category, mods] of Object.entries(entry.category || {})) {
    for (const [key, value] of Object.entries(mods)) {
      const metric = METRIC_LABEL[key] || key;
      parts.push(key === 'cooldown' ? `${category} ${ratePct(value)}` : `${category} ${mulPct(value)} ${metric}`);
    }
  }
  for (const [key, value] of Object.entries(entry.all || {})) {
    parts.push(key === 'cooldown' ? `All ${ratePct(value)}` : `All ${mulPct(value)} ${METRIC_LABEL[key] || key}`);
  }
  if (entry.damageVs) {
    for (const [what, value] of Object.entries(entry.damageVs)) parts.push(`${mulPct(value)} vs ${what}`);
  }
  if (entry.dash?.cooldown) parts.push(`Dash ${ratePct(entry.dash.cooldown)}`);
  if (entry.rule) parts.push(entry.rule.text);
  if (entry.corruption) parts.push(`+${Math.round(entry.corruption * 100)}% Corruption`);
  return parts.join(' · ');
}

/**
 * Per-frame and on-kill rules. Each names the condition it watches so the
 * player can see it in the card, and each is evaluated by the run loop.
 */
const RULES = {
  second_wind: {
    text: 'Below 35% Integrity: +18% Move and Fire Rate',
    tick(p) { p._alignScale = p.hp / Math.max(1, p.maxHp) < 0.35 ? {speed: 1.18, rate: 0.85} : null; },
  },
  full_output: {
    text: 'God Window: +25% Damage',
    tick(p, ctx) { p._alignDamage = ctx.elapsed >= (ctx.godWindowStart ?? 390) ? 1.25 : 1; },
  },
  formation_reader: {
    text: 'During a director event: +12% Damage',
    tick(p, ctx) { p._alignDamage = ctx.directorActive ? 1.12 : 1; },
  },
  vector_patience: {
    text: 'Standing still 1.2s: +18% weapon reach',
    tick(p, ctx, dt) {
      p._stillFor = ctx.moving ? 0 : (p._stillFor || 0) + dt;
      p.mods.all.radius = (p.mods.all._radiusBase ?? 1) * (p._stillFor >= 1.2 ? 1.18 : 1);
    },
  },
  moving_target: {
    text: 'While moving: +10% Resist',
    tick(p, ctx) { p._alignArmor = ctx.moving ? 0.1 : 0; },
  },
  clean_cycle: {
    text: 'Every 25 kills: repair 3% Integrity',
    onKill(p) {
      p._cleanCycle = (p._cleanCycle || 0) + 1;
      if (p._cleanCycle >= 25) { p._cleanCycle = 0; return {heal: p.maxHp * 0.03}; }
      return null;
    },
  },
  execution_dividend: {
    text: 'Elite kills clear all weapon cooldowns',
    onKill(p, enemy) {
      if (enemy?.t !== 'elite' && enemy?.t !== 'boss') return null;
      const rt = p._arsenalRt;
      if (rt) for (const k of Object.keys(rt)) rt[k] = 0;
      return {toast: 'EXECUTION DIVIDEND'};
    },
  },
  critical_mass: {
    text: 'Critical hits detonate',
    critBlast: {radius: 78, damage: 0.45},
  },
  recovery_protocol: {
    text: 'Cache repair +50%',
    cacheHeal: 1.5,
  },
};

const A = (id, entry) => [id, {kind: 'alignment', ...entry}];
const E = (id, entry) => [id, {kind: 'eclipse', infect: true, ...entry}];

export const ALIGNMENT_EFFECTS = Object.fromEntries([
  // --- Alignments: broad frame graces -------------------------------------
  A('seraphic_conduction', {stats: {damage: 1.18, rate: 0.92}}),
  A('aegis_memory', {stats: {'+maxHp': 28, '+hp': 28, '+armor': 0.05}}),
  A('hunter_lattice', {stats: {'+crit': 0.12, '+magnet': 40}}),
  A('chorus_drive', {stats: {speed: 1.12}, dash: {cooldown: 0.85}}),
  A('living_reactor', {stats: {'+regen': 0.7, rate: 0.9}}),
  A('combat_magnetism', {stats: {'+magnet': 35, '+xpBoost': 0.15}}),
  A('salvager_instinct', {stats: {'+coinBoost': 0.2}}),
  A('boss_hunter', {damageVs: {elite: 1.2, commander: 1.2}}),

  // --- Alignments: family grammars ----------------------------------------
  A('rail_sacrament', {family: {rail: {'+pierce': 1, damage: 1.18}}}),
  A('storm_vow', {family: {arc: {'+targets': 2, damage: 1.15}}}),
  A('halo_command', {family: {drone: {'+units': 1, cooldown: 0.82}}}),
  A('blade_covenant', {family: {orbit: {'+blades': 2, dps: 1.12}}}),
  A('missile_psalm', {family: {missile: {'+shots': 2}}}),
  A('nova_liturgy', {family: {nova: {radius: 1.28, cooldown: 0.88}}}),
  A('gravity_choir', {family: {graviton: {force: 1.25, radius: 1.2}}}),
  A('fortress_doctrine', {family: {barrier: {radius: 1.1}}, stats: {'+armor': 0.08}}),
  A('temporal_memory', {family: {temporal: {damage: 1.28}}}),
  A('death_harvest', {family: {death: {damage: 1.2, radius: 1.15}}}),
  A('artillery_creed', {family: {mortar: {radius: 1.18, damage: 1.12}}}),
  A('precision_oath', {family: {mark: {markMult: 1.22}}}),
  A('repulsor_mandate', {family: {repulsor: {force: 1.24}}}),
  A('plasma_benediction', {family: {plasma: {duration: 1.24}}}),
  A('mine_scripture', {family: {mine: {'+mines': 1}}}),
  A('sentry_compact', {family: {sentry: {'+units': 1, cooldown: 0.82}}}),
  A('funnel_geometry', {family: {funnels: {'+units': 2, damage: 1.12}}}),
  A('interceptor_grace', {family: {interceptor: {radius: 1.2}}}),

  // --- Alignments: cross-family categories --------------------------------
  A('kinetic_mass', {category: {KINETIC: {damage: 1.14}}}),
  A('close_quarters_edict', {category: {MELEE: {damage: 1.18}}, dash: {cooldown: 0.9}}),
  A('explosive_ordinance', {category: {EXPLOSIVE: {radius: 1.16}}}),
  A('autonomous_chorus', {category: {AUTONOMOUS: {cooldown: 0.88}}}),
  A('overlap_theorem', {family: {plasma: {radius: 1.2}, mortar: {radius: 1.2}, nova: {radius: 1.2}}}),

  // --- Alignments: conditional rules ---------------------------------------
  A('second_wind', {rule: RULES.second_wind}),
  A('full_output', {rule: RULES.full_output}),
  A('formation_reader', {rule: RULES.formation_reader}),
  A('vector_patience', {rule: RULES.vector_patience}),
  A('moving_target', {rule: RULES.moving_target}),
  A('clean_cycle', {rule: RULES.clean_cycle}),
  A('execution_dividend', {rule: RULES.execution_dividend}),
  A('critical_mass', {stats: {'+crit': 0.08}, rule: RULES.critical_mass}),
  A('recovery_protocol', {rule: RULES.recovery_protocol}),

  // --- Eclipses: every one costs something, and every one shows on the frame
  E('blighted_halo', {stats: {damage: 1.65, maxHp: 0.7}, corruption: 0.42}),
  E('warped_reactor', {stats: {rate: 0.65, '+armor': -0.12}, corruption: 0.38}),
  E('void_magnet', {stats: {'+xpBoost': 0.65, speed: 0.85}, corruption: 0.34}),
  E('fractured_aegis', {stats: {'+armor': 0.22, maxHp: 0.75}, corruption: 0.46}),
  E('bloodless_overclock', {stats: {rate: 0.55, regen: 0}, corruption: 0.4}),
  E('black_sun', {family: {nova: {radius: 1.85}}, stats: {'+armor': -0.08}, corruption: 0.44}),
  E('predatory_mark', {family: {mark: {markMult: 1.6}}, stats: {damage: 0.82}, corruption: 0.36}),
  E('crooked_orbit', {family: {orbit: {'+blades': 5, dps: 0.9}}, corruption: 0.33}),
  E('grave_engine', {family: {death: {damage: 1.55}}, stats: {damage: 0.8}, corruption: 0.41}),
  E('time_debt', {family: {temporal: {'+targets': 1}}, all: {cooldown: 1.18}, corruption: 0.39}),
  E('gravity_sickness', {family: {graviton: {force: 1.7}}, stats: {speed: 0.92}, corruption: 0.37}),
  E('volatile_ordnance', {category: {EXPLOSIVE: {damage: 1.55}}, stats: {'+armor': -0.1}, corruption: 0.43}),
  E('feral_funnels', {family: {funnels: {'+units': 4}, barrier: {dps: 0.85}}, corruption: 0.35}),
  E('siege_body', {family: {mortar: {damage: 1.5}}, stats: {speed: 0.82}, corruption: 0.4}),
  E('mirror_hunger', {family: {interceptor: {damage: 2, radius: 0.8}}, corruption: 0.32}),
  E('scorched_field', {family: {plasma: {duration: 1.75}}, stats: {magnet: 0.7}, corruption: 0.38}),
  E('throne_of_edges', {category: {MELEE: {damage: 1.55}, KINETIC: {damage: 0.8}, ENERGY: {damage: 0.8}}, corruption: 0.45}),
  E('crowned_storm', {family: {arc: {'+targets': 5, cooldown: 1.15}}, corruption: 0.36}),
  E('munition_famine', {family: {missile: {damage: 1.8, cooldown: 1.35}}, corruption: 0.42}),
  E('broken_targeting', {stats: {'+crit': 0.3, damage: 0.92}, corruption: 0.34}),
]);

/** Fresh modifier container. Every player gets one at reset. */
export function createAlignmentMods() {
  return {all: {}, category: {}, family: {}, damageVs: {}, rules: [], critBlast: null, cacheHeal: 1, dashCooldown: 1};
}

const mergeScope = (target, mods) => {
  for (const [key, value] of Object.entries(mods)) {
    if (key.startsWith('+')) target[key] = (target[key] || 0) + value;
    else target[key] = (target[key] ?? 1) * value;
  }
};

/**
 * Apply one Alignment or Eclipse. Returns what it did, so the caller can toast
 * it and the tests can assert something actually happened.
 */
export function applyAlignment(player, id) {
  const entry = ALIGNMENT_EFFECTS[id];
  if (!entry) return null;
  if (!player.mods) player.mods = createAlignmentMods();
  const mods = player.mods;
  const changed = [];

  for (const [key, value] of Object.entries(entry.stats || {})) {
    if (key.startsWith('+')) { const f = key.slice(1); player[f] = (player[f] || 0) + value; changed.push(f); }
    else { player[key] = (player[key] || 0) * value; changed.push(key); }
  }
  if (entry.stats?.maxHp) player.hp = Math.min(player.hp, player.maxHp);

  for (const [family, m] of Object.entries(entry.family || {})) {
    mergeScope((mods.family[family] ||= {}), m);
    changed.push(`family.${family}`);
  }
  for (const [category, m] of Object.entries(entry.category || {})) {
    mergeScope((mods.category[category] ||= {}), m);
    changed.push(`category.${category}`);
  }
  if (entry.all) { mergeScope(mods.all, entry.all); changed.push('all'); }
  if (entry.damageVs) {
    for (const [what, v] of Object.entries(entry.damageVs)) mods.damageVs[what] = (mods.damageVs[what] ?? 1) * v;
    changed.push('damageVs');
  }
  if (entry.dash?.cooldown) { mods.dashCooldown *= entry.dash.cooldown; changed.push('dash'); }
  if (entry.rule) {
    mods.rules.push(entry.rule);
    if (entry.rule.critBlast) mods.critBlast = entry.rule.critBlast;
    if (entry.rule.cacheHeal) mods.cacheHeal *= entry.rule.cacheHeal;
    changed.push('rule');
  }
  if (entry.corruption) { player.corruption = Math.min(1, (player.corruption || 0) + entry.corruption); changed.push('corruption'); }

  return {id, kind: entry.kind, changed, infect: !!entry.infect};
}

/** Per-frame rules. Cheap: only runs the rules the player actually took. */
export function tickAlignments(player, ctx, dt) {
  const rules = player?.mods?.rules;
  if (!rules?.length) return;
  player._alignDamage = 1;
  player._alignArmor = 0;
  player._alignScale = null;
  for (const rule of rules) rule.tick?.(player, ctx, dt);
}

/** On-kill rules. Returns effects the caller applies (heal, toast). */
export function onAlignmentKill(player, enemy) {
  const rules = player?.mods?.rules;
  if (!rules?.length) return [];
  const out = [];
  for (const rule of rules) {
    const result = rule.onKill?.(player, enemy);
    if (result) out.push(result);
  }
  return out;
}

/** Damage scaling from conditional rules and target type. */
export function alignmentDamageScale(player, enemy) {
  let scale = player?._alignDamage ?? 1;
  const vs = player?.mods?.damageVs;
  if (vs) {
    if (enemy?.t === 'boss' && vs.commander) scale *= vs.commander;
    if (enemy?.t === 'elite' && vs.elite) scale *= vs.elite;
  }
  return scale;
}

/** Which ids show on the frame as an Eclipse infection. */
export function infectingAlignments() {
  return Object.entries(ALIGNMENT_EFFECTS).filter(([, e]) => e.infect).map(([id]) => id);
}
