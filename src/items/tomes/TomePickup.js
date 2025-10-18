import { TomeBase } from './TomeBase.js';

export class TomePickup extends TomeBase {
  constructor() {
    super();
    this.id = 'tome-pickup';
    this.name = 'Tome of Magnetism';
    this.key = 'pickup';
  }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.28);
      gfx.lineStyle(2, 0x42a5f5, 1);
      gfx.strokeCircle(x + size / 2, y + size / 2, r);
    };
  }
}


