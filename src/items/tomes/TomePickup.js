import { TomeBase } from './TomeBase.js';

export class TomePickup extends TomeBase {
  constructor() {
    super();
    this.id = 'tome-pickup';
    this.name = 'Tome of Magnetism';
    this.key = 'pickup';
  }

  getModifiers({ tomeLevel = 0, rolls = [] } = {}) {
    const sum = rolls.reduce((a, b) => a + (Number(b) || 0), 0);
    const mult = 1 + (sum > 0 ? sum : 0.20 * tomeLevel);
    return [{ stat: 'pickup', type: 'mult', value: mult }];
  }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.28);
      gfx.lineStyle(2, 0x42a5f5, 1);
      gfx.strokeCircle(x + size / 2, y + size / 2, r);
    };
  }
}


