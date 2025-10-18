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

  update(_deltaMs) {
    // to be implemented by subclasses
  }

  destroy() {
    // optional cleanup in subclasses
  }
}


