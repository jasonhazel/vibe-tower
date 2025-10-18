import { WeaponBase } from './WeaponBase.js';
import { playerState } from '../../state/PlayerState.js';
import { gameConfig } from '../../state/GameConfig.js';

export class Fireball extends WeaponBase {
  constructor(scene, context, config = {}) {
    super(scene, context);
    this.id = 'fireball';
    this.cooldownMs = config.baseCooldownMs ?? gameConfig.fireball.baseCooldownMs;
    this.projectileSpeed = config.projectileSpeed ?? gameConfig.fireball.projectileSpeed;
    this.range = config.range ?? gameConfig.fireball.range;
    this.baseDamage = config.baseDamage ?? gameConfig.fireball.baseDamage;
    this.radius = config.radius ?? gameConfig.fireball.radius;
    this.timer = 0;
    this.projectiles = scene.add.group();
    // range visual
    this.rangeGfx = scene.add.graphics();
    this.rangeGfx.lineStyle(2, 0xff5252, 0.6);
    this._redrawRange();
  }

  getUpgradeOptions(ps) {
    const ws = ps?.getWeaponState?.()?.[this.id];
    if (!ws || ws.level <= 0) return [];
    const mk = (key, label) => ({ id: `wupg-${this.id}-${key}`, name: `${this.constructor.name} ${label}`, isUpgrade: true, apply: () => ps.upgradeWeaponById?.(this.id, key), getSlotIconDrawer: () => this.getSlotIconDrawer?.() });
    return [
      mk('damage', 'Damage+'),
      mk('cooldown', 'Faster Cast'),
      mk('range', 'Range+'),
      mk('speed', 'Projectile Speed+'),
      mk('radius', 'Explosion Radius+'),
      mk('projectiles', 'More Projectiles'),
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
    const proj = Math.max(1, Math.floor((stats.projectiles || 1) + (up.projectiles || 0)));
    return { damage: dmg, cooldownMs: cd, range, projectileSpeed: speed, radius: rad, projectiles: proj };
  }

  getId() { return this.id; }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.26);
      gfx.fillStyle(0xff5252, 1);
      gfx.fillCircle(x + size/2, y + size/2, r);
    };
  }

  update(deltaMs) {
    const rp = this.getRuntimeParams(playerState);
    this.timer += deltaMs;
    // Move active projectiles
    this.projectiles.children.iterate((p) => {
      if (!p) return;
      p.x += p.vx * (deltaMs / 1000);
      p.y += p.vy * (deltaMs / 1000);
      p.life -= deltaMs;
      if (p.life <= 0) { p.destroy(); return; }
      // collision with enemies (AABB radius check)
      const enemies = this.context.enemiesGroup;
      let hit = null;
      enemies.children.iterate((e) => {
        if (hit || !e) return;
        const dx = e.x - p.x; const dy = e.y - p.y;
        if ((dx*dx + dy*dy) <= (rp.radius + (e.getData('radius')||10))**2) hit = e;
      });
      if (hit) {
        const dmg = rp.damage;
        const hp = hit.getData('hp') - dmg;
        hit.setData('hp', hp);
        if (hp <= 0) {
          const { spawnXp } = this.context;
          const ex = hit.x, ey = hit.y, er = hit.getData('radius') || 10;
          hit.destroy();
          const ang = Math.random() * Math.PI * 2; const r = Math.random() * er;
          spawnXp?.({ x: ex + Math.cos(ang) * r, y: ey + Math.sin(ang) * r }, 1);
        }
        p.destroy();
      }
    });

    if (this.timer >= rp.cooldownMs) {
      this.timer = 0;
      this._attemptShoot();
    }
  }

  _attemptShoot() {
    const { centerX, centerY } = this.context;
    const rp = this.getRuntimeParams(playerState);
    const candidates = this._collectEnemiesInRange(centerX, centerY, rp.range);
    if (candidates.length === 0) return;

    const count = rp.projectiles;
    const shots = Math.min(count, candidates.length);
    const pool = candidates.slice();
    for (let i = 0; i < shots; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const target = pool.splice(idx, 1)[0]; // sample without replacement
      this._spawnProjectileTowards(centerX, centerY, target.x, target.y, 0, rp);
    }
  }

  _spawnProjectileTowards(px, py, tx, ty, angleOffset = 0, rp) {
    const angle = Math.atan2(ty - py, tx - px) + angleOffset;
    const vx = Math.cos(angle) * rp.projectileSpeed;
    const vy = Math.sin(angle) * rp.projectileSpeed;
    const life = (rp.range / rp.projectileSpeed) * 1000;
    const g = this.scene.add.circle(px, py, rp.radius, 0xff7043);
    g.vx = vx; g.vy = vy; g.life = life;
    this.projectiles.add(g);
  }

  _findNearestEnemy(x, y, maxRange) {
    // kept for potential future use
    const r2 = maxRange * maxRange;
    let best = null; let bestD2 = Infinity;
    this.context.enemiesGroup.children.iterate((e) => {
      if (!e) return;
      const dx = e.x - x; const dy = e.y - y; const d2 = dx*dx + dy*dy;
      if (d2 <= r2 && d2 < bestD2) { best = e; bestD2 = d2; }
    });
    return best;
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


  destroy() {
    this.projectiles.clear(true, true);
    this.rangeGfx?.destroy();
  }

  setCenter(x, y) {
    this.context.centerX = x; this.context.centerY = y;
    this._redrawRange();
  }

  _redrawRange() {
    const { centerX, centerY } = this.context;
    this.rangeGfx.clear();
    this.rangeGfx.lineStyle(2, 0xff5252, 0.5);
    const r = this._currentRange();
    this.rangeGfx.strokeCircle(centerX, centerY, r);
  }
}


