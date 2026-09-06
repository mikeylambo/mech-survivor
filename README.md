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
