import { WeaponBase } from './WeaponBase.js';

export class Aura extends WeaponBase {
  constructor(scene, context, config = {}) {
    super(scene, context);
    this.id = 'aura';
    this.tickIntervalMs = config.tickIntervalMs ?? 250;
    this.damagePerTick = config.damagePerTick ?? 5;
    this.radius = config.radius ?? 100;
    this.timer = 0;

    // Visuals
    this.graphics = scene.add.graphics();
    this.graphics.lineStyle(2, 0x66bb6a, 0.65);
    this.graphics.strokeCircle(context.centerX, context.centerY, this.radius);
  }

  getId() {
    return this.id;
  }

  update(deltaMs) {
    this.timer += deltaMs;
    if (this.timer >= this.tickIntervalMs) {
      this.timer = 0;
      this.applyDamage();
    }
  }

  applyDamage() {
    const { enemiesGroup, centerX, centerY, awardXp } = this.context;
    const radiusSq = this.radius * this.radius;
    const toRemove = [];
    enemiesGroup.children.iterate((enemy) => {
      if (!enemy) return;
      const dx = enemy.x - centerX;
      const dy = enemy.y - centerY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radiusSq) {
        const hp = enemy.getData('hp') - this.damagePerTick;
        enemy.setData('hp', hp);
        if (hp <= 0) toRemove.push(enemy);
      }
    });
    toRemove.forEach((enemy) => {
      enemy.destroy();
      awardXp?.(1);
    });
  }

  setCenter(x, y) {
    // Redraw the ring at a new center
    this.graphics.clear();
    this.graphics.lineStyle(2, 0x66bb6a, 0.65);
    this.graphics.strokeCircle(x, y, this.radius);
    this.context.centerX = x;
    this.context.centerY = y;
  }

  destroy() {
    this.graphics?.destroy();
  }
}


