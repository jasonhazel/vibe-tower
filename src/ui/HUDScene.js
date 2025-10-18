import { EventBus } from '../state/EventBus.js';
import { playerState } from '../state/PlayerState.js';
import { gameConfig } from '../state/GameConfig.js';
import { ProgressBar } from './components/ProgressBar.js';
import { SlotRow } from './components/SlotRow.js';
import { hudTheme } from './theme.js';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUD');
    this.xpText = null;
    this.handlers = [];
    this.panel = null;
    this.healthBar = null; // ProgressBar
    this.xpBar = null; // ProgressBar
    this.shieldBar = null;
    this.healthText = null;
    this.shieldText = null;
    this.layout = null;
    this.xpBarBg = null; // deprecated
    this.xpBarFill = null; // deprecated
    this._xpMaxPlaceholder = 100;
    this.avatarGfx = null;
    this.levelText = null;
    this.levelBadge = null; // Graphics circle behind level text
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

    // Slot rows
    this.weaponsRow = new SlotRow(this, { count: 4, size: hudTheme.slot.size, gap: hudTheme.slot.gap, align: 'left' });
    this.auxRow = new SlotRow(this, { count: 4, size: hudTheme.slot.size, gap: hudTheme.slot.gap, align: 'right' });

    // Health and XP bars
    this.shieldBar = this.add.graphics();
    this.healthBar = new ProgressBar(this, {
      height: hudTheme.bar.height,
      cornerRadius: hudTheme.bar.radius,
      backgroundColor: hudTheme.colors.health.bg,
      backgroundAlpha: hudTheme.colors.health.bgA,
      fillColor: hudTheme.colors.health.fill,
      fillAlpha: hudTheme.colors.health.fillA,
    });
    this.xpBar = new ProgressBar(this, {
      height: hudTheme.bar.height,
      cornerRadius: hudTheme.bar.radius,
      backgroundColor: hudTheme.colors.xp.bg,
      backgroundAlpha: hudTheme.colors.xp.bgA,
      fillColor: hudTheme.colors.xp.fill,
      fillAlpha: hudTheme.colors.xp.fillA,
    });

    // Text overlays disabled for now (kept for later if needed)
    this.healthText = null;
    this.shieldText = null;

    // Level badge in bottom center
    this.levelBadge = this.add.graphics();
    this.levelText = this.add.text(0, 0, String(playerState.getLevel?.() ?? 1), {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const onWeapons = (ids) => { this._lastWeaponIds = ids || []; this.weaponsRow.update(this._lastWeaponIds); };
    this.game.events.on('weapons:update', onWeapons);
    this.handlers.push(['weapons:update', onWeapons]);

    const onAux = (ids) => { this._lastAuxIds = ids || []; this.auxRow.update(this._lastAuxIds); };
    this.game.events.on('tomes:update', onAux);
    this.handlers.push(['tomes:update', onAux]);

    const onHealth = ({ current, max }) => {
      this.healthBar.setValue(current, max).draw();
    };
    EventBus.on('health:update', onHealth);
    this.handlers.push(['health:update', onHealth]);

    const onXpProgress = ({ current, needed }) => {
      this.xpBar.setValue(current, needed).draw();
    };
    EventBus.on('xp:progress', onXpProgress);
    this.handlers.push(['xp:progress', onXpProgress]);

    const onLevel = (lvl) => {
      this.levelText.setText(String(lvl));
      // small pulse
      this.tweens.add({ targets: this.levelText, scale: 1.25, duration: 100, yoyo: true, ease: 'sine.out' });
    };
    EventBus.on('player:level', onLevel);
    this.handlers.push(['player:level', onLevel]);

    // Pin to camera
    this.cameras.main.setScroll(0, 0);

    // Bottom HUD layout
    this._layoutBottomHud();
    // initialize values
    this.healthBar.setValue(playerState.getHealthCurrent(), playerState.getHealthMax()).draw();
    this.xpBar.setValue(playerState.getXpCurrent?.() ?? 0, playerState.getXpNeeded?.() ?? this._xpMaxPlaceholder).draw();

    // Avatar/level removed

    const onResize = () => { this._layoutBottomHud(); this.healthBar.setValue(playerState.getHealthCurrent(), playerState.getHealthMax()).draw(); this.xpBar.setValue(playerState.getXpCurrent?.() ?? 0, playerState.getXpNeeded?.() ?? this._xpMaxPlaceholder).draw(); };
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
    // kept for compatibility if other code calls it
    this.healthBar.setValue(health ?? playerState.getHealthCurrent(), playerState.getHealthMax()).draw();
  }

  _updateTexts({ health, shield }) {
    const maxHealth = playerState.getHealthMax();
    const maxShield = Math.max(gameConfig.player.baseShield, shield || 0);
    // Labels hidden
  }

  _layoutXpBar() { /* replaced by _layoutBottomHud */ }

  // avatar removed

  _layoutWeaponSlots() { /* replaced by _layoutBottomHud */ }

  _layoutAuxSlots() { /* replaced by _layoutBottomHud */ }

  _layoutBottomHud() {
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;
    const margin = hudTheme.margin;
    const gap = hudTheme.gap;
    const size = hudTheme.slot.size;
    const barH = hudTheme.bar.height;

    const slotsY = h - margin - size;
    const innerW = w - margin * 2;
    const innerX = margin;

    this.weaponsRow.setPosition(innerX, slotsY, innerW).update(this._lastWeaponIds || []);
    this.auxRow.setPosition(innerX, slotsY, innerW).update(this._lastAuxIds || []);

    const healthY = slotsY - gap - barH;
    const xpY = healthY - gap - barH;
    this.healthBar.setBounds(innerX, healthY, innerW, barH).draw();
    this.xpBar.setBounds(innerX, xpY, innerW, barH).draw();

    this._healthRect = { x: innerX, y: healthY, w: innerW, h: barH };
    this._xpRect = { x: innerX, y: xpY, w: innerW, h: barH };

    // Level badge centered between slot rows
    const cx = w / 2;
    const cy = slotsY + size / 2;
    const r = 14;
    this.levelBadge.clear();
    this.levelBadge.fillStyle(0x263238, 0.9);
    this.levelBadge.fillCircle(cx, cy, r);
    this.levelBadge.lineStyle(2, 0x90caf9, 0.9);
    this.levelBadge.strokeCircle(cx, cy, r);
    this.levelText.setPosition(cx, cy);
  }
}


