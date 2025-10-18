export class TomeBase {
  constructor() {
    this.id = 'tome-base';
    this.name = 'Tome';
    this.key = null; // stats key
  }

  // Apply selection to state (decoupled from singleton for testability)
  apply(ps, opts) {
    if (!ps) return;
    const rollVal = opts?.roll?.value;
    if (this.id) ps.addTomeById?.(this.id, rollVal);
  }

  // optional: return a function(gfx, x, y, size) drawing the tome icon
  getSlotIconDrawer() { return null; }

  // optional: return modifiers based on levels/upgrades/rolls
  // state: { tomeLevel, rolls: number[] }
  // default behavior for multiplier tomes: 1 + sum(rolls) fallback to 0.20 * level
  getModifiers(state = {}) {
    const level = Number(state.tomeLevel || 0);
    const rolls = Array.isArray(state.rolls) ? state.rolls : [];
    const sum = rolls.reduce((a, b) => a + (Number(b) || 0), 0);
    const mult = 1 + (sum > 0 ? sum : (0.20 * level));
    if (!this.key) return [];
    return [{ stat: this.key, type: 'mult', value: mult }];
  }

  // optional: provide tailored upgrade option(s)
  getUpgradeOptions(ps) {
    const s = ps?.getTomeState?.()[this.id];
    if (!s || s.level <= 0) return [];
    return [{
      id: `upg-${this.id}`,
      name: `${this.name}+`,
      tomeId: this.id,
      isUpgrade: true,
      rollImpact: () => this.rollImpact?.(),
      apply: () => ps.upgradeTomeById?.(this.id),
      getSlotIconDrawer: () => this.getSlotIconDrawer?.(),
    }];
  }

  // Roll an impact value with rarity. Default table for multiplier tomes.
  rollImpact() {
    const rarities = [
      { id: 'common', name: 'Common', color: '#b0bec5', weight: 55, min: 0.12, max: 0.16 },
      { id: 'uncommon', name: 'Uncommon', color: '#4caf50', weight: 25, min: 0.16, max: 0.20 },
      { id: 'rare', name: 'Rare', color: '#2196f3', weight: 12, min: 0.20, max: 0.25 },
      { id: 'epic', name: 'Epic', color: '#9c27b0', weight: 6, min: 0.25, max: 0.32 },
      { id: 'legendary', name: 'Legendary', color: '#ff9800', weight: 2, min: 0.32, max: 0.40 },
    ];
    const totalW = rarities.reduce((a, r) => a + r.weight, 0);
    let pick = Math.random() * totalW;
    let chosen = rarities[0];
    for (const r of rarities) { if ((pick -= r.weight) <= 0) { chosen = r; break; } }
    const value = Math.round((chosen.min + Math.random() * (chosen.max - chosen.min)) * 100) / 100;
    return { rarityId: chosen.id, rarityName: chosen.name, rarityColor: chosen.color, value };
  }
}


