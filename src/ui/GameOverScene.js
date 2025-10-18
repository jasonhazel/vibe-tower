import { EventBus } from '../state/EventBus.js';
import { playerState } from '../state/PlayerState.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
    this.handlers = [];
  }

  create(data) {
    const { runMs = 0, xpTotal = 0, level = 1 } = data || {};
    const w = this.scale.gameSize.width;
    const h = this.scale.gameSize.height;
    this.cameras.main.setScroll(0, 0);

    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.6).setOrigin(0, 0);

    const panelW = Math.min(360, w - 40);
    const panelH = 200;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x1e1e1e, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panel.lineStyle(2, 0x90caf9, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const title = this.add.text(w / 2, panelY + 20, 'Game Over', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5, 0.5);

    const totalSeconds = Math.floor(runMs / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');

    const stats = [
      `Time: ${mm}:${ss}`,
      `Level: ${level}`,
      `XP: ${xpTotal}`,
      `HP: ${playerState.getHealthCurrent()} / ${playerState.getHealthMax()}`,
    ];
    for (let i = 0; i < stats.length; i++) {
      this.add.text(w / 2, panelY + 60 + i * 22, stats[i], { fontFamily: 'monospace', fontSize: '14px', color: '#e0e0e0' }).setOrigin(0.5, 0.5);
    }

    const hint = this.add.text(w / 2, panelY + panelH - 28, 'Press R to restart', { fontFamily: 'monospace', fontSize: '12px', color: '#b0bec5' }).setOrigin(0.5, 0.5);
    this.input.keyboard.once('keydown-R', () => {
      this.game.events.emit('game:restart');
    });
  }
}


