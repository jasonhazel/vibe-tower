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
    // Merge nearby orbs first to reduce object count
    this._mergeNearby();
    this.group.children.iterate((orb) => {
      if (!orb) return;
      if (orb.getData('collecting')) return;
      const dx = orb.x - playerX;
      const dy = orb.y - playerY;
      const d2 = dx * dx + dy * dy;
      if (d2 <= prSq) this._animateCollect(orb, playerX, playerY);
    });
  }

  _mergeNearby() {
    const orbs = this.group.getChildren().filter(Boolean);
    for (let i = 0; i < orbs.length; i++) {
      const a = orbs[i];
      if (!a || !a.active || a.getData('collecting')) continue;
      const ar = a.getData('mergeR') || 7;
      for (let j = i + 1; j < orbs.length; j++) {
        const b = orbs[j];
        if (!b || !b.active || b.getData('collecting')) continue;
        const br = b.getData('mergeR') || 7;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const r = ar + br;
        if (dx * dx + dy * dy <= r * r) {
          // merge b into a
          const aval = a.getData('amount') || 1;
          const bval = b.getData('amount') || 1;
          const sum = aval + bval;
          a.setData('amount', sum);
          // size scales gently with amount
          const scale = Math.min(2, 1 + 0.06 * (sum - 1));
          a.setScale(scale);
          a.setData('mergeR', 10 * scale);
          // visual nudge
          this.scene.tweens.add({ targets: a, scale: { from: scale * 1.0, to: scale * 1.15 }, yoyo: true, duration: 120, ease: 'sine.out' });
          b.destroy();
        }
      }
    }
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


