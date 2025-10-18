export class WeaponBase {
  constructor(scene, context) {
    this.scene = scene;
    this.context = context; // { enemiesGroup, centerX, centerY, awardXp }
  }

  getId() {
    return 'base';
  }

  // Optional: return a function(gfx, x, y, size) that draws the slot icon for this weapon
  getSlotIconDrawer() {
    return null;
  }

  // Apply selection to state
  apply(ps) {
    if (!ps || !this.id) return;
    ps.addWeaponById?.(this.id);
  }

  // Return upgrade options tailored to this weapon
  getUpgradeOptions(ps) {
    const ws = ps?.getWeaponState?.()?.[this.id];
    if (!ws || ws.level <= 0) return [];
    return [];
  }

  // Compute runtime params (override in weapons)
  getRuntimeParams(ps) {
    return {};
  }

  update(_deltaMs) {
    // to be implemented by subclasses
  }

  destroy() {
    // optional cleanup in subclasses
  }
}


