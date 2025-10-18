export class TomeBase {
  constructor() {
    this.id = 'tome-base';
    this.name = 'Tome';
    this.key = null; // stats key
  }

  // Apply selection to state (decoupled from singleton for testability)
  apply(ps) {
    if (!ps) return;
    if (this.id) ps.addTomeById?.(this.id);
  }

  // optional: return a function(gfx, x, y, size) drawing the tome icon
  getSlotIconDrawer() { return null; }

  // optional: return modifiers based on levels/upgrades
  // [{ stat: 'damage', type: 'mult'|'add'|'set', value: number }]
  getModifiers(_state) { return []; }

  // optional: provide tailored upgrade option(s)
  getUpgradeOptions(ps) {
    const s = ps?.getTomeState?.()[this.id];
    if (!s || s.level <= 0) return [];
    return [{ id: `upg-${this.id}`, name: `${this.name}+`, isUpgrade: true, apply: () => ps.upgradeTomeById?.(this.id), getSlotIconDrawer: () => this.getSlotIconDrawer?.() }];
  }
}


