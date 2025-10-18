import { EventBus } from './EventBus.js';

class PlayerStateImpl {
  constructor() {
    this.reset();
  }

  reset() {
    this.xpTotal = 0;
    this.level = 1; // starting level
    this.xpCurrent = 0; // progress within current level
    this.xpNeeded = 10; // requirement to reach next level
    this.healthCurrent = 100;
    this.healthMax = 100;
    this.shield = 0;
    this.pickupRadius = null; // null -> use gameConfig default
    // Stat multipliers (tuned via perks)
    this.stats = {
      area: 1,
      damage: 1,
      projectiles: 1,
      attackSpeed: 1,
      xp: 1,
      pickup: 1,
    };
    // Tome ownership and upgrade counts
    this.tomes = { area: 0, damage: 0, projectiles: 0, attackSpeed: 0, xp: 0, pickup: 0 };
    this.tomeUpgrades = { area: 0, damage: 0, projectiles: 0, attackSpeed: 0, xp: 0, pickup: 0 };
  }

  getXp() { return this.xpTotal; }
  getLevel() { return this.level; }
  getXpCurrent() { return this.xpCurrent; }
  getXpNeeded() { return this.xpNeeded; }

  // Stats API
  getStats() { return { ...this.stats }; }
  setStat(name, value) {
    if (!(name in this.stats)) return;
    const v = Math.max(0, value);
    this.stats[name] = v;
    EventBus.emit('stats:update', this.getStats());
  }
  modStat(name, delta) {
    if (!(name in this.stats)) return;
    this.setStat(name, this.stats[name] + delta);
  }

  // Tome system: recompute derived stats from tomes and upgrades
  addTome(statKey) {
    if (!(statKey in this.tomes)) return;
    this.tomes[statKey] += 1;
    this._recomputeStatsFromTomes();
  }

  upgradeTome(statKey) {
    if (!(statKey in this.tomes)) return; // only for valid tomes
    if (this.tomes[statKey] <= 0) return; // must own at least one
    this.tomeUpgrades[statKey] += 1;
    this._recomputeStatsFromTomes();
  }

  _recomputeStatsFromTomes() {
    // base stats
    const base = { area: 1, damage: 1, projectiles: 1, attackSpeed: 1, xp: 1, pickup: 1 };
    const inc = { area: 0.2, damage: 0.2, projectiles: 1, attackSpeed: 0.2, xp: 0.2, pickup: 0.2 };
    const multStep = 0.15; // each upgrade adds +0.15 to the total multiplier
    const next = { ...base };
    for (const key of Object.keys(this.tomes)) {
      const count = this.tomes[key] || 0;
      const upg = this.tomeUpgrades[key] || 0;
      // Total multiplier = base + (#tomes * per-tome increment) + (upgrades * 0.15)
      next[key] = base[key] + count * inc[key] + upg * multStep;
    }
    this.stats = next;
    EventBus.emit('stats:update', this.getStats());
  }

  addXp(amount) {
    if (!amount || amount <= 0) return;
    const xpMul = this.stats?.xp ?? 1;
    const grant = Math.max(1, Math.floor(amount * xpMul));
    this.xpTotal += grant;
    this.xpCurrent += grant;
    let leveled = false;
    while (this.xpCurrent >= this.xpNeeded) {
      this.xpCurrent -= this.xpNeeded;
      this.level += 1;
      // increase requirement by 1.5x each level (ceil to integer)
      this.xpNeeded = Math.ceil(this.xpNeeded * 1.5);
      leveled = true;
    }
    EventBus.emit('xp:update', this.xpTotal);
    EventBus.emit('xp:progress', { current: this.xpCurrent, needed: this.xpNeeded, level: this.level });
    if (leveled) EventBus.emit('player:level', this.level);
  }

  // Health API (integers)
  getHealthCurrent() {
    return this.healthCurrent;
  }

  getHealthMax() {
    return this.healthMax;
  }

  setHealth(max, current) {
    this.healthMax = Math.max(0, Math.floor(max));
    this.healthCurrent = Math.max(0, Math.min(this.healthMax, Math.floor(current)));
    EventBus.emit('health:update', { current: this.healthCurrent, max: this.healthMax });
  }

  setHealthCurrent(current) {
    this.healthCurrent = Math.max(0, Math.min(this.healthMax, Math.floor(current)));
    EventBus.emit('health:update', { current: this.healthCurrent, max: this.healthMax });
  }

  damage(amount) {
    if (!amount || amount <= 0) return;
    this.setHealthCurrent(this.healthCurrent - Math.floor(amount));
  }

  heal(amount) {
    if (!amount || amount <= 0) return;
    this.setHealthCurrent(this.healthCurrent + Math.floor(amount));
  }

  // XP pickup radius API (modifiable via perks later)
  setPickupRadius(radius) {
    this.pickupRadius = Math.max(0, Math.floor(radius));
    EventBus.emit('pickup:radius', this.getPickupRadius());
    // also forward to Phaser game events if available (scene may listen)
    if (typeof window !== 'undefined' && window.Phaser && window.Phaser.GAMES?.[0]) {
      window.Phaser.GAMES[0].events.emit('pickup:radius', this.getPickupRadius());
    }
  }

  getPickupRadius() {
    return this.pickupRadius;
  }
}

export const playerState = new PlayerStateImpl();


