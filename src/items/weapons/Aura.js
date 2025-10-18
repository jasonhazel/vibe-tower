import { WeaponBase } from './WeaponBase.js';
import { playerState } from '../../state/PlayerState.js';

export class Aura extends WeaponBase {
  constructor(scene, context, config = {}) {
    super(scene, context);
    this.id = 'aura';
    // unify terminology: cooldownMs (accept legacy tickIntervalMs)
    this.cooldownMs = config.cooldownMs ?? config.tickIntervalMs ?? 250;
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

  getUpgradeOptions(ps) {
    const ws = ps?.getWeaponState?.()?.[this.id];
    if (!ws || ws.level <= 0) return [];
    const mk = (key, label) => ({ id: `wupg-${this.id}-${key}`, name: `${this.constructor.name} ${label}` , isUpgrade: true, apply: () => ps.upgradeWeaponById?.(this.id, key), getSlotIconDrawer: () => this.getSlotIconDrawer?.() });
    return [
      mk('damage', 'Damage+'),
      mk('radius', 'Radius+'),
      mk('tick', 'Faster Cooldown'),
    ];
  }

  getRuntimeParams(ps) {
    const stats = ps?.getStats?.() || { area: 1, damage: 1 };
    const ws = ps?.getWeaponState?.()?.[this.id] || { upgrades: {} };
    const up = ws.upgrades || {};
    const dmgMult = (stats.damage || 1) * (1 + 0.15 * (up.damage || 0));
    const radiusMult = (stats.area || 1) * (1 + 0.10 * (up.radius || 0));
    const tickMult = Math.pow(0.9, (up.tick || 0)); // 10% faster per upgrade
    return {
      damagePerTick: Math.max(1, Math.floor(this.damagePerTick * dmgMult)),
      radius: Math.max(1, Math.floor(this.radius * radiusMult)),
      cooldownMs: Math.max(60, Math.floor(this.cooldownMs * tickMult)),
    };
  }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.28);
      gfx.lineStyle(2, 0x66bb6a, 1);
      gfx.strokeCircle(x + size/2, y + size/2, r);
    };
  }

  update(deltaMs) {
    const rp = this.getRuntimeParams(playerState);
    this.timer += deltaMs;
    if (this.timer >= rp.cooldownMs) {
      this.timer = 0;
      this.applyDamage(rp);
    }
  }

  applyDamage(runtime) {
    const { enemiesGroup, centerX, centerY, awardXp, spawnXp } = this.context;
    const r = runtime?.radius ?? this.radius;
    const radiusSq = r * r;
    const toRemove = [];
    enemiesGroup.children.iterate((enemy) => {
      if (!enemy) return;
      const dx = enemy.x - centerX;
      const dy = enemy.y - centerY;
      const distSq = dx * dx + dy * dy;
      if (distSq <= radiusSq) {
        const dmg = runtime?.damagePerTick ?? this.damagePerTick;
        const hp = enemy.getData('hp') - (dmg || this.damagePerTick);
        enemy.setData('hp', hp);
        if (hp <= 0) toRemove.push(enemy);
      }
    });
    toRemove.forEach((enemy) => {
      const ex = enemy.x; const ey = enemy.y;
      const er = enemy.getData('radius') || 10;
      enemy.destroy();
      // slight random offset within enemy radius for where the pickup lands
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * er;
      const px = ex + Math.cos(ang) * r;
      const py = ey + Math.sin(ang) * r;
      spawnXp?.({ x: px, y: py }, 1);
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

  setRadius(newRadius) {
    this.radius = Math.max(0, Math.floor(newRadius));
    this.graphics.clear();
    this.graphics.lineStyle(2, 0x66bb6a, 0.65);
    this.graphics.strokeCircle(this.context.centerX, this.context.centerY, this.radius);
  }

  destroy() {
    this.graphics?.destroy();
  }

  // damage numbers now handled by enemies themselves on hp change
}


