// The names players see, in one place.
//
// Two rules govern everything here:
//
//   * IDs NEVER change. Saves, the codex, the retention store and the arsenal
//     all key off `crown-breaker`, `sector-1`, `blighted_halo` and friends.
//     Renaming a key silently orphans a player's progress; renaming a label
//     costs nothing. Every mapping below is id -> display name.
//   * The five commanders keep their five identities. The False Sun is the
//     final antagonist in the Heart of the Sun, not a flattening of everything
//     that came before it — the other four are the shapes it wears on the way
//     in, each still its own fight with its own reward line.
export const TITLE = 'SUNFALL';
export const SUBTITLE = 'FIRST LIGHT';
export const CURRENCY = 'STARDUST';
export const CURRENCY_MARK = '✦';

/** The five orbits, outermost first. Index is the world index. */
export const ORBITS = [
  {id: 'dark-edge', name: 'The Dark Edge', sub: 'WHERE THE LIGHT GIVES OUT', color: '#168fff'},
  {id: 'comet-field', name: 'The Comet Field', sub: 'GLASS, ICE AND FALLING CHOIRS', color: '#8c7dff'},
  {id: 'broken-belt', name: 'The Broken Belt', sub: 'A FORGE MADE OF WRECKAGE', color: '#ff9d42'},
  {id: 'shattered-orbit', name: 'The Shattered Orbit', sub: 'GRAVITY IN RUINS', color: '#df55ff'},
  {id: 'heart-of-the-sun', name: 'The Heart of the Sun', sub: 'WHERE THE FALSE SUN BURNS', color: '#e5bc54'},
];

/**
 * Commander display names, keyed by their unchanged ids. Each is cosmic and
 * orbit-appropriate; each keeps the silhouette it already had — a crown, an
 * oracle, a forge, a regent — so none of the five identities is erased.
 */
export const COMMANDER_NAMES = {
  'crown-breaker': 'COLD CROWN',
  'glass-oracle': 'COMETFALL ORACLE',
  'war-foundry': 'BELT FORGE',
  'void-regent': 'SHATTERED REGENT',
  'last-engine': 'THE FALSE SUN',
};

/** The final antagonist. Everything else in the run is its approach. */
export const FINAL_COMMANDER = 'last-engine';
export const FINAL_ORBIT = 4;

export const DECK_NAMES = {
  'sector-1': 'DARK EDGE APPROACH',
  'sector-2': 'COMET CHOIR',
  'sector-3': 'FORGE BELT',
  'sector-4': 'GRAVITY RUIN',
  'sector-5': 'SOLAR THRONE',
};

/** Fallen Star relics, one per orbit, plus the generic assemblies. */
export const SALVAGE_NAMES = {
  crown: 'COLD CROWN RELIC',
  oracle: 'COMET GLASS',
  foundry: 'FORGE CINDER',
  regent: 'GRAVITY SHARD',
  engine: 'SOLAR HEART',
};

/** Run-level vocabulary. Alignments bless; Eclipses cost something. */
export const ALIGNMENT = 'ALIGNMENT';
export const ECLIPSE = 'ECLIPSE';
/** Full corruption: the sky goes out. */
export const TOTALITY = 'TOTALITY';
/** A run's first light — the opening minute before the Glare finds you. */
export const RISING_STAR = 'RISING STAR';
/** The pressure the False Sun exerts across every orbit. */
export const GLARE = 'THE GLARE';
/** Peak mastery of an orbit. */
export const ZENITH = 'ZENITH';

export const orbitName = (i) => ORBITS[i]?.name || ORBITS[ORBITS.length - 1].name;
export const commanderName = (id) => COMMANDER_NAMES[id] || String(id || '').toUpperCase();
export const isFinalCommander = (id) => id === FINAL_COMMANDER;

/**
 * The Observatory: one hub, four spaces. Declared here rather than implied by
 * button order so the navigation is a structure, not a label swap.
 */
export const OBSERVATORY = {
  id: 'observatory',
  name: 'THE OBSERVATORY',
  kicker: 'EVERYTHING BETWEEN RUNS',
  spaces: [
    {id: 'hangar', name: 'HANGAR', screen: '#shop', desc: 'Spend Stardust on the frame itself.'},
    {id: 'chassis', name: 'CHASSIS', screen: '#class-screen', desc: 'Choose the frame you launch in.'},
    {id: 'archive', name: 'ARCHIVE', screen: '#awards', desc: 'Everything the run recorded.'},
    {id: 'bestiary', name: 'BESTIARY', screen: '#creature-lab', desc: 'Specimens recovered from the orbits.'},
  ],
};
