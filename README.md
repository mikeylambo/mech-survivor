# Mech Survivor // Frame Zero

A standalone, zero-dependency playable jam prototype using the SLU Web Shell's Survivor Frame as its template contract. The game does not live inside or modify the shell repository.

## Run

```bash
npm run dev
```

Open `http://localhost:4173`. `npm run build` runs the deploy gate used by Vercel.

Controls: WASD, arrow keys, or the left gamepad stick. Dash with Space/Shift or gamepad B/RB. Weapons fire automatically. Level-up choices support mouse/touch or number keys 1–3.

## Mech Genome

The prototype's player state is a compact genome:

- Core: Overdrive Reactor
- Locomotion: Vector Thrusters
- Hardpoints: arm rail and shoulder pods
- Modules: armor, magnetism, repair
- Weapons: rail, missiles, drones, orbital blades
- Materials: white/silver armor, navy structure, cobalt energy, gold accents
- Scale: module tiers drive visible geometry and weapon output

Every chosen upgrade mutates both combat behavior and the rendered mech silhouette.

## Procedural creature system

Arcane enemies now use a deterministic `CreatureGenome` defined in `public/creatures.js`. Body plan, appendages, organs, mutations, behavior, palette and derived gameplay stats are generated from a seed. The main menu includes a Creature Lab for batch generation, seed inspection and one-trait mutation. See `CREATURE_SYSTEM.md` for the reusable contract.

The player frame now uses the separate celestial visual renderer in the same module: strict symmetry/radial construction for the frame versus broken/asymmetric biological construction for enemies.

<!-- deployment-sync: creature-lab-current-main -->
