# Procedural Creature + Celestial Frame Visual Systems

## CreatureGenome
Every Arcane creature is generated deterministically from a seed plus world tier and combat rank. The genome owns body plan, symmetry, appendages, organs, mutations, behavior, presentation and derived gameplay stats.

### Body plans
- orb
- crawler
- mantis
- serpent
- bulb

### Appendages
Claws, tendrils, spines, fins, stilts and hooks are socketed around the core body. Near-symmetrical genomes mirror most limbs; broken genomes may omit or distort one side.

### Organs
Organs are both visual and mechanical: jaws increase contact threat, spitters/lances create projectiles, nodes create pulse attacks, brood organs spawn lesser creatures, shields reinforce HP.

### Mutations
- shell -> visible carapace + armor
- splitJaw -> split mouth + stronger contact damage
- eyeCluster -> eye cluster visual
- crystalGrowth -> crystal spines + projectile capability
- arcaneNode -> glowing energy organs + pulse capability
- extraLimbs -> denser appendage pattern + movement speed
- rupture -> visible body fracture + lower HP / higher damage
- asymmetry -> broken bilateral construction

World tier increases mutation count and organ complexity. Elites and bosses receive additional limbs/organs/mutations.

## Behavior
Genome behavior currently supports chase, orbit, strafe, charge, and retreat. Behavior is independent of body plan but body plans bias the generated behavior. Projectile organs, brood organs and pulse organs add secondary behavior on top.

## Creature Lab
The main menu exposes a Creature Lab that can:
- generate 12 deterministic specimens from a seed
- preview five corruption tiers
- inspect full genome JSON
- select specimens
- mutate the selected genome without regenerating the whole batch

This is intended as the authoring/debug surface for future Creature Survivor work.

## Celestial Frame Visual System
The player frame now renders through a separate ordered visual system. It uses mirrored hardpoints, radial rings, quantized angles, clean white/silver surfaces, cobalt energy and gold articulation. Existing upgrades visibly add or expand weapons, armor, wings, drones and radial blade arrays.

The visual contract is intentional: player construction becomes more ordered and monumental as the run progresses; enemies become more biologically unstable and asymmetrical as corruption tier rises.
