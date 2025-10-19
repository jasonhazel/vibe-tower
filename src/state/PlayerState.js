import { EventBus } from './EventBus.js';
import { TomeCatalog } from '../items/tomes/Tomes.js';

class PlayerStateImpl {
  constructor() {
    this.reset();
  }

  reset() {
    this.xpTotal = 0;
    this.level = 1; // starting level
    this.xpCurrent = 0; // progress within current level
    this.xpNeeded = 10; // requirement to reach next level
    this.xpOverflow = 0; // fractional XP carryover for multipliers
    this.healthCurrent = 100;
    this.healthMax = 100;
    this.shield = 0;
    this.pickupRadius = null; // null -> use gameConfig default
    // Stat multipliers (computed from tomes + upgrades via stat engine)
    this.stats = {
      area: 1,
      damage: 1,
      projectiles: 1,
      attackSpeed: 1,
      xp: 1,
      pickup: 1,
    };
    // Tome state: { [tomeId]: { level: number, key: string, rolls?: number[] } }
    this.tomeState = {};
    // Weapon state: { [weaponId]: { level: number, upgrades: { [k:string]: number } } }
    this.weaponState = {};
    this._pendingLevelXpHold = false;
    this._pendingLevelXpRemainder = 0;
    // Multi-level queue
    this.pendingLevelUps = 0;
    this._queuedRemainder = 0;
    // New: per-level progress queue; after consuming one level-up, set xpCurrent
    // to the queued progress for the next level. Back-compat kept via _queuedRemainder.
    this._queuedProgresses = [];
  }

  getXp() { return this.xpTotal; }
  getLevel() { return this.level; }
  getXpCurrent() { return this.xpCurrent; }
  getXpNeeded() { return this.xpNeeded; }
  getXpOverflow() { return this.xpOverflow; }

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

  // Tome system (by tomeId)
  addTomeById(tomeId, rollValue) {
    const tome = TomeCatalog.find(t => t.id === tomeId);
    if (!tome) return;
    if (!this.tomeState[tomeId]) {
      this.tomeState[tomeId] = { level: 0, key: tome.key, rolls: [] };
    }
    this.tomeState[tomeId].level += 1;
    if (typeof rollValue === 'number' && isFinite(rollValue)) {
      this.tomeState[tomeId].rolls.push(rollValue);
    }
    this._recomputeStatsFromTomes();
  }

  upgradeTomeById(tomeId, rollValue) {
    const s = this.tomeState[tomeId];
    if (!s || s.level <= 0) return; // must own first
    s.level += 1;
    if (typeof rollValue === 'number' && isFinite(rollValue)) {
      s.rolls = s.rolls || [];
      s.rolls.push(rollValue);
    }
    this._recomputeStatsFromTomes();
  }

  // Back-compat helpers (by stat key)
  addTome(statKey) {
    const tome = TomeCatalog.find(t => t.key === statKey);
    if (tome) this.addTomeById(tome.id);
  }

  upgradeTome(statKey) {
    const tome = TomeCatalog.find(t => t.key === statKey);
    if (tome) this.upgradeTomeById(tome.id);
  }

  getTomeState() {
    return JSON.parse(JSON.stringify(this.tomeState));
  }

  // Weapon system
  getWeaponState() {
    return JSON.parse(JSON.stringify(this.weaponState));
  }

  addWeaponById(weaponId) {
    if (!weaponId) return;
    if (!this.weaponState[weaponId]) {
      this.weaponState[weaponId] = { level: 0, upgrades: {} };
    }
    this.weaponState[weaponId].level += 1;
    // Weapons typically influence via runtime params; recompute to be safe
    EventBus.emit('stats:update', this.getStats());
  }

  upgradeWeaponById(weaponId, upgKey, rollValue) {
    if (!weaponId || !upgKey) return;
    const s = this.weaponState[weaponId];
    if (!s || s.level <= 0) return;
    if (typeof rollValue === 'number' && isFinite(rollValue)) {
      // store cumulative additive percentage or integer for projectiles
      s.upgrades[`roll_${upgKey}`] = (s.upgrades[`roll_${upgKey}`] || 0) + rollValue;
    } else {
      s.upgrades[upgKey] = (s.upgrades[upgKey] || 0) + 1;
    }
    EventBus.emit('stats:update', this.getStats());
  }

