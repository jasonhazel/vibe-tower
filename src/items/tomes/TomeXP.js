import { TomeBase } from './TomeBase.js';

export class TomeXP extends TomeBase {
  constructor() {
    super();
    this.id = 'tome-xp';
    this.name = 'Tome of Learning';
    this.key = 'xp';
  }

  getModifiers({ tomeLevel = 0, rolls = [] } = {}) {
    // XP tome uses rolls if present, otherwise fallback to 0.20 per level
    const sum = rolls.reduce((a, b) => a + (Number(b) || 0), 0);
    const mult = 1 + (sum > 0 ? sum : 0.20 * tomeLevel);
    return [{ stat: 'xp', type: 'mult', value: mult }];
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


