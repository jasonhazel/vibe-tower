import { playerState } from '../state/PlayerState.js';

export class PickupRadiusVisual {
  constructor(scene, { x, y, radius, color = 0x42a5f5, alpha = 0.5, thickness = 1, dash = 10, gap = 6 } = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.alpha = alpha;
    this.thickness = thickness;
    this.dash = dash;
    this.gap = gap;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(0.5);
    this.draw();
  }

  setCenter(x, y) {
    this.x = x; this.y = y; this.draw();
  }

  setRadius(r) {
    this.radius = Math.max(0, r);
    this.draw();
  }

  drawDashedCircle(gfx, x, y, radius, dash, gap) {
    const twoPi = Math.PI * 2;
    const aDash = dash / Math.max(1, radius);
    const aGap = gap / Math.max(1, radius);
    for (let a = 0; a < twoPi; a += aDash + aGap) {
      const a2 = Math.min(twoPi, a + aDash);
      gfx.beginPath();
      gfx.arc(x, y, radius, a, a2);
      gfx.strokePath();
    }
  }

  draw() {
    const g = this.graphics;
    g.clear();
    g.lineStyle(this.thickness, this.color, this.alpha);
    this.drawDashedCircle(g, this.x, this.y, this.radius, this.dash, this.gap);
  }

  destroy() {
    this.graphics?.destroy();
  }
}


