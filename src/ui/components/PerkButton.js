export class PerkButton {
  constructor(scene, { x = 0, y = 0, width = 360, height = 78, rarityColor, title = '', line2 = '', line3 = '', onClick } = {}) {
    this.scene = scene;
    this.x = x; this.y = y; this.width = width; this.height = height;
    this.onClick = onClick;
    this.rarityColor = this._toColorNumber(rarityColor) ?? 0x8bc34a;

    this.container = scene.add.container(x, y);
    this.bg = scene.add.graphics();
    this.container.add(this.bg);
    this._draw(0x263238, this.rarityColor);

    this.titleText = scene.add.text(0, 0, title, { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff', wordWrap: { width: width - 24 } }).setOrigin(0, 0);
    this.line2Text = scene.add.text(0, 0, line2 || '', { fontFamily: 'monospace', fontSize: '13px', color: '#dfe6e9', wordWrap: { width: width - 24 } }).setOrigin(0, 0);
    this.line3Text = scene.add.text(0, 0, line3 || '', { fontFamily: 'monospace', fontSize: '13px', color: '#dfe6e9', wordWrap: { width: width - 24 } }).setOrigin(0, 0);
    this.container.add(this.titleText);
    this.container.add(this.line2Text);
    this.container.add(this.line3Text);
    this._layoutText();
    this.hit = scene.add.zone(0, 0, width, height).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this.container.add(this.hit);
    this.hit.on('pointerover', () => this._draw(0x2e3b43, this.rarityColor));
    this.hit.on('pointerout', () => this._draw(0x263238, this.rarityColor));
    this.hit.on('pointerdown', () => this._draw(0x1b252b, this.rarityColor));
    this.hit.on('pointerup', () => { this._draw(0x263238, this.rarityColor); this.onClick?.(); });
  }

  _toColorNumber(c) {
    if (!c) return undefined;
    if (typeof c === 'number') return c;
    const s = String(c).replace('#', '0x');
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }

  _draw(bg, stroke) {
    this.bg.clear();
    this.bg.fillStyle(bg, 1);
    this.bg.fillRect(0, 0, this.width, this.height);
    this.bg.lineStyle(2, stroke, 1);
    this.bg.strokeRect(0, 0, this.width, this.height);
  }

  _layoutText() {
    const padX = 12;
    const padY = 8;
    // positions are relative to the container origin
    this.titleText.setPosition(padX, padY);
    this.line2Text.setPosition(padX, padY + 22);
    this.line3Text.setPosition(padX, padY + 40);
  }

  setPosition(x, y) {
    this.x = x; this.y = y;
    this.container.setPosition(x, y);
    this._draw(0x263238, this.rarityColor);
    this._layoutText();
  }

  setLines({ title, line2, line3 }) {
    if (title !== undefined) this.titleText.setText(title);
    if (line2 !== undefined) this.line2Text.setText(line2);
    if (line3 !== undefined) this.line3Text.setText(line3);
  }

  setRarityColor(color) {
    const c = this._toColorNumber(color);
    if (c) { this.rarityColor = c; this._draw(0x263238, this.rarityColor); }
  }

  destroy() {
    this.hit?.destroy();
    this.container?.destroy();
  }
}


