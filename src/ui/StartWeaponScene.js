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

    const bw = Math.min(440, panelW - 40);
    const btnH = 78; const btnGap = 12; const cols = 1;
    const bx = Math.floor(w / 2 - bw / 2);
    let by = y + 54;

    const weapons = WeaponCatalog;
    weapons.forEach((meta, i) => {
      const title = meta.name;
      const line2 = '';
      const line3 = '';
      const btn = new PerkButton(this, { x: bx, y: by, width: bw, height: btnH, title, line2, line3, onClick: () => {
        playerState.addWeaponById?.(meta.id);
        this.game.events.emit('weapon:add', meta.id);
        this.scene.stop();
      }});
      by += btnH + btnGap;
    });
  }
}


