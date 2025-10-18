import { WeaponBase } from './WeaponBase.js';
import { playerState } from '../state/PlayerState.js';
import { gameConfig } from '../state/GameConfig.js';

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
  }

  getId() { return this.id; }

  update(deltaMs) {
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
        if ((dx*dx + dy*dy) <= (this.radius + (e.getData('radius')||10))**2) hit = e;
      });
      if (hit) {
        const dmgMult = playerState.getStats?.().damage ?? 1;
        const dmg = Math.max(1, Math.floor(this.baseDamage * dmgMult));
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

    if (this.timer >= this._currentCooldown()) {
      this.timer = 0;
      this._attemptShoot();
    }
  }

  _attemptShoot() {
    const { centerX, centerY } = this.context;
    const enemy = this._findNearestEnemy(centerX, centerY, this._currentRange());
    if (!enemy) return;

    const count = this._projectileCount();
    for (let i = 0; i < count; i++) {
      this._spawnProjectileTowards(centerX, centerY, enemy.x, enemy.y, (i - (count-1)/2) * 0.08);
    }
  }

  _spawnProjectileTowards(px, py, tx, ty, angleOffset = 0) {
    const angle = Math.atan2(ty - py, tx - px) + angleOffset;
    const vx = Math.cos(angle) * this.projectileSpeed;
    const vy = Math.sin(angle) * this.projectileSpeed;
    const life = (this._currentRange() / this.projectileSpeed) * 1000;
    const g = this.scene.add.circle(px, py, this.radius, 0xff7043);
    g.vx = vx; g.vy = vy; g.life = life;
    this.projectiles.add(g);
  }

  _findNearestEnemy(x, y, maxRange) {
    // Now returns a random enemy within range instead of the nearest
    const r2 = maxRange * maxRange;
    const candidates = [];
    this.context.enemiesGroup.children.iterate((e) => {
      if (!e) return;
      const dx = e.x - x; const dy = e.y - y; const d2 = dx*dx + dy*dy;
      if (d2 <= r2) candidates.push(e);
    });
    if (candidates.length === 0) return null;
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  }

  _currentCooldown() {
    const atk = playerState.getStats?.().attackSpeed ?? 1; // higher = faster
    const base = this.cooldownMs;
    // scale inversely: cooldown / atk
    return Math.max(120, Math.floor(base / Math.max(0.1, atk)));
  }

  _currentRange() {
    const area = playerState.getStats?.().area ?? 1;
    return Math.floor(this.range * area);
  }

  _projectileCount() {
    // projectiles stat should be integer-based
    const proj = Math.max(1, Math.floor(playerState.getStats?.().projectiles ?? 1));
    return proj;
  }

  destroy() {
    this.projectiles.clear(true, true);
  }
}


