import { EventBus } from '../state/EventBus.js';
import { playerState } from '../state/PlayerState.js';
import { gameConfig } from '../state/GameConfig.js';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUD');
    this.xpText = null;
    this.handlers = [];
    this.panel = null;
    this.healthBar = null;
    this.shieldBar = null;
    this.healthText = null;
    this.shieldText = null;
    this.layout = null;
    this.xpBarBg = null;
    this.xpBarFill = null;
    this._xpMaxPlaceholder = 100;
    this.avatarGfx = null;
    this.levelText = null;
    // Right-side equip slots (e.g., tomes)
    this.auxSlots = [];
    this._auxSlotSize = 28;
    this._auxSlotGap = 6;
  }

  create() {
    // Layout metrics
    this.layout = {
      panelX: 8,
      panelY: 8,
      panelW: 240,
      panelH: 64,
      margin: 12,
    };
    const { panelX, panelY, panelW, panelH, margin } = this.layout;
    this.layout.barX = panelX + margin;
    this.layout.barW = panelW - (margin * 2); // fills panel minus equal left/right margins
    this.layout.shieldY = panelY + 32;
    this.layout.healthY = panelY + 48;
    this.layout.barH = 12;

    // Panel background
    this.panel = this.add.graphics();
    // this.panel.fillStyle(0x000000, 0.35);
    // this.panel.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    // this.panel.lineStyle(1, 0xffffff, 0.08);
    // this.panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);

    // Weapon slots (prepared; positioned below bars in _layoutWeaponSlots)
    this.weaponSlots = [];
    this._slotSize = 28;
    this._slotGap = 6;
    for (let i = 0; i < 4; i++) {
      const gfx = this.add.graphics();
      this.weaponSlots.push({ gfx, icon: null });
    }

    // Aux slots (prepared; positioned bottom-right in _layoutAuxSlots)
    for (let i = 0; i < 4; i++) {
      const gfx = this.add.graphics();
      this.auxSlots.push({ gfx, icon: null });
    }

    // Health and shield bars
    this.healthBar = this.add.graphics();
    this.shieldBar = this.add.graphics();
    this.healthBar.setDepth(1);
    this.shieldBar.setDepth(1);
    this._drawBars({ 
        health: playerState.getHealthCurrent(), 
        shield: gameConfig.player.baseShield });

    // Text overlays disabled for now (kept for later if needed)
    this.healthText = null;
    this.shieldText = null;

    const onWeapons = (ids) => { this._lastWeaponIds = ids || []; this._layoutWeaponSlots(); };
    this.game.events.on('weapons:update', onWeapons);
    this.handlers.push(['weapons:update', onWeapons]);

    const onAux = (ids) => { this._lastAuxIds = ids || []; this._layoutAuxSlots(); };
    this.game.events.on('tomes:update', onAux);
    this.handlers.push(['tomes:update', onAux]);

    const onTowerHealth = (state) => {
      this._drawBars(state);
      this._updateTexts(state);
    };
    EventBus.on('player:health', onTowerHealth);
    this.handlers.push(['player:health', onTowerHealth]);

    const onHealth = ({ current, max }) => {
      this._drawBars({ health: current, shield: gameConfig.player.baseShield });
    };
    EventBus.on('health:update', onHealth);
    this.handlers.push(['health:update', onHealth]);

    // Pin to camera
    this.cameras.main.setScroll(0, 0);

    // Bottom HUD (weapons bottom, aux bottom-right, then HEALTH, then XP)
    this.xpBarBg = this.add.graphics();
    this.xpBarFill = this.add.graphics();
    this._layoutWeaponSlots();
    this._layoutAuxSlots();
    // draw health first (above weapons)
    this._drawBars({ health: playerState.getHealthCurrent(), shield: gameConfig.player.baseShield });
    // then XP above health
    this._layoutXpBar();

    // Avatar/level removed

    const onResize = () => { this._layoutWeaponSlots(); this._layoutAuxSlots(); this._drawBars({ health: playerState.getHealthCurrent(), shield: gameConfig.player.baseShield }); this._layoutXpBar(); };
    this.scale.on('resize', onResize);
    this.handlers.push(['__scale_resize__', onResize]);
  }

  shutdown() {
    this._cleanup();
  }

  destroy() {
    this._cleanup();
    super.destroy();
  }

  _cleanup() {
    while (this.handlers.length) {
      const [evt, fn] = this.handlers.pop();
      if (evt === '__scale_resize__') this.scale?.off('resize', fn);
      else if (evt === 'weapons:update') this.game?.events?.off(evt, fn);
      else if (evt === 'tomes:update') this.game?.events?.off(evt, fn);
      else EventBus.off(evt, fn);
    }
  }

  _drawBars({ health, shield }) {
    const maxHealth = playerState.getHealthMax();
    // Draw health bar directly above weapon slots
    const margin = 12;
    const x = margin;
    const w = this.scale.gameSize.width - margin * 2;
    const barH = 12;
    const gapFromWeapons = 8;
    const healthY = this.scale.gameSize.height - margin - this._slotSize - gapFromWeapons - barH;

    this.healthBar.clear();
    this.healthBar.fillStyle(0x2e2e2e, 1);
    this.healthBar.fillRoundedRect(x, healthY, w, barH, 6);
    const hw = Math.max(0, Math.min(1, health / maxHealth)) * w;
    this.healthBar.fillStyle(0xef5350, 1); // red health fill
    if (hw > 0) {
      const r = Math.min(6, barH / 2, hw / 2);
      if (hw < r * 2) {
        this.healthBar.fillRect(x, healthY, hw, barH);
      } else {
        this.healthBar.fillRoundedRect(x, healthY, hw, barH, r);
      }
    }

    // Shield bar not shown in bottom HUD for now
    this.shieldBar.clear();

    // expose rect for avatar/layout consumers
    this._healthRect = { x, y: healthY, w, h: barH };
  }

  _updateTexts({ health, shield }) {
    const maxHealth = playerState.getHealthMax();
    const maxShield = Math.max(gameConfig.player.baseShield, shield || 0);
    // Labels hidden
  }

  _layoutXpBar() {
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;
    const margin = 12;
    const barH = 12;
    const x = margin;
    // Position XP bar above HEALTH with a gap
    const gap = 8;
    const referenceY = this._healthRect ? this._healthRect.y : (h - margin - this._slotSize - gap - 12);
    const y = referenceY - gap - barH;
    const width = w - margin * 2;

    this.xpBarBg.clear();
    this.xpBarBg.fillStyle(0x202020, 0.9);
    this.xpBarBg.fillRoundedRect(x, y, width, barH, 5);

    const progress = Math.min(1, (playerState.getXp() % this._xpMaxPlaceholder) / this._xpMaxPlaceholder);
    this.xpBarFill.clear();
    this.xpBarFill.fillStyle(0x8bc34a, 1);
    const fw = width * progress;
    if (fw > 0) {
      const r = Math.min(5, barH / 2, fw / 2);
      if (fw < r * 2) {
        this.xpBarFill.fillRect(x, y, fw, barH);
      } else {
        this.xpBarFill.fillRoundedRect(x, y, fw, barH, r);
      }
    }

    // store rect for health bar placement
    this._xpRect = { x, y, w: width, h: barH };

    // redraw health at its new position
    this._drawBars({ health: playerState.getHealthCurrent(), shield: gameConfig.player.baseShield });
    // reposition weapon slots as they sit below bars
    this._layoutWeaponSlots();
  }

  // avatar removed

  _layoutWeaponSlots() {
    if (!this._xpRect) return;
    // Place slots flush to the bottom safe area with margin
    const margin = 12;
    const startX = margin;
    const startY = this.scale.gameSize.height - margin - this._slotSize; // bottom aligned
    const size = this._slotSize;
    const gap = this._slotGap;
    for (let i = 0; i < this.weaponSlots.length; i++) {
      const slot = this.weaponSlots[i];
      slot.gfx.clear();
      const sx = startX + i * (size + gap);
      const sy = startY;
      const occupied = this._lastWeaponIds && this._lastWeaponIds[i];
      if (occupied) {
        slot.gfx.fillStyle(0x2a2a2a, 1);
        slot.gfx.fillRoundedRect(sx, sy, size, size, 6);
        slot.gfx.lineStyle(2, 0x999999, 1);
        slot.gfx.strokeRoundedRect(sx, sy, size, size, 6);
        slot.gfx.fillStyle(0x66bb6a, 1);
        slot.gfx.fillCircle(sx + size/2, sy + size/2, 6);
      } else {
        slot.gfx.lineStyle(2, 0x444444, 1);
        slot.gfx.strokeRoundedRect(sx, sy, size, size, 6);
      }
    }
  }

  _layoutAuxSlots() {
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;
    const margin = 12;
    const size = this._auxSlotSize;
    const gap = this._auxSlotGap;
    // Align from right edge, bottom aligned like weapons
    for (let i = 0; i < this.auxSlots.length; i++) {
      const slot = this.auxSlots[i];
      slot.gfx.clear();
      const sx = w - margin - size - i * (size + gap);
      const sy = h - margin - size;
      const occupied = this._lastAuxIds && this._lastAuxIds[i];
      if (occupied) {
        slot.gfx.fillStyle(0x2a2a2a, 1);
        slot.gfx.fillRoundedRect(sx, sy, size, size, 6);
        slot.gfx.lineStyle(2, 0x999999, 1);
        slot.gfx.strokeRoundedRect(sx, sy, size, size, 6);
        slot.gfx.fillStyle(0x42a5f5, 1);
        slot.gfx.fillCircle(sx + size/2, sy + size/2, 6);
      } else {
        slot.gfx.lineStyle(2, 0x444444, 1);
        slot.gfx.strokeRoundedRect(sx, sy, size, size, 6);
      }
    }
  }
}


