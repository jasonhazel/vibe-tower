/* Minimal Phaser prototype with modular weapons */

import { WeaponManager } from './weapons/WeaponManager.js';
import { Aura } from './weapons/Aura.js';
import { EnemyManager } from './enemies/EnemyManager.js';
import { HUDScene } from './ui/HUDScene.js';
import { GameOverScene } from './ui/GameOverScene.js';
import { gameConfig } from './state/GameConfig.js';
import { playerState } from './state/PlayerState.js';
import { Player } from './player/Player.js';
import { PickupManager } from './pickups/PickupManager.js';
import { PickupRadiusVisual } from './pickups/PickupRadiusVisual.js';

let GAME_WIDTH = gameConfig.width;
let GAME_HEIGHT = gameConfig.height;

class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.enemies = null;
    this.spawnTimer = 0;
    this.spawnIntervalMs = gameConfig.spawnIntervalMs;
    this.runMs = 0;
    this.enemyHpBonus = 0; // increases over time
    this.difficultyTickMs = 10000; // every 10s
    this._difficultyTimer = 0;
    // XP is tracked in playerState
    this.weaponManager = null;
    this.enemyManager = null;
    this.tower = null;
    this.contactTickTimer = 0;
    this.centerX = null;
    this.centerY = null;
    this._auraRef = null;
    this.pickups = null;
    this.pickupRadiusVisual = null;
  }

  create() {
    let cx = GAME_WIDTH / 2;
    let cy = GAME_HEIGHT / 2;
    this.centerX = cx;
    this.centerY = cy;

    // Initialize player health first, then create the tower
    const maxHp = gameConfig.player.baseHealth;
    playerState.setHealth(maxHp, maxHp);

    this.tower = new Player(this, cx, cy, {
      radius: gameConfig.player.radius,
      shield: gameConfig.player.baseShield,
    });

    // Initialize pickup radius (can be overridden by perks later)
    playerState.setPickupRadius?.(gameConfig.xpPickup.baseRadius);

    // HUD Scene overlay
    this.scene.launch('HUD');

    // Run timer text (top center)
    this.runTimerText = this.add.text(GAME_WIDTH / 2, 12, '00:00', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5, 0);

    // Enemies
    this.enemyManager = new EnemyManager(this, { centerX: cx, centerY: cy });
    this.enemies = this.enemyManager.group;

    // Pickups
    this.pickups = new PickupManager(this);
    this.pickupRadiusVisual = new PickupRadiusVisual(this, {
      x: cx, y: cy, radius: playerState.getPickupRadius?.() ?? gameConfig.xpPickup.baseRadius,
      color: 0x42a5f5, alpha: 0.4, thickness: 1, dash: 10, gap: 6,
    });

    // Weapons
    this.weaponManager = new WeaponManager(this, {
      enemiesGroup: this.enemies,
      centerX: cx,
      centerY: cy,
      awardXp: (amount) => { playerState.addXp(amount); }, // kept for future use
      spawnXp: (pos, amount) => { this.pickups.spawnXpAt(pos, amount); },
    });
    const aura = new Aura(this, this.weaponManager.context, {
        tickIntervalMs: gameConfig.aura.tickIntervalMs,
        damagePerTick: gameConfig.aura.damagePerTick,
        radius: gameConfig.aura.radius,
      });
    this.weaponManager.add(aura);
    this._auraRef = aura;

    // Resize handling: keep player centered without changing relative positions
    this.scale.on('resize', (gameSize) => {
      GAME_WIDTH = gameSize.width;
      GAME_HEIGHT = gameSize.height;
      const newCx = GAME_WIDTH / 2;
      const newCy = GAME_HEIGHT / 2;
      const dx = newCx - this.centerX;
      const dy = newCy - this.centerY;
      this.centerX = newCx;
      this.centerY = newCy;
      // shift all world objects by delta so relative offsets stay the same
      if (this.tower) {
        this.tower.x += dx;
        this.tower.y += dy;
        this.tower.graphics.clear();
        this.tower.graphics.fillStyle(0x4caf50, 1);
        this.tower.graphics.fillCircle(this.tower.x, this.tower.y, this.tower.radius);
      }
      this.enemies.children.iterate((enemy) => {
        if (!enemy) return;
        enemy.x += dx;
        enemy.y += dy;
      });
      // update centers for managers and aura drawing to the new visual center
      this.enemyManager.context.centerX = this.centerX;
      this.enemyManager.context.centerY = this.centerY;
      this.weaponManager.context.centerX = this.centerX;
      this.weaponManager.context.centerY = this.centerY;
      this._auraRef?.setCenter(this.centerX, this.centerY);
      this.pickupRadiusVisual?.setCenter(this.centerX, this.centerY);
    });

    // Restart handler
    this.game.events.on('game:restart', () => {
      // Reset player progress/state and scene timers
      playerState.reset();
      playerState.setPickupRadius?.(gameConfig.xpPickup.baseRadius);
      this.runMs = 0;
      this.enemyHpBonus = 0;
      this._difficultyTimer = 0;
      this._gameOverShown = false;
      this.scene.stop('GameOver');
      this.scene.restart();
    });
  }

  update(time, delta) {
    // Spawn enemies on a timer
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnIntervalMs) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Update enemies
    this.enemyManager.update(delta);

    // Update weapons
    this.weaponManager.update(delta);

    // Update pickups (auto-collect near player)
    const { x: px, y: py } = this.tower.getCenter();
    this.pickups.update(px, py);

    // Run timer and difficulty scaling
    this.runMs += delta;
    this._difficultyTimer += delta;
    if (this._difficultyTimer >= this.difficultyTickMs) {
      this._difficultyTimer = 0;
      this.enemyHpBonus += 1;
    }
    const totalSeconds = Math.floor(this.runMs / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    this.runTimerText.setText(`${mm}:${ss}`);

    // Tower contact damage tick
    this.contactTickTimer += delta;
    if (this.contactTickTimer >= gameConfig.player.contactTickMs) {
      this.contactTickTimer = 0;
      const touching = this._getEnemiesTouchingTower();
      for (const enemy of touching) {
        const hp = Math.max(0, Math.floor(enemy.getData('hp') ?? gameConfig.enemy.baseHp));
        // Deal damage equal to enemy's remaining HP
        if (hp > 0) this.tower.takeDamage(hp);
        // Drop XP crystal on contact death
        const ex = enemy.x; const ey = enemy.y; const er = enemy.getData('radius') || 10;
        const ang = Math.random() * Math.PI * 2;
        const r = Math.random() * er;
        const px2 = ex + Math.cos(ang) * r;
        const py2 = ey + Math.sin(ang) * r;
        this.pickups.spawnXpAt({ x: px2, y: py2 }, 1);
        enemy.destroy();
      }
    }

    // Check game over
    if (playerState.getHealthCurrent() <= 0 && !this._gameOverShown) {
      this._gameOverShown = true;
      this.scene.pause();
      this.scene.launch('GameOver', { runMs: this.runMs, xpTotal: playerState.getXp(), level: playerState.getLevel?.() ?? 1 });
    }
  }

  // Removed grid helper

  spawnEnemy() {
    this.enemyManager.spawnAroundPlayer(
      gameConfig.spawn.minRadius,
      gameConfig.spawn.maxRadius,
      { hp: gameConfig.enemy.baseHp + this.enemyHpBonus }
    );
  }

  // Weapon logic moved to weapon classes
  
  _getEnemiesTouchingTower() {
    const { x, y } = this.tower.getCenter();
    const towerRadius = this.tower.radius;
    const touching = [];
    this.enemies.children.iterate((enemy) => {
      if (!enemy) return;
      const enemyRadius = enemy.getData('radius') || 10;
      const threshold = towerRadius + enemyRadius;
      const thresholdSq = threshold * threshold;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= thresholdSq) touching.push(enemy);
    });
    return touching;
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'app',
  backgroundColor: gameConfig.backgroundColor,
  scene: [PlayScene, HUDScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);

// Ensure rotation updates the playfield size
window.addEventListener('orientationchange', () => {
  // slight delay allows browsers to recalc innerWidth/innerHeight
  setTimeout(() => game.scale.resize(window.innerWidth, window.innerHeight), 100);
});

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});


