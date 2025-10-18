import { BasicEnemy } from './BasicEnemy.js';

export class EnemyManager {
  constructor(scene, context) {
    this.scene = scene;
    this.context = context; // { centerX, centerY }
    this.group = scene.add.group();
    this.instances = [];
  }

  spawnBasicAt(position, overrides = {}) {
    const enemy = new BasicEnemy(this.scene, this.context, { spawn: position, ...overrides });
    const go = enemy.getGO();
    this.group.add(go);
    this.instances.push(enemy);
    return enemy;
  }

  spawnRandomEdge() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const edge = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    if (edge === 0) { // top
      x = Math.random() * w; y = -10;
    } else if (edge === 1) { // right
      x = w + 10; y = Math.random() * h;
    } else if (edge === 2) { // bottom
      x = Math.random() * w; y = h + 10;
    } else { // left
      x = -10; y = Math.random() * h;
    }
    return this.spawnBasicAt({ x, y });
  }

  spawnAroundPlayer(minRadius, maxRadius, overrides = {}) {
    const angle = Math.random() * Math.PI * 2;
    const r = minRadius + Math.random() * Math.max(0, (maxRadius - minRadius));
    const x = this.context.centerX + Math.cos(angle) * r;
    const y = this.context.centerY + Math.sin(angle) * r;
    return this.spawnBasicAt({ x, y }, overrides);
  }

  update(deltaMs) {
    // Update and compact list for any destroyed instances
    const next = [];
    for (let i = 0; i < this.instances.length; i++) {
      const inst = this.instances[i];
      const go = inst.getGO();
      if (go && go.active) {
        // Apply global enemy speed multiplier from scene, if present
        const mul = Math.max(0.1, Number(this.scene?.enemySpeedMul ?? 1));
        inst.update(deltaMs * mul);
        next.push(inst);
      } else {
        inst.onDestroy?.();
      }
    }
    this.instances = next;
  }

  clear() {
    try { this.group.clear(true, true); } catch (_) {}
    this.instances = [];
  }

  toJSON() {
    const list = [];
    for (let i = 0; i < this.instances.length; i++) {
      const inst = this.instances[i];
      const go = inst.getGO?.();
      if (!go || !go.active) continue;
      list.push({
        type: inst.getId?.() || 'enemy-basic',
        x: go.x,
        y: go.y,
        hp: go.getData('hp') ?? 0,
        radius: go.getData('radius') ?? 10,
        speed: inst.speed ?? 40,
      });
    }
    return list;
  }

  fromJSON(list) {
    if (!Array.isArray(list)) return;
    this.clear();
    for (const e of list) {
      this.spawnBasicAt({ x: e.x, y: e.y }, { hp: e.hp, radius: e.radius, speed: e.speed });
    }
  }
}


