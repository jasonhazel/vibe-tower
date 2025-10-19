import { WeaponBase } from './WeaponBase.js';
import { playerState } from '../../state/PlayerState.js';
import { gameConfig } from '../../state/GameConfig.js';

export class Blades extends WeaponBase {
  constructor(scene, context, config = {}) {
    super(scene, context);
    this.id = 'blades';
    this.baseDamage = config.baseDamage ?? gameConfig.blades.baseDamage;
    this.cooldownMs = config.baseCooldownMs ?? gameConfig.blades.baseCooldownMs;
    this.orbitRadius = config.orbitRadius ?? gameConfig.blades.orbitRadius;
    this.rotationSpeed = config.rotationSpeed ?? gameConfig.blades.rotationSpeed; // deg/sec
    this.bladeLength = config.bladeLength ?? gameConfig.blades.bladeLength;
    this.bladeHitRadius = config.bladeHitRadius ?? gameConfig.blades.bladeHitRadius;
    this.baseBladeCount = config.bladeCount ?? gameConfig.blades.bladeCount;
    this.timer = 0;
    this.blades = [];
    // Visual range ring for orbit radius
    this.rangeGfx = scene.add.graphics();
    this._redrawRange();
  }

  getId() { return this.id; }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.26);
      gfx.lineStyle(2, 0x80deea, 1);
      // draw two small blades opposite each other
      gfx.beginPath(); gfx.moveTo(x + size/2 - r, y + size/2); gfx.lineTo(x + size/2 - r/2, y + size/2 - r/4); gfx.lineTo(x + size/2 - r/2, y + size/2 + r/4); gfx.closePath(); gfx.strokePath();
      gfx.beginPath(); gfx.moveTo(x + size/2 + r, y + size/2); gfx.lineTo(x + size/2 + r/2, y + size/2 - r/4); gfx.lineTo(x + size/2 + r/2, y + size/2 + r/4); gfx.closePath(); gfx.strokePath();
    };
  }

  getUpgradeOptions(ps) {
    const ws = ps?.getWeaponState?.()?.[this.id];
    if (!ws || ws.level <= 0) return [];
    const mk = (key, label) => ({ id: `wupg-${this.id}-${key}`, name: `${this.constructor.name} ${label}`, short: label, isUpgrade: true, isWeapon: true, weaponId: this.id, upgradeKey: key, rollImpact: (w) => w?.rollUpgradeImpact?.(key), apply: () => ps.upgradeWeaponById?.(this.id, key) });
    return [
      mk('damage', 'Damage+'),
      mk('cooldown', 'Faster Ticks'),
      mk('radius', 'Orbit Radius+'),
      mk('speed', 'Rotation Speed+'),
      mk('projectiles', 'More Blades'),
    ];
  }

  getRuntimeParams(ps) {
    const stats = ps?.getStats?.() || { area: 1, damage: 1, projectiles: 1, attackSpeed: 1 };
    const ws = ps?.getWeaponState?.()?.[this.id] || { upgrades: {} };
    const up = ws.upgrades || {};
    const dmg = Math.max(1, Math.floor(this.baseDamage * (stats.damage || 1) * (1 + 0.15 * (up.damage || 0))));
    const cd = Math.max(60, Math.floor((this.cooldownMs * Math.pow(0.9, (up.cooldown || 0))) / Math.max(0.1, stats.attackSpeed || 1)));
    const radius = Math.floor(this.orbitRadius * (stats.area || 1) * (1 + 0.10 * (up.radius || 0)));
    const rotSpeed = this.rotationSpeed * (1 + 0.10 * (up.speed || 0));
    const count = Math.max(1, Math.floor((this.baseBladeCount || 1) + (up.projectiles || 0) + Math.max(0, Math.floor((stats.projectiles || 1) - 1))));
    return { damage: dmg, cooldownMs: cd, radius, rotationSpeed: rotSpeed, bladeCount: count, bladeHitRadius: this.bladeHitRadius, bladeLength: this.bladeLength };
  }

  update(deltaMs) {
    const rp = this.getRuntimeParams(playerState);
    this.timer += deltaMs;
    // Ensure correct number of blade sprites
    if (this.blades.length !== rp.bladeCount) {
      this.blades.forEach(b => b.g?.destroy());
      this.blades = [];
      for (let i = 0; i < rp.bladeCount; i++) {
        const g = this.scene.add.graphics();
        this._drawBlade(g, this.bladeLength);
        this.blades.push({ g, angle: (i / rp.bladeCount) * Math.PI * 2 });
      }
    }
    // Rotate and position blades
    const { centerX, centerY } = this.context;
    const angVel = (rp.rotationSpeed * Math.PI / 180) * (deltaMs / 1000);
    for (const b of this.blades) {
      b.angle = (b.angle + angVel) % (Math.PI * 2);
      const x = centerX + Math.cos(b.angle) * rp.radius;
      const y = centerY + Math.sin(b.angle) * rp.radius;
      b.g.clear();
      b.g.x = x; b.g.y = y; b.g.rotation = b.angle + Math.PI / 2;
      this._drawBlade(b.g, this.bladeLength);
    }
    // Apply contact damage periodically
    if (this.timer >= rp.cooldownMs) {
      this.timer = 0;
      this._applyDamage(rp);
    }
  }

  _applyDamage(rp) {
    const { enemiesGroup } = this.context;
    enemiesGroup.children.iterate((e) => {
      if (!e) return;
      const ex = e.x; const ey = e.y; const er = e.getData('radius') || 10;
      for (const b of this.blades) {
        const dx = ex - b.g.x; const dy = ey - b.g.y;
        const hitR = rp.bladeHitRadius + er;
        if (dx*dx + dy*dy <= hitR*hitR) {
          const hp = (e.getData('hp') || 0) - rp.damage;
          e.setData('hp', hp);
          if (hp <= 0) {
            const ang = Math.random() * Math.PI * 2; const r = Math.random() * er;
            this.context.spawnXp?.({ x: ex + Math.cos(ang) * r, y: ey + Math.sin(ang) * r }, 1);
            e.destroy();
          }
          break;
        }
      }
    });
  }

  _drawBlade(g, length) {
    const L = Math.max(6, Math.floor(length));
    g.lineStyle(3, 0x80deea, 1);
    g.beginPath();
    g.moveTo(-L, 0);
    g.lineTo(0, -L * 0.35);
    g.lineTo(L, 0);
    g.lineTo(0, L * 0.35);
    g.closePath();
    g.strokePath();
  }

  _redrawRange() {
    const { centerX, centerY } = this.context;
    this.rangeGfx.clear();
    this.rangeGfx.lineStyle(2, 0x80deea, 0.5);
    const rp = this.getRuntimeParams(playerState);
    this.rangeGfx.strokeCircle(centerX, centerY, rp.radius);
  }

  setCenter(x, y) {
    this.context.centerX = x; this.context.centerY = y;
    this._redrawRange();
  }

  destroy() {
    this.blades.forEach(b => b.g?.destroy());
    this.blades.length = 0;
    this.rangeGfx?.destroy();
  }
}


