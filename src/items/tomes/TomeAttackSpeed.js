import { TomeBase } from './TomeBase.js';

export class TomeAttackSpeed extends TomeBase {
  constructor() {
    super();
    this.id = 'tome-attackSpeed';
    this.name = 'Tome of Attack Speed';
    this.key = 'attackSpeed';
  }

  getModifiers({ tomeLevel = 0, rolls = [] } = {}) {
    const sum = rolls.reduce((a, b) => a + (Number(b) || 0), 0);
    const mult = 1 + (sum > 0 ? sum : 0.20 * tomeLevel);
    return [{ stat: 'attackSpeed', type: 'mult', value: mult }];
  }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const cx = x + size / 2;
      const cy = y + size / 2;
      gfx.lineStyle(2, 0x8bc34a, 1);
      gfx.beginPath();
      gfx.moveTo(cx - 6, cy);
      gfx.lineTo(cx, cy - 6);
      gfx.lineTo(cx + 6, cy);
      gfx.strokePath();
    };
  }
}


