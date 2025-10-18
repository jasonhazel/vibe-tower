import { TomeBase } from './TomeBase.js';

export class TomeDamage extends TomeBase {
  constructor() {
    super();
    this.id = 'tome-damage';
    this.name = 'Tome of Damage';
    this.key = 'damage';
  }

  getModifiers({ tomeLevel = 0, upgradeCount = 0 } = {}) {
    const mult = 1 + 0.20 * tomeLevel + 0.15 * upgradeCount;
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


