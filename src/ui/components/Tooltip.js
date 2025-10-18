export class Tooltip {
  constructor(scene) {
    this.scene = scene;
    this.bg = scene.add.graphics().setDepth(1000).setVisible(false);
    this.text = scene.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' })
      .setDepth(1001)
      .setVisible(false);
    this.padding = 6;
  }

  show(content, x, y) {
    const txt = String(content || '');
    this.text.setText(txt);
    const w = this.text.width + this.padding * 2;
    const h = this.text.height + this.padding * 2;
    const ty = y - h - 8; // position above cursor
    this.bg.clear();
    this.bg.fillStyle(0x111111, 0.9);
    this.bg.fillRoundedRect(x, ty, w, h, 6);
    this.bg.lineStyle(1, 0x444444, 1);
    this.bg.strokeRoundedRect(x, ty, w, h, 6);
    this.text.setPosition(x + this.padding, ty + this.padding);
    this.bg.setVisible(true);
    this.text.setVisible(true);
  }

  move(x, y) {
    if (!this.bg.visible) return;
    const w = this.text.width + this.padding * 2;
    const h = this.text.height + this.padding * 2;
    const ty = y - h - 8; // keep above cursor while moving
    this.bg.setPosition(x, ty);
    this.bg.clear();
    this.bg.fillStyle(0x111111, 0.9);
    this.bg.fillRoundedRect(x, ty, w, h, 6);
    this.bg.lineStyle(1, 0x444444, 1);
    this.bg.strokeRoundedRect(x, ty, w, h, 6);
    this.text.setPosition(x + this.padding, ty + this.padding);
  }

  hide() {
    this.bg.setVisible(false);
    this.text.setVisible(false);
  }

  destroy() {
    this.bg?.destroy();
    this.text?.destroy();
  }
}