  _recomputeStatsFromTomes() {
    // Base stats
    const next = { area: 1, damage: 1, projectiles: 1, attackSpeed: 1, xp: 1, pickup: 1 };
    // Aggregate from each owned tome via its modifiers
    for (const tomeId of Object.keys(this.tomeState)) {
      const tome = TomeCatalog.find(t => t.id === tomeId);
      if (!tome) continue;
      const { level, rolls } = this.tomeState[tomeId];
      const mods = (tome.getModifiers?.({ tomeLevel: level, rolls: rolls || [] }) || []);
      for (const m of mods) {
        if (!m || !m.stat || !(m.stat in next)) continue;
        const type = m.type || 'mult';
        const val = Number(m.value) || 0;
        if (type === 'mult') next[m.stat] *= Math.max(0, val || 1);
        else if (type === 'add') next[m.stat] += val;
        else if (type === 'set') next[m.stat] = val;
      }
    }
    // Normalize integer stats
    next.projectiles = Math.max(1, Math.floor(next.projectiles));

    const changed = JSON.stringify(this.stats) !== JSON.stringify(next);
    this.stats = next;
    if (changed) EventBus.emit('stats:update', this.getStats());
  }

  addXp(amount) {
    if (!amount || amount <= 0) return;
    const xpMul = this.stats?.xp ?? 1;
    const total = amount * xpMul + (this.xpOverflow || 0);
    let grant = Math.floor(total);
    if (grant < 1) {
      grant = 1; // ensure every pickup yields at least 1 XP
      this.xpOverflow = total - 1;
    } else {
      this.xpOverflow = total - grant;
    }
    this.xpTotal += grant;
    // Available XP toward current and future levels (do not commit remainder yet)
    let available = this.xpCurrent + grant;
    let anyLeveled = false;
    // Ensure queue exists
    if (!Array.isArray(this._queuedProgresses)) this._queuedProgresses = [];
    // Process potentially multiple levels and queue per-level progress
    while (available >= this.xpNeeded) {
      // Spend threshold for current level
      available -= this.xpNeeded;
      // Level up
      this.level += 1;
      // Compute next requirement and queue the progress for the next level
      this.xpNeeded = Math.ceil(this.xpNeeded * 1.5);
      // Progress toward the next level after this one is consumed
      const nextProgress = Math.max(0, Math.min(this.xpNeeded, Math.floor(available)));
      this._queuedProgresses.push(nextProgress);
      this.pendingLevelUps = (this.pendingLevelUps || 0) + 1;
      anyLeveled = true;
      // Notify level change immediately (HUD badge)
      EventBus.emit('player:level', this.level);
      // For UI, keep bar visually full while there are pending level-ups
      this.xpCurrent = this.xpNeeded; // display full bar for the current threshold
      // If we still have enough to cross again, the next loop iteration will handle it
    }
    // Back-compat: also store the final remainder
    this._queuedRemainder = Math.max(0, Math.floor(available));
    if (!anyLeveled) {
      // No new level: just update current progress
      this.xpCurrent = Math.max(0, Math.floor(available));
    }
    EventBus.emit('xp:update', this.xpTotal);
    EventBus.emit('xp:progress', { current: this.xpCurrent, needed: this.xpNeeded, level: this.level });
  }

  // Debug/testing: force a single level-up without XP math
  levelUpOnceDebug() {
    this.level += 1;
    this.pendingLevelUps = (this.pendingLevelUps || 0) + 1;
    // Keep bar full for dialog
    this.xpCurrent = this.xpNeeded;
    this.xpNeeded = Math.ceil(this.xpNeeded * 1.5);
    EventBus.emit('xp:update', this.xpTotal);
    EventBus.emit('player:level', this.level);
    EventBus.emit('xp:progress', { current: this.xpCurrent, needed: this.xpNeeded, level: this.level });
  }

  // Predict XP grant for a given amount using current multiplier and overflow
  previewXpGrant(amount) {
    const xpMul = this.stats?.xp ?? 1;
    const total = amount * xpMul + (this.xpOverflow || 0);
    let grant = Math.floor(total);
    if (grant < 1) grant = 1;
    return grant;
  }

