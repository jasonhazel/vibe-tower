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

## Proposed: Sequential Multi-Level-Up Dialogs

Goal: When a single XP grant would cover multiple levels, present the Level Up dialog once per level, in sequence, without requiring additional XP grants.

### High-Level Behavior
- Collapse large XP grants into a queue of pending level-ups.
- For each pending level-up:
  1) Open the Level Up dialog
  2) Apply the chosen perk/unlock
  3) Advance to the next pending level until exhausted
- The XP bar should animate to full for each level, then drop to the correct remainder for the next level before opening the next dialog.

### State Additions (PlayerState)
- `pendingLevelUps: number` — counts how many level-ups remain to process.
- Adjust `addXp(amount)` to iterate while `xpCurrent >= xpNeeded`:
  - Increment `level`
  - Compute new `xpNeeded = ceil(xpNeeded * 1.5)`
  - Increment `pendingLevelUps`
  - Set `xpCurrent` to `xpNeeded` temporarily for visual full-bar state; compute and carry forward the `remainder` for further loops
  - Continue while the carried remainder still crosses the next threshold
- Remove `_pendingLevelXpHold` and `_pendingLevelXpRemainder` in favor of `pendingLevelUps` and an internal `carryRemainder` local during `addXp`.
- Replace `finalizeLevelUp()` with a method that reduces `pendingLevelUps` by 1 and sets `xpCurrent` to the remainder captured for the next level (see HUD/scene flow below). Consider an accessor to tell UI when more level-ups are pending.

### UI/Scene Flow
- PlayScene:
  - When `pendingLevelUps > 0` and no Level Up dialog is open, pause gameplay and launch LevelUp scene.
  - After the user makes a selection, call a new `playerState.consumePendingLevelUp()`:
    - This updates `xpCurrent` to the remainder for the next level step.
    - Decrement `pendingLevelUps`.
  - If `pendingLevelUps > 0` after consumption, immediately re-open LevelUp for the next level (without needing new XP). Otherwise, resume PlayScene.

### Eventing
- Keep existing events (`xp:update`, `xp:progress`, `player:level`).
- Optionally add `level:queue (remaining: number)` to let HUD show queued levels.

### Edge Cases
- Extremely large XP grants may enqueue many levels: cap `pendingLevelUps` (e.g., 10) and convert the rest into `xpCurrent` remainder after the last processed level.
- Ensure saves persist `pendingLevelUps` to avoid losing queued dialogs across reloads.

### Migration Plan
1) PlayerState: introduce `pendingLevelUps` and loop in `addXp()` to compute multiple levels at once; emit `player:level` per increment.
2) Replace deferred-hold mechanism with queued approach; add `consumePendingLevelUp()` to update `xpCurrent` between dialogs.
3) PlayScene: change level-up open logic to check `pendingLevelUps` and loop opening LevelUp until the queue empties.
4) Update docs and tests; ensure HUD reflects correct `xpCurrent/needed` between sequential dialogs.


