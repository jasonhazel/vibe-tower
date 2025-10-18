## Vibe Tower — High-Level Game Design Outline

### Vision
- **Goal**: Fast, readable, satisfying arena defense where a central tower survives escalating enemy pressure.
- **Experience**: Draft-and-grow loadout with synergistic weapons and tomes, clear feedback, short sessions with meaningful choices.
- **Tone**: Energetic, readable visuals; impactful audio; low cognitive load under pressure.

### Core Pillars
- **Clarity under chaos**: High readability of threats, effects, and choices.
- **Meaningful progression**: Level-ups present interesting tradeoffs, not flat power.
- **Composable content**: Weapons, tomes, and upgrades are modular and extensible.
- **Short, replayable runs**: Strong variety via randomization and synergies.

### Core Loop
1. Survive waves while the tower automatically attacks and executes equipped weapon behaviors.
2. Defeat enemies to gain XP and pickups; level up.
3. On level-up, choose a perk from a limited random set (weapons, tomes, or their upgrades).
4. Synergize picks to scale into later waves; repeat until victory or tower destruction.

### Session Structure
- **Run start**: Base tower with minimal kit; small choice of starting perk(s) if desired.
- **Mid-run**: Periodic level-ups and curated perk offers; rising difficulty and elites/bosses.
- **End conditions**: Victory after defined duration/boss sequence or defeat at tower 0 HP.

### World & Arena
- **Map**: Single arena with the tower centered; enemy spawn points at arena edges.
- **Navigation**: Enemies path directly toward tower; simple collision avoidance to limit clumping.
- **Readability**: Distinct lanes/spawn tells; safe windows between waves or mini-lulls.

### Player Systems
- **Tower**
  - Core stats: Health, defense/mitigation, optional shield; regeneration rules if applicable.
  - Mount points are conceptual; multiple weapons can be simultaneously equipped.
  - Targeting: Weapons define their own targeting and firing logic.
- **Weapons (Active Behaviors)**
  - Defined as modular behaviors (e.g., projectile, beam, aura, trap, orbiting, burst).
  - Have base stats (damage, interval, range, projectiles, scaling tags) and rarity.
  - Occupy a limited number of weapon slots; duplicates stack per stacking rules.
- **Tomes (Passive Modifiers)**
  - Provide stat multipliers/additives (e.g., damage, attack speed, range, crit, pickup radius, defense).
  - May have conditional effects (on kill, on hit, while shielded, etc.).
  - Stack with diminishing returns where appropriate to avoid runaway scaling.
- **Upgrades**
  - Apply to a specific weapon or tome; structured in tiers.
  - Present clear tradeoffs (e.g., more damage but longer interval; wider range but lower precision).
  - Include caps, exclusivity, or branching to maintain build identity.

### Modularity & Content Model
- **Registries**: Weapons, tomes, and upgrades registered by unique IDs with metadata and tags (e.g., element, damage type, behavior).
- **Data-driven**: Content authored as data assets (stats, tags, rarity, tiering) with minimal code changes.
- **Compatibility**: New content must not break existing save/progression; support versioning and deprecation.
- **Validation**: Content rules checked at load (required fields, numeric bounds, tag coherence).

### Progression & XP
- **XP Gain**: XP awarded on enemy death; optionally via collectible or auto-collect within radius.
- **Leveling Curve**: Progressive; each level requires more XP than the last. Growth parameters are tunable.
- **Perk Offers**
  - On level-up, offer a fixed count of perks from weighted pools (weapons, tomes, upgrades).
  - Duplicate handling, rerolls, and banish mechanics are defined to manage pool health and variety.
  - Rarity affects weights and power; ensure early-game reliability and late-game depth.
- **Loadout Limits**: Caps for weapon slots and tome slots; upgrades limited by target item and tier.

### Enemies & Waves
- **Archetypes**: Base, fast, tank, ranged, summoner, elite, boss; each with clear telegraphs.
- **Stats**: Health, speed, damage, resistances/affinities; readable scaling per wave/time.
- **Spawning**: Waves or time-based cohorts with pacing; spawn from edge points with variance.
- **Behavior**: Path toward tower; special abilities for elites/bosses; avoid degenerate stunlock chains.
- **Rewards**: XP and possible drops; elites/bosses grant elevated rewards.

### Combat & Damage Rules
- **Damage Model**: Supports base damage, crit, modifiers, and optional damage types (e.g., physical/elemental).
- **Stacking**: Clear rules for stacking and diminishing returns for overlapping auras/DoTs.
- **Targeting**: Weapon-defined (nearest, highest HP, random in range, cone, piercing, chaining).
- **Hit Resolution**: Single-source hit deduping per tick where necessary to avoid multi-hit exploits.
- **Defenses**: Flat reduction, percentage mitigation, and optional shields with recharge rules.

### Economy (Optional)
- **In-run currency**: Used for rerolls, shops, or events if enabled.
- **Meta currency**: Earned across runs for permanent/unlocking progression without direct power creep.

### UI/UX
- **HUD**: Health/shield, XP bar, level, equipped items, timers, wave info.
- **Perk Draft**: Clear comparisons, rarity colors, stacking indicators, and synergies.
- **Tooltips**: Concise stats, tags, and upgrade previews; avoid deep math exposure mid-run.
- **Accessibility**: Colorblind-safe palette, scalable text, reduced FX mode, input remapping.

### Audio/Visual
- **Readability-first VFX**: Damage numbers optional; consistent color coding for damage types and rarities.
- **Audio cues**: Level-up, boss spawn, low health, perk selection accept/decline, and key weapon cycles.

### Difficulty & Pacing
- **Curves**: Gradual ramp with periodic spikes; elites/bosses as tests of builds.
- **Limits**: Enemy caps and spawn throttles to maintain performance and clarity.
- **Fail-states**: Clear feedback on causes of death; post-run summary to inform future picks.

### Balancing & Telemetry
- **Design constraints**: DPS budgets per tier/rarity; cooldown breakpoints; stacking caps by category.
- **Metrics**: Time-to-level, time-to-kill archetypes, survival time, pick/banish rates, synergy win rates.
- **Modes**: Sandbox/test mode for tuning; seeded runs for reproducible balancing sessions.

### Success Criteria & Milestones
- **Prototype**: One arena, a small set of enemies, 2–3 weapons, 2–3 tomes, basic upgrades, level-up flow.
- **Alpha**: Full perk draft, multiple enemy archetypes, elites, early balance pass, core UX complete.
- **Beta**: Content breadth, difficulty modes, telemetry-driven tuning, performance targets met.
- **1.0**: Stable content registry, polished UX/VFX/Audio, clear meta goals, robust tutorial/onboarding.

### Non-Goals
- Avoid complex pathfinding-heavy maps; maintain arena simplicity.
- No paid power creep; content additions should broaden choices, not dominate.

### Glossary
- **Perk**: Any draftable item (weapon, tome, or upgrade).
- **Registry**: Data-driven catalog of content entries.
- **Slot**: Capacity constraint for equipped items.
- **Tag**: Label that drives synergies, weights, or rules (e.g., projectile, fire, aura).


