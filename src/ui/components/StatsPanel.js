import { EventBus } from '../../state/EventBus.js';
import { playerState } from '../../state/PlayerState.js';

export class StatsPanel {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.bg = scene.add.graphics();
    this.container.add(this.bg);
    this.labels = [];
    this.margin = 10;
    this.width = 180;
    this.lineH = 18;
    this.title = scene.add.text(0, 0, 'Stats', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' });
    this.container.add(this.title);
    this._draw(playerState.getStats());

    this.onStats = (stats) => this._draw(stats);
    EventBus.on('stats:update', this.onStats);
  }

  setPosition(x, y) {
    this.container.setPosition(x, y);
  }

  _draw(stats) {
    // clear previous labels
    this.labels.forEach((t) => t.destroy());
    this.labels.length = 0;
    const entries = [
      ['Area', stats.area?.toFixed?.(2) ?? String(stats.area)],
      ['Damage', stats.damage?.toFixed?.(2) ?? String(stats.damage)],
      ['Projectiles', stats.projectiles?.toFixed?.(2) ?? String(stats.projectiles)],
      ['Atk Speed', stats.attackSpeed?.toFixed?.(2) ?? String(stats.attackSpeed)],
      ['Pickup', stats.pickup?.toFixed?.(2) ?? String(stats.pickup)],
      ['XP', stats.xp?.toFixed?.(2) ?? String(stats.xp)],
    ];
    // Append derived radii
    if (this.scene && this.scene.scale) {
      const basePickup = window?.gameConfig?.xpPickup?.baseRadius || 60;
      const baseAura = window?.gameConfig?.aura?.radius || 100;
      const pickupR = Math.floor(basePickup * (stats.pickup || 1));
      const auraR = Math.floor(baseAura * (stats.area || 1));
      entries.push(['Pickup R', String(pickupR)]);
      entries.push(['Aura R', String(auraR)]);
    }
    this.title.setPosition(this.margin, this.margin);
    for (let i = 0; i < entries.length; i++) {
      const [k, v] = entries[i];
      const t = this.scene.add.text(this.margin, this.margin + 20 + i * this.lineH, `${k}: ${v}x`, { fontFamily: 'monospace', fontSize: '12px', color: '#e0e0e0' });
      this.container.add(t);
      this.labels.push(t);
    }
    const height = this.margin * 2 + 20 + entries.length * this.lineH;
    this.bg.clear();
    this.bg.fillStyle(0x151515, 0.7);
    this.bg.fillRoundedRect(0, 0, this.width, height, 8);
    this.bg.lineStyle(1, 0x444444, 1);
    this.bg.strokeRoundedRect(0, 0, this.width, height, 8);
  }

  destroy() {
    EventBus.off('stats:update', this.onStats);
    this.container?.destroy();
  }
}


