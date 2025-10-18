import { EnemyBase } from './EnemyBase.js';

export class BasicEnemy extends EnemyBase {
  constructor(scene, context, config = {}) {
    super(scene, context);
    this.id = 'enemy-basic';
    this.speed = config.speed ?? 40; // px/sec
    this.radius = config.radius ?? 12;
    this.color = config.color ?? 0xef5350;
    const { x, y } = config.spawn ?? { x: 0, y: 0 };
    const hp = config.hp ?? 20;

    // Container holds graphics body and centered HP text
    const container = scene.add.container(x, y);
    const bodyGfx = scene.add.graphics();
    bodyGfx.fillStyle(this.color, 1);
    bodyGfx.fillCircle(0, 0, this.radius);
    bodyGfx.lineStyle(2, 0x222222, 0.8);
    bodyGfx.strokeCircle(0, 0, this.radius);

    const hpText = scene.add.text(0, 0, String(hp), {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([bodyGfx, hpText]);
    this.go = container;
    this.bodyGfx = bodyGfx;
    this.hpText = hpText;
    this.go.setData('hp', hp);
    this.go.setData('radius', this.radius);

    // React to HP changes to update label
    this.go.on('changedata-hp', (_obj, value, prev) => {
      const v = Math.max(0, Math.floor(value));
      this.hpText.setText(String(v));
      if (prev !== undefined && prev !== null) {
        const damage = Math.max(0, Math.floor(prev - value));
        if (damage > 0) this._showDamage(this.go.x, this.go.y, damage);
      }
    });

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
  _showDamage(x, y, amount) {
    const txt = this.scene.add.text(x, y - 10, `-${amount}`, {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ef5350',
    }).setOrigin(0.5).setDepth(900);
    this.scene.tweens.add({
      targets: txt,
      y: y - 24,
      alpha: { from: 1, to: 0 },
      duration: 700,
      ease: 'sine.out',
      onComplete: () => txt.destroy(),
    });
  }
}


