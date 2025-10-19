import { playerState } from '../state/PlayerState.js';
import { gameConfig } from '../state/GameConfig.js';
import { EventBus } from '../state/EventBus.js';
import { XpPickup } from './XpPickup.js';
import { HealthPickup } from './HealthPickup.js';
import { MagnetPickup } from './MagnetPickup.js';

export class PickupManager {
  constructor(scene) {
    this.scene = scene;
    this.group = scene.add.group();
    this.pickupRadius = gameConfig.xpPickup.baseRadius;
    // listen for player radius changes
    scene.game?.events?.on?.('pickup:radius', (r) => { this.pickupRadius = r || this.pickupRadius; });
    // also listen on global EventBus to catch non-game event emissions
    EventBus.on('pickup:radius', (r) => { this.pickupRadius = r || this.pickupRadius; });
  }

  toJSON() {
    const out = [];
    this.group.children.iterate((orb) => {
      if (!orb || !orb.active) return;
      out.push({ x: orb.x, y: orb.y, amount: orb.getData('amount') || 1, type: orb.getData('type') || 'xp' });
    });
    return out;
  }

  fromJSON(list) {
    if (!Array.isArray(list)) return;
    // clear existing
    try { this.group.clear(true, true); } catch (_) {}
    for (const o of list) {
      // Back-compat: previously only XP existed
      const type = o.type || 'xp';
      if (type === 'health') this.spawnHealthAt({ x: o.x, y: o.y }, o.amount || 1);
      else if (type === 'magnet') this.spawnMagnetAt({ x: o.x, y: o.y });
      else this.spawnXpAt({ x: o.x, y: o.y }, o.amount || 1);
    }
  }

  spawnXpAt({ x, y }, amount = 1) {
    // Explosion flash
    const flash = this.scene.add.circle(x, y, 4, 0xffc107, 1);
    this.scene.tweens.add({ targets: flash, radius: 16, alpha: 0, duration: 220, ease: 'quad.out', onComplete: () => flash.destroy() });

    const pickup = new XpPickup(this.scene, x, y, amount);
    this.group.add(pickup.getGO());
    return pickup.getGO();
  }

  spawnHealthAt({ x, y }, healAmount = 10) {
    // small flash
    const flash = this.scene.add.circle(x, y, 4, 0x8bc34a, 1);
    this.scene.tweens.add({ targets: flash, radius: 14, alpha: 0, duration: 200, ease: 'quad.out', onComplete: () => flash.destroy() });
    const pickup = new HealthPickup(this.scene, x, y, healAmount);
    this.group.add(pickup.getGO());
    return pickup.getGO();
  }

  spawnMagnetAt({ x, y }) {
    const flash = this.scene.add.circle(x, y, 4, 0x42a5f5, 1);
    this.scene.tweens.add({ targets: flash, radius: 14, alpha: 0, duration: 200, ease: 'quad.out', onComplete: () => flash.destroy() });
    const pickup = new MagnetPickup(this.scene, x, y);
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
      // Health packs should not collect if player is full health
      const type = orb.getData('type') || 'xp';
      if (type === 'health') {
        const isFull = (playerState.getHealthCurrent?.() >= playerState.getHealthMax?.());
        if (isFull) return;
      }
      const dx = orb.x - playerX;
      const dy = orb.y - playerY;
      const hitR = Math.max(0, Number(orb.getData('hitR') || 8));
      // include orb radius in pickup distance
      const thresh = this.pickupRadius + hitR;
      const d2 = dx * dx + dy * dy;
      if (d2 <= thresh * thresh) this._animateCollect(orb, playerX, playerY);
    });
  }

  _mergeNearby() {
    const orbs = this.group.getChildren().filter(Boolean);
    for (let i = 0; i < orbs.length; i++) {
      const a = orbs[i];
      if (!a || !a.active || a.getData('collecting')) continue;
      // only XP orbs merge
      if ((a.getData('type') || 'xp') !== 'xp') continue;
      const ar = a.getData('mergeR') || 7;
      for (let j = i + 1; j < orbs.length; j++) {
        const b = orbs[j];
        if (!b || !b.active || b.getData('collecting')) continue;
        if ((b.getData('type') || 'xp') !== 'xp') continue;
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
          const scale = Math.min(3, 1 + 0.06 * (sum - 1));
          a.setScale(scale);
          a.setData('mergeR', 10 * scale);
          a.setData('hitR', 8 * scale);
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
    const type = orb.getData('type') || 'xp';
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
        if (type === 'xp') {
          // Show floating XP gain text (uses PlayerState preview which respects overflow)
          const granted = playerState.previewXpGrant ? playerState.previewXpGrant(amount) : amount;
          // Display above the player rather than the orb
          this._showXpText(playerX, playerY - 24, granted);
          playerState.addXp(amount);
          // Log XP collection with current progress and requirement
          try {
            const current = playerState.getXpCurrent?.();
            const needed = playerState.getXpNeeded?.();
            console.log('[xp] collect', { amount: granted, current, needed });
          } catch (_) {}
        } else if (type === 'health') {
          // Heal and show small green heal text
          playerState.heal(amount);
          this._showHealText(playerX, playerY - 24, amount);
        } else if (type === 'magnet') {
          this._collectAllXp(playerX, playerY);
        }
      },
    });
  }

  _showXpText(x, y, amt) {
    const txt = this.scene.add.text(x, y, `+${amt} XP`, { fontFamily: 'monospace', fontSize: '12px', color: '#8bc34a' })
      .setOrigin(0.5)
      .setDepth(1000);
    this.scene.tweens.add({
      targets: txt,
      y: y - 14,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'sine.out',
      onComplete: () => txt.destroy(),
    });
  }

  _showHealText(x, y, amt) {
    const txt = this.scene.add.text(x, y, `+${amt} HP`, { fontFamily: 'monospace', fontSize: '12px', color: '#81c784' })
      .setOrigin(0.5)
      .setDepth(1000);
    this.scene.tweens.add({
      targets: txt,
      y: y - 14,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'sine.out',
      onComplete: () => txt.destroy(),
    });
  }

  _collectAllXp(playerX, playerY) {
    const orbs = this.group.getChildren().filter(Boolean);
    for (const orb of orbs) {
      if (!orb || !orb.active) continue;
      if ((orb.getData('type') || 'xp') !== 'xp') continue;
      // trigger collect animation immediately toward player
      this._animateCollect(orb, playerX, playerY);
    }
  }
}


