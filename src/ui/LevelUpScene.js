import { TomeCatalog, tomeUpgradeOptions } from '../items/tomes/Tomes.js';
import { playerState } from '../state/PlayerState.js';

export class LevelUpScene extends Phaser.Scene {
  constructor() { super('LevelUp'); }

  create(data) {
    const { chosenIds = [], maxTomes = 4 } = data || {};
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;
    this.cameras.main.setScroll(0, 0);

    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.6).setOrigin(0, 0);
    const panelW = Math.min(520, w - 40);
    const panelH = 220;
    const x = (w - panelW) / 2;
    const y = (h - panelH) / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x1e1e1e, 0.95);
    panel.fillRoundedRect(x, y, panelW, panelH, 12);
    panel.lineStyle(2, 0x8bc34a, 1);
    panel.strokeRoundedRect(x, y, panelW, panelH, 12);

    this.add.text(w / 2, y + 18, 'Choose a Tome', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

    // Determine available tomes
    const availableTomes = TomeCatalog.filter((t) => !chosenIds.includes(t.id));
    const tomeOpts = (chosenIds.length < maxTomes) ? availableTomes : [];
    const upgOpts = tomeUpgradeOptions(chosenIds);
    const pool = [...tomeOpts, ...upgOpts];
    const items = pool.sort(() => Math.random() - 0.5).slice(0, 3);
    const colW = 150;
    const startX = w / 2 - (items.length * colW + (items.length - 1) * 16) / 2;
    const by = y + 54;

    const makeBtn = (bx, by, label, onClick) => {
      const bw = 150, bh = 40;
      const g = this.add.graphics();
      const draw = (bg = 0x263238, stroke = 0x8bc34a) => {
        g.clear();
        g.fillStyle(bg, 1);
        g.fillRoundedRect(bx, by, bw, bh, 8);
        g.lineStyle(2, stroke, 1);
        g.strokeRoundedRect(bx, by, bw, bh, 8);
      };
      draw();
      const txt = this.add.text(bx + bw / 2, by + bh / 2, label, { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
      const zone = this.add.zone(bx, by, bw, bh).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => draw(0x2e3b43));
      zone.on('pointerout', () => draw());
      zone.on('pointerdown', () => draw(0x1b252b));
      zone.on('pointerup', () => { draw(); onClick?.(); });
    };

    // Tome options
    items.forEach((t, i) => {
      makeBtn(startX + i * (colW + 16), by, t.name, () => {
        t.apply();
        // Only add to tome slots if this is a new tome, not an upgrade
        if (!t.isUpgrade) {
          this.game.events.emit('tome:selected', t.id);
        } else {
          this.game.events.emit('tome:upgraded', t.id);
        }
        this.scene.stop();
        this.scene.resume('PlayScene');
      });
    });

    // Skip button
    makeBtn(w / 2 - 75, y + panelH - 56, 'Skip', () => {
      this.game.events.emit('tome:skipped');
      this.scene.stop();
      this.scene.resume('PlayScene');
    });
  }
}


