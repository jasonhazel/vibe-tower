export class WeaponBase {
  constructor(scene, context) {
    this.scene = scene;
    this.context = context; // { enemiesGroup, centerX, centerY, awardXp }
  }

  getId() {
    return 'base';
  }

  update(_deltaMs) {
    // to be implemented by subclasses
  }

  destroy() {
    // optional cleanup in subclasses
  }
}


