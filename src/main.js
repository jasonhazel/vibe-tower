/* Minimal Phaser prototype with modular weapons */

import { WeaponManager } from './items/weapons/WeaponManager.js';
import { Aura } from './items/weapons/Aura.js';
import { Fireball } from './items/weapons/Fireball.js';
import { Slam } from './items/weapons/Slam.js';
import { Boomerang } from './items/weapons/Boomerang.js';
import { ChainLightning } from './items/weapons/ChainLightning.js';
import { Blades } from './items/weapons/Blades.js';
import { EnemyManager } from './entities/enemies/EnemyManager.js';
import { HUDScene } from './ui/HUDScene.js';
import { GameOverScene } from './ui/GameOverScene.js';
import { LevelUpScene } from './ui/LevelUpScene.js';
import { gameConfig } from './state/GameConfig.js';
import { playerState } from './state/PlayerState.js';
import { EventBus } from './state/EventBus.js';
import { Player } from './entities/player/Player.js';
import { PickupManager } from './pickups/PickupManager.js';
import { PickupRadiusVisual } from './pickups/PickupRadiusVisual.js';
import { hudTheme } from './ui/theme.js';
import { SaveManager } from './state/SaveManager.js';
import pkg from '../package.json';
// Expose version for dynamic footer fallback in share image
try { window.VIBE_TOWER_VERSION = pkg.version; } catch (_) {}

let GAME_WIDTH = gameConfig.width;
let GAME_HEIGHT = gameConfig.height;

