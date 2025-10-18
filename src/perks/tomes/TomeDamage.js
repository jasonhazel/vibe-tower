import { TomeBase } from './TomeBase.js';

export class TomeDamage extends TomeBase {
  constructor() { super(); this.id = 'tome-damage'; this.name = 'Tome of Damage'; this.key = 'damage'; }
  getSlotIconDrawer() { return (gfx, x, y, size) => { const r = Math.floor(size*0.2); gfx.fillStyle(0xef5350, 1); gfx.fillCircle(x+size/2, y+size/2, r); }; }
}


