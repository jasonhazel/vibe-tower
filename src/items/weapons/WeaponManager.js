export class WeaponManager {
  constructor(scene, context) {
    this.scene = scene;
    this.context = context;
    this.weapons = [];
  }

  add(weapon) {
    // Prevent duplicate single-instance weapons by id
    try {
      const id = weapon?.getId?.();
      if (id && this.weapons.some(w => w.getId?.() === id)) {
        weapon.destroy?.();
        this.scene.game.events.emit('weapons:update', this.getWeaponIds());
        return weapon;
      }
    } catch (_) {}
    this.weapons.push(weapon);
    this.scene.game.events.emit('weapons:update', this.getWeaponIds());
    return weapon;
  }

  removeById(id) {
    this.weapons = this.weapons.filter((w) => {
      const keep = w.getId() !== id;
      if (!keep) w.destroy?.();
      return keep;
    });
    this.scene.game.events.emit('weapons:update', this.getWeaponIds());
  }

  update(deltaMs) {
    for (let i = 0; i < this.weapons.length; i++) {
      this.weapons[i].update(deltaMs);
    }
  }

  clear() {
    this.weapons.forEach((w) => w.destroy?.());
    this.weapons.length = 0;
    this.scene.game.events.emit('weapons:update', this.getWeaponIds());
  }

  getWeaponIds() {
    return this.weapons.map((w) => w.getId());
  }
}


