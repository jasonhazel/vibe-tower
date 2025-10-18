import { EventBus } from '../state/EventBus.js';
import { playerState } from '../state/PlayerState.js';

export class Player {
  constructor(scene, x, y, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = config.radius ?? 16;
    this.color = config.color ?? 0x4caf50;
    this.shield = config.shield ?? 0;

    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(this.color, 1);
    this.graphics.fillCircle(this.x, this.y, this.radius);

    // Emit initial from current player state and player shield
    EventBus.emit('player:health', { health: playerState.getHealthCurrent(), shield: this.shield });
  }

  getCenter() {
    return { x: this.x, y: this.y };
  }

  destroy() {
    this.graphics?.destroy();
  }

  takeDamage(amount) {
    if (!amount || amount <= 0) return;
    let remaining = amount;
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) {
      playerState.damage(remaining);
    }
    EventBus.emit('player:health', { health: playerState.getHealthCurrent(), shield: this.shield });
    if (playerState.getHealthCurrent() === 0) {
      EventBus.emit('player:dead');
    }
  }
}


