import { TomeBase } from './TomeBase.js';

export class TomeXP extends TomeBase {
  constructor() { super(); this.id = 'tome-xp'; this.name = 'Tome of Learning'; this.key = 'xp'; }
  getSlotIconDrawer() { return (gfx, x, y, size) => { const r = Math.floor(size*0.2); const cx=x+size/2, cy=y+size/2; gfx.fillStyle(0x42a5f5, 1); gfx.fillRect(cx-r, cy-r, r*2, r*2); gfx.lineStyle(2, 0x90caf9, 1); gfx.strokeRect(cx-r, cy-r, r*2, r*2); }; }
}


