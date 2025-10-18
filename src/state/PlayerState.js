import { EventBus } from './EventBus.js';

class PlayerStateImpl {
  constructor() {
    this.reset();
  }

  reset() {
    this.xp = 0;
    this.healthCurrent = 100;
    this.healthMax = 100;
    this.shield = 0;
  }

  getXp() {
    return this.xp;
  }

  addXp(amount) {
    this.xp += amount;
    EventBus.emit('xp:update', this.xp);
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
}

export const playerState = new PlayerStateImpl();


