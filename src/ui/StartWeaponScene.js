import { WeaponCatalog } from '../items/weapons/WeaponCatalog.js';
import { playerState } from '../state/PlayerState.js';
import { PerkButton } from './components/PerkButton.js';

export class StartWeaponScene extends Phaser.Scene {
  constructor() { super('StartWeapon'); }

  create() {
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;
    this.cameras.main.setScroll(0, 0);

    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.6).setOrigin(0, 0);
    const panelW = Math.min(560, w - 40);
    const panelH = Math.min(460, h - 80);
    const x = Math.floor((w - panelW) / 2);
    const y = Math.floor((h - panelH) / 2);
    const panel = this.add.graphics();
    panel.fillStyle(0x1e1e1e, 0.95);
    panel.fillRect(x, y, panelW, panelH);
    panel.lineStyle(2, 0x42a5f5, 1);
    panel.strokeRect(x, y, panelW, panelH);

    this.add.text(w / 2, y + 18, 'Choose Your Weapon', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

    // Grid layout (4 columns) of square buttons
    const gap = 12;
    const cols = 4;
    const cell = Math.floor((panelW - 40 - gap * (cols - 1)) / cols);
    const startX = x + 20;
    let row = 0, col = 0;

    const weapons = WeaponCatalog;
    weapons.forEach((meta, i) => {
      const cx = startX + col * (cell + gap);
      const cy = y + 54 + row * (cell + gap);
      const title = meta.name;
      const btn = new PerkButton(this, { x: cx, y: cy, width: cell, height: cell, title, line2: '', line3: '', onClick: () => {
        playerState.addWeaponById?.(meta.id);
        this.game.events.emit('weapon:add', meta.id);
        this.scene.stop();
      }});
      col += 1; if (col >= cols) { col = 0; row += 1; }
    });
  }
}


