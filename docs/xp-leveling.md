## XP and Leveling System

This document describes how XP is earned, how level-ups are triggered, and how related UI/events behave.

### Sources of XP
- XP crystals are spawned in gameplay and collected by the player.
- Debug options (cheat menu) can grant XP directly for testing.

### XP Pickup Objects
- Each pickup has an integer `amount` (default 1). Nearby pickups merge, summing `amount` and scaling size slightly.
- When collected, a floating `+N XP` text displays the granted amount (respecting current multiplier/overflow).

### Multipliers and Overflow
- Player stat `xp` is a multiplier applied to pickup amounts.
- Effective grant uses floor(total) with carryover overflow:
  - `total = amount * xpMultiplier + xpOverflow`
  - `grant = max(1, floor(total))`
  - `xpOverflow = total - grant`
- Guarantees minimum of 1 XP per pickup even when multipliers are < 1.

### Player XP State
- `xpTotal`: cumulative lifetime XP.
- `xpCurrent`: progress within current level.
- `xpNeeded`: required XP to reach next level.
- `xpOverflow`: fractional remainder carried to next pickup.
- Initial values: `level = 1`, `xpCurrent = 0`, `xpNeeded = 10`.

### Gaining XP
- On grant:
  - `xpTotal += grant`
  - `xpCurrent += grant`
  - Emit `xp:update` and `xp:progress` events.
  - If threshold reached: level up is triggered (see below).

### Level-Up Flow and Deferred Clear
- When `xpCurrent >= xpNeeded`:
  - `level += 1`
  - `xpNeeded = ceil(xpNeeded * 1.5)` (scales each level)
  - `xpCurrent` is set to `xpNeeded` to visually show a full bar.
  - Remainder beyond the threshold is stored in `_pendingLevelXpRemainder`.
  - `_pendingLevelXpHold = true` defers clearing until the player finalizes their perk selection.
  - Emit `player:level` event.
- Finalization: After selecting a perk (or skipping), `finalizeLevelUp()` sets:
  - `xpCurrent = floor(_pendingLevelXpRemainder)`
  - Clears pending flags and emits `xp:progress`.
- Debug: `levelUpOnceDebug()` increments level once and immediately scales `xpNeeded` by 1.5, resetting `xpCurrent` to 0.

### UI Integration
- HUD XP bar subscribes to `xp:progress` and updates with `(current, needed)`.
- Level badge subscribes to `player:level` and animates on change.
- Level-Up screen pauses gameplay when a new level is detected and presents three options selected from:
  - Tomes (new unlocks and upgrades with rolled values/rarities)
  - Weapons (new unlocks if not owned, or bundled upgrades for owned weapons)
- After the player chooses or skips, `finalizeLevelUp()` is called and gameplay resumes.

### Events Summary
- `xp:update (xpTotal: number)`
- `xp:progress ({ current, needed, level })`
- `player:level (level: number)`
- UI/gameplay also dispatch additional events when level-up choices apply (e.g., `tome:selected`, `tome:upgraded`, `weapon:add`, `weapon:upgraded`).

### Cheat / Debug Aids
- With `?cheat=true`, the cheat menu appears in the HUD with:
  - Tome grant buttons for unowned tomes
  - `Level Up` button (debug single level)
  - `+50 XP`, `+100 XP`, `+500 XP` buttons to test progression and overflow behavior

### Persistence
- Save/Load includes XP and level state plus pending level-up flags and remainder.

### Tuning Notes
- Starting `xpNeeded` is 10; growth is `ceil(needed * 1.5)` per level.
- XP multiplier is derived from tomes and upgrades via the stat engine and can affect both grant size and overflow behavior.


