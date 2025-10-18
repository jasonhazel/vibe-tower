import { PickupBase } from './PickupBase.js';

export class XpPickup extends PickupBase {
  constructor(scene, x, y, amount = 1) {
    super(scene, x, y, amount);
    const size = 10;
    const rect = scene.add.rectangle(x, y, size, size, 0x42a5f5);
    rect.setAngle(45);
    // one-time bounce
    scene.tweens.add({ targets: rect, y: y - 3, yoyo: true, repeat: 0, duration: 300, ease: 'sine.out' });
    rect.setData('type', 'xp');
    rect.setData('amount', amount);
    // visual scale and merge radius based on amount
    const scale = Math.min(2, 1 + 0.06 * (amount - 1));
    rect.setScale(scale);
    // radius used for merging proximity checks (slightly generous)
    rect.setData('mergeR', 10 * scale);
    this.go = rect;
  }
}


