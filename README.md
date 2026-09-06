# Mech Survivor // Frame Zero

A standalone, zero-dependency playable jam prototype using the SLU Web Shell's Survivor Frame as its template contract. The game does not live inside or modify the shell repository.

## Run

```bash
npm run dev
```

Open `http://localhost:4173`. `npm run build` runs the deploy gate used by Vercel.

## Build layout

`npm run build` is a chain of string-rewrite passes (`prepare-build.mjs`, then
`pass-*.mjs`) that patch five files in place. Those five files are authored in
`src/` and the build copies them into `public/` before patching:

| authored | generated |
| --- | --- |
| `src/game.js` | `public/game.js` |
| `src/meta.js` | `public/meta.js` |
| `src/retention.js` | `public/retention.js` |
| `src/celestial-frame.js` | `public/celestial-frame.js` |
| `src/arsenal-runtime.js` | `public/arsenal-runtime.js` |

**Edit `src/`, never the five generated files in `public/`** — they are
git-ignored and overwritten on every build. Every other file in `public/` is a
hand-written source served as-is.

Restoring from `src/` first is what makes the build repeatable: the passes anchor
on exact source text, so re-patching already-patched output fails. Because the
generated files are not committed, the deployed bundle can no longer drift from
the build output.

`npm run seam-audit` re-runs the pass chain and reports any pass whose anchor
text matches in more than one place — the failure mode that once injected the
dash hook into the wrong function.

## Sector commanders

A sector commander reads the frame it is about to fight, once, at the moment it
spawns, and picks how to answer. It never re-reads the build mid-fight — that
reads as the boss cheating rather than responding.

Each of the 30 arsenal families carries a primary archetype tag from {SIEGE,
MOBILE, CLOSE, CONTROL, SUMMON, PRECISION, AOE/SWARM, TEMPORAL}, and some carry
a secondary at half weight. The score for an archetype is the sum of
`family_tier_level x weight` over the families the build owns. If the leader is
ahead of the runner-up by at least 40% relative it answers alone; otherwise the
top two responses are blended.

Shipping resolution collapses the eight archetypes into three super-buckets —
RANGED (PRECISION+SIEGE+TEMPORAL), CLOSE (CLOSE+MOBILE) and CONTROL
(CONTROL+SUMMON+AOE/SWARM) — so fairness and feel can be validated on three
response sets first. Flip `COMMANDER_DOCTRINE.mode` in `pass-u-commander.mjs`
from `'buckets'` to `'archetypes'` to split into the full eight; nothing else
has to change.

| Archetype | Response |
| --- | --- |
| SIEGE | Displacement telegraph, then a long exposed punish window |
| MOBILE | Predictive intercept lanes; exposed during its own reposition |
| CLOSE | Dangerous outer ring, then a clear close-range punish window |
| CONTROL | Adds stay manipulable; the core resists lockdown but breaks under pressure |
| SUMMON | Multi-point pylons any weapon can clear; occasional anti-summon pulse |
| PRECISION | Break plates that spend aimed damage into an execution window |
| AOE/SWARM | Split/merge formations, and calling one costs the commander a beat |
| TEMPORAL | Safe/unsafe cadence windows — timing advantage, not immunity |

**A response may make a build work harder; it may never switch one off.**
`DOCTRINE_LIMITS` in `public/commander-doctrine.js` states that as numbers —
control always moves the core, pylons gate damage rather than stopping it,
anti-summon pressure is occasional, and every response opens a readable window
that pays out. `commander.test.mjs` enforces those limits against every
response and every pairwise blend, and proves each archetype opens to ordinary
play within 25 seconds.

The arrival ceremony runs over live gameplay — the HUD yields, the sky darkens,
the camera eases back, and the frame keeps taking input the whole time. A
commander is introduced in full only the first time it is met; after that the
card is abbreviated, and it is always skippable with any input.

Controls: WASD, arrow keys, or the left gamepad stick. Dash with Space/Shift or gamepad B/RB. Weapons fire automatically. Level-up choices support mouse/touch or number keys 1–3. Open the in-game VFX Lab with F8 (fn + F8 on Mac media-key layouts) or Command + Shift + V.

## Mech Genome

The prototype's player state is a compact genome:

- Core: Overdrive Reactor
- Locomotion: Vector Thrusters
- Hardpoints: arm rail and shoulder pods
- Modules: armor, magnetism, repair
- Weapons: rail, missiles, drones, orbital blades
- Materials: white/silver armor, navy structure, cobalt energy, gold accents
- Scale: module tiers drive visible geometry and weapon output
- Progression: enemy pickups grant XP toward level-up assembly choices

Every chosen upgrade mutates both combat behavior and the rendered mech silhouette.

## Procedural creature system

Arcane enemies now use a deterministic `CreatureGenome` defined in `public/creatures.js`. Body plan, appendages, organs, mutations, behavior, palette and derived gameplay stats are generated from a seed. The main menu includes a Creature Lab for batch generation, seed inspection and one-trait mutation. See `CREATURE_SYSTEM.md` for the reusable contract.

The player frame now uses the separate celestial visual renderer in the same module: strict symmetry/radial construction for the frame versus broken/asymmetric biological construction for enemies.
