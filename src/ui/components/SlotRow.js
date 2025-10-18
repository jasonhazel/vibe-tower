export class SlotRow {
  constructor(scene, { count = 4, size = 28, gap = 6, align = 'left' } = {}) {
    this.scene = scene;
    this.count = count;
    this.size = size;
    this.gap = gap;
    this.align = align; // 'left' | 'right'
    this.slots = new Array(count).fill(null).map(() => ({ gfx: scene.add.graphics(), icon: null }));
    this.rect = { x: 0, y: 0, w: 0, h: size };
    this.ids = [];
  }

  setPosition(x, y, width) {
    this.rect = { x, y, w: width, h: this.size };
    return this.draw();
  }

  update(ids) {
    this.ids = ids || [];
    return this.draw();
  }

  draw() {
    const { x, y, w } = this.rect;
    const { size, gap } = this;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      slot.gfx.clear();
      const sx = this.align === 'right' ? (x + w - (i + 1) * size - i * gap) : (x + i * (size + gap));
      const sy = y;
      const occupied = this.ids && this.ids[i];
      if (occupied) {
        slot.gfx.fillStyle(0x2a2a2a, 1);
        slot.gfx.fillRoundedRect(sx, sy, size, size, 6);
        slot.gfx.lineStyle(2, 0x999999, 1);
        slot.gfx.strokeRoundedRect(sx, sy, size, size, 6);
        slot.gfx.fillStyle(0x66bb6a, 1);
        slot.gfx.fillCircle(sx + size/2, sy + size/2, 6);
      } else {
        slot.gfx.lineStyle(2, 0x444444, 1);
        slot.gfx.strokeRoundedRect(sx, sy, size, size, 6);
      }
    }
    return this;
  }

  destroy() {
    for (const s of this.slots) s.gfx?.destroy();
  }
}


