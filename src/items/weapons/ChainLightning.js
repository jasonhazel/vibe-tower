import { WeaponBase } from './WeaponBase.js';
import { playerState } from '../../state/PlayerState.js';
import { gameConfig } from '../../state/GameConfig.js';

export class ChainLightning extends WeaponBase {
  constructor(scene, context, config = {}) {
    super(scene, context);
    this.id = 'chainLightning';
    this.baseDamage = config.baseDamage ?? gameConfig.chainLightning.baseDamage;
    this.cooldownMs = config.baseCooldownMs ?? gameConfig.chainLightning.baseCooldownMs;
    this.range = config.range ?? gameConfig.chainLightning.range;
    this.chainRange = config.chainRange ?? gameConfig.chainLightning.chainRange;
    this.maxJumps = config.maxJumps ?? gameConfig.chainLightning.maxJumps;
    this.falloff = config.falloff ?? gameConfig.chainLightning.falloff;
    this.timer = 0;
    // Visual: range ring showing initial target acquisition radius
    this.rangeGfx = scene.add.graphics();
    this._redrawRange();
  }

  getId() { return this.id; }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      // simple zig-zag lightning glyph
      const cx = x + size / 2;
      const cy = y + size / 2;
      const s = Math.floor(size * 0.28);
      gfx.lineStyle(2, 0x90caf9, 1);
      gfx.beginPath();
      gfx.moveTo(cx - s * 0.6, cy - s * 0.8);
      gfx.lineTo(cx - s * 0.2, cy - s * 0.2);
      gfx.lineTo(cx - s * 0.7, cy + s * 0.0);
      gfx.lineTo(cx + s * 0.2, cy + s * 0.7);
      gfx.strokePath();
    };
  }

  getUpgradeOptions(ps) {
    const ws = ps?.getWeaponState?.()?.[this.id];
    if (!ws || ws.level <= 0) return [];
    const mk = (key, label) => ({ id: `wupg-${this.id}-${key}`, name: `${this.constructor.name} ${label}`, short: label, isUpgrade: true, isWeapon: true, weaponId: this.id, upgradeKey: key, rollImpact: (w) => w?.rollUpgradeImpact?.(key), apply: () => ps.upgradeWeaponById?.(this.id, key) });
    return [
      mk('damage', 'Damage+'),
      mk('cooldown', 'Faster Cooldown'),
      mk('range', 'Range+'),
      // reuse radius key to mean chainRange for upgrade tables
      mk('radius', 'Chain Range+'),
      // reuse projectiles key to grant additional jumps
      mk('projectiles', 'More Chains'),
    ];
  }

  getRuntimeParams(ps) {
    const stats = ps?.getStats?.() || { area: 1, damage: 1, projectiles: 1, attackSpeed: 1 };
    const ws = ps?.getWeaponState?.()?.[this.id] || { upgrades: {} };
    const up = ws.upgrades || {};
    const dmg = Math.max(1, Math.floor(this.baseDamage * (stats.damage || 1) * (1 + 0.15 * (up.damage || 0))));
    const cd = Math.max(150, Math.floor((this.cooldownMs * Math.pow(0.9, (up.cooldown || 0))) / Math.max(0.1, stats.attackSpeed || 1)));
    const range = Math.floor(this.range * (stats.area || 1) * (1 + 0.10 * (up.range || 0)));
    const chainRange = Math.floor(this.chainRange * (stats.area || 1) * (1 + 0.10 * (up.radius || 0)));
    // Tome of Projectiles increases jumps additively beyond base (stats.projectiles is 1-based)
    const extraFromStats = Math.max(0, Math.floor((stats.projectiles || 1) - 1));
    const jumps = Math.max(0, Math.floor((this.maxJumps || 0) + extraFromStats + (up.projectiles || 0)));
    const falloff = this.falloff; // keep constant for now
    return { damage: dmg, cooldownMs: cd, range, chainRange, maxJumps: jumps, falloff };
  }

  update(deltaMs) {
    const rp = this.getRuntimeParams(playerState);
    this.timer += deltaMs;
    if (this.timer >= rp.cooldownMs) {
      this.timer = 0;
      this._cast(rp);
    }
  }

  _cast(rp) {
    const { centerX, centerY } = this.context;
    const first = this._findNearestEnemy(centerX, centerY, rp.range, new Set());
    if (!first) return;
    const visited = new Set();
    const chain = [first];
    visited.add(first);
    let current = first;
    for (let i = 0; i < rp.maxJumps; i++) {
      const next = this._findNearestEnemy(current.x, current.y, rp.chainRange, visited);
      if (!next) break;
      chain.push(next);
      visited.add(next);
      current = next;
    }
    // Apply damage and draw bolts
    let prevX = centerX;
    let prevY = centerY;
    for (let i = 0; i < chain.length; i++) {
      const target = chain[i];
      const dmg = Math.max(1, Math.floor(rp.damage * Math.pow(rp.falloff, i)));
      const hp = (target.getData('hp') || 0) - dmg;
      target.setData('hp', hp);
      this._drawBolt(prevX, prevY, target.x, target.y);
      if (hp <= 0) {
        const ex = target.x; const ey = target.y; const er = target.getData('radius') || 10;
        target.destroy();
        const ang = Math.random() * Math.PI * 2; const rr = Math.random() * er;
        this.context.spawnXp?.({ x: ex + Math.cos(ang) * rr, y: ey + Math.sin(ang) * rr }, 1);
      }
      prevX = target.x; prevY = target.y;
    }
  }

  _drawBolt(x1, y1, x2, y2) {
    const g = this.scene.add.graphics();
    g.lineStyle(2, 0x90caf9, 1);
    // jittered polyline for a lightning look
    const segments = 6;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const xi = x1 + (x2 - x1) * t;
      const yi = y1 + (y2 - y1) * t;
      const amp = 6 * (1 - Math.abs(0.5 - t) * 2); // taper at ends
      const nx = -(y2 - y1);
      const ny = (x2 - x1);
      const len = Math.max(1, Math.hypot(nx, ny));
      const ox = (nx / len) * (Math.random() * amp - amp / 2);
      const oy = (ny / len) * (Math.random() * amp - amp / 2);
      points.push({ x: xi + ox, y: yi + oy });
    }
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
    g.strokePath();
    // fade and destroy quickly
    this.scene.tweens.add({ targets: g, alpha: 0, duration: 120, onComplete: () => g.destroy() });
  }

  _redrawRange() {
    const { centerX, centerY } = this.context;
    this.rangeGfx.clear();
    this.rangeGfx.lineStyle(2, 0x90caf9, 0.5);
    const rp = this.getRuntimeParams(playerState);
    this.rangeGfx.strokeCircle(centerX, centerY, rp.range);
  }

  _findNearestEnemy(x, y, maxRange, excludeSet) {
    const r2 = maxRange * maxRange;
    let best = null; let bestD2 = Infinity;
    this.context.enemiesGroup.children.iterate((e) => {
      if (!e || (excludeSet && excludeSet.has(e))) return;
      const dx = e.x - x; const dy = e.y - y; const d2 = dx*dx + dy*dy;
      if (d2 <= r2 && d2 < bestD2) { best = e; bestD2 = d2; }
    });
    return best;
  }

  setCenter(x, y) {
    this.context.centerX = x; this.context.centerY = y;
    this._redrawRange();
  }

  destroy() {
    this.rangeGfx?.destroy();
  }
}