  // Multi-level queue consumption: call after each selection/skip
  consumePendingLevelUp() {
    if (!this.pendingLevelUps || this.pendingLevelUps <= 0) return;
    this.pendingLevelUps -= 1;
    // Prefer new queue; fall back to legacy behavior
    if (Array.isArray(this._queuedProgresses) && this._queuedProgresses.length > 0) {
      const next = this._queuedProgresses.shift();
      // Set current progress to the queued value for this next level
      this.xpCurrent = Math.max(0, Math.min(this.xpNeeded, Math.floor(Number(next) || 0)));
    } else if (this.pendingLevelUps <= 0) {
      // Legacy: apply final remainder when queue exhausted
      this.xpCurrent = Math.max(0, Math.floor(this._queuedRemainder || 0));
      this._queuedRemainder = 0;
    } else {
      // No queued progress available but more pending remain: keep full bar
      this.xpCurrent = this.xpNeeded;
    }
    EventBus.emit('xp:progress', { current: this.xpCurrent, needed: this.xpNeeded, level: this.level });
  }

  // Back-compat alias
  finalizeLevelUp() { this.consumePendingLevelUp(); }

  getPendingLevelUps() { return this.pendingLevelUps || 0; }

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

  // Serialization API
  toJSON() {
    return {
      xpTotal: this.xpTotal,
      level: this.level,
      xpCurrent: this.xpCurrent,
      xpNeeded: this.xpNeeded,
      xpOverflow: this.xpOverflow,
      pendingLevelUps: this.pendingLevelUps,
      queuedRemainder: this._queuedRemainder,
      queuedProgresses: Array.isArray(this._queuedProgresses) ? this._queuedProgresses.slice() : [],
      healthCurrent: this.healthCurrent,
      healthMax: this.healthMax,
      shield: this.shield,
      pickupRadius: this.pickupRadius,
      stats: this.stats,
      tomeState: this.tomeState,
      weaponState: this.weaponState,
      pendingLevelXpHold: this._pendingLevelXpHold,
      pendingLevelXpRemainder: this._pendingLevelXpRemainder,
    };
  }

  fromJSON(saved) {
    if (!saved) return;
    this.xpTotal = saved.xpTotal ?? this.xpTotal;
    this.level = saved.level ?? this.level;
    this.xpCurrent = saved.xpCurrent ?? this.xpCurrent;
    this.xpNeeded = saved.xpNeeded ?? this.xpNeeded;
    this.xpOverflow = saved.xpOverflow ?? 0;
    this.healthCurrent = saved.healthCurrent ?? this.healthCurrent;
    this.healthMax = saved.healthMax ?? this.healthMax;
    this.shield = saved.shield ?? this.shield;
    this.pickupRadius = saved.pickupRadius ?? this.pickupRadius;
    this.tomeState = saved.tomeState ?? {};
    this.weaponState = saved.weaponState ?? {};
    // recompute stats from tomeState
    this._recomputeStatsFromTomes();
    this._pendingLevelXpHold = !!saved.pendingLevelXpHold;
    this._pendingLevelXpRemainder = Number(saved.pendingLevelXpRemainder || 0);
    this.pendingLevelUps = Number(saved.pendingLevelUps || 0);
    this._queuedRemainder = Number(saved.queuedRemainder || 0);
    // New queue; build from saved if available, else approximate from legacy remainder
    const qp = Array.isArray(saved.queuedProgresses) ? saved.queuedProgresses.filter((n) => typeof n === 'number') : null;
    if (qp && qp.length > 0) {
      this._queuedProgresses = qp.slice();
    } else {
      this._queuedProgresses = [];
      // If legacy remainder exists and we have pending levels, approximate prior behavior:
      // keep bar full until the last pending, then drop to remainder
      const pend = this.pendingLevelUps;
      if (pend > 0) {
        const full = Math.max(0, Math.floor(this.xpNeeded));
        for (let i = 1; i <= pend; i++) {
          if (i < pend) this._queuedProgresses.push(full);
          else this._queuedProgresses.push(Math.max(0, Math.min(full, Math.floor(this._queuedRemainder || 0))));
        }
      }
    }
  }
}

export const playerState = new PlayerStateImpl();


