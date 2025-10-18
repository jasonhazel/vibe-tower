import { EventBus } from '../state/EventBus.js';
import { playerState } from '../state/PlayerState.js';
import { gameConfig } from '../state/GameConfig.js';
import { ProgressBar } from './components/ProgressBar.js';
import { SlotRow } from './components/SlotRow.js';
import { hudTheme } from './theme.js';
import { StatsPanel } from './components/StatsPanel.js';
import { TomeCatalog } from '../items/tomes/Tomes.js';
import { Tooltip } from './components/Tooltip.js';
import { CheatMenu } from './components/CheatMenu.js';

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
    this.statsPanel = null;
    // Right-side equip slots (e.g., tomes)
    this.auxSlots = [];
    this._auxSlotSize = 28;
    this._auxSlotGap = 6;
    this.tooltip = null;
    // debug menu component
    this.cheatMenu = null;
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

    const onWeapons = (ids) => {
      this._lastWeaponIds = ids || [];
      // fetch icon drawers from PlayScene weapon instances in order of ids
      let iconDrawers = [];
      try {
        const play = this.scene.get('PlayScene');
        if (play?.weaponManager?.weapons) {
          iconDrawers = this._lastWeaponIds.map((id) => {
            const inst = play.weaponManager.weapons.find(w => w.getId() === id);
            return inst?.getSlotIconDrawer?.();
          });
        }
      } catch (_) {}
      this.weaponsRow.update(this._lastWeaponIds, iconDrawers);
    };
    this.game.events.on('weapons:update', onWeapons);
    this.handlers.push(['weapons:update', onWeapons]);

    const onAux = (ids) => {
      this._lastAuxIds = ids || [];
      // build tome icon drawers from TomeCatalog objects (ids are tome ids)
      const drawers = this._lastAuxIds.map((id) => TomeCatalog.find(t => t.id === id)?.getSlotIconDrawer?.());
      this.auxRow.update(this._lastAuxIds, drawers);
    };
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
    // Pull initial weapons/tomes state from PlayScene in case events fired early
    try {
      const play = this.scene.get('PlayScene');
      if (play?.weaponManager) {
        this._lastWeaponIds = play.weaponManager.getWeaponIds();
        const drawers = this._lastWeaponIds.map((id) => {
          const inst = play.weaponManager.weapons.find(w => w.getId() === id);
          return inst?.getSlotIconDrawer?.();
        });
        this.weaponsRow.update(this._lastWeaponIds, drawers);
      }
      // hydrate initial tome icons too
      const drawersAux = this._lastAuxIds?.map((id) => TomeCatalog.find(t => t.id === id)?.getSlotIconDrawer?.()) || [];
      this.auxRow.update(this._lastAuxIds || [], drawersAux);
    } catch (_) {}
    // Stats panel (top-right)
    this.statsPanel = new StatsPanel(this);
    this._layoutStatsPanel();
    // Stats toggle (top-right small button)
    this._statsVisible = false;
    const toggleW = 22, toggleH = 18;
    this._statsToggleG = this.add.graphics();
    const drawToggle = () => {
      const w = this.scale.gameSize.width;
      const margin = 12;
      // Place icon at the top-right corner independent of panel width
      const x = w - margin - toggleW;
      const y = margin;
      this._statsToggleG.clear();
      // icon (simple bars) - white only, no background
      this._statsToggleG.lineStyle(2, 0xffffff, 1);
      this._statsToggleG.beginPath();
      this._statsToggleG.moveTo(x + 4, y + 5);
      this._statsToggleG.lineTo(x + toggleW - 4, y + 5);
      this._statsToggleG.moveTo(x + 4, y + 9);
      this._statsToggleG.lineTo(x + toggleW - 4, y + 9);
      this._statsToggleG.moveTo(x + 4, y + 13);
      this._statsToggleG.lineTo(x + toggleW - 4, y + 13);
      this._statsToggleG.strokePath();
    };
    drawToggle();
    this._statsToggleZone = this.add.zone(0, 0, toggleW, toggleH).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    const updateTogglePos = () => {
      const w = this.scale.gameSize.width;
      const margin = 12;
      const x = w - margin - toggleW;
      const y = margin;
      this._statsToggleZone.setPosition(x, y);
      drawToggle();
    };
    updateTogglePos();
    this._statsToggleZone.on('pointerover', () => drawToggle());
    this._statsToggleZone.on('pointerout', () => drawToggle());
    this._statsToggleZone.on('pointerup', () => {
      this._statsVisible = !this._statsVisible;
      if (this._statsVisible) this.statsPanel.slideIn();
      else this.statsPanel.slideOut();
      this._layoutStatsPanel();
      updateTogglePos();
    });
    // Restart button (top-left)
    const restartW = 22, restartH = 18;
    this._restartG = this.add.graphics();
    this._restartText = this.add.text(0, 0, 'R', { fontFamily: 'monospace', fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);
    const drawRestart = () => {
      const margin = 12; const x = margin; const y = margin;
      this._restartG.clear();
      this._restartG.lineStyle(2, 0xffffff, 1);
      // draw full rectangle path to avoid missing edge due to pixel alignment
      this._restartG.beginPath();
      this._restartG.moveTo(x, y);
      this._restartG.lineTo(x + restartW, y);
      this._restartG.lineTo(x + restartW, y + restartH);
      this._restartG.lineTo(x, y + restartH);
      this._restartG.closePath();
      this._restartG.strokePath();
      this._restartText.setPosition(x + restartW / 2, y + restartH / 2);
    };
    drawRestart();
    this._restartZone = this.add.zone(12, 12, restartW, restartH).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    this._restartZone.on('pointerup', () => this.game.events.emit('game:restart'));
    const updateRestartPos = () => {
      const margin = 12; const x = margin; const y = margin;
      this._restartZone.setPosition(x, y);
      drawRestart();
    };
    updateRestartPos();
    // Tooltip
    this.tooltip = new Tooltip(this);
    // initialize values
    this.healthBar.setValue(playerState.getHealthCurrent(), playerState.getHealthMax()).draw();
    this.xpBar.setValue(playerState.getXpCurrent?.() ?? 0, playerState.getXpNeeded?.() ?? this._xpMaxPlaceholder).draw();

    // Avatar/level removed

    const onResize = () => { this._layoutBottomHud(); this._layoutStatsPanel(); this.healthBar.setValue(playerState.getHealthCurrent(), playerState.getHealthMax()).draw(); this.xpBar.setValue(playerState.getXpCurrent?.() ?? 0, playerState.getXpNeeded?.() ?? this._xpMaxPlaceholder).draw(); updateTogglePos(); updateRestartPos(); };
    this.scale.on('resize', onResize);
    this.handlers.push(['__scale_resize__', onResize]);

    // Debug admin: Cheat menu (upper-left) only when ?cheat=true
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('cheat') === 'true') {
        this.cheatMenu = new CheatMenu(this);
      }
    } catch (_) {}
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
    // cleanup cheat menu
    this.cheatMenu?.destroy?.();
    this.cheatMenu = null;
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
    // Interactive zones for tooltips
    this._wireSlotTooltips(innerX, slotsY, size, gap, innerW);

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

  _layoutStatsPanel() {
    if (!this.statsPanel) return;
    // Full-width panel anchored at top; x managed internally with padding
    this.statsPanel.setPosition(0, 0);
  }

  _wireSlotTooltips(innerX, slotsY, size, gap, innerW) {
    // Clear previous zones
    if (this._slotZones) {
      this._slotZones.forEach(z => z.destroy());
    }
    this._slotZones = [];
    const makeZone = (x, y, labelFn) => {
      const z = this.add.zone(x, y, size, size).setOrigin(0, 0).setInteractive({ useHandCursor: false });
      z.on('pointerover', (p) => {
        const label = labelFn();
        if (label) this.tooltip.show(label, p.worldX + 12, p.worldY + 12);
      });
      z.on('pointermove', (p) => this.tooltip.move(p.worldX + 12, p.worldY + 12));
      z.on('pointerout', () => this.tooltip.hide());
      this._slotZones.push(z);
    };
    // weapon slots labels
    for (let i = 0; i < 4; i++) {
      const x = innerX + i * (size + gap);
      const y = slotsY;
      makeZone(x, y, () => this._lastWeaponIds?.[i] || null);
    }
    // tome (aux) slots labels (right-aligned like SlotRow)
    for (let i = 0; i < 4; i++) {
      const sx = innerX + innerW - (i + 1) * size - i * gap;
      const sy = slotsY;
      makeZone(sx, sy, () => this._lastAuxIds?.[i] || null);
    }
  }
}


