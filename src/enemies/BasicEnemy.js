import { EnemyBase } from './EnemyBase.js';

export class BasicEnemy extends EnemyBase {
  constructor(scene, context, config = {}) {
    super(scene, context);
    this.id = 'enemy-basic';
    this.speed = config.speed ?? 40; // px/sec
    const size = config.size ?? 12;
    const color = config.color ?? 0xef5350;
    const { x, y } = config.spawn ?? { x: 0, y: 0 };

    this.go = scene.add.rectangle(x, y, size, size, color);
    this.go.setData('hp', config.hp ?? 20);

    // When destroyed externally (e.g., by weapons), clean up
    this.go.on('destroy', () => this.onDestroy());
  }

  getId() {
    return this.id;
  }

  update(deltaMs) {
    if (!this.go || !this.go.active) return;
    const { centerX, centerY } = this.context;
    const dx = centerX - this.go.x;
    const dy = centerY - this.go.y;
    const len = Math.hypot(dx, dy) || 1;
    const step = (this.speed * (deltaMs / 1000));
    this.go.x += (dx / len) * step;
    this.go.y += (dy / len) * step;
  }
}


