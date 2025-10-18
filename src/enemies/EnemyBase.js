export class EnemyBase {
  constructor(scene, context) {
    this.scene = scene;
    this.context = context; // { centerX, centerY }
    this.go = null; // Phaser GameObject
  }

  getId() {
    return 'enemy-base';
  }

  getGO() {
    return this.go;
  }

  update(_deltaMs) {
    // Implement in subclass
  }

  onDestroy() {
    // Optional cleanup
  }
}


