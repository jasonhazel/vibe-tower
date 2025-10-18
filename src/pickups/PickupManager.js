import { playerState } from '../state/PlayerState.js';
import { gameConfig } from '../state/GameConfig.js';
import { XpPickup } from './XpPickup.js';

export class PickupManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.add.group();
    this.pickupRadius = gameConfig.xpPickup.baseRadius;
    // listen for player radius changes
    scene.game?.events?.on?.('pickup:radius', (r) => {
      this.pickupRadius = r || this.pickupRadius;
    });
  }

  spawnXpAt({ x, y }, amount = 1) {
    // Explosion flash
    const flash = this.scene.add.circle(x, y, 4, 0xffc107, 1);
    this.scene.tweens.add({ targets: flash, radius: 16, alpha: 0, duration: 220, ease: 'quad.out', onComplete: () => flash.destroy() });

    const pickup = new XpPickup(this.scene, x, y, amount);
    this.group.add(pickup.getGO());
    return pickup.getGO();
  }

  update(playerX, playerY) {
    const override = playerState.getPickupRadius?.();
    const pr = override != null ? override : this.pickupRadius;
    const prSq = pr * pr;
    this.group.children.iterate((orb) => {
      if (!orb) return;
      if (orb.getData('collecting')) return;
      const dx = orb.x - playerX;
      const dy = orb.y - playerY;
      const d2 = dx * dx + dy * dy;
      if (d2 <= prSq) this._animateCollect(orb, playerX, playerY);
    });
  }

  _animateCollect(orb, playerX, playerY) {
    if (!orb || !orb.active) return;
    if (orb.getData('collecting')) return;
    orb.setData('collecting', true);
    const amount = orb.getData('amount') || 1;
    const dx = playerX - orb.x;
    const dy = playerY - orb.y;
    const dist = Math.hypot(dx, dy);
    const duration = Math.max(80, Math.min(220, Math.floor(dist * 1.2))); // quick pull-in
    this.scene.tweens.add({
      targets: orb,
      x: playerX,
      y: playerY,
      scale: { from: 1, to: 0.6 },
      alpha: { from: 1, to: 0.9 },
      ease: 'quad.in',
      duration,
      onComplete: () => {
        if (orb.active) orb.destroy();
        playerState.addXp(amount);
      },
    });
  }
}


