# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

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
