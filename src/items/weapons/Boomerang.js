import { WeaponBase } from './WeaponBase.js';
import { playerState } from '../../state/PlayerState.js';
import { gameConfig } from '../../state/GameConfig.js';

export class Boomerang extends WeaponBase {
  constructor(scene, context, config = {}) {
    super(scene, context);
    this.id = 'boomerang';
    this.baseDamage = config.baseDamage ?? gameConfig.boomerang.baseDamage;
    this.cooldownMs = config.baseCooldownMs ?? gameConfig.boomerang.baseCooldownMs;
    this.range = config.range ?? gameConfig.boomerang.range;
    this.projectileSpeed = config.projectileSpeed ?? gameConfig.boomerang.projectileSpeed;
    this.radius = config.radius ?? gameConfig.boomerang.radius;
    this.pierce = config.pierce ?? gameConfig.boomerang.pierce;
    this.timer = 0;
    this.projectiles = scene.add.group();
    // range visual
    this.rangeGfx = scene.add.graphics();
    this.rangeGfx.lineStyle(2, 0xffc107, 0.5);
    this._redrawRange();
  }

  getId() { return this.id; }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.22);
      gfx.lineStyle(2, 0xffc107, 1);
      gfx.beginPath();
      gfx.arc(x + size/2, y + size/2, r, Math.PI * 0.2, Math.PI * 1.2, false);
      gfx.strokePath();
    };
  }

  getUpgradeOptions(ps) {
    const ws = ps?.getWeaponState?.()?.[this.id];
    if (!ws || ws.level <= 0) return [];
    const mk = (key, label) => ({ id: `wupg-${this.id}-${key}`, name: `${this.constructor.name} ${label}`, short: label, isUpgrade: true, isWeapon: true, weaponId: this.id, upgradeKey: key, rollImpact: (w) => w?.rollUpgradeImpact?.(key), apply: () => ps.upgradeWeaponById?.(this.id, key) });
    return [
      mk('damage', 'Damage+'),
      mk('cooldown', 'Faster Throw'),
      mk('range', 'Range+'),
      mk('speed', 'Throw Speed+'),
      mk('radius', 'Hitbox Radius+'),
      mk('projectiles', 'More Boomerangs'),
    ];
  }

  getRuntimeParams(ps) {
    const stats = ps?.getStats?.() || { area: 1, damage: 1, projectiles: 1, attackSpeed: 1 };
    const ws = ps?.getWeaponState?.()?.[this.id] || { upgrades: {} };
    const up = ws.upgrades || {};
    const dmg = Math.max(1, Math.floor(this.baseDamage * (stats.damage || 1) * (1 + 0.15 * (up.damage || 0))));
    const cd = Math.max(120, Math.floor((this.cooldownMs * Math.pow(0.9, (up.cooldown || 0))) / Math.max(0.1, stats.attackSpeed || 1)));
    const range = Math.floor(this.range * (stats.area || 1) * (1 + 0.10 * (up.range || 0)));
    const speed = this.projectileSpeed * (1 + 0.10 * (up.speed || 0));
    const rad = Math.floor(this.radius * (1 + 0.10 * (up.radius || 0)));
    const count = Math.max(1, Math.floor((stats.projectiles || 1) + (up.projectiles || 0)));
    const pierce = Math.max(0, Math.floor(this.pierce));
    return { damage: dmg, cooldownMs: cd, range, projectileSpeed: speed, radius: rad, projectiles: count, pierce };
  }

  update(deltaMs) {
    const rp = this.getRuntimeParams(playerState);
    this.timer += deltaMs;
    // Move existing boomerangs
    this.projectiles.children.iterate((p) => {
      if (!p) return;
      // progress t: 0..1 out, 1..2 back to origin
      p.t += (p.speed * deltaMs) / Math.max(1, p.totalDist);
      const tt = Math.min(2, p.t);
      const forward = tt <= 1;
      const u = forward ? tt : (2 - tt);
      // position along line from origin->target at fraction u
      p.x = p.ox + (p.tx - p.ox) * u;
      p.y = p.oy + (p.ty - p.oy) * u;
      // collision on both legs
      this._checkHit(p, rp);
      if (tt >= 2) {
        p.destroy();
      }
    });

    if (this.timer >= rp.cooldownMs) {
      this.timer = 0;
      this._throw(rp);
    }
  }

  _throw(rp) {
    const { centerX, centerY } = this.context;
    // choose targets by sampling enemies in range; if none, throw in random direction
    const enemies = this._collectEnemiesInRange(centerX, centerY, rp.range);
    const throws = Math.max(1, rp.projectiles);
    for (let i = 0; i < throws; i++) {
      let targetX, targetY;
      if (enemies.length > 0) {
        const e = enemies[Math.floor(Math.random() * enemies.length)];
        targetX = e.x; targetY = e.y;
      } else {
        const ang = Math.random() * Math.PI * 2;
        targetX = centerX + Math.cos(ang) * rp.range;
        targetY = centerY + Math.sin(ang) * rp.range;
      }
      this._spawnBoomerang(centerX, centerY, targetX, targetY, rp);
    }
  }

  _spawnBoomerang(ox, oy, tx, ty, rp) {
    const g = this.scene.add.circle(ox, oy, rp.radius, 0xffd54f);
    g.ox = ox; g.oy = oy; g.tx = tx; g.ty = ty;
    g.totalDist = Math.hypot(tx - ox, ty - oy);
    g.speed = rp.projectileSpeed / 1000; // per ms scaled
    g.t = 0; // 0..2
    g.pierceLeft = rp.pierce;
    this.projectiles.add(g);
  }

  _checkHit(p, rp) {
    if (!p || p._dead) return;
    const enemies = this.context.enemiesGroup;
    let pierce = p.pierceLeft;
    const hits = [];
    enemies.children.iterate((e) => {
      if (!e) return;
      const dx = e.x - p.x; const dy = e.y - p.y;
      const rr = rp.radius + (e.getData('radius') || 10);
      if (dx*dx + dy*dy <= rr*rr) hits.push(e);
    });
    if (hits.length === 0) return;
    for (const h of hits) {
      if (pierce < 0) break;
      const hp = (h.getData('hp') || 0) - rp.damage;
      h.setData('hp', hp);
      if (hp <= 0) {
        const ex = h.x; const ey = h.y; const er = h.getData('radius') || 10;
        h.destroy();
        const ang = Math.random() * Math.PI * 2; const rr = Math.random() * er;
        this.context.spawnXp?.({ x: ex + Math.cos(ang) * rr, y: ey + Math.sin(ang) * rr }, 1);
      }
      pierce -= 1;
    }
    p.pierceLeft = pierce;
    if (pierce < 0) { p._dead = true; p.destroy(); }
  }

  _collectEnemiesInRange(x, y, maxRange) {
    const r2 = maxRange * maxRange;
    const out = [];
    this.context.enemiesGroup.children.iterate((e) => {
      if (!e) return;
      const dx = e.x - x; const dy = e.y - y; const d2 = dx*dx + dy*dy;
      if (d2 <= r2) out.push(e);
    });
    return out;
  }

  _redrawRange() {
    const { centerX, centerY } = this.context;
    this.rangeGfx.clear();
    this.rangeGfx.lineStyle(2, 0xffc107, 0.5);
    const rp = this.getRuntimeParams(playerState);
    this.rangeGfx.strokeCircle(centerX, centerY, rp.range);
  }

  setCenter(x, y) {
    this.context.centerX = x; this.context.centerY = y;
    this._redrawRange();
  }

  destroy() {
    this.projectiles.clear(true, true);
    this.rangeGfx?.destroy();
  }
}


