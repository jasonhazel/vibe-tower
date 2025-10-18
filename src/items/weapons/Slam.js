import { WeaponBase } from './WeaponBase.js';
import { playerState } from '../../state/PlayerState.js';
import { gameConfig } from '../../state/GameConfig.js';

export class Slam extends WeaponBase {
  constructor(scene, context, config = {}) {
    super(scene, context);
    this.id = 'slam';
    this.cooldownMs = config.baseCooldownMs ?? gameConfig.slam.baseCooldownMs;
    this.baseDamage = config.baseDamage ?? gameConfig.slam.baseDamage;
    this.maxRadius = config.maxRadius ?? gameConfig.slam.maxRadius;
    this.growthSpeed = config.growthSpeed ?? gameConfig.slam.growthSpeed; // px/sec
    this.timer = 0;
    this.ring = null; // graphics ring
    this.active = false;
    this.currentRadius = 0;
  }

  getId() { return this.id; }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.22);
      gfx.lineStyle(2, 0xffeb3b, 1);
      gfx.strokeCircle(x + size/2, y + size/2, r);
    };
  }

  getUpgradeOptions(ps) {
    const ws = ps?.getWeaponState?.()?.[this.id];
    if (!ws || ws.level <= 0) return [];
    const mk = (key, label) => ({ id: `wupg-${this.id}-${key}`, name: `${this.constructor.name} ${label}`, isUpgrade: true, apply: () => ps.upgradeWeaponById?.(this.id, key), getSlotIconDrawer: () => this.getSlotIconDrawer?.() });
    return [
      mk('damage', 'Damage+'),
      mk('cooldown', 'Faster Cooldown'),
      mk('radius', 'Max Radius+'),
      mk('growth', 'Faster Growth'),
    ];
  }

  getRuntimeParams(ps) {
    const stats = ps?.getStats?.() || { area: 1, damage: 1, attackSpeed: 1 };
    const ws = ps?.getWeaponState?.()?.[this.id] || { upgrades: {} };
    const up = ws.upgrades || {};
    const dmg = Math.max(1, Math.floor(this.baseDamage * (stats.damage || 1) * (1 + 0.15 * (up.damage || 0))));
    const cd = Math.max(180, Math.floor((this.cooldownMs * Math.pow(0.9, (up.cooldown || 0))) / Math.max(0.1, stats.attackSpeed || 1)));
    const maxR = Math.floor(this.maxRadius * (stats.area || 1) * (1 + 0.10 * (up.radius || 0)));
    const growth = this.growthSpeed * (1 + 0.10 * (up.growth || 0));
    return { damage: dmg, cooldownMs: cd, maxRadius: maxR, growthSpeed: growth };
  }

  update(deltaMs) {
    const rp = this.getRuntimeParams(playerState);
    this.timer += deltaMs;
    if (!this.active) {
      if (this.timer >= rp.cooldownMs) {
        this.timer = 0;
        this._startSlam(rp);
      }
      return;
    }
    // grow the ring
    const dr = (rp.growthSpeed * deltaMs) / 1000;
    this.currentRadius = Math.min(rp.maxRadius, this.currentRadius + dr);
    this._redrawRing(rp);
    this._applyDamageAtRadius(rp);
    if (this.currentRadius >= rp.maxRadius) {
      this._endSlam();
    }
  }

  _startSlam(rp) {
    this.active = true;
    this.currentRadius = 1;
    if (!this.ring) this.ring = this.scene.add.graphics();
    this._redrawRing(rp);
  }

  _endSlam() {
    this.active = false;
    this.currentRadius = 0;
    this.ring?.clear();
  }

  _redrawRing(rp) {
    const { centerX, centerY } = this.context;
    const t = this.currentRadius / Math.max(1, rp.maxRadius); // 0..1
    const alpha = Math.max(0.1, 1 - t); // fade out as it grows
    const color = 0xffeb3b;
    this.ring.clear();
    this.ring.lineStyle(3, color, alpha);
    this.ring.strokeCircle(centerX, centerY, this.currentRadius);
  }

  _applyDamageAtRadius(rp) {
    // Damage scales down linearly from base at r=0 to 0 at r=max
    const t = this.currentRadius / Math.max(1, rp.maxRadius);
    const dmg = Math.max(0, Math.floor(rp.damage * (1 - t)));
    if (dmg <= 0) return;
    const r = this.currentRadius;
    const rTol = 4; // small tolerance so collisions feel responsive
    const rMin = Math.max(0, r - rTol);
    const rMax = r + rTol;
    const { enemiesGroup, centerX, centerY } = this.context;
    const toRemove = [];
    enemiesGroup.children.iterate((enemy) => {
      if (!enemy) return;
      const dx = enemy.x - centerX;
      const dy = enemy.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const er = enemy.getData('radius') || 10;
      // consider hit if enemy edge overlaps ring radius
      const edgeDist = Math.max(0, dist - er);
      if (edgeDist >= rMin && edgeDist <= rMax) {
        const hp = (enemy.getData('hp') || 0) - dmg;
        enemy.setData('hp', hp);
        if (hp <= 0) toRemove.push(enemy);
      }
    });
    toRemove.forEach((enemy) => {
      const ex = enemy.x; const ey = enemy.y; const er = enemy.getData('radius') || 10;
      enemy.destroy();
      const ang = Math.random() * Math.PI * 2; const rr = Math.random() * er;
      this.context.spawnXp?.({ x: ex + Math.cos(ang) * rr, y: ey + Math.sin(ang) * rr }, 1);
    });
  }

  destroy() {
    this.ring?.destroy();
  }

  setCenter(x, y) {
    // visuals follow center automatically on redraw
  }
}


