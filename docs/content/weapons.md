## Weapons

### Content Format (non-technical)
- **id**: unique string identifier
- **name**: display name
- **tags**: behavior/element tags (e.g., `aura`, `projectile`, `aoe`)
- **role**: short intent description
- **behavior**: how it acts moment-to-moment
- **base axes**: damage, speed (fire/trigger interval), range, and when applicable projectile count
- **upgrade axes**: which stats upgrades can target
- **constraints**: limits, exclusivities, or non-stacking rules

### Shared Rules
- Weapons consume weapon slots; duplicates stack per stacking rules.
- Targeting and firing logic are defined per weapon.
- Balance is driven by axes (damage, speed, range, projectile count for projectile weapons).

### Weapon: Aura (Default)
- **tags**: `aura`, `aoe`
- **role**: Close-range area denial; constant pressure around the tower.
- **behavior**: Deals periodic damage to enemies within its radius while active.
- **base axes**: damage per tick, tick interval (speed), radius (range)
- **upgrade axes**: damage, speed (shorter interval), range (larger radius)
- **constraints**: Non-projectile; projectile count does not apply.

### Weapon: Fireball
- **tags**: `projectile`, `aoe`
- **role**: Single-target missile that explodes for splash damage.
- **behavior**: Fires one projectile at a time at the nearest enemy; on hit, explodes and damages nearby enemies.
- **base axes**: damage, fire interval (speed), range, projectile count (starts at one)
- **upgrade axes**: damage, speed (faster firing), range, projectile count (more simultaneous shots)
- **constraints**: Splash is area-based; projectile count increases only apply to projectile weapons.