class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.enemies = null;
    this.spawnTimer = 0;
    this.spawnIntervalMs = gameConfig.spawnIntervalMs;
    this.spawnBatchCount = 1; // enemies per spawn tick
    this.spawnBatchTickMs = 30000; // +1 every 30s
    this._spawnBatchTimer = 0;
    // Global enemy speed scaling
    this.enemySpeedMul = 1; // x1 base
    this.enemySpeedTickMs = 30000; // every 30s
    this._enemySpeedTimer = 0;
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
    this._pendingLevelUp = false;
  }

  create() {
    let cx = GAME_WIDTH / 2;
    let cy = GAME_HEIGHT / 2;
    this.centerX = cx;
    this.centerY = cy;

    // Load autosave (if any)
    const saved = SaveManager.load();
    if (saved?.player) {
      playerState.fromJSON(saved.player);
      // restore run timer and difficulty if available
      if (typeof saved.runMs === 'number') this.runMs = saved.runMs;
      if (typeof saved.enemyHpBonus === 'number') this.enemyHpBonus = saved.enemyHpBonus;
      if (typeof saved.spawnBatchCount === 'number') this.spawnBatchCount = Math.max(1, Math.floor(saved.spawnBatchCount));
      if (typeof saved.enemySpeedMul === 'number') this.enemySpeedMul = Math.max(0.1, Number(saved.enemySpeedMul));
      // prevent immediate level-up dialog if we already handled current level
      this._lastLevel = playerState.getLevel?.() ?? 1;
      // defer managers until after we construct them below
    } else {
      const maxHp = gameConfig.player.baseHealth;
      playerState.setHealth(maxHp, maxHp);
    }

    this.tower = new Player(this, cx, cy, {
      radius: gameConfig.player.radius,
      shield: gameConfig.player.baseShield,
    });

    // Initialize pickup radius only if no save existed; otherwise stats handler will set it
    if (!saved?.player) {
      playerState.setPickupRadius?.(gameConfig.xpPickup.baseRadius);
    }

    // HUD Scene overlay
    this.scene.launch('HUD');

    // Run timer text (bottom above XP bar)
    this.runTimerText = this.add.text(0, 0, '00:00', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }).setOrigin(0.5, 1);
    // Version text aligned with timer on Y, right aligned
    this.versionText = this.add.text(0, 0, `v${pkg.version}`, { fontFamily: 'monospace', fontSize: '12px', color: '#b0bec5' }).setOrigin(1, 1);
    // initial placement above XP bar
    {
      const margin = hudTheme.margin; const barH = hudTheme.bar.height; const slotsSize = hudTheme.slot.size; const gap = hudTheme.gap;
      const xpY = GAME_HEIGHT - margin - slotsSize - gap - barH; // top of XP bar
      // Place timer clearly above XP bar by an additional bar height + small padding
      const ty = xpY - (gap + barH + 6);
      this.runTimerText.setPosition(GAME_WIDTH / 2, ty);
      this.versionText.setPosition(GAME_WIDTH - margin, ty);
    }

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
    // Seed starting weapons if owned in state
    const ws = playerState.getWeaponState();
    const owned = Object.keys(ws || {}).filter(id => ws[id]?.level > 0);
    const addAura = () => {
      const aura = new Aura(this, this.weaponManager.context, {
        cooldownMs: gameConfig.aura.tickIntervalMs,
        damagePerTick: gameConfig.aura.damagePerTick,
        radius: gameConfig.aura.radius,
      });
      this.weaponManager.add(aura);
      this._auraRef = aura;
    };
    const addFireball = () => {
      const fireball = new Fireball(this, this.weaponManager.context, {
        baseCooldownMs: gameConfig.fireball.baseCooldownMs,
        projectileSpeed: gameConfig.fireball.projectileSpeed,
        range: gameConfig.fireball.range,
        baseDamage: gameConfig.fireball.baseDamage,
        radius: gameConfig.fireball.radius,
      });
      this.weaponManager.add(fireball);
    };
    const addSlam = () => {
      const slam = new Slam(this, this.weaponManager.context, {
        baseCooldownMs: gameConfig.slam.baseCooldownMs,
        baseDamage: gameConfig.slam.baseDamage,
        maxRadius: gameConfig.slam.maxRadius,
        growthSpeed: gameConfig.slam.growthSpeed,
      });
      this.weaponManager.add(slam);
    };
    const addBlades = () => {
      const b = new Blades(this, this.weaponManager.context, {
        baseCooldownMs: gameConfig.blades.baseCooldownMs,
        baseDamage: gameConfig.blades.baseDamage,
        orbitRadius: gameConfig.blades.orbitRadius,
        rotationSpeed: gameConfig.blades.rotationSpeed,
        bladeLength: gameConfig.blades.bladeLength,
        bladeHitRadius: gameConfig.blades.bladeHitRadius,
        bladeCount: gameConfig.blades.bladeCount,
      });
      this.weaponManager.add(b);
    };
    const addBoomerang = () => {
      const b = new Boomerang(this, this.weaponManager.context, {
        baseCooldownMs: gameConfig.boomerang.baseCooldownMs,
        baseDamage: gameConfig.boomerang.baseDamage,
        range: gameConfig.boomerang.range,
        projectileSpeed: gameConfig.boomerang.projectileSpeed,
        radius: gameConfig.boomerang.radius,
        pierce: gameConfig.boomerang.pierce,
      });
      this.weaponManager.add(b);
    };
    const addChainLightning = () => {
      const cl = new ChainLightning(this, this.weaponManager.context, {
        baseCooldownMs: gameConfig.chainLightning.baseCooldownMs,
        baseDamage: gameConfig.chainLightning.baseDamage,
        range: gameConfig.chainLightning.range,
        chainRange: gameConfig.chainLightning.chainRange,
        maxJumps: gameConfig.chainLightning.maxJumps,
        falloff: gameConfig.chainLightning.falloff,
      });
      this.weaponManager.add(cl);
    };
    if (owned.length === 0) {
      // Prompt for starting weapon selection
      this._levelUpOpen = true;
      this.scene.pause();
      this.scene.launch('LevelUp', { chosenIds: [], maxTomes: 4, startingWeaponSelect: true });
      // On selection, LevelUpScene emits 'weapon:add' which we handle below
    } else {
      if (owned.includes('aura')) addAura();
      if (owned.includes('fireball')) addFireball();
      if (owned.includes('blades')) addBlades();
      if (owned.includes('slam')) addSlam();
      if (owned.includes('boomerang')) addBoomerang();
      if (owned.includes('chainLightning')) addChainLightning();
    }

    // Hydrate tome slots in HUD from saved tomeState
    try {
      const ts = playerState.getTomeState?.() || {};
      const chosen = Object.keys(ts).filter(id => (ts[id]?.level || 0) > 0);
      this._chosenTomes = chosen.slice();
      this.game.events.emit('tomes:update', chosen);
    } catch (_) {}

    // Restore saved enemies/pickups after managers exist
    if (saved && Array.isArray(saved.enemies)) this.enemyManager.fromJSON(saved.enemies);
    if (saved && Array.isArray(saved.pickups)) this.pickups.fromJSON(saved.pickups);

    // Ensure HUD has the initial weapon list even if it mounted later
    this.game.events.emit('weapons:update', this.weaponManager.getWeaponIds());
    
    // Periodic autosave
    this.time.addEvent({ delay: 5000, loop: true, callback: () => { this._saveSnapshot(); }});

    // Save on tab close/navigation
    window.addEventListener('pagehide', () => this._saveSnapshot());
    window.addEventListener('visibilitychange', () => { if (document.hidden) this._saveSnapshot(); });
    // Handle weapon unlock requests from LevelUpScene
    this.game.events.on('weapon:add', (weaponId) => {
      if (weaponId === 'fireball') {
        // mark as owned and add instance
        playerState.addWeaponById('fireball');
        addFireball();
      } else if (weaponId === 'slam') {
        playerState.addWeaponById('slam');
        addSlam();
      } else if (weaponId === 'boomerang') {
        playerState.addWeaponById('boomerang');
        addBoomerang();
      } else if (weaponId === 'blades') {
        playerState.addWeaponById('blades');
        addBlades();
      } else if (weaponId === 'chainLightning') {
        playerState.addWeaponById('chainLightning');
        addChainLightning();
      }
      // close level-up state if open
      this._levelUpOpen = false;
      this._pendingLevelUp = false;
      this.scene.resume();
      this._saveSnapshot();
    });

    // weapon upgrades: just resume level-up state
    this.game.events.on('weapon:upgraded', (_payload) => {
      this._levelUpOpen = false;
      this.scene.resume();
    });
    // UI-triggered game over
    this.game.events.on('ui:gameover', () => { this._forceGameOver = true; });
    // UI-triggered game over
    this.game.events.on('ui:gameover', () => { this._forceGameOver = true; });

    // Expose config for UI helpers
    window.gameConfig = gameConfig;

    // React to stat changes to scale aura and pickup radius
    EventBus.on('stats:update', (stats) => {
      const areaMul = stats?.area || 1;
      // Aura radius now scales via runtime params; just redraw the visual
      this._auraRef?._redrawRange?.();
      const pickupMul = (stats?.pickup || 1);
      const newPickupR = Math.floor(gameConfig.xpPickup.baseRadius * pickupMul * areaMul);
      playerState.setPickupRadius?.(newPickupR);
      this.pickupRadiusVisual?.setRadius?.(newPickupR);
      // update fireball range ring visuals
      if (this.weaponManager?.weapons) {
        this.weaponManager.weapons.forEach(w => w._redrawRange?.());
      }
    });
    // Apply initial stats to hydrate pickup/aura visuals after listeners are attached
    EventBus.emit('stats:update', playerState.getStats());

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
      // position timer above XP bar
      const margin = hudTheme.margin; const barH = hudTheme.bar.height; const slotsSize = hudTheme.slot.size; const gap = hudTheme.gap; // from hudTheme
      const xpY = GAME_HEIGHT - margin - slotsSize - gap - barH; // y of top of XP bar
      const ty = xpY - (gap + barH + 6);
      this.runTimerText.setPosition(GAME_WIDTH / 2, ty);
      this.versionText?.setPosition(GAME_WIDTH - margin, ty);
      // update any weapons that support center updates (e.g., Fireball range ring)
      if (this.weaponManager?.weapons) {
        this.weaponManager.weapons.forEach(w => w.setCenter?.(this.centerX, this.centerY));
      }
    });

    // Restart handler
    this.game.events.on('game:restart', () => {
      // Defer heavy operations to next tick to avoid blocking input frame
      setTimeout(() => {
        // Reset player progress/state and scene timers
        playerState.reset();
        playerState.setPickupRadius?.(gameConfig.xpPickup.baseRadius);
        try { SaveManager.clear(); } catch (_) {}
        this.runMs = 0;
        this.enemyHpBonus = 0;
        this._difficultyTimer = 0;
        this.spawnBatchCount = 1;
        this._spawnBatchTimer = 0;
        this.enemySpeedMul = 1;
        this._enemySpeedTimer = 0;
        this._gameOverShown = false;
        // Clear tome slots in HUD immediately
        this._chosenTomes = [];
        this.game.events.emit('tomes:update', []);
        this.scene.stop('GameOver');
        this.scene.restart();
      }, 0);
    });

    // Save only when queue is empty; defer heavy save to next tick to avoid frame hitch
    const maybeSaveAfterLevel = () => {
      this._pendingLevelUp = false;
      try {
        if (playerState.getPendingLevelUps?.() > 0) return;
        setTimeout(() => this._saveSnapshot(), 0);
      } catch (_) {}
    };
    this.game.events.on('tome:selected', maybeSaveAfterLevel);
    this.game.events.on('tome:upgraded', maybeSaveAfterLevel);
    this.game.events.on('weapon:add', maybeSaveAfterLevel);
    this.game.events.on('weapon:upgraded', maybeSaveAfterLevel);
  }

  update(time, delta) {
    // Spawn enemies on a timer
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnIntervalMs) {
      this.spawnTimer = 0;
      for (let i = 0; i < this.spawnBatchCount; i++) this.spawnEnemy();
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
    this._spawnBatchTimer += delta;
    if (this._spawnBatchTimer >= this.spawnBatchTickMs) {
      this._spawnBatchTimer = 0;
      this.spawnBatchCount += 1;
    }
    this._enemySpeedTimer += delta;
    if (this._enemySpeedTimer >= this.enemySpeedTickMs) {
      this._enemySpeedTimer = 0;
      this.enemySpeedMul = Math.round((this.enemySpeedMul * 1.10) * 100) / 100; // +10%
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

    // Check game over (also allow UI-triggered)
    if ((playerState.getHealthCurrent() <= 0 || this._forceGameOver) && !this._gameOverShown) {
      this._gameOverShown = true;
      this._forceGameOver = false;
      this.scene.pause();
      this.scene.launch('GameOver', { runMs: this.runMs, xpTotal: playerState.getXp(), level: playerState.getLevel?.() ?? 1 });
    }

    // Handle level up: open dialog when there are pending level-ups to process
    if (!this._levelUpOpen && (playerState.getPendingLevelUps?.() > 0)) {
      this._levelUpOpen = true;
      this._lastLevel = playerState.getLevel?.();
      this.scene.pause();
      this.scene.launch('LevelUp', { chosenIds: this._chosenTomes || [], maxTomes: 4 });
      this._pendingLevelUp = true;
      this._saveSnapshot();
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

  _saveSnapshot() {
    try {
      const snapshot = {
        player: playerState.toJSON(),
        runMs: this.runMs,
        enemyHpBonus: this.enemyHpBonus,
        spawnBatchCount: this.spawnBatchCount,
        enemySpeedMul: this.enemySpeedMul,
        enemies: this.enemyManager?.toJSON?.() || [],
        pickups: this.pickups?.toJSON?.() || [],
      };
      SaveManager.save(snapshot);
    } catch (_) {}
  }

  // Tome selection events
  init() {
    this._chosenTomes = [];
    this._lastLevel = playerState.getLevel?.() ?? 1;
    this._levelUpOpen = false;

    // Remove any stale handlers from previous scene instances
    if (this._tomeHandlersAttached) {
      this.game.events.off('tome:selected', this._onTomeSelected);
      this.game.events.off('tome:upgraded', this._onTomeUpgraded);
      this.game.events.off('tome:skipped', this._onTomeSkipped);
      this.game.events.off('weapon:add', this._onWeaponAdded);
    }

    this._onTomeSelected = (id) => {
      this._chosenTomes.push(id);
      this._levelUpOpen = false;
      this.scene.resume();
      this.game.events.emit('tomes:update', this._chosenTomes);
    };
    this._onTomeUpgraded = (_id) => {
      this._levelUpOpen = false;
      this.scene.resume();
      // no change to tome slots
    };
    this._onTomeSkipped = () => {
      this._levelUpOpen = false;
      this.scene.resume();
    };
    this._onWeaponAdded = (_weaponId) => {
      // Level-up finished via weapon unlock
      this._levelUpOpen = false;
      this.scene.resume();
    };

    this.game.events.on('tome:selected', this._onTomeSelected);
    this.game.events.on('tome:upgraded', this._onTomeUpgraded);
    this.game.events.on('tome:skipped', this._onTomeSkipped);
    this.game.events.on('weapon:add', this._onWeaponAdded);
    this._tomeHandlersAttached = true;
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
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
  parent: 'app',
  backgroundColor: gameConfig.backgroundColor,
  scene: [PlayScene, HUDScene, GameOverScene, LevelUpScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

const game = new Phaser.Game(config);

// Ensure rotation updates the playfield size
window.addEventListener('orientationchange', () => {
  // give the browser time to settle safe UI and viewport units
  setTimeout(() => {
    const w = document.documentElement.clientWidth;
    const h = document.documentElement.clientHeight;
    game.scale.resize(w, h);
  }, 150);
});

window.addEventListener('resize', () => {
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  game.scale.resize(w, h);
});


