import { TomeBase } from './TomeBase.js';

export class TomeXP extends TomeBase {
  constructor() {
    super();
    this.id = 'tome-xp';
    this.name = 'Tome of Learning';
    this.key = 'xp';
  }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.22);
      const cx = x + size / 2;
      const cy = y + size / 2;
      gfx.fillStyle(0x42a5f5, 1);
      gfx.beginPath();
      gfx.moveTo(cx, cy - r);
      gfx.lineTo(cx + r, cy);
      gfx.lineTo(cx, cy + r);
      gfx.lineTo(cx - r, cy);
      gfx.closePath();
      gfx.fillPath();
      gfx.lineStyle(2, 0x90caf9, 1);
      gfx.beginPath();
      gfx.moveTo(cx, cy - r);
      gfx.lineTo(cx + r, cy);
      gfx.lineTo(cx, cy + r);
      gfx.lineTo(cx - r, cy);
      gfx.closePath();
      gfx.strokePath();
    };
  }
}


