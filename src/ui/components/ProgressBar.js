export class ProgressBar {
  constructor(scene, {
    x = 0, y = 0, width = 100, height = 12,
    backgroundColor = 0x202020, backgroundAlpha = 0.9,
    fillColor = 0x8bc34a, fillAlpha = 1,
    cornerRadius = 6,
  } = {}) {
    this.scene = scene;
    this.gfxBg = scene.add.graphics();
    this.gfxFill = scene.add.graphics();
    this.bounds = { x, y, width, height };
    this.colors = { backgroundColor, backgroundAlpha, fillColor, fillAlpha };
    this.cornerRadius = cornerRadius;
    this.current = 0;
    this.max = 1;
  }

  setBounds(x, y, width, height) {
    this.bounds = { x, y, width, height };
    return this;
  }

  setColors({ backgroundColor, backgroundAlpha, fillColor, fillAlpha }) {
    if (backgroundColor !== undefined) this.colors.backgroundColor = backgroundColor;
    if (backgroundAlpha !== undefined) this.colors.backgroundAlpha = backgroundAlpha;
    if (fillColor !== undefined) this.colors.fillColor = fillColor;
    if (fillAlpha !== undefined) this.colors.fillAlpha = fillAlpha;
    return this;
  }

  setValue(current, max) {
    this.current = Math.max(0, current);
    this.max = Math.max(1, max);
    return this;
  }

  draw() {
    const { x, y, width, height } = this.bounds;
    const { backgroundColor, backgroundAlpha, fillColor, fillAlpha } = this.colors;
    const r = this.cornerRadius;

    this.gfxBg.clear();
    this.gfxBg.fillStyle(backgroundColor, backgroundAlpha);
    this.gfxBg.fillRoundedRect(x, y, width, height, Math.min(r, height / 2));

    const progress = Math.max(0, Math.min(1, this.current / this.max));
    const fw = width * progress;
    this.gfxFill.clear();
    if (fw <= 0) return this;
    this.gfxFill.fillStyle(fillColor, fillAlpha);
    const fr = Math.min(r, height / 2, fw / 2);
    if (fw < fr * 2) {
      this.gfxFill.fillRect(x, y, fw, height);
    } else {
      this.gfxFill.fillRoundedRect(x, y, fw, height, fr);
    }
    return this;
  }

  destroy() {
    this.gfxBg?.destroy();
    this.gfxFill?.destroy();
  }
}


