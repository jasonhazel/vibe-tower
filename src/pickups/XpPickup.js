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
    // radius used for merging proximity checks
    rect.setData('mergeR', 7);
    this.go = rect;
  }
}


