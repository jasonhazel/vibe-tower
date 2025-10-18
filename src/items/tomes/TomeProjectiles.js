import { TomeBase } from './TomeBase.js';

export class TomeProjectiles extends TomeBase {
  constructor() {
    super();
    this.id = 'tome-projectiles';
    this.name = 'Tome of Projectiles';
    this.key = 'projectiles';
  }

  getModifiers({ tomeLevel = 0 } = {}) {
    // Integer-based: base 1 + level
    const val = 1 + (tomeLevel || 0);
    return [{ stat: 'projectiles', type: 'set', value: val }];
  }

  rollImpact() {
    // Projectiles increase is fixed per level (+1)
    return { rarityId: 'common', rarityName: 'Common', rarityColor: '#b0bec5', value: 1 };
  }

  getSlotIconDrawer() {
    return (gfx, x, y, size) => {
      const r = Math.floor(size * 0.08);
      const cx = x + size / 2;
      const cy = y + size / 2;
      gfx.fillStyle(0x90caf9, 1);
      gfx.fillCircle(cx - r * 3, cy, r);
      gfx.fillCircle(cx, cy, r);
      gfx.fillCircle(cx + r * 3, cy, r);
    };
  }
}


