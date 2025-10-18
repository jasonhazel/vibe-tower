export class PickupBase {
  constructor(scene, x, y, amount = 1) {
    this.scene = scene;
    this.x = x; this.y = y;
    this.amount = amount;
    this.go = null; // top-level game object (sprite/shape/container)
  }

  getGO() {
    return this.go;
  }

  getAmount() {
    return this.amount;
  }

  update(_delta) {}

  destroy() {
    this.go?.destroy();
  }
}


