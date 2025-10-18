import { playerState } from '../state/PlayerState.js';
import { gameConfig } from '../state/GameConfig.js';

export class PickupManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.add.group();
    this.pickupRadius = gameConfig.xpPickup.baseRadius;
  }

  spawnXpAt({ x, y }, amount = 1) {
    // Explosion flash
    const flash = this.scene.add.circle(x, y, 4, 0xffc107, 1);
    this.scene.tweens.add({
      targets: flash,
      radius: 16,
      alpha: 0,
      duration: 220,
      ease: 'quad.out',
      onComplete: () => flash.destroy(),
    });

    // Blue diamond (rotated square)
    const size = 10;
    const orb = this.scene.add.rectangle(x, y, size, size, 0x42a5f5);
    orb.setAngle(45);
    orb.setData('amount', amount);
    // subtle idle tween
    this.scene.tweens.add({ targets: orb, y: y - 3, yoyo: true, repeat: -1, duration: 600, ease: 'sine.inOut' });
    this.group.add(orb);
    return orb;
  }

  update(playerX, playerY) {
    const override = playerState.getPickupRadius?.();
    const pr = override != null ? override : this.pickupRadius;
    const prSq = pr * pr;
    const toCollect = [];
    this.group.children.iterate((orb) => {
      if (!orb) return;
      const dx = orb.x - playerX;
      const dy = orb.y - playerY;
      const d2 = dx * dx + dy * dy;
      if (d2 <= prSq) toCollect.push(orb);
    });
    for (const orb of toCollect) {
      const amount = orb.getData('amount') || 1;
      playerState.addXp(amount);
      orb.destroy();
    }
  }
}


