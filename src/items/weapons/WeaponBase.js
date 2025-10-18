export class WeaponBase {
  constructor(scene, context) {
    this.scene = scene;
    this.context = context; // { enemiesGroup, centerX, centerY, awardXp }
  }

  getId() {
    return 'base';
  }

  // Optional: return a function(gfx, x, y, size) that draws the slot icon for this weapon
  getSlotIconDrawer() {
    return null;
  }

  // Apply selection to state
  apply(ps) {
    if (!ps || !this.id) return;
    ps.addWeaponById?.(this.id);
  }

  // Return upgrade options tailored to this weapon
  getUpgradeOptions(ps) {
    const ws = ps?.getWeaponState?.()?.[this.id];
    if (!ws || ws.level <= 0) return [];
    return [];
  }

  // Default weapon upgrade roll table (per-upgrade effect magnitude)
  rollUpgradeImpact(key) {
    const tables = {
      damage: [
        { id: 'common', color: '#b0bec5', weight: 55, min: 0.10, max: 0.16 },
        { id: 'uncommon', color: '#4caf50', weight: 25, min: 0.16, max: 0.22 },
        { id: 'rare', color: '#2196f3', weight: 12, min: 0.22, max: 0.30 },
        { id: 'epic', color: '#9c27b0', weight: 6, min: 0.30, max: 0.40 },
        { id: 'legendary', color: '#ff9800', weight: 2, min: 0.40, max: 0.50 },
      ],
      radius: [
        { id: 'common', color: '#b0bec5', weight: 55, min: 0.06, max: 0.10 },
        { id: 'uncommon', color: '#4caf50', weight: 25, min: 0.10, max: 0.14 },
        { id: 'rare', color: '#2196f3', weight: 12, min: 0.14, max: 0.20 },
        { id: 'epic', color: '#9c27b0', weight: 6, min: 0.20, max: 0.26 },
        { id: 'legendary', color: '#ff9800', weight: 2, min: 0.26, max: 0.34 },
      ],
      tick: [
        { id: 'common', color: '#b0bec5', weight: 55, min: 0.06, max: 0.10 },
        { id: 'uncommon', color: '#4caf50', weight: 25, min: 0.10, max: 0.14 },
        { id: 'rare', color: '#2196f3', weight: 12, min: 0.14, max: 0.20 },
        { id: 'epic', color: '#9c27b0', weight: 6, min: 0.20, max: 0.26 },
        { id: 'legendary', color: '#ff9800', weight: 2, min: 0.26, max: 0.34 },
      ],
      cooldown: [
        { id: 'common', color: '#b0bec5', weight: 55, min: 0.06, max: 0.10 },
        { id: 'uncommon', color: '#4caf50', weight: 25, min: 0.10, max: 0.14 },
        { id: 'rare', color: '#2196f3', weight: 12, min: 0.14, max: 0.20 },
        { id: 'epic', color: '#9c27b0', weight: 6, min: 0.20, max: 0.26 },
        { id: 'legendary', color: '#ff9800', weight: 2, min: 0.26, max: 0.34 },
      ],
      range: [
        { id: 'common', color: '#b0bec5', weight: 55, min: 0.06, max: 0.10 },
        { id: 'uncommon', color: '#4caf50', weight: 25, min: 0.10, max: 0.14 },
        { id: 'rare', color: '#2196f3', weight: 12, min: 0.14, max: 0.20 },
        { id: 'epic', color: '#9c27b0', weight: 6, min: 0.20, max: 0.26 },
        { id: 'legendary', color: '#ff9800', weight: 2, min: 0.26, max: 0.34 },
      ],
      speed: [
        { id: 'common', color: '#b0bec5', weight: 55, min: 0.06, max: 0.10 },
        { id: 'uncommon', color: '#4caf50', weight: 25, min: 0.10, max: 0.14 },
        { id: 'rare', color: '#2196f3', weight: 12, min: 0.14, max: 0.20 },
        { id: 'epic', color: '#9c27b0', weight: 6, min: 0.20, max: 0.26 },
        { id: 'legendary', color: '#ff9800', weight: 2, min: 0.26, max: 0.34 },
      ],
      projectiles: [
        { id: 'common', color: '#b0bec5', weight: 55, min: 1, max: 1 },
        { id: 'uncommon', color: '#4caf50', weight: 25, min: 1, max: 1 },
        { id: 'rare', color: '#2196f3', weight: 12, min: 1, max: 1 },
        { id: 'epic', color: '#9c27b0', weight: 6, min: 1, max: 1 },
        { id: 'legendary', color: '#ff9800', weight: 2, min: 1, max: 1 },
      ],
    };
    const table = tables[key] || tables.damage;
    const totalW = table.reduce((a, r) => a + r.weight, 0);
    let pick = Math.random() * totalW;
    let chosen = table[0];
    for (const r of table) { if ((pick -= r.weight) <= 0) { chosen = r; break; } }
    const raw = chosen.min + Math.random() * (chosen.max - chosen.min);
    const value = key === 'projectiles' ? Math.max(1, Math.round(raw)) : Math.round(raw * 100) / 100;
    return { rarityId: chosen.id, rarityColor: chosen.color, value };
  }

  // Compute runtime params (override in weapons)
  getRuntimeParams(ps) {
    return {};
  }

  update(_deltaMs) {
    // to be implemented by subclasses
  }

  destroy() {
    // optional cleanup in subclasses
  }
}


