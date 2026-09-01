# Anatomy V3

Creature generation now uses three parent anatomical families: humanoid, orb, and serpent. Mixed generation weights humanoids most heavily while preserving orb and serpent families.

Humanoids are built from a parented skeletal graph (pelvis, torso, head, arms, legs) rendered as tapered connected volumes. Corruption tiers progressively permit structural mutations such as extra arms, elongated arms, digitigrade legs, split torsos, twin heads, oversized limbs, and hunched posture.

The Creature Lab injects a family selector at runtime so MIXED / HUMANOID / ORB / SERPENT can be evaluated independently.

Existing gameplay-linked mutation stats remain intact.