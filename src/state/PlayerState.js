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
  }

  getXp() { return this.xpTotal; }
  getLevel() { return this.level; }
  getXpCurrent() { return this.xpCurrent; }
  getXpNeeded() { return this.xpNeeded; }

  addXp(amount) {
    if (!amount || amount <= 0) return;
    this.xpTotal += amount;
    this.xpCurrent += amount;
    let leveled = false;
    while (this.xpCurrent >= this.xpNeeded) {
      this.xpCurrent -= this.xpNeeded;
      this.level += 1;
      // increase requirement by 12% each level (ceil to integer)
      this.xpNeeded = Math.ceil(this.xpNeeded * 1.12);
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


