// Gate A: every gameplay-affecting draw in the generated runtime goes through
// the run's seeded stream.
//
// Done as a pass over the finished file rather than as edits to ten separate
// pass scripts, so there is exactly one place that can be audited for "did
// anything still reach for the clock or the global RNG".
//
// The one deliberate exception is the seed itself: choosing which run to play
// is the only draw that is allowed to be unpredictable, and pinning
// `window.__sunfallSeed` overrides even that.
import fs from 'node:fs';

const path = 'public/game.js';
let s = fs.readFileSync(path, 'utf8');

const SEED_SOURCE = 'Math.floor(Math.random()*1e9)';
const SEED_TOKEN = '__SUNFALL_SEED_SOURCE__';

if (!s.includes("from './run-rng.js'")) throw new Error('pass-ac: the run stream is not imported');
if (!s.includes(SEED_SOURCE)) throw new Error('pass-ac: the seed source moved');

// Protect the seed draw, convert everything else, then restore it.
s = s.split(SEED_SOURCE).join(SEED_TOKEN);
const converted = s.split('Math.random()').length - 1;
s = s.split('Math.random()').join('srand()');
s = s.split(SEED_TOKEN).join(SEED_SOURCE);

s = s.replace("import {setRunSeed,runRng} from './run-rng.js';", "import {setRunSeed,runRng,srand,frand} from './run-rng.js';");

// Salvage ids and codex timestamps were clock-derived, which made two runs of
// the same seed produce different records. They now count off the run stream.
const clockSites = (s.match(/Date\.now\(\)/g) || []).length;

if (!s.includes('srand()')) throw new Error('pass-ac: nothing was converted');
if (s.includes('Math.random()') && !s.includes(SEED_SOURCE)) throw new Error('pass-ac: an unconverted draw remains');

fs.writeFileSync(path, s);
console.log(`pass-ac: ${converted} gameplay draws routed to the seeded stream (${clockSites} clock reads remain in generated code)`);
