import { TomeBase } from './TomeBase.js';

export class TomeDamage extends TomeBase {
  constructor() {
    super();
    this.id = 'tome-damage';
    this.name = 'Tome of Damage';
    this.key = 'damage';
  }

  getModifiers({ tomeLevel = 0, rolls = [] } = {}) {
    const sum = rolls.reduce((a, b) => a + (Number(b) || 0), 0);
    const mult = 1 + (sum > 0 ? sum : 0.20 * tomeLevel);
    return [{ stat: 'damage', type: 'mult', value: mult }];
  }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.2);
      gfx.fillStyle(0xef5350, 1);
      gfx.fillCircle(x + size / 2, y + size / 2, r);
    };
  }
}


