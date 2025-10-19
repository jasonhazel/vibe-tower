# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [0.1.33] - 2025-10-19
### Added
- New weapon: Boomerang (piercing returning projectile; upgrades: Damage, Cooldown, Range, Speed, Radius, Projectiles). Wired into catalog, scene, cheat menu, stats panel.
### Changed
- Boomerang now always travels to max range before returning.
 - Boomerang will not throw if no target is within range.
 - Boomerang projectile now uses boomerang-shaped graphic and spins in flight.
### Added
- New weapon: Blades (orbiting blades dealing contact damage; upgrades: Damage, Tick, Radius, Rotation Speed, Blades). Wired into catalog, scene, cheat menu, stats panel.
### Changed
- Blades: damage now applies on continuous contact (no cooldown); rotation speed scales with player attack speed.
### Fixed
- XP diamonds: pickup hitbox now scales with merge size and is considered in pickup distance, preventing large diamonds from overlapping the pickup ring without collecting.
### Changed
- XP diamonds: increased max visual scale clamp from 2x to 3x (with matching merge and pickup radii).
### Fixed
- Blades: More Blades +1 upgrade now properly increases blade count (supports rolled values).
 - Blades: added short per-enemy contact cooldown to prevent multi-hit insta-kills when multiple blades overlap.
### Changed
- Default starting weapon set to Blades for testing (was Aura).
### Added
- Starting weapon selection: new dedicated dialog listing all weapons with no skip.
### Changed
- StartWeaponScene: 4-column grid of square buttons for better density.

## [0.1.19] - 2025-10-19
### Added
- Chain Lightning: Tome of Projectiles now increases chain jumps.
- Docs: standards clarify mapping of global projectiles to weapon behavior.

## [0.1.14] - 2025-10-19
### Added
- Cheat menu: buttons to unlock weapons for testing (Aura, Fireball, Slam, Chain Lightning).

## [0.1.13] - 2025-10-19
### Added
- New weapon: Chain Lightning (auto-targets nearest enemy, chains to nearby foes with damage falloff; upgrades include Damage, Cooldown, Range, Chain Range, More Chains).

## [0.1.12] - 2025-10-19
### Changed
- Share image footer now shows current app version.

## [0.1.11] - 2025-10-19
### Changed
- Share image layout: restored icons below stats, reduced overall height to 330 to remove extra bottom padding without overlapping.

## [0.1.10] - 2025-10-19
### Changed
- Share image height tightened further; icons shifted up to reduce bottom empty space.

## [0.1.9] - 2025-10-19
### Changed
- Share image height reduced to better fit content; layout tightened.

## [0.1.8] - 2025-10-19
### Added
- Share image now includes player stats (area, damage, projectiles, attack speed, pickup, XP mult).
 - Share image now also shows owned weapon and tome icons.

## [0.1.7] - 2025-10-19
### Added
- Game Over: Share button to generate a score card image and copy to clipboard.

## [0.1.6] - 2025-10-19
### Fixed
- Reduced restart hitch by deferring reset and save clearing to next tick.

## [0.1.5] - 2025-10-19
### Fixed
- Reduced lag after final perk selection by deferring saves until queued level-ups are exhausted and removing redundant scene resumes.

## [0.1.4] - 2025-10-19
### Changed
- Implement queued multi-level-up flow: multiple levels from one grant now open sequential dialogs.
- HUD/LevelUp wired to consume queue and update XP bar between dialogs.

## [0.1.3] - 2025-10-19
### Added
- Documentation: Proposed design for sequential multi-level-up dialogs in `docs/xp-leveling.md`.

## [0.1.2] - 2025-10-19
### Added
- Documentation: `docs/xp-leveling.md` outlining XP, level-ups, events, UI hooks.

## [0.1.1] - 2025-10-19
### Added
- Cheat menu buttons to grant +50, +100, +500 XP for testing.

### Added
- Rarity-based perk system with rolled impacts for tomes and weapon upgrades.
- Weapon upgrade bundles (two stats per option) with rarity-colored outlines.
- PerkButton UI component (3-line layout, rarity outline) and updated Level Up dialog.
- Enemy difficulty scaling: +1 spawn every 30s and global speed +10% every 30s.
- Autosave improvements: restore pending level-up, enemy/pickup state.
- Weapon dedupe to prevent duplicate slot entries.
- Pickup radius hydration on refresh; emits initial stats on load.

### Fixed
- Deferred XP clear to avoid freeze; finalize after perk selection.
- Reset scaling on restart (enemy speed, spawn batch count, timers).
- Level-up dialog persistence across refresh; tome slots hydrate from saves.
- Tooltip alignment and HUD positioning adjustments.

### Changed
- Tomes now accumulate rolled values per level; removed separate upgrades count.
- Stats panel hides rolled values; shows final tome modifiers only.

## [0.0.1] - 2025-10-01
- Initial prototype with Phaser + Vite, Aura/Fireball/Slam weapons, tomes, HUD, XP/leveling, enemies, pickups.
