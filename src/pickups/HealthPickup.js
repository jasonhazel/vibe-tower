import { PickupBase } from './PickupBase.js';
import { gameConfig } from '../state/GameConfig.js';

export class HealthPickup extends PickupBase {
  constructor(scene, x, y, healAmount) {
    super(scene, x, y, healAmount);
    const size = 12;
    const g = scene.add.graphics();
    // position the graphics at (x, y) and draw centered at 0,0 like XP bounce
    g.setPosition(x, y);
    // draw a red circle with a white cross centered at 0,0
    g.fillStyle(0xe53935, 1);
    g.fillCircle(0, 0, size / 2 + 2);
    g.lineStyle(2, 0xffffff, 1);
    const r = size / 2 - 1;
    g.strokeLineShape(new Phaser.Geom.Line(-r, 0, r, 0));
    g.strokeLineShape(new Phaser.Geom.Line(0, -r, 0, r));
    g.setData('type', 'health');
    g.setData('amount', Math.max(1, Math.floor(healAmount || gameConfig?.loot?.healthpack?.healAmount || 10)));
    // pickup hit radius similar to xp but slightly larger
    g.setData('hitR', 10);
    // simple spawn bounce similar to XP diamonds
    scene.tweens.add({ targets: g, y: y - 3, yoyo: true, repeat: 0, duration: 300, ease: 'sine.out' });
    this.go = g;
  }
}


