import { PickupBase } from './PickupBase.js';

export class MagnetPickup extends PickupBase {
  constructor(scene, x, y) {
    super(scene, x, y, 1);
    const size = 16;
    const g = scene.add.graphics();
    g.setPosition(x, y);
    // Red letter M icon
    const RED = 0xe53935;
    const stroke = 3; // thickness for readability at small size
    const halfW = Math.floor(size / 2) - 1;
    const topY = -Math.floor(size / 2) + 1;
    const botY = Math.floor(size / 2) - 1;
    g.lineStyle(stroke, RED, 1);
    g.beginPath();
    // Draw an "M": bottom-left -> top-left -> bottom-center -> top-right -> bottom-right
    g.moveTo(-halfW, botY);
    g.lineTo(-halfW, topY);
    g.lineTo(0, botY);
    g.lineTo(halfW, topY);
    g.lineTo(halfW, botY);
    g.strokePath();
    g.setData('type', 'magnet');
    g.setData('amount', 1);
    g.setData('hitR', 10);
    scene.tweens.add({ targets: g, y: y - 3, yoyo: true, repeat: 0, duration: 300, ease: 'sine.out' });
    this.go = g;
  }
}


