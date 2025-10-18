import { TomeBase } from './TomeBase.js';

export class TomeArea extends TomeBase {
  constructor() {
    super();
    this.id = 'tome-area';
    this.name = 'Tome of Area';
    this.key = 'area';
  }

  getModifiers({ tomeLevel = 0, rolls = [] } = {}) {
    const sum = rolls.reduce((a, b) => a + (Number(b) || 0), 0);
    const mult = 1 + (sum > 0 ? sum : 0.20 * tomeLevel);
    return [{ stat: 'area', type: 'mult', value: mult }];
  }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.28);
      gfx.lineStyle(2, 0x66bb6a, 1);
      gfx.strokeCircle(x + size / 2, y + size / 2, r);
    };
  }
}


